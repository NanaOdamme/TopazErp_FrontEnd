/**
 * report-viewer.js — Vue 3 (CDN / global build) PDF Report Viewer component.
 *
 * Direct port of BusinessDesk's ReportViewer.client.vue and VoucherPreviewModal.vue
 * for use in Topaz ERP without requiring a build step.
 *
 * Requirements:
 *   - Vue 3 (window.Vue)
 *   - PDF.js (window.pdfjsLib)
 *   - pdfmake (window.pdfMake)
 *   - voucher-report.js (window.TopazReportViewer)
 *
 * Registration:
 *   app.use(ReportViewerPlugin);
 *
 * Components provided:
 *   <report-viewer :report="report" :exporters="exporters"></report-viewer>
 *   <voucher-preview-modal v-if="showModal" :voucher="voucher" @close="showModal = false"></voucher-preview-modal>
 */
(function registerReportViewer(global) {
    'use strict';

    if (!global.Vue) {
        console.warn('report-viewer.js requires Vue 3 on window.Vue before loading.');
        return;
    }

    const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineComponent, shallowRef } = global.Vue;

    /* ──────────────────────────────────────────────────────────────────
       Helper: print a PDF Uint8Array via a hidden iframe
       (Matches BusinessDesk print-report.ts)
    ────────────────────────────────────────────────────────────────── */
    function printReportPdf(bytes, onError) {
        const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/pdf' }));
        const frame = document.createElement('iframe');
        frame.title = 'Report print document';
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;';
        let printTimer, cleanupTimer, closed = false;
        const cleanup = () => {
            if (closed) return;
            closed = true;
            clearTimeout(printTimer); clearTimeout(cleanupTimer);
            window.removeEventListener('afterprint', cleanup);
            frame.remove(); URL.revokeObjectURL(url);
        };
        frame.onload = () => {
            printTimer = setTimeout(() => {
                if (closed) return;
                try {
                    if (!frame.contentWindow) throw new Error('Print window unavailable');
                    frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
                    frame.contentWindow.focus(); frame.contentWindow.print();
                } catch { cleanup(); onError(); }
            }, 500);
        };
        frame.onerror = () => { cleanup(); onError(); };
        window.addEventListener('afterprint', cleanup, { once: true });
        frame.src = url;
        document.body.appendChild(frame);
        cleanupTimer = setTimeout(cleanup, 300000);
        return cleanup;
    }

    /* ──────────────────────────────────────────────────────────────────
       Helper: trigger a file download from a Blob / Uint8Array
    ────────────────────────────────────────────────────────────────── */
    function download(blob, extension, reportId) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportId}.${extension}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
    }

    /* ──────────────────────────────────────────────────────────────────
       ReportViewer Component
       (Matches BusinessDesk ReportViewer.client.vue)
    ────────────────────────────────────────────────────────────────── */
    const ReportViewer = defineComponent({
        name: 'ReportViewer',
        props: {
            report: { type: Object, required: true },
            exporters: { type: Object, default: null },
        },
        setup(props) {
            const colorMode = ref('color');
            let cleanupPrint = null;

            const canvasRef = ref(null);
            const viewportRef = ref(null);

            const page = ref(1);
            const pageInput = ref(1);
            const total = ref(0);
            const zoom = ref('fit');
            const generating = ref(false);
            const rendering = ref(false);
            const exporting = ref('');
            const error = ref('');
            const pageText = ref('');

            let pdfDoc = null;
            let renderTask = null;
            let pdfBytes = null;
            let generation = 0;
            let renderVersion = 0;
            let observer = null;
            let resizeTimer = null;

            const rowsCount = computed(() => {
                if (props.report && Array.isArray(props.report.sections)) {
                    return props.report.sections.reduce((sum, section) => sum + (section.rows ? section.rows.length : 0), 0);
                }
                if (props.report && Array.isArray(props.report.voucherRows)) {
                    return props.report.voucherRows.length;
                }
                return 0;
            });

            async function renderPage() {
                if (!pdfDoc || !canvasRef.value || !viewportRef.value) return;
                const version = ++renderVersion, current = pdfDoc;
                if (renderTask) {
                    try { renderTask.cancel(); } catch (_) {}
                }
                rendering.value = true;
                try {
                    const pdfPage = await current.getPage(page.value);
                    if (version !== renderVersion) return;
                    const original = pdfPage.getViewport({ scale: 1 });
                    const scale = zoom.value === 'fit'
                        ? Math.max(0.2, Math.min(1.5, (viewportRef.value.clientWidth - 32) / original.width))
                        : Number(zoom.value);
                    const view = pdfPage.getViewport({ scale });
                    const ratio = Math.min(window.devicePixelRatio || 1, 2);
                    const el = canvasRef.value;
                    el.width = Math.ceil(view.width * ratio);
                    el.height = Math.ceil(view.height * ratio);
                    el.style.width = `${view.width}px`;
                    el.style.height = `${view.height}px`;

                    const renderContext = {
                        canvasContext: el.getContext('2d'),
                        viewport: view,
                        transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0]
                    };
                    renderTask = pdfPage.render(renderContext);
                    await renderTask.promise;
                    const text = await pdfPage.getTextContent();
                    if (version === renderVersion) {
                        pageText.value = text.items.map(item => item.str || '').join(' ');
                    }
                } catch (e) {
                    if (version === renderVersion && e?.name !== 'RenderingCancelledException') {
                        error.value = 'Could not render this page. Please regenerate the report.';
                    }
                } finally {
                    if (version === renderVersion) rendering.value = false;
                }
            }

            async function generate() {
                const version = ++generation;
                ++renderVersion;
                if (renderTask) {
                    try { renderTask.cancel(); } catch (_) {}
                }
                const prev = pdfDoc;
                pdfDoc = null;
                if (prev) {
                    try { prev.destroy(); } catch (_) {}
                }
                pdfBytes = null;
                total.value = 0;
                pageText.value = '';
                generating.value = true;
                error.value = '';

                try {
                    let bytes;
                    if (props.exporters && typeof props.exporters.pdf === 'function') {
                        bytes = await props.exporters.pdf();
                    } else if (window.TopazReportViewer) {
                        bytes = props.report.voucherRows
                            ? await window.TopazReportViewer.createVoucherPdf(props.report)
                            : await window.TopazReportViewer.createReportPdf(props.report, colorMode.value);
                    } else {
                        throw new Error('No PDF generator available.');
                    }
                    if (version !== generation) return;

                    const pdfjs = window.pdfjsLib;
                    if (!pdfjs) throw new Error('PDF.js (pdfjsLib) is not loaded.');

                    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }

                    const result = await pdfjs.getDocument({ data: bytes.slice() }).promise;
                    if (version !== generation) {
                        try { await result.destroy(); } catch (_) {}
                        return;
                    }
                    pdfBytes = bytes;
                    pdfDoc = result;
                    total.value = result.numPages;
                    page.value = 1;
                    pageInput.value = 1;
                    await nextTick();
                    await renderPage();
                } catch (e) {
                    if (version === generation) {
                        error.value = e?.message || 'Unable to generate the report. Retry or narrow the report filters.';
                    }
                } finally {
                    if (version === generation) generating.value = false;
                }
            }

            function navigate(val) {
                if (!Number.isFinite(val)) return;
                page.value = Math.max(1, Math.min(total.value, Math.trunc(val)));
                pageInput.value = page.value;
            }

            async function exportReport(format) {
                if (generating.value || exporting.value || !pdfBytes) return;
                exporting.value = format;
                error.value = '';
                const report = props.report;
                const mode = colorMode.value;

                try {
                    let blob;
                    if (format === 'pdf') {
                        blob = new Blob([pdfBytes.slice().buffer], { type: 'application/pdf' });
                    } else if (props.exporters && typeof props.exporters[format] === 'function') {
                        blob = await props.exporters[format]();
                    } else if (format === 'xlsx' && window.TopazReportViewer) {
                        blob = await window.TopazReportViewer.createReportExcel(report, mode);
                    } else if (format === 'docx' && window.TopazReportViewer && typeof window.TopazReportViewer.createVoucherWord === 'function') {
                        blob = await window.TopazReportViewer.createVoucherWord(report);
                    } else {
                        throw new Error(`Export format ${format} is not supported.`);
                    }
                    download(blob, format, report.id || 'report');
                } catch (e) {
                    error.value = e?.message || 'Export failed. Please try again.';
                } finally {
                    exporting.value = '';
                }
            }

            function printReport() {
                if (generating.value || exporting.value || !pdfBytes) return;
                if (cleanupPrint) { cleanupPrint(); cleanupPrint = null; }
                error.value = '';
                cleanupPrint = printReportPdf(pdfBytes, () => {
                    error.value = 'Printing could not start. Export PDF and print it from your PDF reader.';
                });
            }

            watch([() => props.report, colorMode], generate);
            watch([page, zoom], () => { pageText.value = ''; void renderPage(); });

            onMounted(() => {
                void generate();
                observer = new ResizeObserver(() => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        if (zoom.value === 'fit') void renderPage();
                    }, 120);
                });
                if (viewportRef.value) observer.observe(viewportRef.value);
            });

            onBeforeUnmount(() => {
                if (cleanupPrint) cleanupPrint();
                generation++;
                renderVersion++;
                if (observer) observer.disconnect();
                clearTimeout(resizeTimer);
                if (renderTask) { try { renderTask.cancel(); } catch (_) {} }
                if (pdfDoc) { try { pdfDoc.destroy(); } catch (_) {} }
            });

            return {
                colorMode, canvasRef, viewportRef,
                page, pageInput, total, zoom,
                generating, rendering, exporting, error, pageText,
                rowsCount, generate, navigate, exportReport, printReport
            };
        },

        template: `
<section aria-label="Report viewer" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3.5 bg-white">
    <div>
      <h2 class="text-sm font-semibold text-gray-800">{{ report.title }}</h2>
      <p class="mt-0.5 text-xs text-gray-500">
        {{ exporters ? 'Saved voucher preview' : ('Embedded standard report · ' + rowsCount.toLocaleString() + ' records') }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <label v-if="!exporters" class="text-xs font-semibold text-gray-700">
        Report appearance
        <select v-model="colorMode" :disabled="!!exporting" class="ml-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
          <option value="color">Color</option>
          <option value="monochrome">Black &amp; white</option>
        </select>
      </label>
      <button type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40 transition shadow-sm"
              :disabled="generating || !total || !!exporting"
              @click="printReport">
        <i class="bi bi-printer"></i>
        <span>Print Report</span>
      </button>
      <button type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 transition shadow-sm"
              :disabled="generating || !total || !!exporting"
              @click="exportReport('pdf')">
        <i class="bi bi-file-earmark-pdf text-red-500"></i>
        <span>{{ exporting === 'pdf' ? 'Exporting…' : 'Export PDF' }}</span>
      </button>
      <button type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 transition shadow-sm"
              :disabled="generating || !total || !!exporting"
              @click="exportReport('xlsx')">
        <i class="bi bi-file-earmark-excel text-emerald-600"></i>
        <span>{{ exporting === 'xlsx' ? 'Exporting…' : 'Export Excel' }}</span>
      </button>
      <button type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 transition shadow-sm"
              :disabled="generating || !total || !!exporting"
              @click="exportReport('docx')">
        <i class="bi bi-file-earmark-word text-blue-600"></i>
        <span>{{ exporting === 'docx' ? 'Exporting…' : 'Export Word' }}</span>
      </button>
    </div>
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/70 px-5 py-2.5">
    <div class="flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
      <button aria-label="First page" :disabled="generating || page <= 1"
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition shadow-sm"
              @click="navigate(1)">
        <i class="bi bi-chevron-double-left text-[11px]"></i>
      </button>
      <button aria-label="Previous page" :disabled="generating || page <= 1"
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition shadow-sm"
              @click="navigate(page - 1)">
        <i class="bi bi-chevron-left text-[11px]"></i>
      </button>
      <label class="flex items-center gap-1.5 mx-1 font-medium text-gray-600">
        Page
        <input v-model.number="pageInput" aria-label="Report page number" type="number" min="1" :max="total || 1"
               :disabled="generating || !total"
               class="w-12 rounded-lg border border-gray-300 bg-white px-2 py-1 text-center text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
               @change="navigate(Number(pageInput))" @keydown.enter.prevent="navigate(Number(pageInput))" />
        <span class="text-gray-500 font-normal">of {{ total }}</span>
      </label>
      <button aria-label="Next page" :disabled="generating || page >= total"
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition shadow-sm"
              @click="navigate(page + 1)">
        <i class="bi bi-chevron-right text-[11px]"></i>
      </button>
      <button aria-label="Last page" :disabled="generating || page >= total"
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition shadow-sm"
              @click="navigate(total)">
        <i class="bi bi-chevron-double-right text-[11px]"></i>
      </button>
    </div>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-1.5 text-xs font-medium text-gray-600">
        <i class="bi bi-zoom-in text-gray-400"></i> Zoom
        <select v-model="zoom" class="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
          <option value="fit">Fit width</option>
          <option value="0.75">75%</option>
          <option value="1">100%</option>
          <option value="1.25">125%</option>
          <option value="1.5">150%</option>
        </select>
      </label>
    </div>
  </div>

  <p v-if="error" role="alert" class="m-4 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
    <i class="bi bi-exclamation-triangle-fill mr-1.5 text-red-500"></i> {{ error }}
    <button class="font-semibold underline ml-2 hover:text-red-900" @click="generate">Retry</button>
  </p>
  <div v-if="generating" role="status" class="py-16 text-center text-sm text-gray-500">
    <i class="bi bi-arrow-repeat animate-spin text-2xl text-blue-600 block mb-2"></i>
    Preparing paginated report…
  </div>

  <div ref="viewportRef" class="max-h-[72vh] min-h-48 overflow-auto bg-slate-100/90 p-4 sm:p-6" :aria-busy="generating || rendering">
    <canvas v-show="total && !generating" ref="canvasRef" aria-hidden="true" class="mx-auto bg-white shadow-md rounded-sm border border-gray-200"></canvas>
    <div class="sr-only" role="document" :aria-label="'Report page ' + page + ' of ' + total">{{ pageText }}</div>
  </div>
  <p class="p-2 text-xs text-slate-500"></p>
</section>`
    });

    /* ──────────────────────────────────────────────────────────────────
       VoucherPreviewModal Component
       (Matches BusinessDesk VoucherPreviewModal.vue)
    ────────────────────────────────────────────────────────────────── */
    const VoucherPreviewModal = defineComponent({
        name: 'VoucherPreviewModal',
        props: {
            voucher: { type: Object, required: true },
        },
        emits: ['close'],
        setup(props, { emit }) {
            const dialog = ref(null);
            const closeButton = ref(null);
            const report = shallowRef(null);
            const error = ref('');
            const loading = ref(true);
            let disposed = false;
            let onCleanup = null;

            const exporters = {
                pdf: async () => window.TopazReportViewer.createVoucherPdf(report.value),
                xlsx: async () => window.TopazReportViewer.createVoucherExcel(report.value),
                docx: async () => { throw new Error('Word export is not supported.'); }
            };

            function onKeydown(event) {
                if (event.key === 'Escape') { event.preventDefault(); emit('close'); return; }
                if (event.key !== 'Tab' || !dialog.value) return;
                const elements = [...dialog.value.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]')].filter(el => el.offsetParent !== null);
                if (!elements.length) { event.preventDefault(); return; }
                const first = elements[0], last = elements[elements.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }

            onMounted(async () => {
                closeButton.value?.focus();
                const oldOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                onCleanup = () => { document.body.style.overflow = oldOverflow; };

                let companyProfile = null;
                let companyName = '';
                try {
                    const profileRes = await (window.axios ? window.axios.get('/GeneralLedger/GetBusinessProfile') : fetch('/GeneralLedger/GetBusinessProfile').then(r => r.json()));
                    companyProfile = profileRes.data?.result || profileRes?.result || null;
                    companyName = companyProfile?.businessName || companyProfile?.companyName || '';
                } catch (_) {}

                if (disposed) return;
                try {
                    const voucherData = props.voucher;
                    const summary = {
                        gross: voucherData.grossAmount,
                        net: voucherData.netAmount,
                        retained: voucherData.totalRetained,
                        incomeWithholding: voucherData.totalWithheld,
                        vatWithholding: voucherData.totalVatWithheld,
                        nhil: (voucherData.hasNationalHealthInsuranceLevy && voucherData.nationalHealthInsuranceLevyRate) ? ((voucherData.grossAmount * voucherData.nationalHealthInsuranceLevyRate) / 100).toFixed(2) : '0.00',
                        getfund: (voucherData.hasGetFundLevy && voucherData.getFundLevyRate) ? ((voucherData.grossAmount * voucherData.getFundLevyRate) / 100).toFixed(2) : '0.00',
                        vat: (voucherData.hasVat && voucherData.vatRate) ? ((voucherData.grossAmount * voucherData.vatRate) / 100).toFixed(2) : '0.00',
                        cst: (voucherData.hasCommunicationServiceTax && voucherData.communicationServiceTaxRate) ? ((voucherData.grossAmount * voucherData.communicationServiceTaxRate) / 100).toFixed(2) : '0.00',
                        covid: (voucherData.hasCovidTax && voucherData.covidTaxRate) ? ((voucherData.grossAmount * voucherData.covidTaxRate) / 100).toFixed(2) : '0.00',
                    };
                    report.value = window.TopazReportViewer.buildVoucherReport(voucherData, summary, companyProfile || companyName);
                } catch (e) {
                    error.value = 'The voucher was saved, but its preview could not be prepared. Return to the voucher register and review the saved record.';
                } finally {
                    loading.value = false;
                }
            });

            onBeforeUnmount(() => {
                disposed = true;
                if (onCleanup) onCleanup();
            });

            const voucherNumber = computed(() => props.voucher?.voucherNumber || props.voucher?.batchNo || props.voucher?.id || '');

            return { dialog, closeButton, report, error, loading, exporters, voucherNumber, onKeydown, emit };
        },

        template: `
<teleport to="body">
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-6" @keydown="onKeydown">
    <section ref="dialog" role="dialog" aria-modal="true" aria-labelledby="voucher-preview-title" class="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
      <header class="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-1 ring-inset ring-blue-100 flex-shrink-0">
            <i class="bi bi-file-earmark-text text-lg"></i>
          </div>
          <div>
            <h3 id="voucher-preview-title" class="text-base font-semibold text-gray-800">Voucher Preview</h3>
            <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span>Voucher saved</span>
              <span class="text-gray-300">&middot;</span>
              <span class="inline-flex items-center font-mono font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                {{ voucherNumber }}
              </span>
            </p>
          </div>
        </div>
        <button ref="closeButton" type="button" aria-label="Close voucher preview" class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition duration-150" @click="emit('close')">
          <i class="bi bi-x-lg text-sm"></i>
        </button>
      </header>
      <div class="min-h-0 flex-1 overflow-auto p-4 sm:p-6 bg-gray-50/70">
        <div v-if="loading" role="status" class="py-20 text-center text-sm text-gray-500">
          <div class="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <i class="bi bi-arrow-repeat animate-spin text-2xl"></i>
          </div>
          <p class="font-medium text-gray-700">Preparing voucher preview…</p>
          <p class="text-xs text-gray-400 mt-1">Generating printable layout and document pages</p>
        </div>
        <div v-else-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <div class="flex items-start gap-3">
            <i class="bi bi-exclamation-triangle-fill text-red-500 text-lg flex-shrink-0 mt-0.5"></i>
            <div class="flex-1">
              <p class="font-semibold text-red-800">Unable to load voucher preview</p>
              <p class="mt-0.5 text-red-700 text-xs">{{ error }}</p>
            </div>
          </div>
        </div>
        <ReportViewer v-else-if="report" :report="report" :exporters="exporters" />
      </div>
      <footer class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-6 py-3.5 bg-gray-50">
        <button type="button" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition" @click="emit('close')">
          <i class="bi bi-x-lg text-xs"></i> Close
        </button>
        <div class="w-full sm:w-auto flex items-center justify-end gap-2">
          <button type="button" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition" @click="emit('close')">
            <i class="bi bi-arrow-left"></i> Back to Vouchers
          </button>
        </div>
      </footer>
    </section>
  </div>
</teleport>`
    });

    // ── Plugin registration ────────────────────────────────────────────────
    const ReportViewerPlugin = {
        install(app) {
            app.component('ReportViewer', ReportViewer);
            app.component('report-viewer', ReportViewer);
            app.component('VoucherPreviewModal', VoucherPreviewModal);
            app.component('voucher-preview-modal', VoucherPreviewModal);
        }
    };

    global.ReportViewer = ReportViewer;
    global.VoucherPreviewModal = VoucherPreviewModal;
    global.ReportViewerPlugin = ReportViewerPlugin;

    // Auto-register on Vue.createApp so all Vue apps in Topaz ERP automatically have <report-viewer>
    if (global.Vue && typeof global.Vue.createApp === 'function') {
        const origCreateApp = global.Vue.createApp;
        global.Vue.createApp = function (...args) {
            const app = origCreateApp.apply(this, args);
            try { app.use(ReportViewerPlugin); } catch (_) {}
            return app;
        };
    }

})(globalThis);

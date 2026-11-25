/* ============================================================================
   PdfViewer — Vue 3 component (global build, no build step needed)
   ----------------------------------------------------------------------------
   A raw HTML -> PDF viewer plugin. Point it at an HTML template FILE, pass
   placeholder data, and it renders paginated A4 pages with zoom, single/all
   page views, a color / black-and-white graphics toggle, and Print.

   USAGE IN YOUR CSHTML / VUE APP
   ------------------------------
   1. Include the scripts (after Vue):
        <script src="vue.global.prod.js"></script>
        <script src="PdfViewer.js"></script>

   2. Register it:
        app.component('PdfViewer', PdfViewer);

   3. Declare template paths + accent color in your Vue data:
        data() {
          return {
            receiptTemplate: '/reports/receipt.html',
            customerTemplate: '/reports/paymentByCustomer.html',
            viewerColor: 'blue',   // blue|indigo|violet|red|orange|amber|green|teal|slate (or hex)
            receiptData: { ... },  // {{placeholder}} values
          };
        }
      then in the view:
        <pdf-viewer :src="receiptTemplate" :data="receiptData"
                    :color="viewerColor" title="Official Receipt"></pdf-viewer>

   DARK MODE
   ---------
   No theme prop needed — the viewer follows your app's dark mode
   automatically: when a parent element (usually <html>) has the .dark
   class, the viewer switches to its dark palette.

   TEMPLATE FILES
   --------------
   - Plain .html files with an inline <style> block (or <link> to a CSS file).
   - Each top-level <section> or element with class "pdf-page" starts a new
     page. Anything else at the top level is treated as one continuous
     document. Content taller than a page flows onto the next page
     automatically, starting from the space left on the current page
     (tables split by row with <thead> repeated; nested wrappers are split
     too, so the table does not have to be a direct child).
   - Use {{Placeholders}} for values; {{PageNumber}} / {{PageBreakCount}}
     are filled in automatically per page.

   FIXED HEADER / FOOTER
   ---------------------
   Every <header> and <footer> tag (also .pdf-header / .pdf-repeat /
   .pdf-footer) is lifted out of the content and repeated on EVERY page:
   headers pinned to the top, footers pinned to the bottom. It does not
   matter where they sit in the template — at the top level of the file,
   directly inside a <section>, or nested in wrapper divs. Any
   position:fixed/absolute you gave them is neutralised; the viewer does
   the positioning. Add class "pdf-flow" to a header/footer that should
   stay in the normal content instead.

   PAGINATION HELPERS (optional classes)
   -------------------------------------
     pdf-break   an empty element with this class forces a new page
                 (CSS break-before / break-after: page is honoured too)
     pdf-keep    never split this element across pages

   PROPS
   -----
     src    (String, required)  URL of the HTML template file
     data   (Object)            placeholder values
     color  (String)            accent color name or hex, default 'blue'
     title  (String)            toolbar title (defaults to the file name)
     paper  (String)            initial paper size: A3|A4|A5|Letter|Legal (default 'A4')
     orientation (String)       initial orientation: portrait|landscape (default 'portrait')
   The user can change both from the toolbar; the document is re-paginated
   for the new sheet and Print uses the same size/orientation.

     fileName (String)          export file name without extension (defaults to the title)

   EXPORT (toolbar "Export" menu)
   ------------------------------
     PDF file  a real .pdf in the selected paper size/orientation. Each page
               is rendered by the browser and embedded as an image, so it
               looks exactly like the preview but its text is not selectable
               (use Print -> "Save as PDF" when you need selectable text).
     Excel     a real .xlsx: every <table> of the report becomes a sheet,
               whole table (not split by page), header rows bold, numbers as
               numbers. Sheet name = data-sheet attribute or <caption>.
               Tables inside header/footer, or marked data-no-export, are
               skipped. A template without tables exports the raw data.
     JSON      the object/array passed in :data.
   Nothing is loaded from the network — no extra libraries needed.
   Programmatic use (via a ref): viewer.exportAs('pdf' | 'excel' | 'json')

   EVENTS: loaded (page count), error (message),
           paper-change ({ paper, orientation }),
           exported ({ type, filename })
   ============================================================================ */
(function () {
    'use strict';

    /* Paper sizes in mm (portrait). Add more here and they show up in the toolbar. */
    const PAPERS = {
        A3:     { label: 'A3',     w: 297,   h: 420 },
        A4:     { label: 'A4',     w: 210,   h: 297 },
        A5:     { label: 'A5',     w: 148,   h: 210 },
        Letter: { label: 'Letter', w: 215.9, h: 279.4 },
        Legal:  { label: 'Legal',  w: 215.9, h: 355.6 },
    };
    const MM = 96 / 25.4;  // CSS px per mm
    const SAFE_H = 4;      // pagination safety margin (print page is a hair shorter)

    const HEAD_SEL  = 'header:not(.pdf-flow), .pdf-header, .pdf-repeat';
    const FOOT_SEL  = 'footer:not(.pdf-flow), .pdf-footer';
    const FIXED_SEL = HEAD_SEL + ', ' + FOOT_SEL;
    const PAGE_SEL  = 'section, .pdf-page';
    const BREAK_SEL = '.pdf-break, .page-break';
    const KEEP_SEL  = '.pdf-keep, tr, thead, tfoot, svg, picture, figure, video, canvas, p, h1, h2, h3, h4, h5, h6';
    const MEDIA_SEL = 'img, svg, canvas, video, table, hr, iframe, input, textarea, select';
    const SKIP_TAGS = /^(STYLE|SCRIPT|LINK|META|TITLE|BASE|TEMPLATE|NOSCRIPT)$/;
    const BREAK_VAL = /^(page|always|left|right|recto|verso)$/;
    const SPLIT_DISPLAY = /^(block|flow-root|table|table-row-group|list-item)$/;

    const ACCENTS = {
        blue: '#2563eb', indigo: '#4f46e5', violet: '#7c3aed', purple: '#9333ea',
        red: '#dc2626', orange: '#ea580c', amber: '#d97706', green: '#16a34a',
        teal: '#0d9488', slate: '#475569',
    };

    /* Page rules — shared by the on-screen viewer AND the print frame.
       The !important guards stop template CSS (e.g. rules written for
       body/html, which are re-targeted at the page box) from resizing or
       shifting the sheet. */
    const PAGE_STYLES = `
  .pdfv-page{width:var(--pdfv-pw,794px) !important;height:var(--pdfv-ph,1123px) !important;min-height:0 !important;max-height:none !important;
    margin:0 !important;box-sizing:border-box !important;display:block !important;position:relative !important;overflow:hidden !important;
    background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:400;font-style:normal;
    line-height:normal;letter-spacing:normal;text-align:left;white-space:normal;
    box-shadow:0 4px 24px rgba(0,0,0,.28);transform-origin:top left;}
  /* Each page = [shell wrappers] > sheet(flex column) > header(s) | body | footer(s).
     The body takes all the remaining height, which pins the footer to the bottom. */
  .pdfv-page .pdfv-shell,.pdfv-page .pdfv-sheet{height:100% !important;min-height:0 !important;max-height:none !important;
    margin-top:0 !important;margin-bottom:0 !important;box-sizing:border-box !important;overflow:hidden !important;
    position:relative !important;float:none !important;}
  .pdfv-page .pdfv-sheet{display:flex !important;flex-direction:column !important;flex-wrap:nowrap !important;
    justify-content:flex-start !important;align-items:stretch !important;}
  .pdfv-page .pdfv-sheet > .pdfv-body{flex:1 1 0% !important;min-height:0 !important;overflow:hidden !important;
    display:block !important;margin:0 !important;padding:0 !important;border:0 !important;}
  .pdfv-page .pdfv-sheet > .pdfv-fixed{flex:0 0 auto !important;position:relative !important;
    top:auto !important;bottom:auto !important;left:auto !important;right:auto !important;
    max-width:100% !important;box-sizing:border-box !important;float:none !important;}`;

    /* Viewer chrome: CSS-variable theming (dark mode via the app's .dark class). */
    const STYLES = `
  .pdfv{--pdfv-accent:#2563eb;--pdfv-bg:#e5e7eb;--pdfv-surface:#ffffff;--pdfv-text:#1f2937;--pdfv-muted:#6b7280;--pdfv-border:#d1d5db;
    display:flex;flex-direction:column;height:100%;min-height:0;border-radius:10px;overflow:hidden;
    border:1px solid var(--pdfv-border);background:var(--pdfv-bg);color:var(--pdfv-text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  .dark .pdfv{--pdfv-bg:#0f172a;--pdfv-surface:#1e293b;--pdfv-text:#e2e8f0;--pdfv-muted:#94a3b8;--pdfv-border:#334155;}
  .pdfv-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--pdfv-surface);border-bottom:1px solid var(--pdfv-border);padding:8px 12px;}
  .pdfv-toolbar .grow{flex:1;}
  .pdfv-group{display:flex;align-items:center;gap:4px;min-width:0;}
  .pdfv-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;}
  .pdfv-badge{font-size:11px;background:var(--pdfv-bg);border:1px solid var(--pdfv-border);border-radius:999px;padding:2px 8px;color:var(--pdfv-muted);white-space:nowrap;}
  .pdfv-btn{display:inline-flex;align-items:center;gap:6px;background:var(--pdfv-surface);color:var(--pdfv-text);
    border:1px solid var(--pdfv-border);border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer;line-height:1;}
  .pdfv-btn:hover:not(:disabled){border-color:var(--pdfv-accent);color:var(--pdfv-accent);}
  .pdfv-btn:disabled{opacity:.45;cursor:default;}
  .pdfv-btn-active{border-color:var(--pdfv-accent) !important;color:var(--pdfv-accent) !important;}
  .pdfv-btn-accent{background:var(--pdfv-accent);border-color:var(--pdfv-accent);color:#fff;font-weight:600;}
  .pdfv-btn-accent:hover:not(:disabled){color:#fff;filter:brightness(1.12);}
  .pdfv-ind{font-size:13px;min-width:56px;text-align:center;color:var(--pdfv-muted);}
  .pdfv-select{background:var(--pdfv-surface);color:var(--pdfv-text);border:1px solid var(--pdfv-border);border-radius:8px;padding:5px 6px;font-size:13px;cursor:pointer;}
  .pdfv-pages{flex:1;min-height:0;overflow:auto;padding:24px 16px 48px;display:flex;flex-direction:column;align-items:center;gap:26px;}
  .pdfv-scaler{margin:0 auto;position:relative;flex:0 0 auto;}
  .pdfv-page-label{text-align:center;font-size:12px;color:var(--pdfv-muted);margin-top:8px;}
  .pdfv.bw .pdfv-page{filter:grayscale(1);}
  .pdfv-menu-wrap{position:relative;}
  .pdfv-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:190px;background:var(--pdfv-surface);
    border:1px solid var(--pdfv-border);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.22);padding:4px;}
  .pdfv-menu button{display:flex;align-items:center;gap:8px;width:100%;background:none;border:0;border-radius:7px;
    padding:8px 10px;font-size:13px;color:var(--pdfv-text);cursor:pointer;text-align:left;}
  .pdfv-menu button:hover{background:var(--pdfv-bg);color:var(--pdfv-accent);}
  .pdfv-menu small{margin-left:auto;color:var(--pdfv-muted);font-size:11px;}
  .pdfv-state{display:flex;align-items:center;gap:10px;background:var(--pdfv-surface);border:1px solid var(--pdfv-border);
    border-radius:10px;padding:16px 22px;font-size:14px;color:var(--pdfv-muted);}
  .pdfv-state.error{color:#dc2626;border-color:#dc2626;}
  .pdfv-spin{display:inline-block;animation:pdfv-spin 1s linear infinite;}
  @keyframes pdfv-spin{to{transform:rotate(360deg);}}
  ` + PAGE_STYLES;

    /* Print frame overrides. Printing happens in an isolated iframe that holds
       ONLY the pages, so nothing in the host layout can add a blank sheet. */
    const printStyles = (wmm, hmm) => `
  @page{size:${wmm}mm ${hmm}mm;margin:0;}
  html,body{margin:0 !important;padding:0 !important;border:0 !important;background:#fff !important;
    width:auto !important;height:auto !important;min-height:0 !important;display:block !important;
    position:static !important;overflow:visible !important;transform:none !important;}
  .pdfv-page{width:${wmm}mm !important;height:${hmm - 0.5}mm !important;box-shadow:none !important;transform:none !important;
    break-after:page !important;page-break-after:always !important;break-inside:avoid !important;page-break-inside:avoid !important;
    break-before:auto !important;page-break-before:auto !important;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .pdfv-page:last-child{break-after:auto !important;page-break-after:auto !important;}
  /* pagination is already done — template break rules must not fire again */
  .pdfv-page *{break-before:auto !important;break-after:auto !important;page-break-before:auto !important;page-break-after:auto !important;}
  body.pdfv-bw .pdfv-page{filter:grayscale(1);}`;

    /* ---------- export helpers (dependency-free) ---------- */

    const utf8 = (str) => new TextEncoder().encode(str);
    const escXml = (v) => String(v)
        .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
    };

    let CRC_TABLE = null;
    const crc32 = (bytes) => {
        if (!CRC_TABLE) {
            CRC_TABLE = new Uint32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                CRC_TABLE[n] = c >>> 0;
            }
        }
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    };

    /* Minimal ZIP writer (stored, no compression) — enough for a valid .xlsx */
    const zipStore = (files) => {
        const parts = [], central = [];
        let offset = 0;
        files.forEach((f) => {
            const name = utf8(f.name), data = utf8(f.text), crc = crc32(data);
            const local = new DataView(new ArrayBuffer(30));
            local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
            local.setUint16(8, 0, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true);
            local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
            local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
            parts.push(new Uint8Array(local.buffer), name, data);

            const cen = new DataView(new ArrayBuffer(46));
            cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
            cen.setUint16(10, 0, true); cen.setUint16(12, 0, true); cen.setUint16(14, 0x21, true);
            cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true);
            cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true);
            central.push(new Uint8Array(cen.buffer), name);
            offset += 30 + name.length + data.length;
        });
        const cenSize = central.reduce((n, p) => n + p.length, 0);
        const end = new DataView(new ArrayBuffer(22));
        end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
        end.setUint32(12, cenSize, true); end.setUint32(16, offset, true);
        return new Blob([...parts, ...central, new Uint8Array(end.buffer)],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    };

    const colName = (i) => {
        let s = '';
        for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
        return s;
    };

    /* "1,250.50" / "-40" -> number; codes like "00123" or long ids stay text */
    const toNumber = (text) => {
        const t = text.trim();
        if (!/^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/.test(t)) return null;
        const plain = t.replace(/,/g, '');
        const digits = plain.replace(/[-.]/g, '');
        if (digits.length > 15 || /^-?0\d/.test(plain)) return null;
        return Number(plain);
    };

    /* sheets: [{ name, rows: [[{ v, bold }]] }] -> .xlsx Blob */
    const buildXlsx = (sheets) => {
        const used = {};
        sheets.forEach((sh, i) => {
            let n = String(sh.name || '').replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31) || ('Sheet' + (i + 1));
            let base = n, k = 2;
            while (used[n.toLowerCase()]) { const suf = ' (' + (k++) + ')'; n = base.slice(0, 31 - suf.length) + suf; }
            used[n.toLowerCase()] = true;
            sh.name = n;
        });

        const sheetXml = (sh) => {
            const widths = [];
            const rowsXml = sh.rows.map((row, r) => {
                const cells = row.map((cell, c) => {
                    if (!cell || cell.v == null || cell.v === '') return '';
                    const ref = colName(c) + (r + 1), st = cell.bold ? ' s="1"' : '';
                    const text = String(cell.v);
                    widths[c] = Math.max(widths[c] || 0, Math.min(60, text.length));
                    const num = typeof cell.v === 'number' ? cell.v : (cell.bold ? null : toNumber(text));
                    if (num != null && isFinite(num)) return '<c r="' + ref + '"' + st + '><v>' + num + '</v></c>';
                    return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + escXml(text) + '</t></is></c>';
                }).join('');
                return '<row r="' + (r + 1) + '">' + cells + '</row>';
            }).join('');
            let cols = '';
            for (let c = 0; c < widths.length; c++) {
                cols += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + (Math.max(8, widths[c] || 0) + 2) + '" customWidth="1"/>';
            }
            return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
                (cols ? '<cols>' + cols + '</cols>' : '') + '<sheetData>' + rowsXml + '</sheetData></worksheet>';
        };

        const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const files = [
            { name: '[Content_Types].xml', text: X +
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                    '<Default Extension="xml" ContentType="application/xml"/>' +
                    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
                    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
                    sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
                    '</Types>' },
            { name: '_rels/.rels', text: X +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
                    '</Relationships>' },
            { name: 'xl/workbook.xml', text: X +
                    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
                    sheets.map((sh, i) => '<sheet name="' + escXml(sh.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') +
                    '</sheets></workbook>' },
            { name: 'xl/_rels/workbook.xml.rels', text: X +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
                    '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
                    '</Relationships>' },
            { name: 'xl/styles.xml', text: X +
                    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
                    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
                    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
                    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
                    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
                    '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
                    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
                    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
                    '</styleSheet>' },
        ];
        sheets.forEach((sh, i) => files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', text: sheetXml(sh) }));
        return zipStore(files);
    };

    /* pages: [{ jpeg: Uint8Array, w, h (pixels) }], size in mm -> PDF Blob (one image per page) */
    const buildPdf = (pages, wmm, hmm) => {
        const W = +(wmm * 72 / 25.4).toFixed(2), H = +(hmm * 72 / 25.4).toFixed(2);
        const chunks = [], offsets = [];
        let pos = 0;
        const push = (d) => { const b = typeof d === 'string' ? utf8(d) : d; chunks.push(b); pos += b.length; };
        const obj = (n, body) => { offsets[n] = pos; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };

        push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
        const kids = pages.map((_, i) => (3 + i * 3) + ' 0 R').join(' ');
        obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
        obj(2, () => push('<< /Type /Pages /Count ' + pages.length + ' /Kids [' + kids + '] >>'));
        pages.forEach((pg, i) => {
            const p = 3 + i * 3, c = p + 1, im = p + 2;
            const content = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q';
            obj(p, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + c + ' 0 R >>'));
            obj(c, () => push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'));
            obj(im, () => {
                push('<< /Type /XObject /Subtype /Image /Width ' + pg.w + ' /Height ' + pg.h +
                    ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + pg.jpeg.length + ' >>\nstream\n');
                push(pg.jpeg);
                push('\nendstream');
            });
        });
        const total = 3 + pages.length * 3;
        const xref = pos;
        let table = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
        for (let n = 1; n < total; n++) table += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
        push(table + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
        return new Blob(chunks, { type: 'application/pdf' });
    };

    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

    const PdfViewer = {
        name: 'PdfViewer',

        props: {
            src:   { type: String, required: true },
            data:  { type: Object, default: () => ({}) },
            color: { type: String, default: 'blue' },  // accent name or hex
            title: { type: String, default: '' },
            fileName: { type: String, default: '' },  // export file name (no extension); defaults to the title
            paper:       { type: String, default: 'A4' },        // initial paper size: A3|A4|A5|Letter|Legal
            orientation: { type: String, default: 'portrait' },  // initial orientation: portrait|landscape
        },

        emits: ['loaded', 'error', 'paper-change', 'exported'],

        data() {
            return {
                pages: [],
                loading: false,
                error: '',
                zoom: 1,
                zoomMode: 'fit',
                currentPage: 1,
                viewMode: 'single',          // 'single' | 'all'
                showGraphics: true,          // false -> black & white pages
                paperSize: PAPERS[this.paper] ? this.paper : 'A4',
                landscape: this.orientation === 'landscape',
                paperOptions: Object.keys(PAPERS).map((k) => ({ value: k, label: PAPERS[k].label })),
                exportOpen: false,
                exporting: '',               // progress text while a PDF is being built
                renderSeq: 0,
                containerW: 0,               // width of the pages area (for "fit" zoom)
                templateCache: {},
                cssCache: {},
            };
        },

        computed: {
            /* paper size in mm / px, orientation applied */
            paperMm() {
                const p = PAPERS[this.paperSize] || PAPERS.A4;
                return this.landscape ? { w: p.h, h: p.w } : { w: p.w, h: p.h };
            },
            pageW() { return Math.round(this.paperMm.w * MM); },
            pageH() { return Math.round(this.paperMm.h * MM); },
            rootStyle() {
                return { '--pdfv-accent': this.accentColor, '--pdfv-pw': this.pageW + 'px', '--pdfv-ph': this.pageH + 'px' };
            },

            accentColor() { return ACCENTS[this.color] || this.color || ACCENTS.blue; },

            displayTitle() {
                if (this.title) return this.title;
                return (this.src || '').split('/').pop().replace(/\.html?$/i, '') || 'Document';
            },

            effectiveZoom() {
                if (this.zoomMode !== 'fit') return this.zoom;
                if (!this.containerW) return this.zoom;
                return Math.min(1.5, Math.max(0.3, (this.containerW - 40) / this.pageW));
            },

            zoomLabel() { return Math.round(this.effectiveZoom * 100) + '%'; },
        },

        watch: {
            src() { this.render(); },
            data: { handler() { this.render(); }, deep: true },
            paper(v) { if (PAPERS[v]) this.paperSize = v; },
            orientation(v) { this.landscape = v === 'landscape'; },
            paperSize() { this.onPaperChange(); },
            landscape() { this.onPaperChange(); },
        },

        methods: {
            /* ---------------- render pipeline ---------------- */

            async render() {
                const seq = ++this.renderSeq;
                this.loading = true;
                this.error = '';

                try {
                    const raw = await this.loadTemplate();
                    if (seq !== this.renderSeq) return;

                    const data = this.normalizeData(this.data);

                    // Fill top-level placeholders in the RAW template before parsing
                    // (so pre-built HTML values like {{RowsHtml}} land in valid spots).
                    // Loop placeholders use {{@field}} and are skipped here; they are
                    // filled per-item during loop expansion below.
                    const filled = this.fill(raw, data);
                    const { styles, links, bodyHtml } = this.parseTemplate(filled);
                    const linked = await this.loadLinkedCss(links);
                    if (seq !== this.renderSeq) return;
                    this.injectTemplateStyles(linked + '\n' + styles);

                    // Expand data-repeat loops (each item fills the repeated element).
                    const looped = this.expandLoops(bodyHtml, data);
                    this._flowHtml = looped;   // un-paginated document (used by the Excel export)

                    // Fonts/images must be ready or the measured heights are wrong.
                    await this.preloadAssets(looped);
                    if (seq !== this.renderSeq) return;

                    const paged = this.paginate(looped);
                    this.pages = paged.map((h, i) => this.fillPageNumbers(h, i + 1, paged.length));
                    this.currentPage = Math.min(this.currentPage || 1, this.pages.length) || 1;
                    this.$emit('loaded', this.pages.length);
                } catch (e) {
                    if (seq !== this.renderSeq) return;
                    this.error = (e && e.message) || 'Failed to render template.';
                    this.$emit('error', this.error);
                }

                this.loading = false;
                this.$nextTick(() => this.updateContainerWidth());
            },

            /* paper size / orientation changed -> re-flow the document */
            onPaperChange() {
                this.$emit('paper-change', { paper: this.paperSize, orientation: this.landscape ? 'landscape' : 'portrait' });
                this.render();
            },

            async loadTemplate() {
                if (!this.templateCache[this.src]) {
                    const res = await fetch(this.src);
                    if (!res.ok) throw new Error('Template not found: ' + this.src + ' (HTTP ' + res.status + ')');
                    this.templateCache[this.src] = await res.text();
                }
                return this.templateCache[this.src];
            },

            parseTemplate(raw) {
                const doc = new DOMParser().parseFromString(raw, 'text/html');
                const styles = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
                const links = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')].map((l) => l.getAttribute('href'));
                // styles are injected (scoped) separately — keep them out of the page markup
                doc.querySelectorAll('style, script, link').forEach((n) => n.remove());
                const bodyHtml = doc.body ? doc.body.innerHTML : raw;
                return { styles, links, bodyHtml };
            },

            /* <link rel="stylesheet"> files, resolved relative to the template file */
            async loadLinkedCss(links) {
                if (!links || !links.length) return '';
                const base = new URL(this.src, document.baseURI);
                const parts = await Promise.all(links.map(async (href) => {
                    let url;
                    try { url = new URL(href, base).href; } catch (e) { return ''; }
                    if (this.cssCache[url] == null) {
                        try {
                            const res = await fetch(url);
                            this.cssCache[url] = res.ok ? await res.text() : '';
                        } catch (e) { this.cssCache[url] = ''; }
                    }
                    return this.cssCache[url];
                }));
                return parts.join('\n');
            },

            preloadAssets(html) {
                const tasks = [];
                if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
                if (/<img\b/i.test(html)) {
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    doc.querySelectorAll('img[src]').forEach((img) => {
                        const src = img.getAttribute('src');
                        if (!src) return;
                        tasks.push(new Promise((resolve) => {
                            const i = new Image();
                            i.onload = i.onerror = resolve;
                            i.src = src;
                        }));
                    });
                }
                return Promise.race([
                    Promise.all(tasks).catch(() => {}),
                    new Promise((resolve) => setTimeout(resolve, 4000)),
                ]);
            },

            /* Scope template CSS under .pdfv-page so it can't leak into the host app */
            scopeCss(css, scope) {
                css = css.replace(/\/\*[\s\S]*?\*\//g, '');

                const readBlock = (text, braceIdx) => {
                    let depth = 0;
                    for (let j = braceIdx; j < text.length; j++) {
                        if (text[j] === '{') depth++;
                        else if (text[j] === '}') { depth--; if (depth === 0) return [text.slice(braceIdx + 1, j), j + 1]; }
                    }
                    return [text.slice(braceIdx + 1), text.length];
                };

                const process = (text) => {
                    let out = '', k = 0;
                    while (k < text.length) {
                        const brace = text.indexOf('{', k);
                        const semi = text.indexOf(';', k);
                        if (brace === -1) { out += text.slice(k); break; }
                        if (semi !== -1 && semi < brace) { out += text.slice(k, semi + 1); k = semi + 1; continue; }
                        const header = text.slice(k, brace).trim();
                        const [inner, next] = readBlock(text, brace);
                        if (header.startsWith('@')) {
                            // @page from a template would fight the viewer's own page box
                            // (a page margin there is a classic cause of blank/shifted sheets).
                            if (/^@page\b/.test(header)) { /* dropped */ }
                            else if (/^@(media|supports|layer|container)/.test(header)) out += header + '{' + process(inner) + '}';
                            else out += header + '{' + inner + '}';
                        } else if (header) {
                            out += header.split(',').map((s) => {
                                s = s.trim();
                                // html/body/:root selectors target the page box itself
                                if (s === 'html' || s === 'body' || s === ':root' || s === 'html body') return scope;
                                return scope + ' ' + s.replace(/^(html\s+body|html|body|:root)(?![\w-])/, '');
                            }).join(',') + '{' + inner + '}';
                        }
                        k = next;
                    }
                    return out;
                };

                return process(css);
            },

            injectTemplateStyles(css) {
                if (!css || !css.trim()) return;
                const id = 'pdfv-tpl-' + btoa(unescape(encodeURIComponent(this.src))).replace(/[^a-z0-9]/gi, '');
                if (document.getElementById(id)) return;
                const el = document.createElement('style');
                el.id = id;
                el.textContent = this.scopeCss(css, '.pdfv-page');
                document.head.appendChild(el);
            },

            /* ---------------- placeholders ---------------- */

            fill(html, data) {
                return html.replace(/\{\{\s*(@?\w+)\s*\}\}/g, (m, k) => {
                    if (k === 'PageNumber' || k === 'PageBreakCount') return m; // filled after pagination
                    if (k.charAt(0) === '@') return m; // loop placeholder; filled per-item later
                    return data && data[k] != null ? data[k] : '';
                });
            },

            /* Fill {{@field}} loop placeholders from one array item. */
            fillLoop(html, item) {
                return html.replace(/\{\{\s*@(\w+)\s*\}\}/g, (m, k) => {
                    return item && item[k] != null ? item[k] : '';
                });
            },

            /* Normalize the data prop into an object for placeholder filling.
               An array is treated as [header, ...rows]: the first element supplies
               the top-level placeholders and the rest are exposed as `rows` for
               data-repeat loops (matches a combined header + result array). */
            normalizeData(data) {
                if (Array.isArray(data)) {
                    const root = data[0] || {};
                    return { ...root, rows: data.slice(1) };
                }
                return data || {};
            },

            /* Expand data-repeat loops so ALL row markup lives in the template.
               An element with data-repeat="key" is cloned once per item in
               data[key] (an array); each clone's {{@placeholders}} are filled from
               that item. The original element is removed. */
            expandLoops(html, data) {
                if (!html || !html.includes('data-repeat')) return html;

                const doc = new DOMParser().parseFromString(html, 'text/html');
                const root = doc.body;
                if (!root) return html;

                root.querySelectorAll('[data-repeat]').forEach((el) => {
                    const key = el.getAttribute('data-repeat');
                    const items = data ? data[key] : null;
                    const parent = el.parentNode;
                    if (!parent) return;

                    if (Array.isArray(items)) {
                        const frag = doc.createDocumentFragment();
                        items.forEach((item) => {
                            const clone = el.cloneNode(true);
                            clone.removeAttribute('data-repeat');
                            clone.innerHTML = this.fillLoop(clone.innerHTML, item);
                            // placeholders in the repeated element's own attributes
                            [...clone.attributes].forEach((a) => {
                                if (a.value.includes('{{')) a.value = this.fillLoop(a.value, item);
                            });
                            frag.appendChild(clone);
                        });
                        parent.insertBefore(frag, el);
                    }
                    // no data -> drop the prototype row instead of printing raw {{@x}}
                    parent.removeChild(el);
                });

                return root.innerHTML;
            },

            fillPageNumbers(html, page, total) {
                return html
                    .replace(/\{\{\s*PageNumber\s*\}\}/g, String(page))
                    .replace(/\{\{\s*PageBreakCount\s*\}\}/g, String(total));
            },

            /* ---------------- pagination ----------------
               Pages are built for real inside a hidden, page-sized box and content
               is poured in node by node until the body overflows — so margins,
               paddings, borders and wrapped text are all accounted for exactly
               (no summing of estimated heights). */

            hasContent(node) {
                if (node.nodeType === 3) return !!node.textContent.trim();
                if (node.nodeType !== 1) return false;
                return !!node.textContent.trim() || node.matches(MEDIA_SEL) || !!node.querySelector(MEDIA_SEL);
            },

            flowNodes(el) {
                return [...el.childNodes].filter((n) =>
                    (n.nodeType === 1 && !SKIP_TAGS.test(n.tagName)) || (n.nodeType === 3 && n.textContent.trim()));
            },

            paginate(html) {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const root = doc.body;
                if (!root) return [html];

                // Top level of the template:
                //   <header>/<footer>      -> fixed on every page of the document
                //   <section>/.pdf-page    -> starts a new page
                //   anything else          -> grouped into one continuous flow
                const globalHead = [], globalFoot = [], chunks = [];
                let loose = null;
                this.flowNodes(root).forEach((n) => {
                    const isEl = n.nodeType === 1;
                    if (isEl && n.matches(HEAD_SEL)) { globalHead.push(n); return; }
                    if (isEl && n.matches(FOOT_SEL)) { globalFoot.push(n); return; }
                    if (isEl && n.matches(PAGE_SEL)) { loose = null; chunks.push(n); return; }
                    if (!loose) {
                        loose = doc.createElement('div');
                        loose.className = 'pdfv-auto';
                        chunks.push(loose);
                    }
                    loose.appendChild(n);
                });
                globalHead.forEach((n) => n.remove());
                globalFoot.forEach((n) => n.remove());

                const pages = [];
                chunks.forEach((c) => pages.push(...this.paginateChunk(c, globalHead, globalFoot, false)));

                if (!pages.length) {
                    // nothing but headers/footers (or an empty template): still show one sheet
                    const empty = doc.createElement('div');
                    empty.className = 'pdfv-auto';
                    pages.push(...this.paginateChunk(empty, globalHead, globalFoot, true));
                }
                return pages;
            },

            paginateChunk(chunk, globalHead, globalFoot, force) {
                const m = this.getMeasurer();

                // Wrapper divs around the real content ("shells") are kept on every
                // page so their padding/borders still apply.
                const shells = [];
                let inner = chunk;
                while (true) {
                    const only = inner.children.length === 1 ? inner.firstElementChild : null;
                    if (!only || only.matches(FIXED_SEL) || only.tagName === 'TABLE' || !only.querySelector(FIXED_SEL)) break;
                    if ([...inner.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) break;
                    shells.push(inner);
                    inner = only;
                }

                // Lift EVERY header/footer out of the flow, wherever it is nested.
                const fixed = [...inner.querySelectorAll(FIXED_SEL)].filter((el) => {
                    const p = el.parentElement && el.parentElement.closest(FIXED_SEL);
                    return !(p && p !== inner && inner.contains(p));
                });
                fixed.forEach((el) => el.remove());
                const heads = globalHead.map((el) => el.cloneNode(true)).concat(fixed.filter((el) => el.matches(HEAD_SEL)));
                const foots = fixed.filter((el) => !el.matches(HEAD_SEL)).concat(globalFoot.map((el) => el.cloneNode(true)));
                heads.concat(foots).forEach((el) => el.classList.add('pdfv-fixed'));

                const nodes = this.flowNodes(inner);
                // A chunk with nothing to show would only produce a blank sheet.
                if (!force && !nodes.some((n) => this.hasContent(n))) return [];

                const pages = [];
                let page = null;
                let pendingBreak = false;

                const newPage = () => {
                    m.textContent = '';
                    let parent = m;
                    shells.forEach((s) => {
                        const c = s.cloneNode(false);
                        c.classList.add('pdfv-shell');
                        parent.appendChild(c);
                        parent = c;
                    });
                    const sheet = inner.cloneNode(false);
                    sheet.classList.add('pdfv-sheet');
                    parent.appendChild(sheet);
                    heads.forEach((h) => sheet.appendChild(h.cloneNode(true)));
                    const body = document.createElement('div');
                    body.className = 'pdfv-body';
                    sheet.appendChild(body);
                    foots.forEach((f) => sheet.appendChild(f.cloneNode(true)));
                    return { root: m.firstChild, body, placed: 0 };
                };

                const finish = () => { pages.push(page.root.outerHTML); page = newPage(); };
                const overflow = () => page.body.scrollHeight > page.body.clientHeight;

                // count content placed on this page, per open container
                const bump = (parent) => {
                    page.placed++;
                    for (let p = parent; p && p !== page.body; p = p.parentNode) p._pdfvN = (p._pdfvN || 0) + 1;
                };
                // drop containers left empty at the bottom of a page (e.g. a lone <thead>)
                const prune = (parent) => {
                    let p = parent;
                    while (p && p !== page.body && !p._pdfvN) {
                        const up = p.parentNode;
                        up.removeChild(p);
                        p = up;
                    }
                };
                // continue a split container on a page: empty clone + repeated parts (colgroup/thead)
                const open = (entry, parent) => {
                    const c = entry.el.cloneNode(false);
                    entry.repeats.forEach((r) => c.appendChild(r.cloneNode(true)));
                    parent.appendChild(c);
                    return c;
                };
                const nextPage = (parent, chain) => {
                    prune(parent);
                    finish();
                    let p = page.body;
                    chain.forEach((entry) => { p = open(entry, p); });
                    return p;
                };

                const canSplit = (node, cs) => {
                    if (!node.children.length || node.matches(KEEP_SEL)) return false;
                    if (!SPLIT_DISPLAY.test(cs.display)) return false;           // flex/grid/inline rows stay whole
                    if (/avoid/.test(cs.breakInside || '')) return false;
                    if (cs.position === 'absolute' || cs.position === 'fixed') return false;
                    return ![...node.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
                };

                /* Put `node` into `parent` (a live element of the current page).
                   `chain` = the split containers currently open between the page
                   body and `parent`. Returns the parent to use for the next sibling
                   (it changes whenever a new page is started). */
                const flow = (node, parent, chain) => {
                    const isEl = node.nodeType === 1;

                    if (pendingBreak) {
                        pendingBreak = false;
                        if (page.placed) parent = nextPage(parent, chain);
                    }
                    if (isEl && node.matches(BREAK_SEL)) {
                        return page.placed ? nextPage(parent, chain) : parent;
                    }

                    parent.appendChild(node);
                    const cs = isEl ? getComputedStyle(node) : null;

                    if (cs && BREAK_VAL.test(cs.breakBefore || '') && page.placed) {
                        parent.removeChild(node);
                        parent = nextPage(parent, chain);
                        parent.appendChild(node);
                    }
                    const breakAfter = !!cs && BREAK_VAL.test(cs.breakAfter || '');

                    if (!overflow()) {
                        bump(parent);
                    } else if (isEl && canSplit(node, cs)) {
                        // Too tall for the space left: pour its children in one by one,
                        // starting on THIS page (no jumping to a fresh page first).
                        parent.removeChild(node);
                        const repeatSrc = node.tagName === 'TABLE'
                            ? [...node.children].filter((k) => k.matches('colgroup, thead'))
                            : [];
                        const entry = { el: node, repeats: repeatSrc };
                        const kids = this.flowNodes(node).filter((k) => !repeatSrc.includes(k));
                        const sub = chain.concat(entry);
                        let shell = open(entry, parent);
                        if (!kids.length) bump(shell);
                        kids.forEach((k) => { shell = flow(k, shell, sub); });
                        parent = shell.parentNode;
                    } else {
                        // Cannot be split: move it to a fresh page (unless this one is
                        // already empty — then it simply has to stay, clipped).
                        parent.removeChild(node);
                        if (page.placed) parent = nextPage(parent, chain);
                        parent.appendChild(node);
                        bump(parent);
                    }

                    if (breakAfter) pendingBreak = true;
                    return parent;
                };

                page = newPage();
                let parent = page.body;
                nodes.forEach((n) => { parent = flow(n, parent, []); });
                if (page.placed || !pages.length) pages.push(page.root.outerHTML);
                m.textContent = '';
                return pages;
            },

            /* Hidden box with the exact width/styles of a page (slightly shorter, as
               a safety margin so nothing is clipped at the footer when printing). */
            getMeasurer() {
                if (!this._measurer || !this._measurer.isConnected) {
                    const d = document.createElement('div');
                    d.className = 'pdfv-page';
                    d.setAttribute('aria-hidden', 'true');
                    const s = d.style;
                    [['position', 'absolute'], ['left', '-99999px'], ['top', '0'], ['box-shadow', 'none'], ['transform', 'none'],
                        ['visibility', 'hidden'], ['pointer-events', 'none'], ['filter', 'none']]
                        .forEach(([k, v]) => s.setProperty(k, v, 'important'));
                    document.body.appendChild(d);
                    this._measurer = d;
                }
                // current paper size
                this._measurer.style.setProperty('width', this.pageW + 'px', 'important');
                this._measurer.style.setProperty('height', (this.pageH - SAFE_H) + 'px', 'important');
                return this._measurer;
            },

            /* ---------------- zoom / navigation / view mode ---------------- */

            updateContainerWidth() {
                const el = this.$refs.pagesEl;
                if (el && el.clientWidth) this.containerW = el.clientWidth;
            },

            scalerStyle() {
                return {
                    width: (this.pageW * this.effectiveZoom) + 'px',
                    height: (this.pageH * this.effectiveZoom + 26) + 'px',
                };
            },

            zoomIn() {
                const z = this.effectiveZoom;
                this.zoomMode = 'preset';
                this.zoom = Math.min(2, +(z + 0.1).toFixed(2));
            },
            zoomOut() {
                const z = this.effectiveZoom;
                this.zoomMode = 'preset';
                this.zoom = Math.max(0.3, +(z - 0.1).toFixed(2));
            },

            setZoomPreset(v) {
                if (v === 'fit') { this.zoomMode = 'fit'; this.updateContainerWidth(); }
                else { this.zoomMode = 'preset'; this.zoom = parseFloat(v); }
            },

            goToPage(i) {
                i = Math.max(0, Math.min(this.pages.length - 1, i));
                this.currentPage = i + 1;
                if (this.viewMode === 'all') {
                    const scalers = this.$refs.pagesEl ? this.$refs.pagesEl.querySelectorAll('.pdfv-scaler') : [];
                    if (scalers[i]) scalers[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            },

            /* ---------------- export: JSON / Excel / PDF ---------------- */

            exportName(ext) {
                const base = (this.fileName || this.displayTitle || 'document')
                    .replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'document';
                return base + '.' + ext;
            },

            async exportAs(type) {
                this.exportOpen = false;
                if (this.exporting) return;
                try {
                    let filename;
                    if (type === 'json') filename = this.exportJson();
                    else if (type === 'excel') filename = this.exportExcel();
                    else if (type === 'pdf') filename = await this.exportPdf();
                    if (filename) this.$emit('exported', { type, filename });
                } catch (e) {
                    this.exporting = '';
                    this.$emit('error', 'Export failed: ' + ((e && e.message) || e));
                    if (type === 'pdf') {
                        // the browser refused to rasterise the pages -> use its own PDF printer
                        alert('Could not build the PDF file in this browser. The print dialog will open instead — choose "Save as PDF".');
                        this.print();
                    } else {
                        alert('Export failed: ' + ((e && e.message) || e));
                    }
                }
            },

            /* JSON: the data behind the report (exactly what was passed in :data) */
            exportJson() {
                const filename = this.exportName('json');
                const json = JSON.stringify(this.data == null ? {} : this.data, null, 2);
                downloadBlob(new Blob([json], { type: 'application/json' }), filename);
                return filename;
            },

            /* Excel: every table of the report becomes a sheet (whole table, not
               split by page; header rows bold; numeric text stored as numbers).
               A template without tables falls back to the raw data. */
            exportExcel() {
                let sheets = this.tablesToSheets();
                if (!sheets.length) sheets = this.dataToSheets();
                if (!sheets.length) sheets = [{ name: 'Sheet1', rows: [] }];
                const filename = this.exportName('xlsx');
                downloadBlob(buildXlsx(sheets), filename);
                return filename;
            },

            tablesToSheets() {
                if (!this._flowHtml) return [];
                const doc = new DOMParser().parseFromString(this._flowHtml, 'text/html');
                const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
                const tables = [...doc.querySelectorAll('table')].filter((t) =>
                    !t.parentElement.closest('table') && !t.closest(FIXED_SEL) && !t.hasAttribute('data-no-export'));

                const sheets = [];
                tables.forEach((table) => {
                    const grid = [];
                    [...table.rows].forEach((tr, r) => {
                        grid[r] = grid[r] || [];
                        const inHead = !!tr.closest('thead');
                        let c = 0;
                        [...tr.cells].forEach((cell) => {
                            while (grid[r][c] !== undefined) c++;           // skip cells taken by a rowspan
                            const cs = Math.max(1, cell.colSpan || 1), rs = Math.max(1, cell.rowSpan || 1);
                            for (let y = 0; y < rs; y++) {
                                grid[r + y] = grid[r + y] || [];
                                for (let x = 0; x < cs; x++) grid[r + y][c + x] = null;
                            }
                            grid[r][c] = { v: text(cell), bold: inHead || cell.tagName === 'TH' };
                            c += cs;
                        });
                    });
                    if (!grid.some((row) => row.some((cell) => cell && cell.v !== ''))) return;
                    const caption = table.querySelector(':scope > caption');
                    sheets.push({
                        name: table.getAttribute('data-sheet') || (caption && text(caption)) || '',
                        rows: grid.map((row) => Array.from(row, (cell) => cell || null)),
                    });
                });
                if (sheets.length === 1 && !sheets[0].name) sheets[0].name = this.displayTitle;
                sheets.forEach((sh, i) => { if (!sh.name) sh.name = 'Table ' + (i + 1); });
                return sheets;
            },

            dataToSheets() {
                const data = this.normalizeData(this.data);
                const flat = (v) => (v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v));
                const sheets = [];
                const fields = Object.keys(data).filter((k) => !Array.isArray(data[k]));
                if (fields.length) {
                    sheets.push({
                        name: 'Data',
                        rows: [[{ v: 'Field', bold: true }, { v: 'Value', bold: true }]]
                            .concat(fields.map((k) => [{ v: k }, { v: flat(data[k]) }])),
                    });
                }
                Object.keys(data).filter((k) => Array.isArray(data[k]) && data[k].length).forEach((k) => {
                    const items = data[k], cols = [];
                    items.forEach((it) => {
                        if (it && typeof it === 'object') Object.keys(it).forEach((c) => { if (!cols.includes(c)) cols.push(c); });
                    });
                    if (!cols.length) cols.push('value');
                    sheets.push({
                        name: k,
                        rows: [cols.map((c) => ({ v: c, bold: true }))].concat(items.map((it) =>
                            cols.map((c) => ({ v: flat(it && typeof it === 'object' ? it[c] : it) })))),
                    });
                });
                return sheets;
            },

            /* PDF: each page is rendered by the browser itself (SVG foreignObject ->
               canvas -> JPEG) and written into a real .pdf, one image per page, in
               the selected paper size/orientation. No external library needed. */
            async exportPdf() {
                if (!this.pages.length) return '';
                const filename = this.exportName('pdf');
                const css = this.collectCss();
                const cache = {};
                const out = [];
                // 2x for crisp text; lower it for very long documents to keep the file small
                const scale = this.pages.length > 60 ? 1.5 : 2;

                for (let i = 0; i < this.pages.length; i++) {
                    this.exporting = 'Exporting PDF… page ' + (i + 1) + ' of ' + this.pages.length;
                    await new Promise((r) => setTimeout(r, 0));   // let the progress text paint
                    out.push(await this.rasterizePage(this.pages[i], css, cache, scale));
                }
                downloadBlob(buildPdf(out, this.paperMm.w, this.paperMm.h), filename);
                this.exporting = '';
                return filename;
            },

            /* all CSS the pages are rendered with (host app + viewer + template) */
            collectCss() {
                // (browser default that is lost inside an SVG image; listed first so any real rule wins)
                let css = 'th{text-align:center;}\n';
                for (const sheet of document.styleSheets) {
                    try { for (const rule of sheet.cssRules) css += rule.cssText + '\n'; }
                    catch (e) { /* cross-origin stylesheet: not readable, skipped */ }
                }
                return css;
            },

            async toDataUrl(url, cache) {
                if (cache[url] === undefined) {
                    cache[url] = (async () => {
                        try {
                            const res = await fetch(url);
                            if (!res.ok) return '';
                            const blob = await res.blob();
                            return await new Promise((resolve) => {
                                const fr = new FileReader();
                                fr.onload = () => resolve(fr.result);
                                fr.onerror = () => resolve('');
                                fr.readAsDataURL(blob);
                            });
                        } catch (e) { return ''; }
                    })();
                }
                return cache[url];
            },

            async rasterizePage(pageHtml, css, cache, scale) {
                const W = this.pageW, H = this.pageH;

                const host = document.createElement('div');
                host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
                host.setAttribute('style', '--pdfv-pw:' + W + 'px;--pdfv-ph:' + H + 'px;margin:0;padding:0;');
                const style = document.createElement('style');
                style.textContent = css;
                const page = document.createElement('div');
                page.className = 'pdfv-page';
                page.setAttribute('style', 'box-shadow:none;transform:none;');
                page.innerHTML = pageHtml;
                host.appendChild(style);
                host.appendChild(page);

                // images must be embedded: an SVG image cannot load external files
                await Promise.all([...page.querySelectorAll('img')].map(async (img) => {
                    const src = img.currentSrc || img.src;
                    img.removeAttribute('srcset');
                    img.removeAttribute('loading');
                    if (!src || src.startsWith('data:')) return;
                    const data = await this.toDataUrl(src, cache);
                    if (data) img.setAttribute('src', data); else img.removeAttribute('src');
                }));

                const xhtml = new XMLSerializer().serializeToString(host);
                const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
                    '<foreignObject x="0" y="0" width="100%" height="100%">' + xhtml + '</foreignObject></svg>';

                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('page could not be rendered'));
                    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                });

                const canvas = document.createElement('canvas');
                canvas.width = Math.round(W * scale);
                canvas.height = Math.round(H * scale);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                if (!this.showGraphics) ctx.filter = 'grayscale(1)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const b64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];   // throws if the canvas is tainted
                const bin = atob(b64);
                const jpeg = new Uint8Array(bin.length);
                for (let k = 0; k < bin.length; k++) jpeg[k] = bin.charCodeAt(k);
                canvas.width = canvas.height = 0;   // free memory early
                return { jpeg, w: Math.round(W * scale), h: Math.round(H * scale) };
            },

            /* ---------------- print ----------------
               The pages are written into a hidden iframe and THAT document is
               printed. It contains nothing except the pages (plus the same
               stylesheets, so it looks identical), so the host layout can no
               longer produce a blank first sheet. */

            print() {
                if (!this.pages.length) return;
                if (this._printFrame) { this._printFrame.remove(); this._printFrame = null; }

                // same CSS as on screen: host styles + viewer styles + scoped template styles
                const styleTags = [...document.querySelectorAll('link[rel~="stylesheet"], style')]
                    .map((n) => n.outerHTML).join('\n');

                const html =
                    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
                    '<base href="' + escAttr(document.baseURI) + '">' +
                    '<title>' + escAttr(this.displayTitle) + '</title>' +
                    styleTags +
                    '<style>' + PAGE_STYLES + printStyles(this.paperMm.w, this.paperMm.h) + '</style>' +
                    '</head><body class="' + (this.showGraphics ? '' : 'pdfv-bw') + '">' +
                    this.pages.map((p) => '<div class="pdfv-page">' + p + '</div>').join('') +
                    '</body></html>';

                const frame = document.createElement('iframe');
                frame.setAttribute('aria-hidden', 'true');
                frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
                this._printFrame = frame;

                let done = false;
                const go = () => {
                    if (done || this._printFrame !== frame) return;
                    done = true;
                    const win = frame.contentWindow;
                    if (!win) return;
                    const cleanup = () => setTimeout(() => {
                        if (this._printFrame === frame) { frame.remove(); this._printFrame = null; }
                    }, 500);
                    win.addEventListener('afterprint', cleanup);
                    const fire = () => { win.focus(); win.print(); };
                    const fonts = win.document.fonts;
                    if (fonts && fonts.ready) {
                        Promise.race([fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(fire, fire);
                    } else fire();
                };

                frame.onload = go;           // fires once stylesheets + images are loaded
                frame.srcdoc = html;
                document.body.appendChild(frame);
            },
        },

        mounted() {
            if (!document.getElementById('pdfv-styles')) {
                const s = document.createElement('style');
                s.id = 'pdfv-styles';
                s.textContent = STYLES;
                document.head.appendChild(s);
            }
            this._onDocClick = (e) => {
                const wrap = this.$refs.exportWrap;
                if (this.exportOpen && wrap && !wrap.contains(e.target)) this.exportOpen = false;
            };
            document.addEventListener('click', this._onDocClick);
            this._onResize = () => this.updateContainerWidth();
            window.addEventListener('resize', this._onResize);
            if (window.ResizeObserver && this.$refs.pagesEl) {
                this._ro = new ResizeObserver(this._onResize);
                this._ro.observe(this.$refs.pagesEl);
            }
            this.updateContainerWidth();
            this.render();
        },

        beforeUnmount() {
            window.removeEventListener('resize', this._onResize);
            document.removeEventListener('click', this._onDocClick);
            if (this._ro) this._ro.disconnect();
            if (this._measurer) this._measurer.remove();
            if (this._printFrame) this._printFrame.remove();
        },

        template:
            '<div class="pdfv" :class="{ bw: !showGraphics }" :style="rootStyle">' +

            '<div class="pdfv-toolbar">' +
            '<div class="pdfv-group" style="gap:8px;">' +
            '<i class="bi bi-file-earmark-pdf" style="color:var(--pdfv-accent);font-size:18px;"></i>' +
            '<span class="pdfv-title">{{ displayTitle }}</span>' +
            '<span class="pdfv-badge" v-if="pages.length">{{ pages.length }} page{{ pages.length > 1 ? "s" : "" }}</span>' +
            '</div>' +
            '<div class="grow"></div>' +

            /* page navigation */
            '<div class="pdfv-group" v-if="pages.length > 1">' +
            '<button class="pdfv-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 2)" title="Previous page"><i class="bi bi-chevron-left"></i></button>' +
            '<span class="pdfv-ind">{{ currentPage }} / {{ pages.length }}</span>' +
            '<button class="pdfv-btn" :disabled="currentPage >= pages.length" @click="goToPage(currentPage)" title="Next page"><i class="bi bi-chevron-right"></i></button>' +
            '</div>' +

            /* view mode: single / all */
            '<div class="pdfv-group">' +
            '<button class="pdfv-btn" :class="{ \'pdfv-btn-active\': viewMode === \'single\' }" @click="viewMode = \'single\'" title="Single page view"><i class="bi bi-1-circle"></i></button>' +
            '<button class="pdfv-btn" :class="{ \'pdfv-btn-active\': viewMode === \'all\' }" @click="viewMode = \'all\'" title="All pages view"><i class="bi bi-123"></i></button>' +
            '</div>' +

            /* paper size + orientation */
            '<div class="pdfv-group">' +
            '<select class="pdfv-select" v-model="paperSize" title="Paper size">' +
            '<option v-for="o in paperOptions" :key="o.value" :value="o.value">{{ o.label }}</option>' +
            '</select>' +
            '<button class="pdfv-btn" :class="{ \'pdfv-btn-active\': !landscape }" @click="landscape = false" title="Portrait"><i class="bi bi-file-earmark"></i></button>' +
            '<button class="pdfv-btn" :class="{ \'pdfv-btn-active\': landscape }" @click="landscape = true" title="Landscape"><i class="bi bi-file-earmark" style="display:inline-block;transform:rotate(90deg);"></i></button>' +
            '</div>' +

            /* graphics: color / black & white */
            '<button class="pdfv-btn" :class="{ \'pdfv-btn-active\': !showGraphics }" @click="showGraphics = !showGraphics" :title="showGraphics ? \'Switch to black & white\' : \'Show graphics (color)\'">' +
            '<i class="bi" :class="showGraphics ? \'bi-palette\' : \'bi-circle-half\'"></i>' +
            '</button>' +

            /* zoom */
            '<div class="pdfv-group">' +
            '<button class="pdfv-btn" @click="zoomOut" title="Zoom out"><i class="bi bi-zoom-out"></i></button>' +
            '<span class="pdfv-ind">{{ zoomLabel }}</span>' +
            '<button class="pdfv-btn" @click="zoomIn" title="Zoom in"><i class="bi bi-zoom-in"></i></button>' +
            '<select class="pdfv-select" :value="zoomMode === \'fit\' ? \'fit\' : String(zoom)" @change="setZoomPreset($event.target.value)" title="Zoom preset">' +
            '<option value="fit">Fit</option>' +
            '<option value="0.5">50%</option>' +
            '<option value="0.75">75%</option>' +
            '<option value="1">100%</option>' +
            '<option value="1.25">125%</option>' +
            '<option value="1.5">150%</option>' +
            '</select>' +
            '</div>' +

            /* export */
            '<div class="pdfv-menu-wrap" ref="exportWrap">' +
            '<button class="pdfv-btn" :class="{ \'pdfv-btn-active\': exportOpen }" :disabled="!pages.length || !!exporting" @click="exportOpen = !exportOpen" title="Export">' +
            '<i class="bi bi-download"></i><span>{{ exporting ? "Exporting…" : "Export" }}</span><i class="bi bi-chevron-down" style="font-size:10px;"></i>' +
            '</button>' +
            '<div class="pdfv-menu" v-if="exportOpen">' +
            '<button @click="exportAs(\'pdf\')"><i class="bi bi-file-earmark-pdf"></i><span>PDF file</span><small>.pdf</small></button>' +
            '<button @click="exportAs(\'excel\')"><i class="bi bi-file-earmark-excel"></i><span>Excel</span><small>.xlsx</small></button>' +
            '<button @click="exportAs(\'json\')"><i class="bi bi-filetype-json"></i><span>JSON</span><small>.json</small></button>' +
            '</div>' +
            '</div>' +

            /* print */
            '<button class="pdfv-btn pdfv-btn-accent" :disabled="!pages.length" @click="print" title="Print (choose Save as PDF in the dialog)">' +
            '<i class="bi bi-printer"></i>' +
            '</button>' +
            '</div>' +

            '<div class="pdfv-pages" ref="pagesEl">' +
            '<div v-if="exporting" class="pdfv-state" style="position:sticky;top:0;z-index:20;"><i class="bi bi-arrow-repeat pdfv-spin"></i> {{ exporting }}</div>' +
            '<div v-if="loading" class="pdfv-state"><i class="bi bi-arrow-repeat pdfv-spin"></i> Loading template…</div>' +
            '<div v-else-if="error" class="pdfv-state error"><i class="bi bi-exclamation-circle"></i><span>{{ error }}</span><button class="pdfv-btn" @click="render">Retry</button></div>' +
            '<template v-else-if="viewMode === \'all\'">' +
            '<div v-for="(p, i) in pages" :key="i" class="pdfv-scaler" :style="scalerStyle()">' +
            '<div class="pdfv-page" :style="{ transform: \'scale(\' + effectiveZoom + \')\' }" v-html="p"></div>' +
            '<div class="pdfv-page-label">Page {{ i + 1 }} of {{ pages.length }}</div>' +
            '</div>' +
            '</template>' +
            '<div v-else class="pdfv-scaler" :style="scalerStyle()">' +
            '<div class="pdfv-page" :style="{ transform: \'scale(\' + effectiveZoom + \')\' }" v-html="pages[currentPage - 1] || \'\'"></div>' +
            '<div class="pdfv-page-label">Page {{ currentPage }} of {{ pages.length }}</div>' +
            '</div>' +
            '</div>' +

            '</div>',
    };

    window.PdfViewer = PdfViewer;
})();

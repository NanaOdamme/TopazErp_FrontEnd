(() => {
    'use strict';

    const pad = (value) => String(value).padStart(2, '0');

    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Convert dates to YYYY-MM-DD without Moment.
    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';

        if (typeof date === 'string') {
            const raw = date.trim();

            if (!raw) return '';

            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
                return raw.slice(0, 10);
            }

            // Handle .NET JSON dates.
            const ms = /\/Date\((-?\d+)\)\//.exec(raw);

            if (ms) {
                const d = new Date(Number(ms[1]));

                return Number.isNaN(d.getTime())
                    ? ''
                    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }

            // Handle DD/MM/YYYY or DD-MM-YYYY.
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);

            if (dmy) {
                return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            }

            // Handle YYYY/MM/DD.
            const ymd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(raw);

            if (ymd) {
                return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
            }

            // Handle DD-Mon-YYYY (e.g. 10-Nov-2026) — the API's paymentDate format.
            const dMonY = /^(\d{1,2})[- ]([A-Za-z]+)[- ](\d{4})$/.exec(raw);

            if (dMonY) {
                const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
                const month = months[dMonY[2].slice(0, 3).toLowerCase()];

                if (month) {
                    return `${dMonY[3]}-${pad(month)}-${pad(dMonY[1])}`;
                }
            }
        }

        const d = date instanceof Date ? date : new Date(date);

        if (Number.isNaN(d.getTime())) return '';

        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

        return local.toISOString().slice(0, 10);
    };

    // YYYY-MM-DD (or any supported input) -> 16-Nov-2026, matching the API's own style.
    const displayDate = (value) => {
        const iso = isoDate(value);

        if (!iso) return '';

        const [y, m, d] = iso.split('-');

        return `${d}-${MONTHS_SHORT[Number(m) - 1]}-${y}`;
    };

    // Case-insensitive field reader: read(row, 'chequeNo') also finds 'ChequeNo'.
    const read = (row, ...keys) => {
        if (!row) return '';

        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return row[key];
            }

            const pascal = key.charAt(0).toUpperCase() + key.slice(1);

            if (row[pascal] !== undefined && row[pascal] !== null && row[pascal] !== '') {
                return row[pascal];
            }
        }

        return '';
    };

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: '00000000-0000-0000-0000-000000000000',
                isLoading: false,
                payload: {},

                reportType: 'Invoice',
                subReportType: 'supplier-report',

                reportApiBaseUrl: '',

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                paymentList: [],
                supplierList: [],

                batchNumber: '',
                supplierId: '',
                paymentId: '',

                reportPath: '',
                reportHeader: [],
                reportPathConfig: {
                    invoicePaymentReceiptReportPath: '/ReportTemplates/Ap/ap-payment-receipt.html',
                    invoicePaymentSummaryReportPath: '/ReportTemplates/Ap/ap-payment-summary.html',
                    invoicePaymentSupplierReport: '/ReportTemplates/Ap/ap-payment-summary.html',
                    invoicePaymentByDateReportPath: '/ReportTemplates/Ap/ap-payment-summary.html',
                },

                viewerColor: '#ff2056',
                receiptList: [],
                summaryData: null,
                summaryTitle: '',
                reportData: [],
                showReceipt: false,
            };
        },

        methods: {
            // report header — pass a title override so the receipt gets its own heading.
            async getReportHeader(titleOverride) {
                let title = titleOverride || 'AP Payments';

                if (!titleOverride && this.subReportType === 'date-report') {
                    title = `AP Payments from ${this.startDate} to ${this.endDate}`;
                }

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },

            // Fetches the header and always returns a single usable object.
            async getReportHeaderData(title) {
                try {
                    const header = await this.getReportHeader(title);
                    return Array.isArray(header) && header.length ? header[0] : {};
                } catch (e) {
                    console.warn('Report header not loaded:', e);
                    return {};
                }
            },

            unwrapList(response) {
                const data = response?.data;

                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.result)) return data.result;
                if (Array.isArray(data?.result?.items)) return data.result.items;
                if (Array.isArray(data?.items)) return data.items;
                if (Array.isArray(data?.data)) return data.data;

                return [];
            },

            groupBy(data, key) {
                return data.reduce((groups, item) => {
                    const value = item[key] || '--';

                    if (!groups[value]) {
                        groups[value] = [];
                    }

                    groups[value].push(item);

                    return groups;
                }, {});
            },

            sum(data, key) {
                return data.reduce((total, item) => {
                    return total + (Number(item[key]) || 0);
                }, 0);
            },

            formatAmount(value) {
                return (Number(value) || 0).toLocaleString('en-GH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            },

            getPayments() {
                axios.get('/Ap/GetPayments/')
                    .then((response) => {
                        this.paymentList = this.unwrapList(response)
                            .filter((payment) => payment.isCanceled === false)
                            .map((payment) => ({
                                ...payment,
                                paymentId: payment.id,
                                displayText: `${payment.batchNumber}-${payment.supplierName ?? payment.vendorName ?? payment.customerName ?? ''}`,
                            }));

                        if (this.paymentList.length > 0) {
                            this.paymentId = this.paymentList[0].id;
                        }
                    })
                    .catch((err) => {
                        console.error('Error loading payments:', err);
                        this.toastHandler('error', 'Unable to get payments.');
                    });
            },

            getSuppliers() {
                axios.get('/SharedResource/GetSuppliers')
                    .then((response) => {
                        this.supplierList = this.unwrapList(response);

                        if (this.supplierList.length > 0) {
                            this.supplierId = this.supplierList[0].id;
                        }
                    })
                    .catch((err) => {
                        console.error('Error loading suppliers:', err);
                        this.toastHandler('error', 'Unable to get suppliers.');
                    });
            },

            getReportData() {
                if (this.reportType !== 'Invoice') {
                    this.toastHandler('warning', 'Please select a valid report type.');
                    return;
                }

                let url = '/Ap/GetApPaymentsReport';

                this.reportPath = this.reportPathConfig.invoicePaymentSummaryReportPath;

                switch (this.subReportType) {
                    case 'summary-report':
                        this.reportPath = this.reportPathConfig.invoicePaymentSummaryReportPath;
                        url = '/Ap/GetApPaymentsReport';
                        break;

                    case 'supplier-report':
                        if (!this.supplierId) {
                            this.toastHandler('warning', 'Please select a supplier.');
                            return;
                        }

                        this.reportPath = this.reportPathConfig.invoicePaymentSupplierReport;
                        url = `/Ap/GetApPaymentsBySupplier?SupplierId=${encodeURIComponent(this.supplierId)}`;
                        break;

                    case 'date-report':
                        if (!this.startDate || !this.endDate) {
                            this.toastHandler('warning', 'Please select a start date and end date.');
                            return;
                        }

                        if (this.startDate > this.endDate) {
                            this.toastHandler('warning', 'Start date cannot be later than end date.');
                            return;
                        }

                        this.reportPath = this.reportPathConfig.invoicePaymentByDateReportPath;
                        url = `/Ap/GetApPaymentsByDate?StartDate=${encodeURIComponent(this.startDate)}&EndDate=${encodeURIComponent(this.endDate)}`;
                        break;

                    case 'batchNumber':
                        if (!this.paymentId) {
                            this.toastHandler('warning', 'Please select a payment batch.');
                            return;
                        }

                        this.reportPath = this.reportPathConfig.invoicePaymentReceiptReportPath;
                        url = `/Ap/GetApPaymentReceipts?id=${encodeURIComponent(this.paymentId)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report option.');
                        return;
                }

                this.isLoading = true;

                axios.get(url)
                    .then(async (response) => {
                        const result = response.data?.result;
                        this.reportData = result;

                        const rows = (Array.isArray(result) ? result : [result]).filter(
                            (d) => d && typeof d === 'object' && Object.keys(d).length > 0
                        );

                        if (this.subReportType === 'batchNumber') {
                            this.summaryData = null;

                            if (!rows.length) {
                                this.receiptList = [];
                                this.showReceipt = false;
                                this.toastHandler('warning', 'No receipt data found for this payment.');
                                return;
                            }

                            // The receipt needs the company header, so fetch it for this
                            // report type too — the summary branch already does.
                            const headerData = await this.getReportHeaderData('Supplier Payment Receipt');

                            this.receiptList = this.groupReceiptRows(rows)
                                .map((group, index) => this.toReceiptData(group, headerData, index))
                                .filter(Boolean);

                            this.showReceipt = this.receiptList.length > 0;

                            if (!this.showReceipt) {
                                this.toastHandler('warning', 'No receipt data found for this payment.');
                            }

                            return;
                        }

                        this.showReceipt = false;
                        this.receiptList = [];

                        if (!rows.length) {
                            this.summaryData = null;
                            this.toastHandler('warning', 'No payment data found.');
                            return;
                        }

                        const headerData = await this.getReportHeaderData();
                        this.summaryData = this.toSummaryData(rows, headerData);
                    })
                    .catch((err) => {
                        console.error('Error loading report:', err);
                        this.toastHandler('error', 'Unable to get report data.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            // One payment (batch) can settle several invoices, so split the rows into
            // one receipt per batch + supplier + currency + payment date.
            groupReceiptRows(rows) {
                const groups = new Map();

                rows.forEach((row) => {
                    const key = [
                        read(row, 'batchNumber') || '',
                        read(row, 'supplierName', 'vendorName', 'customerName') || '',
                        read(row, 'currencyCode') || '',
                        read(row, 'paymentDate') || '',
                    ].join('|');

                    if (!groups.has(key)) {
                        groups.set(key, []);
                    }

                    groups.get(key).push(row);
                });

                return [...groups.values()];
            },

            toReceiptData(rows, headerData = {}, index = 0) {
                const list = (Array.isArray(rows) ? rows : [rows]).filter(
                    (r) => r && typeof r === 'object' && Object.keys(r).length > 0
                );

                if (!list.length) return null;

                const first = list[0];

                const currencyCode = read(first, 'currencyCode') || 'GH₵';
                const currencyName = read(first, 'currencyName') || '';
                const batchNumber = read(first, 'batchNumber') || '';

                const totalInvoiceAmount = list.reduce(
                    (total, r) => total + (Number(read(r, 'totalInvoiceAmount')) || 0),
                    0
                );

                const totalApplied = list.reduce(
                    (total, r) => total + (Number(read(r, 'amountToApply')) || 0),
                    0
                );

                const amountToPay = Number(read(first, 'amountToPay')) || totalApplied;
                const outstandingCreditMemo = Number(read(first, 'outstandingCreditMemo')) || 0;
                const rate = Number(read(first, 'rate')) || 0;
                const payRate = Number(read(first, 'payRate')) || rate || 1;
                const chequeNo = read(first, 'chequeNo', 'chequeNumber') || '—';

                // ---- invoice rows + totals (built here, injected via {{RowsHtml}}) ----
                const invoiceRows = list.map((r, i) => {
                    const rowRate = Number(read(r, 'rate')) || rate;
                    const applied = Number(read(r, 'amountToApply')) || 0;
                    const invoiced = Number(read(r, 'totalInvoiceAmount')) || 0;

                    return `<tr>` +
                        `<td class="ctr">${i + 1}</td>` +
                        `<td class="strong">${read(r, 'invoiceNumber') || ''}</td>` +
                        `<td class="ctr">${displayDate(read(r, 'invoiceDate'))}</td>` +
                        `<td class="ctr">${read(r, 'invoiceType') || ''}</td>` +
                        `<td class="num">${rowRate.toFixed(4)}</td>` +
                        `<td class="num">${currencyCode} ${this.formatAmount(invoiced)}</td>` +
                        `<td class="num strong">${currencyCode} ${this.formatAmount(applied)}</td>` +
                        `</tr>`;
                }).join('');

                const RowsHtml = invoiceRows +
                    `<tr class="subtotal-row">` +
                    `<td colspan="5" class="num">Total</td>` +
                    `<td class="num">${currencyCode} ${this.formatAmount(totalInvoiceAmount)}</td>` +
                    `<td class="num">${currencyCode} ${this.formatAmount(totalApplied)}</td>` +
                    `</tr>` +
                    `<tr class="total-row">` +
                    `<td colspan="6" class="num">Net Payment Amount</td>` +
                    `<td class="num">${currencyCode} ${this.formatAmount(amountToPay)}</td>` +
                    `</tr>`;

                // ---- GL distribution (built here, injected via {{GlRowsHtml}}) ----
                const debitGl = read(first, 'debitGl') || '';
                const creditGl = read(first, 'creditGl') || '';

                const GlRowsHtml =
                    `<tr>` +
                    `<td class="ctr">Debit</td>` +
                    `<td>${debitGl}</td>` +
                    `<td class="num">${currencyCode} ${this.formatAmount(amountToPay)}</td>` +
                    `<td class="num">&mdash;</td>` +
                    `</tr>` +
                    `<tr>` +
                    `<td class="ctr">Credit</td>` +
                    `<td>${creditGl}</td>` +
                    `<td class="num">&mdash;</td>` +
                    `<td class="num">${currencyCode} ${this.formatAmount(amountToPay)}</td>` +
                    `</tr>`;

                // ---- company header (raw base64 -> data URI) ----
                // Falls back to a transparent pixel so a missing logo renders nothing
                // instead of a broken image.
                const rawLogo = headerData.companyLogo || '';
                const companyLogo = !rawLogo
                    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                    : (rawLogo.startsWith('data:') ? rawLogo : 'data:image/jpeg;base64,' + rawLogo);

                const supplierName = read(first, 'supplierName', 'vendorName', 'customerName') || '';

                // The API's amountInWords ends with the batch memo
                // "... to be applied to the following invoice(s): " — not wanted on a receipt.
                const amountInWords =
                    this.cleanAmountInWords(read(first, 'amountInWords')) ||
                    this.amountInWords(amountToPay, currencyCode);

                return {
                    // stable key for v-for
                    id: `receipt-${index}-${batchNumber}-${supplierName}`,

                    // header / footer
                    companyLogo,
                    companyName: headerData.companyName || '',
                    primaryPhoneNo: headerData.primaryPhoneNo || '',
                    address: headerData.address || '',
                    email: headerData.email || '',
                    reportTitle: headerData.reportTitle || 'Supplier Payment Receipt',
                    CurrentDate: displayDate(new Date()),
                    PageNumber: 1,
                    PageBreakCount: 1,

                    // payment meta
                    receiptNo: batchNumber || '—',
                    supplierName,
                    batchNumber,
                    paymentDate: displayDate(read(first, 'paymentDate')),
                    modeOfPayment: read(first, 'modeOfPayment') || '',
                    chequeNo,
                    bankName: read(first, 'bankName') || '',
                    bankBranch: read(first, 'bankBranch', 'branch') || '',
                    currencyName,
                    currencyCode,
                    payRate: payRate.toFixed(4),

                    // body
                    RowsHtml,
                    GlRowsHtml,
                    RowCount: list.length,
                    TotalInvoiceAmount: this.formatAmount(totalInvoiceAmount),
                    TotalApplied: this.formatAmount(totalApplied),
                    outstandingCreditMemo: this.formatAmount(outstandingCreditMemo),
                    amountToPay: this.formatAmount(amountToPay),
                    TotalAmountPaid: this.formatAmount(amountToPay),
                    debitGl,
                    creditGl,
                    amountInWords,
                };
            },

            toSummaryData(rows, headerData = {}) {
                // currency identity: prefer the name (consistent even when the
                // code is null), fall back to the code, then GH₵.
                const currencyOf = (r) => {
                    const code = r.currencyCode || '';
                    const name = r.currencyName || '';
                    return {
                        key: name || code || 'GH₵',
                        code: code || 'GH₵',
                        label: (name && code) ? `${name} (${code})` : (name || code || 'GH₵'),
                    };
                };

                // AP party: supplier first, falling back to vendor/customer so
                // a payload that still uses the AR names still groups.
                const partyOf = (r) => r.supplierName || r.vendorName || r.customerName || '(No Supplier)';

                // group: supplier -> currency key -> { rows, code, label }
                const groups = new Map();
                const currencyTotals = new Map(); // currency key -> { total, code, label }

                rows.forEach((r) => {
                    const supplier = partyOf(r);
                    const cur = currencyOf(r);

                    if (!groups.has(supplier)) groups.set(supplier, new Map());
                    const byCurrency = groups.get(supplier);
                    if (!byCurrency.has(cur.key)) byCurrency.set(cur.key, { rows: [], code: cur.code, label: cur.label });
                    byCurrency.get(cur.key).rows.push(r);

                    if (!currencyTotals.has(cur.key)) currencyTotals.set(cur.key, { total: 0, code: cur.code, label: cur.label });
                    currencyTotals.get(cur.key).total += Number(r.amountToPay) || 0;
                });

                const rowHtml = (r, code) => {
                    const bank = [r.bankName, r.bankBranch].filter(Boolean).join(' — ');
                    return `<tr><td>${r.invoiceNumber || ''}</td>` +
                        `<td class="ctr">${isoDate(r.invoiceDate) || ''}</td><td class="ctr">${isoDate(r.paymentDate) || ''}</td>` +
                        `<td>${r.modeOfPayment || ''}</td><td>${r.chequeNumber || r.chequeNo || ''}</td>` +
                        `<td>${bank}</td>` +
                        `<td class="num">${code}${this.formatAmount(r.amountToPay)}</td>` +
                        `<td class="ctr">${r.daysToPayment ?? ''}</td></tr>`;
                };

                let rowsHtml = '';
                const suppliers = [...groups.keys()].sort((a, b) => a.localeCompare(b));

                for (const supplier of suppliers) {
                    const byCurrency = groups.get(supplier);
                    const keys = [...byCurrency.keys()].sort((a, b) => byCurrency.get(a).label.localeCompare(byCurrency.get(b).label));

                    for (const key of keys) {
                        const group = byCurrency.get(key);
                        const subtotal = group.rows.reduce((s, r) => s + (Number(r.amountToPay) || 0), 0);

                        rowsHtml += `<tr class="group-header"><td colspan="9">${supplier} — ${group.label}</td></tr>`;
                        rowsHtml += group.rows.map((r) => rowHtml(r, group.code)).join('');
                        rowsHtml += `<tr class="subtotal-row"><td colspan="7">Subtotal — ${supplier} (${group.code})</td>` +
                            `<td class="num">${group.code}${this.formatAmount(subtotal)}</td></tr>`;
                    }
                }

                // grand total(s): one per currency (a single row when the
                // report has only one currency).
                const totalKeys = [...currencyTotals.keys()].sort((a, b) => currencyTotals.get(a).label.localeCompare(currencyTotals.get(b).label));
                for (const key of totalKeys) {
                    const t = currencyTotals.get(key);
                    rowsHtml += `<tr class="total-row"><td colspan="7">Grand Total (${t.code})</td>` +
                        `<td class="num">${t.code}${this.formatAmount(t.total)}</td></tr>`;
                }

                // companyLogo arrives as raw base64 — turn it into a data URI.
                // Fall back to a transparent pixel so a missing logo shows nothing.
                const rawLogo = headerData.companyLogo || '';
                const companyLogo = !rawLogo
                    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                    : (rawLogo.startsWith('data:') ? rawLogo : 'data:image/jpeg;base64,' + rawLogo);

                this.summaryTitle = headerData.reportTitle || 'AP Payments';
                const firstCurrency = rows.length ? currencyOf(rows[0]) : { code: 'GH₵' };

                return {
                    // header (repeats on every page via the template <header>/<footer>)
                    companyLogo,
                    companyName: headerData.companyName || '',
                    primaryPhoneNo: headerData.primaryPhoneNo || '',
                    address: headerData.address || '',
                    email: headerData.email || '',
                    reportTitle: this.summaryTitle,
                    // body
                    CurrentDate: isoDate(new Date()),
                    RowsHtml: rowsHtml,
                    RowCount: rows.length,
                    TotalAmount: this.formatAmount(this.sum(rows, 'amountToPay')),
                    CurrencyCode: firstCurrency.code,
                };
            },

            // Strips the API's batch memo ("… to be applied to the following invoice(s):")
            // so the receipt shows just the amount in words.
            cleanAmountInWords(value) {
                let text = String(value || '').replace(/\s+/g, ' ').trim();

                if (!text) return '';

                text = text
                    .replace(/[,;:\-\s]*to be applied to the following invoices?\(?s?\)?\s*[:.]?\s*$/i, '')
                    .replace(/[\s:,;\-]+$/, '')
                    .trim();

                if (!text) return '';

                if (!/\bonly$/i.test(text)) {
                    text += ' Only';
                }

                return text;
            },

            // amount-in-words fallback (used only if the API doesn't send it)
            numberToWords(n) {
                const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                const two = (x) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
                const three = (x) => {
                    const h = Math.floor(x / 100), r = x % 100;
                    return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
                };

                n = Math.floor(Math.abs(Number(n) || 0));
                if (n === 0) return 'Zero';

                const parts = [];
                if (Math.floor(n / 1e9)) parts.push(three(Math.floor(n / 1e9)) + ' Billion');
                if (Math.floor(n / 1e6) % 1000) parts.push(three(Math.floor(n / 1e6) % 1000) + ' Million');
                if (Math.floor(n / 1e3) % 1000) parts.push(three(Math.floor(n / 1e3) % 1000) + ' Thousand');
                if (n % 1000) parts.push(three(n % 1000));

                return parts.join(' ').trim();
            },

            amountInWords(amount, currencyCode) {
                const names = {
                    'GH₵': ['Ghana Cedi', 'Pesewa'],
                    'GHS': ['Ghana Cedi', 'Pesewa'],
                    '$': ['Dollar', 'Cent'],
                    '£': ['Pound', 'Pence'],
                    '€': ['Euro', 'Cent'],
                };

                const value = Math.abs(Number(amount) || 0);
                const whole = Math.floor(value);
                const cents = Math.round((value - whole) * 100);
                const [major, minor] = names[currencyCode] || ['', ''];

                let text = this.numberToWords(whole);

                if (major) {
                    text += ' ' + major + (whole === 1 ? '' : 's');
                }

                if (cents > 0) {
                    text += ' and ' + this.numberToWords(cents);

                    if (minor) {
                        text += ' ' + minor + (cents === 1 ? '' : 's');
                    }
                }

                return text + ' Only';
            },

            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') {
                    console.log(message);
                    return;
                }

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                    title: message,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true,
                });
            },
        },

        mounted() {
            this.reportApiBaseUrl = typeof reportApiBaseUrl !== 'undefined' ? reportApiBaseUrl : '';

            this.getSuppliers();
            this.getPayments();
        },
    });

    // Register the PdfViewer plugin component.
    // PdfViewer.js must be loaded BEFORE this file (see the view).
    if (typeof PdfViewer !== 'undefined') {
        app.component('PdfViewer', PdfViewer);
    } else {
        console.warn('PdfViewer.js not loaded — the PDF viewer will be unavailable.');
    }

    app.use(WSelectPlugin);
    app.mount('#app');
})();

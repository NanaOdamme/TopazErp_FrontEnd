(() => {
    'use strict';

    const pad = (value) => String(value).padStart(2, '0');

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
            // report header
            async getReportHeader() {
                let title = 'AP Payments';

                if (this.subReportType === 'date-report') {
                    title = `AP Payments from ${this.startDate} to ${this.endDate}`;
                }

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
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
                let url = '/Ap/GetApPaymentsReport';

                this.reportPath = this.reportPathConfig.invoicePaymentSummaryReportPath;

                if (this.reportType !== 'Invoice') {
                    this.toastHandler('warning', 'Please select a valid report type.');
                    return;
                }

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

                        if (this.subReportType === 'batchNumber') {
                            const list = Array.isArray(result) ? result : [result];

                            this.receiptList = list
                                .filter((d) => d && typeof d === 'object' && Object.keys(d).length > 0)
                                .map((d) => this.toReceiptData(d));

                            this.showReceipt = this.receiptList.length > 0;
                            this.summaryData = null;

                            if (!this.showReceipt) {
                                this.toastHandler('warning', 'No receipt data found for this payment.');
                            }
                        } else {
                            this.showReceipt = false;
                            this.receiptList = [];

                            let headerData = {};
                            try {
                                const header = await this.getReportHeader();
                                headerData = Array.isArray(header) && header.length ? header[0] : {};
                            } catch (e) {
                                console.warn('Report header not loaded:', e);
                            }

                            const rows = (Array.isArray(result) ? result : [result]).filter(
                                (d) => d && typeof d === 'object' && Object.keys(d).length > 0
                            );

                            if (!rows.length) {
                                this.summaryData = null;
                                this.toastHandler('warning', 'No payment data found.');
                                return;
                            }

                            this.summaryData = this.toSummaryData(rows, headerData);
                        }
                    })
                    .catch((err) => {
                        console.error('Error loading report:', err);
                        this.toastHandler('error', 'Unable to get report data.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            toReceiptData(d) {
                const get = (...keys) => {
                    for (const k of keys) {
                        if (d && d[k] !== undefined && d[k] !== null && d[k] !== '') return d[k];
                    }
                    return '';
                };

                const amount = parseFloat(get('paidAmount', 'PaidAmount', 'amount', 'Amount')) || 0;
                const currencyCode = get('currencyCode', 'CurrencyCode') || 'GH₵';

                return {
                    receiptNo: get('receiptNo', 'ReceiptNo', 'receiptNumber', 'ReceiptNumber') || '—',
                    CurrentDate: isoDate(get('paymentDate', 'PaymentDate', 'currentDate', 'CurrentDate', 'date', 'Date')),
                    // AP: the payee is a supplier. Keep customer* as a fallback
                    // so a payload that still uses the AR field names works.
                    supplierName: get('supplierName', 'SupplierName', 'vendorName', 'VendorName', 'customerName', 'CustomerName'),
                    invoiceNo: get('invoiceNo', 'InvoiceNo'),
                    amountInWords: get('amountInWords', 'AmountInWords') || this.amountInWords(amount, currencyCode),
                    modeOfPayment: get('modeOfPayment', 'ModeOfPayment'),
                    chequeNo: get('chequeNo', 'ChequeNo') || '—',
                    bankName: get('bankName', 'BankName'),
                    bankBranch: get('bankBranch', 'BankBranch', 'branch', 'Branch'),
                    currencyCode,
                    paidAmount: this.formatAmount(amount),
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
                const names = { 'GH₵': 'Ghana Cedis', 'GHS': 'Ghana Cedis', '$': 'Dollars', '£': 'Pounds', '€': 'Euros' };
                return this.numberToWords(amount) + (names[currencyCode] ? ' ' + names[currencyCode] : '') + ' Only';
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
            this.reportApiBaseUrl = reportApiBaseUrl;

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

(() => {
    'use strict';

    const pad = (value) => String(value).padStart(2, '0');

    const MONTHS = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

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

            // Handle dd-MMM-yyyy (e.g. "12-Nov-2026").
            const dMonY = /^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{4})$/.exec(raw);

            if (dMonY) {
                const month = MONTHS[dMonY[2].toLowerCase()];
                if (month) return `${dMonY[3]}-${month}-${pad(dMonY[1])}`;
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
        }

        const d = date instanceof Date ? date : new Date(date);

        if (Number.isNaN(d.getTime())) return '';

        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

        return local.toISOString().slice(0, 10);
    };

    const today = isoDate(new Date());

    // Amounts: 2 decimals, thousands separators, negatives in brackets.
    const formatAmount = (value) => {
        if (value === null || value === undefined || value === '') return '';

        const num = Number(value);
        if (!Number.isFinite(num)) return value;

        const rounded = Math.round(num * 100) / 100;
        const text = Math.abs(rounded).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        return rounded < 0 ? `(${text})` : text;
    };

    // Rates: 4 decimal places. Zero / blank stays blank so the template
    // doesn't print rows of 0.0000 for taxes that don't apply.
    const formatRate = (value) => {
        if (value === null || value === undefined || value === '') return '';

        const num = Number(value);
        if (!Number.isFinite(num)) return value;
        if (num === 0) return '';

        return num.toLocaleString('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
        });
    };

    const toNumber = (value) => {
        if (typeof value === 'string') {
            const cleaned = value.trim().replace(/,/g, '');
            if (/^\(.*\)$/.test(cleaned)) {
                const neg = Number(cleaned.slice(1, -1));
                return Number.isFinite(neg) ? -neg : 0;
            }
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : 0;
        }
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const AMOUNT_FIELDS = [
        'invoiceAmount',
        'balance',
        'paymentAmount',
        'total',
        'withHeld',
        'vatWithHeld',
        'vatAmount',
        'totalTaxAmount',
        'netAmount',
    ];

    const RATE_FIELDS = [
        'buyRate',
        'sellRate',
        'payCurrencyBuyRate',
        'payCurrencySellRate',
        'getflRate',
        'nhilRate',
        'vatRate',
        'covidRate',
        'cstRate',
        'withHoldingRate',
    ];

    // Blank row so every placeholder in the template has a value.
    const blankRow = {
        currencyCode: '',
        currencyName: '',
        voucherNumber: '',
        supplierName: '',
        accountNumber: '',
        invoiceNumber: '',
        voucherEntryDate: '',
        paymentDate: '',
        bankName: '',
        modeOfPayment: '',
        chequeNumber: '',
        description: '',
        isPosted: '',
        rowClass: '',
        ...Object.fromEntries(AMOUNT_FIELDS.map((f) => [f, ''])),
        ...Object.fromEntries(RATE_FIELDS.map((f) => [f, ''])),
    };

    const formatRow = (row) => {
        const out = {
            ...blankRow,
            ...row,
            // AP payloads may carry supplier* or vendor* / customer* names.
            supplierName: row.supplierName ?? row.vendorName ?? row.customerName ?? '',
            accountNumber: row.accountNumber ?? row.supplierAccountNumber ?? '',
            voucherNumber: row.voucherNumber ?? '',
            invoiceNumber: row.invoiceNumber ?? '',
            currencyCode: row.currencyCode ?? row.payCurrencyCode ?? '',
            currencyName: row.currencyName ?? row.payCurrencyName ?? '',
            bankName: row.bankName ?? '',
            modeOfPayment: row.modeOfPayment ?? '',
            chequeNumber: row.chequeNumber ?? row.chequeNo ?? '',
            description: row.description ?? '',
            voucherEntryDate: isoDate(row.voucherEntryDate),
            paymentDate: isoDate(row.paymentDate),
            isPosted: row.isPosted === true ? 'Posted' : (row.isPosted === false ? 'Unposted' : (row.isPosted ?? '')),
        };

        AMOUNT_FIELDS.forEach((field) => {
            out[field] = formatAmount(row[field]);
        });

        RATE_FIELDS.forEach((field) => {
            out[field] = formatRate(row[field]);
        });

        return out;
    };

    // Group by currency code (currencyName is often null on AP vouchers),
    // adding a total row per currency.
    const buildGroupedRows = (rows, { totals = true } = {}) => {
        const groups = new Map();

        rows.forEach((row) => {
            const key =
                (row.currencyCode ?? '').toString().trim() ||
                (row.payCurrencyCode ?? '').toString().trim() ||
                (row.currencyName ?? '').toString().trim() ||
                'N/A';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
        });

        const output = [];

        groups.forEach((groupRows, currency) => {
            output.push({ ...blankRow, currencyCode: currency, rowClass: 'group-header' });

            const groupTotals = Object.fromEntries(AMOUNT_FIELDS.map((f) => [f, 0]));

            groupRows.forEach((row) => {
                AMOUNT_FIELDS.forEach((field) => {
                    groupTotals[field] += toNumber(row[field]);
                });

                output.push({
                    ...formatRow(row),
                    currencyCode: '', // shown once in the group header
                    currencyName: '',
                    rowClass: 'data-row',
                });
            });

            if (totals) {
                const totalRow = {
                    ...blankRow,
                    voucherNumber: `Total ${currency}`,
                    rowClass: 'group-total',
                };

                AMOUNT_FIELDS.forEach((field) => {
                    totalRow[field] = formatAmount(groupTotals[field]);
                });

                output.push(totalRow);
            }
        });

        return output;
    };

    const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const toLogoDataUri = (logo) => {
        if (!logo || typeof logo !== 'string') return TRANSPARENT_PIXEL;

        const trimmed = logo.trim();

        if (!trimmed) return TRANSPARENT_PIXEL;

        if (trimmed.startsWith('data:')) return trimmed;

        return `data:image/jpeg;base64,${trimmed}`;
    };

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: '00000000-0000-0000-0000-000000000000',

                isLoading: false,
                payload: {},

                subReportType: 'summary-report',

                reportApiBaseUrl: '',

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                invoiceList: [],
                voucherList: [],
                supplierList: [],

                invoiceId: '',
                voucherId: '',
                supplierId: '',

                reportPath: '',
                reportHeader: [],
                reportData: [],
                viewerColor: '#ff2056',
                showReport: false,

                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ap/ap-voucher-summary.html',
                    voucherBySupplierReport: '/ReportTemplates/Ap/ap-voucher-supplier.html',
                    voucherByInvoiceReport: '/ReportTemplates/Ap/ap-voucher-invoice.html',
                    voucherDetailsReport: '/ReportTemplates/Ap/ap-voucher-details.html',
                    voucherByDateReport: '/ReportTemplates/Ap/ap-voucher-by-date.html',
                },
            };
        },

        computed: {
            reportTitle() {
                let title = 'AP Payment Vouchers';

                if (this.subReportType === 'date-report') {
                    title = `AP Payment Vouchers from ${this.startDate} to ${this.endDate}`;
                } else if (this.subReportType === 'details-report') {
                    const voucher = this.voucherList.find(
                        (item) => String(item.id) === String(this.voucherId)
                    );
                    if (voucher) title = `AP Payment Voucher ${voucher.voucherNumber || ''}`.trim();
                }

                return title;
            },
        },

        methods: {
            unwrapList(raw) {
                if (!raw) return [];

                if (Array.isArray(raw)) return raw;

                if (Array.isArray(raw.result)) return raw.result;

                if (Array.isArray(raw.result?.items)) return raw.result.items;

                if (Array.isArray(raw.items)) return raw.items;

                if (Array.isArray(raw.data)) return raw.data;

                return [];
            },

            async getReportHeader() {
                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(this.reportTitle)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },

            async getSuppliers() {
                try {
                    const response = await axios.get('/SharedResource/GetSuppliers');

                    this.supplierList = this.unwrapList(response.data);

                    if (this.supplierList.length > 0 && !this.supplierId) {
                        this.supplierId = this.supplierList[0].id;
                    }
                } catch (error) {
                    console.error('Get suppliers error:', error);

                    this.supplierList = [];
                    this.supplierId = '';

                    this.toastHandler('error', 'Unable to get suppliers.');
                }
            },

            async getInvoices() {
                try {
                    const response = await axios.get('/Ap/GetInvoices');

                    this.invoiceList = this.unwrapList(response.data)
                        .filter((invoice) => invoice.isCanceled === false)
                        .sort((a, b) =>
                            (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '')
                        )
                        .map((invoice) => ({
                            ...invoice,
                            invoiceId: invoice.id,
                            displayText: `${invoice.supplierName || invoice.vendorName || ''} - ${invoice.invoiceNumber || ''}`,
                        }));

                    if (this.invoiceList.length > 0 && !this.invoiceId) {
                        this.invoiceId = this.invoiceList[0].id;
                    }
                } catch (error) {
                    console.error('Get invoices error:', error);

                    this.invoiceList = [];
                    this.invoiceId = '';

                    this.toastHandler('error', 'Unable to get invoices.');
                }
            },

            async getVouchers() {
                try {
                    const response = await axios.get('/Ap/GetVouchers');

                    this.voucherList = this.unwrapList(response.data).map((voucher) => ({
                        ...voucher,
                        displayText: `${voucher.voucherNumber || ''} - ${voucher.supplierName || voucher.vendorName || ''}`,
                    }));

                    if (this.voucherList.length > 0 && !this.voucherId) {
                        this.voucherId = this.voucherList[0].id;
                    }
                } catch (error) {
                    console.error('Get vouchers error:', error);

                    this.voucherList = [];
                    this.voucherId = '';

                    this.toastHandler('error', 'Unable to get vouchers.');
                }
            },

            async getReportData() {
                if (this.isLoading) return;

                const startDate = isoDate(this.startDate);
                const endDate = isoDate(this.endDate);

                let url = '';
                let selectedReportPath = '';

                switch (this.subReportType) {
                    case 'summary-report':
                        selectedReportPath = this.reportPathConfig.summaryReportPath;
                        url = '/Ap/GetApVouchersReport';
                        break;

                    case 'supplier-report':
                        if (!this.supplierId) {
                            this.toastHandler('warning', 'Please select a supplier.');
                            return;
                        }

                        selectedReportPath = this.reportPathConfig.voucherBySupplierReport;
                        url = `/Ap/GetApVouchersBySupplier?SupplierId=${encodeURIComponent(this.supplierId)}`;
                        break;

                    case 'invoice-report':
                        if (!this.invoiceId) {
                            this.toastHandler('warning', 'Please select an invoice.');
                            return;
                        }

                        selectedReportPath = this.reportPathConfig.voucherByInvoiceReport;
                        url = `/Ap/GetApVoucherByInvoice?InvoiceId=${encodeURIComponent(this.invoiceId)}`;
                        break;

                    case 'details-report':
                        if (!this.voucherId) {
                            this.toastHandler('warning', 'Please select a voucher.');
                            return;
                        }

                        selectedReportPath = this.reportPathConfig.voucherDetailsReport;
                        url = `/Ap/GetApVoucherDetails?VoucherId=${encodeURIComponent(this.voucherId)}`;
                        break;

                    case 'date-report':
                        if (!startDate || !endDate) {
                            this.toastHandler('warning', 'Please select a start date and end date.');
                            return;
                        }

                        if (startDate > endDate) {
                            this.toastHandler('warning', 'Start date cannot be later than end date.');
                            return;
                        }

                        selectedReportPath = this.reportPathConfig.voucherByDateReport;
                        url = `/Ap/GetApVouchersByDate?StartDate=${encodeURIComponent(startDate)}&EndDate=${encodeURIComponent(endDate)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report option.');
                        return;
                }

                this.isLoading = true;

                try {
                    const response = await axios.get(url);
                    const result = response.data?.result;

                    const rows = this.unwrapList(result !== undefined ? { result } : response.data)
                        .filter((row) => row && typeof row === 'object' && Object.keys(row).length > 0);

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.reportPath = selectedReportPath;
                        this.toastHandler('warning', 'No voucher data was returned.');
                        return;
                    }

                    const header = await this.getReportHeader();
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    // The single-voucher document is not grouped — it lists the
                    // voucher's own lines without currency headers/totals.
                    const formattedRows = this.subReportType === 'details-report'
                        ? rows.map((row, index) => ({
                            ...formatRow(row),
                            rowClass: 'data-row',
                            rowNumber: index + 1,
                        }))
                        : buildGroupedRows(rows).map((item, index) => ({
                            ...item,
                            rowNumber: index + 1,
                        }));

                    const selectedVoucher = this.subReportType === 'details-report'
                        ? this.voucherList.find((item) => String(item.id) === String(this.voucherId))
                        : null;

                    const selectedSupplier = this.subReportType === 'supplier-report'
                        ? this.supplierList.find((item) => String(item.id) === String(this.supplierId))
                        : null;

                    const selectedInvoice = this.subReportType === 'invoice-report'
                        ? this.invoiceList.find((item) => String(item.id) === String(this.invoiceId))
                        : null;

                    const firstDataRow = formattedRows.find((r) => r.rowClass === 'data-row');

                    // The single-voucher document binds amounts and rates at the
                    // voucher level, so lift them out of the first row.
                    const voucherLevel = {};

                    if (this.subReportType === 'details-report' && firstDataRow) {
                        [...AMOUNT_FIELDS, ...RATE_FIELDS].forEach((field) => {
                            voucherLevel[field] = firstDataRow[field];
                        });

                        voucherLevel.invoiceNumber = firstDataRow.invoiceNumber;
                        voucherLevel.description = firstDataRow.description;
                        voucherLevel.voucherEntryDate = firstDataRow.voucherEntryDate;
                        voucherLevel.currencyCode = firstDataRow.currencyCode;
                    }

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        reportTitle: headerObj.reportTitle || this.reportTitle,
                        startDate: this.subReportType === 'date-report' ? startDate : '',
                        endDate: this.subReportType === 'date-report' ? endDate : '',
                        voucherCount: rows.length,

                        // Details mode: voucher-level amounts and rates.
                        ...voucherLevel,

                        amountInWords: selectedVoucher?.amountInWords || firstDataRow?.amountInWords || '', 
                        batchNumber: selectedVoucher?.batchNumber || firstDataRow?.batchNumber || '',
                        voucherNumber: selectedVoucher?.voucherNumber || firstDataRow?.voucherNumber || '',
                        voucherEntryDate: voucherLevel.voucherEntryDate ?? '',
                        bankAccountName: selectedVoucher?.bankAccountName || firstDataRow?.bankAccountName || '',
                        liabilityAccountName: selectedVoucher?.liabilityAccountName || firstDataRow?.liabilityAccountName || '',
                        referenceNumber: selectedVoucher?.referenceNumber || firstDataRow?.referenceNumber || '',
                        ouName: selectedVoucher?.ouName || firstDataRow?.ouName || '',

                        // Data rows blank their currency (it is shown once in the
                        // group header), so fall back to the raw first row.
                        currencyCode:
                            voucherLevel.currencyCode ||
                            rows[0]?.currencyCode ||
                            rows[0]?.payCurrencyCode ||
                            '',
                        currencyName: voucherLevel.currencyName || rows[0]?.currencyName || '',

                        supplierName: selectedSupplier
                            ? selectedSupplier.name
                            : (
                                selectedVoucher?.supplierName ||
                                selectedVoucher?.vendorName ||
                                firstDataRow?.supplierName ||
                                ''
                            ),
                        accountNumber:
                            selectedSupplier?.accountNumber ||
                            selectedVoucher?.accountNumber ||
                            firstDataRow?.accountNumber ||
                            '',
                        contactPhone: selectedSupplier?.contactPersonPhone || '',
                        supplierEmail: selectedSupplier?.email || '',

                        invoiceNumber: selectedInvoice?.invoiceNumber || firstDataRow?.invoiceNumber || '',
                        invoiceAmount: formatAmount(
                            selectedInvoice?.totalInvoiceAmount ?? firstDataRow?.invoiceAmount
                        ),
                        balance: formatAmount(selectedInvoice?.balance ?? firstDataRow?.balance),

                        modeOfPayment: firstDataRow?.modeOfPayment || '',
                        chequeNumber: firstDataRow?.chequeNumber || '',
                        bankName: firstDataRow?.bankName || '',
                        paymentDate: firstDataRow?.paymentDate || '',
                        isPosted: firstDataRow?.isPosted || '',
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Error loading voucher report:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get report data.'
                    );
                } finally {
                    this.isLoading = false;
                }
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

        async mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;

            await this.getSuppliers();
            await this.getInvoices();
            await this.getVouchers();
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();

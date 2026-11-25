(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const ENDPOINTS = {
        quotations: '/Ar/GetQuotations',
        details: '/Ar/GetQuotationDetails',
        header: '/Ap/GetReportHeader',
    };
    const MONTHS = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
    const pad = value => String(value).padStart(2, '0');
    const isoDate = value => {
        if (value == null || value === '') return '';
        if (typeof value === 'string') {
            const raw = value.trim();
            if (!raw) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
            const mon = /^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{4})$/.exec(raw);
            if (mon && MONTHS[mon[2].toLowerCase()]) return `${mon[3]}-${MONTHS[mon[2].toLowerCase()]}-${pad(mon[1])}`;
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            const ymd = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw);
            if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
            const net = /\/Date\((-?\d+)(?:[+-]\d+)?\)\//.exec(raw);
            if (net) value = Number(net[1]);
        }
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };
    // API values may be numbers or formatted numeric strings, including (negatives).
    const toNumber = value => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (typeof value !== 'string' || !value.trim()) return null;
        let text = value.trim().replace(/,/g, '');
        const negative = /^\(.*\)$/.test(text);
        if (negative) text = text.slice(1, -1).trim();
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
        const n = Number(text);
        return Number.isFinite(n) ? (negative ? -Math.abs(n) : n) : null;
    };
    const formatAmount = value => {
        const n = toNumber(value);
        if (n === null) return value == null ? '' : String(value);
        const text = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return n < 0 ? `(${text})` : text;
    };
    const formatQuantity = value => {
        const n = toNumber(value);
        return n === null ? (value == null ? '' : String(value)) : n.toLocaleString('en-US', { maximumFractionDigits: 6 });
    };
    const get = (obj, name) => obj?.[name] ?? obj?.[name[0].toUpperCase() + name.slice(1)];
    const value = (obj, name) => get(obj, name) ?? '';
    const firstObject = obj => Array.isArray(obj) ? (obj[0] || {}) : (obj || {});
    const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const toLogoDataUri = (logo) => {
        if (!logo || typeof logo !== 'string') return TRANSPARENT_PIXEL;

        const trimmed = logo.trim();

        if (!trimmed) return TRANSPARENT_PIXEL;

        if (trimmed.startsWith('data:')) return trimmed;

        return `data:image/jpeg;base64,${trimmed}`;
    };
    const unwrap = raw => {
        let current = raw;
        for (let i = 0; i < 8 && current && !Array.isArray(current) && typeof current === 'object'; i++) {
            if (current.success === false || current.Success === false) {
                const err = current.error ?? current.Error;
                throw new Error(err?.message || err?.Message || current.message || 'The report request failed.');
            }
            const code = current.code ?? current.Code;
            if (typeof code === 'number' && code !== 200) throw new Error(current.message || current.Message || 'The report request failed.');
            if (current.result !== undefined || current.Result !== undefined) { current = current.result ?? current.Result; continue; }
            if (current.items !== undefined || current.Items !== undefined) { current = current.items ?? current.Items; continue; }
            // A data wrapper is not a quotation DTO.
            if ((current.data !== undefined || current.Data !== undefined) && !get(current, 'quotationNumber') && !get(current, 'details')) { current = current.data ?? current.Data; continue; }
            break;
        }
        return current;
    };
    const asList = raw => { const v = unwrap(raw); return Array.isArray(v) ? v : []; };
    const statusText = v => v === true || v === 1 || String(v).toLowerCase() === 'true' ? 'Converted' : v === false || v === 0 || String(v).toLowerCase() === 'false' ? 'Not converted' : '';
    const headerFields = header => ({
        companyLogo: toLogoDataUri(value(header, 'companyLogo')),
        companyName: value(header, 'companyName'),
        primaryPhoneNo: value(header, 'primaryPhoneNo'),
        address: value(header, 'address'),
        email: value(header, 'email'),
    });

    const app = Vue.createApp({
        data() {
            return {
                reportType: 'summary-report',
                reportApiBaseUrl: '', 
                reportPath: '', 
                reportData: [], 
                reportHeader: [],
                reportTitle: '', 
                viewerColor: 'blue', 
                showReport: false, 
                isLoading: false,
                quotationList: [], 
                quotationId: '', 
                quotationNumber: '',
                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ar/quotation-summary.html',
                    quotationDetailsPath: '/ReportTemplates/Ar/quotation-by-id.html',
                },
            };
        },
        methods: {
            async getReportHeader(title) {
                const response = await axios.get(`${ENDPOINTS.header}?title=${encodeURIComponent(title)}`);
                const header = firstObject(unwrap(response.data));
                this.reportHeader = header;
                return header;
            },
            async getQuotations() {
                const response = await axios.get(ENDPOINTS.quotations);
                const rows = asList(response.data);
                this.quotationList = rows.map(item => ({
                    ...item,
                    id: get(item, 'id') ?? get(item, 'quotationId') ?? '',
                    quotationNumber: value(item, 'quotationNumber'),
                    customerName: value(item, 'customerName'),
                }));
                return rows;
            },
            async getReportData() {
                if (this.isLoading) return;
                if (!['summary-report', 'quotation-details'].includes(this.reportType)) {
                    this.showReport = false;
                    this.toastHandler('warning', 'Please select a valid report type.');
                    return;
                }
                if (this.reportType === 'quotation-details' && (!String(this.quotationId || '').trim() || this.quotationId === EMPTY_GUID)) {
                    this.showReport = false;
                    this.toastHandler('warning', 'Please select a quotation with a valid ID.');
                    return;
                }
                this.isLoading = true;
                this.showReport = false;
                this.reportData = [];
                try {
                    const now = isoDate(new Date());
                    if (this.reportType === 'summary-report') {
                        const [rows, header] = await Promise.all([this.getQuotations(), this.getReportHeader('QUOTATION SUMMARY')]);
                        if (!rows.length) { this.toastHandler('warning', 'No quotations found.'); return; }
                        const formattedRows = rows.map((r, i) => ({
                            rowNumber: i + 1, rowClass: 'data-row',
                            customerName: value(r, 'customerName'), accountNumber: value(r, 'accountNumber'),
                            quotationNumber: value(r, 'quotationNumber'), quotationDate: isoDate(get(r, 'quotationDate')),
                            conversionStatus: statusText(get(r, 'isConvertedToInvoice')), currencyName: value(r, 'currencyName'),
                        }));
                        this.reportTitle = 'QUOTATION SUMMARY';
                        this.reportPath = this.reportPathConfig.summaryReportPath;
                        this.reportData = [{ ...headerFields(header), reportTitle: this.reportTitle, quotationCount: rows.length, CurrentDate: now }, ...formattedRows];
                    } else {
                        const response = await axios.get(`${ENDPOINTS.details}?id=${encodeURIComponent(this.quotationId)}`);
                        const data = firstObject(unwrap(response.data));
                        const details = get(data, 'details');
                        if (!get(data, 'quotationNumber') && !Array.isArray(details)) {
                            this.toastHandler('warning', 'No quotation details were returned.'); return;
                        }
                        let header = firstObject(get(data, 'reportHeader'));
                        if (!get(header, 'companyName') && !get(header, 'companyLogo')) header = await this.getReportHeader('QUOTATION');
                        const customer = firstObject(get(data, 'customerInfo'));
                        const rows = (Array.isArray(details) ? details : []).map((r, i) => ({
                            index: Number(get(r, 'index')) > 0 ? get(r, 'index') : i + 1,
                            description: value(r, 'description'), referenceNumber: value(r, 'referenceNumber'),
                            quantity: formatQuantity(get(r, 'quantity')), unitPrice: formatAmount(get(r, 'unitPrice')),
                            amountBeforeDiscount: formatAmount(get(r, 'amountBeforeDiscount')),
                            amount: formatAmount(get(r, 'amount')), subTotal: formatAmount(get(r, 'subTotal')), rowClass: 'data-row',
                        }));
                        this.quotationNumber = value(data, 'quotationNumber');
                        this.reportTitle = 'QUOTATION';
                        this.reportPath = this.reportPathConfig.quotationDetailsPath;
                        this.reportData = [{
                            ...headerFields(header), reportTitle: this.reportTitle, CurrentDate: now,
                            quotationNumber: this.quotationNumber, quotationDate: isoDate(get(data, 'quotationDate')),
                            referenceNumber: value(data, 'referenceNumber'), currencyName: value(data, 'currencyName'),
                            totalAmount: formatAmount(get(data, 'totalAmount')), totalBeforeDiscount: formatAmount(get(data, 'totalBeforeDiscount')),
                            totalDiscount: formatAmount(get(data, 'totalDiscount')), vatAmount: formatAmount(get(data, 'vatAmount')),
                            amountInWords: value(data, 'amountInWords'), notes: value(data, 'notes'),
                            customerName: value(customer, 'customerName'), customerAddress: value(customer, 'customerAddress'),
                            accountNumber: value(customer, 'accountNumber'), vatNumber: value(customer, 'vatNumber'),
                            contactPerson: value(customer, 'contactPerson'), customerPhoneNo: value(customer, 'customerPhoneNo'),
                            customerEmail: get(customer, 'customerEmail') ?? value(customer, 'email'),
                        }, ...rows];
                        // smtpCredentials and other unneeded response fields are never copied to reportData.
                    }
                    this.showReport = true;
                } catch (error) {
                    console.error('Quotation report failed:', error);
                    this.reportData = []; this.showReport = false;
                    this.toastHandler('error', error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Unable to get quotation report.');
                } finally { this.isLoading = false; }
            },
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') { console.log(message); return; }
                Swal.fire({ toast: true, position: 'top-end', icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success', title: message, showConfirmButton: false, timer: 4000, timerProgressBar: true });
            },
        },
        async mounted() {
            if (typeof reportApiBaseUrl !== 'undefined') this.reportApiBaseUrl = reportApiBaseUrl;
            await this.getReportData();
        },
    });
    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();

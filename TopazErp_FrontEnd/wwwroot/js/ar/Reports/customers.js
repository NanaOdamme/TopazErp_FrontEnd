(() => {
    'use strict';
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
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

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};
const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const toLogoDataUri = (logo) => {
    if (!logo || typeof logo !== 'string') return TRANSPARENT_PIXEL;

    const trimmed = logo.trim();

    if (!trimmed) return TRANSPARENT_PIXEL;

    if (trimmed.startsWith('data:')) return trimmed;

    return `data:image/jpeg;base64,${trimmed}`;
};
const today = isoDate(new Date());

const app = Vue.createApp({
    data() {
        return {
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            isLoading: false,
            payload: {},

            reportType: 'summary-report',
            reportApiBaseUrl: '',

            customerGroupId: '',
            customerGroupList: [],
            customerGroupName: '',
            reportData:[],
            reportTitle:'',
            viewerColor: 'blue',
            showReport: false,
            reportPath: '',
            reportHeader:[],
            reportPathConfig: {
                summaryReportPath: '/ReportTemplates/Ar/customers.html',
                customerGroupReport: '/ReportTemplates/Ar/customers.html',
            },
        };
    },

    methods: {
        unwrapList(raw) {
            if (!raw) return [];

            if (Array.isArray(raw)) return raw;

            if (raw.result !== undefined) {
                return this.unwrapList(raw.result);
            }

            if (Array.isArray(raw.items)) return raw.items;
            if (Array.isArray(raw.data)) return raw.data;

            const firstArray = Object.values(raw).find(
                value => Array.isArray(value)
            );

            return firstArray || [];
        },
        async getReportHeader() {
            let title = 'Customers';

            if (this.reportType === 'customer-group') {
                title = `Customers - ${this.customerGroupName}`;
            }
            this.reportTitle = title;

            const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
            const response = await axios.get(url);

            this.reportHeader = response.data?.result || [];
            return this.reportHeader;
        },
        async getReportData() {
            if (this.isLoading) return;

            this.isLoading = true;

            try {
                let url = '/SharedResource/GetCustomers';

                this.reportPath = this.reportPathConfig.summaryReportPath;

                if (this.reportType === 'customer-group') {
                    if (!this.customerGroupId) {
                        this.toastHandler('warning', 'Please select a customer group.');
                        return;
                    }

                    this.reportPath = this.reportPathConfig.customerGroupReport;
                }

                const response = await axios.get(url);

                const header = await this.getReportHeader();

                let reportDetails = this.unwrapList(response.data);

                // Filter customers by selected customer group
                if (this.reportType === 'customer-group') {
                    reportDetails = reportDetails.filter(
                        item => String(item.customerGroupId) === String(this.customerGroupId)
                    );
                }
                const headerObj = Array.isArray(header)
                    ? (header[0] || {})
                    : (header || {})
                if (Array.isArray(reportDetails)) {
                    reportDetails.forEach(row => {
                        row.creditLimit = formatAmount(row.creditLimit);
                    });
                }
                const formattedRows = reportDetails.map((item, index) => ({
                    ...item,
                    rowNumber: index + 1
                }));
                const headerItem = {
                    ...headerObj,
                    companyLogo: toLogoDataUri(headerObj.companyLogo),
                    CurrentDate: today,
                };
                const reportData = [headerItem, ...formattedRows];
                this.reportData = reportData;

                // >>> ADDED: show the report in the PdfViewer.
                this.showReport = reportData.length > 1;

                if (!this.showReport) {
                    this.toastHandler('warning', 'No data found.');
                }
               

            } catch (error) {
                console.error('Report loading failed:', error);

                this.toastHandler(
                    'error',
                    error.response?.data?.message || 'Unable to get report data.'
                );

            } finally {
                this.isLoading = false;
            }
        },
        
        async getCustomerGroups() {
            try {
                const response = await axios.get(
                    '/SharedResource/GetCustomerGroups'
                );

                this.customerGroupList = this.unwrapList(response.data);

            } catch (error) {
                console.error('Customer groups loading failed:', error);

                this.toastHandler(
                    'error',
                    'Unable to get customer groups.'
                );
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
                timerProgressBar: true
            });

        },
    },

    watch: {
        customerGroupId(val) {
            const customerGroupInfo = this.customerGroupList.find(
                item => String(item.id) === String(val)
            );

            this.customerGroupName = customerGroupInfo?.name || '';
            this.getReportData();
        },
    },

    async mounted() {
        await this.getCustomerGroups();
        await this.getReportData();
    }
});

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();
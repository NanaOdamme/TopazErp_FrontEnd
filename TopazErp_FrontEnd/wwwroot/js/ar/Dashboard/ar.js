
(function () {
    'use strict';

    /* ------------------------------------------------------------------
     * Endpoints
     * ---------------------------------------------------------------- */
    const API_URLS = {
        aging: '/Ar/GetAgingSummary',
        invoices: '/Ar/GetInvoices',
        payments: '/Ar/GetPayments',
        quotations: '/Ar/GetQuotations',
        openingBalances: '/Ar/GetOpeningBalances',
        customers: '/SharedResource/GetCustomers'
    };

    /* ------------------------------------------------------------------
     * Look & feel constants (hex, never Tailwind class strings, so the
     * Tailwind scanner only ever has to read the .cshtml file)
     * ---------------------------------------------------------------- */
    const PALETTE = ['#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#f97316'];

    const AGING_TONES = [
        { from: '#34d399', to: '#059669' },   // current  — emerald
        { from: '#38bdf8', to: '#0284c7' },   // bucket 1 — sky
        { from: '#fbbf24', to: '#d97706' },   // bucket 2 — amber
        { from: '#fb7185', to: '#e11d48' }    // bucket 3 — rose
    ];

    // viewBox units are chosen so the chart scales ~1:1 on a wide screen,
    // which keeps the axis labels at their real pixel size
    const CHART = { width: 960, height: 270, top: 20, right: 20, bottom: 36, left: 64 };
    const SPARK = { width: 100, height: 32 };
    const MAX_TREND_POINTS = 12;
    const TIP = { width: 158, height: 58 };

    /* rAF handles live outside the component (Vue does not proxy `_` keys) */
    const rafHandles = {};

    /* ------------------------------------------------------------------
     * Small helpers
     * ---------------------------------------------------------------- */
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };

    const today = isoDate(new Date());

    const monthIndex = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');

    Vue.createApp({
        data() {
            return {
                apiUrls: API_URLS,

                /* filters */
                asOfDate: today,
                agingInterval: 30,

                /* ui state */
                isLoading: true,
                isBusy: false,
                chartReady: false,
                donutReady: false,
                hoverIndex: null,
                hoverSegment: null,
                hoverBucket: null,
                donutMetric: 'count',           // 'count' | 'value'
                trendCurrency: '',              // '' = all currencies
                trendCurrencyLocked: false,     // set once the user picks one
                lastUpdated: null,
                loadIssues: [],

                /* data */
                agingRows: [],
                invoices: [],
                payments: [],
                quotations: [],
                openingBalances: [],
                customers: [],

                /* animated KPI numbers */
                counters: {
                    openInvoices: 0,
                    customers: 0,
                    payments: 0,
                    openingBalances: 0,
                    quotations: 0
                }
            };
        },

        /* ================================================================
         * Computed
         * ============================================================== */
        computed: {

            /* ---------- KPI ---------- */

            // Used by the "Open Invoices" KPI card in the view
            openInvoices() {
                return this.invoices.filter(row => {
                    const balance = this.value(row, ['balance', 'invoiceBalance']);
                    return balance === '' || this.numberValue(balance) > 0;
                });
            },

            /* ---------- aging ---------- */

            agingBuckets() {
                const n = Number(this.agingInterval) || 30;
                const definitions = [
                    { label: 'Current', key: 'currentDay', tone: AGING_TONES[0] },
                    { label: '1–' + n + ' days', key: 'agingFirst', tone: AGING_TONES[1] },
                    { label: (n + 1) + '–' + (n * 2) + ' days', key: 'agingSecond', tone: AGING_TONES[2] },
                    { label: (n * 2 + 1) + '+ days', key: 'agingThird', tone: AGING_TONES[3] }
                ];

                const buckets = definitions.map(item => ({
                    label: item.label,
                    tone: item.tone,
                    count: this.agingRows.filter(row =>
                        this.numberValue(this.value(row, [item.key])) > 0
                    ).length
                }));

                const max = Math.max(1, ...buckets.map(item => item.count));
                const total = buckets.reduce((sum, item) => sum + item.count, 0);

                return buckets.map(item => ({
                    ...item,
                    height: item.count ? Math.max(3, (item.count / max) * 100) : 0,
                    share: total ? (item.count / total) * 100 : 0
                }));
            },

            agingTotal() {
                return this.agingBuckets.reduce((sum, item) => sum + item.count, 0);
            },

            /* ---------- payments: grouped by currencyName ---------- */

            paymentCurrencyGroups() {
                const groups = new Map();

                this.payments.forEach(row => {
                    const name = this.currencyOf(row);
                    const amount = this.numberValue(this.paymentAmount(row));
                    const group = groups.get(name) || { name: name, count: 0, total: 0 };
                    group.count += 1;
                    group.total += amount;
                    groups.set(name, group);
                });

                return Array.from(groups.values())
                    .sort((a, b) => b.count - a.count || b.total - a.total);
            },

            paymentCount() {
                return this.payments.length;
            },

            paymentTotalAmount() {
                return this.payments.reduce((sum, row) => sum + this.numberValue(this.paymentAmount(row)), 0);
            },

            // Donut slices — sized by payment count or by amount received
            donutSegments() {
                const groups = this.paymentCurrencyGroups;
                const byValue = this.donutMetric === 'value';
                const denominator = groups.reduce(
                    (sum, g) => sum + (byValue ? g.total : g.count), 0
                );

                let cursor = 0;

                return groups.map((group, index) => {
                    const metric = byValue ? group.total : group.count;
                    const length = denominator > 0 ? (metric / denominator) * 100 : 0;
                    const gap = groups.length > 1 && length > 4 ? 1.4 : 0;

                    const segment = {
                        name: group.name,
                        count: group.count,
                        total: group.total,
                        metric: metric,
                        share: denominator > 0 ? (metric / denominator) * 100 : 0,
                        color: PALETTE[index % PALETTE.length],
                        offset: cursor,
                        length: this.donutReady ? Math.max(length - gap, 0) : 0
                    };

                    cursor += length;
                    return segment;
                });
            },

            donutCenterValue() {
                if (this.donutMetric === 'value') return this.formatCompact(this.paymentTotalAmount);
                return this.formatCount(this.paymentCount);
            },

            donutCenterLabel() {
                return this.donutMetric === 'value'
                    ? 'Received'
                    : (this.paymentCount === 1 ? 'Payment' : 'Payments');
            },

            hasDonutData() {
                return this.paymentCurrencyGroups.length > 0;
            },

            /* ---------- payments: amount over payment date ---------- */

            trendCurrencies() {
                return this.paymentCurrencyGroups.map(group => group.name);
            },

            trendPayments() {
                if (!this.trendCurrency) return this.payments;
                return this.payments.filter(row => this.currencyOf(row) === this.trendCurrency);
            },

            // one point per calendar month found in the payment date
            trendSeries() {
                const buckets = new Map();

                this.trendPayments.forEach(row => {
                    const date = this.parseDate(this.paymentDate(row));
                    if (!date) return;

                    const key = monthIndex(date);
                    const bucket = buckets.get(key) || {
                        key: key,
                        date: new Date(date.getFullYear(), date.getMonth(), 1),
                        total: 0,
                        count: 0
                    };

                    bucket.total += this.numberValue(this.paymentAmount(row));
                    bucket.count += 1;
                    buckets.set(key, bucket);
                });

                const keys = Array.from(buckets.keys()).sort();
                if (!keys.length) return [];

                // continuous month axis (so gaps read as zero, not as a jump)
                const first = keys[0].split('-').map(Number);
                const last = keys[keys.length - 1].split('-').map(Number);
                const series = [];
                let cursor = new Date(first[0], first[1] - 1, 1);
                const end = new Date(last[0], last[1] - 1, 1);

                while (cursor <= end && series.length < 240) {
                    const key = monthIndex(cursor);
                    const bucket = buckets.get(key);
                    series.push({
                        key: key,
                        label: this.monthLabel(cursor),
                        total: bucket ? bucket.total : 0,
                        count: bucket ? bucket.count : 0
                    });
                    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
                }

                return series.slice(-MAX_TREND_POINTS);
            },

            trendTotal() {
                return this.trendSeries.reduce((sum, item) => sum + item.total, 0);
            },

            trendDelta() {
                const series = this.trendSeries;
                if (series.length < 2) return null;

                const current = series[series.length - 1].total;
                const previous = series[series.length - 2].total;
                if (!previous) return current ? 100 : 0;

                return ((current - previous) / previous) * 100;
            },

            trendDeltaLabel() {
                const delta = this.trendDelta;
                if (delta === null) return '—';
                return (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
            },

            trendPeriodLabel() {
                const series = this.trendSeries;
                if (!series.length) return 'No period';
                if (series.length === 1) return series[0].label;
                return series[0].label + ' – ' + series[series.length - 1].label;
            },

            // full SVG geometry for the hero chart
            trendChart() {
                const series = this.trendSeries;
                const plotWidth = CHART.width - CHART.left - CHART.right;
                const plotHeight = CHART.height - CHART.top - CHART.bottom;
                const baseline = CHART.top + plotHeight;
                const max = this.niceMax(Math.max(...series.map(item => item.total), 0));
                const count = series.length;
                const step = count > 1 ? plotWidth / (count - 1) : 0;

                const points = series.map((item, index) => ({
                    ...item,
                    x: count > 1 ? CHART.left + index * step : CHART.left + plotWidth / 2,
                    y: baseline - (max > 0 ? (item.total / max) * plotHeight : 0)
                }));

                const line = this.smoothPath(points);
                const area = points.length
                    ? line
                    + ' L ' + points[points.length - 1].x.toFixed(2) + ' ' + baseline
                    + ' L ' + points[0].x.toFixed(2) + ' ' + baseline + ' Z'
                    : '';

                const ticks = [0, 0.25, 0.5, 0.75, 1].map(fraction => ({
                    y: baseline - fraction * plotHeight,
                    label: this.formatCompact(max * fraction)
                }));

                const every = Math.ceil(count / 8);
                const xLabels = points
                    .filter((point, index) => count <= 8 || index % every === 0 || index === count - 1)
                    .map(point => ({ x: point.x, label: point.label }));

                return {
                    viewBox: '0 0 ' + CHART.width + ' ' + CHART.height,
                    width: CHART.width,
                    height: CHART.height,
                    pad: { top: CHART.top, right: CHART.right, bottom: CHART.bottom, left: CHART.left },
                    points: points,
                    line: line,
                    area: area,
                    ticks: ticks,
                    xLabels: xLabels
                };
            },

            hoverPoint() {
                const chart = this.trendChart;
                const point = chart.points[this.hoverIndex];
                if (this.hoverIndex === null || !point) return null;

                const tipX = Math.min(
                    Math.max(point.x - TIP.width / 2, 4),
                    CHART.width - TIP.width - 4
                );
                const above = point.y - TIP.height - 16;
                const tipY = above < CHART.top ? point.y + 16 : above;

                return {
                    ...point,
                    tipX: tipX,
                    tipY: tipY,
                    tipWidth: TIP.width,
                    tipHeight: TIP.height,
                    amount: this.formatNumber(point.total),
                    caption: point.label + ' · ' + point.count + (point.count === 1 ? ' payment' : ' payments')
                };
            },

            // tiny sparkline used inside the "Payments" KPI card
            sparkline() {
                const series = this.trendSeries;
                if (series.length < 2) return null;

                const values = series.map(item => item.total);
                const max = Math.max(...values, 0);
                const min = Math.min(...values, 0);
                const span = max - min || 1;
                const step = SPARK.width / (values.length - 1);

                const points = values.map((value, index) => ({
                    x: index * step,
                    y: SPARK.height - 3 - ((value - min) / span) * (SPARK.height - 6)
                }));

                const line = this.smoothPath(points);
                return {
                    line: line,
                    area: line + ' L ' + SPARK.width + ' ' + SPARK.height + ' L 0 ' + SPARK.height + ' Z'
                };
            },

            /* ---------- quotations ---------- */

            recentQuotations() {
                return this.sortRecent(
                    this.quotations,
                    ['quotationDate', 'quoteDate', 'transactionDate', 'documentDate', 'creationTime']
                ).slice(0, 8);
            },

            quotationActivity() {
                return this.recentQuotations.slice(0, 5);
            },

            quotationTotalAmount() {
                return this.quotations.reduce((sum, row) => sum + this.numberValue(this.quotationAmount(row)), 0);
            },

            /* ---------- tables ---------- */

            recentInvoices() {
                return this.sortRecent(
                    this.invoices,
                    ['invoiceDate', 'transactionDate', 'creationTime']
                ).slice(0, 7);
            },

            recentPayments() {
                return this.sortRecent(
                    this.payments,
                    ['transactionDate', 'paymentDate', 'creationTime']
                ).slice(0, 6);
            },

            /* ---------- misc ---------- */

            lastUpdatedLabel() {
                if (!this.lastUpdated) return '—';
                return new Intl.DateTimeFormat(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).format(this.lastUpdated);
            }
        },

        /* ================================================================
         * Watchers
         * ============================================================== */
        watch: {
            // changing the date or interval only affects aging
            asOfDate() { this.loadAging(); },
            agingInterval() { this.loadAging(); },

            // re-draw the hero chart when the currency filter changes
            trendCurrency() {
                this.hoverIndex = null;
                this.chartReady = false;
                requestAnimationFrame(() => { this.chartReady = true; });
            },

            'openInvoices.length'(value) { this.animateCount('openInvoices', value); },
            'customers.length'(value) { this.animateCount('customers', value); },
            'payments.length'(value) { this.animateCount('payments', value); },
            'openingBalances.length'(value) { this.animateCount('openingBalances', value); },
            'quotations.length'(value) { this.animateCount('quotations', value); }
        },

        /* ================================================================
         * Methods
         * ============================================================== */
        methods: {

            /* ---------- record helpers (field names unchanged) ---------- */

            property(row, name) {
                if (!row) return undefined;
                const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
                return row[name] ?? row[pascalName];
            },

            value(row, names) {
                for (const name of names) {
                    const result = this.property(row, name);
                    if (result !== undefined && result !== null && result !== '') return result;
                }
                return '';
            },

            // AR counterpart of a supplier name
            partyName(row) {
                return this.value(row, [
                    'customerName', 'clientName', 'customer', 'accountName',
                    'supplierName', 'vendorName', 'name'
                ]) || '—';
            },

            currencyOf(row) {
                return String(this.value(row, ['currencyName', 'currencyCode']) || 'Unspecified').trim() || 'Unspecified';
            },

            paymentAmount(row) {
                return this.value(row, ['amountToPay', 'amount', 'amountPaid', 'paymentAmount', 'amountReceived']);
            },

            paymentDate(row) {
                return this.value(row, ['transactionDate', 'paymentDate', 'paymentEntryDate', 'creationTime']);
            },

            quotationAmount(row) {
                return this.value(row, ['totalAmount', 'quotationAmount', 'quoteAmount', 'amount', 'netAmount']);
            },

            quotationDate(row) {
                return this.value(row, ['quotationDate', 'quoteDate', 'transactionDate', 'documentDate', 'creationTime']);
            },

            quotationNumber(row) {
                return this.value(row, ['quotationNumber', 'quotationNo', 'quoteNumber', 'quoteNo', 'number', 'reference']);
            },

            rowsFrom(raw) {
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw !== 'object') return [];

                const keys = [
                    'result', 'items', 'data', 'invoices', 'payments', 'balances',
                    'quotations', 'openingBalances', 'arOpeningBalances', 'customers', 'records'
                ];

                for (const key of keys) {
                    const value = this.property(raw, key);
                    if (Array.isArray(value)) return value;
                }

                for (const key of ['result', 'data']) {
                    const nested = this.property(raw, key);
                    if (nested && typeof nested === 'object') {
                        const rows = this.rowsFrom(nested);
                        if (rows.length) return rows;
                    }
                }

                return [];
            },

            async fetchRows(url) {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error('Request failed (' + response.status + ') for ' + url);
                }

                return this.rowsFrom(await response.json());
            },

            async fetchSafely(url, label, issues) {
                try {
                    return await this.fetchRows(url);
                } catch (error) {
                    console.error(label + ' loading error:', error);
                    issues.push(label);
                    return [];
                }
            },

            /* ---------- formatting ---------- */

            numberValue(value) {
                if (value === null || value === undefined || value === '') return 0;
                const parsed = Number(String(value).replace(/,/g, '').replace(/\s/g, ''));
                return Number.isFinite(parsed) ? parsed : 0;
            },

            formatNumber(value) {
                return new Intl.NumberFormat(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(this.numberValue(value));
            },

            formatCount(value) {
                return Math.round(this.numberValue(value)).toLocaleString();
            },

            formatCompact(value) {
                const number = this.numberValue(value);
                const abs = Math.abs(number);
                const scale = (size, suffix) => {
                    const scaled = number / size;
                    const text = Math.abs(scaled) >= 100 ? scaled.toFixed(0) : scaled.toFixed(1);
                    return text.replace(/\.0$/, '') + suffix;
                };

                if (abs >= 1e9) return scale(1e9, 'B');
                if (abs >= 1e6) return scale(1e6, 'M');
                if (abs >= 1e3) return scale(1e3, 'K');
                return this.formatCount(number);
            },

            parseDate(value) {
                if (!value) return null;

                const text = String(value);
                const dotNetDate = text.match(/\/Date\((-?\d+)\)\//);
                let date;

                if (dotNetDate) {
                    date = new Date(Number(dotNetDate[1]));
                } else if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
                    const parts = text.slice(0, 10).split('-').map(Number);
                    date = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    date = new Date(text);
                }

                return Number.isNaN(date.getTime()) ? null : date;
            },

            formatDate(value) {
                if (!value) return '—';
                const date = this.parseDate(value);
                if (!date) return String(value);

                return new Intl.DateTimeFormat(undefined, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }).format(date);
            },

            monthLabel(date) {
                const month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date);
                return month + ' ’' + String(date.getFullYear()).slice(2);
            },

            // small calendar chip: { day: '09', month: 'Nov' }
            dateParts(value) {
                const date = this.parseDate(value);
                if (!date) return { day: '—', month: '' };

                return {
                    day: String(date.getDate()).padStart(2, '0'),
                    month: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date)
                };
            },

            sortRecent(rows, dateKeys) {
                const time = (row) => {
                    const date = this.parseDate(this.value(row, dateKeys));
                    return date ? date.getTime() : 0;
                };
                return rows.slice().sort((a, b) => time(b) - time(a));
            },

            statusText(row) {
                const status = this.value(row, ['status', 'quotationStatus', 'invoiceStatus', 'isPosted', 'posted']);
                if (status === true) return 'Posted';
                if (status === false) return 'Unposted';
                return String(status || '—');
            },

            // 'posted' | 'cancel' | 'pending' — the view maps this to classes.
            // Quotations use wording like Accepted / Declined, so a few extra
            // keywords are treated as positive/negative.
            statusKind(row) {
                const label = this.statusText(row).toLowerCase();
                const negative = ['cancel', 'reject', 'declin', 'void'];
                const positive = ['post', 'accept', 'approv', 'paid', 'won', 'confirm', 'complet'];

                if (negative.some(word => label.includes(word))) return 'cancel';
                if (positive.some(word => label.includes(word)) && !label.includes('unpost')) return 'posted';
                return 'pending';
            },

            hasIssue(label) {
                return this.loadIssues.indexOf(label) !== -1;
            },

            /* ---------- chart helpers ---------- */

            niceMax(value) {
                const max = this.numberValue(value);
                if (max <= 0) return 10;

                const exponent = Math.floor(Math.log10(max));
                const base = Math.pow(10, exponent);
                const normalized = max / base;
                const step = normalized <= 1 ? 1
                    : normalized <= 2 ? 2
                        : normalized <= 2.5 ? 2.5
                            : normalized <= 5 ? 5
                                : 10;

                return step * base;
            },

            smoothPath(points) {
                if (!points.length) return '';
                if (points.length === 1) return 'M ' + points[0].x.toFixed(2) + ' ' + points[0].y.toFixed(2);

                const tension = 0.18;
                let path = 'M ' + points[0].x.toFixed(2) + ' ' + points[0].y.toFixed(2);

                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i - 1] || points[i];
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const p3 = points[i + 2] || p2;

                    const c1x = p1.x + (p2.x - p0.x) * tension;
                    const c1y = p1.y + (p2.y - p0.y) * tension;
                    const c2x = p2.x - (p3.x - p1.x) * tension;
                    const c2y = p2.y - (p3.y - p1.y) * tension;

                    path += ' C ' + c1x.toFixed(2) + ' ' + c1y.toFixed(2)
                        + ', ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2)
                        + ', ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
                }

                return path;
            },

            onTrendHover(event) {
                const points = this.trendChart.points;
                if (!points.length) return;

                const box = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - box.left) / box.width) * CHART.width;

                let index = 0;
                let best = Infinity;

                points.forEach((point, i) => {
                    const distance = Math.abs(point.x - x);
                    if (distance < best) {
                        best = distance;
                        index = i;
                    }
                });

                this.hoverIndex = index;
            },

            /* ---------- KPI count-up ---------- */

            animateCount(key, target) {
                const from = this.numberValue(this.counters[key]);
                const to = this.numberValue(target);

                cancelAnimationFrame(rafHandles[key]);

                if (from === to) {
                    this.counters[key] = to;
                    return;
                }

                const duration = 900;
                const start = performance.now();

                const step = (now) => {
                    const progress = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    this.counters[key] = from + (to - from) * eased;
                    if (progress < 1) rafHandles[key] = requestAnimationFrame(step);
                };

                rafHandles[key] = requestAnimationFrame(step);
            },

            /* ---------- loading ---------- */

            agingUrl() {
                const startDate = encodeURIComponent(this.asOfDate || today);
                const interval = encodeURIComponent(this.agingInterval);
                return this.apiUrls.aging + '?startDate=' + startDate + '&agingInterval=' + interval;
            },

            async loadAging() {
                // ignore out-of-order responses if the filters change quickly
                const token = (this._agingToken = (this._agingToken || 0) + 1);
                const issues = [];
                const rows = await this.fetchSafely(this.agingUrl(), 'Aging summary', issues);
                if (token !== this._agingToken) return;

                this.agingRows = rows;
                this.loadIssues = this.loadIssues.filter(x => x !== 'Aging summary').concat(issues);
            },

            async loadDashboard() {
                if (this.isBusy) return;

                this.isBusy = true;
                this.isLoading = true;

                try {
                    const issues = [];
                    const [agingRows, invoices, payments, quotations, openingBalances, customers] =
                        await Promise.all([
                            this.fetchSafely(this.agingUrl(), 'Aging summary', issues),
                            this.fetchSafely(this.apiUrls.invoices, 'Invoices', issues),
                            this.fetchSafely(this.apiUrls.payments, 'Payments', issues),
                            this.fetchSafely(this.apiUrls.quotations, 'Quotations', issues),
                            this.fetchSafely(this.apiUrls.openingBalances, 'Opening balances', issues),
                            this.fetchSafely(this.apiUrls.customers, 'Customers', issues)
                        ]);

                    this.agingRows = agingRows;
                    this.invoices = invoices;
                    this.payments = payments;
                    this.quotations = quotations;
                    this.openingBalances = openingBalances;
                    this.customers = customers;
                    this.loadIssues = issues;
                    this.lastUpdated = new Date();

                    // default the trend chart to the busiest currency,
                    // but never override a currency the user picked
                    if (!this.trendCurrency && !this.trendCurrencyLocked && this.paymentCurrencyGroups.length) {
                        this.trendCurrency = this.paymentCurrencyGroups[0].name;
                    }

                    // let the DOM paint the empty state first, then animate in
                    requestAnimationFrame(() => {
                        this.chartReady = true;
                        this.donutReady = true;
                    });
                } finally {
                    this.isBusy = false;
                    this.isLoading = false;
                }
            }
        },

        mounted() {
            this.loadDashboard();
        }
    }).mount('#arDashboard');
})();

/* DataGrid — reusable Vue 3 Options API component.
   Requires Vue 3 global build to be loaded first. No demo data or app bootstrapping lives here.
   Load data-grid.css as well as this script. */
(function (global) {
    'use strict';
    if (!global.Vue) throw new Error('DataGrid requires Vue 3 to be loaded before data-grid.js');
    const Vue = global.Vue;
    const { createApp, reactive } = Vue;


    /* ------------------------------------------------------------------ 1. utils */
    const esc = (v) => (v === null || v === undefined ? '' : String(v))
        .replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    const DASH = '<span class="text-slate-300 dark:text-slate-600">—</span>';
    const getIn = (obj, path) => String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    const setIn = (obj, path, val) => {
        const parts = String(path).split('.'); const last = parts.pop(); let t = obj;
        for (const p of parts) { if (typeof t[p] !== 'object' || t[p] === null) t[p] = {}; t = t[p]; }
        t[last] = val;
    };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const debounce = (fn, ms = 250) => { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };
    const uid = (p = 'row') => p + '-' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
    const truncate = (s, n = 60) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
    const toDate = (v) => { if (v instanceof Date) return isNaN(v) ? null : v; if (v === null || v === undefined || v === '') return null;
        const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    const isNil = (v) => v === null || v === undefined || v === '';
    const hasColumnDefault = (column) => column.defaultValue !== undefined || column.default !== undefined;
    const normalizeIds = (ids) => Array.isArray(ids)
        ? Array.from(new Set(ids.filter((id) => id !== null && id !== undefined).map(String))) : [];
    const resolveColumnDefault = (column, row) => {
        const value = column.defaultValue !== undefined ? column.defaultValue : column.default;
        return typeof value === 'function' ? value.call(column, row, column) : value;
    };
    const dateInputValue = (value) => {
        if (isNil(value)) return '';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const date = toDate(value);
        if (!date) return '';
        const pad = (part) => String(part).padStart(2, '0');
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    };
    const LOCALE = 'en-GH';
    const fmtNum = (v, digits = 0) => isNil(v) || isNaN(v) ? '' : new Intl.NumberFormat(LOCALE, { minimumFractionDigits:digits, maximumFractionDigits:digits }).format(Number(v));
    const fmtNumber = (v, col = {}) => {
        if (isNil(v) || isNaN(v)) return '';
        const options = {};
        const format = col.format;
        if (format && typeof format === 'object' && !Array.isArray(format)) Object.assign(options, format);
        else if (typeof format === 'string') {
            switch (format.toLowerCase()) {
                case 'integer': options.minimumFractionDigits = 0; options.maximumFractionDigits = 0; break;
                case 'currency': options.style = 'currency'; options.currency = col.currency || 'GHS'; break;
                case 'percent': options.style = 'percent'; break;
                case 'compact': options.notation = 'compact'; break;
                case 'number': case 'decimal': break;
            }
        }
        const rawDecimals = col.decimals ?? col.digits;
        const parsedDecimals = rawDecimals === undefined || rawDecimals === null || rawDecimals === '' ? null : Number(rawDecimals);
        const decimals = Number.isFinite(parsedDecimals) ? Math.max(0, Math.min(20, Math.floor(parsedDecimals))) : null;
        if (decimals !== null) {
            options.minimumFractionDigits = decimals;
            options.maximumFractionDigits = decimals;
        }
        const hasFractionSetting = ['minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits']
            .some((key) => options[key] !== undefined);
        const styleUsesItsOwnPrecision = options.style === 'currency' || options.style === 'percent' || options.notation === 'compact';
        if (decimals === null && !hasFractionSetting && !styleUsesItsOwnPrecision) {
            options.minimumFractionDigits = 0;
            options.maximumFractionDigits = 0;
        }
        if (options.style === 'currency' && !options.currency) options.currency = col.currency || 'GHS';
        try { return new Intl.NumberFormat(col.locale || LOCALE, options).format(Number(v)); }
        catch (e) { return fmtNum(v, decimals === null ? 0 : decimals); }
    };
    const fmtMoney = (v, cur = 'GHS') => { try { return new Intl.NumberFormat(LOCALE, { style:'currency', currency:cur, maximumFractionDigits:2 }).format(Number(v)); }
    catch (e) { return fmtNum(v, 2); } };
    const fmtDate = (v, withTime = false) => { const d = toDate(v); if (!d) return ''; return d.toLocaleDateString(LOCALE, { day:'2-digit', month:'short', year:'numeric' }) +
        (withTime ? ' · ' + d.toLocaleTimeString(LOCALE, { hour:'2-digit', minute:'2-digit' }) : ''); };
    const hl = (text, needle) => {
        const t = esc(text); if (!needle) return t;
        const n = esc(needle); const i = t.toLowerCase().indexOf(n.toLowerCase());
        if (i < 0) return t;
        return t.slice(0, i) + '<mark class="dt-hl">' + t.slice(i, i + n.length) + '</mark>' + t.slice(i + n.length);
    };

    /* ------------------------------------------------- 2. colours / cell atoms */
    const COLOR_CLASSES = {
        blue:'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
        indigo:'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30',
        violet:'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30',
        emerald:'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
        amber:'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
        orange:'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30',
        rose:'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
        pink:'bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:ring-pink-500/30',
        teal:'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30',
        cyan:'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30',
        slate:'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30'
    };
    const COLOR_KEYS = Object.keys(COLOR_CLASSES);
    const DOT_CLASSES = { blue:'bg-blue-500', indigo:'bg-indigo-500', violet:'bg-violet-500', emerald:'bg-emerald-500', amber:'bg-amber-500',
        orange:'bg-orange-500', rose:'bg-rose-500', pink:'bg-pink-500', teal:'bg-teal-500', cyan:'bg-cyan-500', slate:'bg-slate-400' };
    const hashStr = (s) => { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
    const optionList = (col) => (col.options || []).map((option) => {
        if (!option || typeof option !== 'object') return { value:option, label:option };
        const value = col.value ? getIn(option, col.value) : (option.value !== undefined ? option.value : option);
        const label = col.display ? getIn(option, col.display) : (option.label !== undefined ? option.label : value);
        return Object.assign({}, option, { value, label });
    });
    const findOption = (col, value) => optionList(col).find((o) => String(o.value) === String(value));
    const optionLabel = (col, value) => { const o = findOption(col, value); return o ? (o.label ?? o.value) : value; };
    const colorOf = (col, value) => {
        const o = findOption(col, value);
        if (o && o.color) return o.color;
        if (isNil(value)) return 'slate';
        return COLOR_KEYS[hashStr(value + (col.key || '')) % COLOR_KEYS.length];
    };
    const badge = (value, color) => isNil(value) ? DASH :
        '<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' +
        (COLOR_CLASSES[color] || COLOR_CLASSES.slate) + '">' + esc(value) + '</span>';
    const dotPill = (value, color) => isNil(value) ? DASH :
        '<span class="inline-flex items-center gap-1.5 text-sm"><span class="h-1.5 w-1.5 rounded-full ' + (DOT_CLASSES[color] || DOT_CLASSES.slate) + '"></span>' + esc(value) + '</span>';
    const boolIcon = (v) => v
        ? '<span class="inline-grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" title="Yes"><i class="bi bi-check-lg text-[11px]"></i></span>'
        : '<span class="inline-grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700/50 dark:text-slate-400" title="No"><i class="bi bi-dash text-[11px]"></i></span>';
    const bar = (v) => { const p = Math.max(0, Math.min(100, Number(v) || 0));
        const tone = p >= 80 ? 'bg-emerald-500' : p >= 45 ? 'bg-primary-500' : p >= 20 ? 'bg-amber-500' : 'bg-rose-500';
        return '<span class="dt-bar flex items-center gap-2"><span class="h-1.5 w-full max-w-[120px] rounded-full bg-slate-200 dark:bg-slate-700"><span class="block h-full rounded-full ' + tone + '" style="width:' + p + '%"></span></span>' +
            '<span class="tabular-nums text-xs font-medium text-slate-500 dark:text-slate-400">' + p + '%</span></span>'; };
    const stars = (v) => { const n = Math.round(Number(v) || 0); let s = '<span class="whitespace-nowrap text-amber-400">';
        for (let i = 1; i <= 5; i++) s += '<i class="bi bi-star' + (i <= n ? '-fill' : '') + ' text-xs"></i>'; return s + '</span>'; };
    const tagsHtml = (v) => !Array.isArray(v) || !v.length ? DASH : '<span class="flex flex-wrap gap-1">' +
        v.slice(0, 3).map((t) => '<span class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">' + esc(t) + '</span>').join('') +
        (v.length > 3 ? '<span class="rounded-md bg-primary-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-700 ring-1 ring-inset ring-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/30" title="' + esc(v.slice(3).join(', ')) + '">+' + (v.length - 3) + '</span>' : '') + '</span>';

    /* ------------------------------------------------- 3. column type registry */
    const TYPES = {
        text:    { kind:'text',   input:'text',     cmp:'string', cell: (v, c, r, ctx) => isNil(v) ? DASH : hl(v, ctx.search) },
        textarea:{ kind:'text',   input:'textarea', cmp:'string', wrap:true, minWidth:220,
            cell: (v, c, r, ctx) => isNil(v) ? DASH : '<span class="line-clamp-2" title="' + esc(v) + '">' + hl(truncate(v, 90), ctx.search) + '</span>' },
        email:   { kind:'text',   input:'email',    cmp:'string',
            cell: (v) => isNil(v) ? DASH : '<a class="text-primary-700 hover:underline dark:text-primary-300" href="mailto:' + esc(v) + '">' + esc(v) + '</a>' },
        phone:   { kind:'text',   input:'tel',      cmp:'string',
            cell: (v) => isNil(v) ? DASH : '<a class="tabular-nums text-primary-700 hover:underline dark:text-primary-300" href="tel:' + esc(String(v).replace(/[^\d+]/g, '')) + '">' + esc(v) + '</a>' },
        url:     { kind:'text',   input:'url',      cmp:'string',
            cell: (v) => isNil(v) ? DASH : '<a class="inline-flex items-center gap-1 text-primary-700 hover:underline dark:text-primary-300" href="' + esc(v) + '" target="_blank" rel="noopener">' +
                esc(String(v).replace(/^https?:\/\//, '')) + '<i class="bi bi-box-arrow-up-right text-[10px] opacity-70"></i></a>' },
        number:  { kind:'number', input:'number',   cmp:'number', align:'right', agg:'sum',
            cell: (v, c) => isNil(v) ? DASH : '<span class="tabular-nums">' + fmtNumber(v, c) + '</span>' },
        currency:{ kind:'number', input:'number',   cmp:'number', align:'right', agg:'sum', step:'0.01',
            cell: (v, c) => isNil(v) ? DASH : '<span class="tabular-nums font-medium">' + fmtMoney(v, c.currency || 'GHS') + '</span>' },
        percent: { kind:'number', input:'number',   cmp:'number', align:'right', agg:'avg', min:0, max:100,
            cell: (v) => isNil(v) ? DASH : '<span class="tabular-nums">' + fmtNum(v, 0) + '%</span>' },
        progress:{ kind:'number', input:'number',   cmp:'number', min:0, max:100, agg:'avg', minWidth:170, cell:(v) => isNil(v) ? DASH : bar(v) },
        rating:  { kind:'number', input:'number',   cmp:'number', min:0, max:5, agg:'avg', cell:(v) => isNil(v) ? DASH : stars(v) },
        date:    { kind:'date',   input:'date',     cmp:'date',
            cell: (v) => { const d = toDate(v); return d ? '<span class="tabular-nums whitespace-nowrap">' + fmtDate(d) + '</span>' : DASH; } },
        datetime:{ kind:'date',   input:'datetime-local', cmp:'date',
            cell: (v) => { const d = toDate(v); return d ? '<span class="tabular-nums whitespace-nowrap">' + fmtDate(d, true) + '</span>' : DASH; } },
        time:    { kind:'text',   input:'time',     cmp:'string', cell:(v) => isNil(v) ? DASH : '<span class="tabular-nums">' + esc(v) + '</span>' },
        boolean: { kind:'bool',   input:'checkbox', cmp:'bool', align:'center', agg:'true', cell:(v) => boolIcon(v) },
        badge:   { kind:'enum',   input:'select',   cmp:'string', cell:(v, c) => badge(optionLabel(c, v), colorOf(c, v)) },
        select:  { kind:'enum',   input:'select',   cmp:'string', cell:(v, c) => dotPill(optionLabel(c, v), colorOf(c, v)) },
        tags:    { kind:'array',  input:'tags',     cmp:'string', wrap:true, minWidth:200, cell:(v) => tagsHtml(v) },
        avatar:  { kind:'text',   input:'text',     cmp:'string', minWidth:230,
            cell: (v, c, r) => {
                if (isNil(v)) return DASH;
                const color = COLOR_KEYS[hashStr(String(v)) % 8];
                const sub = c.subtitleKey ? getIn(r, c.subtitleKey) : '';
                const img = c.imageKey ? getIn(r, c.imageKey) : '';
                const face = img ? '<img src="' + esc(img) + '" alt="" class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700">'
                    : '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ring-inset ' + COLOR_CLASSES[color] + '">' +
                    esc(String(v).split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()) + '</span>';
                return '<span class="flex min-w-0 items-center gap-2.5">' + face + '<span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">' +
                    esc(v) + '</span>' + (sub ? '<span class="block truncate text-xs text-slate-500 dark:text-slate-400">' + esc(sub) + '</span>' : '') + '</span></span>';
            } },
        image:   { kind:'text',   input:'url',      cmp:'string', align:'center',
            cell: (v) => isNil(v) ? DASH : '<img src="' + esc(v) + '" alt="" class="mx-auto h-9 w-14 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700">' },
        color:   { kind:'text',   input:'color',    cmp:'string',
            cell: (v) => isNil(v) ? DASH : '<span class="inline-flex items-center gap-2"><span class="h-4 w-4 rounded-full ring-1 ring-black/10" style="background:' + esc(v) + '"></span><span class="font-mono text-xs">' + esc(v) + '</span></span>' },
        actions: { kind:'none',   input:null,       cmp:null }
    };
    const typeOf = (col) => TYPES[col.type] || TYPES.text;

    /* ------------------------------------------------- 4. toast + confirm services */
    const toasts = reactive([]);
    let toastSeq = 0;
    function pushToast(opts) {
        const id = ++toastSeq;
        const t = Object.assign({ id, type:'success', duration: 5000, title:'', body:'', action:null, theme:'#2563eb' }, opts);
        toasts.push(t);
        if (t.duration) setTimeout(() => dropToast(id), t.duration);
        return id;
    }
    function dropToast(id) { const i = toasts.findIndex((t) => t.id === id); if (i >= 0) toasts.splice(i, 1); }

    const confirms = reactive([]);
    let confirmSeq = 0;
    function askConfirm(opts) {
        return new Promise((resolve) => {
            const id = ++confirmSeq;
            confirms.push(Object.assign({ id, danger:false, okText:'Confirm', cancelText:'Cancel', theme:'#2563eb' }, opts, {
                resolve: (v) => { const i = confirms.findIndex((c) => c.id === id); if (i >= 0) confirms.splice(i, 1); resolve(v); }
            }));
        });
    }

    /* ========================================================== 5. <toast-host> */
    const ToastHost = {
        name: 'ToastHost',
        setup() { return { toasts, dropToast }; },
        methods: {
            tone(t) {
                return ({ success:{ i:'bi-check-circle-fill', c:'text-emerald-500', r:'ring-emerald-200 dark:ring-emerald-500/30' },
                        danger:{ i:'bi-x-circle-fill', c:'text-rose-500', r:'ring-rose-200 dark:ring-rose-500/30' },
                        info:{ i:'bi-info-circle-fill', c:'text-primary-500', r:'ring-primary-200 dark:ring-primary-500/30' } })[t] ||
                    ({ i:'bi-check-circle-fill', c:'text-emerald-500', r:'ring-emerald-200' });
            }
        },
        template: `
    <teleport to="#dt-toast-host">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id" data-dt-theme-scope :style="{ '--dt-theme': t.theme || '#2563eb' }" class="pointer-events-auto flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-card ring-1 dark:bg-slate-900" :class="tone(t.type).r">
          <i class="bi mt-0.5 text-base" :class="[tone(t.type).i, tone(t.type).c]"></i>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t.title }}</p>
            <p v-if="t.body" class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ t.body }}</p>
          </div>
          <button v-if="t.action" class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10" data-toast-action @click="t.action.onClick(); dropToast(t.id)">{{ t.action.label }}</button>
          <button class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" data-toast-close @click="dropToast(t.id)"><i class="bi bi-x-lg text-xs"></i></button>
        </div>
      </transition-group>
    </teleport>`
    };

    /* ======================================================== 6. <confirm-host> */
    const ConfirmHost = {
        name: 'ConfirmHost',
        setup() { return { confirms }; },
        methods: { onKey(e, c) { if (e.key === 'Escape') c.resolve(false); if (e.key === 'Enter') c.resolve(true); } },
        template: `
    <teleport to="#dt-modal-host">
      <transition-group name="fade">
        <div v-for="c in confirms" :key="c.id" data-dt-theme-scope :style="{ '--dt-theme': c.theme || '#2563eb' }" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" @click="c.resolve(false)"></div>
          <div class="dt-pop relative w-full max-w-md rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10" role="alertdialog" aria-modal="true" tabindex="-1" @keydown="onKey($event, c)" ref="dlg">
            <div class="flex items-start gap-3">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full" :class="c.danger ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300'">
                <i class="bi text-lg" :class="c.danger ? 'bi-exclamation-triangle' : 'bi-question-lg'"></i>
              </span>
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ c.title }}</h3>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ c.message }}</p>
              </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
              <button data-cancel class="h-9 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" @click="c.resolve(false)">{{ c.cancelText }}</button>
              <button data-ok class="h-9 rounded-lg px-3.5 text-sm font-semibold text-white shadow-sm" :class="c.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary-600 hover:bg-primary-700'" @click="c.resolve(true)">{{ c.okText }}</button>
            </div>
          </div>
        </div>
      </transition-group>
    </teleport>`
    };

    /* ==================================================== 7. <data-grid-pager> */
    const DataGridPager = {
        name: 'DataGridPager',
        props: { page: Number, pageSize: Number, total: Number, pageSizes: Array, loading: Boolean },
        emits: ['update:page', 'update:pageSize'],
        computed: {
            pages() { return Math.max(1, Math.ceil(this.total / this.pageSize)); },
            from() { return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1; },
            to() { return Math.min(this.page * this.pageSize, this.total); },
            numbers() {
                const out = [];
                for (let p = 1; p <= this.pages; p++) {
                    if (p === 1 || p === this.pages || Math.abs(p - this.page) <= 1) out.push(p);
                    else if (out[out.length - 1] !== '…') out.push('…');
                }
                return out;
            }
        },
        methods: {
            go(p) { const next = Math.max(1, Math.min(this.pages, p)); if (next !== this.page) this.$emit('update:page', next); },
            cls(p) { return p === this.page
                ? 'grid h-8 min-w-8 place-items-center rounded-lg border border-primary-600 bg-primary-600 px-2 text-sm font-medium text-white shadow-sm tabular-nums'
                : 'grid h-8 min-w-8 place-items-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-500 transition tabular-nums hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'; }
        },
        template: `
    <div class="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row dark:border-slate-700" data-pager>
      <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Showing <b class="tabular-nums text-slate-700 dark:text-slate-200">{{ from }}–{{ to }}</b> of <b class="tabular-nums text-slate-700 dark:text-slate-200">{{ total }}</b></span>
        <span class="hidden items-center gap-1.5 sm:flex"><span class="text-slate-400">Rows</span>
          <select :value="pageSize" data-page-size @change="$emit('update:pageSize', Number($event.target.value))"
            class="rounded-lg border-slate-300 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
          </select>
        </span>
        <span v-if="pages > 1" class="hidden items-center gap-1.5 md:flex"><span class="text-slate-400">Go to</span>
          <input type="number" min="1" :max="pages" :value="page" data-goto @change="go(Number($event.target.value))"
            class="w-14 rounded-lg border-slate-300 bg-white px-2 py-1 text-xs tabular-nums focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button :class="cls(1)" :disabled="page===1" data-action="page" :data-value="1" title="First" @click="go(1)"><i class="bi bi-chevron-double-left text-xs"></i></button>
        <button :class="cls(page-1)" :disabled="page===1" data-action="page" :data-value="page-1" title="Previous" @click="go(page-1)"><i class="bi bi-chevron-left text-xs"></i></button>
        <template v-for="p in numbers" :key="p">
          <span v-if="p==='…'" class="grid h-8 w-8 place-items-center text-slate-400">…</span>
          <button v-else :class="cls(p)" data-action="page" :data-value="p" :aria-current="p===page ? 'page' : 'false'" @click="go(p)">{{ p }}</button>
        </template>
        <button :class="cls(page+1)" :disabled="page===pages" data-action="page" :data-value="page+1" title="Next" @click="go(page+1)"><i class="bi bi-chevron-right text-xs"></i></button>
        <button :class="cls(pages)" :disabled="page===pages" data-action="page" :data-value="pages" title="Last" @click="go(pages)"><i class="bi bi-chevron-double-right text-xs"></i></button>
      </div>
    </div>`
    };

    /* ===================================================== 8. <data-grid-form> */
    const DataGridForm = {
        name: 'DataGridForm',
        props: { columns: { type: Array, required: true }, row: { type: Object, default: null }, mode: { type: String, default: 'create' },
            itemLabel: { type: String, default: 'record' }, parentLabel: { type: String, default: '' },
            theme: { type: String, default: '#2563eb' }, rowDisabled: { type: Function, default: null } },
        emits: ['submit', 'close'],
        data() { return { values: {}, errors: {} }; },
        created() { this.build(); },
        computed: {
            isEdit() { return this.mode === 'update'; },
            isReadOnly() { return this.isEdit && typeof this.rowDisabled === 'function' && !!this.rowDisabled(this.row); },
            themeStyle() { return { '--dt-theme': this.theme || '#2563eb' }; }
        },
        methods: {
            t: typeOf,
            optionList(c) { return optionList(c); },
            label(c) { return c.label ?? c.key; },
            isDisabled(c) {
                if (this.isReadOnly) return true;
                return typeof c.disabled === 'function' ? !!c.disabled(this.row, this.mode, c) : c.disabled === true;
            },
            inputStep(c) {
                if (c.step !== undefined) return c.step;
                if (typeOf(c).step !== undefined) return typeOf(c).step;
                const rawDigits = c.decimals ?? c.digits;
                if (rawDigits === undefined || rawDigits === null || rawDigits === '' || !Number.isFinite(Number(rawDigits))) return 'any';
                const digits = Math.max(0, Math.min(20, Math.floor(Number(rawDigits))));
                return String(Math.pow(10, -digits));
            },
            idOf(c) { return 'f-' + c.key.replace(/\./g, '-'); },
            rawValue(c) {
                const t = typeOf(c);
                let v = this.row ? getIn(this.row, c.key)
                    : (hasColumnDefault(c) ? resolveColumnDefault(c, this.row) : (t.input === 'checkbox' ? false : ''));
                if (t.input === 'date') v = dateInputValue(v);
                if (t.input === 'tags') return Array.isArray(v) ? v.join(', ') : (v ?? '');
                if (t.input === 'checkbox') return !!v;
                return v ?? '';
            },
            build() { const v = {}; this.columns.forEach((c) => { v[c.key] = this.rawValue(c); }); this.values = v; this.errors = {}; },
            /* form -> typed value */
            parse(c) {
                const t = typeOf(c); let v = this.values[c.key];
                if (t.input === 'tags') return String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
                if (t.input === 'checkbox') return !!v;
                if (t.input === 'number') return v === '' || v === null ? null : Number(v);
                if (c.key.includes('.') && v !== '') { /* keep dotted paths as strings */ }
                return v;
            },
            validate(c, val) {
                if (c.required && typeOf(c).input !== 'checkbox' && (val === '' || val === null || (Array.isArray(val) && !val.length)))
                    return this.label(c) + ' is required.';
                const t = typeOf(c);
                if ((t.input === 'number') && val !== null && val !== '' && !isNaN(val)) {
                    if (c.min !== undefined && Number(val) < c.min) return 'Must be at least ' + c.min + '.';
                    if (c.max !== undefined && val > c.max) return 'Must be at most ' + c.max + '.';
                }
                if (t.input === 'email' && val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) return 'Enter a valid email address.';
                if (c.pattern && val && !new RegExp(c.pattern).test(val)) return c.patternMessage || 'Invalid format.';
                if (typeof c.validate === 'function') { const r = c.validate(val, this.row); if (r !== true && r) return r; }
                return '';
            },
            submit() {
                if (this.isReadOnly) return;
                const data = {}; const errors = {}; let firstBad = null;
                this.columns.forEach((c) => {
                    const val = this.parse(c);
                    const err = this.isDisabled(c) ? '' : this.validate(c, val);
                    if (err) { errors[c.key] = err; firstBad = firstBad || this.idOf(c); }
                    setIn(data, c.key, val);
                });
                this.errors = errors;
                if (firstBad) {
                    pushToast({ theme:this.theme, type:'danger', title:'Please fix the highlighted fields' });
                    const el = document.getElementById(firstBad); if (el && el.focus) el.focus();
                    return;
                }
                const flat = {};
                Object.keys(data).forEach((k) => {
                    const v = data[k];
                    if (v && typeof v === 'object' && !Array.isArray(v)) Object.keys(v).forEach((kk) => (flat[k + '.' + kk] = v[kk]));
                    else flat[k] = v;
                });
                this.$emit('submit', flat);
            }
        },
        template: `
    <teleport to="#dt-modal-host">
      <div data-dt-theme-scope :style="themeStyle" class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <div class="dt-fade fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]" @click="$emit('close')"></div>
        <form class="dt-pop relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10" novalidate @submit.prevent="submit">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                <i class="bi" :class="isEdit ? 'bi-pencil-square' : 'bi-plus-lg'"></i>
              </span>
              <div>
                <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ isEdit ? 'Edit ' + itemLabel : 'New ' + itemLabel }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ isReadOnly ? 'This posted record is read-only.' : (isEdit ? (row && row.name ? String(row.name) : 'Update the details below') : (parentLabel || 'Fill in the details below.')) }}</p>
              </div>
            </div>
            <button type="button" class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" @click="$emit('close')"><i class="bi bi-x-lg text-sm"></i></button>
          </div>

          <div class="grid max-h-[62vh] grid-cols-1 gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
            <div v-for="c in columns" :key="c.key" :data-field="c.key"
                 :class="(t(c).wrap || t(c).input === 'textarea' || t(c).input === 'tags') ? 'sm:col-span-2' : ''">
              <label :for="idOf(c)" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {{ label(c) }} <span v-if="c.required" class="text-rose-500">*</span>
              </label>

              <!-- checkbox -->
              <label v-if="t(c).input === 'checkbox'" class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" :class="isDisabled(c) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">
                <input :id="idOf(c)" v-model="values[c.key]" type="checkbox" :disabled="isDisabled(c)" class="dt-check h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                {{ c.checkboxLabel || 'Yes, active' }}
              </label>

              <!-- textarea -->
              <textarea v-else-if="t(c).input === 'textarea'" :id="idOf(c)" v-model="values[c.key]" rows="3" :disabled="isDisabled(c)"
                class="w-full rounded-lg border-slate-300 bg-white text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"></textarea>

              <!-- select -->
              <select v-else-if="t(c).input === 'select'" :id="idOf(c)" v-model="values[c.key]" :disabled="isDisabled(c)"
                class="w-full rounded-lg border-slate-300 bg-white text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <option value="">— Select —</option>
                <option v-for="o in optionList(c)" :key="String(o.value)" :value="o.value">
                  {{ o.label ?? o.value }}
                </option>
              </select>

              <!-- number / currency -->
              <div v-else-if="t(c).input === 'number'" class="relative">
                <input :id="idOf(c)" v-model="values[c.key]" type="number" :step="inputStep(c)" :min="c.min" :max="c.max" :disabled="isDisabled(c)"
                  class="w-full rounded-lg border-slate-300 bg-white text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  :class="[c.type === 'currency' ? 'pl-12' : '', isDisabled(c) ? 'cursor-not-allowed opacity-60' : '']">
                <span v-if="c.type === 'currency'" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{{ c.currencySymbol || 'GH₵' }}</span>
              </div>

              <!-- everything else (text, email, tel, url, date, datetime, time, color, tags) -->
              <input v-else :id="idOf(c)" v-model="values[c.key]" :type="t(c).input" :disabled="isDisabled(c)"
                class="w-full rounded-lg border-slate-300 bg-white text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                :placeholder="t(c).input === 'tags' ? 'Comma separated, e.g. Vue, Tailwind' : (c.placeholder || '')">

              <p v-if="c.help" class="mt-1 text-[11px] text-slate-400">{{ c.help }}</p>
              <p v-if="errors[c.key]" class="mt-1 text-[11px] font-medium text-rose-500" data-error>{{ errors[c.key] }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-700 dark:bg-slate-950/50">
            <p class="text-[11px] text-slate-400"><span class="text-rose-500">*</span> required fields</p>
            <div class="flex gap-2">
              <button type="button" class="h-9 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" @click="$emit('close')">Cancel</button>
              <button type="submit" :disabled="isReadOnly" class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                <i class="bi bi-check-lg"></i>{{ isReadOnly ? 'Read only' : (isEdit ? 'Save changes' : 'Create') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </teleport>`
    };

    /* =========================================================== 9. <data-grid> */
    const DataGrid = {
        name: 'DataGrid',
        components: { DataGridPager, DataGridForm },
        props: {
            columns: { type: Array, required: true },
            data: { type: Array, default: () => [] },
            child: { type: Object, default: null },         // { key, title, columns, child }
            rowId: { type: String, default: 'id' },
            groupHeader: { type: String, default: '' }, // column/property key used to group visible rows
            rowDisabled: { type: Function, default: null }, // return true for rows that cannot be selected/edited/deleted
            labelKey: { type: String, default: 'name' },
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            pageSize: { type: Number, default: 10 },
            pageSizes: { type: Array, default: () => [5, 10, 25, 50, 100] },
            selectable: { type: Boolean, default: true },
            selectedIds: { type: Array, default: () => [] },
            actions: { type: Boolean, default: true },
            searchable: { type: Boolean, default: true },
            filterRow: { type: Boolean, default: false },
            resizable: { type: Boolean, default: true },
            aggregates: { type: Boolean, default: true },
            expandAll: { type: Boolean, default: true },
            addButton: { type: Boolean, default: true }, // legacy visibility prop; use allowAdd for CRUD permissions
            editButton: { type: Boolean, default: true }, // legacy visibility prop; use allowEdit for CRUD permissions
            deleteButton: { type: Boolean, default: true }, // legacy visibility prop; use allowDelete for CRUD permissions
            allowAdd: { type: Boolean, default: true },
            allowEdit: { type: Boolean, default: true },
            allowDelete: { type: Boolean, default: true },
            density: { type: String, default: 'cozy' },
            theme: { type: String, default: '#2563eb' }, // any valid CSS color; becomes the table's primary colour
            path: { type: Array, default: () => [] },
            maxHeight: { type: String, default: '620px' },
            emptyTitle: { type: String, default: 'Nothing here yet' },
            emptyMessage: { type: String, default: 'Try adjusting your search or filters.' },
            emptyIcon: { type: String, default: 'bi-inbox' },
            loading: { type: Boolean, default: false },
            skeletonRows: { type: Number, default: 6 },
            serverSide: { type: Boolean, default: false },
            serverTotal: { type: Number, default: 0 },
            itemLabel: { type: String, default: 'record' },
            itemLabelPlural: { type: String, default: 'records' },
            addLabel: { type: String, default: 'New record' },
            storageKey: { type: String, default: null },
            level: { type: Number, default: 0 },
            initialState: { type: Object, default: null },
            columnToggle: { type: Boolean, default: true },
            densityToggle: { type: Boolean, default: true },
            exportMenu: { type: Boolean, default: true },
            refreshButton: { type: Boolean, default: true },
            striped: { type: Boolean, default: false },
            defaultSort: { type: Array, default: () => [] },
            stickyHeader: { type: Boolean, default: true },
            autoAdd: { type: Boolean, default: false },  // open the create form on mount (used by "add first child")
            parentLabel: { type: String, default: '' }   // subtitle shown in the create form of a nested grid
        },
        emits: ['create', 'update', 'delete', 'change', 'request', 'ui', 'toast', 'selection-change', 'update:selectedIds'],
        data() {
            const prefs = this.readPrefs();
            const s = this.initialState || {};
            return {
                search: s.search || '',
                page: s.page || 1,
                size: s.pageSize || prefs.pageSize || this.pageSize,
                sorts: s.sorts ? clone(s.sorts) : clone(this.defaultSort || []),
                selected: normalizeIds(this.selectedIds), // controlled-capable array of selected row ids
                collapsedGroups: [],
                expanded: s.expanded || [],
                widths: Object.assign({}, prefs.widths, s.widths || {}),
                filters: s.filters || {},
                hidden: prefs.hidden || this.columns.filter((c) => c.hidden).map((c) => c.key),
                densityValue: prefs.density || this.density,
                showFilters: this.filterRow,
                openMenu: null,
                form: { open: false, mode: 'create', row: null },
                childUi: {},                  // per child row: { search, page, sorts, widths }
                childAddRequest: null,        // row id whose nested grid should open its create form
                loadingLocal: false,
                rowsLocal: [],
                totalLocal: this.serverTotal || 0,
                flashId: null
            };
        },
        created() {
            this.emitUi();
            if (this.autoAdd) this.$nextTick(() => this.consumeAutoAdd());
        },
        computed: {
            nested() { return this.level > 0; },
            isLoading() { return this.loading || this.loadingLocal; },
            rows() { return this.serverSide ? this.rowsLocal : this.data; },
            columnsPlain() { return this.columns.filter((c) => c.type !== 'actions' && !c.internal); },
            visibleCols() { return this.columnsPlain.filter((c) => !this.hidden.includes(c.key)); },
            searchableKeys() { return this.columnsPlain.filter((c) => c.searchable !== false).map((c) => c.key); },
            hasChildSchema() { return !!(this.child && this.child.key); },
            showExpander() { return this.hasChildSchema; },
            canAdd() { return this.allowAdd && this.addButton; },
            canEdit() { return this.allowEdit && this.editButton; },
            canDelete() { return this.allowDelete && this.deleteButton; },
            showActionsColumn() { return this.actions && (this.canEdit || this.canDelete); },
            editableCols() { return this.columnsPlain.filter((c) => !this.hidden.includes(c.key) && c.editable !== false && typeOf(c).input); },
            themeStyle() { return { '--dt-theme': this.theme || '#2563eb' }; },
            filtered() {
                let out = this.rows.slice();
                const q = (this.search || '').trim().toLowerCase();
                if (q) out = out.filter((r) => this.searchableKeys.some((k) => {
                    const v = getIn(r, k);
                    return Array.isArray(v) ? v.join(' ').toLowerCase().includes(q) : String(v ?? '').toLowerCase().includes(q);
                }));
                Object.entries(this.filters).forEach(([key, f]) => {
                    const col = this.columnsPlain.find((c) => c.key === key); if (!col) return;
                    out = out.filter((r) => this.matchFilter(getIn(r, key), col, f));
                });
                return out;
            },
            sorted() {
                if (!this.sorts.length) return this.filtered;
                const specs = this.sorts.map((s) => ({ s, col: this.columnsPlain.find((c) => c.key === s.key) })).filter((x) => x.col);
                return this.filtered.slice().sort((a, b) => {
                    for (const { s, col } of specs) {
                        const t = typeOf(col); const av = getIn(a, col.key), bv = getIn(b, col.key);
                        let r = 0;
                        if (isNil(av) && isNil(bv)) r = 0; else if (isNil(av)) r = 1; else if (isNil(bv)) r = -1;
                        else if (t.cmp === 'number') r = Number(av) - Number(bv);
                        else if (t.cmp === 'date') r = (toDate(av)?.getTime() || 0) - (toDate(bv)?.getTime() || 0);
                        else if (t.cmp === 'bool') r = (av ? 1 : 0) - (bv ? 1 : 0);
                        else r = String(Array.isArray(av) ? av.join(',') : av).localeCompare(String(Array.isArray(bv) ? bv.join(',') : bv), undefined, { numeric:true, sensitivity:'base' });
                        if (r) return s.dir === 'desc' ? -r : r;
                    }
                    return 0;
                });
            },
            total() { return this.serverSide ? this.totalLocal : this.filtered.length; },
            pages() { return Math.max(1, Math.ceil(this.total / this.size)); },
            pageRows() { return this.serverSide ? this.rows : this.sorted.slice((this.page - 1) * this.size, this.page * this.size); },
            groupTotalColumns() { return this.visibleCols.filter((col) => ['number', 'currency'].includes(col.type) && col.groupAggregate !== false); },
            groupedPageRows() {
                const pageRows = this.pageRows;
                if (!this.groupHeader) return [{ key:'__all__', label:'', count:pageRows.length, totals:{}, entries:pageRows.map((row, index) => ({ row, index })), isComplete:true }];
                const sourceRows = this.serverSide ? this.rows : this.sorted;
                const summaries = new Map();
                sourceRows.forEach((row) => {
                    const value = getIn(row, this.groupHeader);
                    const key = this.groupValueKey(value);
                    let group = summaries.get(key);
                    if (!group) {
                        group = { key, value, label:this.groupLabel(value), count:0, totals:{} };
                        summaries.set(key, group);
                    }
                    group.count += 1;
                    this.groupTotalColumns.forEach((col) => {
                        const raw = getIn(row, col.key);
                        if (isNil(raw) || !Number.isFinite(Number(raw))) return;
                        group.totals[col.key] = (group.totals[col.key] || 0) + Number(raw);
                    });
                });
                const pageGroups = new Map();
                pageRows.forEach((row, index) => {
                    const value = getIn(row, this.groupHeader);
                    const key = this.groupValueKey(value);
                    if (!pageGroups.has(key)) {
                        const summary = summaries.get(key) || { key, value, label:this.groupLabel(value), count:0, totals:{} };
                        pageGroups.set(key, Object.assign({}, summary, { entries:[] }));
                    }
                    pageGroups.get(key).entries.push({ row, index });
                });
                return Array.from(pageGroups.values()).map((group) => Object.assign(group, {
                    isComplete: group.entries.length === group.count
                }));
            },
            selectedCount() {
                const disabledIds = new Set(this.rows.map((row, index) => this.isRowDisabled(row) ? this.keyOf(row, index) : null).filter((id) => id !== null));
                return this.selected.filter((id) => !disabledIds.has(id)).length;
            },
            selectablePageRows() {
                return this.pageRows.map((row, index) => ({ row, index, id:this.keyOf(row, index) })).filter((entry) => !this.isRowDisabled(entry.row));
            },
            allPageSelected() {
                const ids = this.selectablePageRows.map((entry) => entry.id);
                return ids.length > 0 && ids.every((id) => this.selected.includes(id));
            },
            footer() {
                if (!this.aggregates) return null;
                const out = {}; const scope = this.sorted;
                this.visibleCols.forEach((col) => {
                    const t = typeOf(col); if (!t.agg) return;
                    const vals = scope.map((r) => getIn(r, col.key)).filter((v) => !isNil(v));
                    if (!vals.length) return;
                    if (t.agg === 'sum') out[col.key] = vals.reduce((a, b) => a + Number(b), 0);
                    if (t.agg === 'avg') out[col.key] = vals.reduce((a, b) => a + Number(b), 0) / vals.length;
                    if (t.agg === 'true') out[col.key] = vals.filter(Boolean).length;
                });
                return Object.keys(out).length ? out : null;
            },
            colspan() { return this.visibleCols.length + (this.showExpander ? 1 : 0) + (this.selectable ? 1 : 0) + (this.showActionsColumn ? 1 : 0); },
            allExpanded() {
                const rows = this.pageRows.map((row, index) => ({ row, index })).filter(({ row }) => this.rowHasChildren(row));
                return rows.length > 0 && rows.every(({ row, index }) => this.expanded.includes(this.keyOf(row, index)));
            },
            gridApi() { // passed to custom cell components
                return { search: this.search, sort: this.sorts, expand: (r) => this.toggleExpand(this.keyOf(r)), level: this.level };
            }
        },
        watch: {
            page() { this.emitUi(); if (this.serverSide) this.fetch(); },
            size() { this.page = 1; this.savePrefs(); this.emitUi(); if (this.serverSide) this.fetch(); },
            search() { this.page = 1; this.emitUi(); if (this.serverSide) this.fetch(); },
            sorts: { deep: true, handler() { this.emitUi(); if (this.serverSide) this.fetch(); } },
            filters: { deep: true, handler() { this.page = 1; this.emitUi(); if (this.serverSide) this.fetch(); } },
            widths: { deep: true, handler() { this.savePrefs(); this.emitUi(); } },
            densityValue() { this.savePrefs(); this._headDirty = true; },
            hidden: { deep: true, handler() { this.savePrefs(); this._headDirty = true; } },
            showFilters() { this._headDirty = true; },
            autoAdd(value) { if (value) this.$nextTick(() => this.consumeAutoAdd()); },
            selectedIds: { deep:true, handler(ids) { this.setSelectedIds(ids); } },
            groupHeader() { this.collapsedGroups = []; }
        },
        methods: {
            notifyToast(opts) { pushToast(Object.assign({ theme:this.theme }, opts)); },
            consumeAutoAdd() {
                if (!this.autoAdd) return;
                this.openForm('create');
                this.$emit('add-consumed');
            },
            /* ---- helpers exposed to templates ---- */
            esc, typeOf, getIn, setIn, fmtNum, fmtMoney, fmtDate, optionList, optionLabel, colorOf, badge, dotPill, bar, stars, tagsHtml, truncate, isNil,
            keyOf(row, i) { return String(getIn(row, this.rowId) ?? ('__idx' + i)); },
            isRowDisabled(row) { return typeof this.rowDisabled === 'function' && !!this.rowDisabled(row); },
            groupValueKey(value) { return isNil(value) ? 'empty:' : typeof value + ':' + String(value); },
            groupLabel(value) {
                if (isNil(value)) return 'Unassigned';
                const column = this.columnsPlain.find((col) => col.key === this.groupHeader);
                const label = column ? optionLabel(column, value) : value;
                return isNil(label) ? 'Unassigned' : String(label);
            },
            isGroupCollapsed(key) { return this.collapsedGroups.includes(key); },
            toggleGroup(key) {
                this.collapsedGroups = this.isGroupCollapsed(key)
                    ? this.collapsedGroups.filter((item) => item !== key)
                    : this.collapsedGroups.concat([key]);
            },
            groupHasTotals(group) { return this.groupTotalColumns.some((col) => Object.prototype.hasOwnProperty.call(group.totals, col.key)); },
            formatGroupTotal(value, col) { return col.type === 'currency' ? fmtMoney(value, col.currency || 'GHS') : fmtNumber(value, col); },
            rowHasChildren(row) {
                const children = this.hasChildSchema ? getIn(row, this.child.key) : null;
                return Array.isArray(children) && children.length > 0;
            },
            rowChildren(row) { return this.hasChildSchema ? (getIn(row, this.child.key) || []) : []; },
            isExpanded(row, i) { return this.expanded.includes(this.keyOf(row, i)); },
            colWidth(col) { return this.widths[col.key] || col.width || (typeOf(col).minWidth || 150); },
            alignClass(col) { const a = col.align || typeOf(col).align; return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'; },
            isSortable(col) { return col.sortable !== false && !!typeOf(col).cmp; },
            sortIndexOf(col) { return this.sorts.findIndex((s) => s.key === col.key); },

            /* ---- search / filter / sort ---- */
            matchFilter(v, col, f) {
                const t = typeOf(col);
                if (t.kind === 'number') {
                    if (!isNil(f.min) && Number(v) < Number(f.min)) return false;
                    if (!isNil(f.max) && Number(v) > Number(f.max)) return false;
                    return true;
                }
                if (t.kind === 'date') {
                    const d = toDate(v); if (!d) return false;
                    if (f.from && d < toDate(f.from)) return false;
                    if (f.to && d > new Date(toDate(f.to).getTime() + 86399999)) return false;
                    return true;
                }
                if (t.kind === 'bool') return isNil(f.value) || f.value === '' ? true : (!!v === (f.value === 'true'));
                if (t.kind === 'enum') return isNil(f.value) || f.value === '' ? true : String(optionLabel(col, v)) === String(f.value);
                if (t.kind === 'array') return !f.value ? true : (Array.isArray(v) ? v.join(' ') : String(v || '')).toLowerCase().includes(String(f.value).toLowerCase());
                return !f.value ? true : String(v ?? '').toLowerCase().includes(String(f.value).toLowerCase());
            },
            onSearchInput(e) { this.search = e.target.value; },
            setFilter(key, field, value) { this.filters = Object.assign({}, this.filters, { [key]: Object.assign({}, this.filters[key], { [field]: value }) }); },
            clearFilters() { this.filters = {}; },
            clearView() {
                this.search = ''; this.sorts = []; this.filters = {}; this.page = 1;
                const s = this.$el && this.$el.querySelector('[data-search]'); if (s) s.value = '';
            },
            toggleSort(key, ev) {
                if (!key) return;
                const i = this.sorts.findIndex((s) => s.key === key);
                const additive = ev && ev.shiftKey;
                if (i >= 0) {
                    const cur = this.sorts[i];
                    if (cur.dir === 'asc') this.sorts = [{ key, dir:'desc' }];
                    else this.sorts = this.sorts.filter((s) => s.key !== key);
                } else {
                    const entry = { key, dir:'asc' };
                    this.sorts = additive ? this.sorts.concat([entry]) : [entry];
                }
                this.page = 1;
            },
            onThKey(e, col) {
                if (!this.isSortable(col)) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleSort(col.key, e); }
            },

            /* ---- selection ---- */
            setSelectedIds(ids) {
                const disabledIds = new Set(this.rows.map((row, index) => this.isRowDisabled(row) ? this.keyOf(row, index) : null).filter((id) => id !== null));
                const next = normalizeIds(ids).filter((id) => !disabledIds.has(id));
                if (next.length !== this.selected.length || next.some((id, index) => id !== this.selected[index])) this.selected = next;
            },
            emitSelectionChange() {
                const disabledIds = new Set(this.rows.map((row, index) => this.isRowDisabled(row) ? this.keyOf(row, index) : null).filter((id) => id !== null));
                const ids = this.selected.filter((id) => !disabledIds.has(id));
                this.selected = ids;
                this.$emit('update:selectedIds', ids);
                this.emit('selection-change', { ids, rows:this.selectedRows() });
            },
            toggleRow(id, ev) {
                id = String(id);
                const row = this.pageRows.find((item, index) => this.keyOf(item, index) === id);
                if (row && this.isRowDisabled(row)) { if (ev && ev.target) ev.target.checked = false; return; }
                const checked = ev && ev.target ? ev.target.checked : !this.selected.includes(id);
                this.selected = checked ? Array.from(new Set(this.selected.concat([id]))) : this.selected.filter((x) => x !== id);
                this.emitSelectionChange();
            },
            toggleAll(ev) {
                const checked = ev && ev.target ? ev.target.checked : true;
                const pageIds = this.pageRows.map((row, index) => this.keyOf(row, index));
                const enabledIds = this.selectablePageRows.map((entry) => entry.id);
                this.selected = checked ? normalizeIds(this.selected.concat(enabledIds)) : this.selected.filter((id) => !pageIds.includes(id));
                this.emitSelectionChange();
            },
            clearSelection() { this.selected = []; this.emitSelectionChange(); },
            selectedRows() { return this.sorted.filter((r, i) => this.selected.includes(this.keyOf(r, i)) && !this.isRowDisabled(r)); },


            /* ---- column / density prefs ---- */
            readPrefs() {
                if (!this.storageKey || this.level > 0) return {};
                try {
                    const p = JSON.parse(localStorage.getItem('dt:' + this.storageKey) || '{}');
                    return { widths: p.widths || {}, hidden: Array.isArray(p.hidden) ? p.hidden : null, pageSize: p.pageSize, density: p.density };
                } catch (e) { return {}; }
            },
            savePrefs() {
                if (!this.storageKey || this.level > 0) return;
                try { localStorage.setItem('dt:' + this.storageKey, JSON.stringify({
                    widths: this.widths, hidden: this.hidden, pageSize: this.size, density: this.densityValue })); } catch (e) {}
            },
            resetPrefs() { this.widths = {}; this.hidden = this.columnsPlain.filter((c) => c.hidden).map((c) => c.key); this.densityValue = this.density; this.size = this.pageSize; },
            toggleColumn(key, ev) {
                const checked = ev && ev.target ? ev.target.checked : !this.hidden.includes(key);
                this.hidden = checked ? this.hidden.filter((k) => k !== key) : this.hidden.concat([key]);
            },
            showAllColumns() { this.hidden = []; },
            hideAllColumns() { this.hidden = this.columnsPlain.slice(1).map((c) => c.key); },
            setDensity(d) { this.densityValue = d; this.openMenu = null; },
            toggleMenu(name) { this.openMenu = this.openMenu === name ? null : name; },

            /* ---- column resizing ---- */
            startResize(ev, key) {
                ev.preventDefault(); ev.stopPropagation();
                const th = ev.target.closest('th');
                const startX = ev.clientX, startW = th.getBoundingClientRect().width;
                const self = this;
                document.body.classList.add('dt-resizing');
                const cell = th.style.width;
                const move = (e2) => {
                    const w = Math.max(56, Math.round(startW + e2.clientX - startX));
                    self.widths = Object.assign({}, self.widths, { [key]: w });
                    th.style.width = w + 'px';
                };
                const up = () => {
                    document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                    document.body.classList.remove('dt-resizing');
                    th.style.width = cell;
                };
                document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
            },
            autofit(ev, col) {
                const w = Math.min(420, Math.max(90, String(col.label ?? col.key).length * 11 + 60));
                this.widths = Object.assign({}, this.widths, { [col.key]: w });
            },

            /* ---- expansion / nested grids ---- */
            toggleExpand(id) {
                this.expanded = this.expanded.includes(id) ? this.expanded.filter((x) => x !== id) : this.expanded.concat([id]);
            },
            expandAllRows() { this.expanded = this.pageRows.filter((r) => this.rowHasChildren(r)).map((r, i) => this.keyOf(r, i)); },
            collapseAllRows() { this.expanded = []; },
            onChildUi(id, ui) { this.childUi = Object.assign({}, this.childUi, { [id]: ui }); },
            childInitial(id) { return this.childUi[id] || null; },
            onChildChanged() { this.$emit('change', { grid: this, reason: 'nested' }); },

            /* ---- CRUD (each grid owns the array it was given: nested edits are in place) ---- */
            emit(e, payload) { this.$emit(e, Object.assign({ grid: this, level: this.level }, payload)); },
            flash(id) {
                this.flashId = id;
                const self = this;
                setTimeout(() => { if (self.flashId === id) self.flashId = null; }, 1900);
            },
            emptyRow() {
                const r = {}; setIn(r, this.rowId, uid(this.rowId));
                this.columnsPlain.forEach((c) => {
                    if (!hasColumnDefault(c)) return;
                    let value = resolveColumnDefault(c, r);
                    if (typeOf(c).input === 'date') value = dateInputValue(value);
                    setIn(r, c.key, value);
                });
                return r;
            },
            openForm(mode, row) {
                if (mode === 'update' && !row) return;
                this.form = { open: true, mode, row: row || null, parentLabel: this.parentLabel || 'Fill in the details below.' };
            },
            closeForm() { this.form = { open: false, mode: 'create', row: null }; },
            submitForm(values) {
                if (this.form.mode === 'update') {
                    if (!this.updateRow(this.form.row, values)) return;
                } else this.createRow(values);
                this.closeForm();
            },
            createRow(values) {
                const row = Object.assign(this.emptyRow(), values || {});
                this.data.unshift(row);                    // mutate the array we were given → Vue reactivity does the rest
                this.page = 1;
                const id = String(getIn(row, this.rowId));
                this.$nextTick(() => {
                    if (this.pageRows.some((r, i) => this.keyOf(r, i) === id)) this.flash(id);
                    else this.notifyToast({ type:'info', title:'Saved — but not in view', duration: 8000,
                        body:'The current search, filter or sort hides this new ' + this.itemLabel + '.',
                        action: { label:'Show it', onClick: () => { this.clearView(); this.$nextTick(() => this.flash(id)); } } });
                });
                this.emit('create', { row, data: values });
                this.emit('change', { row, mode:'create' });
            },
            updateRow(row, values) {
                const target = row || this.form.row; if (!target || this.isRowDisabled(target)) return false;
                Object.keys(values).forEach((k) => setIn(target, k, values[k]));
                const id = String(getIn(target, this.rowId));
                this.$nextTick(() => this.flash(id));
                this.emit('update', { row: target, data: values });
                this.emit('change', { row: target, mode:'update' });
                return true;
            },
            async removeRows(rows) {
                const requested = Array.isArray(rows) && rows.length ? Array.from(new Set(rows)) : this.selectedRows();
                const targets = requested.filter((row) => !this.isRowDisabled(row));
                if (!targets.length) return;
                const one = targets.length === 1;
                const firstLabel = getIn(targets[0], this.labelKey);
                const ok = await askConfirm({
                    theme: this.theme, danger: true, okText: 'Delete',
                    title: 'Delete ' + (one ? 'this ' + this.itemLabel : targets.length + ' ' + this.itemLabelPlural) + '?',
                    message: (one ? String(firstLabel || 'This ' + this.itemLabel) : 'These ' + this.itemLabelPlural) +
                        ' will be removed' + (this.child ? ' together with their nested ' + (this.child.title || 'children').toLowerCase() : '') + '. This action cannot be undone.'
                });
                if (!ok) return;

                // In local mode `data` is the live array; server-side rows live in `rowsLocal`.
                // Always mutate the collection currently displayed by this grid.
                const collection = this.rows;
                const snapshots = targets.map((row) => ({ row, index: collection.indexOf(row) }))
                    .filter((snapshot) => snapshot.index >= 0);
                if (!snapshots.length) return;
                snapshots.slice().sort((a, b) => b.index - a.index).forEach((snapshot) => collection.splice(snapshot.index, 1));
                if (this.serverSide) this.totalLocal = Math.max(0, this.totalLocal - snapshots.length);
                const removedRows = snapshots.map((snapshot) => snapshot.row);
                const previousSelection = this.selected.slice();
                this.selected = this.selected.filter((id) => !removedRows.some((row) => String(getIn(row, this.rowId)) === id));
                if (this.selected.length !== previousSelection.length) this.emitSelectionChange();
                this.emit('delete', { rows: removedRows });
                this.emit('change', { rows: removedRows, mode:'delete' });
                const maxPage = Math.max(1, Math.ceil(this.total / this.size));
                if (this.page > maxPage) this.page = maxPage;
            },
            addChild(row, index) {
                if (!this.hasChildSchema || this.isRowDisabled(row)) return;
                const id = this.keyOf(row, index);
                if (!Array.isArray(getIn(row, this.child.key))) setIn(row, this.child.key, []);
                this.childAddRequest = id;
                if (!this.expanded.includes(id)) this.expanded = this.expanded.concat([id]);
            },
            onChildAddConsumed() { this.childAddRequest = null; },

            /* ---- server side ---- */
            fetch() {
                if (!this.serverSide) return;
                const params = {
                    page: this.page, pageSize: this.size, search: this.search, sorts: clone(this.sorts),
                    filters: this.filtersForQuery(), offset: (this.page - 1) * this.size, level: this.level, path: this.path || []
                };
                this.loadingLocal = true;
                const done = (rows, total) => { this.rowsLocal = rows || []; this.totalLocal = total ?? (rows || []).length; this.loadingLocal = false; };
                /* The application handler answers with done(rows, total). */
                this.$emit('request', params, done);
            },
            reload() { if (this.serverSide) this.fetch(); },
            filtersForQuery() {
                const out = {};
                Object.entries(this.filters).forEach(([k, f]) => {
                    const col = this.columnsPlain.find((c) => c.key === k); if (!col) return;
                    const clean = {}; Object.entries(f).forEach(([kk, vv]) => { if (vv !== '' && vv !== null && vv !== undefined) clean[kk] = vv; });
                    if (Object.keys(clean).length) out[k] = Object.assign({ type: col.type }, clean);
                });
                return out;
            },

            /* ---- downloads / clipboard ---- */
            exportRows(rows) {
                return rows.map((r) => { const o = {};
                    this.visibleCols.forEach((c) => { let v = getIn(r, c.key);
                        if (Array.isArray(v)) v = v.join('; ');
                        if (c.type === 'date' || c.type === 'datetime') v = v ? new Date(v).toISOString().slice(0, 10) : '';
                        o[c.label ?? c.key] = v === null || v === undefined ? '' : v; });
                    return o; });
            },
            download(name, text, mime) {
                try {
                    if (typeof URL.createObjectURL !== 'function') throw new Error('no blob URL support');
                    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener';
                    document.body.appendChild(a); a.click();
                    setTimeout(() => { if (URL.revokeObjectURL) URL.revokeObjectURL(a.href); a.remove(); }, 500);
                } catch (e) {
                    this.notifyToast({ type:'danger', title:'Download blocked in this environment', body: name + ' — use Copy to clipboard instead' });
                    return;
                }
                this.notifyToast({ type:'success', title:'Export ready', body: name });
            },
            slug(s) { return String(s || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); },
            exportCsv(rows) {
                const list = (rows && rows.length ? rows : this.sorted);
                const data = this.exportRows(list);
                const cols = Object.keys(data[0] || {});
                const cell = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
                const csv = '\uFEFF' + [cols.map(cell).join(','), ...data.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
                this.download(this.slug(this.itemLabelPlural) + '-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv');
            },
            exportJson(rows) {
                const list = (rows && rows.length ? rows : this.sorted);
                this.download(this.slug(this.title || this.itemLabelPlural) + '.json', JSON.stringify(this.exportRows(list), null, 2), 'application/json');
            },
            copyTsv() {
                const data = this.exportRows(this.sorted);
                const cols = Object.keys(data[0] || {});
                const tsv = [cols.join('\t'), ...data.map((r) => cols.map((c) => String(r[c] ?? '').replace(/\t/g, ' ')).join('\t'))].join('\n');
                const done = () => this.notifyToast({ type:'success', title:'Copied', body: data.length + ' rows as TSV' });
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tsv).then(done).catch(() => done());
                else done();
            },
            emitUi() {
                if (!this.nested) return;
                this.$emit('ui', { search: this.search, page: this.page, sorts: clone(this.sorts), widths: Object.assign({}, this.widths), pageSize: this.size, expanded: this.expanded.slice() });
            },
            /* keep the second (filter) header row pinned directly below the first one */
            syncHeadHeight() {
                const thead = this.$el && this.$el.querySelector ? this.$el.querySelector('thead') : null;
                const row = thead && thead.querySelector('tr');
                if (row && this.$el) this.$el.style.setProperty('--dt-head-h', row.getBoundingClientRect().height + 'px');
            },
            cellHtml(col, row) {
                const t = typeOf(col);
                if (typeof col.render === 'function') return col.render(getIn(row, col.key), row, this.gridApi);
                if (typeof col.format === 'function') { const out = col.format(getIn(row, col.key), row); return isNil(out) ? DASH : esc(out); }
                return t.cell ? t.cell(getIn(row, col.key), col, row, { search: this.search }) : DASH;
            },
            footerValue(col) {
                const t = typeOf(col); const v = this.footer[col.key];
                if (t.agg === 'avg') {
                    if (col.type === 'currency') return 'avg ' + fmtMoney(v, col.currency || 'GHS');
                    if (col.type === 'number') return 'avg ' + fmtNumber(v, col);
                    return 'avg ' + fmtNum(v, 1) + (col.type === 'percent' ? '%' : '');
                }
                if (col.type === 'currency') return fmtMoney(v, col.currency || 'GHS');
                if (col.type === 'number') return fmtNumber(v, col);
                if (col.type === 'boolean') return v + ' yes';
                return fmtNum(v, 0);
            },
            filterPlaceholder(col) { return col.filterPlaceholder || 'Filter…'; },
            onGlobalKey(e) {
                const tag = (document.activeElement && document.activeElement.tagName) || '';
                if (e.key === '/' && !/input|textarea|select/i.test(tag)) {
                    e.preventDefault();
                    const s = this.$el.querySelector('[data-search]'); if (s) s.focus();
                }
            }
        },
        mounted() {
            ensureServices();
            document.addEventListener('keydown', this.onGlobalKey);
            this.syncHeadHeight();
            if (this.serverSide) this.fetch();
        },
        updated() { if (this._headDirty) { this._headDirty = false; this.syncHeadHeight(); } },
        beforeUnmount() { document.removeEventListener('keydown', this.onGlobalKey); },
        template: `
    <section data-dt-theme-scope :style="themeStyle" class="dt-root overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
             :data-density="densityValue" :class="[(level===1 ? 'dt-nested-lvl1' : level>=2 ? 'dt-nested-lvl2' : ''), stickyHeader ? '' : 'dt-nosticky']" role="region" :aria-label="title || 'Data table'">

      <!-- ================= TOOLBAR ================= -->
      <div class="flex flex-col gap-3 border-b border-slate-200 p-3 sm:p-4 dark:border-slate-700">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <div v-if="title || subtitle" class="min-w-0">
              <h2 class="truncate text-sm font-semibold text-slate-900 dark:text-white">{{ title }}</h2>
              <p v-if="subtitle" class="truncate text-xs text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <template v-if="isLoading"><span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"></span>Loading…</template>
              <template v-else><i class="bi bi-collection"></i>{{ total }} {{ total === 1 ? itemLabel : itemLabelPlural }}</template>
            </span>
            <span v-if="selectedCount" class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
              <i class="bi bi-check2-circle"></i>{{ selectedCount }} selected
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div v-if="searchable" class="relative">
              <i class="bi bi-search pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
              <input type="search" data-search :value="search" @input="onSearchInput" :placeholder="'Search ' + itemLabelPlural + '…'"
                class="inline-flex h-9 w-[190px] shrink-0 items-center rounded-lg border border-slate-300 bg-white pl-8 pr-7 text-sm font-normal text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500 sm:w-[240px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <button v-show="search" data-action="clear-search"
                class="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                @click="search = ''"><i class="bi bi-x-lg text-[10px]"></i></button>
            </div>

            <button class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-sm font-medium transition"
              :class="showFilters ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'"
              data-action="toggle-filters" title="Toggle per-column filters" @click="showFilters = !showFilters">
              <i class="bi" :class="showFilters ? 'bi-funnel-fill' : 'bi-funnel'"></i><span class="hidden lg:inline">Filters</span>
            </button>

            <button v-if="expandAll && hasChildSchema" data-action="expand-all" @click="allExpanded ? collapseAllRows() : expandAllRows()"
              class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              :title="allExpanded ? 'Collapse all' : 'Expand all'">
              <i class="bi" :class="allExpanded ? 'bi-arrows-collapse' : 'bi-arrows-expand'"></i><span class="hidden lg:inline">{{ allExpanded ? 'Collapse' : 'Expand' }}</span>
            </button>

            <button v-if="refreshButton" data-action="refresh" @click="serverSide ? fetch() : $emit('change', { reason:'refresh', grid:this })"
              class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" title="Refresh">
              <i class="bi bi-arrow-clockwise"></i>
            </button>

            <!-- columns menu -->
            <div v-if="columnToggle && columnsPlain.length > 2" class="relative" data-menu="cols">
              <button class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                data-action="menu" @click="toggleMenu('cols')"><i class="bi bi-layout-three-columns"></i><span class="hidden xl:inline">Columns</span><i class="bi bi-chevron-down text-[10px] opacity-60"></i></button>
              <transition name="pop">
                <div v-show="openMenu === 'cols'" data-menu-panel class="absolute right-0 z-40 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
                  <div class="border-b border-slate-100 px-3 py-2 dark:border-slate-800"><p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Visible columns</p></div>
                  <div class="max-h-72 overflow-auto py-1">
                    <label v-for="c in columnsPlain" :key="c.key" class="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <input type="checkbox" class="dt-check h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" data-action="toggle-col" :data-key="c.key"
                        :checked="!hidden.includes(c.key)" @change="toggleColumn(c.key, $event)">
                      <span class="text-slate-700 dark:text-slate-200">{{ c.label || c.key }}</span>
                    </label>
                  </div>
                  <div class="flex items-center justify-between border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                    <button class="text-xs font-medium text-primary-700 hover:underline dark:text-primary-300" data-action="cols-all" @click="showAllColumns">Show all</button>
                    <button class="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400" data-action="cols-none" @click="hideAllColumns">Hide all</button>
                  </div>
                </div>
              </transition>
            </div>

            <!-- density menu -->
            <div v-if="densityToggle" class="relative" data-menu="density">
              <button class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                data-action="menu" @click="toggleMenu('density')"><i class="bi bi-list-ul"></i><i class="bi bi-chevron-down text-[10px] opacity-60"></i></button>
              <transition name="pop">
                <div v-show="openMenu === 'density'" data-menu-panel class="absolute right-0 z-40 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900">
                  <p class="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Row density</p>
                  <button v-for="d in ['compact','cozy','comfortable']" :key="d" data-action="density" :data-value="d" @click="setDensity(d)"
                    class="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm capitalize hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span class="text-slate-700 dark:text-slate-200">{{ d }}</span>
                    <i v-if="densityValue === d" class="bi bi-check2 text-primary-600 dark:text-primary-300"></i>
                  </button>
                </div>
              </transition>
            </div>

            <!-- export menu -->
            <div v-if="exportMenu" class="relative" data-menu="export">
              <button class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                data-action="menu" @click="toggleMenu('export')"><i class="bi bi-download"></i><i class="bi bi-chevron-down text-[10px] opacity-60"></i></button>
              <transition name="pop">
                <div v-show="openMenu === 'export'" data-menu-panel class="absolute right-0 z-40 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900">
                  <p class="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Export</p>
                  <button data-action="export-csv" @click="exportCsv(); openMenu = null" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <i class="bi bi-filetype-csv text-slate-400"></i><span class="flex-1 text-left text-slate-700 dark:text-slate-200">Download CSV</span><span class="text-[11px] text-slate-400">.csv</span></button>
                  <button data-action="export-json" @click="exportJson(); openMenu = null" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <i class="bi bi-filetype-json text-slate-400"></i><span class="flex-1 text-left text-slate-700 dark:text-slate-200">Download JSON</span><span class="text-[11px] text-slate-400">.json</span></button>
                  <button data-action="copy-clipboard" @click="copyTsv(); openMenu = null" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <i class="bi bi-clipboard text-slate-400"></i><span class="flex-1 text-left text-slate-700 dark:text-slate-200">Copy to clipboard</span><span class="text-[11px] text-slate-400">TSV</span></button>
                </div>
              </transition>
            </div>

            <button v-if="canAdd" data-action="add" @click="openForm('create')"
              class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1 dark:focus:ring-offset-slate-950">
              <i class="bi bi-plus-lg"></i>{{ addLabel }}
            </button>
          </div>
        </div>

        <!-- bulk selection bar -->
        <transition name="pop">
          <div v-if="selectedCount" data-bulkbar class="flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-2 dark:border-primary-500/30 dark:bg-primary-500/10">
            <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 dark:text-primary-200"><i class="bi bi-check2-square"></i>{{ selectedCount }} selected</span>
            <span class="mx-1 h-5 w-px bg-primary-200 dark:bg-primary-500/30"></span>
            <button data-action="bulk-export" @click="exportCsv(selectedRows())" class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-2.5 text-xs font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-500/40 dark:bg-slate-900 dark:text-primary-300"><i class="bi bi-download"></i>Export selected</button>
            <button v-if="canDelete" data-action="bulk-delete" @click="removeRows(selectedRows())" class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-300"><i class="bi bi-trash3"></i>Delete</button>
            <button data-action="clear-selection" @click="clearSelection" class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"><i class="bi bi-x-lg"></i>Clear</button>
          </div>
        </transition>
      </div>

      <!-- ================= TABLE ================= -->
      <div class="dt-scroll relative overflow-auto" :style="{ maxHeight: maxHeight }" data-scroll>
        <table class="dt-table w-full min-w-full text-sm" data-table>
          <colgroup>
            <col v-if="showExpander" :style="{ width: (widths.__exp || 44) + 'px' }">
            <col v-if="selectable" :style="{ width: (widths.__sel || 44) + 'px' }">
            <col v-for="c in visibleCols" :key="c.key" :style="{ width: colWidth(c) + 'px' }">
            <col v-if="showActionsColumn" :style="{ width: (widths.__act || 132) + 'px' }">
          </colgroup>
          <thead class="text-slate-600 dark:text-slate-300">
            <tr class="dt-theme-header border-b border-slate-200 backdrop-blur dark:border-slate-700">
              <th v-if="showExpander" class="dt-th"><span class="sr-only">Expand</span></th>
              <th v-if="selectable" class="dt-th">
                <input type="checkbox" class="dt-check h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40" data-action="select-all"
                  :checked="allPageSelected" :indeterminate.prop="selectedCount > 0 && !allPageSelected" :disabled="!selectablePageRows.length" aria-label="Select all selectable rows on this page" @click="toggleAll($event)">
              </th>
              <th v-for="c in visibleCols" :key="c.key" class="dt-th group relative whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  :class="alignClass(c)" :data-col="c.key" :data-sortable="isSortable(c)" :tabindex="isSortable(c) ? 0 : -1" :role="isSortable(c) ? 'button' : null"
                  :aria-sort="sortIndexOf(c) >= 0 ? (sorts[sortIndexOf(c)].dir === 'desc' ? 'descending' : 'ascending') : 'none'"
                  @click="isSortable(c) && toggleSort(c.key, $event)" @keydown="onThKey($event, c)">
                <span class="inline-flex items-center gap-1.5" :class="alignClass(c) === 'text-right' ? 'flex-row-reverse' : ''">
                  <span :class="sortIndexOf(c) >= 0 ? 'text-primary-700 dark:text-primary-300' : ''">{{ c.label || c.key }}</span>
                  <i v-if="isSortable(c)" class="bi text-xs" :class="sortIndexOf(c) >= 0 ? (sorts[sortIndexOf(c)].dir === 'desc' ? 'bi-sort-down-alt text-primary-600 dark:text-primary-300' : 'bi-sort-up-alt text-primary-600 dark:text-primary-300') : 'bi-arrow-down-up opacity-0 group-hover:opacity-40'"></i>
                  <span v-if="sortIndexOf(c) >= 0 && sorts.length > 1" class="rounded bg-primary-100 px-1 text-[10px] font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-200">{{ sortIndexOf(c) + 1 }}</span>
                </span>
                <span v-if="resizable && c.resizable !== false" class="dt-resizer" data-action="resize" :data-key="c.key" title="Drag to resize" @mousedown="startResize($event, c.key)" @dblclick.stop="autofit($event, c)"></span>
              </th>
              <th v-if="showActionsColumn" class="dt-th whitespace-nowrap text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
            </tr>

            <tr v-if="showFilters" class="dt-theme-filter border-b border-slate-200 dark:border-slate-700">
              <th v-if="showExpander"></th>
              <th v-if="selectable"></th>
              <th v-for="c in visibleCols" :key="c.key" class="py-1.5 font-normal">
                <span v-if="typeOf(c).kind === 'number'" class="flex items-center gap-1">
                  <input type="number" :data-filter="c.key" data-fk="min" :value="(filters[c.key] || {}).min ?? ''" placeholder="min" @input="setFilter(c.key, 'min', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
                  <input type="number" :data-filter="c.key" data-fk="max" :value="(filters[c.key] || {}).max ?? ''" placeholder="max" @input="setFilter(c.key, 'max', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
                </span>
                <span v-else-if="typeOf(c).kind === 'date'" class="flex items-center gap-1">
                  <input type="date" :data-filter="c.key" data-fk="from" :value="(filters[c.key] || {}).from ?? ''" @input="setFilter(c.key, 'from', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
                  <input type="date" :data-filter="c.key" data-fk="to" :value="(filters[c.key] || {}).to ?? ''" @input="setFilter(c.key, 'to', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
                </span>
                <select v-else-if="typeOf(c).kind === 'bool'" :data-filter="c.key" data-fk="value" @change="setFilter(c.key, 'value', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">All</option><option value="true">Yes</option><option value="false">No</option>
                </select>
                <select v-else-if="typeOf(c).kind === 'enum'" :data-filter="c.key" data-fk="value" @change="setFilter(c.key, 'value', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">All</option>
                  <option v-for="o in optionList(c)" :key="o.value" :value="o.label ?? o.value">{{ o.label ?? o.value }}</option>
                </select>
                <input v-else type="text" :data-filter="c.key" data-fk="value" :value="(filters[c.key] || {}).value ?? ''" :placeholder="filterPlaceholder(c)" @input="setFilter(c.key, 'value', $event.target.value)" class="w-full rounded-md border-0 bg-slate-100 px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200">
              </th>
              <th v-if="showActionsColumn" class="py-1.5 text-right">
                <button data-action="clear-filters" @click="clearFilters" class="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800"><i class="bi bi-x-circle"></i> Clear</button>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- loading skeleton -->
            <template v-if="isLoading">
              <tr v-for="i in skeletonRows" :key="'sk'+i" class="border-b border-slate-100 dark:border-slate-800">
                <td v-if="showExpander"></td>
                <td v-if="selectable"><div class="dt-skel mx-auto h-4 w-4"></div></td>
                <td v-for="c in visibleCols" :key="c.key" class="dt-cell">
                  <div class="dt-skel h-4" :class="typeOf(c).align === 'right' ? 'ml-auto' : ''" :style="{ width: (35 + ((c.key.length * 13 + i * 11) % 55)) + '%' }"></div>
                </td>
                <td v-if="showActionsColumn"><div class="dt-skel ml-auto h-4 w-16"></div></td>
              </tr>
            </template>

            <!-- empty state -->
            <tr v-else-if="!pageRows.length">
              <td :colspan="colspan" class="py-16 text-center">
                <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300"><i class="bi text-2xl" :class="emptyIcon"></i></div>
                <p class="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ emptyTitle }}</p>
                <p class="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{{ emptyMessage }}</p>
                <button v-if="search || Object.keys(filters).length" data-action="reset-view" @click="clearView"
                  class="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><i class="bi bi-arrow-counterclockwise"></i>Reset search &amp; filters</button>
                <button v-else-if="canAdd" data-action="add" @click="openForm('create')"
                  class="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary-600 px-3 text-sm font-semibold text-white hover:bg-primary-700"><i class="bi bi-plus-lg"></i>Add your first {{ itemLabel }}</button>
              </td>
            </tr>

            <!-- grouped rows (each group can be collapsed independently) -->
            <template v-else>
              <template v-for="group in groupedPageRows" :key="'group-' + group.key">
                <tr v-if="groupHeader" class="dt-group-header border-b border-slate-200 dark:border-slate-700" :data-group-key="group.key">
                  <td :colspan="colspan" class="dt-cell p-0">
                    <button type="button" class="dt-group-toggle flex w-full items-center gap-3 px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                      :aria-expanded="!isGroupCollapsed(group.key)" @click="toggleGroup(group.key)">
                      <i class="bi shrink-0 text-xs text-slate-500 dark:text-slate-400" :class="isGroupCollapsed(group.key) ? 'bi-chevron-right' : 'bi-chevron-down'" aria-hidden="true"></i>
                      <span class="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {{ group.label }} - {{ group.count }} {{ group.count === 1 ? itemLabel : itemLabelPlural }}
                      </span>
                      <span v-if="groupHasTotals(group)" class="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                        <template v-for="c in groupTotalColumns" :key="c.key">
                          <span v-if="group.totals[c.key] !== undefined" class="whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                            <span class="text-slate-500 dark:text-slate-400">{{ c.label || c.key }}:</span>
                            <strong class="ml-1 tabular-nums text-slate-800 dark:text-slate-100">{{ formatGroupTotal(group.totals[c.key], c) }}</strong>
                          </span>
                        </template>
                      </span>
                    </button>
                  </td>
                </tr>

                <template v-if="!isGroupCollapsed(group.key)">
                  <template v-for="entry in group.entries" :key="keyOf(entry.row, entry.index)">
                    <tr class="dt-row dt-theme-row group border-b border-slate-100 transition-colors dark:border-slate-800"
                        :data-row="keyOf(entry.row, entry.index)" :aria-disabled="isRowDisabled(entry.row) ? 'true' : null"
                        :class="[ selected.includes(keyOf(entry.row, entry.index)) && !isRowDisabled(entry.row) ? 'dt-row-selected bg-primary-50/70 dark:bg-primary-500/10' : (striped && entry.index % 2 ? 'bg-slate-50/60 dark:bg-slate-900/40' : ''), isRowDisabled(entry.row) ? 'dt-row-disabled opacity-60' : '', flashId === keyOf(entry.row, entry.index) ? 'dt-flash' : '' ]">
                      <td v-if="showExpander" class="dt-cell text-center">
                        <template v-if="rowHasChildren(entry.row)">
                          <button data-action="toggle" :data-id="keyOf(entry.row, entry.index)" :aria-expanded="isExpanded(entry.row, entry.index)" :title="isExpanded(entry.row, entry.index) ? 'Collapse' : 'Expand'"
                            class="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-300" @click="toggleExpand(keyOf(entry.row, entry.index))">
                            <i class="bi text-[11px] transition-transform" :class="isExpanded(entry.row, entry.index) ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                          </button>
                          <span v-if="rowChildren(entry.row).length" class="ml-0.5 text-[10px] font-semibold tabular-nums text-slate-400">{{ rowChildren(entry.row).length }}</span>
                        </template>
                        <button v-else-if="canAdd" data-action="add-child" :data-id="keyOf(entry.row, entry.index)" :disabled="isRowDisabled(entry.row)"
                          :title="isRowDisabled(entry.row) ? 'This row is locked' : 'Add ' + (child.title || 'child').replace(/s$/, '').toLowerCase()"
                          :aria-label="'Add ' + (child.title || 'child').replace(/s$/, '').toLowerCase() + ' to ' + (getIn(entry.row, labelKey) || 'this row')"
                          class="grid h-7 w-7 place-items-center rounded-md bg-primary-50 text-primary-700 transition hover:bg-primary-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20" @click="addChild(entry.row, entry.index)">
                          <i class="bi bi-plus-lg text-[11px]"></i>
                        </button>
                      </td>
                      <td v-if="selectable" class="dt-cell text-center">
                        <input type="checkbox" class="dt-check h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40" data-action="select-row" :data-id="keyOf(entry.row, entry.index)"
                          :checked="!isRowDisabled(entry.row) && selected.includes(keyOf(entry.row, entry.index))" :disabled="isRowDisabled(entry.row)" :aria-label="isRowDisabled(entry.row) ? 'Posted row cannot be selected' : 'Select row'" @click="toggleRow(keyOf(entry.row, entry.index), $event)">
                      </td>
                      <td v-for="c in visibleCols" :key="c.key" class="dt-cell text-sm text-slate-700 dark:text-slate-300" :class="[alignClass(c), typeOf(c).wrap ? 'whitespace-normal' : '']">
                        <component v-if="c.component" :is="c.component" :value="getIn(entry.row, c.key)" :row="entry.row" :column="c" :grid="gridApi" :search="search" />
                        <span v-else v-html="cellHtml(c, entry.row)"></span>
                      </td>
                      <td v-if="showActionsColumn" class="dt-cell">
                        <div class="flex items-center justify-end gap-0.5">
                          <button v-if="canEdit" data-action="edit" :data-id="keyOf(entry.row, entry.index)" :title="isRowDisabled(entry.row) ? 'View read-only record' : 'Edit'" @click="openForm('update', entry.row)"
                            class="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm dark:hover:bg-primary-500/10 dark:hover:text-primary-300"><i class="bi text-[13px]" :class="isRowDisabled(entry.row) ? 'bi-eye' : 'bi-pencil-square'"></i></button>
                          <button v-if="canDelete" data-action="delete" :data-id="keyOf(entry.row, entry.index)" :title="isRowDisabled(entry.row) ? 'This row is locked' : 'Delete'" :disabled="isRowDisabled(entry.row)" @click="removeRows([entry.row])"
                            class="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"><i class="bi bi-trash3 text-[13px]"></i></button>
                        </div>
                      </td>
                    </tr>

                    <!-- ===== nested child grid ===== -->
                    <tr v-if="isExpanded(entry.row, entry.index)" class="dt-detail bg-slate-50/80 dark:bg-slate-950/40">
                      <td :colspan="colspan" class="dt-cell p-0">
                        <transition name="detail" appear>
                          <div class="px-3 pb-4 pt-3 sm:px-5" :data-child-mount="keyOf(entry.row, entry.index)">
                            <data-grid v-if="hasChildSchema"
                              :columns="child.columns" :data="rowChildren(entry.row)" :child="child.child || null"
                              :row-id="rowId" :label-key="labelKey" :level="level + 1"
                              :initial-state="childInitial(keyOf(entry.row, entry.index))"
                              :selectable="selectable" :actions="actions" :searchable="true" :filter-row="false"
                              :resizable="resizable" :aggregates="rowChildren(entry.row).length > 4" :expand-all="true"
                              :add-button="canAdd && !isRowDisabled(entry.row)" :edit-button="canEdit && !isRowDisabled(entry.row)" :delete-button="canDelete && !isRowDisabled(entry.row)"
                              :column-toggle="false" :density-toggle="false" :export-menu="false" :refresh-button="false"
                              :page-size="5" :page-sizes="[5, 10, 25]"
                              max-height="none" :skeleton-rows="3"
                              :title="''" :subtitle="''"
                              :item-label="(child.title || 'item').replace(/s$/, '').toLowerCase()"
                              :item-label-plural="(child.title || 'items').toLowerCase()"
                              :add-label="'Add ' + (child.title || 'item').replace(/s$/, '').toLowerCase()"
                              :empty-title="'No ' + (child.title || 'items').toLowerCase() + ' yet'"
                              :empty-message="'Add the first ' + (child.title || 'item').replace(/s$/, '').toLowerCase() + ' for this row.'"
                              empty-icon="bi-diagram-3"
                              :auto-add="childAddRequest === keyOf(entry.row, entry.index)"
                              :parent-label="'Adding under ' + (getIn(entry.row, labelKey) || keyOf(entry.row, entry.index))" :theme="theme"
                              @add-consumed="onChildAddConsumed"
                              @ui="onChildUi(keyOf(entry.row, entry.index), $event)"
                              @change="$emit('change', { reason:'nested', grid:$event.grid, payload:$event })"
                              @selection-change="$emit('selection-change', $event)"
                              @create="$emit('create', $event)" @update="$emit('update', $event)" @delete="$emit('delete', $event)"
                              ref="childGrids" />
                          </div>
                        </transition>
                      </td>
                    </tr>
                  </template>

                  <tr v-if="groupHeader && group.isComplete && groupHasTotals(group)" class="dt-group-total border-b border-slate-200 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200" :data-group-total="group.key">
                    <td v-if="showExpander"></td>
                    <td v-if="selectable"></td>
                    <td v-for="(c, index) in visibleCols" :key="c.key" class="dt-cell tabular-nums" :class="alignClass(c)">
                      <span v-if="index === 0" class="mr-2 text-[10px] uppercase tracking-wide text-primary-700 dark:text-primary-300">Group total</span>
                      <span v-if="group.totals[c.key] !== undefined">{{ formatGroupTotal(group.totals[c.key], c) }}</span>
                    </td>
                    <td v-if="showActionsColumn"></td>
                  </tr>
                </template>
              </template>
            </template>
          </tbody>

          <tfoot v-if="footer && !isLoading">
            <tr class="dt-theme-footer border-t-2 border-slate-200 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <td v-if="showExpander"></td>
              <td v-if="selectable"></td>
              <td v-for="(c, idx) in visibleCols" :key="c.key" class="tabular-nums" :class="alignClass(c)">
                <span v-if="idx === 0" class="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] uppercase tracking-wide text-primary-700 dark:text-primary-300">
                  <i class="bi bi-calculator"></i>{{ c.aggregateLabel || 'Totals' }}
                </span>
                <span v-else-if="footer[c.key] !== undefined" :title="typeOf(c).agg === 'sum' ? 'Total' : 'Average'">{{ footerValue(c) }}</span>
              </td>
              <td v-if="showActionsColumn"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <data-grid-pager v-if="!serverSide || total > 0" :page="page" :page-size="size" :total="total" :page-sizes="pageSizes" :loading="isLoading"
        @update:page="page = $event" @update:pageSize="size = $event" />

      <data-grid-form v-if="form.open" :columns="editableCols" :row="form.row" :mode="form.mode" :item-label="itemLabel"
        :parent-label="form.parentLabel" :theme="theme" :row-disabled="rowDisabled" @submit="submitForm" @close="closeForm" />
    </section>`
    };



    function ensureTarget(id, className) {
        let target = global.document.getElementById(id);
        if (!target) {
            target = global.document.createElement('div');
            target.id = id;
            if (className) target.className = className;
            global.document.body.appendChild(target);
        }
        return target;
    }

    let servicesApp = null;
    function ensureServices() {
        if (servicesApp || !global.document || !global.document.body) return;
        ensureTarget('dt-modal-host');
        ensureTarget('dt-toast-host', 'dt-toast-host');
        const mountPoint = global.document.createElement('div');
        mountPoint.setAttribute('data-datagrid-services', '');
        mountPoint.style.display = 'none';
        global.document.body.appendChild(mountPoint);
        servicesApp = createApp({
            name: 'DataGridServices',
            components: { ToastHost, ConfirmHost },
            template: '<div><toast-host></toast-host><confirm-host></confirm-host></div>'
        });
        servicesApp.mount(mountPoint);
    }

    const DataGridPlugin = {
        install(app) {
            app.component('data-grid', DataGrid);
            app.component('data-grid-pager', DataGridPager);
            app.component('data-grid-form', DataGridForm);
            ensureServices();
        }
    };

    /* Plain-script global API. Use app.use(DataGridPlugin) to register the
       recursive component and install the shared confirm/toast portal once. */
    global.DataGrid = DataGrid;
    global.DataGridPlugin = DataGridPlugin;
    global.DataGridComponents = Object.freeze({ DataGrid, DataGridPager, DataGridForm, ToastHost, ConfirmHost });
})(window);

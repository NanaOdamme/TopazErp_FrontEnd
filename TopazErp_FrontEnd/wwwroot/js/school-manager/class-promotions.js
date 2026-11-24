/* ==========================================================================
 * Class Promotion — Promote classes to next class level & set term start date.
 *
 * Entity Model:
 *  - ClassPromotion : AuditedEntity<Guid>
 *      public DateTime StartDate { get; set; }
 *      public Guid FromClassId { get; set; }
 *      public string FromClassName { get; set; }
 *      public Guid ToClassId { get; set; }
 *      public string ToClassName { get; set; }
 *      public int TenantId { get; set; }
 *
 * Controller Endpoints:
 *  - GET:  /SchoolManager/GetClassPromotions/
 *  - POST: /SchoolManager/CreateClassPromotion/
 *  - POST: /SchoolManager/UpdateClassPromotion/
 *  - Note: NO delete endpoint on this page as per requirements.
 *
 * Lookups:
 *  - Classes: /SchoolManager/GetLevelClasses/
 *
 * UI Workflow:
 *  - Global StartDate input before the table that applies to all promotions.
 *  - Table displays all classes (From Class) and a dropdown for the Target (To Class).
 *  - If no 'To Class' is selected, ToClassId becomes EMPTY_GUID ('00000000-0000-0000-0000-000000000000').
 *  - Individual row saving & Bulk 'Save All Promotions' button.
 *  - Full pagination controls (Page size selector, Prev/Next, Page numbers, record range summary).
 *  - Theme: '#062a81', classes .label and .input-control.
 * ========================================================================== */
(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const val = (o, k) => {
        if (!o) return undefined;
        if (o[k] !== undefined) return o[k];
        const pascal = k.charAt(0).toUpperCase() + k.slice(1);
        if (o[pascal] !== undefined) return o[pascal];
        const lower = k.toLowerCase();
        for (const prop of Object.keys(o)) {
            if (prop.toLowerCase() === lower) return o[prop];
        }
        return undefined;
    };

    const isGuid = v =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()) &&
        v.trim() !== EMPTY_GUID;

    const asGuid = v => (isGuid(v) ? v.trim() : EMPTY_GUID);

    const todayIso = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const toInputDate = v => {
        if (!v) return todayIso();
        const s = String(v);
        const m = s.match(/^\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : todayIso();
    };

    const toIsoDateTime = v => {
        const dateStr = toInputDate(v);
        return `${dateStr}T00:00:00`;
    };

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title)) ||
        (err && err.message) ||
        'Something went wrong.';

    const toastHandler = (type, message) => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: type,
                title: message
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizePromotion = p => {
        const id = val(p, 'id');
        return {
            id: id ? String(id) : undefined,
            startDate: toInputDate(val(p, 'startDate')),
            fromClassId: asGuid(val(p, 'fromClassId')),
            fromClassName: String(val(p, 'fromClassName') || '').trim(),
            toClassId: asGuid(val(p, 'toClassId')),
            toClassName: String(val(p, 'toClassName') || '').trim(),
            tenantId: val(p, 'tenantId') !== undefined ? Number(val(p, 'tenantId')) : undefined
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                savingRowId: null,
                theme: '#062a81',

                // Lookups
                classes: [],

                // Global start date applied to all promotions
                globalStartDate: todayIso(),

                // Class promotion mapping rows (one for each class in the school)
                rows: [],

                // Search query to filter classes
                searchQuery: '',

                // Pagination state
                currentPage: 1,
                pageSize: 10,
                pageSizeOptions: [5, 10, 20, 50]
            };
        },

        computed: {
            filteredRows() {
                if (!this.searchQuery) return this.rows;
                const q = this.searchQuery.toLowerCase().trim();
                return this.rows.filter(r =>
                    (r.fromClassName && r.fromClassName.toLowerCase().includes(q)) ||
                    (r.toClassName && r.toClassName.toLowerCase().includes(q))
                );
            },

            totalPages() {
                const total = this.filteredRows.length;
                return Math.max(1, Math.ceil(total / this.pageSize));
            },

            paginatedRows() {
                const start = (this.currentPage - 1) * this.pageSize;
                return this.filteredRows.slice(start, start + this.pageSize);
            },

            paginationStart() {
                if (this.filteredRows.length === 0) return 0;
                return (this.currentPage - 1) * this.pageSize + 1;
            },

            paginationEnd() {
                return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
            },

            pageNumbers() {
                const total = this.totalPages;
                const current = this.currentPage;
                if (total <= 7) {
                    return Array.from({ length: total }, (_, i) => i + 1);
                }
                const pages = [];
                pages.push(1);
                let start = Math.max(2, current - 1);
                let end = Math.min(total - 1, current + 1);

                if (start > 2) pages.push('...');
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < total - 1) pages.push('...');
                pages.push(total);
                return pages;
            },

            configuredCount() {
                return this.rows.filter(r => r.toClassId && r.toClassId !== EMPTY_GUID).length;
            }
        },

        watch: {
            searchQuery() {
                this.currentPage = 1;
            },
            pageSize() {
                this.currentPage = 1;
            }
        },

        mounted() {
            this.getSetupData();
        },

        methods: {
            errMsg,
            toastHandler,
            val,
            isGuid,
            asGuid,
            toInputDate,
            toIsoDateTime,

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
            },

            setPage(page) {
                if (page < 1 || page > this.totalPages || page === '...') return;
                this.currentPage = page;
            },

            nextPage() {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                }
            },

            prevPage() {
                if (this.currentPage > 1) {
                    this.currentPage--;
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [classesRes, promoRes] = await Promise.all([
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetClassPromotions/')
                    ]);

                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    const rawPromos = (promoRes.data && (promoRes.data.result || promoRes.data)) || [];
                    const existingPromos = (Array.isArray(rawPromos) ? rawPromos : []).map(normalizePromotion);

                    if (existingPromos.length > 0 && existingPromos[0].startDate) {
                        this.globalStartDate = existingPromos[0].startDate;
                    }

                    this.rows = this.classes.map(c => {
                        const existing = existingPromos.find(p =>
                            String(p.fromClassId).toLowerCase() === String(c.id).toLowerCase()
                        );

                        const toClassId = existing ? existing.toClassId : EMPTY_GUID;
                        return {
                            id: existing ? existing.id : undefined,
                            tenantId: existing ? existing.tenantId : undefined,
                            fromClassId: c.id,
                            fromClassName: c.name,
                            toClassId: toClassId,
                            toClassName: existing ? existing.toClassName : (this.nameOf(this.classes, toClassId) || ''),
                            dirty: false
                        };
                    });

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            onToClassChange(row) {
                row.dirty = true;
                if (!row.toClassId || !this.isGuid(row.toClassId)) {
                    row.toClassId = EMPTY_GUID;
                    row.toClassName = '';
                } else {
                    row.toClassName = this.nameOf(this.classes, row.toClassId) || '';
                }
            },

            buildPayload(row) {
                const toId = this.isGuid(row.toClassId) ? row.toClassId : EMPTY_GUID;
                const toName = toId === EMPTY_GUID ? '' : (this.nameOf(this.classes, toId) || row.toClassName || '');

                const payload = {
                    startDate: toIsoDateTime(this.globalStartDate),
                    fromClassId: this.asGuid(row.fromClassId),
                    fromClassName: String(row.fromClassName || this.nameOf(this.classes, row.fromClassId) || '').trim(),
                    toClassId: toId,
                    toClassName: toName
                };

                if (row.id) {
                    payload.id = row.id;
                    if (row.tenantId !== undefined && row.tenantId !== null) {
                        payload.tenantId = Number(row.tenantId);
                    }
                }

                return payload;
            },

            async saveSingleRow(row) {
                this.savingRowId = row.fromClassId;
                try {
                    const payload = this.buildPayload(row);
                    if (row.id) {
                        await axios.post('/SchoolManager/UpdateClassPromotion/', payload);
                        this.toastHandler('success', `Promotion for ${row.fromClassName} updated.`);
                    } else {
                        const res = await axios.post('/SchoolManager/CreateClassPromotion/', payload);
                        const created = (res && res.data && (res.data.result || res.data)) || {};
                        if (created.id) row.id = created.id;
                        this.toastHandler('success', `Promotion for ${row.fromClassName} saved.`);
                    }
                    row.dirty = false;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.savingRowId = null;
                }
            },

            async saveAllPromotions() {
                if (!this.globalStartDate) {
                    return this.toastHandler('warning', 'Please set the next term Start Date.');
                }

                this.saving = true;
                let savedCount = 0;
                try {
                    for (const row of this.rows) {
                        const payload = this.buildPayload(row);
                        if (row.id) {
                            await axios.post('/SchoolManager/UpdateClassPromotion/', payload);
                        } else {
                            const res = await axios.post('/SchoolManager/CreateClassPromotion/', payload);
                            const created = (res && res.data && (res.data.result || res.data)) || {};
                            if (created.id) row.id = created.id;
                        }
                        row.dirty = false;
                        savedCount++;
                    }
                    this.toastHandler('success', `All ${savedCount} class promotion rules saved successfully.`);
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();

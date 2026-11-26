/* ==========================================================================
 * Student Opening Balance (SmOpeningBalance)
 *
 * Entity Model:
 *  - StudentOpeningBalance : AuditedEntity<Guid>
 *      public Guid AcademicYearId { get; set; }
 *      public string AcademicYearName { get; set; }
 *      public Guid ClassId { get; set; }
 *      public string ClassName { get; set; }
 *      public string StudentIdentifier { get; set; }
 *      public Guid StudentId { get; set; }
 *      public string StudentName { get; set; }
 *      public decimal Amount { get; set; }
 *      public Guid CurrencyId { get; set; }
 *      public decimal Rate { get; set; }
 *      public DateTime Date { get; set; }
 *      public bool IsPosted { get; set; }
 *      public int TenantId { get; set; }
 *
 * Controller Endpoints:
 *  - GET:    /SchoolManager/GetSmOpeningBalances/
 *  - POST:   /SchoolManager/CreateSmOpeningBalance/
 *  - POST:   /SchoolManager/UpdateSmOpeningBalance/
 *  - GET:    /SchoolManager/DeleteSmOpeningBalance?id={id}
 *  - POST:   /SchoolManager/PostSmOpeningBalance/ (List<Guid> balanceIds)
 *
 * Lookups:
 *  - Currencies:    /SharedResource/GetCurrencies/?pageNo=1&pageSize=1000
 *  - AcademicYears: /SchoolManager/GetAcademicYears/
 *  - LevelClasses:  /SchoolManager/GetLevelClasses/
 *  - StudentBios:   /SchoolManager/GetStudentBios/
 *
 * Business Rules:
 *  - A student CANNOT have more than one opening balance for a single currency.
 *    (Duplicate check on create and update).
 *  - Rate automatically defaults from selected currency buyRate.
 *  - Posted balances cannot be edited or deleted.
 *  - Multi-select post action with confirmation dialog.
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

    const pad = n => String(n).padStart(2, '0');

    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';

        if (typeof date === 'string') {
            const raw = date.trim();
            if (!raw) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

            const ms = /\/Date\((-?\d+)/.exec(raw);
            if (ms) {
                const d = new Date(Number(ms[1]));
                return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }

            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;

            const ymd = /^(\d{4})[/](\d{1,2})[/](\d{1,2})/.exec(raw);
            if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
        }

        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    const today = isoDate(new Date());

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.data)) return raw.data;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return [];
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || val(o, 'className') || '',
            className: val(o, 'className') || val(o, 'name') || ''
        }))
        .filter(o => o.id != null && (o.name !== '' || o.className !== ''))
        .sort((a, b) => (a.name || a.className).localeCompare(b.name || b.className));

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId') || val(s, 'studentID');
            const firstName = val(s, 'firstName') || '';
            const lastName = val(s, 'lastName') || '';
            const otherName = val(s, 'otherName') || '';
            const name = val(s, 'studentName') || val(s, 'fullName') || [lastName, firstName, otherName].filter(Boolean).join(' ') || '';
            const identifier = String(val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID') || null;
            const className = val(s, 'className') || '';
            const academicYearId = val(s, 'academicYearId') || null;
            const academicYearName = val(s, 'academicYearName') || '';

            return {
                id,
                name: `${name}${identifier ? ' (' + identifier + ')' : ''}`,
                fullName: name,
                identifier,
                classId,
                className,
                academicYearId,
                academicYearName
            };
        })
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeCurrencies = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            currencyName: val(c, 'currencyName') || val(c, 'name') || '',
            currencyCode: val(c, 'currencyCode') || val(c, 'code') || '',
            name: `${val(c, 'currencyName') || val(c, 'name') || ''} (${val(c, 'currencyCode') || val(c, 'code') || ''})`.trim(),
            buyRate: Number(val(c, 'buyRate')) || 1,
            sellRate: Number(val(c, 'sellRate')) || 1,
            isDefault: Boolean(val(c, 'isDefault'))
        }))
        .filter(c => c.id != null);

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                emptyGuid: EMPTY_GUID,
                isShimmerLoading: false,
                saving: false,
                setupDone: false,

                // Lookups
                students: [],
                currencies: [],
                academicYears: [],
                classes: [],

                // Main Data
                openingBalanceList: [],
                today,
                defaultCurrencyId: '',
                defaultBuyRate: 1,

                // Quick Filter
                filterAcademicYearId: '',
                filterClassId: '',
                searchQuery: ''
            };
        },

        computed: {
            columns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 70 },
                    {
                        key: 'studentId',
                        label: 'Student',
                        type: 'select',
                        width: 280,
                        required: true,
                        searchable: true,
                        options: this.students,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 180,
                        required: true,
                        searchable: true,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        dependsOn: 'studentId',
                        valueFrom: values => this.getClassForStudent(values.studentId)
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 160,
                        required: true,
                        searchable: true,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name',
                        defaultValue: this.academicYears.length ? this.academicYears[0].id : ''
                    },
                    {
                        key: 'date',
                        label: 'Date',
                        type: 'date',
                        width: 140,
                        required: true,
                        searchable: true,
                        defaultValue: today
                    },
                    {
                        key: 'amount',
                        label: 'Amount',
                        type: 'number',
                        width: 150,
                        required: true,
                        decimals: 2
                    },
                    {
                        key: 'currencyId',
                        label: 'Currency',
                        type: 'select',
                        width: 180,
                        required: true,
                        options: this.currencies,
                        value: 'id',
                        display: 'name',
                        defaultValue: this.defaultCurrencyId
                    },
                    {
                        key: 'rate',
                        label: 'Rate',
                        type: 'number',
                        decimals: 4,
                        width: 120,
                        defaultValue: this.defaultBuyRate,
                        dependsOn: 'currencyId',
                        valueFrom: values => this.setCurrencyRate(values.currencyId)
                    },
                    {
                        key: 'isPosted',
                        label: 'Posted',
                        type: 'boolean',
                        width: 100,
                        searchable: true,
                        defaultValue: false,
                        disabled: true
                    },
                    { key: 'studentIdentifier', label: 'Student ID', type: 'text', width: 90, hidden: true },
                    { key: 'studentName', label: 'Student Name', type: 'text', width: 90, hidden: true },
                    { key: 'className', label: 'Class Name', type: 'text', width: 90, hidden: true },
                    { key: 'academicYearName', label: 'Academic Year Name', type: 'text', width: 90, hidden: true }
                ];
            },

            filteredOpeningBalances() {
                let rows = this.openingBalanceList || [];

                if (this.filterAcademicYearId) {
                    rows = rows.filter(r => String(r.academicYearId || '').toLowerCase() === String(this.filterAcademicYearId).toLowerCase());
                }

                if (this.filterClassId) {
                    rows = rows.filter(r => String(r.classId || '').toLowerCase() === String(this.filterClassId).toLowerCase());
                }

                const q = String(this.searchQuery || '').trim().toLowerCase();
                if (q) {
                    rows = rows.filter(r =>
                        (r.studentName || '').toLowerCase().includes(q) ||
                        (r.studentIdentifier || '').toLowerCase().includes(q) ||
                        (r.className || '').toLowerCase().includes(q)
                    );
                }

                return rows;
            },

            totalBalancesCount() {
                return this.openingBalanceList.length;
            },

            postedBalancesCount() {
                return this.openingBalanceList.filter(b => b.isPosted === true).length;
            },

            unpostedBalancesCount() {
                return this.openingBalanceList.filter(b => b.isPosted !== true).length;
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            isPosted(row) {
                return row.isPosted === true;
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

            getClassForStudent(studentId) {
                if (!studentId) return '';
                const student = this.students.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                return student?.classId || '';
            },

            setCurrencyRate(currencyId) {
                if (!currencyId) return 1;
                const currency = this.currencies.find(c => String(c.id).toLowerCase() === String(currencyId).toLowerCase());
                return currency?.buyRate ?? 1;
            },

            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            async getOpeningBalances() {
                this.isShimmerLoading = true;
                try {
                    const list = await this.fetchList('/SchoolManager/GetSmOpeningBalances/', 'Student Opening Balances');
                    this.openingBalanceList = (list || []).map(item => ({
                        ...item,
                        id: this.val(item, 'id'),
                        studentId: this.val(item, 'studentId'),
                        studentName: this.val(item, 'studentName') || '',
                        studentIdentifier: this.val(item, 'studentIdentifier') || '',
                        classId: this.val(item, 'classId'),
                        className: this.val(item, 'className') || '',
                        academicYearId: this.val(item, 'academicYearId'),
                        academicYearName: this.val(item, 'academicYearName') || '',
                        amount: Number(this.val(item, 'amount')) || 0,
                        currencyId: this.val(item, 'currencyId'),
                        rate: Number(this.val(item, 'rate')) || 1,
                        date: isoDate(this.val(item, 'date')) || today,
                        isPosted: Boolean(this.val(item, 'isPosted')),
                        tenantId: this.val(item, 'tenantId')
                    }));
                } catch (err) {
                    this.toastHandler('error', 'Failed to refresh student opening balances.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async loadLookups() {
                this.isShimmerLoading = true;
                try {
                    const [rawStudents, rawClasses, rawYears, rawCurrencies] = await Promise.all([
                        this.fetchList('/SchoolManager/GetStudentBios/', 'Student Bios'),
                        this.fetchList('/SchoolManager/GetLevelClasses/', 'Classes'),
                        this.fetchList('/SchoolManager/GetAcademicYears/', 'Academic Years'),
                        this.fetchList('/SharedResource/GetCurrencies/?pageNo=1&pageSize=1000', 'Currencies')
                    ]);

                    this.students = normalizeStudents(rawStudents);
                    this.classes = normalizeLookups(rawClasses);
                    this.academicYears = normalizeLookups(rawYears);
                    this.currencies = normalizeCurrencies(rawCurrencies);

                    // Set default currency
                    const defaultCur = this.currencies.find(c => c.isDefault) || (this.currencies.length ? this.currencies[0] : null);
                    if (defaultCur) {
                        this.defaultCurrencyId = defaultCur.id;
                        this.defaultBuyRate = defaultCur.buyRate;
                    }

                    if (this.academicYears.length > 0 && !this.filterAcademicYearId) {
                        this.filterAcademicYearId = this.academicYears[0].id;
                    }

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Error initializing reference lookups.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /**
             * DUPLICATE CURRENCY CHECK:
             * "a student cannot have more than one opening balance for a single currency"
             */
            checkStudentCurrencyDuplicate(studentId, currencyId, excludeRecordId = null) {
                if (!studentId || !currencyId) return false;
                const sKey = String(studentId).toLowerCase();
                const cKey = String(currencyId).toLowerCase();
                const exKey = excludeRecordId ? String(excludeRecordId).toLowerCase() : null;

                return this.openingBalanceList.some(item => {
                    if (exKey && String(item.id).toLowerCase() === exKey) return false;
                    return String(item.studentId || '').toLowerCase() === sKey &&
                        String(item.currencyId || '').toLowerCase() === cKey;
                });
            },

            async onCreate(payload = {}) {
                const row = { ...(payload.data || payload.row || payload) };

                if (!row.studentId) {
                    return this.toastHandler('warning', 'Please select a student.');
                }
                if (!row.currencyId) {
                    return this.toastHandler('warning', 'Please select a currency.');
                }
                if (row.amount === undefined || row.amount === null || isNaN(Number(row.amount))) {
                    return this.toastHandler('warning', 'Please enter a valid amount.');
                }

                // Check duplicate student + currency
                if (this.checkStudentCurrencyDuplicate(row.studentId, row.currencyId)) {
                    const student = this.students.find(s => String(s.id).toLowerCase() === String(row.studentId).toLowerCase());
                    const currency = this.currencies.find(c => String(c.id).toLowerCase() === String(row.currencyId).toLowerCase());
                    const sName = student ? student.fullName : 'This student';
                    const cName = currency ? currency.name : 'this currency';
                    this.toastHandler('error', `${sName} already has an opening balance for ${cName}. Duplicate opening balances for the same currency are not allowed.`);
                    return;
                }

                const student = this.students.find(s => String(s.id).toLowerCase() === String(row.studentId).toLowerCase());
                const classItem = this.classes.find(c => String(c.id).toLowerCase() === String(row.classId).toLowerCase());
                const yearItem = this.academicYears.find(y => String(y.id).toLowerCase() === String(row.academicYearId).toLowerCase());
                const currency = this.currencies.find(c => String(c.id).toLowerCase() === String(row.currencyId).toLowerCase());

                const record = {
                    academicYearId: this.asGuid(row.academicYearId || student?.academicYearId),
                    academicYearName: yearItem?.name || student?.academicYearName || '',
                    classId: this.asGuid(row.classId || student?.classId),
                    className: classItem?.name || student?.className || '',
                    studentId: this.asGuid(row.studentId),
                    studentIdentifier: student?.identifier || row.studentIdentifier || '',
                    studentName: student?.fullName || row.studentName || '',
                    amount: Number(row.amount) || 0,
                    currencyId: this.asGuid(row.currencyId),
                    rate: Number(row.rate) || currency?.buyRate || 1,
                    date: isoDate(row.date) || today,
                    isPosted: false
                };

                try {
                    const res = await axios.post('/SchoolManager/CreateSmOpeningBalance/', record);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && result.code !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to create student opening balance.');
                        await this.getOpeningBalances();
                        return;
                    }

                    this.toastHandler('success', 'Student opening balance created successfully.');
                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance creation failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to create student opening balance.');
                    await this.getOpeningBalances();
                }
            },

            async onUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                const rawId = row.id;
                const id = typeof rawId === 'object' ? rawId?.id : rawId;

                const existing = this.openingBalanceList.find(item => String(item.id).toLowerCase() === String(id).toLowerCase());
                if (!existing) {
                    this.toastHandler('error', 'Opening balance record not found.');
                    return;
                }

                if (existing.isPosted) {
                    this.toastHandler('warning', 'Posted opening balances cannot be edited.');
                    await this.getOpeningBalances();
                    return;
                }

                // Check duplicate student + currency (excluding current record)
                if (this.checkStudentCurrencyDuplicate(row.studentId, row.currencyId, id)) {
                    const student = this.students.find(s => String(s.id).toLowerCase() === String(row.studentId).toLowerCase());
                    const currency = this.currencies.find(c => String(c.id).toLowerCase() === String(row.currencyId).toLowerCase());
                    const sName = student ? student.fullName : 'This student';
                    const cName = currency ? currency.name : 'this currency';
                    this.toastHandler('error', `${sName} already has an opening balance for ${cName}. Duplicate opening balances for the same currency are not allowed.`);
                    await this.getOpeningBalances();
                    return;
                }

                const student = this.students.find(s => String(s.id).toLowerCase() === String(row.studentId).toLowerCase());
                const classItem = this.classes.find(c => String(c.id).toLowerCase() === String(row.classId).toLowerCase());
                const yearItem = this.academicYears.find(y => String(y.id).toLowerCase() === String(row.academicYearId).toLowerCase());
                const currency = this.currencies.find(c => String(c.id).toLowerCase() === String(row.currencyId).toLowerCase());

                const record = {
                    ...existing,
                    ...row,
                    id: existing.id,
                    tenantId: existing.tenantId,
                    academicYearId: this.asGuid(row.academicYearId || existing.academicYearId),
                    academicYearName: yearItem?.name || existing.academicYearName || '',
                    classId: this.asGuid(row.classId || existing.classId),
                    className: classItem?.name || existing.className || '',
                    studentId: this.asGuid(row.studentId || existing.studentId),
                    studentIdentifier: student?.identifier || existing.studentIdentifier || '',
                    studentName: student?.fullName || existing.studentName || '',
                    amount: Number(row.amount) || 0,
                    currencyId: this.asGuid(row.currencyId || existing.currencyId),
                    rate: Number(row.rate) || currency?.buyRate || existing.rate || 1,
                    date: isoDate(row.date) || existing.date || today,
                    isPosted: existing.isPosted
                };

                try {
                    const res = await axios.post('/SchoolManager/UpdateSmOpeningBalance/', record);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Failed to update opening balance.');
                        await this.getOpeningBalances();
                        return;
                    }

                    this.toastHandler('success', 'Student opening balance updated successfully.');
                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance update failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to update student opening balance.');
                    await this.getOpeningBalances();
                }
            },

            async onDelete(event) {
                const deleted = Array.isArray(event?.rows) ? event.rows : (event?.row ? [event.row] : []);

                if (!deleted.length) {
                    this.toastHandler('warning', 'No student opening balance selected for deletion.');
                    return;
                }

                // Posted guard
                const postedItem = deleted.find(r => r.isPosted === true);
                if (postedItem) {
                    this.toastHandler('error', 'Posted opening balances cannot be deleted.');
                    return;
                }

                try {
                    for (const row of deleted) {
                        const id = typeof row.id === 'object' ? row.id?.id : row.id;
                        if (!id) continue;

                        const res = await axios.get(`/SchoolManager/DeleteSmOpeningBalance?id=${encodeURIComponent(id)}`);
                        if (res.data?.success === false) {
                            this.toastHandler('error', res.data.message || 'Failed to delete opening balance.');
                            return;
                        }
                    }

                    this.toastHandler('success', 'Student opening balance deleted successfully.');
                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance deletion failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to delete student opening balance.');
                }
            },

            async postBalances() {
                const grid = this.$refs.balancesGrid;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more opening balances to post.');
                    return;
                }

                // Filter unposted
                const balancesToPost = selected.filter(b => b.isPosted !== true);
                const skippedCount = selected.length - balancesToPost.length;

                if (!balancesToPost.length) {
                    this.toastHandler('info', 'All selected student opening balances have already been posted.');
                    return;
                }

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Posting',
                        text: `Are you sure you want to post ${balancesToPost.length} student opening balance${balancesToPost.length === 1 ? '' : 's'}?${skippedCount > 0 ? ` (${skippedCount} already-posted balance(s) will be skipped).` : ''} Posted balances cannot be updated or deleted.`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, post',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#062a81',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true
                    });

                    if (!result.isConfirmed) return;
                }

                try {
                    const balanceIds = balancesToPost.map(b => b.id);
                    const res = await axios.post('/SchoolManager/PostSmOpeningBalance/', balanceIds);

                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to post selected opening balances.');
                        return;
                    }

                    if (grid.clearSelection) {
                        grid.clearSelection();
                    }

                    this.toastHandler(
                        'success',
                        skippedCount > 0
                            ? `Posted ${balancesToPost.length} opening balance(s). Skipped ${skippedCount} already-posted balance(s).`
                            : 'Student opening balance(s) posted successfully.'
                    );

                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Posting opening balances failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to post opening balance(s).');
                    await this.getOpeningBalances();
                }
            }
        },

        async mounted() {
            await this.loadLookups();
            await this.getOpeningBalances();
        }
    });

    if (typeof DataGridPlugin !== 'undefined') {
        app.use(DataGridPlugin);
    }
    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();

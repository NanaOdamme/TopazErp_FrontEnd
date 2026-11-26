/* ==========================================================================
 * Student Opening Balances Import — Excel / Sheet Import
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
 *  - GET:  /SchoolManager/GetSmOpeningBalances/
 *  - POST: /SchoolManager/CreateSmOpeningBalance/
 *  - GET:  /SchoolManager/GetStudentBios/
 *  - GET:  /SchoolManager/GetLevelClasses/
 *  - GET:  /SchoolManager/GetAcademicYears/
 *  - GET:  /SharedResource/GetCurrencies/?pageNo=1&pageSize=1000
 *
 * Page Workflow & Dropdowns:
 *  - Header Dropdowns:
 *      1. Academic Year (required)
 *      2. Class (required)
 *      3. Currency (required, rate auto-fills from currency's buyRate)
 *      4. Rate (editable number, defaults to selected Currency buyRate)
 *      5. Default Date (editable date, defaults to today's date)
 *  - Template Generation ("Download Class Template"):
 *      When a class is selected, generates an Excel/CSV file populated with the students
 *      currently enrolled in that class.
 *  - Exact Sheet Headers:
 *      No., Reg No, StudentName, Date, Amount
 *  - Business Rules:
 *      - If Date is left blank in the sheet, it defaults to the selected Default Date (or today).
 *      - A student CANNOT have more than one opening balance for a single currency.
 *        Checked against both database records and within the uploaded spreadsheet.
 *      - If duplicate currency balance or invalid student Reg No is detected -> row is flagged and save is blocked.
 *      - Custom 4-second toastHandler.
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

    const todayIso = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const toInputDate = (v, defaultFallback = null) => {
        const fallback = defaultFallback || todayIso();
        if (!v && v !== 0) return fallback;
        if (v instanceof Date) {
            if (!isNaN(v.getTime())) {
                const y = v.getFullYear();
                const m = String(v.getMonth() + 1).padStart(2, '0');
                const d = String(v.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        }
        if (typeof v === 'number') {
            if (v > 3000 && v < 100000) {
                const date = new Date(Math.round((v - 25569) * 86400 * 1000));
                if (!isNaN(date.getTime())) {
                    const y = date.getUTCFullYear();
                    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const d = String(date.getUTCDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
            }
        }
        const s = String(v).trim();
        if (!s) return fallback;

        if (/^\d{4,5}(\.\d+)?$/.test(s)) {
            const num = parseFloat(s);
            if (num > 3000 && num < 100000) {
                const date = new Date(Math.round((num - 25569) * 86400 * 1000));
                if (!isNaN(date.getTime())) {
                    const y = date.getUTCFullYear();
                    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const d = String(date.getUTCDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
            }
        }

        const iso = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (iso) {
            const yr = parseInt(iso[1], 10);
            if (yr >= 1900 && yr <= 2200) {
                const y = iso[1];
                const m = String(iso[2]).padStart(2, '0');
                const d = String(iso[3]).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        }

        const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
        if (dmy) {
            const yr = parseInt(dmy[3], 10);
            if (yr >= 1900 && yr <= 2200) {
                const day = String(dmy[1]).padStart(2, '0');
                const mon = String(dmy[2]).padStart(2, '0');
                const y = dmy[3];
                return `${y}-${mon}-${day}`;
            }
        }

        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            if (y >= 1900 && y <= 2200) {
                const m = String(parsed.getMonth() + 1).padStart(2, '0');
                const d = String(parsed.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        }
        return fallback;
    };

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
            const fullName = val(s, 'studentName') || val(s, 'fullName') || [lastName, firstName, otherName].filter(Boolean).join(' ') || '';
            const identifier = String(val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID') || null;
            const className = val(s, 'className') || '';
            const academicYearId = val(s, 'academicYearId') || null;
            const academicYearName = val(s, 'academicYearName') || '';

            return {
                id,
                name: fullName,
                identifier,
                classId,
                className,
                academicYearId,
                academicYearName
            };
        })
        .filter(s => s.id != null && s.name !== '');

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

    const parseCsvToRows = text => {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const rowObj = {};
            headers.forEach((h, idx) => {
                rowObj[h] = values[idx] !== undefined ? values[idx] : '';
            });
            rows.push(rowObj);
        }
        return rows;
    };

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                theme: '#062a81',

                // Lookups
                students: [],
                classes: [],
                academicYears: [],
                currencies: [],
                existingBalances: [],

                // Header Dropdowns / Selections
                selectedAcademicYearId: '',
                selectedClassId: '',
                selectedCurrencyId: '',
                selectedRate: 1,
                defaultDate: todayIso(),

                // File Upload & Preview
                fileName: '',
                isDragging: false,
                importedRows: [],
                searchQuery: '',

                // Pagination
                currentPage: 1,
                pageSize: 10,
                pageSizeOptions: [5, 10, 20, 50]
            };
        },

        computed: {
            scopeReady() {
                return Boolean(this.selectedAcademicYearId && this.selectedClassId && this.selectedCurrencyId);
            },

            selectedAcademicYear() {
                return this.academicYears.find(y => String(y.id).toLowerCase() === String(this.selectedAcademicYearId).toLowerCase()) || null;
            },

            selectedClass() {
                return this.classes.find(c => String(c.id).toLowerCase() === String(this.selectedClassId).toLowerCase()) || null;
            },

            selectedCurrency() {
                return this.currencies.find(c => String(c.id).toLowerCase() === String(this.selectedCurrencyId).toLowerCase()) || null;
            },

            studentsInClass() {
                if (!this.selectedClassId) return [];
                const cKey = String(this.selectedClassId).toLowerCase();
                return this.students.filter(s => String(s.classId || '').toLowerCase() === cKey);
            },

            studentRegIndex() {
                const map = {};
                for (const s of this.students) {
                    if (s.identifier) {
                        map[s.identifier.toLowerCase()] = s;
                    }
                }
                return map;
            },

            validRowCount() {
                return (this.importedRows || []).filter(r => r.isValid).length;
            },

            invalidRowCount() {
                return (this.importedRows || []).filter(r => !r.isValid).length;
            },

            hasInvalidRows() {
                return (this.importedRows || []).some(r => !r.isValid);
            },

            filteredImported() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.importedRows;

                return (this.importedRows || []).filter(r => {
                    const studentReg = (r.studentRegNo || '').toLowerCase();
                    const studentName = (r.studentName || '').toLowerCase();
                    return studentReg.includes(query) || studentName.includes(query);
                });
            },

            totalPages() {
                const total = this.filteredImported.length;
                return Math.max(1, Math.ceil(total / this.pageSize));
            },

            paginatedImported() {
                const start = (this.currentPage - 1) * this.pageSize;
                return this.filteredImported.slice(start, start + this.pageSize);
            },

            paginationStart() {
                if (this.filteredImported.length === 0) return 0;
                return (this.currentPage - 1) * this.pageSize + 1;
            },

            paginationEnd() {
                return Math.min(this.currentPage * this.pageSize, this.filteredImported.length);
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
            }
        },

        watch: {
            selectedCurrencyId(newVal) {
                const cur = this.currencies.find(c => String(c.id).toLowerCase() === String(newVal).toLowerCase());
                if (cur && cur.buyRate) {
                    this.selectedRate = cur.buyRate;
                }
            },
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
            val,
            isGuid,
            asGuid,

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

            downloadTemplate() {
                if (!this.selectedClassId) {
                    return this.toastHandler('warning', 'Please select a Class first to download its members.');
                }
                if (this.studentsInClass.length === 0) {
                    return this.toastHandler('warning', 'No students found enrolled in the selected class.');
                }

                // Headers requested: No., Reg No, StudentName, Date, Amount
                const headers = ['No.', 'Reg No', 'StudentName', 'Date', 'Amount'];
                const rows = this.studentsInClass.map((st, idx) => [
                    idx + 1,
                    st.identifier || '',
                    st.name || '',
                    this.defaultDate || todayIso(), // pre-fill with selected date
                    '' // Blank Amount for entry
                ]);

                const sheetData = [headers, ...rows];
                const classNameClean = (this.selectedClass ? this.selectedClass.name : 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');

                if (typeof XLSX !== 'undefined') {
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    ws['!cols'] = [
                        { wch: 6 },
                        { wch: 18 },
                        { wch: 30 },
                        { wch: 16 },
                        { wch: 16 }
                    ];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Opening_Balances');
                    const fileName = `${classNameClean}_Opening_Balances_Template.xlsx`;
                    XLSX.writeFile(wb, fileName);
                    this.toastHandler('success', `Excel template generated: ${fileName} (${this.studentsInClass.length} students)`);
                } else {
                    const csvContent = 'data:text/csv;charset=utf-8,' + sheetData.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `${classNameClean}_Opening_Balances_Template.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    this.toastHandler('success', 'CSV template downloaded.');
                }
            },

            clearImport() {
                this.importedRows = [];
                this.fileName = '';
                this.currentPage = 1;
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.value = '';
                }
            },

            handleFileDrop(e) {
                this.isDragging = false;
                const files = e.dataTransfer && e.dataTransfer.files;
                if (files && files.length > 0) {
                    this.processFile(files[0]);
                }
            },

            handleFileSelect(e) {
                const files = e.target.files;
                if (files && files.length > 0) {
                    this.processFile(files[0]);
                }
            },

            processFile(file) {
                if (!this.scopeReady) {
                    return this.toastHandler('warning', 'Please select Academic Year, Class, and Currency from the dropdowns first.');
                }

                this.fileName = file.name;
                const isExcel = /\.(xlsx|xls)$/i.test(file.name);
                const isCsv = /\.csv$/i.test(file.name);

                if (!isExcel && !isCsv) {
                    return this.toastHandler('error', 'Please upload a valid Excel (.xlsx, .xls) or CSV file.');
                }

                const reader = new FileReader();

                if (isExcel && typeof XLSX !== 'undefined') {
                    reader.onload = e => {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                            const firstSheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[firstSheetName];
                            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
                            this.mapImportedData(json);
                        } catch (err) {
                            this.toastHandler('error', 'Failed to parse Excel file.');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.onload = e => {
                        try {
                            const text = e.target.result;
                            const rows = parseCsvToRows(text);
                            this.mapImportedData(rows);
                        } catch (err) {
                            this.toastHandler('error', 'Failed to parse CSV file.');
                        }
                    };
                    reader.readAsText(file);
                }
            },

            mapImportedData(rawRows) {
                if (!rawRows || rawRows.length === 0) {
                    return this.toastHandler('warning', 'The uploaded file contains no data rows.');
                }

                const curId = this.selectedCurrencyId;
                const cur = this.selectedCurrency;
                const rate = Number(this.selectedRate) || 1;
                const yearId = this.selectedAcademicYearId;
                const yearName = this.selectedAcademicYear ? this.selectedAcademicYear.name : '';
                const classId = this.selectedClassId;
                const className = this.selectedClass ? this.selectedClass.name : '';

                // Map of existing balances for the selected currency in DB
                const existingStudentIdsWithThisCurrency = new Set(
                    (this.existingBalances || [])
                        .filter(b => String(this.val(b, 'currencyId') || '').toLowerCase() === String(curId).toLowerCase())
                        .map(b => String(this.val(b, 'studentId') || '').toLowerCase())
                );

                // Internal sheet tracking to avoid duplicate students with this currency in the sheet
                const seenInFileStudentIds = new Set();

                const parsed = [];
                let errorCount = 0;

                rawRows.forEach((row, idx) => {
                    const getCol = (patterns) => {
                        for (const p of patterns) {
                            for (const k of Object.keys(row)) {
                                if (k.trim().toLowerCase() === p.toLowerCase()) {
                                    return String(row[k] || '').trim();
                                }
                            }
                        }
                        return '';
                    };

                    const no = getCol(['No.', 'No', 'S.No', 'SNo']) || String(idx + 1);
                    const studentRegNo = getCol(['Reg No', 'student Reg No', 'studentRegNo', 'Student Reg No', 'RegNo', 'Reg No.', 'Student ID', 'studentIdentifier']);
                    const rawStudentName = getCol(['StudentName', 'Student Name', 'Name']);
                    const rawDate = getCol(['Date', 'TransactionDate', 'BalanceDate']);
                    const rawAmount = getCol(['Amount', 'Balance', 'OpeningBalance']);

                    const errors = [];

                    // 1. Resolve Student via Reg No
                    let studentId = null;
                    let studentName = rawStudentName;

                    if (!studentRegNo) {
                        errors.push('Student Reg No is required.');
                    } else {
                        const regClean = studentRegNo.toLowerCase();
                        const matchedStudent = this.studentRegIndex[regClean] || null;
                        if (matchedStudent) {
                            studentId = matchedStudent.id;
                            studentName = matchedStudent.name;
                        } else {
                            errors.push(`Student with Reg No "${studentRegNo}" was not found in the student database.`);
                        }
                    }

                    // 2. Validate Amount
                    const amount = parseFloat(rawAmount);
                    if (rawAmount === '' || isNaN(amount)) {
                        errors.push('Valid Amount is required.');
                    }

                    // 3. Date
                    const date = rawDate ? toInputDate(rawDate, this.defaultDate) : (this.defaultDate || todayIso());

                    // 4. Duplicate Check: Single opening balance per student per currency
                    if (studentId) {
                        const sKey = String(studentId).toLowerCase();
                        if (existingStudentIdsWithThisCurrency.has(sKey)) {
                            errors.push(`Student "${studentName}" already has an opening balance for ${cur?.name || 'this currency'} in the database.`);
                        } else if (seenInFileStudentIds.has(sKey)) {
                            errors.push(`Duplicate row in spreadsheet for Student "${studentName}".`);
                        } else {
                            seenInFileStudentIds.add(sKey);
                        }
                    }

                    const isValid = errors.length === 0;
                    if (!isValid) errorCount++;

                    parsed.push({
                        no,
                        studentRegNo,
                        studentId,
                        studentName,
                        classId,
                        className,
                        academicYearId: yearId,
                        academicYearName: yearName,
                        currencyId: curId,
                        currencyCode: cur?.currencyCode || '',
                        currencyName: cur?.currencyName || '',
                        rate,
                        amount: isNaN(amount) ? 0 : amount,
                        date,
                        isPosted: false,
                        isValid,
                        validationMessage: errors.join(' ')
                    });
                });

                this.importedRows = parsed;
                this.currentPage = 1;

                if (errorCount > 0) {
                    this.toastHandler('error', `Import blocked: ${errorCount} row(s) contain errors (e.g. student not found, invalid amount, or duplicate balance for this currency).`);
                } else if (this.validRowCount > 0) {
                    this.toastHandler('success', `Parsed ${parsed.length} rows. Found ${this.validRowCount} valid opening balance record(s) ready to import.`);
                } else {
                    this.toastHandler('warning', `Parsed ${parsed.length} rows, but all were invalid.`);
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [studentsRes, classesRes, yearsRes, currenciesRes, balancesRes] = await Promise.all([
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get('/SharedResource/GetCurrencies/?pageNo=1&pageSize=1000'),
                        safeGet(axios.get('/SchoolManager/GetSmOpeningBalances/'))
                    ]);

                    this.students = normalizeStudents(unwrapList(studentsRes.data));
                    this.classes = normalizeLookups(unwrapList(classesRes.data));
                    this.academicYears = normalizeLookups(unwrapList(yearsRes.data));
                    this.currencies = normalizeCurrencies(unwrapList(currenciesRes.data));
                    this.existingBalances = unwrapList(balancesRes.data);

                    // Set default selections
                    if (this.academicYears.length > 0 && !this.selectedAcademicYearId) {
                        this.selectedAcademicYearId = this.academicYears[0].id;
                    }
                    if (this.classes.length > 0 && !this.selectedClassId) {
                        this.selectedClassId = this.classes[0].id;
                    }
                    const defCur = this.currencies.find(c => c.isDefault) || (this.currencies.length ? this.currencies[0] : null);
                    if (defCur && !this.selectedCurrencyId) {
                        this.selectedCurrencyId = defCur.id;
                        this.selectedRate = defCur.buyRate || 1;
                    }

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Failed to load reference setups (students, currencies, classes).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row) {
                return {
                    academicYearId: this.asGuid(row.academicYearId),
                    academicYearName: String(row.academicYearName || '').trim(),
                    classId: this.asGuid(row.classId),
                    className: String(row.className || '').trim(),
                    studentId: this.asGuid(row.studentId),
                    studentIdentifier: String(row.studentRegNo || '').trim(),
                    studentName: String(row.studentName || '').trim(),
                    amount: Number(row.amount) || 0,
                    currencyId: this.asGuid(row.currencyId),
                    rate: Number(row.rate) || 1,
                    date: isoDate(row.date) || todayIso(),
                    isPosted: false
                };
            },

            async saveImportedBalances() {
                const invalidRows = (this.importedRows || []).filter(r => !r.isValid);
                if (invalidRows.length > 0) {
                    const firstErr = invalidRows[0].validationMessage || 'Invalid values found.';
                    return this.toastHandler('error', `Cannot save: ${invalidRows.length} row(s) contain errors. First error: ${firstErr}`);
                }

                const candidates = (this.importedRows || []).filter(r => r.isValid);
                if (candidates.length === 0) {
                    return this.toastHandler('warning', 'There are no valid opening balance records to save.');
                }

                this.saving = true;
                let successCount = 0;
                let failCount = 0;

                try {
                    for (const row of candidates) {
                        const payload = this.buildPayload(row);
                        try {
                            await axios.post('/SchoolManager/CreateSmOpeningBalance/', payload);
                            successCount++;
                        } catch (err) {
                            failCount++;
                            console.error('Failed saving opening balance for student', row.studentRegNo, err);
                        }
                    }

                    if (successCount > 0) {
                        this.toastHandler('success', `Successfully imported ${successCount} student opening balance(s).`);
                        this.clearImport();
                        // Refresh balances
                        const balancesRes = await axios.get('/SchoolManager/GetSmOpeningBalances/');
                        this.existingBalances = unwrapList(balancesRes.data);
                    }
                    if (failCount > 0) {
                        this.toastHandler('warning', `${failCount} opening balance record(s) could not be saved.`);
                    }
                } catch (err) {
                    this.toastHandler('error', 'Encountered error during bulk student opening balance import.');
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

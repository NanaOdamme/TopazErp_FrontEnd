/* ==========================================================================
 * Student Evaluation Import — Excel / Sheet Import for Teacher Remarks
 *
 * Entity Model:
 *  - RemarksByTeacher : AuditedEntity<Guid>
 *      public Guid AcademicYearId { get; set; }
 *      public Guid TermId { get; set; }
 *      public Guid ClassId { get; set; }
 *      public string TeacherType { get; set; }     // Class | Head
 *      public string RemarkType { get; set; }      // MidTerm | Overall
 *      public string Remark { get; set; }
 *      public Guid StudentId { get; set; }
 *      public string StudentName { get; set; }
 *      public string StudentIdentifier { get; set; }
 *      public int TenantId { get; set; }
 *
 * Controller Endpoints:
 *  - GET:  /SchoolManager/GetRemarksByTeachers/
 *  - POST: /SchoolManager/CreateRemarksByTeacher/
 *  - POST: /SchoolManager/UpdateRemarksByTeacher/
 *
 * Sheet Template Headers:
 *  - No.: Row index
 *  - Reg No.: Student Identifier / Registration Number
 *  - StudentName: Student Name (lastName firstName otherName)
 *  - Remarks: Teacher Remark / Evaluation
 *
 * Features:
 *  - 2 Tabs: 'MidTerm' (Mid-Term Remarks) & 'Overall' (Exam Remarks)
 *  - TeacherType selector ('Class' / 'Head')
 *  - Dynamic sheet template generation (.xlsx / .csv) for students in the class
 *  - Dropzone supporting Excel (.xlsx, .xls) and CSV upload
 *  - Interactive preview table with editable remarks
 *  - Existing remarks warning and check
 *  - Smart matching: creates new remark if not existing, updates if already present
 *  - Custom 4-second toastHandler
 * ========================================================================== */
(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const TEACHER_TYPES = [
        { id: 'Class', name: 'Class Teacher Remarks' },
        { id: 'Head', name: 'Headmaster Remarks' }
    ];

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

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title)) ||
        (err && err.message) ||
        'Something went wrong.';

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || ''
        }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId');
            const identifier = val(s, 'studentIdentifier') || val(s, 'studentID') || val(s, 'identifier') || '';
            const firstName = String(val(s, 'firstName') || '').trim();
            const otherName = String(val(s, 'otherName') || '').trim();
            const lastName = String(val(s, 'lastName') || '').trim();
            const combined = [lastName, firstName, otherName].filter(Boolean).join(' ').trim();
            const name = combined || String(val(s, 'name') || val(s, 'fullName') || val(s, 'studentName') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID');

            return {
                id: id ? String(id) : undefined,
                studentIdentifier: String(identifier).trim(),
                name: name || 'Student',
                classId: classId ? String(classId) : null
            };
        })
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeRemarkRecord = r => ({
        id: val(r, 'id') ? String(val(r, 'id')) : undefined,
        academicYearId: asGuid(val(r, 'academicYearId')),
        termId: asGuid(val(r, 'termId')),
        classId: asGuid(val(r, 'classId')),
        teacherType: String(val(r, 'teacherType') || 'Class').trim(),
        remarkType: String(val(r, 'remarkType') || 'MidTerm').trim(),
        remark: String(val(r, 'remark') || '').trim(),
        studentId: asGuid(val(r, 'studentId')),
        studentName: String(val(r, 'studentName') || '').trim(),
        studentIdentifier: String(val(r, 'studentIdentifier') || '').trim(),
        tenantId: val(r, 'tenantId') !== undefined ? Number(val(r, 'tenantId')) : undefined
    });

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
                academicYears: [],
                terms: [],
                classes: [],
                allStudents: [],
                teacherTypes: TEACHER_TYPES,

                // Active Scope Filter
                academicYearId: '',
                termId: '',
                classId: '',

                // Evaluation Tab: 'MidTerm' | 'Overall'
                activeTab: 'MidTerm',

                // Selected Teacher Type: 'Class' | 'Head'
                selectedTeacherType: 'Class',

                // Existing Remarks loaded from server
                remarksList: [],

                // File Upload & Preview State
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
                return !!(this.academicYearId && this.termId && this.classId);
            },

            selectedAcademicYear() {
                return this.academicYears.find(y => String(y.id).toLowerCase() === String(this.academicYearId).toLowerCase());
            },

            selectedTerm() {
                return this.terms.find(t => String(t.id).toLowerCase() === String(this.termId).toLowerCase());
            },

            selectedClass() {
                return this.classes.find(c => String(c.id).toLowerCase() === String(this.classId).toLowerCase());
            },

            studentsInClass() {
                if (!this.classId) return [];
                const cId = String(this.classId).toLowerCase();
                return (this.allStudents || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === cId
                );
            },

            existingActiveRemarksCount() {
                return this.existingRemarksCount(this.activeTab);
            },

            validRowCount() {
                return (this.importedRows || []).filter(r => r.matched && r.remark && r.remark.trim().length > 0).length;
            },

            filteredImported() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.importedRows;

                return (this.importedRows || []).filter(s => {
                    const name = (s.studentName || '').toLowerCase();
                    const ident = (s.studentIdentifier || '').toLowerCase();
                    const remark = (s.remark || '').toLowerCase();
                    return name.includes(query) || ident.includes(query) || remark.includes(query);
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
            academicYears(list) {
                if (!this.academicYearId && list && list.length) {
                    this.academicYearId = list[0].id;
                }
            },
            terms(list) {
                if (!this.termId && list && list.length) {
                    this.termId = list[0].id;
                }
            },
            classes(list) {
                if (!this.classId && list && list.length) {
                    this.classId = list[0].id;
                }
            },
            classId() {
                this.checkExistingAndWarn();
            },
            academicYearId() {
                this.checkExistingAndWarn();
            },
            termId() {
                this.checkExistingAndWarn();
            },
            selectedTeacherType() {
                this.checkExistingAndWarn();
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
            errMsg,
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

            existingRemarksCount(rType) {
                if (!this.scopeReady) return 0;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const tType = String(this.selectedTeacherType).toLowerCase();
                const targetRType = String(rType).toLowerCase();

                const classStudentIds = new Set(this.studentsInClass.map(s => String(s.id).toLowerCase()));

                return (this.remarksList || []).filter(r =>
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.teacherType).toLowerCase() === tType &&
                    String(r.remarkType).toLowerCase() === targetRType &&
                    classStudentIds.has(String(r.studentId).toLowerCase()) &&
                    r.remark && r.remark.trim().length > 0
                ).length;
            },

            checkExistingAndWarn() {
                const count = this.existingActiveRemarksCount;
                if (this.scopeReady && count > 0) {
                    const role = this.selectedTeacherType === 'Class' ? 'Class Teacher' : 'Headmaster';
                    const period = this.activeTab === 'MidTerm' ? 'Mid-Term' : 'Exam';
                    this.toastHandler('warning', `${count} ${role} remark(s) already exist for ${period}.`);
                }
            },

            setActiveTab(tabName) {
                this.activeTab = tabName;
                this.currentPage = 1;
                this.checkExistingAndWarn();
            },

            clearImport() {
                this.importedRows = [];
                this.fileName = '';
                this.currentPage = 1;
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.value = '';
                }
            },

            downloadTemplate() {
                if (!this.scopeReady) {
                    return this.toastHandler('warning', 'Please select Academic Year, Term, and Class first.');
                }
                if (this.studentsInClass.length === 0) {
                    return this.toastHandler('warning', 'No students found enrolled in the selected class.');
                }

                // Headers requested: No. Reg No. StudentName and Remarks
                const headers = ['No.', 'Reg No.', 'StudentName', 'Remarks'];
                const rows = this.studentsInClass.map((st, index) => [
                    index + 1,
                    st.studentIdentifier || '',
                    st.name || '',
                    '' // Blank remark for teacher entry
                ]);

                const sheetData = [headers, ...rows];

                if (typeof XLSX !== 'undefined') {
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 50 }];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, this.activeTab);

                    const className = (this.selectedClass ? this.selectedClass.name : 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
                    const role = this.selectedTeacherType === 'Class' ? 'ClassTeacher' : 'Headmaster';
                    const fileName = `${className}_${role}_${this.activeTab}_Remarks_Template.xlsx`;
                    XLSX.writeFile(wb, fileName);
                    this.toastHandler('success', `Excel template generated: ${fileName}`);
                } else {
                    const csvContent = 'data:text/csv;charset=utf-8,' + sheetData.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `${this.activeTab}_Remarks_Template.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    this.toastHandler('success', 'CSV template downloaded.');
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
                    return this.toastHandler('warning', 'Please select Academic Year, Term, and Class before uploading.');
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
                            const workbook = XLSX.read(data, { type: 'array' });
                            const firstSheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[firstSheetName];
                            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                            this.mapImportedData(json);
                        } catch (err) {
                            this.toastHandler('error', 'Failed to parse Excel file. Ensure it is not corrupted or password protected.');
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

                const students = this.studentsInClass;
                const studentByIdent = new Map();
                const studentByName = new Map();

                students.forEach(s => {
                    if (s.studentIdentifier) {
                        studentByIdent.set(s.studentIdentifier.trim().toLowerCase(), s);
                    }
                    if (s.name) {
                        studentByName.set(s.name.trim().toLowerCase(), s);
                    }
                });

                const parsed = [];

                rawRows.forEach((row, idx) => {
                    // Detect Reg No.
                    const regNo = String(
                        row['Reg No.'] || row['Reg No'] || row['RegNo'] || row['Student ID'] || row['studentIdentifier'] || ''
                    ).trim();

                    // Detect StudentName
                    const studentName = String(
                        row['StudentName'] || row['Student Name'] || row['Name'] || row['studentName'] || ''
                    ).trim();

                    // Detect Remarks
                    let remarkText = '';
                    const candidateKeys = ['Remarks', 'Remark', 'Comments', 'Comment', 'Evaluation', 'Description'];
                    for (const k of Object.keys(row)) {
                        const clean = k.trim().toLowerCase();
                        if (candidateKeys.some(c => c.toLowerCase() === clean)) {
                            remarkText = String(row[k] || '').trim();
                            break;
                        }
                    }

                    // Match against class students
                    let matchedStudent = null;
                    if (regNo && studentByIdent.has(regNo.toLowerCase())) {
                        matchedStudent = studentByIdent.get(regNo.toLowerCase());
                    } else if (studentName && studentByName.has(studentName.toLowerCase())) {
                        matchedStudent = studentByName.get(studentName.toLowerCase());
                    }

                    parsed.push({
                        no: idx + 1,
                        studentId: matchedStudent ? matchedStudent.id : null,
                        studentIdentifier: regNo || (matchedStudent ? matchedStudent.studentIdentifier : ''),
                        studentName: studentName || (matchedStudent ? matchedStudent.name : `Unknown (${regNo})`),
                        remark: remarkText,
                        matched: !!matchedStudent
                    });
                });

                this.importedRows = parsed;
                this.currentPage = 1;

                const validCount = this.validRowCount;
                if (validCount > 0) {
                    this.toastHandler('success', `Parsed ${parsed.length} rows. Found ${validCount} valid remark(s) ready to save.`);
                } else {
                    this.toastHandler('warning', `Parsed ${parsed.length} rows, but none matched the enrolled students or had remarks.`);
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, termsRes, classesRes, studentsRes, remarksRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetRemarksByTeachers/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.allStudents = normalizeStudents(studentsRes.data && (studentsRes.data.result || studentsRes.data));

                    const rawRemarks = (remarksRes.data && (remarksRes.data.result || remarksRes.data)) || [];
                    this.remarksList = (Array.isArray(rawRemarks) ? rawRemarks : []).map(normalizeRemarkRecord);

                    this.setupDone = true;
                    this.checkExistingAndWarn();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async saveImportedEvaluations() {
                const candidates = (this.importedRows || []).filter(r => r.matched && r.studentId && r.remark && r.remark.trim().length > 0);
                if (candidates.length === 0) {
                    return this.toastHandler('warning', 'There are no valid student remarks ready to save.');
                }

                this.saving = true;
                let successCount = 0;
                let failCount = 0;

                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const tType = String(this.selectedTeacherType).toLowerCase();
                const rType = String(this.activeTab).toLowerCase();

                // Map existing remarks to decide between CreateRemarksByTeacher and UpdateRemarksByTeacher
                const existingMap = new Map();
                (this.remarksList || []).forEach(r => {
                    if (
                        String(r.academicYearId).toLowerCase() === yId &&
                        String(r.termId).toLowerCase() === tId &&
                        String(r.classId).toLowerCase() === cId &&
                        String(r.teacherType).toLowerCase() === tType &&
                        String(r.remarkType).toLowerCase() === rType
                    ) {
                        existingMap.set(String(r.studentId).toLowerCase(), r);
                    }
                });

                try {
                    for (const row of candidates) {
                        const stId = String(row.studentId).toLowerCase();
                        const existing = existingMap.get(stId);

                        const payload = {
                            academicYearId: this.asGuid(this.academicYearId),
                            termId: this.asGuid(this.termId),
                            classId: this.asGuid(this.classId),
                            teacherType: this.selectedTeacherType,
                            remarkType: this.activeTab,
                            remark: String(row.remark).trim(),
                            studentId: this.asGuid(row.studentId),
                            studentName: String(row.studentName).trim(),
                            studentIdentifier: String(row.studentIdentifier).trim()
                        };

                        try {
                            if (existing && existing.id) {
                                payload.id = existing.id;
                                if (existing.tenantId !== undefined && existing.tenantId !== null) {
                                    payload.tenantId = Number(existing.tenantId);
                                }
                                await axios.post('/SchoolManager/UpdateRemarksByTeacher/', payload);
                            } else {
                                await axios.post('/SchoolManager/CreateRemarksByTeacher/', payload);
                            }
                            successCount++;
                        } catch (err) {
                            failCount++;
                            console.error('Failed to save imported remark for', row.studentName, err);
                        }
                    }

                    if (successCount > 0) {
                        this.toastHandler('success', `Successfully saved ${successCount} ${this.selectedTeacherType === 'Class' ? 'Class Teacher' : 'Headmaster'} remark(s).`);
                        this.clearImport();
                    }
                    if (failCount > 0) {
                        this.toastHandler('warning', `${failCount} remark(s) could not be saved.`);
                    }

                    await this.refreshRemarks();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshRemarks() {
                try {
                    const res = await axios.get('/SchoolManager/GetRemarksByTeachers/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.remarksList = (Array.isArray(raw) ? raw : []).map(normalizeRemarkRecord);
                } catch (e) {
                    console.error('Failed to refresh teacher remarks', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();

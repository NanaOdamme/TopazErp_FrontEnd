/* ==========================================================================
 * Assignment Results Import — Excel / Sheet Import for Assessment Marks
 *
 * Entity Model:
 *  - ClassAssignment : AuditedEntity<Guid>
 *      public Guid AcademicYearId { get; set; }
 *      public string AcademicYearName { get; set; }
 *      public Guid TermId { get; set; }
 *      public string TermName { get; set; }
 *      public Guid ClassId { get; set; }
 *      public string ClassName { get; set; }
 *      public Guid SubjectId { get; set; }
 *      public string SubjectName { get; set; }
 *      public int AssignmentNumber { get; set; }
 *      public string Type { get; set; }             // ClassAssignment | ClassTest | HomeWork | Project | MidTerm | Exam
 *      public decimal OverallMark { get; set; }     // Default: 10
 *      public bool IsRawMark { get; set; }
 *      public bool IsPercentage { get; set; }
 *      public bool IsCanceled { get; set; }
 *      public DateTime AssignedDate { get; set; }
 *      [Column(TypeName = "jsonb")]
 *      public List<AssignmentImport> Details { get; set; }
 *      public int TenantId { get; set; }
 *
 *  - AssignmentImport:
 *      public Guid Id { get; set; }
 *      public Guid ClassAssignmentId { get; set; }
 *      public string StudentIdentifier { get; set; }
 *      public string StudentName { get; set; }
 *      public decimal Marks { get; set; }
 *
 * Controller Endpoints:
 *  - GET:  /SchoolManager/GetResults/
 *  - POST: /SchoolManager/CreateResult/
 *  - POST: /SchoolManager/UpdateResult/
 *
 * Sheet Template Headers:
 *  - No.: Row index
 *  - Reg No.: Student Identifier / Registration number
 *  - StudentName: Student Name (lastName firstName otherName)
 *  - Marks: Numeric score
 *
 * Features:
 *  - Assessment parameters: Type (6 assessment types), AssignmentNumber, OverallMark, AssignedDate, IsRawMark, IsPercentage
 *  - Sequential assignment number auto-calculation (MidTerm/Exam fixed at 11)
 *  - Subject filter bound to ClassId via /SchoolManager/GetAssignedSubjects/
 *  - Excel (.xlsx, .xls) and CSV upload dropzone & SheetJS parser
 *  - Visual indication & validation if any marks exceed OverallMark
 *  - Warning notification if results already exist for selected criteria
 *  - Interactive editable preview table before saving
 *  - Custom 4-second toastHandler
 * ========================================================================== */
(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ASSESSMENT_TYPES = [
        { id: 'ClassAssignment', name: 'Class Assignment' },
        { id: 'ClassTest', name: 'Class Test' },
        { id: 'HomeWork', name: 'Home Work' },
        { id: 'Project', name: 'Project' },
        { id: 'MidTerm', name: 'Mid Term' },
        { id: 'Exam', name: 'Exam' }
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

    const uuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
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

    const normalizeAssignedSubjects = list => (list || [])
        .map(a => {
            const classId = val(a, 'classId');
            const details = val(a, 'details') || [];
            const subjectIds = Array.isArray(details)
                ? details.map(d => val(d, 'subjectId')).filter(Boolean)
                : [];
            return {
                classId: classId ? String(classId) : null,
                subjectIds: subjectIds.map(String)
            };
        })
        .filter(a => a.classId);

    const normalizeResultDetail = (d, parentId) => {
        const id = val(d, 'id') || uuid();
        const classAssignmentId = val(d, 'classAssignmentId') || parentId || EMPTY_GUID;
        return {
            id: String(id),
            classAssignmentId: asGuid(classAssignmentId),
            studentIdentifier: String(val(d, 'studentIdentifier') || '').trim(),
            studentName: String(val(d, 'studentName') || '').trim(),
            marks: Number(val(d, 'marks') ?? 0)
        };
    };

    const normalizeResult = r => {
        const id = val(r, 'id');
        const detailsRaw = val(r, 'details');
        let detailsList = [];
        if (typeof detailsRaw === 'string') {
            try {
                detailsList = JSON.parse(detailsRaw);
            } catch (e) {
                detailsList = [];
            }
        } else if (Array.isArray(detailsRaw)) {
            detailsList = detailsRaw;
        }

        return {
            id: id ? String(id) : undefined,
            academicYearId: asGuid(val(r, 'academicYearId')),
            academicYearName: String(val(r, 'academicYearName') || '').trim(),
            termId: asGuid(val(r, 'termId')),
            termName: String(val(r, 'termName') || '').trim(),
            classId: asGuid(val(r, 'classId')),
            className: String(val(r, 'className') || '').trim(),
            subjectId: asGuid(val(r, 'subjectId')),
            subjectName: String(val(r, 'subjectName') || '').trim(),
            assignmentNumber: Number(val(r, 'assignmentNumber') ?? 1),
            type: String(val(r, 'type') || 'ClassAssignment').trim(),
            overallMark: Number(val(r, 'overallMark') ?? 10),
            isRawMark: val(r, 'isRawMark') === true || String(val(r, 'isRawMark')).toLowerCase() === 'true',
            isPercentage: val(r, 'isPercentage') === true || String(val(r, 'isPercentage')).toLowerCase() === 'true',
            isCanceled: val(r, 'isCanceled') === true || String(val(r, 'isCanceled')).toLowerCase() === 'true',
            assignedDate: toInputDate(val(r, 'assignedDate')),
            details: detailsList.map(d => normalizeResultDetail(d, id)),
            tenantId: val(r, 'tenantId') !== undefined ? Number(val(r, 'tenantId')) : undefined
        };
    };

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
                allSubjects: [],
                assignedSubjectsMap: [],
                allStudents: [],
                assessmentTypes: ASSESSMENT_TYPES,

                // Active Scope Filter
                academicYearId: '',
                termId: '',
                classId: '',
                subjectId: '',

                // Assessment Parameters
                assessmentType: 'ClassAssignment',
                assignmentNumber: 1,
                overallMark: 10,
                assignedDate: todayIso(),
                isRawMark: true,
                isPercentage: false,

                // Existing Results from API
                results: [],

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
                return !!(this.academicYearId && this.termId && this.classId && this.subjectId);
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

            selectedSubject() {
                return this.allSubjects.find(s => String(s.id).toLowerCase() === String(this.subjectId).toLowerCase());
            },

            availableSubjects() {
                if (!this.classId) return [];
                const cId = String(this.classId).toLowerCase();

                const allowedSubjectIds = new Set();
                this.assignedSubjectsMap.forEach(as => {
                    if (String(as.classId).toLowerCase() === cId) {
                        as.subjectIds.forEach(id => allowedSubjectIds.add(String(id).toLowerCase()));
                    }
                });

                return (this.allSubjects || []).filter(s =>
                    allowedSubjectIds.has(String(s.id).toLowerCase())
                );
            },

            hasAssignedSubjects() {
                if (!this.classId) return true;
                return this.availableSubjects.length > 0;
            },

            studentsInClass() {
                if (!this.classId) return [];
                const cId = String(this.classId).toLowerCase();
                return (this.allStudents || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === cId
                );
            },

            existingMatchingResult() {
                if (!this.scopeReady) return null;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const sId = String(this.subjectId).toLowerCase();
                const typ = String(this.assessmentType).toLowerCase();
                const num = Number(this.assignmentNumber);

                return (this.results || []).find(r =>
                    !r.isCanceled &&
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.subjectId).toLowerCase() === sId &&
                    String(r.type).toLowerCase() === typ &&
                    Number(r.assignmentNumber) === num
                ) || null;
            },

            hasExceedingMarks() {
                const max = Number(this.overallMark) || 0;
                return (this.importedRows || []).some(r => Number(r.marks) > max);
            },

            validRowCount() {
                const max = Number(this.overallMark) || 0;
                return (this.importedRows || []).filter(r => r.matched && !isNaN(r.marks) && Number(r.marks) >= 0 && Number(r.marks) <= max).length;
            },

            filteredImported() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.importedRows;

                return (this.importedRows || []).filter(s => {
                    const name = (s.studentName || '').toLowerCase();
                    const ident = (s.studentIdentifier || '').toLowerCase();
                    const mark = String(s.marks);
                    return name.includes(query) || ident.includes(query) || mark.includes(query);
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
                if (this.subjectId) {
                    const exists = this.availableSubjects.some(s => String(s.id).toLowerCase() === String(this.subjectId).toLowerCase());
                    if (!exists) this.subjectId = '';
                }
                this.recalculateAssignmentNumber();
            },
            subjectId() {
                this.recalculateAssignmentNumber();
            },
            assessmentType() {
                this.recalculateAssignmentNumber();
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

            getTypeName(typeId) {
                const item = ASSESSMENT_TYPES.find(t => t.id === typeId);
                return item ? item.name : typeId;
            },

            isMarkExceeding(mark) {
                const max = Number(this.overallMark) || 0;
                return Number(mark) > max;
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

            recalculateAssignmentNumber() {
                if (this.assessmentType === 'MidTerm' || this.assessmentType === 'Exam') {
                    this.assignmentNumber = 11;
                    return;
                }

                if (!this.scopeReady) {
                    this.assignmentNumber = 1;
                    return;
                }

                const y = String(this.academicYearId).toLowerCase();
                const t = String(this.termId).toLowerCase();
                const c = String(this.classId).toLowerCase();
                const s = String(this.subjectId).toLowerCase();
                const typ = String(this.assessmentType).toLowerCase();

                const matching = (this.results || []).filter(r =>
                    !r.isCanceled &&
                    String(r.academicYearId).toLowerCase() === y &&
                    String(r.termId).toLowerCase() === t &&
                    String(r.classId).toLowerCase() === c &&
                    String(r.subjectId).toLowerCase() === s &&
                    String(r.type).toLowerCase() === typ
                );

                if (matching.length === 0) {
                    this.assignmentNumber = 1;
                } else {
                    const maxNum = matching.reduce((max, r) => Math.max(max, Number(r.assignmentNumber) || 0), 0);
                    this.assignmentNumber = maxNum + 1;
                }

                if (this.existingMatchingResult) {
                    this.toastHandler('warning', `A record for ${this.getTypeName(this.assessmentType)} #${this.assignmentNumber} already exists.`);
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

            downloadTemplate() {
                if (!this.scopeReady) {
                    return this.toastHandler('warning', 'Please select Academic Year, Term, Class, and Subject first.');
                }
                if (this.studentsInClass.length === 0) {
                    return this.toastHandler('warning', 'No students found enrolled in the selected class.');
                }

                // Headers requested: No. Reg No. StudentName and Marks
                const headers = ['No.', 'Reg No.', 'StudentName', 'Marks'];
                const rows = this.studentsInClass.map((st, index) => [
                    index + 1,
                    st.studentIdentifier || '',
                    st.name || '',
                    '' // Blank mark for teacher entry
                ]);

                const sheetData = [headers, ...rows];

                if (typeof XLSX !== 'undefined') {
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 15 }];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Results');

                    const className = (this.selectedClass ? this.selectedClass.name : 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
                    const subjName = (this.selectedSubject ? this.selectedSubject.name : 'Subject').replace(/[^a-zA-Z0-9_-]/g, '_');
                    const fileName = `${className}_${subjName}_${this.assessmentType}_${this.assignmentNumber}_Results_Template.xlsx`;
                    XLSX.writeFile(wb, fileName);
                    this.toastHandler('success', `Excel template generated: ${fileName}`);
                } else {
                    const csvContent = 'data:text/csv;charset=utf-8,' + sheetData.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `${this.assessmentType}_Results_Template.csv`);
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
                    return this.toastHandler('warning', 'Please select Academic Year, Term, Class, and Subject before uploading.');
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

                    // Detect Marks
                    let markVal = 0;
                    const candidateKeys = ['Marks', 'Mark', 'Score', 'Scores', 'Grade', 'Point', 'Points'];
                    for (const k of Object.keys(row)) {
                        const clean = k.trim().toLowerCase();
                        if (candidateKeys.some(c => c.toLowerCase() === clean)) {
                            const rawV = row[k];
                            if (rawV !== '' && rawV !== null && rawV !== undefined) {
                                markVal = Number(rawV);
                            }
                            break;
                        }
                    }

                    // Match student
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
                        marks: isNaN(markVal) ? 0 : markVal,
                        matched: !!matchedStudent
                    });
                });

                this.importedRows = parsed;
                this.currentPage = 1;

                if (this.hasExceedingMarks) {
                    this.toastHandler('warning', `Some imported marks exceed the maximum mark of ${this.overallMark}.`);
                } else if (this.validRowCount > 0) {
                    this.toastHandler('success', `Parsed ${parsed.length} rows. Found ${this.validRowCount} valid student mark(s).`);
                } else {
                    this.toastHandler('warning', `Parsed ${parsed.length} rows, but none matched enrolled students.`);
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                    const [yearsRes, termsRes, classesRes, subjectsRes, assignedSubRes, studentsRes, resultsRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetSubjects/'),
                        safeGet(axios.get('/SchoolManager/GetAssignedSubjects/')),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetResults/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.allSubjects = normalizeLookups(subjectsRes.data && (subjectsRes.data.result || subjectsRes.data));
                    const assignedList = (assignedSubRes.data && (assignedSubRes.data.result || assignedSubRes.data)) || [];
                    this.assignedSubjectsMap = normalizeAssignedSubjects(assignedList);
                    this.allStudents = normalizeStudents(studentsRes.data && (studentsRes.data.result || studentsRes.data));

                    const rawResults = (resultsRes.data && (resultsRes.data.result || resultsRes.data)) || [];
                    this.results = (Array.isArray(rawResults) ? rawResults : []).map(normalizeResult);

                    this.setupDone = true;
                    this.recalculateAssignmentNumber();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload() {
                const yearId = this.asGuid(this.academicYearId);
                const termId = this.asGuid(this.termId);
                const classId = this.asGuid(this.classId);
                const subjectId = this.asGuid(this.subjectId);
                const parentId = this.existingMatchingResult ? this.existingMatchingResult.id : undefined;

                const details = this.importedRows
                    .filter(r => r.matched && r.studentId)
                    .map(r => ({
                        id: uuid(),
                        classAssignmentId: asGuid(parentId),
                        studentIdentifier: String(r.studentIdentifier).trim(),
                        studentName: String(r.studentName).trim(),
                        marks: Number(r.marks ?? 0)
                    }));

                const payload = {
                    academicYearId: yearId,
                    academicYearName: this.selectedAcademicYear ? this.selectedAcademicYear.name : '',
                    termId: termId,
                    termName: this.selectedTerm ? this.selectedTerm.name : '',
                    classId: classId,
                    className: this.selectedClass ? this.selectedClass.name : '',
                    subjectId: subjectId,
                    subjectName: this.selectedSubject ? this.selectedSubject.name : '',
                    assignmentNumber: Number(this.assignmentNumber || 1),
                    type: this.assessmentType,
                    overallMark: Number(this.overallMark ?? 10),
                    isRawMark: Boolean(this.isRawMark),
                    isPercentage: Boolean(this.isPercentage),
                    isCanceled: false,
                    assignedDate: toIsoDateTime(this.assignedDate),
                    details: details
                };

                if (this.existingMatchingResult) {
                    payload.id = this.existingMatchingResult.id;
                    if (this.existingMatchingResult.tenantId !== undefined && this.existingMatchingResult.tenantId !== null) {
                        payload.tenantId = Number(this.existingMatchingResult.tenantId);
                    }
                }

                return payload;
            },

            async saveImportedResults() {
                if (this.hasExceedingMarks) {
                    return this.toastHandler('error', `Cannot save: one or more student marks exceed the overall mark of ${this.overallMark}.`);
                }
                if (this.validRowCount === 0) {
                    return this.toastHandler('warning', 'There are no valid student marks to save.');
                }

                // If record exists, confirm user intent
                if (this.existingMatchingResult) {
                    const confirmed = (typeof Swal !== 'undefined')
                        ? await Swal.fire({
                            icon: 'warning',
                            title: 'Assessment Already Exists',
                            text: `A record for ${this.getTypeName(this.assessmentType)} #${this.assignmentNumber} already exists for ${this.selectedSubject ? this.selectedSubject.name : 'this subject'}. Saving will update these marks. Do you wish to continue?`,
                            showCancelButton: true,
                            confirmButtonColor: '#062a81',
                            cancelButtonColor: '#64748b',
                            confirmButtonText: 'Yes, update results',
                            cancelButtonText: 'Cancel'
                        }).then(r => !!r.isConfirmed)
                        : true;

                    if (!confirmed) return;
                }

                this.saving = true;
                const payload = this.buildPayload();

                try {
                    if (this.existingMatchingResult && this.existingMatchingResult.id) {
                        await axios.post('/SchoolManager/UpdateResult/', payload);
                        this.toastHandler('success', `Successfully updated ${payload.details.length} student marks.`);
                    } else {
                        await axios.post('/SchoolManager/CreateResult/', payload);
                        this.toastHandler('success', `Successfully created ${this.getTypeName(this.assessmentType)} #${this.assignmentNumber} with ${payload.details.length} student marks.`);
                    }

                    this.clearImport();
                    await this.refreshResults();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshResults() {
                try {
                    const res = await axios.get('/SchoolManager/GetResults/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.results = (Array.isArray(raw) ? raw : []).map(normalizeResult);
                    this.recalculateAssignmentNumber();
                } catch (e) {
                    console.error('Failed to refresh assignment results', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();

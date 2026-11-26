/* ==========================================================================
 * Behavioral Assessment Import — Excel / Sheet Import (Conduct, Attitude, Interest)
 *
 * Entity Model:
 *  - BehavioralAssessment : AuditedEntity<Guid>
 *      public int TenantId { get; set; }
 *      public Guid ClassId { get; set; }
 *      public string ClassName { get; set; }
 *      public Guid AcademicYearId { get; set; }
 *      public string AcademicYearName { get; set; }
 *      public Guid TermId { get; set; }
 *      public string TermName { get; set; }
 *      public string AssessmentType { get; set; }   // Conduct | Attitude | Interest
 *      [Column(TypeName = "jsonb")]
 *      public List<BehavioralAssessmentImport> Assessments { get; set; }
 *
 *  - BehavioralAssessmentImport:
 *      public Guid Id { get; set; }
 *      public string BehavioralAssessmentId { get; set; }
 *      public Guid StudentId { get; set; }
 *      public string StudentName { get; set; }
 *      public string StudentIdentifier { get; set; }
 *      public string Description { get; set; }
 *
 * Controller Endpoints:
 *  - GET:  /SchoolManager/GetBehavioralAssessments/
 *  - POST: /SchoolManager/CreateBehavioralAssessment/
 *
 * Sheet Template Headers:
 *  - No: Row index
 *  - Reg No.: Student Identifier / Registration Number
 *  - StudentName: Combined (lastName firstName otherName)
 *  - Conduct / Attitude / Interest / AssessmentType: Remarks / Descriptions
 *
 * Features:
 *  - 3 Tabs: Conduct, Attitude, Interest
 *  - Dynamic sheet generation containing students in the selected class
 *  - Excel / CSV dropzone & file parsing via SheetJS (with fallback CSV parser)
 *  - Live preview of parsed remarks before saving
 *  - Warning notification & banner if records already exist for the selected criteria
 *  - Custom 4-second toastHandler
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

            // Format: lastName firstName otherName as requested
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

    const normalizeAssessmentDetail = (d, parentId) => {
        const id = val(d, 'id') || uuid();
        const behavioralAssessmentId = val(d, 'behavioralAssessmentId') || parentId || EMPTY_GUID;
        return {
            id: String(id),
            behavioralAssessmentId: String(behavioralAssessmentId),
            studentId: asGuid(val(d, 'studentId')),
            studentName: String(val(d, 'studentName') || '').trim(),
            studentIdentifier: String(val(d, 'studentIdentifier') || '').trim(),
            description: String(val(d, 'description') || '').trim()
        };
    };

    const normalizeBehavioralRecord = r => {
        const id = val(r, 'id');
        const rawAssessments = val(r, 'assessments');
        let assessmentsList = [];

        if (typeof rawAssessments === 'string') {
            try {
                assessmentsList = JSON.parse(rawAssessments);
            } catch (e) {
                assessmentsList = [];
            }
        } else if (Array.isArray(rawAssessments)) {
            assessmentsList = rawAssessments;
        }

        return {
            id: id ? String(id) : undefined,
            classId: asGuid(val(r, 'classId')),
            className: String(val(r, 'className') || '').trim(),
            academicYearId: asGuid(val(r, 'academicYearId')),
            academicYearName: String(val(r, 'academicYearName') || '').trim(),
            termId: asGuid(val(r, 'termId')),
            termName: String(val(r, 'termName') || '').trim(),
            assessmentType: String(val(r, 'assessmentType') || 'Conduct').trim(),
            assessments: assessmentsList.map(d => normalizeAssessmentDetail(d, id)),
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
                allStudents: [],

                // Active Scope Filter
                academicYearId: '',
                termId: '',
                classId: '',

                // 3 Tabs: 'Conduct' | 'Attitude' | 'Interest'
                activeType: 'Conduct',

                // Existing Records loaded from server
                records: [],

                // Imported File & Parsed Rows Preview
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

            existingRecordForActiveType() {
                if (!this.scopeReady) return null;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const aType = String(this.activeType).toLowerCase();

                return (this.records || []).find(r =>
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.assessmentType).toLowerCase() === aType
                ) || null;
            },

            validRowCount() {
                return (this.importedRows || []).filter(r => r.matched && r.description && r.description.trim().length > 0).length;
            },

            filteredImported() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.importedRows;

                return (this.importedRows || []).filter(s => {
                    const name = (s.studentName || '').toLowerCase();
                    const ident = (s.studentIdentifier || '').toLowerCase();
                    const desc = (s.description || '').toLowerCase();
                    return name.includes(query) || ident.includes(query) || desc.includes(query);
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

            hasExistingRecord(typeName) {
                if (!this.scopeReady) return false;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const typ = String(typeName).toLowerCase();

                return (this.records || []).some(r =>
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.assessmentType).toLowerCase() === typ
                );
            },

            checkExistingAndWarn() {
                if (this.scopeReady && this.existingRecordForActiveType) {
                    this.toastHandler('warning', `A ${this.activeType} assessment record already exists for this class and term.`);
                }
            },

            setActiveType(typeName) {
                this.activeType = typeName;
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

                // Header columns: No, Reg No., StudentName, <AssessmentType>
                const headers = ['No', 'Reg No.', 'StudentName', this.activeType];
                const rows = this.studentsInClass.map((st, index) => [
                    index + 1,
                    st.studentIdentifier || '',
                    st.name || '',
                    '' // Blank description for teacher to enter
                ]);

                const sheetData = [headers, ...rows];

                // If SheetJS is available, download as .xlsx; otherwise generate CSV
                if (typeof XLSX !== 'undefined') {
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 45 }];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, this.activeType);

                    const className = (this.selectedClass ? this.selectedClass.name : 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
                    const fileName = `${className}_${this.activeType}_Assessment_Template.xlsx`;
                    XLSX.writeFile(wb, fileName);
                    this.toastHandler('success', `Excel template generated: ${fileName}`);
                } else {
                    // Fallback to CSV
                    const csvContent = 'data:text/csv;charset=utf-8,' + sheetData.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `${this.activeType}_Assessment_Template.csv`);
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
                            this.toastHandler('error', 'Failed to parse Excel file. Ensure it is not password protected.');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    // Text / CSV parsing
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
                    return this.toastHandler('warning', 'The uploaded file does not contain any data rows.');
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
                const activeTypeLower = this.activeType.toLowerCase();

                rawRows.forEach((row, idx) => {
                    // Detect Reg No column
                    const regNo = String(
                        row['Reg No.'] || row['Reg No'] || row['RegNo'] || row['Student ID'] || row['StudentID'] || row['studentIdentifier'] || ''
                    ).trim();

                    // Detect Student Name column
                    const studentName = String(
                        row['StudentName'] || row['Student Name'] || row['Name'] || row['studentName'] || ''
                    ).trim();

                    // Detect Description / Remark column
                    let desc = '';
                    const candidateKeys = [
                        this.activeType,
                        activeTypeLower,
                        'AssessmentType',
                        'Description',
                        'Remark',
                        'Remarks',
                        'Assessment'
                    ];

                    for (const k of Object.keys(row)) {
                        const kClean = k.trim();
                        if (candidateKeys.some(c => c.toLowerCase() === kClean.toLowerCase())) {
                            desc = String(row[k] || '').trim();
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
                        description: desc,
                        matched: !!matchedStudent
                    });
                });

                this.importedRows = parsed;
                this.currentPage = 1;

                const validCount = this.validRowCount;
                if (validCount > 0) {
                    this.toastHandler('success', `Parsed ${parsed.length} rows. Found ${validCount} valid ${this.activeType} remarks ready to save.`);
                } else {
                    this.toastHandler('warning', `Parsed ${parsed.length} rows, but none matched the students or contained descriptions.`);
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, termsRes, classesRes, studentsRes, assessmentsRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetBehavioralAssessments/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.allStudents = normalizeStudents(studentsRes.data && (studentsRes.data.result || studentsRes.data));

                    const rawAssessments = (assessmentsRes.data && (assessmentsRes.data.result || assessmentsRes.data)) || [];
                    this.records = (Array.isArray(rawAssessments) ? rawAssessments : []).map(normalizeBehavioralRecord);

                    this.setupDone = true;
                    this.checkExistingAndWarn();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildCreatePayload() {
                const yearId = this.asGuid(this.academicYearId);
                const termId = this.asGuid(this.termId);
                const classId = this.asGuid(this.classId);

                const assessments = this.importedRows
                    .filter(r => r.matched && r.studentId && r.description && r.description.trim().length > 0)
                    .map(r => ({
                        id: uuid(),
                        behavioralAssessmentId: EMPTY_GUID,
                        studentId: this.asGuid(r.studentId),
                        studentName: String(r.studentName).trim(),
                        studentIdentifier: String(r.studentIdentifier).trim(),
                        description: String(r.description).trim()
                    }));

                return {
                    academicYearId: yearId,
                    academicYearName: this.nameOf(this.academicYears, yearId),
                    termId: termId,
                    termName: this.nameOf(this.terms, termId),
                    classId: classId,
                    className: this.nameOf(this.classes, classId),
                    assessmentType: this.activeType,
                    assessments: assessments
                };
            },

            async saveImportedAssessments() {
                if (this.validRowCount === 0) {
                    return this.toastHandler('warning', 'There are no valid student remarks with descriptions to save.');
                }

                // If record exists, confirm user intent
                if (this.existingRecordForActiveType) {
                    const confirmed = (typeof Swal !== 'undefined')
                        ? await Swal.fire({
                            icon: 'warning',
                            title: 'Record Already Exists',
                            text: `A ${this.activeType} record already exists for ${this.selectedClass ? this.selectedClass.name : 'this class'}. Proceeding will create a new assessment record. Do you wish to continue?`,
                            showCancelButton: true,
                            confirmButtonColor: '#062a81',
                            cancelButtonColor: '#64748b',
                            confirmButtonText: 'Yes, save anyway',
                            cancelButtonText: 'Cancel'
                        }).then(r => !!r.isConfirmed)
                        : true;

                    if (!confirmed) return;
                }

                this.saving = true;
                const payload = this.buildCreatePayload();

                try {
                    await axios.post('/SchoolManager/CreateBehavioralAssessment/', payload);
                    this.toastHandler('success', `Successfully imported ${payload.assessments.length} ${this.activeType} assessment remarks.`);
                    this.clearImport();
                    await this.refreshAssessments();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshAssessments() {
                try {
                    const res = await axios.get('/SchoolManager/GetBehavioralAssessments/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.records = (Array.isArray(raw) ? raw : []).map(normalizeBehavioralRecord);
                } catch (e) {
                    console.error('Failed to refresh behavioral assessments', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();

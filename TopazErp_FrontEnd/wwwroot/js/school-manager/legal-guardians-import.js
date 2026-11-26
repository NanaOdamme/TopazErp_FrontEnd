/* ==========================================================================
 * Parents / Legal Guardians Import — Excel / Sheet Import
 *
 * Controller Endpoints & Lookups:
 *  - GET:  /SchoolManager/GetStudentBios/             (Find studentId & studentName via student Reg No)
 *  - GET:  /SchoolManager/GetLevelClasses/            (Classes lookup for context)
 *  - GET:  /JsonDataSample/relationships.json         (Relationship lookup: Father, Mother, Guardian, etc.)
 *  - GET:  /JsonDataSample/titles.json                (Titles lookup: Mr, Mrs, Dr, Prof, etc.)
 *  - GET:  /SchoolManager/GetStContactRelationships/  (Existing parent/guardian relationships)
 *  - POST: /SchoolManager/CreateStContactRelationship/ (Create contact relationship)
 *  - POST: /SchoolManager/UpdateStContactRelationship/ (Optional update)
 *
 * Sheet Template Headers:
 *  - No.	student Reg No	Last Name	First Name	OtherName	Title	Relationship	Profession	Position	Is PTA Executive	Is Guardian	Address	Phone No	Mobile No	E-mail	Notes	Gender
 *
 * Matching & Strict Validation:
 *  - Student Reg No: Must match an active student from GetStudentBios. If not found, throw error / mark invalid.
 *  - Title: If entered, must match a Title in the system (e.g. Mr, Mrs, Dr). If not found, throw error / mark invalid.
 *  - Relationship: If entered, must match a Relationship in the system (e.g. Father, Mother, Guardian). If not found, throw error / mark invalid.
 *  - First Name & Last Name: Required.
 *  - If ANY row has validation errors (lookup not found or student not found), saving is prevented with clear error toast.
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

    const generateUuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const truthy = v => {
        if (!v) return false;
        const s = String(v).trim().toLowerCase();
        return s === 'true' || s === 'yes' || s === '1' || s === 'y';
    };

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
            name: val(c, 'className') || val(c, 'name') || '',
            className: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

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
            return {
                id,
                name: fullName,
                identifier,
                classId,
                className
            };
        })
        .filter(s => s.id != null);

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
                relationships: [],
                titles: [],
                existingContacts: [],

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
                    const parentName = (r.parentFullName || '').toLowerCase();
                    const rel = (r.relationshipName || '').toLowerCase();
                    const phone = (r.phoneNo || r.mobileNo || '').toLowerCase();
                    const email = (r.email || '').toLowerCase();
                    return studentReg.includes(query) || studentName.includes(query) || parentName.includes(query) || rel.includes(query) || phone.includes(query) || email.includes(query);
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
            truthy,

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

            findLookupByName(list, searchName) {
                if (!searchName) return null;
                const clean = String(searchName).trim().toLowerCase();
                return (list || []).find(item => {
                    const name = String(item.name || item.displayName || '').trim().toLowerCase();
                    return name === clean;
                }) || null;
            },

            downloadTemplate() {
                const headers = [
                    'No.',
                    'student Reg No',
                    'Last Name',
                    'First Name',
                    'OtherName',
                    'Title',
                    'Relationship',
                    'Profession',
                    'Position',
                    'Is PTA Executive',
                    'Is Guardian',
                    'Address',
                    'Phone No',
                    'Mobile No',
                    'E-mail',
                    'Notes',
                    'Gender'
                ];

                const sheetData = [headers];

                if (typeof XLSX !== 'undefined') {
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    ws['!cols'] = [
                        { wch: 6 },
                        { wch: 18 },
                        { wch: 16 },
                        { wch: 16 },
                        { wch: 14 },
                        { wch: 10 },
                        { wch: 14 },
                        { wch: 18 },
                        { wch: 18 },
                        { wch: 16 },
                        { wch: 14 },
                        { wch: 24 },
                        { wch: 16 },
                        { wch: 16 },
                        { wch: 24 },
                        { wch: 20 },
                        { wch: 10 }
                    ];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Guardians_Import');
                    const fileName = 'Parents_Guardians_Import_Template.xlsx';
                    XLSX.writeFile(wb, fileName);
                    this.toastHandler('success', `Excel template generated: ${fileName}`);
                } else {
                    const csvContent = 'data:text/csv;charset=utf-8,' + headers.map(h => `"${h}"`).join(',') + '\n';
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'Parents_Guardians_Import_Template.csv');
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

                const parsed = [];
                let lookupErrorCount = 0;

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
                    const studentRegNo = getCol(['student Reg No', 'studentRegNo', 'Student Reg No', 'Reg No', 'Reg No.', 'RegNo']);
                    const lastName = getCol(['Last Name', 'LastName', 'Surname']);
                    const firstName = getCol(['First Name', 'FirstName']);
                    const otherName = getCol(['OtherName', 'Other Name', 'Middle Name']);
                    const rawTitle = getCol(['Title']);
                    const rawRelationship = getCol(['Relationship', 'Relation']);
                    const profession = getCol(['Profession', 'PlaceOfWork', 'Place Of Work', 'Occupation']);
                    const position = getCol(['Position', 'JobTitle', 'Designation']);
                    const rawIsPta = getCol(['Is PTA Executive', 'IsPTAExecutive', 'PTA Executive']);
                    const rawIsGuardian = getCol(['Is Guardian', 'IsGuardian', 'Is Legal Guardian', 'IsLegalGuardian']);
                    const address = getCol(['Address']);
                    const phoneNo = getCol(['Phone No', 'PhoneNo', 'Phone', 'PhoneNumber']);
                    const mobileNo = getCol(['Mobile No', 'MobileNo', 'Mobile', 'ContactNumber']);
                    const email = getCol(['E-mail', 'Email', 'Mail']);
                    const notes = getCol(['Notes', 'Note', 'Remark']);
                    const gender = getCol(['Gender', 'Sex']);

                    const errors = [];

                    // 1. Resolve Student via student Reg No (STRICT)
                    let studentId = null;
                    let studentName = '';
                    let className = '';

                    if (!studentRegNo) {
                        errors.push('Student Reg No is required.');
                    } else {
                        const regClean = studentRegNo.toLowerCase();
                        const matchedStudent = this.studentRegIndex[regClean] || null;
                        if (matchedStudent) {
                            studentId = matchedStudent.id;
                            studentName = matchedStudent.name;
                            className = matchedStudent.className;
                        } else {
                            errors.push(`Student with Reg No "${studentRegNo}" was not found in the student database.`);
                        }
                    }

                    // 2. Resolve Title (STRICT if entered)
                    let titleId = this.titles.length ? this.titles[0].id : EMPTY_GUID;
                    let titleName = this.titles.length ? this.titles[0].name : '';
                    if (rawTitle) {
                        const matchedTitle = this.findLookupByName(this.titles, rawTitle);
                        if (matchedTitle) {
                            titleId = matchedTitle.id;
                            titleName = matchedTitle.name;
                        } else {
                            errors.push(`Title "${rawTitle}" was not found in the title list.`);
                        }
                    }

                    // 3. Resolve Relationship (STRICT if entered)
                    let relationshipId = this.relationships.length ? this.relationships[0].id : EMPTY_GUID;
                    let relationshipName = this.relationships.length ? this.relationships[0].name : '';
                    if (rawRelationship) {
                        const matchedRel = this.findLookupByName(this.relationships, rawRelationship);
                        if (matchedRel) {
                            relationshipId = matchedRel.id;
                            relationshipName = matchedRel.name;
                        } else {
                            errors.push(`Relationship "${rawRelationship}" was not found in the relationship list.`);
                        }
                    } else {
                        errors.push('Relationship is required (e.g. Father, Mother, Guardian).');
                    }

                    // 4. Basic Required Fields
                    if (!firstName) errors.push('First Name is required.');
                    if (!lastName) errors.push('Last Name is required.');

                    const isValid = errors.length === 0;
                    if (!isValid) {
                        lookupErrorCount++;
                    }

                    const parentFullName = [rawTitle, firstName, otherName, lastName].filter(Boolean).join(' ');

                    parsed.push({
                        no,
                        studentRegNo,
                        studentId,
                        studentName,
                        className,
                        lastName,
                        firstName,
                        otherName,
                        parentFullName,
                        rawTitle,
                        titleId,
                        titleName,
                        rawRelationship,
                        relationshipId,
                        relationshipName,
                        profession,
                        position,
                        isPtaExecutive: truthy(rawIsPta),
                        isGuardian: truthy(rawIsGuardian) || true,
                        address,
                        phoneNo,
                        mobileNo,
                        email,
                        notes,
                        gender: gender || 'Other',
                        isValid,
                        validationMessage: errors.join(' ')
                    });
                });

                this.importedRows = parsed;
                this.currentPage = 1;

                if (lookupErrorCount > 0) {
                    this.toastHandler('error', `Import warning: ${lookupErrorCount} row(s) contain invalid lookup values or missing students.`);
                } else if (this.validRowCount > 0) {
                    this.toastHandler('success', `Parsed ${parsed.length} rows. Found ${this.validRowCount} valid parent/guardian record(s) ready to import.`);
                } else {
                    this.toastHandler('warning', `Parsed ${parsed.length} rows, but none could be matched.`);
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [biosRes, classesRes, relsRes, titlesRes, contactsRes] = await Promise.all([
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        safeGet(axios.get(`/JsonDataSample/relationships.json?v=${stamp}`)),
                        safeGet(axios.get(`/JsonDataSample/titles.json?v=${stamp}`)),
                        safeGet(axios.get('/SchoolManager/GetStContactRelationships/'))
                    ]);

                    const extract = r => Array.isArray(r.data?.result) ? r.data.result : (Array.isArray(r.data) ? r.data : []);

                    this.students = normalizeStudents(extract(biosRes));
                    this.classes = normalizeClasses(extract(classesRes));
                    this.relationships = normalizeLookups(extract(relsRes));
                    this.titles = normalizeLookups(extract(titlesRes));
                    this.existingContacts = extract(contactsRes);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Failed to load reference setups (students, relationships, titles).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row) {
                return {
                    legalGuardianId: generateUuid(),
                    studentId: row.studentId,
                    studentName: row.studentName || '',
                    relationshipId: this.asGuid(row.relationshipId),
                    relationshipName: row.relationshipName || '',
                    titleId: this.asGuid(row.titleId),
                    titleName: row.titleName || '',
                    firstName: String(row.firstName || '').trim(),
                    lastName: String(row.lastName || '').trim(),
                    otherNames: String(row.otherName || '').trim(),
                    phoneNumber: String(row.phoneNo || '').trim(),
                    contactNumber: String(row.mobileNo || '').trim(),
                    email: String(row.email || '').trim(),
                    isLegalGuardian: Boolean(row.isGuardian),
                    placeOfWork: String(row.profession || '').trim(),
                    workPhone: String(row.phoneNo || '').trim()
                };
            },

            async saveImportedGuardians() {
                const invalidRows = (this.importedRows || []).filter(r => !r.isValid);
                if (invalidRows.length > 0) {
                    const firstErr = invalidRows[0].validationMessage || 'Invalid lookup values found.';
                    return this.toastHandler('error', `Cannot save: ${invalidRows.length} row(s) contain invalid lookups or missing students. First error: ${firstErr}`);
                }

                const candidates = (this.importedRows || []).filter(r => r.isValid);
                if (candidates.length === 0) {
                    return this.toastHandler('warning', 'There are no valid parent/guardian records to save.');
                }

                this.saving = true;
                let successCount = 0;
                let failCount = 0;

                try {
                    for (const row of candidates) {
                        const payload = this.buildPayload(row);
                        try {
                            await axios.post('/SchoolManager/CreateStContactRelationship/', payload);
                            successCount++;
                        } catch (err) {
                            failCount++;
                            console.error('Failed saving contact relationship for student', row.studentRegNo, err);
                        }
                    }

                    if (successCount > 0) {
                        this.toastHandler('success', `Successfully imported ${successCount} parent/guardian contact relationship(s).`);
                        this.clearImport();
                        const contactsRes = await axios.get('/SchoolManager/GetStContactRelationships/');
                        this.existingContacts = Array.isArray(contactsRes.data?.result) ? contactsRes.data.result : (Array.isArray(contactsRes.data) ? contactsRes.data : []);
                    }
                    if (failCount > 0) {
                        this.toastHandler('warning', `${failCount} contact record(s) could not be saved.`);
                    }
                } catch (err) {
                    this.toastHandler('error', 'Encountered error during bulk parent/guardian import.');
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

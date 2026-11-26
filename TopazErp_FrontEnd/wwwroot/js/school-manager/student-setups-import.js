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

    const toInputDate = v => {
        if (!v && v !== 0) return todayIso();
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
        if (!s) return todayIso();

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
        return todayIso();
    };

    const truthy = v => {
        if (!v) return false;
        const s = String(v).trim().toLowerCase();
        return s === 'true' || s === 'yes' || s === '1' || s === 'y' || s === 'boarder';
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || val(o, 'className') || '',
            className: val(o, 'className') || val(o, 'name') || '',
            nationality: val(o, 'nationality') || val(o, 'name') || ''
        }))
        .filter(o => o.id != null && (o.name !== '' || o.className !== ''))
        .sort((a, b) => (a.name || a.className).localeCompare(b.name || b.className));

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

                // Lookups for ID resolution
                classes: [],
                academicYears: [],
                terms: [],
                countries: [],
                religions: [],
                hostels: [],
                statuses: [],

                // Existing Students in DB for duplicate Reg No check
                existingStudentBios: [],

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
            // Check if ANY row has duplicate Reg No (against DB or within the file)
            hasDuplicateRegNo() {
                return (this.importedRows || []).some(r => r.isDuplicateRegNo);
            },

            duplicateRegNoCount() {
                return (this.importedRows || []).filter(r => r.isDuplicateRegNo).length;
            },

            // Check if ANY row has invalid lookup or validation errors
            hasInvalidRows() {
                return (this.importedRows || []).some(r => !r.isValid || r.isDuplicateRegNo);
            },

            invalidRowCount() {
                return (this.importedRows || []).filter(r => !r.isValid || r.isDuplicateRegNo).length;
            },

            validRowCount() {
                return (this.importedRows || []).filter(r => r.isValid && !r.isDuplicateRegNo).length;
            },

            filteredImported() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.importedRows;

                return (this.importedRows || []).filter(s => {
                    const fname = (s.firstName || '').toLowerCase();
                    const lname = (s.lastName || '').toLowerCase();
                    const ident = (s.studentIdentifier || '').toLowerCase();
                    const cname = (s.className || s.rawClass || '').toLowerCase();
                    return fname.includes(query) || lname.includes(query) || ident.includes(query) || cname.includes(query);
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

            findLookupByName(list, searchName, altKey = null) {
                if (!searchName) return null;
                const clean = String(searchName).trim().toLowerCase();
                return (list || []).find(item => {
                    const name = String(item.name || item.className || '').trim().toLowerCase();
                    if (name === clean) return true;
                    if (altKey && item[altKey]) {
                        return String(item[altKey]).trim().toLowerCase() === clean;
                    }
                    return false;
                }) || null;
            },

            downloadTemplate() {
                const headers = [
                    'S.No',
                    'Reg No',
                    'Last Name',
                    'First Name',
                    'OtherName',
                    'Gender',
                    'Date of Birth',
                    'Nationality',
                    'Religion',
                    'Class',
                    'Admission Date',
                    'Academic Year',
                    'Term',
                    'Is Boader',
                    'Hostel'
                ];

                const sheetData = [headers];

                if (typeof XLSX !== 'undefined') {
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    ws['!cols'] = [
                        { wch: 6 },
                        { wch: 16 },
                        { wch: 18 },
                        { wch: 18 },
                        { wch: 16 },
                        { wch: 10 },
                        { wch: 14 },
                        { wch: 16 },
                        { wch: 16 },
                        { wch: 20 },
                        { wch: 14 },
                        { wch: 16 },
                        { wch: 12 },
                        { wch: 12 },
                        { wch: 20 }
                    ];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Student_Import');
                    const fileName = 'Students.xlsx';
                    XLSX.writeFile(wb, fileName);
                    this.toastHandler('success', `Excel template generated: ${fileName}`);
                } else {
                    const csvContent = 'data:text/csv;charset=utf-8,' + headers.map(h => `"${h}"`).join(',') + '\n';
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'Students.csv');
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

                const activeStatus = this.findLookupByName(this.statuses, 'Active') || (this.statuses.length ? this.statuses[0] : null);
                const activeStatusId = activeStatus ? activeStatus.id : EMPTY_GUID;
                const activeStatusName = activeStatus ? (activeStatus.name || 'Active') : 'Active';

                // Map of existing student identifiers in the database (lowercase)
                const existingRegNoSet = new Set(
                    (this.existingStudentBios || [])
                        .map(s => String(this.val(s, 'studentIdentifier') || '').trim().toLowerCase())
                        .filter(Boolean)
                );

                // Set to track duplicates inside the uploaded file itself
                const seenInFileRegNoSet = new Set();

                const parsed = [];
                let duplicateCount = 0;
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

                    const sNo = getCol(['S.No', 'SNo', 'No.', 'No']) || String(idx + 1);
                    const regNo = getCol(['Reg No', 'Reg No.', 'RegNo', 'Student ID', 'studentIdentifier']);
                    const lastName = getCol(['Last Name', 'LastName', 'Surname']);
                    const firstName = getCol(['First Name', 'FirstName']);
                    const otherName = getCol(['OtherName', 'Other Name', 'Middle Name']);
                    const gender = getCol(['Gender', 'Sex']);
                    const rawDob = getCol(['Date of Birth', 'DateOfBirth', 'DOB']);
                    const rawNationality = getCol(['Nationality', 'Country']);
                    const rawReligion = getCol(['Religion']);
                    const rawClass = getCol(['Class', 'ClassName']);
                    const rawAdmissionDate = getCol(['Admission Date', 'AdmissionDate']);
                    const rawAcademicYear = getCol(['Academic Year', 'AcademicYear', 'Year']);
                    const rawTerm = getCol(['Term']);
                    const rawIsBoarder = getCol(['Is Boader', 'Is Boarder', 'IsBoader', 'IsBoarder', 'Boarder']);
                    const rawHostel = getCol(['Hostel', 'HostelName']);

                    const errors = [];

                    // 1. Class Validation (Required and must exist in lookup)
                    let classId = EMPTY_GUID;
                    let className = rawClass;
                    if (!rawClass) {
                        errors.push('Class is required.');
                    } else {
                        const classMatch = this.findLookupByName(this.classes, rawClass, 'className');
                        if (classMatch) {
                            classId = classMatch.id;
                            className = classMatch.className || classMatch.name;
                        } else {
                            errors.push(`Class "${rawClass}" was not found in the class list.`);
                        }
                    }

                    // 2. Religion Validation (If entered, must exist in lookup)
                    let religionId = EMPTY_GUID;
                    let religionName = rawReligion;
                    if (rawReligion) {
                        const religionMatch = this.findLookupByName(this.religions, rawReligion);
                        if (religionMatch) {
                            religionId = religionMatch.id;
                            religionName = religionMatch.name;
                        } else {
                            errors.push(`Religion "${rawReligion}" was not found in the religion list.`);
                        }
                    }

                    // 3. Nationality / Country Validation (If entered, must exist in lookup)
                    let countryId = EMPTY_GUID;
                    let countryName = '';
                    let nationality = rawNationality;
                    if (rawNationality) {
                        const countryMatch = this.findLookupByName(this.countries, rawNationality, 'nationality');
                        if (countryMatch) {
                            countryId = countryMatch.id;
                            countryName = countryMatch.name;
                            nationality = countryMatch.nationality || countryMatch.name;
                        } else {
                            errors.push(`Nationality/Country "${rawNationality}" was not found in the country list.`);
                        }
                    }

                    // 4. Academic Year Validation (If entered, must exist in lookup)
                    let academicYearId = this.academicYears.length ? this.academicYears[0].id : EMPTY_GUID;
                    let academicYearName = this.academicYears.length ? this.academicYears[0].name : '';
                    if (rawAcademicYear) {
                        const yearMatch = this.findLookupByName(this.academicYears, rawAcademicYear);
                        if (yearMatch) {
                            academicYearId = yearMatch.id;
                            academicYearName = yearMatch.name;
                        } else {
                            errors.push(`Academic Year "${rawAcademicYear}" was not found in the academic year list.`);
                        }
                    }

                    // 5. Hostel Validation (If entered, must exist in lookup)
                    let hostelId = EMPTY_GUID;
                    let hostelName = rawHostel;
                    if (rawHostel) {
                        const hostelMatch = this.findLookupByName(this.hostels, rawHostel);
                        if (hostelMatch) {
                            hostelId = hostelMatch.id;
                            hostelName = hostelMatch.name;
                        } else {
                            errors.push(`Hostel "${rawHostel}" was not found in the hostel list.`);
                        }
                    }

                    // 6. Dates
                    const dateOfBirth = rawDob ? toInputDate(rawDob) : todayIso();
                    const admissionDate = rawAdmissionDate ? toInputDate(rawAdmissionDate) : todayIso();

                    // 7. Duplicate Reg No Check
                    let isDuplicateRegNo = false;
                    let duplicateReason = '';
                    const regNoLower = regNo.toLowerCase();

                    if (!regNo) {
                        errors.push('Registration Number is required.');
                    } else {
                        if (existingRegNoSet.has(regNoLower)) {
                            isDuplicateRegNo = true;
                            duplicateReason = `Registration Number "${regNo}" is already registered in the system.`;
                            duplicateCount++;
                        } else if (seenInFileRegNoSet.has(regNoLower)) {
                            isDuplicateRegNo = true;
                            duplicateReason = `Duplicate Registration Number "${regNo}" within uploaded sheet.`;
                            duplicateCount++;
                        } else {
                            seenInFileRegNoSet.add(regNoLower);
                        }
                    }

                    if (isDuplicateRegNo) {
                        errors.push(duplicateReason);
                    }

                    // 8. Basic Required Fields
                    if (!firstName) errors.push('First Name is required.');
                    if (!lastName) errors.push('Last Name is required.');

                    const isValid = errors.length === 0;
                    if (!isValid && !isDuplicateRegNo) {
                        lookupErrorCount++;
                    }

                    parsed.push({
                        sNo: sNo,
                        studentIdentifier: regNo,
                        lastName: lastName,
                        firstName: firstName,
                        otherName: otherName,
                        gender: gender || 'Other',
                        dateOfBirth: dateOfBirth,
                        nationality: nationality,
                        countryId: countryId,
                        countryName: countryName,
                        religionId: religionId,
                        religionName: religionName,
                        rawReligion: rawReligion,
                        classId: classId,
                        className: className,
                        rawClass: rawClass,
                        admissionDate: admissionDate,
                        academicYearId: academicYearId,
                        academicYearName: academicYearName,
                        rawAcademicYear: rawAcademicYear,
                        term: rawTerm,
                        isBoarder: truthy(rawIsBoarder),
                        hostelId: hostelId,
                        hostelName: hostelName,
                        rawHostel: rawHostel,
                        statusId: activeStatusId,
                        statusName: activeStatusName,
                        balanceDue: 0,
                        balanceDueDate: todayIso(),
                        isValid: isValid,
                        isDuplicateRegNo: isDuplicateRegNo,
                        validationMessage: errors.join(' ')
                    });
                });

                this.importedRows = parsed;
                this.currentPage = 1;

                if (duplicateCount > 0) {
                    this.toastHandler('error', `Import blocked: ${duplicateCount} student(s) have registration numbers that already exist.`);
                } else if (lookupErrorCount > 0) {
                    this.toastHandler('error', `Import warning: ${lookupErrorCount} row(s) have invalid lookup values (e.g. religion, class, or hostel not found).`);
                } else if (this.validRowCount > 0) {
                    this.toastHandler('success', `Parsed ${parsed.length} rows. Found ${this.validRowCount} valid student record(s) ready to import.`);
                } else {
                    this.toastHandler('warning', `Parsed ${parsed.length} rows, but all were missing required fields or had invalid lookups.`);
                }
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [classesRes, yearsRes, termsRes, countriesRes, religionsRes, hostelsRes, statusesRes, biosRes] = await Promise.all([
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        safeGet(axios.get(`/jsonDataSample/terms.json?v=${stamp}`)),
                        safeGet(axios.get(`/jsonDataSample/countries.json?v=${stamp}`)),
                        safeGet(axios.get(`/jsonDataSample/religions.json?v=${stamp}`)),
                        safeGet(axios.get('/SchoolManager/GetHostels/')),
                        safeGet(axios.get(`/jsonDataSample/studentStatuses.json?v=${stamp}`)),
                        safeGet(axios.get('/SchoolManager/GetStudentBios/'))
                    ]);

                    const extract = r => Array.isArray(r.data?.result) ? r.data.result : (Array.isArray(r.data) ? r.data : []);

                    this.classes = normalizeLookups(extract(classesRes));
                    this.academicYears = normalizeLookups(extract(yearsRes));
                    this.terms = normalizeLookups(extract(termsRes));
                    this.countries = normalizeLookups(extract(countriesRes));
                    this.religions = normalizeLookups(extract(religionsRes));
                    this.hostels = normalizeLookups(extract(hostelsRes));
                    this.statuses = normalizeLookups(extract(statusesRes));
                    this.existingStudentBios = extract(biosRes);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Failed to load reference lookups.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            generateIndexNumber() {
                const randomNumber = Math.floor(1000 + Math.random() * 9000);
                return `Indx/${randomNumber}`;
            },

            buildBioPayload(row) {
                return {
                    studentIdentifier: String(row.studentIdentifier || '').trim(),
                    firstName: String(row.firstName || '').trim(),
                    otherName: String(row.otherName || '').trim(),
                    lastName: String(row.lastName || '').trim(),
                    gender: String(row.gender || 'Other').trim(),
                    dateOfBirth: isoDate(row.dateOfBirth) || todayIso(),
                    nationality: String(row.nationality || '').trim(),
                    countryId: this.asGuid(row.countryId),
                    countryName: String(row.countryName || '').trim(),
                    cityId: EMPTY_GUID,
                    cityName: '',
                    locationId: EMPTY_GUID,
                    locationName: '',
                    houseNumber: '',
                    address: '',
                    contactNumber: '',
                    phoneNumber: '',
                    religionId: this.asGuid(row.religionId),
                    religionName: String(row.religionName || '').trim(),
                    classId: this.asGuid(row.classId),
                    className: String(row.className || '').trim(),
                    admissionDate: isoDate(row.admissionDate) || todayIso(),
                    academicYearId: this.asGuid(row.academicYearId),
                    academicYearName: String(row.academicYearName || '').trim(),
                    isBoarder: Boolean(row.isBoarder),
                    hostelId: this.asGuid(row.hostelId),
                    hostelName: String(row.hostelName || '').trim(),
                    hostelBlockName: '',
                    houseId: EMPTY_GUID,
                    houseName: '',
                    statusId: this.asGuid(row.statusId),
                    statusName: String(row.statusName || 'Active').trim(),
                    balanceDue: 0,
                    balanceDueDate: todayIso(),
                    isParentControl: false,
                    isPreClassStudent: false,
                    isAlumni: false,
                    notes: '',
                    billAs: '',
                    indexNumber: this.generateIndexNumber()
                };
            },

            async saveImportedStudents() {
                if (this.hasDuplicateRegNo) {
                    return this.toastHandler('error', `Cannot import: ${this.duplicateRegNoCount} student(s) have registration numbers that already exist.`);
                }

                // If any invalid lookups exist, prevent saving and warn
                const invalidRows = (this.importedRows || []).filter(r => !r.isValid);
                if (invalidRows.length > 0) {
                    const firstErr = invalidRows[0].validationMessage || 'Invalid lookup values found.';
                    return this.toastHandler('error', `Cannot save: ${invalidRows.length} row(s) contain invalid lookups or missing fields. First error: ${firstErr}`);
                }

                const candidates = (this.importedRows || []).filter(r => r.isValid && !r.isDuplicateRegNo);
                if (candidates.length === 0) {
                    return this.toastHandler('warning', 'There are no valid student records to save.');
                }

                this.saving = true;
                let successCount = 0;
                let failCount = 0;

                try {
                    for (const row of candidates) {
                        const payload = this.buildBioPayload(row);
                        try {
                            await axios.post('/SchoolManager/CreateStudentBio/', payload);
                            successCount++;
                        } catch (err) {
                            failCount++;
                            console.error('Failed saving student bio for', row.firstName, row.lastName, err);
                        }
                    }

                    if (successCount > 0) {
                        this.toastHandler('success', `Successfully imported ${successCount} student admission record(s).`);
                        this.clearImport();
                        const biosRes = await axios.get('/SchoolManager/GetStudentBios/');
                        this.existingStudentBios = Array.isArray(biosRes.data?.result) ? biosRes.data.result : (Array.isArray(biosRes.data) ? biosRes.data : []);
                    }
                    if (failCount > 0) {
                        this.toastHandler('warning', `${failCount} student record(s) could not be imported.`);
                    }
                } catch (err) {
                    this.toastHandler('error', 'Encountered error during bulk student admission import.');
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

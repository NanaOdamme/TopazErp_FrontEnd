(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Vibrant palette for subjects in Google Calendar / Hubstaff style
    const PALETTE = [
        { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6', badge: '#dbeafe' }, // Blue
        { bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d', dot: '#ec4899', badge: '#fce7f3' }, // Pink
        { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e', badge: '#dcfce7' }, // Emerald
        { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', dot: '#a855f7', badge: '#f3e8ff' }, // Purple
        { bg: '#fffbeb', border: '#fde68a', text: '#b45309', dot: '#f59e0b', badge: '#fef3c7' }, // Amber
        { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e', dot: '#14b8a6', badge: '#ccfbf1' }, // Teal
        { bg: '#fff1f2', border: '#fecdd3', text: '#be123c', dot: '#f43f5e', badge: '#ffe4e6' }, // Rose
        { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca', dot: '#6366f1', badge: '#e0e7ff' }  // Indigo
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

    const confirmDialog = ({ title = 'Are you sure?', text = '', confirmText = 'Yes, delete', tone = 'danger' } = {}) => {
        if (typeof Swal === 'undefined') return Promise.resolve(true);
        const isDanger = tone === 'danger';
        return Swal.fire({
            icon: 'warning',
            title,
            text,
            showCancelButton: true,
            reverseButtons: true,
            focusCancel: true,
            confirmButtonColor: isDanger ? '#dc2626' : '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel'
        }).then(r => !!(r && r.isConfirmed));
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
            name: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // Combine firstName, lastName and otherName to format full teacher name
    const normalizeTeachers = list => {
        const raw = list || [];
        return raw
            .filter(t => t && (t.isTeacher === true || String(t.isTeacher).toLowerCase() === 'true'))
            .map(t => {
                const id = val(t, 'id') || val(t, 'staffId');
                const firstName = String(val(t, 'firstName') || '').trim();
                const otherName = String(val(t, 'otherName') || '').trim();
                const lastName = String(val(t, 'lastName') || '').trim();
                const combined = [firstName, otherName, lastName].filter(Boolean).join(' ').trim();
                const name = combined || String(val(t, 'name') || val(t, 'fullName') || val(t, 'staffName') || '').trim();

                return {
                    id: id ? String(id) : undefined,
                    name: name || 'Teacher',
                    isTeacher: true
                };
            })
            .filter(t => t.id != null && t.name !== '')
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const formatTimeSpan = v => {
        if (!v) return '08:00:00';
        const s = String(v).trim();
        if (/^\d{1,2}:\d{2}$/.test(s)) {
            const parts = s.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
        }
        if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
            const parts = s.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2]}`;
        }
        return s;
    };

    const formatTimeForInput = v => {
        if (!v) return '';
        const s = String(v).trim();
        if (/^\d{1,2}:\d{2}/.test(s)) {
            const parts = s.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].substring(0, 2)}`;
        }
        return s;
    };

    const normalizeDetail = (d, parentId) => {
        const id = val(d, 'id') || uuid();
        const timeTableId = val(d, 'timeTableId') || parentId || EMPTY_GUID;
        const subjectId = val(d, 'subjectId');
        const teacherId = val(d, 'teacherId');
        return {
            id: String(id),
            timeTableId: asGuid(timeTableId),
            subjectId: asGuid(subjectId),
            subjectName: val(d, 'subjectName') || '',
            teacherId: asGuid(teacherId),
            teacherName: val(d, 'teacherName') || '',
            startTime: formatTimeSpan(val(d, 'startTime')),
            endTime: formatTimeSpan(val(d, 'endTime'))
        };
    };

    const normalizeTimeTable = t => {
        const id = val(t, 'id');
        const detailsRaw = val(t, 'details');
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

        const details = detailsList.map(d => normalizeDetail(d, id));
        details.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

        return {
            id: id ? String(id) : undefined,
            academicYearId: asGuid(val(t, 'academicYearId')),
            academicYearName: val(t, 'academicYearName') || '',
            termId: asGuid(val(t, 'termId')),
            termName: val(t, 'termName') || '',
            classId: asGuid(val(t, 'classId')),
            className: val(t, 'className') || '',
            day: String(val(t, 'day') || 'Monday').trim(),
            tenantId: val(t, 'tenantId') !== undefined ? Number(val(t, 'tenantId')) : undefined,
            details: details
        };
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
                subjects: [],
                teachers: [],
                daysOfWeek: DAYS_OF_WEEK,

                // View settings: Show Monday-Friday (default) or include weekend
                showWeekend: false,

                // Scope filters
                academicYearId: '',
                termId: '',
                classId: '',
                activeDay: 'Monday',

                // Stored TimeTables from API
                timetables: [],

                // Modal state for Add/Edit Period
                modalOpen: false,
                modalTargetDay: 'Monday',
                draftPeriod: {
                    id: null,
                    subjectId: '',
                    teacherId: '',
                    startTime: '08:00',
                    endTime: '09:00'
                },
                isEditingPeriod: false,

                // Quick copy modal / tool state
                copyModalOpen: false,
                copySourceDay: '',
                copyTargetDay: ''
            };
        },

        computed: {
            scopeReady() {
                return !!(this.academicYearId && this.termId && this.classId);
            },

            visibleDays() {
                return this.showWeekend ? this.daysOfWeek : this.daysOfWeek.slice(0, 5);
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

            currentTimeTable() {
                return this.getTimeTableForDay(this.activeDay);
            },

            currentPeriods() {
                const t = this.currentTimeTable;
                return t ? t.details || [] : [];
            },

            dayCounts() {
                const counts = {};
                this.daysOfWeek.forEach(d => { counts[d] = 0; });
                if (!this.scopeReady) return counts;

                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();

                this.timetables.forEach(t => {
                    if (String(t.academicYearId).toLowerCase() === yId &&
                        String(t.termId).toLowerCase() === tId &&
                        String(t.classId).toLowerCase() === cId) {
                        const dayMatch = this.daysOfWeek.find(d => d.toLowerCase() === String(t.day).toLowerCase());
                        if (dayMatch) {
                            counts[dayMatch] = (t.details || []).length;
                        }
                    }
                });
                return counts;
            },

            totalPeriodsInWeek() {
                return Object.values(this.dayCounts).reduce((a, b) => a + b, 0);
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
            formatTimeSpan,
            formatTimeForInput,

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
            },

            formatTimeDisplay(timeStr) {
                if (!timeStr) return '';
                const parts = String(timeStr).split(':');
                if (parts.length < 2) return timeStr;
                let h = parseInt(parts[0], 10);
                const m = parts[1];
                const ampm = h >= 12 ? 'pm' : 'am';
                h = h % 12;
                h = h ? h : 12;
                return `${h}:${m} ${ampm}`;
            },

            getSubjectStyle(subjectId) {
                if (!subjectId) return PALETTE[0];
                let hash = 0;
                const str = String(subjectId);
                for (let i = 0; i < str.length; i++) {
                    hash = (hash << 5) - hash + str.charCodeAt(i);
                    hash |= 0;
                }
                const index = Math.abs(hash) % PALETTE.length;
                return PALETTE[index];
            },

            getTimeTableForDay(dayName) {
                if (!this.scopeReady || !dayName) return null;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const d = String(dayName).toLowerCase();

                return this.timetables.find(t =>
                    String(t.academicYearId).toLowerCase() === yId &&
                    String(t.termId).toLowerCase() === tId &&
                    String(t.classId).toLowerCase() === cId &&
                    String(t.day).toLowerCase() === d
                ) || null;
            },

            getPeriodsForDay(dayName) {
                const tt = this.getTimeTableForDay(dayName);
                return tt ? tt.details || [] : [];
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, termsRes, classesRes, subjectsRes, staffRes, timetablesRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetSubjects/'),
                        axios.get('/SchoolManager/GetStaffBios/'),
                        axios.get('/SchoolManager/GetTimeTables/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.subjects = normalizeLookups(subjectsRes.data && (subjectsRes.data.result || subjectsRes.data));
                    const staffList = (staffRes.data && (staffRes.data.result || staffRes.data)) || [];
                    this.teachers = normalizeTeachers(staffList);

                    const rawTT = (timetablesRes.data && (timetablesRes.data.result || timetablesRes.data)) || [];
                    this.timetables = (Array.isArray(rawTT) ? rawTT : []).map(normalizeTimeTable);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            openCreateModal(dayName) {
                this.modalTargetDay = dayName || this.activeDay || 'Monday';
                this.activeDay = this.modalTargetDay;
                const existingPeriods = this.getPeriodsForDay(this.modalTargetDay);
                let nextStart = '08:00';
                let nextEnd = '09:00';

                if (existingPeriods.length > 0) {
                    const last = existingPeriods[existingPeriods.length - 1];
                    const lastEnd = formatTimeForInput(last.endTime);
                    if (lastEnd) {
                        nextStart = lastEnd;
                        const [h, m] = lastEnd.split(':').map(Number);
                        const endHour = (h + 1) % 24;
                        nextEnd = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    }
                }

                this.draftPeriod = {
                    id: null,
                    subjectId: this.subjects.length ? this.subjects[0].id : '',
                    teacherId: this.teachers.length ? this.teachers[0].id : '',
                    startTime: nextStart,
                    endTime: nextEnd
                };
                this.isEditingPeriod = false;
                this.modalOpen = true;
            },

            openEditModal(period, dayName) {
                this.modalTargetDay = dayName || this.activeDay;
                this.activeDay = this.modalTargetDay;
                this.draftPeriod = {
                    id: period.id,
                    subjectId: period.subjectId,
                    teacherId: period.teacherId,
                    startTime: formatTimeForInput(period.startTime),
                    endTime: formatTimeForInput(period.endTime)
                };
                this.isEditingPeriod = true;
                this.modalOpen = true;
            },

            closeModal() {
                this.modalOpen = false;
                this.isEditingPeriod = false;
            },

            resetPeriodDraft() {
                this.draftPeriod = {
                    id: null,
                    subjectId: this.subjects.length ? this.subjects[0].id : '',
                    teacherId: this.teachers.length ? this.teachers[0].id : '',
                    startTime: '08:00',
                    endTime: '09:00'
                };
                this.isEditingPeriod = false;
            },

            editPeriod(period) {
                this.openEditModal(period, this.activeDay);
            },

            cancelPeriodEdit() {
                this.closeModal();
            },

            async savePeriod() {
                if (!this.scopeReady) return this.toastHandler('warning', 'Please select Academic Year, Term, and Class.');
                if (!this.draftPeriod.subjectId) return this.toastHandler('warning', 'Please select a Subject.');
                if (!this.draftPeriod.teacherId) return this.toastHandler('warning', 'Please select a Teacher.');
                if (!this.draftPeriod.startTime || !this.draftPeriod.endTime) {
                    return this.toastHandler('warning', 'Please specify both start and end time.');
                }
                if (this.draftPeriod.startTime >= this.draftPeriod.endTime) {
                    return this.toastHandler('warning', 'Start time must be earlier than End time.');
                }

                const targetDay = this.modalTargetDay || this.activeDay || 'Monday';
                const existingTable = this.getTimeTableForDay(targetDay);
                const parentId = existingTable ? existingTable.id : undefined;

                const detailItem = {
                    id: this.draftPeriod.id || uuid(),
                    timeTableId: asGuid(parentId),
                    subjectId: asGuid(this.draftPeriod.subjectId),
                    subjectName: this.nameOf(this.subjects, this.draftPeriod.subjectId),
                    teacherId: asGuid(this.draftPeriod.teacherId),
                    teacherName: this.nameOf(this.teachers, this.draftPeriod.teacherId),
                    startTime: formatTimeSpan(this.draftPeriod.startTime),
                    endTime: formatTimeSpan(this.draftPeriod.endTime)
                };

                let updatedDetails = existingTable ? [...existingTable.details] : [];
                if (this.isEditingPeriod && this.draftPeriod.id) {
                    const idx = updatedDetails.findIndex(d => String(d.id).toLowerCase() === String(this.draftPeriod.id).toLowerCase());
                    if (idx >= 0) {
                        updatedDetails[idx] = detailItem;
                    } else {
                        updatedDetails.push(detailItem);
                    }
                } else {
                    updatedDetails.push(detailItem);
                }

                updatedDetails.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

                const payload = {
                    academicYearId: asGuid(this.academicYearId),
                    academicYearName: this.nameOf(this.academicYears, this.academicYearId),
                    termId: asGuid(this.termId),
                    termName: this.nameOf(this.terms, this.termId),
                    classId: asGuid(this.classId),
                    className: this.nameOf(this.classes, this.classId),
                    day: targetDay,
                    details: updatedDetails
                };

                this.saving = true;
                try {
                    if (existingTable && existingTable.id) {
                        payload.id = existingTable.id;
                        if (existingTable.tenantId !== undefined) payload.tenantId = existingTable.tenantId;
                        await axios.post('/SchoolManager/UpdateTimeTable/', payload);
                        this.toastHandler('success', 'Period saved.');
                    } else {
                        await axios.post('/SchoolManager/CreateTimeTable/', payload);
                        this.toastHandler('success', 'TimeTable created.');
                    }
                    this.closeModal();
                    await this.refreshTimeTables();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async removePeriod(periodIndex, dayName) {
                const targetDay = dayName || this.activeDay;
                const existingTable = this.getTimeTableForDay(targetDay);
                if (!existingTable || !existingTable.id) return;

                const confirmed = await confirmDialog({
                    title: 'Remove Period?',
                    text: 'Remove this scheduled period from the timetable?',
                    confirmText: 'Yes, remove'
                });
                if (!confirmed) return;

                const updatedDetails = [...existingTable.details];
                updatedDetails.splice(periodIndex, 1);

                this.saving = true;
                try {
                    if (updatedDetails.length === 0) {
                        await axios.get('/SchoolManager/DeleteTimeTable?id=' + encodeURIComponent(existingTable.id));
                        this.toastHandler('success', 'Schedule cleared for ' + targetDay);
                    } else {
                        const payload = {
                            id: existingTable.id,
                            academicYearId: existingTable.academicYearId,
                            academicYearName: existingTable.academicYearName,
                            termId: existingTable.termId,
                            termName: existingTable.termName,
                            classId: existingTable.classId,
                            className: existingTable.className,
                            day: existingTable.day,
                            tenantId: existingTable.tenantId,
                            details: updatedDetails
                        };
                        await axios.post('/SchoolManager/UpdateTimeTable/', payload);
                        this.toastHandler('success', 'Period removed.');
                    }
                    if (this.modalOpen) this.closeModal();
                    await this.refreshTimeTables();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async deleteCurrentDaySchedule() {
                const existingTable = this.currentTimeTable;
                if (!existingTable || !existingTable.id) return;

                const confirmed = await confirmDialog({
                    title: `Clear ${this.activeDay}?`,
                    text: `All ${existingTable.details.length} period(s) for ${this.activeDay} will be deleted.`,
                    confirmText: 'Yes, clear'
                });
                if (!confirmed) return;

                this.saving = true;
                try {
                    await axios.get('/SchoolManager/DeleteTimeTable?id=' + encodeURIComponent(existingTable.id));
                    this.toastHandler('success', `${this.activeDay} cleared.`);
                    await this.refreshTimeTables();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            openCopyModal(targetDay) {
                this.copyTargetDay = targetDay || this.activeDay || 'Tuesday';
                this.copySourceDay = '';
                this.copyModalOpen = true;
            },

            async copyDaySchedule(sourceDay) {
                const src = sourceDay || this.copySourceDay;
                const tgt = this.copyTargetDay || this.activeDay;

                if (!src || src === tgt) return;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();

                const sourceTable = this.timetables.find(t =>
                    String(t.academicYearId).toLowerCase() === yId &&
                    String(t.termId).toLowerCase() === tId &&
                    String(t.classId).toLowerCase() === cId &&
                    String(t.day).toLowerCase() === src.toLowerCase()
                );

                if (!sourceTable || !sourceTable.details || sourceTable.details.length === 0) {
                    return this.toastHandler('warning', `No periods found on ${src} to copy.`);
                }

                const confirmed = await confirmDialog({
                    title: `Copy ${src} to ${tgt}?`,
                    text: `Duplicate all ${sourceTable.details.length} periods from ${src} to ${tgt}?`,
                    confirmText: 'Yes, copy',
                    tone: 'primary'
                });
                if (!confirmed) return;

                const targetTable = this.getTimeTableForDay(tgt);
                const newDetails = sourceTable.details.map(d => ({
                    id: uuid(),
                    timeTableId: asGuid(targetTable ? targetTable.id : EMPTY_GUID),
                    subjectId: d.subjectId,
                    subjectName: d.subjectName,
                    teacherId: d.teacherId,
                    teacherName: d.teacherName,
                    startTime: d.startTime,
                    endTime: d.endTime
                }));

                const payload = {
                    academicYearId: asGuid(this.academicYearId),
                    academicYearName: this.nameOf(this.academicYears, this.academicYearId),
                    termId: asGuid(this.termId),
                    termName: this.nameOf(this.terms, this.termId),
                    classId: asGuid(this.classId),
                    className: this.nameOf(this.classes, this.classId),
                    day: tgt,
                    details: newDetails
                };

                this.saving = true;
                try {
                    if (targetTable && targetTable.id) {
                        payload.id = targetTable.id;
                        if (targetTable.tenantId !== undefined) payload.tenantId = targetTable.tenantId;
                        await axios.post('/SchoolManager/UpdateTimeTable/', payload);
                    } else {
                        await axios.post('/SchoolManager/CreateTimeTable/', payload);
                    }
                    this.toastHandler('success', `Copied ${src} schedule to ${tgt}.`);
                    this.copyModalOpen = false;
                    await this.refreshTimeTables();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshTimeTables() {
                try {
                    const res = await axios.get('/SchoolManager/GetTimeTables/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.timetables = (Array.isArray(raw) ? raw : []).map(normalizeTimeTable);
                } catch (e) {
                    console.error('Failed to refresh timetables', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();

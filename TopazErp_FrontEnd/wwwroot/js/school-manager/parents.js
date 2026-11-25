
(function () {
    var app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                activeTab: 'student',   // 'student' | 'all'

                // shared lookups
                classes: [],
                students: [],
                relationships: [],
                titles: [],
                contacts: [],

                // tab 1 — by student
                classId: '',
                studentFilter: '',
                onlyWithContacts: true,

                // tab 2 — all contacts
                allClassId: '',
                allSearch: '',
                allPage: 1,
                perPage: 10,

                // modal editor
                modalOpen: false,
                editingId: null,        // null = creating
                editingTenantId: null,
                draft: {
                    legalGuardianId: '',
                    studentId: '',
                    titleId: '',
                    relationshipId: '',
                    firstName: '',
                    lastName: '',
                    otherNames: '',
                    phoneNumber: '',
                    contactNumber: '',
                    email: '',
                    placeOfWork: '',
                    workPhone: '',
                    isLegalGuardian: false
                }
            };
        },

        computed: {
            scopeReady() {
                return !!this.classId;
            },

            /* students keyed by lower-cased id for O(1) lookups */
            studentIndex() {
                const m = {};
                for (const s of this.students) m[String(s.id).toLowerCase()] = s;
                return m;
            },

            studentsInClass() {
                if (!this.classId) return [];
                return this.students.filter(s => s.classId === this.classId);
            },

            /** students shown on Tab 1 — search + the "only students with contacts" toggle */
            filteredStudents() {
                let rows = this.studentsInClass;
                if (this.onlyWithContacts) {
                    rows = rows.filter(s => this.contactsFor(s.id).length > 0);
                }
                const q = (this.studentFilter || '').trim().toLowerCase();
                if (q) {
                    rows = rows.filter(s => String(s.name).toLowerCase().includes(q)
                        || String(s.identifier || '').toLowerCase().includes(q));
                }
                return rows;
            },

            /** Tab 1 header summary: how many students in this class already have at least one contact */
            withContactsInClass() {
                return this.studentsInClass.filter(s => this.contactsFor(s.id).length > 0).length;
            },

            /** students with no contacts yet — the gap list */
            studentsWithoutContacts() {
                return this.studentsInClass.filter(s => this.contactsFor(s.id).length === 0).length;
            },

            /** students for dropdowns — label carries the class so the right student is easy to find */
            studentOptions() {
                return [...this.students]
                    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
                    .map(s => ({
                        id: s.id,
                        label: s.name + (this.nameOf(this.classes, s.classId) ? ' — ' + this.nameOf(this.classes, s.classId) : '')
                    }));
            },

            /* ---------- tab 2 ---------- */
            filteredAll() {
                let rows = this.contacts;
                if (this.allClassId) {
                    rows = rows.filter(r => this.classIdOfStudent(r.studentId) === this.allClassId);
                }
                const q = (this.allSearch || '').trim().toLowerCase();
                if (q) {
                    rows = rows.filter(r => [
                        this.displayName(r),
                        r.studentName,
                        r.relationshipName,
                        r.titleName,
                        r.phoneNumber,
                        r.contactNumber,
                        r.workPhone,
                        r.email,
                        r.placeOfWork
                    ].join(' ').toLowerCase().includes(q));
                }
                return [...rows].sort((a, b) =>
                    String(a.studentName || '').localeCompare(String(b.studentName || ''))
                    || String(a.lastName || '').localeCompare(String(b.lastName || ''))
                    || String(a.firstName || '').localeCompare(String(b.firstName || '')));
            },

            allTotalPages() {
                return Math.max(1, Math.ceil(this.filteredAll.length / this.perPage));
            },

            clampedAllPage() {
                return Math.min(this.allPage, this.allTotalPages);
            },

            pagedAll() {
                const start = (this.clampedAllPage - 1) * this.perPage;
                return this.filteredAll.slice(start, start + this.perPage);
            },

            allShowingFrom() {
                return this.filteredAll.length === 0 ? 0 : (this.clampedAllPage - 1) * this.perPage + 1;
            },

            allShowingTo() {
                return Math.min(this.clampedAllPage * this.perPage, this.filteredAll.length);
            },

            allPageNumbers() {
                const t = this.allTotalPages, c = this.clampedAllPage;
                const pages = [];
                for (let p = 1; p <= t; p++) {
                    if (p === 1 || p === t || Math.abs(p - c) <= 1) pages.push(p);
                    else if (pages[pages.length - 1] !== '…') pages.push('…');
                }
                return pages;
            }
        },

        watch: {
            allSearch() { this.allPage = 1; },
            allClassId() { this.allPage = 1; }
        },

        methods: {
            /* ==========================================================
             * helpers (methods, not top-level consts — no 'use strict')
             * ========================================================== */
            val(o, k) {
                return o ? (o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)]) : undefined;
            },

            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            },

            isGuid(v) {
                return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
            },

            truthy(v) {
                return v === true || v === 1 || v === '1'
                    || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes';
            },

            errMsg(err) {
                return (err && err.response && err.response.data && (err.response.data.message || err.response.data.title))
                    || (err && err.message)
                    || 'Something went wrong.';
            },

            // Swal confirmation — popup dialogs only
            confirmDialog({ title = 'Are you sure?', text = '', confirmText = 'Yes, delete', tone = 'danger' } = {}) {
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
            },

            nameOf(list, id) {
                const item = (list || []).find(x => x.id === id);
                return item ? item.name : '';
            },

            normalizeLookups(list) {
                return (list || [])
                    .map(o => ({ id: this.val(o, 'id'), name: this.val(o, 'name') || this.val(o, 'displayName') || '' }))
                    .filter(o => o.id != null && o.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name));
            },

            normalizeClasses(list) {
                return (list || [])
                    .map(c => ({
                        id: this.val(c, 'id'),
                        name: this.val(c, 'className') || '',
                        streamName: this.val(c, 'streamName') || '',
                        ordinal: this.val(c, 'ordinal') || 0
                    }))
                    .filter(c => c.id != null && c.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(({ id, name }) => ({ id, name }));
            },

            normalizeStudents(list) {
                return (list || [])
                    .map(s => ({
                        id: this.val(s, 'id') || this.val(s, 'studentId') || this.val(s, 'studentID'),
                        name: this.val(s, 'studentName') || this.val(s, 'fullName') || this.val(s, 'name')
                            || [this.val(s, 'firstName'), this.val(s, 'lastName')].filter(Boolean).join(' ') || '',
                        identifier: this.val(s, 'studentIdentifier') || this.val(s, 'identifier') || this.val(s, 'admissionNumber') || '',
                        classId: this.val(s, 'classId') || this.val(s, 'classID') || null
                    }))
                    .filter(s => s.id != null && s.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name));
            },

            normalizeContacts(list) {
                return (list || []).map(o => ({
                    id: this.val(o, 'id'),
                    // writes always use legalGuardianId; tolerate the double-a spelling on read
                    legalGuardianId: this.val(o, 'legalGuardianId') || this.val(o, 'legalGuardiaanId') || '',
                    studentId: this.val(o, 'studentId'),
                    studentName: this.val(o, 'studentName') || '',
                    relationshipId: this.val(o, 'relationshipId'),
                    relationshipName: this.val(o, 'relationshipName') || '',
                    titleId: this.val(o, 'titleId'),
                    titleName: this.val(o, 'titleName') || '',
                    firstName: this.val(o, 'firstName') || '',
                    lastName: this.val(o, 'lastName') || '',
                    otherNames: this.val(o, 'otherNames') || '',
                    phoneNumber: this.val(o, 'phoneNumber') || '',
                    contactNumber: this.val(o, 'contactNumber') || '',
                    email: this.val(o, 'email') || '',
                    isLegalGuardian: this.truthy(this.val(o, 'isLegalGuardian')),
                    placeOfWork: this.val(o, 'placeOfWork') || '',
                    workPhone: this.val(o, 'workPhone') || '',
                    tenantId: this.val(o, 'tenantId')
                })).filter(c => c.id != null || c.legalGuardianId);
            },

            classIdOfStudent(studentId) {
                const s = this.studentIndex[String(studentId || '').toLowerCase()];
                return s ? s.classId : null;
            },

            contactsFor(studentId) {
                const key = String(studentId || '').toLowerCase();
                return this.contacts
                    .filter(c => String(c.studentId || '').toLowerCase() === key)
                    .sort((a, b) => String(a.lastName).localeCompare(String(b.lastName)) || String(a.firstName).localeCompare(String(b.firstName)));
            },

            displayName(c) {
                return [c.titleName, c.firstName, c.otherNames, c.lastName].filter(Boolean).join(' ').trim();
            },

            initialsOf(c) {
                const f = String(c.firstName || '').trim(), l = String(c.lastName || '').trim();
                const a = f.charAt(0).toUpperCase(), b = l.charAt(0).toUpperCase();
                return (a + (b || '')) || '?';
            },

            /* ==========================================================
             * data loading
             * ========================================================== */
            getSetupData() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                return Promise.all([
                    axios.get('/SchoolManager/GetStudentBios/'),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get(`/JsonDataSample/relationships.json?v=${stamp}`),
                    axios.get(`/JsonDataSample/titles.json?v=${stamp}`),
                    axios.get('/SchoolManager/GetStContactRelationships/')
                ]).then(([bios, levelClasses, relationships, titles, contacts]) => {
                    this.students = this.normalizeStudents(bios.data.result);
                    this.classes = this.normalizeClasses(levelClasses.data.result);
                    this.relationships = this.normalizeLookups(relationships.data);
                    this.titles = this.normalizeLookups(titles.data);
                    this.contacts = this.normalizeContacts(contacts.data.result);
                    this.setupDone = true;
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshContacts() {
                return axios.get('/SchoolManager/GetStContactRelationships/').then(res => {
                    this.contacts = this.normalizeContacts(res.data.result);
                });
            },

            /* ==========================================================
             * modal editor
             * ========================================================== */
            blankDraft() {
                return {
                    legalGuardianId: this.uuid(),
                    studentId: '',
                    titleId: '',
                    relationshipId: '',
                    firstName: '',
                    lastName: '',
                    otherNames: '',
                    phoneNumber: '',
                    contactNumber: '',
                    email: '',
                    placeOfWork: '',
                    workPhone: '',
                    isLegalGuardian: false
                };
            },

            openAddModal(studentId) {
                this.editingId = null;
                this.editingTenantId = null;
                this.draft = this.blankDraft();
                if (studentId) this.draft.studentId = studentId;
                this.modalOpen = true;
            },

            openEditModal(contact) {
                this.editingId = contact.id;
                this.editingTenantId = contact.tenantId;
                this.draft = {
                    legalGuardianId: contact.legalGuardianId || this.uuid(),
                    studentId: contact.studentId || '',
                    titleId: contact.titleId || '',
                    relationshipId: contact.relationshipId || '',
                    firstName: contact.firstName || '',
                    lastName: contact.lastName || '',
                    otherNames: contact.otherNames || '',
                    phoneNumber: contact.phoneNumber || '',
                    contactNumber: contact.contactNumber || '',
                    email: contact.email || '',
                    placeOfWork: contact.placeOfWork || '',
                    workPhone: contact.workPhone || '',
                    isLegalGuardian: !!contact.isLegalGuardian
                };
                this.modalOpen = true;
            },

            closeModal() {
                this.modalOpen = false;
            },

            buildPayload() {
                const d = this.draft;
                const student = this.studentIndex[String(d.studentId || '').toLowerCase()];
                const payload = {
                    legalGuardianId: d.legalGuardianId,
                    studentId: d.studentId,
                    studentName: student ? student.name : '',
                    relationshipId: d.relationshipId,
                    relationshipName: this.nameOf(this.relationships, d.relationshipId),
                    titleId: d.titleId,
                    titleName: this.nameOf(this.titles, d.titleId),
                    firstName: String(d.firstName || '').trim(),
                    lastName: String(d.lastName || '').trim(),
                    otherNames: String(d.otherNames || '').trim(),
                    phoneNumber: String(d.phoneNumber || '').trim(),
                    contactNumber: String(d.contactNumber || '').trim(),
                    email: String(d.email || '').trim(),
                    isLegalGuardian: !!d.isLegalGuardian,
                    placeOfWork: String(d.placeOfWork || '').trim(),
                    workPhone: String(d.workPhone || '').trim()
                };
                if (this.editingId) {
                    payload.id = this.editingId;
                    if (this.editingTenantId !== undefined && this.editingTenantId !== null) {
                        payload.tenantId = this.editingTenantId;
                    }
                }
                return payload;
            },

            async saveContact() {
                const d = this.draft;
                if (!d.studentId) return this.toastHandler('warning', 'Pick the student.');
                if (!d.titleId) return this.toastHandler('warning', 'Pick a title.');
                if (!d.relationshipId) return this.toastHandler('warning', 'Pick a relationship.');
                if (!String(d.firstName || '').trim()) return this.toastHandler('warning', 'First name is required.');
                if (!String(d.lastName || '').trim()) return this.toastHandler('warning', 'Last name is required.');

                if (this.editingId && !this.isGuid(this.editingId)) {
                    this.toastHandler('error', 'This record has an invalid id — refresh the page and try again.');
                    return;
                }

                // duplicate guard: same student + same name (excluding the row being edited)
                const sKey = String(d.studentId).toLowerCase();
                const nKey = (String(d.firstName).trim() + '|' + String(d.lastName).trim()).toLowerCase();
                const dupe = this.contacts.find(c =>
                    String(c.studentId || '').toLowerCase() === sKey
                    && (String(c.firstName).trim() + '|' + String(c.lastName).trim()).toLowerCase() === nKey
                    && String(c.id) !== String(this.editingId));
                if (dupe) {
                    const proceed = await this.confirmDialog({
                        tone: 'primary',
                        title: 'Possible duplicate',
                        text: 'This student already has a contact named “' + this.displayName(dupe) + '” (' + (dupe.relationshipName || 'contact') + '). Save anyway?',
                        confirmText: 'Save anyway'
                    });
                    if (!proceed) return;
                }

                const payload = this.buildPayload();
                this.saving = true;
                this.isShimmerLoading = true;
                try {
                    if (this.editingId) {
                        await axios.post('/SchoolManager/UpdateStContactRelationship/', payload);
                        this.toastHandler('success', 'Contact updated.');
                    } else {
                        await axios.post('/SchoolManager/CreateStContactRelationship/', payload); // no id, no tenantId on create
                        this.toastHandler('success', 'Contact saved.');
                    }
                    await this.refreshContacts();
                    this.closeModal();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },

            async deleteContact(contact) {
                const name = this.displayName(contact) || 'this contact';
                if (!(await this.confirmDialog({
                    tone: 'danger',
                    title: 'Delete contact?',
                    text: 'Delete ' + name + ' (' + (contact.relationshipName || 'contact') + ')? This cannot be undone.',
                    confirmText: 'Yes, delete'
                }))) return;

                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeleteStContactRelationship?id=' + encodeURIComponent(contact.id));
                    this.toastHandler('success', 'Contact deleted.');
                    await this.refreshContacts();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            setAllPage(p) {
                if (p === '…') return;
                this.allPage = Math.min(Math.max(1, Number(p) || 1), this.allTotalPages);
            },

            /* ---------- Swal toast ---------- */
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
            }
        },

        mounted() {
            this.getSetupData();
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    } else {
        console.error('WSelectPlugin not found — load the w-select plugin before js/school-manager/legal-guardians.js');
    }

    app.mount('#app');
})();

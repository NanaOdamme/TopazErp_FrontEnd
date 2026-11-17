(() => {
    'use strict';

    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };

    const today = isoDate(new Date());

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                payload: {},
                streamList: [],
                classList:[],
                levelList:[],
                levelClassList:[],
                actualLevelList:[],
                activeTab: 'classes',
                theme: '#062a81',
               
            }
        },
        computed:{
            levelColumns(){
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false},
                    { key: 'actualLevelId', label: 'Actual Level', type: 'select', options: this.actualLevelList, display: 'name', value: 'id', width: 220 },
                    { key: 'levelName', label: 'Level Name', type: 'text', required: true, editable: true, searchable: true, width: 250},
                    { key: 'ordinal', label: 'Ordinal', type: 'number', defaultValue: 1, width: 220 },
                    { key: 'accessPerformanceForm',      label: 'Access Performance Form?',      type: 'boolean',   width: 130, searchable: true  },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false},
                ];
            },
            classColumns(){
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false},
                    { key: 'name', label: 'Class', type: 'text', required: true, editable: true, searchable: true, width: 250},
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false},
                ];
            }, 
            levelClassColumns(){
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false},
                    { key: 'levelId', label: 'Level', type: 'select', options: this.levelList, display: 'levelName', value: 'id', width: 220 },
                    { key: 'classId', label: 'Class', type: 'select', options: this.classList, display: 'name', value: 'id', width: 220 },
                    { key: 'streamId', label: 'Stream', type: 'select', options: this.streamList, display: 'name', value: 'id', width: 120 },
                    { key: 'className', label: 'Class Name', type: 'text',  editable: true, searchable: true, width: 250, disabled:true, placeholder:'Created on Save'},
                    { key: 'ordinal', label: 'Ordinal', type: 'number', defaultValue: 1, width: 120 },
                    { key: 'isHighestClass',      label: 'Is Highest Class?',      type: 'boolean',   width: 230, searchable: true  },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false},
                ];
            },
        },
        methods: {
            getSetupData() {
                this.isShimmerLoading = true
                return Promise.all([
                    axios.get('/SchoolManager/GetClasses/'),
                    axios.get('/SchoolManager/GetStreams/'),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get(`/jsonDataSample/actualLevels.json?v=${new Date().getTime()}`),
                    axios.get('/SchoolManager/GetLevels/'),
                ]).then(([classes, streams, levelClasses, actualLevels, levels]) => {
                   
                    this.classList = classes.data.result;
                    this.streamList = streams.data.result;
                    this.levelClassList = levelClasses.data.result;
                    this.actualLevelList = actualLevels.data;
                    this.levelList = levels.data.result;
                    this.isShimmerLoading = false;
                }).catch(err => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            // --- CRUD HANDLERS ---

            // Class CRUD
            async onClassCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                const payload = {
                    name: row.name,
                    tenantId: row.tenantId || 1 // Default tenant if not provided
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateClass', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Class created successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to create Class.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onClassUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                const existing = this.classList.find(c => c.id === row.id);
                const payload = {
                    ...row,
                    id: existing?.id || row.id,
                    tenantId: existing?.tenantId || row.tenantId,
                    name: row.name
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateClass', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Class updated successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to update Class.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onClassDelete(event) {
                const rows = event?.rows;
                if (!Array.isArray(rows) || !rows.length) return;

                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get(`/SchoolManager/DeleteClass?id=${r.id}`))
                    );

                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} Class(es) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} Class(es) deleted successfully.`);
                    }
                    await this.getSetupData();
                } catch (error) {
                    this.toastHandler('error', 'Failed to delete Class(es).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // Level CRUD
            async onLevelCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                const payload = {
                    actualLevelId: row.actualLevelId,
                    levelName: row.levelName,
                    ordinal: row.ordinal || 1,
                    accessPerformanceForm: row.accessPerformanceForm || false,
                    tenantId: row.tenantId || 1
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateLevel', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Level created successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to create Level.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onLevelUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                const existing = this.levelList.find(l => l.id === row.id);
                const payload = {
                    ...row,
                    id: existing?.id || row.id,
                    tenantId: existing?.tenantId || row.tenantId,
                    actualLevelId: row.actualLevelId,
                    levelName: row.levelName,
                    ordinal: row.ordinal || 1,
                    accessPerformanceForm: row.accessPerformanceForm || false
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateLevel', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Level updated successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to update Level.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onLevelDelete(event) {
                const rows = event?.rows;
                if (!Array.isArray(rows) || !rows.length) return;

                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get(`/SchoolManager/DeleteLevel?id=${r.id}`))
                    );

                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} Level(s) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} Level(s) deleted successfully.`);
                    }
                    await this.getSetupData();
                } catch (error) {
                    this.toastHandler('error', 'Failed to delete Level(s).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // Level Class CRUD
            async onLevelClassCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                // Generate className from classId name and stream name
                const classObj = this.classList.find(c => c.id === row.classId);
                const streamObj = this.streamList.find(s => s.id === row.streamId);
                const className = `${classObj?.name || ''} ${streamObj?.name || ''}`.trim();

                const payload = {
                    levelId: row.levelId,
                    classId: row.classId,
                    streamId: row.streamId,
                    className: className, // Auto-generated combination
                    ordinal: row.ordinal || 1,
                    isHighestClass: row.isHighestClass || false,
                    tenantId: row.tenantId || 1
                };

                this.isShimmerLoading = true;
                try {
                    const response = await axios.post('/SchoolManager/CreateLevelClass', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Level Class created successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to create Level Class.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onLevelClassUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;

                // Generate className from classId name and stream name
                const classObj = this.classList.find(c => c.id === row.classId);
                const streamObj = this.streamList.find(s => s.id === row.streamId);
                const className = `${classObj?.name || ''} ${streamObj?.name || ''}`.trim();

                const existing = this.levelClassList.find(lc => lc.id === row.id);
                const payload = {
                    ...row,
                    id: existing?.id || row.id,
                    tenantId: existing?.tenantId || row.tenantId,
                    levelId: row.levelId,
                    classId: row.classId,
                    streamId: row.streamId,
                    className: className, // Auto-generated combination
                    ordinal: row.ordinal || 1,
                    isHighestClass: row.isHighestClass || false
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateLevelClass', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Level Class updated successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to update Level Class.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onLevelClassDelete(event) {
                const rows = event?.rows;
                if (!Array.isArray(rows) || !rows.length) return;

                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get(`/SchoolManager/DeleteLevelClass?id=${r.id}`))
                    );

                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} Level Class(es) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} Level Class(es) deleted successfully.`);
                    }
                    await this.getSetupData();
                } catch (error) {
                    this.toastHandler('error', 'Failed to delete Level Class(es).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // Toast Handler
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                        title: message,
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                    });
                } else {
                    console.log(`[${type.toUpperCase()}] ${message}`);
                }
            }
        },

        mounted() {
            this.getSetupData();
        },
    });

    // Use DataGridPlugin and WSelectPlugin
    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();

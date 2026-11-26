const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            performanceAreaList: [],
            performanceSkillList: [],
            theme: '#062a81',
            columns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    editable: false,
                    searchable: false
                },
                {
                    key: 'name',
                    label: 'Performance Area',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true,
                    editable: false,
                    searchable: false
                }
            ],
            
        };
    },
    computed:{
        skillColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    editable: false,
                    searchable: false
                },
                {
                    key: 'performanceAreaId',
                    label: 'Performance Area',
                    type: 'select',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250',
                    options: this.performanceAreaList,
                    value: 'id',
                    display: 'name'
                },
                {
                    key: 'performanceAreaName',
                    label: 'Area Name',
                    type: 'text',
                    hidden: true,
                    editable: false,
                    searchable: false
                },
                {
                    key: 'name',
                    label: 'Performance Skill',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true,
                    editable: false,
                    searchable: false
                }
            ]
        }
    },
    methods: {
        getSetupData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetPerformanceAreas/').then(response => {
                this.performanceAreaList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get performance areas.');
            });

            this.getPerformanceSkills();
        },

        getPerformanceSkills() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetPerformanceSkills/').then(response => {
                this.performanceSkillList = this.normalizeSkills(response.data.result);
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get performance skills.');
            });
        },

        /** PerformanceSkill carries PerformanceAreaName; fill it in when the API omits it. */
        normalizeSkills(list) {
            return (Array.isArray(list) ? list : []).map(s => {
                const areaId = s.performanceAreaId;
                const area = (this.performanceAreaList || []).find(a =>
                    String(a.id || '').toLowerCase() === String(areaId || '').toLowerCase()
                );

                return {
                    ...s,
                    name: String(s.name || '').trim(),
                    performanceAreaId: areaId,
                    performanceAreaName: s.performanceAreaName || (area ? area.name : '')
                };
            });
        },

        /* ================= PERFORMANCE AREAS ================= */
        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.create(row);
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.update(row);
        },

        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.delete(rows);
        },

        create(row) {
            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreatePerformanceArea/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getSetupData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getSetupData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getSetupData();
                this.toastHandler('error', 'Unable to save performance area.');
                this.isShimmerLoading = false;
            });
        },

        update(row) {
            const existing = this.performanceAreaList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Performance area was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdatePerformanceArea/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Performance area updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update performance area.');
            });
        },

        async delete(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeletePerformanceArea?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} performance area(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} performance area(s) deleted successfully.`
                    );
                    this.getSetupData();
                }
            } catch (err) {
                console.error('Failed to delete performance areas:', err);
                this.toastHandler('error', 'Failed to delete performance areas.');
                this.getSetupData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ================= PERFORMANCE SKILLS ================= */
        async onCreateSkill(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createSkill(row);
        },

        async onUpdateSkill(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updateSkill(row);
        },

        async onDeleteSkill(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deleteSkills(rows);
        },

        /** Resolve the area name for the selected area id (PerformanceAreaName is part of the entity). */
        resolveAreaName(areaId) {
            const area = (this.performanceAreaList || []).find(a =>
                String(a.id || '').toLowerCase() === String(areaId || '').toLowerCase()
            );
            return area ? area.name : '';
        },

        buildSkillPayload(row, existing) {
            const areaId = row.performanceAreaId || (existing ? existing.performanceAreaId : null);

            if (!areaId) {
                this.toastHandler('warning', 'Please select a performance area.');
                return null;
            }

            if (!String(row.name || '').trim()) {
                this.toastHandler('warning', 'Please enter the performance skill name.');
                return null;
            }

            const payload = {
                id: (existing ? existing.id : row.id) || this.uuid(),
                performanceAreaId: areaId,
                performanceAreaName: row.performanceAreaName || this.resolveAreaName(areaId),
                name: String(row.name || '').trim(),
                tenantId: existing ? existing.tenantId : (row.tenantId || 0)
            };

            return payload;
        },

        createSkill(row) {
            const payload = this.buildSkillPayload(row, null);
            if (!payload) return;

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreatePerformanceSkill/', payload).then(response => {
                if (response.data && response.data.result && response.data.result.code === 200) {
                    this.getPerformanceSkills();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', (response.data && response.data.message) || 'Unable to save performance skill.');
                    this.getPerformanceSkills();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getPerformanceSkills();
                this.toastHandler('error', 'Unable to save performance skill.');
                this.isShimmerLoading = false;
            });
        },

        updateSkill(row) {
            const existing = this.performanceSkillList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Performance skill was not found.');
                return;
            }

            const payload = this.buildSkillPayload(row, existing);
            if (!payload) return;

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdatePerformanceSkill/', payload).then(response => {
                this.getPerformanceSkills();
                this.toastHandler('success', 'Performance skill updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update performance skill.');
            });
        },

        async deleteSkills(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeletePerformanceSkill?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} performance skill(s) deleted; ${failed} failed.`
                    );
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} performance skill(s) deleted successfully.`
                    );
                }

                this.getPerformanceSkills();
            } catch (err) {
                console.error('Failed to delete performance skills:', err);
                this.toastHandler('error', 'Failed to delete performance skills.');
                this.getPerformanceSkills();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        uuid() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
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
        }
    },

    mounted() {
        this.getSetupData();
    },

    watch: {
        /** Keep the skill grid's area options/names in sync with the areas list. */
        performanceAreaList: {
            handler(list) {
                const areas = Array.isArray(list) ? list : [];
                this.performanceSkillList = (this.performanceSkillList || []).map(s => {
                    const area = areas.find(a =>
                        String(a.id || '').toLowerCase() === String(s.performanceAreaId || '').toLowerCase()
                    );
                    return { ...s, performanceAreaName: area ? area.name : (s.performanceAreaName || '') };
                });
            },
            deep: true
        }
    }
});

app.use(DataGridPlugin);
app.mount('#app');

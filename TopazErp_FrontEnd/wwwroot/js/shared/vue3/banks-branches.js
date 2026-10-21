const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#0645e7',
            bankList: [],

            bankColumns: [
                { key: 'id',            label: 'ID',             type: 'text',   hidden: true, width: 74 },
                { key: 'name',          label: 'Bank Name',      type: 'avatar', width: 250, minWidth: 250, required: true, searchable: true, subtitleKey: 'bankCode' },
                { key: 'bankCode',      label: 'Bank Code',      type: 'text',   width: 130, searchable: true },
                { key: 'contactPerson', label: 'Contact Person', type: 'text',   width: 200, searchable: true },
                { key: 'email',         label: 'Email',          type: 'email',  width: 240, required: true, searchable: true },
                { key: 'contactNo',     label: 'Contact No',     type: 'phone',  width: 160, searchable: true },
                { key: 'tenantId',      label: 'Tenant',         type: 'number', hidden: true }
            ],

            branchCol: {
                key: 'bankBranches',
                title: 'Branches',
                columns: [
                    { key: 'id',            label: 'ID',             type: 'text',   hidden: true, width: 74 },
                    { key: 'bankId',        label: 'Bank ID',        type: 'text',   hidden: true },
                    { key: 'name',          label: 'Branch Name',    type: 'avatar', width: 250, minWidth: 250, required: true, searchable: true, subtitleKey: 'email' },
                    { key: 'contactPerson', label: 'Contact Person', type: 'text',   width: 200, searchable: true },
                    { key: 'email',         label: 'Email',          type: 'email',  width: 240, required: true, searchable: true },
                    { key: 'contactNo',     label: 'Contact No',     type: 'phone',  width: 160, searchable: true }
                ]
            }
        };
    },

    methods: {
        /* ── Fetch ──────────────────────────────────────────────── */

        async getBanks() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/SharedResource/GetBanks?pageNo=1&pageSize=1000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || res?.data || (Array.isArray(res) ? res : []);

                this.bankList = rawList.map(bank => {
                    const branches = bank.bankBranches || bank.BankBranches || [];
                    branches.forEach(branch => {
                        branch.bankId = branch.bankId || bank.id;
                    });
                    return {
                        ...bank,
                        bankBranches: branches
                    };
                });
            } catch (error) {
                console.error('Failed to load banks:', error);
                this.toastHandler('error', 'Unable to load banks.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD Dispatchers wired to <data-grid> events ───────── */

        // @create — fired after grid form submit (mode='create')
        // event shape: { grid, level, row, data }
        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            // level 1 = child grid (Branch), level 0 = parent grid (Bank)
            if (event?.level === 1) {
                await this.createBranch(row, event?.grid);
            } else {
                await this.createBank(row);
            }
        },

        // @update — fired after grid form submit (mode='update')
        // event shape: { grid, level, row, data }
        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            if (event?.level === 1) {
                await this.updateBranch(row, event?.grid);
            } else {
                await this.updateBank(row);
            }
        },

        // @delete — fired after delete confirmation dialog
        // event shape: { grid, level, rows }
        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            if (event?.level === 1) {
                await this.deleteBranch(rows, event?.grid);
            } else {
                await this.deleteBank(rows);
            }
        },

        /* ── Bank CRUD ──────────────────────────────────────────── */

        async createBank(row) {
            if (!this.validateBank(row)) return;

            const payload = {
                name: String(row.name || '').trim(),
                contactPerson: String(row.contactPerson || '').trim(),
                email: String(row.email || '').trim(),
                contactNo: String(row.contactNo || '').trim(),
                bankCode: String(row.bankCode || '').trim(),
                bankBranches: []
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/CreateBank', payload);
                await this.getBanks();
                this.toastHandler('success', 'Bank created successfully.');
            } catch (err) {
                console.error('Failed to create bank:', err);
                this.toastHandler('error', 'Failed to create bank.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async updateBank(row) {
            if (!this.validateBank(row)) return;

            const existing = this.bankList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Bank record was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim(),
                contactPerson: String(row.contactPerson || '').trim(),
                email: String(row.email || '').trim(),
                contactNo: String(row.contactNo || '').trim(),
                bankCode: String(row.bankCode || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/UpdateBank', payload);
                const idx = this.bankList.findIndex(b => b.id === payload.id);
                if (idx !== -1) {
                    this.bankList.splice(idx, 1, {
                        ...this.bankList[idx],
                        ...payload,
                        bankBranches: this.bankList[idx].bankBranches || []
                    });
                }
                this.toastHandler('success', 'Bank updated successfully.');
            } catch (err) {
                console.error('Failed to update bank:', err);
                this.toastHandler('error', 'Failed to update bank.');
                await this.getBanks();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async deleteBank(rows) {
            this.isShimmerLoading = true;
            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SharedResource/DelBank?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler('warning', `${rows.length - failed} bank(s) deleted; ${failed} failed.`);
                    await this.getBanks();
                } else {
                    this.toastHandler('success', `${rows.length} bank(s) deleted successfully.`);
                }
            } catch (err) {
                console.error('Failed to delete bank:', err);
                this.toastHandler('error', 'Failed to delete bank.');
                await this.getBanks();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Branch CRUD ────────────────────────────────────────── */

        findParentBank(branch, grid) {
            if (!branch) return null;

            // 1. By direct bankId
            if (branch.bankId) {
                const found = this.bankList.find(b => b.id === branch.bankId);
                if (found) return found;
            }

            // 2. By searching bankBranches collection
            const foundInBranches = this.bankList.find(b =>
                (b.bankBranches || []).some(br => br === branch || (br.id && br.id === branch.id))
            );
            if (foundInBranches) return foundInBranches;

            // 3. Fallback: through grid parentLabel if available
            if (grid?.parentLabel) {
                const labelMatch = this.bankList.find(b => grid.parentLabel.includes(b.name));
                if (labelMatch) return labelMatch;
            }

            return null;
        },

        async createBranch(row, grid) {
            if (!this.validateBranch(row)) return;

            const parentBank = this.findParentBank(row, grid);
            const bankId = parentBank ? parentBank.id : row.bankId;

            if (!bankId) {
                this.toastHandler('error', 'Parent bank could not be determined.');
                return;
            }

            const branchId = row.id && !String(row.id).startsWith('row-') ? row.id : this.uuid();
            row.id = branchId;
            row.bankId = bankId;

            const payload = {
                id: branchId,
                bankId: bankId,
                name: String(row.name || '').trim(),
                contactPerson: String(row.contactPerson || '').trim(),
                email: String(row.email || '').trim(),
                contactNo: String(row.contactNo || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/CreateBankBranch', payload);
                await this.getBanks();
                this.toastHandler('success', 'Branch created successfully.');
            } catch (err) {
                console.error('Failed to create branch:', err);
                this.toastHandler('error', 'Failed to create branch.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async updateBranch(row, grid) {
            if (!this.validateBranch(row)) return;

            const parentBank = this.findParentBank(row, grid);
            const bankId = parentBank ? parentBank.id : row.bankId;

            const payload = {
                id: row.id,
                bankId: bankId,
                name: String(row.name || '').trim(),
                contactPerson: String(row.contactPerson || '').trim(),
                email: String(row.email || '').trim(),
                contactNo: String(row.contactNo || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/UpdateBankBranch', payload);
                await this.getBanks();
                this.toastHandler('success', 'Branch updated successfully.');
            } catch (err) {
                console.error('Failed to update branch:', err);
                this.toastHandler('error', 'Failed to update branch.');
                await this.getBanks();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async deleteBranch(rows, grid) {
            this.isShimmerLoading = true;
            try {
                const results = await Promise.allSettled(
                    rows.map(r => {
                        const parent = this.findParentBank(r, grid);
                        const bankId = parent ? parent.id : r.bankId;
                        return axios.post('/SharedResource/DelBankBranch', {
                            id: r.id,
                            bankId: bankId
                        });
                    })
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler('warning', `${rows.length - failed} branch(es) deleted; ${failed} failed.`);
                } else {
                    this.toastHandler('success', `${rows.length} branch(es) deleted successfully.`);
                }
                await this.getBanks();
            } catch (err) {
                console.error('Failed to delete branch:', err);
                this.toastHandler('error', 'Failed to delete branch.');
                await this.getBanks();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Helpers & Validation ───────────────────────────────── */

        validateBank(row) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('error', 'Bank Name is required.');
                return false;
            }
            if (!row.email || !String(row.email).trim()) {
                this.toastHandler('error', 'Email is required.');
                return false;
            }
            return true;
        },

        validateBranch(row) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('error', 'Branch Name is required.');
                return false;
            }
            if (!row.email || !String(row.email).trim()) {
                this.toastHandler('error', 'Email is required.');
                return false;
            }
            return true;
        },

        uuid() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },

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
        this.getBanks();
    }
});

app.use(DataGridPlugin);
app.mount('#app');

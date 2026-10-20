
const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            currencyList: [],
            theme: '#0645e7',

            currencyColumn: [
                { key: 'id',           label: 'ID',            type: 'text',   hidden: true,  width: 74 },
                { key: 'currencyName', label: 'Currency Name', type: 'avatar', width: 250, minWidth: 250, required: true, searchable: true, subtitleKey: 'currencyCode' },
                { key: 'currencyCode', label: 'Currency Code', type: 'text',   width: 120, searchable: true },
                { key: 'minorName',    label: 'Minor Name',    type: 'text',   width: 150, required: true, searchable: true },
                { key: 'buyRate',      label: 'Buy Rate',      type: 'number', width: 110, required: true, searchable: true, decimals: 4 },
                { key: 'sellRate',     label: 'Sell Rate',     type: 'number', width: 110, required: true, searchable: true, decimals: 4 },
                { key: 'tenantId',     label: 'Tenant',        type: 'number', hidden: true }
            ],

            ratesColumn: {
                key: 'rates',
                title: 'Rates',
                columns: [
                    { key: 'id',          label: 'ID',         type: 'text',   hidden: true, width: 10 },
                    { key: 'createdAt',   label: 'Created At', type: 'date',   width: 120, searchable: true },
                    { key: 'buyingRate',  label: 'Buy Rate',   type: 'number', width: 110, required: true, searchable: true, decimals: 4 },
                    { key: 'sellingRate', label: 'Sell Rate',  type: 'number', width: 110, required: true, searchable: true, decimals: 4 }
                ]
            }
        };
    },

    methods: {


        getCurrencies() {
            this.isShimmerLoading = true;
            axios.get('/SharedResource/GetCurrencies/?pageNo=1&pageSize=1000')
                .then(response => {
                    this.currencyList = response.data.result;
                })
                .catch(error => {
                    console.error('Failed to load currencies:', error);
                    this.toastHandler('error', 'Unable to load currencies.');
                })
                .finally(() => {
                    this.isShimmerLoading = false;
                });
        },

        async onCreate(event) {
            
            const row = event?.row || event?.data;
            if (!row) return;

            if (!this.validateCurrency(row)) return;

            const payload = {
                currencyName: row.currencyName,
                currencyCode: row.currencyCode,
                minorName:    row.minorName,
                buyRate:      row.buyRate,
                sellRate:     row.sellRate,
                Rates: [{
                    id:          this.uuid(),
                    createdAt:   new Date().toISOString(),
                    buyingRate:  row.buyRate,
                    sellingRate: row.sellRate
                }]
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/CreateCurrency', payload);
                await this.getCurrencies();          // refresh list from server
                this.toastHandler('success', 'Currency created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create currency.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        // @update — fired after the grid's built-in form is submitted with mode='update'
        // event shape: { grid, level, row, data }
        async onUpdate(event) {
            console.log('onUpdate fired:', event);
            const row = event?.row;
            if (!row) return;

            if (!this.validateCurrency(row)) return;

            const existing = this.currencyList.find(c => c.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Currency record was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id:       existing.id,
                tenantId: existing.tenantId,
                Rates: [{
                    id:          this.uuid(),
                    createdAt:   new Date().toISOString(),
                    buyingRate:  row.buyRate  ?? existing.buyRate,
                    sellingRate: row.sellRate ?? existing.sellRate
                }]
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/UpdateCurrency', payload);
                // Patch the local list reactively so the grid reflects changes immediately
                const idx = this.currencyList.findIndex(c => c.id === payload.id);
                if (idx !== -1) this.currencyList.splice(idx, 1, { ...payload });
                this.toastHandler('success', 'Currency updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update currency.');
                await this.getCurrencies();   // roll back optimistic patch
            } finally {
                this.isShimmerLoading = false;
            }
        },

        // @delete — fired after the user confirms the built-in delete dialog
        // event shape: { grid, level, rows }
        async onDelete(event) {
            console.log('onDelete fired:', event);
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            this.isShimmerLoading = true;
            try {
                // Delete sequentially; wrap in allSettled so one failure doesn't abort the rest
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SharedResource/DelCurrency?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler('warning', `${rows.length - failed} deleted; ${failed} failed.`);
                    await this.getCurrencies();  // re-sync after partial failure
                } else {
                    this.toastHandler('success', `${rows.length} currency record(s) deleted.`);
                    // The grid already removed the rows from its local data; no need to re-fetch
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete currency.');
                await this.getCurrencies();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Helpers ────────────────────────────────────────────── */

        validateCurrency(row) {
            if (!row.currencyName || !String(row.currencyName).trim()) {
                this.toastHandler('error', 'Currency Name is required.');
                return false;
            }
            if (!row.minorName || !String(row.minorName).trim()) {
                this.toastHandler('error', 'Minor Name is required.');
                return false;
            }
            if (row.buyRate === null || row.buyRate === undefined || row.buyRate === '') {
                this.toastHandler('error', 'Buy Rate is required.');
                return false;
            }
            if (row.sellRate === null || row.sellRate === undefined || row.sellRate === '') {
                this.toastHandler('error', 'Sell Rate is required.');
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
        this.getCurrencies();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
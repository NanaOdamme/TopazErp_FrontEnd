const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: true,
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            bankAccountList: [],         // raw bank accounts from server
            bankList: [],                // raw banks from server
            bankOptions: [],             // [{ label, value, name, code }]
            branchList: [],              // raw flattened bank branches
            branchOptions: [],           // [{ label, value, name, bankId, bankName }]
            filteredBranchOptions: [],   // branches filtered to the currently selected bank
            glAccountList: [],           // raw GL account details from server
            glAccountOptions: [],        // [{ label, value, name, accountNo, currencyId }]
            currencyList: [],            // raw currencies from server
            currencyOptions: [],         // [{ label, value, code, name }]

            accountTypeOptions: [
                { label: 'Current Account', value: 'Current', color: 'blue' },
                { label: 'Savings Account', value: 'Savings', color: 'emerald' },
                { label: 'Call Account', value: 'Call', color: 'violet' },
                { label: 'Fixed Deposit', value: 'Fixed Deposit', color: 'amber' },
                { label: 'Escrow Account', value: 'Escrow', color: 'teal' },
                { label: 'Other', value: 'Other', color: 'slate' }
            ]
        };
    },

    computed: {
        bankAccountColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'accountName',
                    label: 'Account Name',
                    type: 'avatar',
                    width: 240,
                    searchable: true,
                    sortable: true
                },
                {
                    key: 'accountNo',
                    label: 'Account No',
                    type: 'text',
                    width: 150,
                    searchable: true,
                    sortable: true
                },
                {
                    key: 'bankBranch',
                    label: 'Bank / Branch',
                    type: 'text',
                    width: 220,
                    searchable: true,
                    sortable: true,
                    render: (v, row) => {
                        const bank = row.bankName || '';
                        const branch = row.bankBranchName || '';
                        if (!bank && !branch) return '—';
                        if (bank && branch) {
                            return `<div class="flex items-center gap-1.5"><span class="font-medium text-slate-800 dark:text-slate-100">${bank}</span><span class="text-slate-300 dark:text-slate-600 font-semibold">/</span><span class="text-xs text-slate-600 dark:text-slate-300">${branch}</span></div>`;
                        }
                        return `<span class="text-slate-800 dark:text-slate-100">${bank || branch}</span>`;
                    }
                },
                {
                    key: 'accountTypeCurrency',
                    label: 'Account Type',
                    type: 'text',
                    width: 200,
                    searchable: true,
                    sortable: true,
                    render: (v, row) => {
                        const type = row.accountType || 'Current';
                        const curr = row.currencyCode || row.currencyName || '';
                        const colorMap = {
                            'Current': 'blue',
                            'Savings': 'emerald',
                            'Call': 'violet',
                            'Fixed Deposit': 'amber',
                            'Escrow': 'teal',
                            'Other': 'slate'
                        };
                        const color = colorMap[type] || 'blue';
                        const colorClasses = {
                            blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
                            emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
                            violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30',
                            amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
                            teal: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30',
                            slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30'
                        };
                        const cls = colorClasses[color] || colorClasses.blue;
                        const badgeHtml = `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}">${type}</span>`;
                        const currHtml = curr ? `<span class="text-xs font-semibold text-slate-600 dark:text-slate-300">(${curr})</span>` : '';
                        return `<div class="inline-flex items-center gap-1.5">${badgeHtml}${currHtml}</div>`;
                    }
                },
                {
                    key: 'contactDisplay',
                    label: 'Contact Person',
                    type: 'text',
                    width: 220,
                    searchable: true,
                    sortable: true,
                    render: (v, row) => {
                        const person = row.contactPerson || '';
                        const no = row.contactNo || '';
                        if (!person && !no) return '—';
                        if (person && no) {
                            const clean = String(no).replace(/[^\d+]/g, '');
                            return `<div class="flex flex-col leading-tight"><span class="font-medium text-slate-800 dark:text-slate-100">${person}</span><a class="text-xs text-primary-600 hover:underline tabular-nums mt-0.5" href="tel:${clean}">${no}</a></div>`;
                        }
                        if (no) {
                            const clean = String(no).replace(/[^\d+]/g, '');
                            return `<a class="text-xs text-primary-600 hover:underline tabular-nums" href="tel:${clean}">${no}</a>`;
                        }
                        return `<span class="text-slate-800 dark:text-slate-100">${person}</span>`;
                    }
                },
                {
                    key: 'dateOpened',
                    label: 'Date Opened',
                    type: 'date',
                    width: 140,
                    searchable: true,
                    sortable: true
                }
            ];
        },

        bankAccountFormColumns() {
            return [
                {
                    key: 'bankId',
                    label: 'Bank',
                    type: 'select',
                    options: this.bankOptions,
                    required: true,
                    searchable: true,
                    onChange: (val, values) => {
                        const bank = this.bankList.find(b => String(b.id) === String(val));

                        // Filter branch dropdown to only show branches of the selected bank
                        this.filteredBranchOptions = this.branchList
                            .filter(br => String(br.bankId) === String(val));

                        if (bank && values) {
                            values.bankName = bank.name || '';
                            if (bank.contactPerson && !values.contactPerson) values.contactPerson = bank.contactPerson;
                            if (bank.contactNo && !values.contactNo) values.contactNo = bank.contactNo;

                            // Reset branch selection if the current branch doesn't belong to the new bank
                            const currentBranchInBank = this.filteredBranchOptions.some(
                                br => String(br.value) === String(values.bankBranchId)
                            );
                            if (!currentBranchInBank) {
                                values.bankBranchId = '';
                                values.bankBranchName = '';
                            }
                        } else if (values) {
                            // Bank cleared — clear branch too
                            this.filteredBranchOptions = [];
                            values.bankBranchId = '';
                            values.bankBranchName = '';
                        }
                    }
                },
                {
                    key: 'bankBranchId',
                    label: 'Branch',
                    type: 'select',
                    options: this.filteredBranchOptions,
                    required: true,
                    searchable: true,
                    placeholder: 'Select a bank first',
                    onChange: (val, values) => {
                        const branch = this.branchList.find(br => String(br.value) === String(val));
                        if (branch && values) {
                            values.bankBranchName = branch.name || '';
                            if (branch.contactPerson && !values.contactPerson) values.contactPerson = branch.contactPerson;
                            if (branch.contactNo && !values.contactNo) values.contactNo = branch.contactNo;
                        }
                    }
                },
                {
                    key: 'accountId',
                    label: 'GL Account',
                    type: 'select',
                    options: this.glAccountOptions,
                    required: true,
                    searchable: true,
                    help: 'Chart of Accounts detail mapping',
                    onChange: (val, values) => {
                        const gl = this.glAccountList.find(a => String(a.id) === String(val));
                        if (gl && values) {
                            values.accountName = values.accountName || gl.accountName || '';
                            if (!values.accountNo && gl.accountNo) values.accountNo = String(gl.accountNo);
                            if (gl.currencyId && (!values.currencyId || values.currencyId === this.emptyGuid)) {
                                values.currencyId = gl.currencyId;
                            }
                        }
                    }
                },
                {
                    key: 'currencyId',
                    label: 'Currency',
                    type: 'select',
                    options: this.currencyOptions,
                    required: true,
                    searchable: true
                },
                {
                    key: 'accountName',
                    label: 'Account Name',
                    type: 'text',
                    required: true,
                    searchable: true,
                    placeholder: 'e.g. Operations Operating Account'
                },
                {
                    key: 'accountNo',
                    label: 'Account No',
                    type: 'text',
                    required: true,
                    searchable: true,
                    placeholder: 'e.g. 101002938484'
                },
                {
                    key: 'accountType',
                    label: 'Account Type',
                    type: 'select',
                    options: this.accountTypeOptions,
                    required: true,
                    defaultValue: 'Current',
                    default: 'Current'
                },
                {
                    key: 'dateOpened',
                    label: 'Date Opened',
                    type: 'date',
                    required: true,
                    defaultValue: () => new Date().toISOString().slice(0, 10),
                    default: () => new Date().toISOString().slice(0, 10)
                },
                {
                    key: 'contactPerson',
                    label: 'Contact Person',
                    type: 'text',
                    placeholder: 'e.g. Relationship Manager'
                },
                {
                    key: 'contactNo',
                    label: 'Contact No',
                    type: 'phone',
                    placeholder: 'e.g. +233 24 123 4567'
                },
                {
                    key: 'location',
                    label: 'Location',
                    type: 'text',
                    placeholder: 'e.g. High Street'
                },
                {
                    key: 'address',
                    label: 'Address',
                    type: 'text',
                    placeholder: 'e.g. P.O. Box 123, Accra'
                },
                {
                    key: 'chequeBookStart',
                    label: 'Cheque Start',
                    type: 'text',
                    placeholder: 'e.g. 000101'
                },
                {
                    key: 'chequeBookEnd',
                    label: 'Cheque End',
                    type: 'text',
                    placeholder: 'e.g. 000200'
                }
            ];
        }
    },

    methods: {

        /* ── Fetch ──────────────────────────────────────────────── */

        async getBanks() {
            try {
                const response = await axios.get('/SharedResource/GetBanks?pageNo=1&pageSize=1000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || res?.data || (Array.isArray(res) ? res : []);
                this.bankList = rawList;

                this.bankOptions = rawList.map(b => {
                    const code = b.bankCode ? ` (${b.bankCode})` : '';
                    return {
                        label: `${b.name}${code}`,
                        value: b.id,
                        name: b.name,
                        code: b.bankCode || ''
                    };
                });

                // Flatten all branches across all banks
                const allBranches = [];
                rawList.forEach(bank => {
                    const branches = bank.bankBranches || bank.BankBranches || [];
                    branches.forEach(branch => {
                        allBranches.push({
                            label: branch.name,
                            value: branch.id,
                            name: branch.name,
                            bankId: bank.id,
                            bankName: bank.name,
                            contactPerson: branch.contactPerson || '',
                            contactNo: branch.contactNo || '',
                            email: branch.email || ''
                        });
                    });
                });
                this.branchList = allBranches;
                this.branchOptions = allBranches;
                // filteredBranchOptions starts empty — populated when a bank is chosen in the form
                this.filteredBranchOptions = [];
            } catch (error) {
                console.error('Failed to load banks:', error);
            }
        },

        async getCurrencies() {
            try {
                const response = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=1000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
                this.currencyList = rawList;
                this.currencyOptions = rawList.map(c => ({
                    label: `${c.currencyCode} - ${c.currencyName}`,
                    value: c.id,
                    code: c.currencyCode,
                    name: c.currencyName
                }));
            } catch (error) {
                console.error('Failed to load currencies:', error);
            }
        },

        async getGlAccounts() {
            try {
                const response = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=2000&isActive=true');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
                this.glAccountList = rawList;
                this.glAccountOptions = rawList.map(a => {
                    const no = a.accountNo ? `${a.accountNo} - ` : '';
                    const name = a.accountName || a.name || 'Unnamed';
                    return {
                        label: `${no}${name}`,
                        value: a.id,
                        name,
                        accountNo: a.accountNo || '',
                        currencyId: a.currencyId || ''
                    };
                });
            } catch (error) {
                console.error('Failed to load GL accounts:', error);
            }
        },

        async getBankAccounts() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetBankAccounts?pageNo=1&pageSize=2000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);

                this.bankAccountList = rawList.map(item => {
                    const bank = this.bankList.find(b => String(b.id) === String(item.bankId));
                    const branch = this.branchList.find(br => String(br.id) === String(item.bankBranchId));
                    const gl = this.glAccountList.find(g => String(g.id) === String(item.accountId));
                    const curr = this.currencyList.find(c => String(c.id) === String(item.currencyId));

                    const bankName = item.bankName || (bank ? bank.name : '');
                    const bankBranchName = item.bankBranchName || (branch ? branch.name : '');
                    const bankBranch = [bankName, bankBranchName].filter(Boolean).join(' / ') || '—';
                    const bankDisplayName = [bankName, bankBranchName].filter(Boolean).join(' • ') || 'Bank Account';
                    const currencyCode = item.currencyCode || (curr ? curr.currencyCode : '');
                    const currencyName = item.currencyName || (curr ? curr.currencyName : '');
                    const accountName = item.accountName || (gl ? gl.accountName : '') || '';
                    const accountType = item.accountType || 'Current';
                    const accountTypeCurrency = currencyCode ? `${accountType} (${currencyCode})` : accountType;
                    const contactPerson = item.contactPerson || '';
                    const contactNo = item.contactNo || '';
                    const contactDisplay = contactPerson && contactNo
                        ? `${contactPerson} (${contactNo})`
                        : (contactPerson || contactNo || '—');

                    let dateOpened = '';
                    if (item.dateOpened) {
                        const d = new Date(item.dateOpened);
                        if (!isNaN(d.getTime())) {
                            dateOpened = d.toISOString().slice(0, 10);
                        }
                    }

                    return {
                        ...item,
                        accountName,
                        name: accountName,
                        accountNo: item.accountNo ? String(item.accountNo) : '',
                        accountType,
                        accountTypeCurrency,
                        bankId: item.bankId || '',
                        bankName,
                        bankBranchId: item.bankBranchId || '',
                        bankBranchName,
                        bankBranch,
                        bankDisplayName,
                        accountId: item.accountId || '',
                        currencyId: item.currencyId || '',
                        currencyCode,
                        currencyName,
                        address: item.address || '',
                        location: item.location || '',
                        contactPerson,
                        contactNo,
                        contactDisplay,
                        chequeBookStart: item.chequeBookStart ? String(item.chequeBookStart) : '',
                        chequeBookEnd: item.chequeBookEnd ? String(item.chequeBookEnd) : '',
                        dateOpened: dateOpened || new Date().toISOString().slice(0, 10)
                    };
                });
            } catch (error) {
                console.error('Failed to load bank accounts:', error);
                this.toastHandler('error', 'Unable to load bank accounts.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD handlers wired to <data-grid> events ──────────── */

        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const bank = this.bankList.find(b => String(b.id) === String(row.bankId));
            const branch = this.branchList.find(br => String(br.id) === String(row.bankBranchId));
            const gl = this.glAccountList.find(g => String(g.id) === String(row.accountId));
            const curr = this.currencyList.find(c => String(c.id) === String(row.currencyId));

            const bankName = bank ? bank.name : (row.bankName || '');
            const bankBranchName = branch ? branch.name : (row.bankBranchName || '');
            const currencyCode = curr ? curr.currencyCode : (row.currencyCode || '');
            const currencyName = curr ? curr.currencyName : (row.currencyName || '');
            const accountName = String(row.accountName || row.name || (gl ? gl.accountName : '') || '').trim();

            let dateOpenedVal = new Date().toISOString();
            if (row.dateOpened) {
                const parsed = new Date(row.dateOpened);
                if (!isNaN(parsed.getTime())) dateOpenedVal = parsed.toISOString();
            }

            const payload = {
                accountName,
                name:            accountName,
                accountNo:       String(row.accountNo || '').trim(),
                accountType:     String(row.accountType || 'Current').trim(),
                bankId:          row.bankId,
                bankName,
                bankBranchId:    row.bankBranchId,
                bankBranchName,
                accountId:       row.accountId,
                accountHeadId:   row.accountId, // backward-compatible alias
                currencyId:      row.currencyId,
                currencyCode,
                currencyName,
                address:         String(row.address || '').trim(),
                location:        String(row.location || '').trim(),
                contactPerson:   String(row.contactPerson || '').trim(),
                contactNo:       String(row.contactNo || '').trim(),
                chequeBookStart: String(row.chequeBookStart || '').trim(),
                chequeBookEnd:   String(row.chequeBookEnd || '').trim(),
                dateOpened:      dateOpenedVal
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/CreateBankAccount', payload);
                await this.getBankAccounts();
                this.toastHandler('success', 'Bank account created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create bank account.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const existing = this.bankAccountList.find(
                d => String(d.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Bank account record was not found.');
                return;
            }

            const bankId = row.bankId || existing.bankId;
            const branchId = row.bankBranchId || existing.bankBranchId;
            const accountId = row.accountId || existing.accountId;
            const currencyId = row.currencyId || existing.currencyId;

            const bank = this.bankList.find(b => String(b.id) === String(bankId));
            const branch = this.branchList.find(br => String(br.id) === String(branchId));
            const gl = this.glAccountList.find(g => String(g.id) === String(accountId));
            const curr = this.currencyList.find(c => String(c.id) === String(currencyId));

            const bankName = bank ? bank.name : (row.bankName || existing.bankName || '');
            const bankBranchName = branch ? branch.name : (row.bankBranchName || existing.bankBranchName || '');
            const currencyCode = curr ? curr.currencyCode : (row.currencyCode || existing.currencyCode || '');
            const currencyName = curr ? curr.currencyName : (row.currencyName || existing.currencyName || '');
            const accountName = String(row.accountName || row.name || existing.accountName || '').trim();

            let dateOpenedVal = existing.dateOpened || new Date().toISOString();
            if (row.dateOpened) {
                const parsed = new Date(row.dateOpened);
                if (!isNaN(parsed.getTime())) dateOpenedVal = parsed.toISOString();
            }

            const payload = {
                ...existing,
                ...row,
                id:              existing.id,
                accountName,
                name:            accountName,
                accountNo:       String(row.accountNo || existing.accountNo || '').trim(),
                accountType:     String(row.accountType || existing.accountType || 'Current').trim(),
                bankId,
                bankName,
                bankBranchId:    branchId,
                bankBranchName,
                accountId,
                currencyId,
                currencyCode,
                currencyName,
                address:         String(row.address !== undefined ? row.address : (existing.address || '')).trim(),
                location:        String(row.location !== undefined ? row.location : (existing.location || '')).trim(),
                contactPerson:   String(row.contactPerson !== undefined ? row.contactPerson : (existing.contactPerson || '')).trim(),
                contactNo:       String(row.contactNo !== undefined ? row.contactNo : (existing.contactNo || '')).trim(),
                chequeBookStart: String(row.chequeBookStart !== undefined ? row.chequeBookStart : (existing.chequeBookStart || '')).trim(),
                chequeBookEnd:   String(row.chequeBookEnd !== undefined ? row.chequeBookEnd : (existing.chequeBookEnd || '')).trim(),
                dateOpened:      dateOpenedVal
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/UpdateBankAccount', payload);

                // Optimistically patch local list
                const idx = this.bankAccountList.findIndex(
                    d => String(d.id) === String(existing.id)
                );
                if (idx !== -1) {
                    const bankBranch = [bankName, bankBranchName].filter(Boolean).join(' / ') || '—';
                    const bankDisplayName = [bankName, bankBranchName].filter(Boolean).join(' • ') || 'Bank Account';
                    const accountTypeCurrency = currencyCode ? `${payload.accountType} (${currencyCode})` : payload.accountType;
                    const contactDisplay = payload.contactPerson && payload.contactNo
                        ? `${payload.contactPerson} (${payload.contactNo})`
                        : (payload.contactPerson || payload.contactNo || '—');
                    this.bankAccountList.splice(idx, 1, {
                        ...payload,
                        bankBranch,
                        bankDisplayName,
                        accountTypeCurrency,
                        contactDisplay,
                        dateOpened: row.dateOpened || existing.dateOpened
                    });
                }

                this.toastHandler('success', 'Bank account updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update bank account.');
                await this.getBankAccounts();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            this.isShimmerLoading = true;
            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.delete('/GeneralLedger/DeleteBankAccount?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getBankAccounts();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} bank account${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete bank account.');
                await this.getBankAccounts();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Validation ─────────────────────────────────────────── */

        validateRecord(row) {
            const accountName = row.accountName || row.name;
            if (!accountName || !String(accountName).trim()) {
                this.toastHandler('warning', 'Account name is required.');
                return false;
            }

            const accountNo = row.accountNo;
            if (!accountNo || !String(accountNo).trim()) {
                this.toastHandler('warning', 'Account number is required.');
                return false;
            }

            const bankId = row.bankId;
            if (!bankId || bankId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select a Bank.');
                return false;
            }

            const branchId = row.bankBranchId;
            if (!branchId || branchId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select a Bank Branch.');
                return false;
            }

            const accountId = row.accountId;
            if (!accountId || accountId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select a GL Account.');
                return false;
            }

            const currencyId = row.currencyId;
            if (!currencyId || currencyId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select a Currency.');
                return false;
            }

            // Cheque book range validation (if numeric)
            if (row.chequeBookStart && row.chequeBookEnd) {
                const start = parseInt(row.chequeBookStart, 10);
                const end = parseInt(row.chequeBookEnd, 10);
                if (!isNaN(start) && !isNaN(end) && start > end) {
                    this.toastHandler('warning', 'Cheque start number cannot be greater than cheque end number.');
                    return false;
                }
            }

            return true;
        },

        /* ── Form Open Hook ──────────────────────────────────────── */

        onOpenForm(event) {
            const row = event?.row;
            const bankId = row?.bankId;
            if (bankId) {
                // Seed the branch dropdown with branches for this bank
                this.filteredBranchOptions = this.branchList
                    .filter(br => String(br.bankId) === String(bankId));
            } else {
                // New record — start with empty branch list
                this.filteredBranchOptions = [];
            }
        },

        /* ── DOM Event Delegation Fallback ────────────────────────── */

        bindFormChangeListeners() {
            document.addEventListener('change', (e) => {
                const target = e.target;
                if (!target) return;

                // When bank changes
                if (target.id === 'f-bankId') {
                    const bankId = target.value;
                    const bank = this.bankList.find(b => String(b.id) === String(bankId));
                    if (bank) {
                        const branches = bank.bankBranches || bank.BankBranches || [];
                        if (branches.length > 0) {
                            const branchSelect = document.getElementById('f-bankBranchId');
                            if (branchSelect && (!branchSelect.value || branchSelect.value === this.emptyGuid)) {
                                branchSelect.value = branches[0].id;
                                branchSelect.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    }
                }

                // When branch changes
                if (target.id === 'f-bankBranchId') {
                    const branchId = target.value;
                    const branch = this.branchList.find(br => String(br.id) === String(branchId));
                    if (branch && branch.bankId) {
                        const bankSelect = document.getElementById('f-bankId');
                        if (bankSelect && String(bankSelect.value) !== String(branch.bankId)) {
                            bankSelect.value = branch.bankId;
                            bankSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                }

                // When GL account changes
                if (target.id === 'f-accountId') {
                    const accountId = target.value;
                    const gl = this.glAccountList.find(g => String(g.id) === String(accountId));
                    if (gl) {
                        const nameInput = document.getElementById('f-accountName');
                        if (nameInput && !nameInput.value) {
                            nameInput.value = gl.accountName || '';
                            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        const currSelect = document.getElementById('f-currencyId');
                        if (currSelect && gl.currencyId && (!currSelect.value || currSelect.value === this.emptyGuid)) {
                            currSelect.value = gl.currencyId;
                            currSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                }
            });
        },

        /* ── Helpers ─────────────────────────────────────────────── */

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

    async mounted() {
        await Promise.all([
            this.getBanks(),
            this.getCurrencies(),
            this.getGlAccounts()
        ]);
        await this.getBankAccounts();
        this.bindFormChangeListeners();
    }
});

app.use(DataGridPlugin);
app.mount('#app');


(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const DEMO_TENANT_ID = 'tenant-demo-001';

    function createId(prefix) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return `${prefix}-${crypto.randomUUID()}`;
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function today() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    const suppliers = [
        {
            id: 'sup-001',
            name: 'Accra Office Supplies Ltd.',
            accountNumber: 'SUP-1001',
            statusName: 'Active'
        },
        {
            id: 'sup-002',
            name: 'Reliable Transport Services',
            accountNumber: 'SUP-1002',
            statusName: 'Active'
        },
        {
            id: 'sup-003',
            name: 'Professional IT Solutions',
            accountNumber: 'SUP-1003',
            statusName: 'Active'
        },
        {
            id: 'sup-004',
            name: 'Golden Coast Enterprises',
            accountNumber: 'SUP-1004',
            statusName: 'Inactive'
        }
    ];

    const activeSuppliers = suppliers.filter(
        supplier => supplier.statusName.trim().toLowerCase() === 'active'
    );

    const currencies = [
        {
            id: 'cur-001',
            currencyName: 'Ghana Cedis',
            currencyCode: 'GHS',
            buyRate: 1,
            sellRate: 1
        },
        {
            id: 'cur-002',
            currencyName: 'US Dollar',
            currencyCode: 'USD',
            buyRate: 11.8,
            sellRate: 12.1
        },
        {
            id: 'cur-003',
            currencyName: 'Euro',
            currencyCode: 'EUR',
            buyRate: 13.2,
            sellRate: 13.6
        }
    ];

    const costCenters = [
        {
            id: 'ou-001',
            parentId: EMPTY_GUID,
            name: 'ACAD',
            tenantId: DEMO_TENANT_ID
        },
        {
            id: 'ou-002',
            parentId: 'ou-001',
            name: 'Administration',
            tenantId: DEMO_TENANT_ID
        },
        {
            id: 'ou-003',
            parentId: 'ou-001',
            name: 'Finance',
            tenantId: DEMO_TENANT_ID
        },
        {
            id: 'ou-004',
            parentId: EMPTY_GUID,
            name: 'OPS',
            tenantId: DEMO_TENANT_ID
        },
        {
            id: 'ou-005',
            parentId: 'ou-004',
            name: 'Procurement',
            tenantId: DEMO_TENANT_ID
        }
    ];

    function buildCostCenterHierarchy(items) {
        const byId = new Map(items.map(item => [item.id, item]));

        function getPath(item) {
            const names = [];
            const visited = new Set();
            let current = item;

            while (
                current &&
                current.id !== EMPTY_GUID &&
                !visited.has(current.id)
                ) {
                visited.add(current.id);
                names.unshift(current.name);

                current = byId.get(current.parentId);
            }

            return names.join('/');
        }

        return items.map(item => ({
            ...item,
            rawName: item.name,
            name: getPath(item)
        }));
    }

    const costCenterOptions = [
        {
            id: EMPTY_GUID,
            name: 'N/A - No Cost Center',
            parentId: EMPTY_GUID,
            tenantId: DEMO_TENANT_ID,
            rawName: 'N/A'
        },
        ...buildCostCenterHierarchy(costCenters)
    ];

    const openingBalanceColumns = [
        {
            key: 'id',
            label: 'ID',
            type: 'text',
            hidden: true,
            width: 74,
            help: 'Generated opening balance ID.'
        },
        {
            key: 'tenantId',
            label: 'Tenant ID',
            type: 'text',
            hidden: true,
            width: 74,
            help: 'Tenant identifier.'
        },
        {
            key: 'supplierId',
            label: 'Supplier',
            type: 'select',
            width: 250,
            required: true,
            searchable: true,
            options: activeSuppliers,
            value: 'name',
          
        },
        {
            key: 'accountNumber',
            label: 'Supplier Account',
            type: 'text',
            width: 160,
            searchable: true
        },
        {
            key: 'currencyId',
            label: 'Currency',
            type: 'select',
            width: 180,
            required: true,
            options: currencies,
            value: 'id',
            display:'currencyName'
        },
        {
            key: 'transactionDate',
            label: 'Transaction Date',
            type: 'date',
            width: 160,
            required: true,
            searchable: true
        },
        {
            key: 'amount',
            label: 'Opening Amount',
            type: 'number',
            width: 160,
            required: true
        },
        {
            key: 'paidAmount',
            label: 'Paid Amount',
            type: 'number',
            width: 140
        },
        {
            key: 'balance',
            label: 'Balance',
            type: 'number',
            width: 140
        },
        {
            key: 'buyRate',
            label: 'Exchange Rate',
            type: 'number',
            width: 140,
            required: true
        },
        {
            key: 'ouId',
            label: 'OU / Cost Center',
            type: 'select',
            width: 240,
            options: costCenterOptions,
            optionLabel: 'name',
            optionValue: 'id'
        },
        {
            key: 'isPosted',
            label: 'Posted',
            type: 'boolean',
            width: 110
        }
    ];

    function makeDemoRecords() {
        return [
            {
                id: 'ob-001',
                tenantId: DEMO_TENANT_ID,
                supplierId: 'sup-001',
                supplierName: 'Accra Office Supplies Ltd.',
                accountNumber: 'SUP-1001',
                currencyId: 'cur-001',
                currencyName: 'Ghana Cedis',
                currencyCode: 'GHS',
                buyRate: 1,
                sellRate: 1,
                transactionDate: '2026-01-01',
                amount: 12500,
                paidAmount: 2500,
                balance: 10000,
                ouId: 'ou-002',
                ouName: 'ACAD/Administration',
                isPosted: false
            },
            {
                id: 'ob-002',
                tenantId: DEMO_TENANT_ID,
                supplierId: 'sup-002',
                supplierName: 'Reliable Transport Services',
                accountNumber: 'SUP-1002',
                currencyId: 'cur-001',
                currencyName: 'Ghana Cedis',
                currencyCode: 'GHS',
                buyRate: 1,
                sellRate: 1,
                transactionDate: '2026-01-01',
                amount: 8600,
                paidAmount: 1600,
                balance: 7000,
                ouId: 'ou-005',
                ouName: 'OPS/Procurement',
                isPosted: false
            },
            {
                id: 'ob-003',
                tenantId: DEMO_TENANT_ID,
                supplierId: 'sup-003',
                supplierName: 'Professional IT Solutions',
                accountNumber: 'SUP-1003',
                currencyId: 'cur-002',
                currencyName: 'US Dollar',
                currencyCode: 'USD',
                buyRate: 11.8,
                sellRate: 12.1,
                transactionDate: '2026-01-15',
                amount: 2000,
                paidAmount: 500,
                balance: 1500,
                ouId: 'ou-003',
                ouName: 'ACAD/Finance',
                isPosted: false
            }
        ];
    }

    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                emptyGuid: EMPTY_GUID,
                tenantId: DEMO_TENANT_ID,

                supplierList: activeSuppliers,
                currencyList: currencies,
                costCenterList: costCenters,
                costCenterHierarchyList: costCenterOptions,

                openingBalanceColumns,
                openingBalanceList: makeDemoRecords()
            };
        },

        computed: {
            totalOpeningAmount() {
                return this.openingBalanceList.reduce(
                    (sum, item) => sum + this.toNumber(item.amount),
                    0
                );
            },

            totalOutstandingBalance() {
                return this.openingBalanceList.reduce(
                    (sum, item) => sum + this.toNumber(item.balance),
                    0
                );
            },

            unpostedCount() {
                return this.openingBalanceList.filter(
                    item => !item.isPosted
                ).length;
            }
        },

        methods: {
            toNumber(value) {
                const result = Number(value);
                return Number.isFinite(result) ? result : 0;
            },

            formatMoney(value) {
                return this.toNumber(value).toLocaleString('en-GH', {
                    style: 'currency',
                    currency: 'GHS',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            },

            getSupplierDetails(id) {
                return this.supplierList.find(
                    supplier => String(supplier.id) === String(id)
                );
            },

            getCurrencyDetails(id) {
                return this.currencyList.find(
                    currency => String(currency.id) === String(id)
                );
            },

            getOuDetails(id) {
                return this.costCenterHierarchyList.find(
                    item => String(item.id) === String(id)
                );
            },

            normalizeRecord(payload = {}, existing = null) {
                const supplierId = payload.supplierId ?? existing?.supplierId ?? '';
                const currencyId = payload.currencyId ?? existing?.currencyId ?? '';
                const ouId = payload.ouId ?? existing?.ouId ?? EMPTY_GUID;

                const supplier = this.getSupplierDetails(supplierId);
                const currency = this.getCurrencyDetails(currencyId);
                const ou = this.getOuDetails(ouId);

                const amount = this.toNumber(
                    payload.amount ?? existing?.amount
                );

                const paidAmount = this.toNumber(
                    payload.paidAmount ?? existing?.paidAmount
                );

                const buyRate = this.toNumber(
                    payload.buyRate ?? existing?.buyRate ?? currency?.buyRate ?? 1
                );

                return {
                    ...existing,
                    ...payload,

                    id: existing?.id || payload.id || createId('ob'),
                    tenantId: existing?.tenantId || payload.tenantId || this.tenantId,

                    supplierId,
                    supplierName: supplier?.name || payload.supplierName || existing?.supplierName || '',
                    accountNumber: supplier?.accountNumber || payload.accountNumber || existing?.accountNumber || '',

                    currencyId,
                    currencyName: currency?.currencyName || payload.currencyName || existing?.currencyName || '',
                    currencyCode: currency?.currencyCode || payload.currencyCode || existing?.currencyCode || '',
                    sellRate: this.toNumber(
                        currency?.sellRate ?? payload.sellRate ?? existing?.sellRate ?? buyRate
                    ),
                    buyRate,

                    transactionDate: payload.transactionDate || existing?.transactionDate || today(),

                    amount,
                    paidAmount,
                    balance: Number((amount - paidAmount).toFixed(2)),

                    ouId: ouId || EMPTY_GUID,
                    ouName: ou && ou.id !== EMPTY_GUID
                        ? ou.name
                        : 'N/A',

                    isPosted: Boolean(payload.isPosted ?? existing?.isPosted ?? false)
                };
            },

            notify(message, type = 'success') {
                if (typeof Swal === 'undefined') {
                    console.log(`${type}: ${message}`);
                    return;
                }

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type,
                    title: message,
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            },

            onCreate(payload = {}) {
                const record = this.normalizeRecord({
                    ...payload,
                    id: payload.id || createId('ob'),
                    tenantId: payload.tenantId || this.tenantId
                });

                this.openingBalanceList.unshift(record);
                this.notify('Opening balance added to the demo list.');
            },

            onUpdate(payload = {}) {
                const index = this.openingBalanceList.findIndex(
                    item => String(item.id) === String(payload.id)
                );

                if (index === -1) {
                    this.notify('Opening balance not found.', 'error');
                    return;
                }

                const existing = this.openingBalanceList[index];

                const updated = this.normalizeRecord(payload, existing);

                this.openingBalanceList.splice(index, 1, updated);
                this.notify('Opening balance updated in the demo list.');
            },

            async onDelete(payload) {
                const id = typeof payload === 'object' && payload !== null
                    ? payload.id
                    : payload;

                const record = this.openingBalanceList.find(
                    item => String(item.id) === String(id)
                );

                if (!record) {
                    this.notify('Opening balance not found.', 'error');
                    return;
                }

                if (record.isPosted) {
                    this.notify(
                        'Posted opening balances cannot be deleted in this demo.',
                        'warning'
                    );
                    return;
                }

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        title: 'Delete opening balance?',
                        text: `Remove the opening balance for ${record.supplierName || 'this supplier'}?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#dc2626',
                        reverseButtons: true
                    });

                    if (!result.isConfirmed) {
                        return;
                    }
                } else if (!confirm('Delete this opening balance?')) {
                    return;
                }

                this.openingBalanceList = this.openingBalanceList.filter(
                    item => String(item.id) !== String(id)
                );

                this.notify('Opening balance removed from the demo list.');
            },

            resetDemoData() {
                const reset = () => {
                    this.openingBalanceList = makeDemoRecords();
                    this.notify('Demo opening balances have been reset.');
                };

                if (typeof Swal === 'undefined') {
                    reset();
                    return;
                }

                Swal.fire({
                    title: 'Reset demo data?',
                    text: 'Your current local changes will be replaced by the sample records.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Reset data',
                    cancelButtonText: 'Keep current data',
                    confirmButtonColor: '#0645e7'
                }).then(result => {
                    if (result.isConfirmed) {
                        reset();
                    }
                });
            }
        }
    });

   
        app.use(DataGridPlugin);
    app.mount('#app');
})();

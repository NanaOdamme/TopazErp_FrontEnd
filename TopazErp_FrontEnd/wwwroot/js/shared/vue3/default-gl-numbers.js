const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            coaList: [],                         // Chart of Account Details list
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            // Existing record identifiers (set when a saved config is loaded)
            existingId: null,
            existingTenantId: null,

            // ── Reactive form object — every key maps 1-to-1 to a backend field ──
            form: {
                // Banking
                accountPayablesBankAccountId:               '',
                payRollBankAccountId:                       '',
                accountsReceivableBankAccountId:            '',
                salesBankAccountId:                         '',
                purchasesBankAccountId:                     '',

                // Payables & Receivables
                accountsReceivableAccountId:                '',
                accountsPayableAccountId:                   '',
                withholdingTaxAccountId:                    '',
                creditPurchasesAccountId:                   '',
                advanceFromCustomerAccountId:               '',
                advanceToSupplierAccountId:                 '',
                imprestCategoryId:                          '',
                imprestGlAccountId:                         '',

                // Tax
                vatReceivedAccountId:                       '',
                vatPaidAccountId:                           '',
                vatRate:                                    0,
                getflReceivedAccountId:                     '',
                getflPaidAccountId:                         '',
                nhilReceivedAccountId:                      '',
                nhilPaidAccountId:                          '',
                covidTaxRecievedAccountId:                  '',
                covidTaxPaidAccountId:                      '',
                communicationsServiceTaxReceivedAccountId:  '',
                communicationsServiceTaxPaidAccountId:      '',

                // Inventory & Revenue
                inventoryAccountId:                         '',
                salesRevenueAccountId:                      '',
                stockPurchasesAccountId:                    '',
                goodsInTransitAccountId:                    '',

                // FX & Earnings
                currentEarningsAccountId:                   '',
                retainedEarningsAccountId:                  '',
                unrealizedFxLossAccountId:                  '',
                unrealizedFxGainAccountId:                  '',
                realizedFxLossAccountId:                    '',
                realizedFxGainAccountId:                    '',

                // Social Security
                socialSecurityFundEmployerRate:             0,
                socialSecurityFundEmployeeRate:             0,
                socialSecurityEmployerPortionDefaultExpenseGl:   '',
                socialSecurityEmployeePortionDefaultExpenseGl:   '',
                socialSecurityEmployerPortionDefaultLiabilityGl: '',
                socialSecurityEmployeePortionDefaultLiabilityGl: ''
            },

            // ── Field group definitions (drives the template) ──────────────────

            bankingFields: [
                { key: 'accountPayablesBankAccountId',    label: 'A/P Bank Account'     },
                { key: 'payRollBankAccountId',            label: 'Payroll Bank Account'  },
                { key: 'accountsReceivableBankAccountId', label: 'A/R Bank Account'      },
                { key: 'salesBankAccountId',              label: 'Sales Bank Account'    },
                { key: 'purchasesBankAccountId',          label: 'Purchases Bank'        }
            ],

            apArFields: [
                { key: 'accountsReceivableAccountId',  label: 'Accounts Receivable'    },
                { key: 'accountsPayableAccountId',     label: 'Accounts Payable'       },
                { key: 'withholdingTaxAccountId',      label: 'Withholding Tax'        },
                { key: 'creditPurchasesAccountId',     label: 'Credit Purchases'       },
                { key: 'advanceFromCustomerAccountId', label: 'Advance From Customer'  },
                { key: 'advanceToSupplierAccountId',   label: 'Advance to Supplier'    },
                { key: 'imprestCategoryId',            label: 'Imprest Category'       },
                { key: 'imprestGlAccountId',           label: 'Imprest GL #'           }
            ],

            taxFields: [
                { key: 'vatReceivedAccountId',                      label: 'VAT Received'                       },
                { key: 'vatPaidAccountId',                          label: 'VAT Paid'                           },
                { key: 'vatRate',                                   label: 'VAT Rate (%)',  type: 'number'       },
                { key: 'getflReceivedAccountId',                    label: 'GETFL Received'                     },
                { key: 'getflPaidAccountId',                        label: 'GETFL Paid'                         },
                { key: 'nhilReceivedAccountId',                     label: 'NHIL Received'                      },
                { key: 'nhilPaidAccountId',                         label: 'NHIL Paid'                          },
                { key: 'covidTaxRecievedAccountId',                 label: 'COVID Tax Received'                 },
                { key: 'covidTaxPaidAccountId',                     label: 'COVID Tax Paid'                     },
                { key: 'communicationsServiceTaxReceivedAccountId', label: 'Comms Service Tax Received'         },
                { key: 'communicationsServiceTaxPaidAccountId',     label: 'Comms Service Tax Paid'             }
            ],

            inventoryFields: [
                { key: 'inventoryAccountId',     label: 'Inventory'         },
                { key: 'salesRevenueAccountId',  label: 'Sales (Revenue)'   },
                { key: 'stockPurchasesAccountId',label: 'Stock Purchases'   },
                { key: 'goodsInTransitAccountId',label: 'Goods in Transit'  }
            ],

            fxFields: [
                { key: 'currentEarningsAccountId',   label: 'Current Earnings'    },
                { key: 'retainedEarningsAccountId',  label: 'Retained Earnings'   },
                { key: 'unrealizedFxLossAccountId',  label: 'Unrealized FX Loss'  },
                { key: 'unrealizedFxGainAccountId',  label: 'Unrealized FX Gain'  },
                { key: 'realizedFxLossAccountId',    label: 'Realized FX Loss'    },
                { key: 'realizedFxGainAccountId',    label: 'Realized FX Gain'    }
            ],

            ssfFields: [
                { key: 'socialSecurityFundEmployerRate',             label: "Employer SSF Rate (%)",      type: 'number' },
                { key: 'socialSecurityFundEmployeeRate',             label: "Employee SSF Rate (%)",      type: 'number' },
                { key: 'socialSecurityEmployerPortionDefaultExpenseGl',   label: 'Employer SSF Expense GL'   },
                { key: 'socialSecurityEmployeePortionDefaultExpenseGl',   label: 'Employee SSF Expense GL'   },
                { key: 'socialSecurityEmployerPortionDefaultLiabilityGl', label: 'Employer SSF Liability GL' },
                { key: 'socialSecurityEmployeePortionDefaultLiabilityGl', label: 'Employee SSF Liability GL' }
            ]
        };
    },

    methods: {

        /* ── Data Fetch ──────────────────────────────────────────────── */

        async getCoaDetails() {
            try {
                const res = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5000&isActive=true');
                const raw = res.data?.result?.data || res.data?.result || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                this.coaList = raw;
            } catch (err) {
                console.error('Failed to load CoA details:', err);
                this.toastHandler('error', 'Unable to load Chart of Accounts.');
            }
        },

        async getDefaultGlSetup() {
            try {
                const res = await axios.get('/GeneralLedger/GetDefaultGlNumbersSetup');
                let d = res.data?.result || res.data?.Result || res.data;
                if (Array.isArray(d)) d = d[0];
                if (!d) return;

                this.existingId       = d.id || d.Id || null;
                this.existingTenantId = d.tenantId || d.TenantId || null;

                // Map every backend field directly into the form object
                const guidKeys = Object.keys(this.form).filter(k => k.endsWith('Id') || k.endsWith('Gl'));
                guidKeys.forEach(k => {
                    const pascalKey = k.charAt(0).toUpperCase() + k.slice(1);
                    const val = d[k] !== undefined ? d[k] : d[pascalKey];
                    // Treat empty guid as unselected
                    this.form[k] = (val && val !== this.emptyGuid) ? val : '';
                });

                // Numeric fields
                const vatRate = d.vatRate !== undefined ? d.vatRate : d.VatRate;
                if (vatRate !== undefined && vatRate !== null) this.form.vatRate = vatRate;

                const ssfEmployer = d.socialSecurityFundEmployerRate !== undefined ? d.socialSecurityFundEmployerRate : d.SocialSecurityFundEmployerRate;
                if (ssfEmployer !== undefined && ssfEmployer !== null) this.form.socialSecurityFundEmployerRate = ssfEmployer;

                const ssfEmployee = d.socialSecurityFundEmployeeRate !== undefined ? d.socialSecurityFundEmployeeRate : d.SocialSecurityFundEmployeeRate;
                if (ssfEmployee !== undefined && ssfEmployee !== null) this.form.socialSecurityFundEmployeeRate = ssfEmployee;

                // Backend uses covidTaxReceivedAccountId (no typo) — handle both spellings
                const covidRec = d.covidTaxReceivedAccountId || d.CovidTaxReceivedAccountId || d.covidTaxRecievedAccountId || d.CovidTaxRecievedAccountId;
                if (covidRec && covidRec !== this.emptyGuid) {
                    this.form.covidTaxRecievedAccountId = covidRec;
                }

            } catch (err) {
                console.error('Failed to load default GL setup:', err);
                this.toastHandler('error', 'Unable to load default GL numbers.');
            }
        },

        async getBusinessProfile() {
            try {
                const res = await axios.get('/SharedResource/GetBusinessProfile');
                const bp  = res.data;
                if (!bp) return;
                if (bp.socialSecurityFundEmployerRate !== undefined)
                    this.form.socialSecurityFundEmployerRate = bp.socialSecurityFundEmployerRate;
                if (bp.socialSecurityFundEmployeeRate !== undefined)
                    this.form.socialSecurityFundEmployeeRate = bp.socialSecurityFundEmployeeRate;
            } catch (err) {
                console.error('Failed to load business profile:', err);
            }
        },

        /* ── Save ────────────────────────────────────────────────────── */

        async saveDefaultGlNumbers() {
            this.isLoading = true;
            try {
                // Build payload — replace empty strings with emptyGuid for Guid fields
                const payload = {};
                Object.entries(this.form).forEach(([k, v]) => {
                    if (typeof v === 'number') {
                        payload[k] = v;
                    } else {
                        payload[k] = (v && typeof v === 'string' && v.trim()) ? v : this.emptyGuid;
                    }
                });

                // Map our internal typo key back to the canonical backend key
                payload.covidTaxReceivedAccountId = payload.covidTaxRecievedAccountId;
                delete payload.covidTaxRecievedAccountId;

                const isUpdate = !!this.existingId;
                if (isUpdate) {
                    payload.id       = this.existingId;
                    payload.tenantId = this.existingTenantId;
                }

                const endpoint = isUpdate
                    ? '/GeneralLedger/UpdateDefaultGlNumbers'
                    : '/GeneralLedger/CreateDefaultGlNumbers';

                const res = await axios.post(endpoint, payload);

                if (res.data && res.data.success === false) {
                    const errMsg = res.data.error?.message || res.data.error?.details || 'Unable to save Default GL numbers.';
                    this.toastHandler('error', errMsg);
                    return;
                }

                this.toastHandler('success', `Default GL Numbers ${isUpdate ? 'updated' : 'saved'} successfully.`);

                // Re-fetch to capture the assigned id or latest values
                await this.getDefaultGlSetup();

            } catch (err) {
                console.error('Failed to save default GL numbers:', err);
                const errMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Unable to save Default GL numbers.';
                this.toastHandler('error', errMsg);
            } finally {
                this.isLoading = false;
            }
        },

        /* ── Helpers ─────────────────────────────────────────────────── */

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
        this.isShimmerLoading = true;
        try {
            // Load CoA list and existing setup in parallel
            await Promise.all([
                this.getCoaDetails(),
                this.getDefaultGlSetup(),
                this.getBusinessProfile()
            ]);
        } finally {
            this.isShimmerLoading = false;
        }
    }
});

app.mount('#app');
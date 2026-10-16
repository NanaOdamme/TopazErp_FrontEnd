
(() => {
    'use strict';

    const makeId = (prefix) => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return `${prefix}-${crypto.randomUUID()}`;
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };
    const today = moment().format("YYYY-MM-DD");
    const tenantId = 'tenant-demo-001';

    const customers = [
        { id: 'b43c9c10-31a2-4d87-8e56-8bc3d94d1021', name: 'Accra Office Supplies Ltd.', accountNumber:'123eee' },
        { id: 'sup-002', name: 'Reliable Transport Services', accountNumber:'123hte' },
        { id: 'e62f4c13-6a15-4b28-8a51-6db2f9e41004', name: 'Professional IT Solutions',accountNumber:'123e74ghe' },
        { id: 'sup-004', name: 'Golden Coast Enterprises' }
    ];
    const payments =[
  {
    "customerId": "b43c9c10-31a2-4d87-8e56-8bc3d94d1021",
    "customerName": "Accra Office Supplies Ltd.",
    "accountNumber": "ACC00000484",
    "ouId": "ou-002",
    "ouName": "SISCO/Academic",
    "batchNumber": "AP-PAY1029",
    "referenceNumber": "0455",
    "invoiceTypeId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "invoiceTypeName": "Ghana Cedi",
    "amountToPay": 4500,
    "paymentDate": "2026-10-13T00:00:00",
    "outstandingCreditMemo": 0,
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "isMultiCurrency": false,
    "modeOfPayment": "Bank Transfer",
    "chequeNumber": "",
    "minorName": "Pesewas",
    "buyRate": 1,
    "sellRate": 1,
    "bankAccountId": "6d1afd98-c5dc-4d99-9775-254692097265",
    "bankAccountName": "12701003 - FBN Bank GHC",
    "bankAccountNumber": "12701003",
    "isAutomatic": true,
    "isPosted": true,
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "bankId": "ou-001",
    "bankName": "Absa Bank Ghana Ltd.",
    "bankBranchId": "ou-001",
    "bankBranch": "Dansoman",
    "tenantId": 2,
    "invoiceList": [
      {
        "customerId": "b43c9c10-31a2-4d87-8e56-8bc3d94d1021",
        "customerName": "Accra Office Supplies Ltd.",
        "accountNumber": "ACC00000484",
        "batchNumber": "AP1872",
        "invoiceNumber": "INV/10146AP",
        "invoiceDate": "2026-10-10T00:00:00",
        "projectedPayDate": "2026-11-09T00:00:00",
        "balance": 5750,
        "purchaseOrderNumber": "45335",
        "voucherNumber": "34546",
        "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
        "liabilityAccountName": "21100001 - Trade Creditors",
        "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
        "currencyName": "Ghana Cedi",
        "currencyCode": "GHC",
        "minorName": "Pesewas",
        "isMultiCurrency": false,
        "sendEmail": false,
        "sendSms": false,
        "buyRate": 1,
        "sellRate": 1,
        "totalInvoiceAmount": 5750,
        "vatWithHeld": false,
        "vatId": "00000000-0000-0000-0000-000000000000",
        "vatName": null,
        "newVateRate": 0,
        "vatRate": 15,
        "vatIsApplied": true,
        "vatAmount": 750,
        "paidAmount": 0,
        "withheldAmount": 0,
        "ouId": "ou-002",
        "ouName": "SISCO/Academic",
        "isCanceled": false,
        "canceledBy": null,
        "canceledDate": null,
        "isPosted": true,
        "accountingPeriod": "not set",
        "status": 0,
        "isApproved": true,
        "invoiceTaxLevies": [
          {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "GETFL",
            "amount": 125,
            "rate": 2.5,
            "isApplied": true
          },
          {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "NHIL",
            "amount": 125,
            "rate": 2.5,
            "isApplied": true
          },
          {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "VAT",
            "amount": 750,
            "rate": 15,
            "isApplied": true
          }
        ],
        "invoiceDetails": [
          {
            "id": "c25b3e15-04ef-4e1a-b6b7-43f63e2f1001",
            "referenceNumber": "PO45335",
            "description": "Printer paper and stationery",
            "quantity": 10,
            "amount": 0,
            "unitPrice": 500,
            "subTotal": 5000,
            "discountAsPercentage": false,
            "discount": 0,
            "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
            "debitAccountName": "61000006 - Office Supplies"
          }
        ],
        "tenantId": 2,
        "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310001"
      }
    ]
  },
  {
    "customerId": "e62f4c13-6a15-4b28-8a51-6db2f9e41004",
    "customerName": "Professional IT Solutions",
    "accountNumber": "ACC00000486",
    "ouId": "ou-001",
    "ouName": "SISCO/Academic",
    "batchNumber": "AP-PAY1030",
    "referenceNumber": "0456",
    "invoiceTypeId": "5cbbf656-3a11-4716-9b3d-7f9d96cddfb8",
    "invoiceTypeName": "US Dollar",
    "amountToPay": 300,
    "paymentDate": "2026-10-12T00:00:00",
    "outstandingCreditMemo": 0,
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "isMultiCurrency": true,
    "modeOfPayment": "Cheque",
    "chequeNumber": "5002",
    "minorName": "Pesewas",
    "buyRate": 1,
    "sellRate": 1.0009,
    "bankAccountId": "gl-002",
    "bankAccountName": "12701003 - FBN Bank GHC",
    "bankAccountNumber": "12701003",
    "isAutomatic": false,
    "isPosted": false,
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "bankId": "ou-001",
    "bankName": "Absa Bank Ghana Ltd.",
    "bankBranchId": "ou-001",
    "bankBranch": "Dansoman",
    "tenantId": 2,
    "invoiceList": [
      {
        "customerId": "e62f4c13-6a15-4b28-8a51-6db2f9e41004",
        "customerName": "Professional IT Solutions",
        "accountNumber": "ACC00000486",
        "batchNumber": "AP1874",
        "invoiceNumber": "INV/10148AP",
        "invoiceDate": "2026-10-05T00:00:00",
        "projectedPayDate": "2026-11-04T00:00:00",
        "balance": 15300,
        "purchaseOrderNumber": "45337",
        "voucherNumber": "34548",
        "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
        "liabilityAccountName": "21100001 - Trade Creditors",
        "currencyId": "5cbbf656-3a11-4716-9b3d-7f9d96cddfb8",
        "currencyName": "US Dollar",
        "currencyCode": "USD",
        "minorName": "Cents",
        "isMultiCurrency": true,
        "sendEmail": true,
        "sendSms": false,
        "buyRate": 11.8,
        "sellRate": 12.1,
        "totalInvoiceAmount": 15300,
        "vatWithHeld": false,
        "vatId": "00000000-0000-0000-0000-000000000000",
        "vatName": null,
        "newVateRate": 0,
        "vatRate": 15,
        "vatIsApplied": true,
        "vatAmount": 1800,
        "paidAmount": 0,
        "withheldAmount": 0,
        "ouId": "ou-001",
        "ouName": "SISCO/Academic",
        "isCanceled": false,
        "canceledBy": null,
        "canceledDate": null,
        "isPosted": true,
        "accountingPeriod": "not set",
        "status": 0,
        "isApproved": true,
        "invoiceTaxLevies": [
          {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "GETFL",
            "amount": 300,
            "rate": 2.5,
            "isApplied": true
          },
          {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "NHIL",
            "amount": 300,
            "rate": 2.5,
            "isApplied": true
          },
          {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "VAT",
            "amount": 1800,
            "rate": 15,
            "isApplied": true
          }
        ],
        "invoiceDetails": [
          {
            "id": "e35e6c9a-7d20-4e10-9e5c-3a3e7e5b1001",
            "referenceNumber": "PO45337",
            "description": "Software licences and IT support",
            "quantity": 1,
            "amount": 0,
            "unitPrice": 12000,
            "subTotal": 12000,
            "discountAsPercentage": false,
            "discount": 0,
            "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
            "debitAccountName": "61000012 - Software and Licences"
          }
        ],
        "tenantId": 2,
        "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310003"
      }
    ]
  }
];
    const bankAccounts = [
        { id: 'bank-001', name: 'GCB Bank - Operating Account' },
        { id: 'bank-002', name: 'Ecobank - Corporate Account' },
        { id: 'bank-003', name: 'Absa Bank - Payments Account' }
    ];

    const currencies = [
        { id: '5e78d12e-336e-4541-963c-dfe20255ab60', name: 'GHS - Ghana Cedi', code: 'GHS', buyRate: 1 },
        { id: 'cur-002', name: 'USD - US Dollar', code: 'USD', buyRate: 11},
        { id: 'cur-003', name: 'EUR - Euro', code: 'EUR', buyRate: 14}
    ];

    const paymentMethods = [
        { id: 'method-001', name: 'Bank Transfer' },
        { id: 'method-002', name: 'Cheque' },
        { id: 'method-003', name: 'Mobile Money' },
        { id: 'method-004', name: 'Cash' }
    ];

    const organizationalUnits = [
        { id: 'ou-001', name: 'ACAD - Administration' },
        { id: 'ou-002', name: 'FIN - Finance Department' },
        { id: 'ou-003', name: 'OPS - Operations' }
    ];

    const ledgerAccounts = [
        { id: '6d1afd98-c5dc-4d99-9775-254692097265', accountIdentifier: '1010 - Cash at Bank' },
        { id: 'gl-002', accountIdentifier: '2010 - Accounts Payable' },
        { id: 'gl-003', accountIdentifier: '5010 - Office Supplies Expense' },
        { id: 'gl-004', accountIdentifier: '5020 - Transport Expense' },
        { id: 'gl-005', accountIdentifier: '5030 - IT Services Expense' }
    ];

    const invoices = [
  {
    "customerId": "sup-002",
    "customerName": "Reliable Transport Services",
    "accountNumber": "ACC00000483",
    "batchNumber": "AP1871",
    "invoiceNumber": "INV/10145AP",
    "invoiceDate": "2026-10-13T00:00:00",
    "projectedPayDate": "2026-11-12T00:00:00",
    "balance": 12000,
    "purchaseOrderNumber": "45334",
    "voucherNumber": "34545",
    "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
    "liabilityAccountName": "21100001 - Trade Creditors",
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "minorName": "Pesewas",
    "isMultiCurrency": false,
    "sendEmail": false,
    "sendSms": false,
    "buyRate": 1,
    "sellRate": 1.0009,
    "totalInvoiceAmount": 12000,
    "vatWithHeld": false,
    "vatId": "00000000-0000-0000-0000-000000000000",
    "vatName": null,
    "newVateRate": 0,
    "vatRate": 15,
    "vatIsApplied": false,
    "vatAmount": 1500,
    "paidAmount": 0,
    "withheldAmount": 0,
    "ouId": "011d4f5e-2b36-4c7e-a1f6-64cb9cf7d3bc",
    "ouName": "SISCO/Academic",
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "isPosted": true,
    "accountingPeriod": "not set",
    "status": 0,
    "isApproved": false,
    "invoiceTaxLevies": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "GETFL",
        "amount": 250,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "NHIL",
        "amount": 250,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "VAT",
        "amount": 1500,
        "rate": 15,
        "isApplied": true
      }
    ],
    "invoiceDetails": [
      {
        "id": "5b951930-0b70-4432-a4f9-548182736f7b",
        "referenceNumber": "34254",
        "description": "Office equipment and supplies",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 10000,
        "subTotal": 10000,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
        "debitAccountName": "61000006 - Electricity"
      },
      {
        "id": "387dc3d2-648e-414b-9715-3e8ad6a7de94",
        "referenceNumber": "34254",
        "description": "GETFL",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 250,
        "subTotal": 250,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "49824ae4-54de-4868-8e79-1d6914549dfe",
        "debitAccountName": "21100009 - VAT Payable"
      },
      {
        "id": "9c4880b7-5360-4107-99a0-356e50b4f6a2",
        "referenceNumber": "34254",
        "description": "NHIL",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 250,
        "subTotal": 250,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "49824ae4-54de-4868-8e79-1d6914549dfe",
        "debitAccountName": "21100009 - VAT Payable"
      },
      {
        "id": "3645e88e-8f7d-43ca-9096-e5576537a9c3",
        "referenceNumber": "34254",
        "description": "VAT",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 1500,
        "subTotal": 1500,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "49824ae4-54de-4868-8e79-1d6914549dfe",
        "debitAccountName": "21100009 - VAT Payable"
      }
    ],
    "tenantId": 2,
    "id": "91fab088-28d2-4c7e-bd6b-9546f53764c7"
  },
  {
    "customerId": "b43c9c10-31a2-4d87-8e56-8bc3d94d1021",
    "customerName": "Accra Office Supplies Ltd.",
    "accountNumber": "ACC00000484",
    "batchNumber": "AP1872",
    "invoiceNumber": "INV/10146AP",
    "invoiceDate": "2026-10-10T00:00:00",
    "projectedPayDate": "2026-11-09T00:00:00",
    "balance": 5750,
    "purchaseOrderNumber": "45335",
    "voucherNumber": "34546",
    "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
    "liabilityAccountName": "21100001 - Trade Creditors",
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "minorName": "Pesewas",
    "isMultiCurrency": false,
    "sendEmail": false,
    "sendSms": false,
    "buyRate": 1,
    "sellRate": 1,
    "totalInvoiceAmount": 6250,
    "vatWithHeld": false,
    "vatId": "00000000-0000-0000-0000-000000000000",
    "vatName": null,
    "newVateRate": 0,
    "vatRate": 15,
    "vatIsApplied": true,
    "vatAmount": 750,
    "paidAmount": 500,
    "withheldAmount": 0,
    "ouId": "011d4f5e-2b36-4c7e-a1f6-64cb9cf7d3bc",
    "ouName": "SISCO/Academic",
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "isPosted": true,
    "accountingPeriod": "not set",
    "status": 1,
    "isApproved": true,
    "invoiceTaxLevies": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "GETFL",
        "amount": 125,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "NHIL",
        "amount": 125,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "VAT",
        "amount": 750,
        "rate": 15,
        "isApplied": true
      }
    ],
    "invoiceDetails": [
      {
        "id": "c25b3e15-04ef-4e1a-b6b7-43f63e2f1001",
        "referenceNumber": "PO45335",
        "description": "Printer paper and stationery",
        "quantity": 10,
        "amount": 0,
        "unitPrice": 500,
        "subTotal": 5000,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
        "debitAccountName": "61000006 - Office Supplies"
      },
      {
        "id": "c25b3e15-04ef-4e1a-b6b7-43f63e2f1002",
        "referenceNumber": "PO45335",
        "description": "GETFL",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 125,
        "subTotal": 125,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "49824ae4-54de-4868-8e79-1d6914549dfe",
        "debitAccountName": "21100009 - VAT Payable"
      },
      {
        "id": "c25b3e15-04ef-4e1a-b6b7-43f63e2f1003",
        "referenceNumber": "PO45335",
        "description": "NHIL",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 125,
        "subTotal": 125,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "49824ae4-54de-4868-8e79-1d6914549dfe",
        "debitAccountName": "21100009 - VAT Payable"
      },
      {
        "id": "c25b3e15-04ef-4e1a-b6b7-43f63e2f1004",
        "referenceNumber": "PO45335",
        "description": "VAT",
        "quantity": 1,
        "amount": 0,
        "unitPrice": 750,
        "subTotal": 750,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "49824ae4-54de-4868-8e79-1d6914549dfe",
        "debitAccountName": "21100009 - VAT Payable"
      }
    ],
    "tenantId": 2,
    "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310001"
  },
  {
    "customerId": "sup-002",
    "customerName": "Reliable Transport Services",
    "accountNumber": "ACC00000485",
    "batchNumber": "AP1873",
    "invoiceNumber": "INV/10147AP",
    "invoiceDate": "2026-10-08T00:00:00",
    "projectedPayDate": "2026-11-07T00:00:00",
    "balance": 8400,
    "purchaseOrderNumber": "45336",
    "voucherNumber": "34547",
    "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
    "liabilityAccountName": "21100001 - Trade Creditors",
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "minorName": "Pesewas",
    "isMultiCurrency": false,
    "sendEmail": false,
    "sendSms": false,
    "buyRate": 1,
    "sellRate": 1,
    "totalInvoiceAmount": 8400,
    "vatWithHeld": false,
    "vatId": "00000000-0000-0000-0000-000000000000",
    "vatName": null,
    "newVateRate": 0,
    "vatRate": 15,
    "vatIsApplied": false,
    "vatAmount": 0,
    "paidAmount": 0,
    "withheldAmount": 0,
    "ouId": "011d4f5e-2b36-4c7e-a1f6-64cb9cf7d3bc",
    "ouName": "SISCO/Academic",
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "isPosted": true,
    "accountingPeriod": "not set",
    "status": 0,
    "isApproved": false,
    "invoiceTaxLevies": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "GETFL",
        "amount": 0,
        "rate": 2.5,
        "isApplied": false
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "NHIL",
        "amount": 0,
        "rate": 2.5,
        "isApplied": false
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "VAT",
        "amount": 0,
        "rate": 15,
        "isApplied": false
      }
    ],
    "invoiceDetails": [
      {
        "id": "d35e6c9a-7d20-4e10-9e5c-3a3e7e5b1001",
        "referenceNumber": "PO45336",
        "description": "Vehicle maintenance and repairs",
        "quantity": 2,
        "amount": 0,
        "unitPrice": 4200,
        "subTotal": 8400,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
        "debitAccountName": "61000008 - Transport and Repairs"
      }
    ],
    "tenantId": 2,
    "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310002"
  },
  {
    "customerId": "e62f4c13-6a15-4b28-8a51-6db2f9e41004",
    "customerName": "Professional IT Solutions",
    "accountNumber": "ACC00000486",
    "batchNumber": "AP1874",
    "invoiceNumber": "INV/10148AP",
    "invoiceDate": "2026-10-05T00:00:00",
    "projectedPayDate": "2026-11-04T00:00:00",
    "balance": 15300,
    "purchaseOrderNumber": "45337",
    "voucherNumber": "34548",
    "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
    "liabilityAccountName": "21100001 - Trade Creditors",
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "minorName": "Pesewas",
    "isMultiCurrency": false,
    "sendEmail": true,
    "sendSms": false,
    "buyRate": 1,
    "sellRate": 1,
    "totalInvoiceAmount": 15300,
    "vatWithHeld": false,
    "vatId": "00000000-0000-0000-0000-000000000000",
    "vatName": null,
    "newVateRate": 0,
    "vatRate": 15,
    "vatIsApplied": true,
    "vatAmount": 1800,
    "paidAmount": 0,
    "withheldAmount": 0,
    "ouId": "011d4f5e-2b36-4c7e-a1f6-64cb9cf7d3bc",
    "ouName": "SISCO/Academic",
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "isPosted": true,
    "accountingPeriod": "not set",
    "status": 0,
    "isApproved": true,
    "invoiceTaxLevies": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "GETFL",
        "amount": 300,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "NHIL",
        "amount": 300,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "VAT",
        "amount": 1800,
        "rate": 15,
        "isApplied": true
      }
    ],
    "invoiceDetails": [
      {
        "id": "e35e6c9a-7d20-4e10-9e5c-3a3e7e5b1001",
        "referenceNumber": "PO45337",
        "description": "Annual software licences",
        "quantity": 3,
        "amount": 0,
        "unitPrice": 10000,
        "subTotal": 30000,
        "discountAsPercentage": true,
        "discount": 50,
        "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
        "debitAccountName": "61000012 - Software and Licences"
      }
    ],
    "tenantId": 2,
    "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310003"
  },
  {
    "customerId": "sup-002",
    "customerName": "Reliable Transport Services",
    "accountNumber": "ACC00000487",
    "batchNumber": "AP1875",
    "invoiceNumber": "INV/10149AP",
    "invoiceDate": "2026-09-29T00:00:00",
    "projectedPayDate": "2026-10-29T00:00:00",
    "balance": 3200,
    "purchaseOrderNumber": "45338",
    "voucherNumber": "34549",
    "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
    "liabilityAccountName": "21100001 - Trade Creditors",
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "minorName": "Pesewas",
    "isMultiCurrency": false,
    "sendEmail": false,
    "sendSms": true,
    "buyRate": 1,
    "sellRate": 1,
    "totalInvoiceAmount": 4200,
    "vatWithHeld": true,
    "vatId": "00000000-0000-0000-0000-000000000000",
    "vatName": "VAT Withholding",
    "newVateRate": 0,
    "vatRate": 15,
    "vatIsApplied": true,
    "vatAmount": 600,
    "paidAmount": 1000,
    "withheldAmount": 0,
    "ouId": "011d4f5e-2b36-4c7e-a1f6-64cb9cf7d3bc",
    "ouName": "SISCO/Academic",
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "isPosted": true,
    "accountingPeriod": "not set",
    "status": 1,
    "isApproved": false,
    "invoiceTaxLevies": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "GETFL",
        "amount": 100,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "NHIL",
        "amount": 100,
        "rate": 2.5,
        "isApplied": true
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "VAT",
        "amount": 600,
        "rate": 15,
        "isApplied": true
      }
    ],
    "invoiceDetails": [
      {
        "id": "f35e6c9a-7d20-4e10-9e5c-3a3e7e5b1001",
        "referenceNumber": "PO45338",
        "description": "Cleaning and janitorial supplies",
        "quantity": 4,
        "amount": 0,
        "unitPrice": 1000,
        "subTotal": 4000,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
        "debitAccountName": "61000010 - Cleaning Expenses"
      }
    ],
    "tenantId": 2,
    "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310004"
  },
  {
    "customerId": "a82b3d44-5f16-4c91-8e73-9bd4c6e61006",
    "customerName": "Accra Electricals and Engineering",
    "accountNumber": "ACC00000488",
    "batchNumber": "AP1876",
    "invoiceNumber": "INV/10150AP",
    "invoiceDate": "2026-09-25T00:00:00",
    "projectedPayDate": "2026-10-25T00:00:00",
    "balance": 9800,
    "purchaseOrderNumber": "45339",
    "voucherNumber": "34550",
    "liabilityAccountId": "8307c57f-a42e-47be-95e7-f25661049482",
    "liabilityAccountName": "21100001 - Trade Creditors",
    "currencyId": "5e78d12e-336e-4541-963c-dfe20255ab60",
    "currencyName": "Ghana Cedi",
    "currencyCode": "GHC",
    "minorName": "Pesewas",
    "isMultiCurrency": false,
    "sendEmail": false,
    "sendSms": false,
    "buyRate": 1,
    "sellRate": 1,
    "totalInvoiceAmount": 9800,
    "vatWithHeld": false,
    "vatId": "00000000-0000-0000-0000-000000000000",
    "vatName": null,
    "newVateRate": 0,
    "vatRate": 15,
    "vatIsApplied": false,
    "vatAmount": 0,
    "paidAmount": 0,
    "withheldAmount": 0,
    "ouId": "011d4f5e-2b36-4c7e-a1f6-64cb9cf7d3bc",
    "ouName": "SISCO/Academic",
    "isCanceled": false,
    "canceledBy": null,
    "canceledDate": null,
    "isPosted": false,
    "accountingPeriod": "not set",
    "status": 0,
    "isApproved": false,
    "invoiceTaxLevies": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "GETFL",
        "amount": 0,
        "rate": 2.5,
        "isApplied": false
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "NHIL",
        "amount": 0,
        "rate": 2.5,
        "isApplied": false
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "VAT",
        "amount": 0,
        "rate": 15,
        "isApplied": false
      }
    ],
    "invoiceDetails": [
      {
        "id": "a35e6c9a-7d20-4e10-9e5c-3a3e7e5b1001",
        "referenceNumber": "PO45339",
        "description": "Electrical cables and fittings",
        "quantity": 2,
        "amount": 0,
        "unitPrice": 4900,
        "subTotal": 9800,
        "discountAsPercentage": false,
        "discount": 0,
        "debitAccountId": "7149f5a4-6bfd-43f8-9429-a95836b9fdb9",
        "debitAccountName": "61000006 - Electrical Maintenance"
      }
    ],
    "tenantId": 2,
    "id": "a10f219e-5f36-4eb3-8f11-5b7d1f310005"
  }
];


    const getOptionName = (options, id, labelKey = 'name') => {
        const item = options.find(
            option => String(option.id) === String(id)
        );

        return item ? item[labelKey] : '';
    };

    const paymentColumns = [
        { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Generated payment ID.'},
        { key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 74, help: 'Demo tenant identifier.'},
        {key: 'batchNumber', label: 'Batch #', type: 'text', width: 170, required: true, searchable: true},
        {key: 'paymentDate', label: 'Date', type: 'date', width: 145, required: true, searchable: true, defaultValue: today},
        {key: 'customerId', label: 'Customer', type: 'select', width: 240, required: true, searchable: true, options: customers, display: 'name', value: 'id'},
        {key: 'bankAccountId', label: 'Gl Account', type: 'select', width: 240, required: true, searchable: true, options: ledgerAccounts, display: 'accountIdentifier', value: 'id'},
        {key: 'modeOfPayment', label: 'Payment Method', type: 'text', width: 170, required: true},
        {key: 'currencyId', label: 'Currency', type: 'select', width: 170, required: true, options: currencies, display: 'name', value: 'id'},
        {key: 'buyRate', label: 'Rate', type: 'number', width: 130, required: true, decimals:4},
        {key: 'amountToPay', label: 'Payment Amount', type: 'number', width: 160, required: true, decimals:2},
        {key: 'referenceNumber', label: 'Ref Number', type: 'text', width: 180, searchable: true},
        {key: 'ouId', label: 'OU', type: 'select', width: 220, options: organizationalUnits, display: 'name', value: 'id'},
        {key: 'isPosted', label: 'Posted', type: 'boolean', width: 100},
    ];

    const paymentInvoices = {
        key: 'invoiceList',
        title: 'Invoice Allocations',
        columns: [
            { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Generated payment-record ID.'},
            { key: 'paymentId', label: 'Payment ID', type: 'text', hidden: true},
            { key: 'customerName', label: 'Customer', type: 'text', width: 40, required: true, searchable: true,},
            { key: 'invoiceNumber', label: 'Invoice', type: 'text', width: 40, required: true, searchable: true,},
            { key: 'currencyName', label: 'Currency', type: 'text', width: 40, required: true, searchable: true,},
            { key: 'buyRate', label: 'Rate', type: 'number', width: 40, decimals:4},
            { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 40, decimals:2},
            { key: 'balance', label: 'Invoice Balance', type: 'number', width: 40, decimals:4},
            { key: 'batchNumber', label: 'Batch Number', type: 'text', width: 40, searchable: true}
        ]
    };
    

    const app = Vue.createApp({
        data() {
            return {
              theme: '#f88500',
               theme1: '#383636',
                customers,
                bankAccounts,
                currencies,
                paymentMethods,
                organizationalUnits,
                ledgerAccounts,
                invoices,

                paymentColumns,
                paymentInvoices,
              
              invoiceColumns: [
                { key: 'id', label: 'ID', type: 'text', hidden: true, width: 80, help: 'Unique invoice identifier.'},
                {key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 80},
                {key: 'isSelected', label: 'Applied', type: 'boolean', width: 80, help: 'Indicates whether this invoice is selected for payment.'},
                {key: 'invoiceNumber', label: 'Invoice No.', type: 'text', width: 150, searchable: true},
                {key: 'liabilityAccountName', label: 'Liability G/L', type: 'text', width: 190, searchable: true},
                {key: 'currencyName', label: 'Currency', type: 'text', width: 110, searchable: true},
                {key: 'totalInvoiceAmount', label: 'Total Amount', type: 'number', width: 150, decimals: 2},
                {key: 'balance', label: 'Balance', type: 'number', width: 140, decimals: 2},
                {key: 'appliedAmount', label: 'Amount To Apply', type: 'number', width: 160, decimals: 2},
                {key: 'newBalance', label: 'New Balance', type: 'number', width: 150, decimals: 2},
                {key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 140, searchable: true},
                {key: 'projectedPayDate', label: 'Pay Date', type: 'date', width: 140, searchable: true}
              ],
              invoiceDetailsGrid: {
                key: 'invoiceDetails',
                title: 'Invoice Details',
                columns: [
                  { key: 'id', label: 'ID', type: 'text', hidden: true },
                  { key: 'invoiceId', label: 'Invoice ID', type: 'text', hidden: true },
                  { key: 'referenceNumber', label: 'Ref No.', type: 'text', width: 140, searchable: true },
                  { key: 'description', label: 'Description', type: 'text', width: 220, searchable: true },
                  { key: 'debitAccountName', label: 'Debit G/L', type: 'text', width: 190, searchable: true },
                  { key: 'unitPrice', label: 'Unit Price', type: 'number', width: 130, decimals: 2 },
                  { key: 'quantity', label: 'Quantity', type: 'number', width: 110, decimals: 2 },
                  { key: 'subTotal', label: 'Sub Total', type: 'number', width: 140, decimals: 2 }
                ]
              },

                isShimmerLoading: false,
                isLoading: false,
                payload: {},
                emptyGuid: '00000000-0000-0000-0000-000000000000',
                invoiceList: [],
                invoiceId: '',
                detailsList: [],
                customerList: [],
                customerId: '',
                customerName: '',
                accountNumber: '',
                invoiceNumber: '',
                paymentDate: moment().format("YYYY-MM-DD"),
                balance: '0',
                purchaseOrderNumber: '',
                currencyList: [],
                currencyId: '',
                totalInvoiceAmount: '0',
                minorName: '',
                amountToPay: '0',
                referenceNumber: '0',
                description: '',
                isVatWithheld: false,
                unitPrice: '0',
                quantity: '0',
                subTotal: ' 0',
                ouId: '',
                ouList: [],
                ouName: '',
                costCenterHierachyList: [],
                costCenterList: [],
                ouNameList: [],
                debitAccountList: [],
                debitAccountId: '',
                date: moment().format("YYYY-MM-DD"),
                address: '',
                voucherNumber: '',
                discount: '0',
                departments: [],
                debitAccountName: '',
                invoiceEditList: [],
                chequeNumber: '',
                bankAccountId: this.emptyGuid,
                bankAccountName: '',
                bankAccountNumber: '',
                isPosted: false,
                invoiceTypeList: [],
                invoiceType: '',
                cash: true,
                cheque: false,
                paymentList: [],
                selectedInvoiceList: [],
                outstandingCreditMemo: '0.00',
                paymentId: '',
                modeOfPayment: 'Cash',
                isAutomatic: true,
                Automatic: true,
                Manual: false,
                filteredInvoices: [],
                invoiceTypeId: '',
                invoiceTypeName: '',
                paymentInvoiceList: [],
                paymentInvoiceDetailsMap: {},
                reportType: 'details',
                reportApiBaseUrl: '',
                reportPath: '',
                buyRate: '0.0000',
                bankId: '',
                bankName: '',
                bankBranchId: '',
                bankBranch: '',
                bankList: [],
                bankBranchList: [],
                accountsList: [],
                skipInvoiceReload: false,
                bankAccountList: [],
                isOu: true,
                approveInvoiceBeforePayment: false,
                isMultiCurrency: false,
                invoiceRate: '1.0000',
                isSettingPayment: false,
                batchNumber: ''
                
            };
        },
        methods: {
          scrollToAdd() {
            this.$nextTick(() => {
              const element = document.querySelector('#add');

              if (!element) {
                console.error('Cannot find #add. Check where the div is rendered.');
                return;
              }

              element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            });
          },
            getBusinessProfile() {
                        this.isOu = this.organizationalUnits[0].id;
                        this.approveInvoiceBeforePayment = false
                
            },
            initPayment() {
               
                    this.accountsList = ledgerAccounts;
                        // Initialize or update bankAccountId dropdown
                        this.$nextTick(() => {
                            const ddl = $("#bankAccountId").data("ejDropDownList");
                            if (ddl) {
                                ddl.option({ dataSource: this.accountsList });
                            } else {
                                $('#bankAccountId').ejDropDownList({
                                    dataSource: this.accountsList,
                                    width: "100%",
                                    watermarkText: "Select Account",
                                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                                    enableFilterSearch: true,
                                    change: (args) => { this.bankAccountId = args.value; }
                                });
                            }
                        });
            },
            getBankAccounts() {
                        this.bankAccountList = bankAccounts;
            },
          getCurrency() {
            this.currencyList = currencies;

            // Default currency is the first item in currencyList
            this.defaultCurrency = this.currencyList.length > 0
                ? this.currencyList[0]
                : null;

            if (this.defaultCurrency) {
              this.currencyId = this.defaultCurrency.id;
              this.buyRate = parseFloat(this.defaultCurrency.buyRate || 0).toFixed(4);
            }

            // Initialize or update currency dropdown
            this.$nextTick(() => {
              const ddl = $('#currencyId').data("ejDropDownList");

              if (ddl) {
                ddl.option({
                  dataSource: this.currencyList,
                  value: this.currencyId
                });
              } else {
                $('#currencyId').ejDropDownList({
                  dataSource: this.currencyList,
                  width: "100%",
                  watermarkText: "Select Currency",
                  fields: {
                    id: "id",
                    text: "name",
                    value: "id"
                  },
                  enableFilterSearch: true,
                  value: this.currencyId,
                  change: (args) => {
                    this.currencyId = args.value;

                    const selectedCurrency = this.currencyList.find(
                        currency => currency.id === args.value
                    );

                    if (selectedCurrency) {
                      this.buyRate = parseFloat(
                          selectedCurrency.buyRate || 0
                      ).toFixed(4);
                    }

                    this.changeBankAccount(this.currencyId);
                  }
                });
              }

              // Update bank account using the default currency
              if (this.currencyId) {
                this.changeBankAccount(this.currencyId);
              }
            });
          },
            changeBankAccount(currencyId) {
                const val = currencyId || this.currencyId;

                // Guard: ensure currency and account list exist
                if (!val || !Array.isArray(this.accountsList) || !this.accountsList.length) {
                    this.$nextTick(() => {
                        const cddl = $('#currencyId').data("ejDropDownList");
                        if (cddl) cddl.option({ value: val });
                    });
                    return;
                }

                // Local copies to prevent accidental mutations
                const accountList = [...this.accountsList];
                const currencyList = [...this.currencyList];

                // Filter accounts whose currencyId matches the selected currency
                const accounts = accountList.filter(acc =>
                    String(acc.currencyId) === String(val)
                );

                // Initialize or update the bankAccountId dropdown
                this.$nextTick(() => {
                    const ddl = $('#bankAccountId').data("ejDropDownList");

                    if (ddl) {
                        // Update existing dropdown’s dataSource and value
                        ddl.option({ dataSource: accounts });
                        ddl.option({
                            value: accounts.some(a => String(a.id) === String(this.bankAccountId))
                                ? this.bankAccountId
                                : null
                        });
                    } else {
                        // Initialize new dropdown instance
                        $('#bankAccountId').ejDropDownList({
                            dataSource: accounts,
                            width: "100%",
                            watermarkText: "Select Account",
                            fields: { id: "id", text: "accountIdentifier", value: "id" },
                            enableFilterSearch: true,
                            change: (args) => {
                                this.bankAccountId = args.value;
                            }
                        });
                    }

                    // Keep currency dropdown synced
                    const cddl = $('#currencyId').data("ejDropDownList");
                    if (cddl) {
                        cddl.option({ dataSource: currencyList, value: val });
                    }
                });
            },
            getDefaultGlSetup() {
                        const defaultGlSetup = {}
                        const responseData = defaultGlSetups;
                        if (responseData) {
                            this.id = responseData.id;
                            // if bankAccount dropdown is ready, set value; else set it in nextTick
                            this.$nextTick(() => {
                                const ddl = $("#bankAccountId").data("ejDropDownList");
                                if (ddl) {
                                    ddl.option("value", responseData.accountPayablesBankAccountId);
                                } else {
                                    // As a fallback, attempt to initialize when it becomes available
                                    // (changeBankAccount and initPayment will have set up the dropdown earlier)
                                    // Keep a small timeout fallback to avoid blocking in rare cases
                                    setTimeout(() => {
                                        const ddl2 = $("#bankAccountId").data("ejDropDownList");
                                        if (ddl2) ddl2.option("value", responseData.accountPayablesBankAccountId);
                                    }, 100);
                                }
                            });
                        }

                        // init paymentDate
                        $("#paymentDate").ejDatePicker({
                            width: "100%",
                            dateFormat: "yyyy-MM-dd",
                            value: moment().add(1, 'months').format("YYYY-MM-DD"),
                            change: (args) => { this.paymentDate = args.value; }
                        });

                        return responseData;
                    
            },
            initPaymentType() {
                this.isAutomatic = !!this.Automatic;
            },
            toggleIsAutomatic() {
                this.Automatic = true;
                this.Manual = false;
            },
            toggleManual() {
                this.Automatic = false;
                this.Manual = true;
            },
            toggleCash() {
                this.cash = true;
                this.cheque = false;
                this.InitModeOfPayment();
            },
            toggleCheque() {
                this.cash = false;
                this.cheque = true;
                this.InitModeOfPayment();
            },
            InitModeOfPayment() {
                this.modeOfPayment = this.cash ? 'Cash' : 'Cheque';
            },
            formatNumber(number) {
                if (number < 0) {
                    return `(${Math.abs(number).toFixed(2)})`;
                }
                return number;
            },
            getPayments() {
                        this.paymentList = payments;
                        const postedPayments = payments.filter(payment => payment.isPosted === false && payment.isCanceled === false);
                        //format dates
                        this.paymentInvoiceList = [];
                        this.paymentInvoiceDetailsMap = {};
                        this.paymentList.forEach(payment => {
                            payment.paymentId = payment.id;
                            payment.paymentDate = this.formatDate(payment.paymentDate);
                            payment.displayName = `${payment.customerName} - ${payment.batchNumber}`;
                            // Map details
                            this.paymentInvoiceDetailsMap[payment.id] = payment.invoiceList.map(detail => {
                                detail.paymentId = payment.id;
                                this.paymentInvoiceList.push(detail);
                                return detail;
                            });
                        });
                      //  this.renderTable(postedPayments);
                        $("#paymentId").ejDropDownList({
                            dataSource: postedPayments,
                            watermarkText: "Select Payment Batch No.",
                            width: "100%",
                            fields: { id: "id", text: "displayName", value: "id" },
                            enableFilterSearch: true,
                            change: (args) => {
                                this.paymentId = args.value;
                            }
                        });
            },
            generateBatchNumber() {
                return `B-${Math.floor(100000 + Math.random() * 900000)}`;
            },
          
            getGridData(customerId) {
                        this.invoiceList = invoices.filter(invoice =>
                            invoice.isCanceled === false &&
                            invoice.isPosted &&
                            invoice.balance > 0 &&
                            invoice.invoiceDetails.length > 0 &&
                            (!this.approveInvoiceBeforePayment || invoice.isApproved === true)
                        )
                            .sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate));

                        const invoiceTypeIds = invoices
                            .filter(invoice => invoice.customerId === customerId)
                            .map(invoice => invoice.currencyId);

                        this.invoiceTypeList = this.currencyList.filter(currency => invoiceTypeIds.includes(currency.id));
                        $("#invoiceTypeId").ejDropDownList({
                            dataSource: this.invoiceTypeList,
                            watermarkText: "Select Invoice Type",
                            width: "100%",
                            fields: { id: "id", text: "name", value: "id" },
                            enableFilterSearch: true,
                            value: this.invoiceTypeId || '', // ensure not undefined
                            change: (args) => {
                                this.invoiceTypeId = args.value;
                                this.updateFilteredInvoices();
                            }
                        });
                        this.detailsList = [];
                        this.invoiceDetailsMap = {};
                        this.invoiceList.forEach(invoice => {
                            invoice.invoiceId = invoice.id;
                            invoice.invoiceDate = this.formatDate(invoice.invoiceDate);
                            invoice.projectedPayDate = this.formatDate(invoice.projectedPayDate);
                            // Map details
                            this.invoiceDetailsMap[invoice.id] = invoice.invoiceDetails.map(detail => {
                                detail.invoiceId = invoice.id; 
                                this.detailsList.push(detail);
                                return detail;
                            });
                        });
                        this.updateFilteredInvoices();
                        
            },
            updateFilteredInvoices() {
                const filteredInvoices = this.invoiceList.filter(invoice => {
                    return invoice.customerId === this.customerId &&
                        (!this.invoiceTypeId || invoice.currencyId === this.invoiceTypeId);
                });
                this.filteredInvoices = filteredInvoices;
              /*  this.dataTable(filteredInvoices);*/

                if (this.Manual && !this.isAutomatic) {
                    const selectedIds = (this.selectedInvoiceList || []).map(s => s.id);
                    this.filteredInvoices = filteredInvoices.map(inv => ({
                        ...inv,
                        isSelected: selectedIds.includes(inv.id)
                    }));
                   // update grid tables
                }
            },
         
calculateAndDisplayAppliedAmounts() {
    const invoices = this.filteredInvoices || [];
    const amountToPay = parseFloat(this.amountToPay) || 0;

    if (invoices.length === 0 || amountToPay <= 0) {
        return;
    }

    const invoiceRate = parseFloat(this.invoiceRate) || 1;
    const buyRate = parseFloat(this.buyRate) || 1;

    // Convert payment currency into invoice currency.
    let remainingAmount = amountToPay * (buyRate / invoiceRate);

    // Sort a copy to preserve the original array.
    const sortedInvoices = [...invoices].sort((a, b) =>
        new Date(a.projectedPayDate) - new Date(b.projectedPayDate)
    );

    const updatedInvoices = sortedInvoices.map(invoice => {
        const balance = parseFloat(invoice.balance) || 0;
        let applied = 0;

        if (remainingAmount > 0) {
            applied = Math.min(
                Math.max(balance, 0),
                remainingAmount
            );

            remainingAmount -= applied;
        }

        applied = Number(applied.toFixed(2));

        return {
            ...invoice,
            allocatedAmount: applied,
            appliedAmount: applied,
            remainingBalance: Number(
                (balance - applied).toFixed(2)
            ),
            newBalance: Number(
                (balance - applied).toFixed(2)
            ),
            isSelected: applied > 0
        };
    });

    this.filteredInvoices = updatedInvoices;

    // Update the records displayed by the parent custom grid.
    const updatedById = new Map(
        updatedInvoices.map(invoice => [invoice.id, invoice])
    );

    this.invoiceList = (this.invoiceList || []).map(invoice =>
        updatedById.has(invoice.id)
            ? updatedById.get(invoice.id)
            : invoice
    );

    this.outstandingCreditMemo = Number(
        Math.max(remainingAmount, 0).toFixed(2)
    );
},

            async ApplyPayment() {
                if (this.isAutomatic) {
                    await this.calculateAndDisplayAppliedAmounts();
                }
                else {
                  this.calculateManualAppliedAmounts();
                }
            },
          
calculateManualAppliedAmounts() {
    const grid = this.$refs.invoiceGrid;

    // Get the currently selected rows from the custom grid.
    const selectedRows = grid ? grid.selectedRows() : [];

    this.selectedInvoiceList = Array.isArray(selectedRows)
        ? selectedRows
        : [];

    const selectedIds = new Set(
        this.selectedInvoiceList.map(invoice => invoice.id)
    );

    let amountToPay = parseFloat(this.amountToPay) || 0;

    const invoices = Array.isArray(this.filteredInvoices)
        ? this.filteredInvoices
        : [];

    if (this.Manual && amountToPay > 0 && invoices.length > 0) {
        const invoiceRate = parseFloat(this.invoiceRate) || 1;
        const buyRate = parseFloat(this.buyRate) || 1;

        amountToPay = amountToPay * (buyRate / invoiceRate);

        let remainingToApply = amountToPay;

        const updatedInvoices = invoices.map(invoice => {
            const selected = selectedIds.has(invoice.id);
            const balance = parseFloat(invoice.balance) || 0;

            let applied = 0;

            if (selected && remainingToApply > 0) {
                applied = Math.min(
                    Math.max(balance, 0),
                    remainingToApply
                );

                remainingToApply -= applied;
            }

            return {
                ...invoice,
                isSelected: selected,
                appliedAmount: Number(applied.toFixed(2)),
                newBalance: Number((balance - applied).toFixed(2))
            };
        });

        // Update the data source used by the parent grid.
        this.filteredInvoices = updatedInvoices;
        this.invoiceList = updatedInvoices;

        this.calculateOutstandingCreditMemo();

    } else {
        // Reset calculated amounts while preserving the actual invoice balances.
        const updatedInvoices = invoices.map(invoice => {
            const balance = parseFloat(invoice.balance) || 0;

            return {
                ...invoice,
                isSelected: false,
                appliedAmount: 0,
                newBalance: Number(balance.toFixed(2))
            };
        });

        this.filteredInvoices = updatedInvoices;
        this.invoiceList = updatedInvoices;

        this.selectedInvoiceList = [];
        this.outstandingCreditMemo = 0;
    }
},
            getCustomers()
            {
               
                        this.customerList = customers
                        $("#customerId").ejDropDownList({
                            dataSource: this.customerList,
                            watermarkText: "Select Customer",
                            width: "100%",
                            fields: {id: "id", text: "name", value: "id"},
                            enableFilterSearch: true,
                            change: (args) => {
                                this.customerId = args.value;
                            }
                        });
            },
            getCustomerDetails(id)
            {
                return this.customerList.find(a => a.id === id);
            },
            setCurrentCustomer()
            {
                let customerInfo = this.getCustomerDetails(this.customerId);
                if (customerInfo) {
                    this.accountNumber = customerInfo.accountNumber;
                    this.balance = customerInfo.balance;
                    this.customerName = customerInfo.name;
                    this.customerId = customerInfo.id;
                    this.address = customerInfo.address;
                    if (customerInfo.balance < 0) {
                        this.outstandingCreditMemo = parseFloat(customerInfo.balance).toFixed(2);
                    } else {
                        this.outstandingCreditMemo = '0.00';
                    }
                    this.tenantId = customerInfo.tenantId;
                    $("#customerId").ejDropDownList({value: customerInfo.id});
                }
            },
            getCostCenters()
            {
                    this.costCenterHierachyList = organizationalUnits;
                    
                    let initOuId = this.ouId && this.ouId !== this.emptyGuid ? this.ouId : (this.costCenterHierachyList.length > 0 ? this.costCenterHierachyList[0].id : this.emptyGuid);


                    $("#ouId").ejDropDownList({
                        dataSource: this.costCenterHierachyList,
                        width: "100%",
                        watermarkText: "Select OU/Cost Center",
                        fields: {id: "id", text: "name", value: "id"},
                        value: this.ouId,
                        enableFilterSearch: true,
                        change: (args) => {
                            this.ouId = args.value;
                        }
                    });
                    this.setOu(initOuId);

             
            },
          getOuDetails(id) {

            return this.costCenterHierachyList.find(a => a.id === id);
          },
            setOu(id)
            {
                this.ouId = id;
                let ouInfo = this.getOuDetails(id);
                if (ouInfo) {
                    this.ouId = ouInfo.id;
                    this.ouName = ouInfo.name;
                    $("#ouId").ejDropDownList({value: ouInfo.id});
                } else {
                    this.ouId = this.emptyGuid;
                    this.ouName = '';
                    $("#ouId").ejDropDownList({value: this.emptyGuid});
                }
            },
            getCurrencyDetails(id)
            {
                return this.currencyList.find(a => a.id === id);
            },
            formatDate(dateInput)
            {

                return moment(dateInput).format("YYYY-MM-DD");

            },
          
getAutomaticPaymentInvoices() {
    // Filter invoices for the current customer and currency.
    const filteredInvoices = (this.invoiceList || []).filter(invoice => {
        return invoice.customerId === this.customerId &&
            (!this.invoiceTypeId || invoice.currencyId === this.invoiceTypeId);
    });

    const amountToPay = parseFloat(this.amountToPay) || 0;

    // Guard: no matching invoices or no payment amount.
    if (filteredInvoices.length === 0 || amountToPay <= 0) {
        this.filteredInvoices = [];
        this.outstandingCreditMemo = 0;

        // Clear old automatic allocations from the displayed invoices.
        this.invoiceList = (this.invoiceList || []).map(invoice => ({
            ...invoice,
            allocatedAmount: 0,
            appliedAmount: 0,
            remainingBalance: Number(
                (parseFloat(invoice.balance) || 0).toFixed(2)
            ),
            newBalance: Number(
                (parseFloat(invoice.balance) || 0).toFixed(2)
            )
        }));

        return;
    }

    // Get exchange rates.
    const invoiceRate = parseFloat(this.invoiceRate) || 1;
    const buyRate = parseFloat(this.buyRate) || 1;

    // Convert payment amount into invoice currency.
    let remainingAmount = amountToPay * (buyRate / invoiceRate);

    // Sort by projected payment date without mutating the original array.
    const sortedInvoices = [...filteredInvoices].sort((a, b) =>
        new Date(a.projectedPayDate) - new Date(b.projectedPayDate)
    );

    const allocatedInvoices = sortedInvoices.map(invoice => {
        const balance = parseFloat(invoice.balance) || 0;
        let allocatedAmount = 0;

        if (remainingAmount > 0) {
            allocatedAmount = Math.min(
                Math.max(balance, 0),
                remainingAmount
            );

            remainingAmount -= allocatedAmount;
        }

        allocatedAmount = Number(allocatedAmount.toFixed(2));

        return {
            ...invoice,
            isSelected: allocatedAmount > 0,
            allocatedAmount,
            appliedAmount: allocatedAmount,
            remainingBalance: Number(
                (balance - allocatedAmount).toFixed(2)
            ),
            newBalance: Number(
                (balance - allocatedAmount).toFixed(2)
            )
        };
    });

    // Keep the allocated invoices available to the rest of the page.
    this.filteredInvoices = allocatedInvoices;

    // Preserve all other invoices and update matching records by ID.
    const allocatedById = new Map(
        allocatedInvoices.map(invoice => [invoice.id, invoice])
    );

    this.invoiceList = (this.invoiceList || []).map(invoice => {
        const allocated = allocatedById.get(invoice.id);

        if (allocated) {
            return allocated;
        }

        return {
            ...invoice,
            allocatedAmount: 0,
            appliedAmount: 0,
            remainingBalance: Number(
                (parseFloat(invoice.balance) || 0).toFixed(2)
            ),
            newBalance: Number(
                (parseFloat(invoice.balance) || 0).toFixed(2)
            )
        };
    });

    // Any amount left over becomes an outstanding credit memo.
    this.outstandingCreditMemo = Number(
        Math.max(remainingAmount, 0).toFixed(2)
    );
},

            calculateOutstandingCreditMemo()
            {
                const selectedList = this.selectedInvoiceList.length > 0
                    ? this.selectedInvoiceList
                    : this.filteredInvoices;

                let amountToPay = parseFloat(this.amountToPay) || 0;

                // guard for empty list
                if (amountToPay > 0 && selectedList.length > 0) {

                    // pick invoice rate and payment buy rate
                    const invoiceRate = parseFloat(this.invoiceRate) || 1;
                    const buyRate = parseFloat(this.buyRate) || 1;

                    // convert payment amount into invoice currency
                    const convertedPayment = amountToPay * (buyRate / invoiceRate);

                    // sum all invoice balances (in invoice currency)
                    let totalBalance = selectedList.reduce((acc, invoice) => {
                        let balance = parseFloat(invoice.balance) || 0;
                        return acc + balance;
                    }, 0);
                    // compare using converted amount
                    if (convertedPayment > totalBalance) {
                        let creditMemo = (convertedPayment - totalBalance).toFixed(2);
                        this.outstandingCreditMemo = creditMemo;
                        /* this.toastHandler('warning', `You have an outstanding credit memo of ${creditMemo}`);*/
                    } else {
                        this.outstandingCreditMemo = 0;
                    }

                } else {
                    this.outstandingCreditMemo = 0;
                }
            },
          getPaymentDetails() {
            const grid = this.$refs.payments;
            if (!grid) return null;
           
            return grid.selectedRows()[0] ?? null;
          },
          paymentInfoInvoice(responseData) {
            this.selectedInvoiceList = Array.isArray(responseData)
                ? responseData.map(invoice => ({ ...invoice }))
                : [];

            console.log(
                "Payment invoice allocations:",
                this.selectedInvoiceList
            );
          },
          async setCurrentPayment() {
            this.scrollToAdd();
            const grid = this.$refs.payments;
            const selectedIds = grid.selectedRows();

            if (selectedIds.length > 1) {
              this.toastHandler('warning', 'You can only edit one record at a time');
              return;
            }

            const paymentInfo = this.getPaymentDetails();
            
            if (!paymentInfo) {
              this.toastHandler('warning','Please select a payment first.');
              return;
            }
            this.paymentId = paymentInfo.id;
            this.customerId = paymentInfo.customerId;
            this.customerName = paymentInfo.customerName;
            this.accountNumber = paymentInfo.accountNumber;
            this.paymentDate = paymentInfo.paymentDate;
            this.balance = paymentInfo.balance;
            this.purchaseOrderNumber = paymentInfo.purchaseOrderNumber;
            this.currencyId = paymentInfo.currencyId;
            this.totalInvoiceAmount = paymentInfo.totalInvoiceAmount;
            this.amountToPay = paymentInfo.amountToPay;
            this.referenceNumber = paymentInfo.referenceNumber;
            this.description = paymentInfo.description;
            this.isVatWithheld = paymentInfo.isVatWithheld;
            this.currencyName = paymentInfo.currencyName;
            this.currencyCode = paymentInfo.currencyCode;
            this.buyRate = parseFloat(paymentInfo.buyRate).toFixed(4);
            this.sellRate = parseFloat(paymentInfo.sellRate).toFixed(4);
            this.ouId = paymentInfo.ouId;
            this.ouName = paymentInfo.ouName;
            this.debitAccountId = paymentInfo.debitAccountId;
            this.date = paymentInfo.date;
            this.address = paymentInfo.address;
            this.voucherNumber = paymentInfo.voucherNumber;
            this.batchNumber = paymentInfo.batchNumber;
            this.discount = paymentInfo.discount;
            this.debitAccountName = paymentInfo.debitAccountName;
            this.chequeNumber = paymentInfo.chequeNumber;
            this.bankAccountId = paymentInfo.bankAccountId;
            this.bankAccountName = paymentInfo.bankAccountName;
            this.bankAccountNumber = paymentInfo.bankAccountNumber;
            this.isPosted = paymentInfo.isPosted;
            this.cash = paymentInfo.cash;
            this.cheque = paymentInfo.cheque;
            if (this.chequeNumber && this.chequeNumber !== '') {
              this.cheque = true
              this.chequeNumber = paymentInfo.chequeNumber;
            }
            this.bankId = paymentInfo.bankId;
            this.bankName = paymentInfo.bankName;
            this.bankBranchId = paymentInfo.bankBranchId;
            this.bankBranch = paymentInfo.bankBranch;
            this.paymentId = paymentInfo.id;
            this.modeOfPayment = paymentInfo.modeOfPayment;
            this.isAutomatic = paymentInfo.isAutomatic;
            if (this.isAutomatic) {
              await this.ApplyPayment();
            }
            this.Automatic = paymentInfo.isAutomatic;
            this.Manual = !paymentInfo.isAutomatic;
           /* this.selectedInvoiceList = Array.isArray(paymentInfo.invoiceList)
                ? [...paymentInfo.invoiceList]
                : [];*/
           
            this.invoiceTypeId = paymentInfo.invoiceTypeId;
            this.isMultiCurrency = paymentInfo.isMultiCurrency;
            $("#currencyId").ejDropDownList({value: paymentInfo.currencyId});
            this.outstandingCreditMemo = parseFloat(paymentInfo.outstandingCreditMemo).toFixed(2)
            $("#paymentId").ejDropDownList({value: paymentInfo.id});
            let dropdown = $("#bankAccountId").data("ejDropDownList");
            if (dropdown) {
              dropdown.option("value", paymentInfo.bankAccountId);
            }
            let ouDropdown = $("#ouId").data("ejDropDownList");
            if (ouDropdown) {
              ouDropdown.option("value", paymentInfo.ouId);
            }
            let bankDropdown = $("#bankId").data("ejDropDownList");
            if (bankDropdown) {
              bankDropdown.option("value", paymentInfo.bankId);
            }
            let branchDropdown = $("#branchId").data("ejDropDownList");
            if (branchDropdown) {
              branchDropdown.option("value", paymentInfo.bankBranchId);
            }
            this.bankAccountName = paymentInfo.bankAccountName;
            let invoiceTypeDropdown = $("#invoiceTypeId").data("ejDropDownList");
            if (invoiceTypeDropdown) {
              invoiceTypeDropdown.option("value", paymentInfo.invoiceTypeId);
            }
            this.paymentInfoInvoice(paymentInfo.invoiceList);

            await this.$nextTick();
           /* // Wait for Vue to update before refreshing the table
            await this.$nextTick();

            console.log("Payment info:", paymentInfo);
            console.log("Invoice list:", paymentInfo.invoiceList);
            console.log("Selected invoice list:", this.selectedInvoiceList);

            this.dataTable(this.selectedInvoiceList);*/
          

          },
            savePayment()
            {
                this.isLoading = true;
                this.getSelectedInvoices();
                this.calculateOutstandingCreditMemo();
                let payload = {};
                if (this.batchNumber === null || this.batchNumber === '') {
                    payload.batchNumber = '0';
                } else {
                    payload.batchNumber = this.batchNumber;
                }

                if (!this.invoiceTypeId) {
                    this.toastHandler('warning', 'Please select an invoice type.');
                    this.isLoading = false;
                    return;
                }
                if (this.amountToPay === 0) {
                    this.toastHandler('warning', 'Amount to pay cannot be zero.');
                    this.isLoading = false;
                    return;
                }
                if (this.currencyId) {
                    let currencyInfo = this.getCurrencyDetails(this.currencyId);
                    if (currencyInfo) {
                        payload.currencyId = currencyInfo.id;
                        payload.currencyName = currencyInfo.currencyName;
                        payload.currencyCode = currencyInfo.currencyCode;
                        payload.minorName = currencyInfo.minorName;
                        payload.buyRate = this.buyRate;
                        payload.sellRate = currencyInfo.sellRate;
                    }
                }
                if (this.invoiceTypeId) {
                    let invoiceTypeInfo = this.getCurrencyDetails(this.invoiceTypeId);
                    if (invoiceTypeInfo) {
                        payload.invoiceTypeId = invoiceTypeInfo.id;
                        payload.invoiceTypeName = invoiceTypeInfo.currencyName;
                    }
                }

                if (this.customerId) {
                    let customerInfo = this.getCustomerDetails(this.customerId);
                    if (customerInfo) {
                        payload.customerId = customerInfo.id;
                        payload.customerName = customerInfo.name;
                        payload.accountNumber = customerInfo.accountNumber;
                    }
                }
                if (this.ouId) {
                    let departmentInfo = this.getOuDetails(this.ouId);
                    if (departmentInfo) {
                        payload.ouId = departmentInfo.id;
                        payload.ouName = departmentInfo.name;
                    }
                }
                if (this.bankAccountId) {
                    let bankAccountInfo = this.accountsList.find(a => a.id === this.bankAccountId);
                    if (bankAccountInfo) {
                        payload.bankAccountId = bankAccountInfo.id;
                        payload.bankAccountName = `${bankAccountInfo.accountNo} - ${bankAccountInfo.accountName}`;
                        payload.bankAccountNumber = bankAccountInfo.accountNo;
                    } else {
                        payload.bankAccountId = this.emptyGuid;
                        payload.bankAccountName = 'Not Set';
                        payload.bankAccountNumber = 'Not Set';

                    }
                }
                if (this.selectedInvoiceList.length === 0) {
                    payload.invoiceList = this.filteredInvoices;
                } else {
                    payload.invoiceList = this.selectedInvoiceList;
                }
                payload.amountToPay = this.amountToPay;
                payload.paymentDate = this.paymentDate;
                payload.referenceNumber = this.referenceNumber;
                payload.isMultiCurrency = this.isMultiCurrency;
                payload.batchNumber = this.batchNumber;
                payload.outstandingCreditMemo = this.outstandingCreditMemo;
                payload.modeOfPayment = this.modeOfPayment;
                payload.chequeNumber = this.chequeNumber;
                payload.isPosted = this.isPosted;
                payload.isAutomatic = this.isAutomatic;
                if (this.bankId) {

                    let bankInfo = this.getBankDetails(this.bankId);
                    if (bankInfo) {

                        payload.bankId = this.bankId;
                        payload.bankName = bankInfo.name;
                    }
                } else {
                    payload.bankId = this.emptyGuid;
                }
                if (this.bankBranchId) {
                    let bankBranchInfo = this.getBankBranchDetails(this.bankBranchId);
                    if (bankBranchInfo) {
                        payload.bankBranchId = this.bankBranchId;
                        payload.bankBranch = bankBranchInfo.name;
                    }
                } else {
                    payload.bankBranchId = this.emptyGuid;
                }
                payload.outstandingCreditMemo = this.outstandingCreditMemo;
                if (this.paymentId) {
                    payload.id = this.paymentId;
                    payload.tenantId = this.tenantId;
                    axios.post('/ApDataEntry/UpdatePayment', payload)
                        .then(response => {
                            this.getPayments();
                            this.setCurrentPayment();
                            this.toastHandler('', 'Invoice Payment updated.');
                            this.isLoading = false;
                        })
                        .catch(err => {
                            this.toastHandler('error', 'Unable to update invoice.');
                            this.isLoading = false;
                        });
                } else {
                    axios.post('/ApDataEntry/CreatePayment', payload)
                        .then(response => {
                            this.getPayments();
                            this.paymentId = response.data.id;
                            this.setCurrentPayment();
                            if (response.data.code === 200) {
                                this.toastHandler('', 'Invoice Payment Created.');
                                this.isLoading = false;
                                window.location.href = `/ApDataEntry/AllPayments`;
                            } else {
                                this.toastHandler('error', response.data.message);
                                this.isLoading = false;
                            }
                        })
                        .catch(err => {
                            this.toastHandler('error', 'Unable to save invoice.');
                        });
                }
            },
            delPayment(id)
            {
                axios.post('/ApDataEntry/DeletePayment?id=' + id)
                    .then(response => {

                        this.toastHandler('', 'Invoice Payment deleted.');
                        this.getPayments();
                    })
                    .catch(err => {
                        this.toastHandler('error', 'Unable to delete invoice.');
                    });
            },
            clearForm()
            {
                window.location.reload();
            },
           
          
            setBuyRate()
            {
                if (this.currencyId) {
                    const currency = this.currencyList.find(a => a.id === this.currencyId);
                    this.buyRate = parseFloat(currency.buyRate).toFixed(4);
                }
            },
            getBanks()
            {


                    this.bankList = bankAccounts;

                    $("#bankId").ejDropDownList({
                        dataSource: this.bankList,
                        watermarkText: "Select Bank",
                        width: "100%",
                        fields: {id: "id", text: "name", value: "id"},
                        enableFilterSearch: true,
                        change: (args) => {

                            this.bankId = args.value;
                        }
                    });
                    
            },
            getBankDetails(id)
            {

                return this.bankList.find(a => a.id === id);
            },
            getBankBranchDetails(id)
            {

                return this.bankBranchList.find(a => a.id === id);
            },
            printReport() {
                if (!this.paymentId) {
                    this.toastHandler("warning", "No payment selected for printing.");
                    return;
                }

                const paymentId = this.paymentId;
                const reportUrl = `/ApReports/PrintPaymentReceipt?id=${paymentId}`;

                const printWindow = window.open("", "_blank");
                printWindow.document.write(`
        <html>
        <head>
            <title>Loading Report...</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #fff;
                    font-family: Arial, sans-serif;
                }
                .loader {
                    border: 10px solid #f3f3f3;
                    border-top: 10px solid #15aafa;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="loader"></div>
        </body>
        </html>
    `);
                printWindow.document.close();

                // 🔹 After short delay, redirect to actual report URL
                setTimeout(() => {
                    printWindow.location.href = reportUrl;
                }, 800);
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

          },
            resetBankFields()
            {
                this.bankId = '';
                this.bankName = '';
                this.bankBranchId = '';
                this.bankBranchName = '';
                $("#bankId").ejDropDownList("option", "value", null);
                $("#bankBranchId").ejDropDownList("option", "value", null);
            },
         
        },
        watch: {
            customerId(val) {
                if (val) {
                    this.setCurrentCustomer();
                    this.updateFilteredInvoices();
                    this.getGridData(val);
                }
            },
            currencyId(val) {
                if (val) {
                    this.setBuyRate();
                    this.isMultiCurrency = val !== this.defaultCurrency.id;
                }
                this.changeBankAccount(val);
                if (this.isAutomatic) {
                    this.getAutomaticPaymentInvoices();
                    this.calculateAndDisplayAppliedAmounts();
                }
            },
            invoiceTypeId(val) {
                if (!val) return;
                this.isMultiCurrency = val !== this.defaultCurrency?.id;
                //set invoiceRate as the buyRate for the invoiceType
                let currencyInfo = this.getCurrencyDetails(val);
                if (currencyInfo) {
                    this.invoiceRate = parseFloat(currencyInfo.buyRate).toFixed(4);
                }
                if (this.isAutomatic) {
                    this.calculateAndDisplayAppliedAmounts();
                }
            },
            amountToPay(val) {
                if (this.isAutomatic) {
                    this.getAutomaticPaymentInvoices();
                    this.calculateAndDisplayAppliedAmounts();
                }
            },

            Manual(val) {
                this.isAutomatic = !val;
                this.Automatic = !val;
                this.updateFilteredInvoices();
            },
            isAutomatic(val) {
                this.Automatic = val;
                this.Manual = !val;
                this.updateFilteredInvoices();
                if (val) this.getAutomaticPaymentInvoices();
                if (val) this.calculateAndDisplayAppliedAmounts();
            },
            invoiceId(val) {

                if (val) {
                    this.setCurrentInvoice();

                }
            },
            paymentId(val) {
                if (val) {
                    this.setCurrentPayment();

                }
            },
            /*bankAccountId(newVal) {
                if (!newVal) {
                    this.bankName = '';
                    this.bankBranchName = '';
                    this.bankId = '';
                    this.bankBranchId = '';
                    return;
                }
                const selectedAccount = this.accountsList.find(
                    acc => acc.id === newVal
                );


                const bankAccount = this.bankAccountList.find(
                    ba => ba.accountId === selectedAccount.id
                );


                const bank = this.bankList.find(
                    b => b.name.toLowerCase() === bankAccount.bankName.toLowerCase()
                );


                this.bankId = bank.id;
                this.bankName = bank.name;

                $("#bankId").ejDropDownList("option", "value", bank.id);

                const branch = bank.bankBranches.find(
                    br => br.id === bankAccount.bankBranchId
                );

                this.bankBranchId = branch.id;
                this.bankBranchName = branch.name;

                $("#bankBranchId").ejDropDownList("option", "value", branch.id);
            },
            bankId(val) {
                if (val) {
                    const bankInfo = this.getBankDetails(val);

                    if (bankInfo) {
                        this.bankBranchList = [...bankInfo.bankBranches].sort((a, b) => {
                            const nameA = a?.name || "";
                            const nameB = b?.name || "";
                            return nameA.localeCompare(nameB);
                        });

                        $("#branchId").ejDropDownList({
                            dataSource: this.bankBranchList,
                            watermarkText: "Select Branch",
                            width: "100%",
                            fields: { id: "id", text: "name", value: "id" },
                            enableFilterSearch: true,
                            change: (args) => {
                                this.bankBranchId = args.value;
                            }
                        });

                        this.$nextTick(() => {
                            if (this.bankBranchId) {
                                $("#branchId").ejDropDownList("option", "value", this.bankBranchId);
                            }
                        });
                    }
                }
            },*/
         
        },
        async mounted() {
            await this.initPayment();
            this.getBusinessProfile();
            this.getCustomers();
            await this.getBankAccounts();
            await this.getCurrency();
            this.getCostCenters();
            this.getPayments();
            this.getBanks();
           // this.getDefaultGlSetup();
        }
    });

  app.use(DataGridPlugin);
  app.use(WSelectPlugin);
  app.mount('#app');
})();


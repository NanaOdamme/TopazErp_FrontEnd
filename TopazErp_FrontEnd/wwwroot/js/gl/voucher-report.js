/**
 * voucher-report.js — Topaz ERP Report Generation Engine
 *
 * Implements code-defined ERP reports and voucher reports (matching BusinessDesk):
 * - Standard EmbeddedReport (Chart of Accounts, Trial Balance, Ledger, etc.)
 * - VoucherReport (Payment Voucher, Receipt Voucher)
 * - PDF generation via pdfmake
 * - Excel generation via ExcelJS
 * - Word generation via docx (when available)
 * - Number-to-words for currencies
 *
 * Exports on window.TopazReportViewer:
 *   voucherAmountInWords(value, currency)
 *   buildVoucherReport(voucher, summary, companyName)
 *   voucherPdfDefinition(report)
 *   createVoucherPdf(report)
 *   createVoucherExcel(report)
 *   reportPalette(mode)
 *   reportHierarchyRows(report)
 *   reportPdfDefinition(report, mode)
 *   createReportPdf(report, mode)
 *   createReportExcel(report, mode)
 */
(function (global) {
    'use strict';

    // ── Number formatting helpers ──────────────────────────────────────────
    function fmt(value) {
        if (!value && value !== 0) return '—';
        const n = parseFloat(value);
        if (!isFinite(n)) return '—';
        return new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    }

    function fmtForeign(value) {
        if (!value && value !== 0) return '—';
        const n = parseFloat(value);
        if (!isFinite(n)) return '—';
        return new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n);
    }

    // ── Amount in words ────────────────────────────────────────────────────
    const ones = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    function underThousand(n) {
        const h = Math.floor(n / 100), rest = n % 100;
        return [h ? `${ones[h]} Hundred` : '', rest < 20 ? (rest ? ones[rest] : '') : `${tens[Math.floor(rest / 10)]}${rest % 10 ? `-${ones[rest % 10]}` : ''}`].filter(Boolean).join(' ');
    }

    const currencyUnits = {
        GHS: { major: 'Ghana Cedi',          minor: 'Pesewa',  plural: 'Pesewas' },
        USD: { major: 'US Dollar',            minor: 'Cent',    plural: 'Cents' },
        EUR: { major: 'Euro',                 minor: 'Cent',    plural: 'Cents' },
        GBP: { major: 'British Pound',        minor: 'Penny',   plural: 'Pence' },
        NGN: { major: 'Nigerian Naira',       minor: 'Kobo',    plural: 'Kobo' },
        CAD: { major: 'Canadian Dollar',      minor: 'Cent',    plural: 'Cents' },
        AUD: { major: 'Australian Dollar',    minor: 'Cent',    plural: 'Cents' },
        ZAR: { major: 'South African Rand',   minor: 'Cent',    plural: 'Cents' },
        KES: { major: 'Kenyan Shilling',      minor: 'Cent',    plural: 'Cents' },
    };

    function currencyUnit(code) {
        const key = (code || 'GHS').toUpperCase();
        if (currencyUnits[key]) return currencyUnits[key];
        return { major: key, minor: '', plural: '' };
    }

    function voucherAmountInWords(value, currency) {
        if (!/^\d+(?:\.\d{1,6})?$/.test(String(value))) return '—';
        const str = String(value);
        const [whole = '0', fraction = ''] = str.split('.');
        const wholeNum = parseInt(whole, 10);
        const fractionPadded = (fraction + '00').slice(0, 2);
        let cents = wholeNum * 100 + parseInt(fractionPadded, 10);
        if (fraction.length > 2 && parseInt(fraction[2], 10) >= 5) cents++;
        let integer = Math.trunc(cents / 100);
        const minorCents = cents % 100;

        const groups = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion'];
        const words = [];
        let tempInt = integer;
        for (let i = 0; tempInt && i < groups.length; i++, tempInt = Math.trunc(tempInt / 1000)) {
            const part = tempInt % 1000;
            if (part) words.unshift(`${underThousand(part)}${groups[i] ? ` ${groups[i]}` : ''}`);
        }
        if (tempInt) return `${currency} ${fmt(value)}`;
        const unit = currencyUnit(currency);
        const minorText = unit.minor
            ? `${minorCents} ${minorCents === 1 ? unit.minor : unit.plural}`
            : `${String(minorCents).padStart(2, '0')}/100`;
        return `${words.join(' ') || 'Zero'} ${unit.major}${minorCents ? ` and ${minorText}` : ''} Only`;
    }

    // ── Standard Report Hierarchy & Palette (BusinessDesk) ─────────────────
    function reportPalette(mode) {
        return mode === 'monochrome'
            ? { ink: '000000', accent: '000000', muted: '555555', fill: 'EEEEEE' }
            : { ink: '172321', accent: '176B53', muted: '52625E', fill: 'DCEFE8' };
    }

    function reportHierarchyRows(report) {
        const result = [];
        let previous = [];
        for (const section of (report.sections || [])) {
            const path = section.path && section.path.length ? section.path : section.hideHeading ? [] : [section.title];
            let common = 0;
            while (common < path.length && common < previous.length && path[common] === previous[common]) common++;
            for (let depth = common; depth < path.length; depth++) {
                result.push({ kind: 'heading', label: path[depth], depth, shaded: !section.path });
            }
            for (const cells of (section.rows || [])) {
                result.push({
                    kind: 'record',
                    cells,
                    depth: path.length,
                    ...(cells.some(c => /^grand total\b/i.test(String(c).trim())) ? { grandTotal: true } : {}),
                    ...(section.emphasized ? { emphasized: true } : {}),
                    ...(section.fullWidth || section.title === 'Report notes' ? { fullWidth: true } : {})
                });
            }
            previous = path;
        }
        return result;
    }

    function reportPdfDefinition(report, mode) {
        const trial = report.id === 'trial-balance';
        const palette = reportPalette(trial ? 'monochrome' : (mode || 'color'));
        const contentWidth = report.landscape ? 770 : 523;
        const hierarchy = reportHierarchyRows(report);
        const body = [(report.columns || []).map(col => ({
            text: col.title, alignment: col.alignment, bold: true, decoration: 'underline', margin: [3, 3, 3, 7]
        }))];

        if (trial && body[0] && body[0][0]) {
            body[0][0] = { text: 'General Ledger #', colSpan: 2, bold: true, margin: [3, 3, 3, 7] };
            body[0][1] = {};
        }

        for (const [rowIndex, row] of hierarchy.entries()) {
            if (row.kind === 'heading') {
                body.push([
                    {
                        id: `report-heading-${rowIndex}`, text: row.label, colSpan: (report.columns || []).length, bold: true,
                        fontSize: row.depth === 0 ? 10.5 : 9.5,
                        decoration: trial ? 'underline' : undefined,
                        fillColor: !trial && row.shaded ? `#${palette.fill}` : undefined,
                        color: `#${palette.accent}`, margin: [Math.min(row.depth, 6) * 12 + 3, 6, 3, 3]
                    },
                    ...(report.columns || []).slice(1).map(() => ({}))
                ]);
            } else if (row.fullWidth) {
                body.push([
                    { id: `report-account-${rowIndex}`, text: row.cells[0] || '', colSpan: (report.columns || []).length, margin: [3, 3, 3, 3] },
                    ...(report.columns || []).slice(1).map(() => ({}))
                ]);
            } else {
                body.push(row.cells.map((text, index) => ({
                    id: index === Math.max(0, row.cells.findIndex(cell => cell !== '')) ? `report-account-${rowIndex}` : undefined,
                    text: String(text || ''), bold: row.emphasized, decoration: row.grandTotal ? 'underline' : undefined,
                    alignment: report.columns && report.columns[index] ? report.columns[index].alignment : 'left',
                    margin: [index === 0 ? (trial ? 9 : Math.min(row.depth, 4) * 12 + 3) : 3, trial ? 4 : 2, 3, trial ? 4 : 2]
                })));
            }
        }

        const content = hierarchy.length ? [{
            table: {
                widths: (report.columns || []).map(c => `${c.width}%`),
                headerRows: 1, keepWithHeaderRows: 1, dontBreakRows: true, body
            },
            layout: trial ? { hLineWidth: (i) => i === 1 ? 1.2 : 0, vLineWidth: () => 0, hLineColor: () => '#000000' } : 'noBorders'
        }] : [{ text: 'No accounts match the selected filters.', margin: [0, 20, 0, 0] }];

        return {
            info: { title: report.title, author: report.companyName, creator: 'Topaz ERP' },
            pageSize: 'A4',
            pageOrientation: report.landscape ? 'landscape' : 'portrait',
            pageMargins: [36, Math.max(110, 70 + Math.ceil((report.companyName || '').length / 65) * 16 + Math.ceil((report.subtitle || '').length / 95) * 10), 36, 48],
            pageBreakBefore: (node, following) => !!node.id && node.id.startsWith('report-heading-') && !following.some(item => item.id && item.id.startsWith('report-account-')),
            defaultStyle: { font: 'Roboto', fontSize: report.landscape ? 7.5 : 9, color: `#${palette.ink}` },
            header: {
                margin: [36, 25, 36, 0],
                stack: [
                    { text: report.companyName, alignment: 'center', bold: true, color: `#${palette.accent}`, fontSize: (report.companyName || '').length > 100 ? 9 : 13 },
                    { canvas: [{ type: 'line', x1: 0, y1: 7, x2: contentWidth, y2: 7, lineWidth: 1 }] },
                    { text: report.title, alignment: 'center', bold: true, fontSize: 11, color: `#${palette.accent}`, margin: [0, 12, 0, 3] },
                    { text: report.subtitle, alignment: 'center', fontSize: 8, color: `#${palette.muted}` },
                    { margin: [0, 8, 0, 0], canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 0.7, lineColor: `#${palette.accent}` }] },
                ]
            },
            footer: (page, pages) => ({
                margin: [36, 5, 36, 0],
                stack: [
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 0.7 }] },
                    { margin: [0, 7, 0, 0], fontSize: 7, columns: [
                        { text: `Report printed on ${report.generatedAt}`, width: '*' },
                        { text: 'Topaz ERP · G/L', alignment: 'center', width: 120 },
                        { text: `Page ${page} of ${pages}`, alignment: 'right', width: 85 }
                    ]}
                ]
            }),
            content
        };
    }

    function createReportPdf(report, mode) {
        return new Promise((resolve, reject) => {
            if (!window.pdfMake) { reject(new Error('pdfmake is not loaded.')); return; }
            const definition = report.voucherRows ? voucherPdfDefinition(report) : reportPdfDefinition(report, mode);
            window.pdfMake.createPdf(definition).getBuffer(buffer => resolve(new Uint8Array(buffer)));
        });
    }

    async function createReportExcel(report, mode) {
        if (!window.ExcelJS) throw new Error('ExcelJS is not loaded.');
        if (report.voucherRows) return createVoucherExcel(report);

        const trial = report.id === 'trial-balance';
        const palette = reportPalette(trial ? 'monochrome' : (mode || 'color'));
        const book = new window.ExcelJS.Workbook();
        book.creator = 'Topaz ERP';
        const sheet = book.addWorksheet('Report', {
            pageSetup: { paperSize: 9, orientation: report.landscape ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:5' },
            views: [{ state: 'frozen', ySplit: 5 }]
        });
        sheet.pageSetup.blackAndWhite = mode === 'monochrome';
        const count = (report.columns || []).length;
        for (const text of [report.companyName, report.title, report.subtitle, `Report printed on ${report.generatedAt}`]) {
            const row = sheet.addRow([text]);
            sheet.mergeCells(row.number, 1, row.number, count);
            row.font = { bold: row.number <= 2, size: row.number <= 2 ? 13 : 9, color: { argb: `FF${row.number <= 2 ? palette.accent : palette.ink}` } };
            row.alignment = { wrapText: true };
            row.height = row.number === 3 ? 32 : 22;
        }
        sheet.getRow(4).eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: `FF${palette.accent}` } } }; });
        sheet.addRow((report.columns || []).map(col => col.title)).font = { bold: true };
        if (trial) {
            sheet.mergeCells('A5:B5');
            sheet.getCell('A5').value = 'General Ledger #';
            sheet.getRow(5).eachCell(cell => { cell.border = { bottom: { style: 'medium', color: { argb: 'FF000000' } } }; });
        }
        (report.columns || []).forEach((column, index) => {
            sheet.getColumn(index + 1).width = column.width;
            if (column.alignment) sheet.getColumn(index + 1).alignment = { horizontal: column.alignment };
        });
        for (const item of reportHierarchyRows(report)) {
            if (item.kind === 'heading') {
                const row = sheet.addRow([item.label]);
                sheet.mergeCells(row.number, 1, row.number, count);
                row.font = { bold: true, color: { argb: `FF${palette.accent}` } };
                row.alignment = { indent: Math.min(item.depth, 10), wrapText: true };
                if (trial) row.font = { ...row.font, underline: true };
                if (!trial && item.shaded) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${palette.fill}` } };
            } else {
                const detail = sheet.addRow(item.cells);
                if (item.fullWidth) sheet.mergeCells(detail.number, 1, detail.number, count);
                detail.font = { bold: item.emphasized, underline: item.grandTotal || undefined, color: { argb: `FF${palette.ink}` } };
                detail.alignment = { wrapText: true, vertical: 'top' };
                detail.eachCell((cell, index) => {
                    cell.numFmt = '@';
                    cell.alignment = { wrapText: true, vertical: 'top', horizontal: (report.columns[index - 1] && report.columns[index - 1].alignment) || 'left' };
                });
            }
        }
        sheet.headerFooter = {
            oddHeader: `&C${(report.companyName || '').replaceAll('&', '&&')}\n${(report.title || '').replaceAll('&', '&&')}`,
            oddFooter: `&LReport printed on ${(report.generatedAt || '').replaceAll('&', '&&')}&CTopaz ERP · G/L&RPage &P of &N`
        };
        sheet.pageSetup.printArea = `A1:${sheet.getColumn(count).letter}${sheet.rowCount}`;
        return new Blob([new Uint8Array(await book.xlsx.writeBuffer())], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    // ── Voucher Report Builder (BusinessDesk voucher-report.ts) ────────────
    const cell = (text, span, bold, align) => ({ text: String(text || ''), span: span || 1, bold: !!bold, align: align || 'left' });
    const dateStr = v => v ? (v.includes('T') ? v.slice(0, 10) : v) : '—';

    function buildVoucherReport(voucher, summary, companyName) {
        const isReceipt = !!(voucher.isReceipt || voucher.type === 'customer-receipt' || voucher.voucherType === 'customer');
        const currency  = voucher.currencyCode || 'GHS';
        const title     = isReceipt ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER';
        companyName     = companyName || voucher.companyName || 'Topaz ERP';

        const s = summary || {};
        const net    = parseFloat(s.net    || voucher.netAmount   || 0);
        const gross  = parseFloat(s.gross  || voucher.grossAmount || 0);

        const lines = voucher.details || voucher.lines || [];

        const rows = [
            { cells: [cell('Batch No.',1,true), cell(voucher.batchNo||voucher.batchNumber||'—',2), cell(title,2,true,'center'), cell('Voucher date',1,true), cell(dateStr(voucher.voucherEntryDate||voucher.entryDate))] },
            { cells: [cell(isReceipt?'Received from':'Pay to the order of',2,true), cell(voucher.supplierName||voucher.payeeName||voucher.customerName||voucher.employeeName||'—',5)] },
            { cells: [cell('The sum of',1,true), cell(voucherAmountInWords(net, currency),4), cell(`${currency} ${fmt(net)}`,2,true,'right')] },
            { cells: [cell('In settlement of the following:',7,true)] },
            { header: true, cells: [
                cell(isReceipt?'Receipt date':'Payment date',1,true),
                cell('WH?',1,true),
                cell('Invoice / Ref.',1,true),
                cell('Description',1,true),
                cell(isReceipt?'Credit G/L':'Debit G/L',1,true),
                cell(isReceipt?'Debit G/L':'Credit G/L',1,true),
                cell(`Amount · ${currency}`,1,true,'right'),
            ]},
        ];

        const bankGlName = voucher.bankGlAccountName || voucher.bankAccountName || '—';
        const txDate = dateStr(isReceipt ? voucher.receiptDate : (voucher.paymentDate || voucher.voucherEntryDate));

        lines.forEach(line => {
            const account = [line.accountNumber||line.debitAccountNumber, line.accountName||line.debitAccountName].filter(Boolean).join(' — ') || line.debitAccountId || '—';
            const lineAmt = parseFloat(line.localDebitAmount || line.amount || 0);
            const foreignAmt = parseFloat(line.foreignDebitAmount || line.foreignAmount || 0);
            const withHold = line.withHold || line.isWithHeld || false;
            rows.push({ cells: [
                cell(txDate),
                cell(isReceipt ? '—' : (withHold ? 'Yes' : 'No')),
                cell([line.invoiceNo||line.invoiceNumber, line.referenceNo||line.referenceNumber].filter(Boolean).join(' / ') || '—'),
                cell(line.description || voucher.description || '—'),
                cell(account),
                cell(bankGlName),
                cell(fmt(lineAmt) + (voucher.isMultiCurrency && foreignAmt ? `\n${currency} ${fmtForeign(foreignAmt)}` : ''), 1, false, 'right'),
            ]});
        });

        const getTaxInfo = (key) => {
            const map = {
                getfl: { prop: 'hasGetFundLevy', rateProp: 'getFundLevyRate', defaultRate: 2.5 },
                vat:   { prop: 'hasVat', rateProp: 'vatRate', defaultRate: 15 },
                vatWh: { prop: 'hasVatWithhold', rateProp: 'withHoldingVatPercentage', defaultRate: 7 },
                nhil:  { prop: 'hasNationalHealthInsuranceLevy', rateProp: 'nationalHealthInsuranceLevyRate', defaultRate: 2.5 },
                cst:   { prop: 'hasCommunicationServiceTax', rateProp: 'communicationServiceTaxRate', defaultRate: 5 },
                covid: { prop: 'hasCovidTax', rateProp: 'covidTaxRate', defaultRate: 1 },
            };
            const meta = map[key] || {};
            let enabled = false;
            let rate = meta.defaultRate || 0;

            if (voucher.taxFlags && Array.isArray(voucher.taxFlags)) {
                const f = voucher.taxFlags.find(x => x.key === key);
                if (f) { enabled = !!f.enabled; rate = f.rate || f.defaultRate || rate; }
            } else if (voucher[meta.prop] !== undefined) {
                enabled = !!voucher[meta.prop];
                if (voucher[meta.rateProp]) rate = parseFloat(voucher[meta.rateProp]);
            } else if (voucher.taxes && voucher.taxes[key]) {
                enabled = !!voucher.taxes[key].enabled;
                rate = voucher.taxes[key].rate || rate;
            }
            return { enabled, rate };
        };

        const nhilInfo  = getTaxInfo('nhil');
        const getflInfo = getTaxInfo('getfl');
        const vatInfo   = getTaxInfo('vat');
        const cstInfo   = getTaxInfo('cst');
        const covidInfo = getTaxInfo('covid');
        const vatWhInfo = getTaxInfo('vatWh');

        const hasWh  = !!(voucher.hasWithHolding || (voucher.withHoldingRate && parseFloat(voucher.withHoldingRate) > 0));
        const whRate = parseFloat(voucher.withHoldingRate || 5);

        const details = [
            ['Cheque No.',    voucher.chequeNo || voucher.chequeNumber || '—'],
            ['Bank account',  voucher.bankAccountName || bankGlName],
            ['Payment mode',  voucher.modePayment || voucher.modeOfPayment || '—'],
            ['Cost centers',  [...new Set((lines.map(l => l.ouName || l.organizationUnitName)).filter(Boolean))].join(', ') || '—'],
        ];

        if (voucher.isMultiCurrency) {
            details.push(['Foreign currency / rate', `${currency} / ${voucher.exchangeRate || voucher.sellRate || voucher.buyRate || ''}`]);
        }

        const totals = [
            ['Total invoice amount', fmt(gross)],
            [nhilInfo.enabled  ? `NHIL (${nhilInfo.rate}%)` : 'NHIL', fmt(s.nhil != null ? s.nhil : 0)],
            [getflInfo.enabled ? `GETFund levy (${getflInfo.rate}%)` : 'GETFund levy', fmt(s.getfund != null ? s.getfund : 0)],
            [vatInfo.enabled   ? `VAT (${vatInfo.rate}%)` : 'VAT', fmt(s.vat != null ? s.vat : 0)],
            [cstInfo.enabled   ? `CST (${cstInfo.rate}%)` : 'CST', fmt(s.cst != null ? s.cst : 0)],
            [covidInfo.enabled ? `COVID levy (${covidInfo.rate}%)` : 'COVID levy', fmt(s.covid != null ? s.covid : 0)],
            [hasWh             ? `Income withheld (${whRate}%)` : 'Income withheld', fmt(s.incomeWithholding != null ? s.incomeWithholding : (voucher.totalWithheld || 0))],
            [vatWhInfo.enabled ? `VAT withheld (${vatWhInfo.rate}%)` : 'VAT withheld', fmt(s.vatWithholding != null ? s.vatWithholding : (voucher.totalVatWithheld || 0))],
            ['Retention', fmt(s.retained != null ? s.retained : (voucher.totalRetained || 0))],
            [isReceipt ? 'Net received' : 'Net amount paid', fmt(net)],
        ];

        totals.forEach(([label, value], index) => {
            const detail = details[index];
            const isLast = index === totals.length - 1;
            rows.push({ cells: [
                cell(detail ? `${detail[0]}: ${detail[1]}` : '', 4),
                cell(label, 2, isLast),
                cell(value, 1, isLast, 'right'),
            ]});
        });

        const retentions = voucher.retensions || voucher.retentions || [];
        if (retentions.length) {
            rows.push({ cells: [cell('Retention details', 7, true)] });
            retentions.forEach(r => {
                rows.push({ cells: [
                    cell(r.description || 'Retention', 3),
                    cell(`${r.IsPercentage || r.isPercentage ? `${r.amount}%` : 'Fixed'} · ${[r.accountNumber, r.accountName].filter(Boolean).join(' — ') || '—'}`, 3),
                    cell(fmt(r.totalAmount), 1, false, 'right'),
                ]});
            });
        }

        const voucherNo = voucher.voucherNo || voucher.voucherNumber || voucher.batchNo || '';
        const subtitleParts = [
            `Voucher ${voucherNo}`,
            voucher.status && voucher.status.toLowerCase() !== 'draft' ? voucher.status : '',
            `Currency: ${currency}`,
        ].filter(Boolean);

        return {
            id: `voucher-${voucherNo || voucher.id || 'preview'}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
            title,
            companyName,
            subtitle: subtitleParts.join(' · '),
            generatedAt: new Date().toLocaleString('en-GH', { dateStyle: 'long', timeStyle: 'short' }),
            columns: [],
            sections: [{ title: '', rows: lines.map(l => [l.description || '']) }],
            landscape: true,
            voucherRows: rows,
        };
    }

    const colWidths = ['12%','6%','12%','22%','16%','16%','16%'];

    function voucherPdfDefinition(report) {
        const rows = report.voucherRows.map(row => {
            const result = [];
            for (const item of row.cells) {
                result.push({
                    text: item.text,
                    colSpan: item.span || 1,
                    bold: item.bold,
                    alignment: item.align,
                    margin: [3, 4, 3, 4],
                    fillColor: row.header ? '#eeeeee' : undefined,
                });
                for (let n = 1; n < (item.span || 1); n++) result.push({});
            }
            return result;
        });

        return {
            info: { title: report.title, author: report.companyName, creator: 'Topaz ERP' },
            pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [30, 65, 30, 38],
            defaultStyle: { font: 'Roboto', fontSize: 8, color: '#171717' },
            header: { margin: [30, 16, 30, 0], stack: [
                { text: report.companyName, bold: true, fontSize: 12, alignment: 'center' },
                { text: report.subtitle, fontSize: 8, alignment: 'center', margin: [0, 4, 0, 0] },
            ]},
            footer: (page, pages) => ({ text: `Page ${page} of ${pages}`, alignment: 'right', margin: [30, 10, 30, 0], fontSize: 8 }),
            content: [{
                table: { headerRows: 5, widths: colWidths, body: rows, dontBreakRows: true },
                layout: { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => '#555555', vLineColor: () => '#555555' },
            }],
        };
    }

    function createVoucherPdf(report) {
        return new Promise((resolve, reject) => {
            if (!window.pdfMake) { reject(new Error('pdfmake is not loaded on the page.')); return; }
            const definition = voucherPdfDefinition(report);
            window.pdfMake.createPdf(definition).getBuffer(buffer => resolve(new Uint8Array(buffer)));
        });
    }

    async function createVoucherExcel(report) {
        if (!window.ExcelJS) throw new Error('ExcelJS is not loaded on the page.');
        const book = new window.ExcelJS.Workbook();
        book.creator = 'Topaz ERP';
        const sheet = book.addWorksheet('Voucher', {
            pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:7' }
        });
        const widths = [12, 6, 12, 22, 16, 16, 16];
        sheet.columns = widths.map(w => ({ width: w * 1.15 }));

        for (const title of [report.companyName, report.subtitle]) {
            const row = sheet.addRow([title]);
            sheet.mergeCells(row.number, 1, row.number, 7);
            row.font = { bold: true, size: row.number === 1 ? 14 : 9 };
            row.alignment = { horizontal: 'center', wrapText: true };
            row.height = 24;
        }

        for (const entry of report.voucherRows) {
            const row = sheet.addRow([]); let col = 1;
            for (const item of entry.cells) {
                const span = item.span || 1;
                if (span > 1) sheet.mergeCells(row.number, col, row.number, col + span - 1);
                const target = row.getCell(col);
                target.value = item.text; target.numFmt = '@';
                target.font  = { bold: !!item.bold, size: 10 };
                target.alignment = { horizontal: item.align || 'left', vertical: 'middle', wrapText: true };
                if (entry.header) target.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
                for (let i = col; i < col + span; i++)
                    row.getCell(i).border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
                col += span;
            }
            const lines = entry.cells.reduce((max, item) => Math.max(max, Math.ceil(item.text.length / 20)), 1);
            row.height = Math.min(409, Math.max(24, lines * 14 + 8));
        }

        sheet.pageSetup.printArea = `A1:G${sheet.rowCount}`;
        return new Blob([new Uint8Array(await book.xlsx.writeBuffer())], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    function createVoucherWord(report) {
        let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #171717; }
  h1 { font-size: 13pt; text-align: center; margin: 0; color: #176B53; }
  p.sub { font-size: 8pt; text-align: center; margin: 4px 0 14px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #555555; padding: 4px 6px; font-size: 8.5pt; vertical-align: middle; }
  th { background-color: #eeeeee; font-weight: bold; }
</style></head><body>`;
        html += `<h1>${report.companyName}</h1>`;
        html += `<p class="sub">${report.subtitle}</p>`;
        html += `<table>`;
        for (const row of report.voucherRows) {
            html += `<tr>`;
            for (const item of row.cells) {
                const span = item.span > 1 ? ` colspan="${item.span}"` : '';
                const bold = item.bold ? 'font-weight:bold;' : '';
                const align = item.align ? `text-align:${item.align};` : '';
                const bg = row.header ? 'background-color:#eeeeee;' : '';
                html += `<td${span} style="${bold}${align}${bg}">${(item.text || '').replace(/\n/g, '<br>')}</td>`;
            }
            html += `</tr>`;
        }
        html += `</table></body></html>`;
        return Promise.resolve(new Blob(['\ufeff' + html], { type: 'application/msword' }));
    }

    // ── Expose API on window ────────────────────────────────────────────────
    global.TopazReportViewer = {
        voucherAmountInWords,
        buildVoucherReport,
        voucherPdfDefinition,
        createVoucherPdf,
        createVoucherExcel,
        createVoucherWord,
        reportPalette,
        reportHierarchyRows,
        reportPdfDefinition,
        createReportPdf,
        createReportExcel,
    };

})(globalThis);

"use strict";

/*
 * =====================================================================
 * report-viewer-vue.js — Vue 3 (CDN / global build) component for the
 * Wanmei Report Designer viewer.
 *
 * Bundles Report Viewer engine v1.3.0 + a Vue Options API component.
 *
 * USAGE (auto-registered with Vue 3 CDN):
 *   <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
 *   <script src="report-viewer-vue.js"></script>
 *
 *   <div id="app">
 *     <report-viewer
 *       ref="reportViewer"
 *       :template="reportTemplate"
 *       :data="reportData"
 *       :options="reportOptions"
 *       @ready="onReportReady"
 *       @error="onReportError"
 *     ></report-viewer>
 *   </div>
 *
 *   createApp({ ... }).mount('#app')  // auto-registers <report-viewer>
 *
 * Manual registration:
 *   app.component('report-viewer', window.ReportViewerComponent)
 *
 * Imperative API (via template ref):
 *   print(), setData(d), setTemplate(t), loadTemplate(url),
 *   goToPage(i), setZoom(z), fitWidth(), render(), destroy(), getViewer()
 *
 * Also exposes window.ReportViewer / window.rv (standalone, no Vue).
 * =====================================================================
 */

(function (global) {
    "use strict";

    var RV = { version: "1.3.6" };

    /* =============================================================
       CSS (injected once, so the library is one <script> tag)
    ============================================================= */
    var RV_CSS = [
        ".rv-viewer{--rv-border:#d1d5db;--rv-muted:#6b7280;--rv-accent:#2563eb;--rv-max-height:calc(120vh - 120px);font-family:system-ui,-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif;color:#111827;background:#d1d5db;border:1px solid var(--rv-border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;margin-top:10px;max-height:var(--rv-max-height);}",
        ".rv-toolbar{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fff;border-bottom:1px solid #e5e7eb;flex-wrap:wrap;position:sticky;top:0;}",
        ".rv-toolbar .rv-brand{font-weight:800;font-size:12px;color:#1f2937;margin-right:auto;}",
        ".rv-toolbar .rv-btn{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:6px 11px;font-size:12px;cursor:pointer;color:#334155;font-family:inherit;}",
        ".rv-toolbar .rv-btn:hover{background:#f3f4f6;}",
        ".rv-toolbar .rv-btn.rv-primary{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:700;}",
        ".rv-toolbar .rv-btn:disabled{opacity:.4;cursor:default;}",
        ".rv-pages{padding:26px 34px 60px;overflow:auto;flex:1;min-height:0;overscroll-behavior:contain;}",
        ".rv-page-shell{margin:0 auto 34px;}",
        ".rv-page-label{font-size:11.5px;color:#6b7280;margin-bottom:7px;font-weight:700;letter-spacing:.03em;text-align:center;}",
        ".rv-page{position:relative;background:#fff;box-shadow:0 14px 34px rgba(0,0,0,.18);overflow:hidden;transform-origin:top left;}",
        ".rv-element{position:absolute;user-select:none;z-index:1;}",
        ".rv-content{width:100%;height:100%;overflow:hidden;}",
        ".rv-element.rv-table-host{height:auto;}",
        ".rv-element.rv-table-host .rv-content{height:auto;overflow:visible;}",
        ".rv-img-placeholder{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9ca3af;font-size:13px;font-weight:700;background:rgba(243,244,246,.4);border:2px dashed #d1d5db;border-radius:6px;text-align:center;padding:4px;}",
        ".rv-empty{display:flex;align-items:center;justify-content:center;min-height:220px;color:var(--rv-muted);font-size:13px;text-align:center;padding:24px;}",
        ".rv-nav{display:flex;align-items:center;gap:6px;}",
        ".rv-nav .rv-page-indicator{font-size:11.5px;color:var(--rv-muted);min-width:78px;text-align:center;font-weight:700;}",
        ".rv-sticky-header{position:fixed;z-index:1200;display:none;pointer-events:none;}",
        ".rv-sticky-header.rv-sticky-on{display:block;}",
        ".rv-sticky-header .rv-sticky-inner{position:relative;background:#fff;transform-origin:top left;box-shadow:0 12px 28px -14px rgba(15,23,42,.4);border-bottom:1px solid rgba(15,23,42,.14);}",
        ".rv-table{width:100%;height:100%;border-collapse:collapse;table-layout:fixed;}",
        ".rv-table th,.rv-table td{border:1px solid #374151;padding:5px 6px;font-size:12px;overflow:hidden;text-overflow:clip;white-space:normal !important;word-break:break-word;overflow-wrap:break-word;}",
        ".rv-table th{background:#f3f4f6;font-weight:700;}",
        ".rv-group-row td{letter-spacing:.01em;}",
        ".rv-group-total-cell{font-weight:600;white-space:normal;}",
        ".rv-subtotal-row td,.rv-grand-total-row td{white-space:normal;}",
        ".report-viewer-root{width:100%;min-height:120px;box-sizing:border-box;}",
        /* ---- screen-only chrome (toolbar stays interactive on screen) ---- */
        /* ---- print: aggressively isolate the report from host layout CSS ---- */
        "@media print{",
        "  @page{margin:0;}",
        "  html,body{background:#fff !important;margin:0 !important;padding:0 !important;width:auto !important;height:auto !important;min-height:0 !important;max-width:none !important;overflow:visible !important;}",
        "  /* Hide everything that is not on the marked ancestor chain to the viewer */",
        "  body *{visibility:hidden !important;}",
        "  .rv-print-ancestor,.rv-print-ancestor *,.rv-viewer,.rv-viewer *{visibility:visible !important;}",
        "  body > :not(.rv-print-ancestor):not(.rv-viewer){display:none !important;}",
        "  .rv-print-ancestor{display:block !important;position:static !important;float:none !important;clear:none !important;margin:0 !important;padding:0 !important;border:none !important;box-shadow:none !important;outline:none !important;background:#fff !important;background-image:none !important;max-width:none !important;max-height:none !important;min-width:0 !important;min-height:0 !important;width:auto !important;height:auto !important;overflow:visible !important;transform:none !important;inset:auto !important;top:auto !important;left:auto !important;right:auto !important;bottom:auto !important;flex:none !important;grid-area:auto !important;}",
        "  .rv-print-ancestor > *:not(.rv-print-ancestor):not(.rv-viewer):not(.report-viewer-root){display:none !important;}",
        "  .report-viewer-root{display:block !important;margin:0 !important;padding:0 !important;border:none !important;width:auto !important;height:auto !important;min-height:0 !important;max-width:none !important;background:transparent !important;}",
        "  .rv-viewer{display:block !important;border:none !important;border-radius:0 !important;background:#fff !important;box-shadow:none !important;margin:0 !important;padding:0 !important;overflow:visible !important;width:auto !important;height:auto !important;max-width:none !important;max-height:none !important;min-height:0 !important;position:static !important;transform:none !important;}",
        "  .rv-toolbar,.rv-page-label{display:none !important;}",
        "  .rv-sticky-header{display:none !important;}",
        "  .rv-pages{display:block !important;padding:0 !important;margin:0 !important;background:#fff !important;overflow:visible !important;width:auto !important;height:auto !important;flex:none !important;}",
        "  .rv-page-shell{display:block !important;margin:0 !important;padding:0 !important;width:auto !important;height:auto !important;max-width:none !important;overflow:visible !important;}",
        "  .rv-page{display:block !important;position:relative !important;transform:none !important;box-shadow:none !important;margin:0 auto !important;padding:0 !important;overflow:visible !important;break-after:page;page-break-after:always;break-inside:avoid-page;}",
        "  .rv-page:last-child{break-after:auto;page-break-after:auto;}",
        "  .rv-element{overflow:visible !important;}",
        "  .rv-table{height:auto !important;}",
        "  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}",
        "}"
    ].join("\n");

    function rvInjectCss() {
        if (document.getElementById("rv-styles")) return;
        var style = document.createElement("style");
        style.id = "rv-styles";
        style.textContent = RV_CSS;
        document.head.appendChild(style);
    }

    /* =============================================================
       GEOMETRY + UTILITIES
    ============================================================= */
    var PAGE_MM = { A4: { w: 210, h: 297 }, A5: { w: 148, h: 210 }, Letter: { w: 215.9, h: 279.4 } };

    function mmToPx(mm) { return Math.round(mm * 96 / 25.4); }

    function getPageMm(template) {
        var dims = PAGE_MM[(template.page && template.page.size) || "A4"] || PAGE_MM.A4;
        return (template.page && template.page.orientation) === "landscape"
            ? { w: dims.h, h: dims.w }
            : { w: dims.w, h: dims.h };
    }

    function getPagePx(template) {
        var mm = getPageMm(template);
        return { w: mmToPx(mm.w), h: mmToPx(mm.h) };
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatTitle(value) {
        return String(value)
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, function (c) { return c.toUpperCase(); })
            .trim();
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    /* ---------- data access (dotted paths, first item of arrays) ---------- */
    function rvRawPath(object, path) {
        if (path === "" || path === null || path === undefined) return object;
        var normalized = String(path)
            .replace(/\[(\d+)\]/g, ".$1")
            .replace(/^\./, "");
        var parts = normalized.split(".").filter(Boolean);
        var current = object;
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            current = current[parts[i]];
        }
        return current;
    }

    /* Array-aware path resolution for FIELD elements and text tokens:
       details[].Aggregate, details[0].Aggregate and details.Aggregate all
       resolve to the FIRST item's value, so reports can show single values
       from arrays without a table. */
    function rvRawPathFirst(object, path) {
        if (!path) return undefined;
        var normalized = String(path)
            .replace(/\[(\d+)\]/g, ".$1")
            .replace(/^\./, "");
        var parts = normalized.split(".").filter(Boolean);
        var current = object;
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            var part = parts[i];
            if (Array.isArray(current)) {
                if (!current.length) return undefined;
                if (/^\d+$/.test(part)) {
                    var index = Number(part);
                    if (!current[index]) return undefined;
                    current = current[index];
                    continue;
                }
                current = current[0]; // fall through: apply part to item 0
            }
            if (part.indexOf("[]") !== -1) {
                var key = part.slice(0, -2);
                if (!Array.isArray(current[key]) || !current[key].length) return undefined;
                current = current[key][0];
            } else {
                current = current[part];
            }
        }
        return current;
    }

    function getDataValue(data, path) {
        if (!data) return "";
        var value = rvRawPathFirst(data, path);
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    }

    function getArrayValue(data, path) {
        if (!data) return [];
        var value = rvRawPath(data, path);
        return Array.isArray(value) ? value : [];
    }

    function rvGetFirstDataValue(data, path) {
        if (!data || !path) return "";
        var parts = String(path).split(".");
        var current = data;
        if (Array.isArray(current)) current = current[0];
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return "";
            var part = parts[i];
            if (part.indexOf("[]") !== -1) {
                var key = part.slice(0, -2);
                if (!Array.isArray(current[key]) || !current[key].length) return "";
                current = current[key][0];
            } else {
                current = current[part];
            }
        }
        if (current === null || current === undefined || typeof current === "object") return "";
        return String(current);
    }

    /* Image source detection & normalisation (mirrors the designer's
       image-data-url.js patch): data URIs, raw base64 (magic bytes →
       MIME), inline SVG markup, URLs and paths all become <img src>. */
    var RV_BASE64_MAGIC = [
        ["iVBORw0KGgo", "image/png"],
        ["/9j/", "image/jpeg"],
        ["R0lGOD", "image/gif"],
        ["UklGR", "image/webp"],
        ["Qk", "image/bmp"],
        ["AAAB", "image/x-icon"],
        ["SUkq", "image/tiff"],
        ["PHN2Zy", "image/svg+xml"],
        ["PD94bWwg", "image/svg+xml"]
    ];

    function rvBase64Mime(b64) {
        for (var i = 0; i < RV_BASE64_MAGIC.length; i++) {
            if (b64.indexOf(RV_BASE64_MAGIC[i][0]) === 0) return RV_BASE64_MAGIC[i][1];
        }
        return null;
    }

    function rvLooksLikeBase64(value) {
        var s = String(value).replace(/\s+/g, "");
        if (s.length < 16) return false;
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return false;
        if (s.length % 4 !== 0) return false;
        if (s.indexOf("/") !== -1) {
            return /={1,2}$/.test(s) || !!rvBase64Mime(s);
        }
        return true;
    }

    function rvSourceKind(value) {
        if (typeof value !== "string") return "none";
        var v = value.trim();
        if (!v) return "none";
        if (/^data:/i.test(v)) return "datauri";
        if (/^(https?:|blob:|file:|\/\/)/i.test(v)) return "url";
        if (/^<svg[\s>]/i.test(v) && /<\/svg>/i.test(v)) return "svg";
        if (rvLooksLikeBase64(v)) return "base64";
        if (/^\.{0,2}\//.test(v)) return "path";
        if (/^(?:[^:\s]*\/)[^\/\s:]+$/.test(v)) return "path";
        if (/\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)([?#]|$)/i.test(v)) return "path";
        return "none";
    }

    function rvNormalizeImageSource(value) {
        if (typeof value !== "string") return "";
        var v = value.trim();
        if (!v) return "";
        var kind = rvSourceKind(v);
        if (kind === "svg") return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(v);
        if (kind === "base64") {
            var clean = v.replace(/\s+/g, "");
            return "data:" + (rvBase64Mime(clean) || "image/png") + ";base64," + clean;
        }
        if (kind === "datauri" || kind === "url" || kind === "path") return v;
        return "";
    }

    function guessFormat(value) { return typeof value === "number" ? "number" : "none"; }

    /* ---------- value formatting (ported from main.js) ---------- */
    function formatNumber(n, decimals) {
        var dec = Math.max(0, Math.min(12, Math.round(Number(decimals) || 0)));
        return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }

    function formatDateValue(value, kind) {
        if (value === "" || value === null || value === undefined) return "";
        var d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) return String(value);
        if (kind === "iso") return d.toISOString().slice(0, 10);
        if (kind === "long") {
            return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        }
        if (kind === "datetime" || kind === "time") {
            return d.toLocaleString(undefined, {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
        }
        return d.toLocaleDateString();
    }

    function formatValue(value, fmt, decimals) {
        if (value === "" || value === null || value === undefined) return "";
        fmt = fmt || "none";
        if (fmt === "number" || fmt === "currency" || fmt === "percent") {
            var n = Number(value);
            if (!isNaN(n)) {
                if (fmt === "number") return formatNumber(n, decimals);
                if (fmt === "currency") return "$" + formatNumber(n, decimals === undefined ? 2 : decimals);
                if (fmt === "percent") return formatNumber(n, decimals) + "%";
            }
        }
        if (fmt === "date") return formatDateValue(value, "short");
        if (fmt === "datetime") return formatDateValue(value, "datetime");
        if (fmt === "iso") return formatDateValue(value, "iso");
        if (fmt === "long") return formatDateValue(value, "long");
        return String(value);
    }

    function formatCurrentDate(fmt) {
        return formatDateValue(new Date(), fmt || "short");
    }

    function formatPagePattern(pattern, pageIndex, totalPages) {
        var n = pageIndex + 1;
        return String(pattern || "Page {n} of {total}")
            .replace(/\{n\}/g, String(n))
            .replace(/\{total\}/g, String(totalPages))
            .replace(/\{page\}/g, String(n))
            .replace(/\{pages\}/g, String(totalPages));
    }

    function resolveTokens(text, data, pageIndex, totalPages) {
        var n = pageIndex + 1;
        return String(text == null ? "" : text)
            .replace(/\{\{\s*page\s*\}\}/gi, String(n))
            .replace(/\{\{\s*pages\s*\}\}/gi, String(totalPages))
            .replace(/\{\{\s*date\s*\}\}/gi, formatCurrentDate("short"))
            .replace(/\{\{\s*([^}]+)\s*\}\}/g, function (_, path) { return getDataValue(data, path.trim()); });
    }

    /* =============================================================
       TEMPLATE PARSING
    ============================================================= */
    function parseTemplate(input) {
        var template = input;
        if (typeof input === "string") {
            var trimmed = input.trim();
            if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
                template = JSON.parse(trimmed);
            } else {
                var match = trimmed.match(/<!--REPORT-DESIGNER-TEMPLATE\s*([\s\S]*?)\s*-->/);
                if (!match) {
                    throw new Error("ReportViewer: not a template object, JSON string, or exported HTML document.");
                }
                template = JSON.parse(match[1]);
            }
        }
        if (!template || typeof template !== "object") {
            throw new Error("ReportViewer: template is empty or invalid.");
        }
        template = deepClone(template);
        if (!Array.isArray(template.pages) || !template.pages.length) template.pages = ["pg-1"];
        if (!template.page) template.page = { size: "A4", orientation: "portrait" };
        if (!Array.isArray(template.elements)) template.elements = [];
        template.elements.forEach(function (el) {
            if (!el.band) el.band = "body";
            if (el.type === "field" && el.decimals === undefined) el.decimals = 2;
            if (el.type === "table") rvEnsureTableDefaults(el);
        });
        return template;
    }

    /* =============================================================
       ADVANCED TABLE RENDERER
       (ported from advanced-table.js — rendering only, no editing;
        totals, labels, grouping and pagination behave identically)
    ============================================================= */
    var RV_AGGREGATES = [
        { v: "sum", l: "Sum" },
        { v: "avg", l: "Average" },
        { v: "min", l: "Minimum" },
        { v: "max", l: "Maximum" },
        { v: "count", l: "Count" }
    ];

    function rvDefault(value, fallback) {
        return value === undefined || value === null ? fallback : value;
    }

    function rvEnsureTableDefaults(el) {
        if (!el || el.type !== "table") return el;

        el.fontFamily = el.fontFamily || "Arial, Helvetica, sans-serif";

        el.outerBorder = rvDefault(el.outerBorder, true);
        el.outerBorderStyle = el.outerBorderStyle || "solid";
        el.outerBorderWidth = rvDefault(el.outerBorderWidth, 1);
        el.outerBorderColor = el.outerBorderColor || el.borderColor || "#374151";

        el.rowBorders = rvDefault(el.rowBorders, true);
        el.rowBorderStyle = el.rowBorderStyle || "solid";
        el.rowBorderWidth = rvDefault(el.rowBorderWidth, 1);
        el.rowBorderColor = el.rowBorderColor || el.borderColor || "#374151";

        el.columnBorders = rvDefault(el.columnBorders, true);
        el.columnBorderStyle = el.columnBorderStyle || "solid";
        el.columnBorderWidth = rvDefault(el.columnBorderWidth, 1);
        el.columnBorderColor = el.columnBorderColor || el.borderColor || "#374151";

        el.showIndex = rvDefault(el.showIndex, false);
        el.indexTitle = rvDefault(el.indexTitle, "#");
        el.indexMode = el.indexMode || "continuous";
        el.indexStart = rvDefault(el.indexStart, 1);
        el.indexWidth = rvDefault(el.indexWidth, 46);

        el.groupingMode = el.groupingMode || "none";
        el.groupBy = el.groupBy || "";
        el.childPath = el.childPath || "";
        el.parentLabelField = el.parentLabelField || "";
        el.groupLabelPrefix = el.groupLabelPrefix || "";
        el.repeatGroupHeader = rvDefault(el.repeatGroupHeader, true);
        el.showGroupHeaderTotals = rvDefault(el.showGroupHeaderTotals, true);
        el.showGroupSubtotals = rvDefault(el.showGroupSubtotals, true);
        el.showGrandTotals = rvDefault(el.showGrandTotals, true);
        el.groupHeaderBackground = el.groupHeaderBackground || "#e5e7eb";
        el.groupHeaderColor = el.groupHeaderColor || "#111827";
        el.subtotalBackground = el.subtotalBackground || "#f3f4f6";
        el.grandTotalBackground = el.grandTotalBackground || "#dbeafe";

        el.subtotalLabelMode = el.subtotalLabelMode || "group";
        el.subtotalLabelText = el.subtotalLabelText || "Subtotal";
        el.subtotalLabelColumn = rvDefault(el.subtotalLabelColumn, -1);
        el.grandTotalLabelMode = el.grandTotalLabelMode || "kind";
        el.grandTotalLabelText = el.grandTotalLabelText || "Grand Total";
        el.grandTotalLabelColumn = rvDefault(el.grandTotalLabelColumn, -1);

        el.headerBorders = el.headerBorders || { top: "inherit", right: "inherit", bottom: "inherit", left: "inherit" };
        el.headerBorderStyle = el.headerBorderStyle || "";
        el.headerBorderWidth = rvDefault(el.headerBorderWidth, 1);
        el.headerBorderColor = el.headerBorderColor || el.borderColor || "#374151";
        if (!Array.isArray(el.rowBorderOverrides)) el.rowBorderOverrides = [];

        if (!Array.isArray(el.columns)) el.columns = [];
        el.columns.forEach(function (column) {
            if (!Array.isArray(column.aggregates)) {
                column.aggregates = column.aggregate ? [column.aggregate] : [];
            }
            column.leftBorder = column.leftBorder || "inherit";
            column.rightBorder = column.rightBorder || "inherit";
            column.borderStyle = column.borderStyle || "inherit";
            column.borderWidth = rvDefault(column.borderWidth, 1);
            column.borderColor = column.borderColor || el.columnBorderColor;
            column.textColor = column.textColor || "";
            column.backgroundColor = column.backgroundColor || "";
            column.headerBackground = column.headerBackground || "";
            column.headerColor = column.headerColor || "";
        });

        return el;
    }

    function rvSourceRows(el, data) {
        if (el.dataSource) {
            var rows = getArrayValue(data, el.dataSource);
            return Array.isArray(rows) ? rows : [];
        }
        return Array.isArray(el.manualRows) ? el.manualRows : [];
    }

    function rvChildRows(parent, childPath) {
        var rows = rvRawPath(parent, childPath);
        return Array.isArray(rows) ? rows : [];
    }

    function rvInferColumns(el, sourceRows) {
        if (el.columns.length) return el.columns;
        var sample = null;

        if (el.groupingMode === "nested" && el.childPath) {
            for (var i = 0; i < sourceRows.length && !sample; i++) {
                var children = rvChildRows(sourceRows[i], el.childPath);
                if (children.length) sample = children[0];
            }
        } else if (sourceRows.length) {
            sample = sourceRows[0];
        }

        if (sample && typeof sample === "object" && !Array.isArray(sample)) {
            el.columns = Object.keys(sample).map(function (key) {
                return {
                    field: key,
                    title: formatTitle(key),
                    width: "",
                    align: "left",
                    format: guessFormat(sample[key]),
                    decimals: 2,
                    prefix: "",
                    suffix: "",
                    aggregates: [],
                    leftBorder: "inherit",
                    rightBorder: "inherit",
                    borderStyle: "inherit",
                    borderWidth: 1,
                    borderColor: el.columnBorderColor
                };
            });
        }
        return el.columns;
    }

    function rvValueForDataRow(dataRow, column, columnIndex, el) {
        var data = dataRow.data;
        var parent = dataRow.parent;
        var field = String(column.field || "");

        // Expression column: compute the cell value with the row as context.
        if (column && column.expression) {
            try {
                return rxeEvaluateString(column.expression, rxeMakeContext(data, RV_CURRENT_DATA));
            } catch (e) {
                return "! " + (e.message || String(e));
            }
        }

        if (!el.dataSource && Array.isArray(data)) return data[columnIndex] != null ? data[columnIndex] : "";

        if (field.indexOf("parent.") === 0) return rvRawPath(parent, field.slice(7));
        if (field === "parent") return parent;
        if (field.indexOf("child.") === 0) return rvRawPath(data, field.slice(6));
        if (field === "child") return data;

        var value = rvRawPath(data, field);
        if (value === undefined && parent) value = rvRawPath(parent, field);
        return value;
    }

    function rvGroupKeyForRow(rawRow, el, columns) {
        if (!el.dataSource && Array.isArray(rawRow)) {
            var columnIndex = -1;
            for (var ci = 0; ci < columns.length; ci++) {
                if (columns[ci].field === el.groupBy) { columnIndex = ci; break; }
            }
            return columnIndex >= 0 ? rawRow[columnIndex] : "";
        }
        return rvRawPath(rawRow, el.groupBy);
    }

    function rvAggregateTypes(el) {
        var selected = {};
        el.columns.forEach(function (column) {
            (column.aggregates || []).forEach(function (kind) { selected[kind] = true; });
        });
        return RV_AGGREGATES.map(function (item) { return item.v; }).filter(function (kind) { return selected[kind]; });
    }

    function rvBuildLogicalRows(el, data) {
        rvEnsureTableDefaults(el);
        var sourceRows = rvSourceRows(el, data);
        var columns = rvInferColumns(el, sourceRows);
        var aggregateTypes = rvAggregateTypes(el);
        var logicalRows = [];
        var allDataRows = [];
        var displayIndex = 0;

        function makeData(raw, parent, sourceIndex, groupIndex, groupKey) {
            var row = {
                kind: "data",
                data: raw,
                parent: parent || null,
                sourceIndex: sourceIndex,
                groupDataIndex: groupIndex,
                groupKey: groupKey,
                globalDataIndex: displayIndex++
            };
            allDataRows.push(row);
            return row;
        }

        function addSummaryRows(scope, dataRows, groupKey, groupValue) {
            aggregateTypes.forEach(function (aggregate) {
                logicalRows.push({
                    kind: "summary",
                    scope: scope,
                    aggregate: aggregate,
                    dataRows: dataRows.slice(),
                    groupKey: groupKey,
                    groupValue: groupValue
                });
            });
        }

        if (el.groupingMode === "nested" && el.dataSource && el.childPath) {
            sourceRows.forEach(function (parent, parentIndex) {
                var children = rvChildRows(parent, el.childPath);
                var labelValue = el.parentLabelField ? rvRawPath(parent, el.parentLabelField) : (parentIndex + 1);
                var groupValue = labelValue === null || labelValue === undefined ? "" : String(labelValue);
                var label = (el.groupLabelPrefix || "") + groupValue;
                var groupKey = "parent-" + parentIndex;
                var groupData = [];

                children.forEach(function (child, childIndex) {
                    var row = makeData(child, parent, childIndex, childIndex, groupKey);
                    groupData.push(row);
                });

                logicalRows.push({
                    kind: "group",
                    label: label,
                    groupKey: groupKey,
                    parent: parent,
                    count: children.length,
                    dataRows: groupData.slice(),
                    groupValue: groupValue
                });
                groupData.forEach(function (row) { logicalRows.push(row); });

                if (el.showGroupSubtotals && aggregateTypes.length && groupData.length) {
                    addSummaryRows("group", groupData, groupKey, groupValue);
                }
            });
        } else if (el.groupingMode === "field" && el.groupBy) {
            var groups = [];
            var groupMap = {};
            sourceRows.forEach(function (raw, sourceIndex) {
                var rawKey = rvGroupKeyForRow(raw, el, columns);
                var mapKey = typeof rawKey + "::" + String(rawKey === null || rawKey === undefined ? "" : rawKey);
                if (!groupMap[mapKey]) {
                    var labelValue = rawKey === null || rawKey === undefined ? "(empty)" : String(rawKey);
                    groupMap[mapKey] = { label: labelValue, rows: [], mapKey: mapKey };
                    groups.push(groupMap[mapKey]);
                }
                groupMap[mapKey].rows.push({ raw: raw, sourceIndex: sourceIndex });
            });

            groups.forEach(function (group) {
                var mapKey = group.mapKey;
                var groupValue = group.label;
                var groupData = group.rows.map(function (item, groupIndex) {
                    return makeData(item.raw, null, item.sourceIndex, groupIndex, mapKey);
                });
                logicalRows.push({
                    kind: "group",
                    label: (el.groupLabelPrefix || "") + group.label,
                    groupKey: mapKey,
                    count: group.rows.length,
                    dataRows: groupData.slice(),
                    groupValue: groupValue
                });
                groupData.forEach(function (row) { logicalRows.push(row); });

                if (el.showGroupSubtotals && aggregateTypes.length && groupData.length) {
                    addSummaryRows("group", groupData, mapKey, groupValue);
                }
            });
        } else {
            sourceRows.forEach(function (raw, sourceIndex) {
                logicalRows.push(makeData(raw, null, sourceIndex, sourceIndex, null));
            });
        }

        if (el.showGrandTotals && aggregateTypes.length && allDataRows.length) {
            addSummaryRows("grand", allDataRows, null, null);
        }

        return {
            sourceRows: sourceRows,
            columns: columns,
            logicalRows: logicalRows,
            dataRows: allDataRows
        };
    }

    /* -------------------------------------------------------------
       MEASUREMENT + PAGINATION
    ------------------------------------------------------------- */
    function rvMeasureTable(el, data, width) {
        rvEnsureTableDefaults(el);
        var model = rvBuildLogicalRows(el, data);
        var host = document.createElement("div");
        host.className = "rv-table-measure";
        host.style.cssText =
            "position:absolute;left:-100000px;top:0;visibility:hidden;" +
            "pointer-events:none;width:" + Math.max(20, width) + "px;height:auto;overflow:visible;";
        document.body.appendChild(host);
        rvRenderAdvancedTable(host, el, data, { model: model, forceAll: true });

        var table = host.querySelector("table");
        var headerHeight = table && table.tHead && table.tHead.rows.length
            ? Math.ceil(table.tHead.getBoundingClientRect().height)
            : 0;
        var rowHeights = table && table.tBodies.length
            ? Array.prototype.map.call(table.tBodies[0].rows, function (row) {
                return Math.max(1, Math.ceil(row.getBoundingClientRect().height));
            })
            : [];
        host.remove();

        var naturalHeight = headerHeight + (rowHeights.length ? rowHeights.reduce(function (a, b) { return a + b; }, 0) : 0);
        return {
            headerHeight: headerHeight,
            rowHeights: rowHeights,
            naturalHeight: naturalHeight,
            model: model
        };
    }

    function rvComputeFragments(logicalRows, rowHeights, headerHeight, opts) {
        if (!logicalRows.length) {
            return [{ rowStart: 0, rowCount: 0, repeatGroupRow: null, height: 24, empty: true }];
        }
        var fragments = [];
        var start = 0;
        var fragmentIndex = 0;
        while (start < logicalRows.length) {
            var used = headerHeight;
            var repeatGroupRow = null;

            if (fragmentIndex > 0 && opts.repeatGroupHeader &&
                logicalRows[start] && logicalRows[start].kind === "data" &&
                logicalRows[start].groupKey !== null) {
                for (var previous = start - 1; previous >= 0; previous--) {
                    if (logicalRows[previous].kind === "group" &&
                        logicalRows[previous].groupKey === logicalRows[start].groupKey) {
                        repeatGroupRow = Object.assign({}, logicalRows[previous], { repeated: true });
                        used += rowHeights[previous] || 24;
                        break;
                    }
                }
            }

            var capacity = fragmentIndex === 0 ? opts.firstCapacity : opts.capacity;
            var count = 0;
            while (start + count < logicalRows.length) {
                var logicalIndex = start + count;
                var row = logicalRows[logicalIndex];
                var rowHeight = rowHeights[logicalIndex] || 24;
                var required = rowHeight;

                if (row.kind === "group" && logicalIndex + 1 < logicalRows.length &&
                    logicalRows[logicalIndex + 1].kind === "data") {
                    required += rowHeights[logicalIndex + 1] || 24;
                }
                if (count > 0 && used + required > capacity) break;

                used += rowHeight;
                count++;
                if (used >= capacity) break;
            }

            if (!count) count = 1;
            fragments.push({
                rowStart: start,
                rowCount: count,
                repeatGroupRow: repeatGroupRow,
                height: Math.max(8, Math.min(used, capacity))
            });
            start += count;
            fragmentIndex++;
        }
        return fragments;
    }

    function rvPaginateTable(el, data, pageWidth, pageHeight, zones, debug, startY) {
        var maxWidth = Math.max(20, pageWidth - (Number(el.x) || 0));
        var width = Math.max(20, Math.min(Number(el.width) || pageWidth, maxWidth));
        var metrics = rvMeasureTable(el, data, width);
        var logicalRows = metrics.model.logicalRows;
        var headerHeight = el.showHeader === false ? 0 : metrics.headerHeight;

        zones = zones || { headerBottom: 0, footerTop: pageHeight };

        var contentTop = startY !== undefined && startY !== null
            ? Math.max(startY, zones.headerBottom)
            : Math.max(Number(el.y) || 0, zones.headerBottom);
        if (contentTop > zones.footerTop - 20) {
            contentTop = Math.max(zones.headerBottom, zones.footerTop - 20);
        }
        var firstY = contentTop;

        var firstRowHeight = logicalRows.length ? (metrics.rowHeights[0] || 24) : 0;
        var firstRequiredHeight = firstRowHeight;
        if (logicalRows[0] && logicalRows[0].kind === "group" &&
            logicalRows[1] && logicalRows[1].kind === "data") {
            firstRequiredHeight += metrics.rowHeights[1] || 24;
        }
        if (logicalRows.length && zones.footerTop - firstY < headerHeight + firstRequiredHeight) {
            firstY = Math.max(zones.headerBottom, zones.footerTop - headerHeight - firstRequiredHeight);
        }

        if (firstY !== (Number(el.y) || 0) && debug) {
            console.log("[ReportViewer] table " + el.id + " pushed from y=" + el.y +
                " to y=" + firstY + " (headerBottom=" + zones.headerBottom +
                ", footerTop=" + zones.footerTop + ")");
        }

        var firstCapacity = Math.max(20, zones.footerTop - firstY);
        var capacity = Math.max(20, zones.footerTop - zones.headerBottom);

        var fragments = rvComputeFragments(logicalRows, metrics.rowHeights, headerHeight, {
            firstCapacity: firstCapacity,
            capacity: capacity,
            repeatGroupHeader: !!el.repeatGroupHeader
        });

        fragments.forEach(function (frag, i) {
            frag.x = Math.max(0, Math.min(Number(el.x) || 0, pageWidth - width));
            frag.y = i === 0 ? firstY : zones.headerBottom;
            frag.width = width;
        });
        fragments.naturalHeight = metrics.naturalHeight;
        fragments.firstY = firstY;
        return fragments;
    }

    /* -------------------------------------------------------------
       TABLE RENDER (renders a full table, or one fragment slice)
    ------------------------------------------------------------- */
    function rvBorderCss(width, style, color) {
        var number = Math.max(0, Number(width) || 0);
        if (!number || style === "none") return "none";
        if (style === "double") number = Math.max(3, number);
        return number + "px " + (style || "solid") + " " + (color || "#374151");
    }

    function rvApplyCellBorders(cell, el, column) {
        cell.style.border = "none";
        if (el.rowBorders) {
            cell.style.borderBottom = rvBorderCss(el.rowBorderWidth, el.rowBorderStyle, el.rowBorderColor);
        }
        if (el.columnBorders) {
            cell.style.borderRight = rvBorderCss(el.columnBorderWidth, el.columnBorderStyle, el.columnBorderColor);
        }
        if (!column) return;
        var customStyle = column.borderStyle && column.borderStyle !== "inherit"
            ? column.borderStyle
            : el.columnBorderStyle;
        var customBorder = rvBorderCss(column.borderWidth, customStyle, column.borderColor || el.columnBorderColor);
        var usesCustomColor = !!column.borderColor && column.borderColor !== el.columnBorderColor;
        if (column.leftBorder === "show") cell.style.borderLeft = customBorder;
        if (column.leftBorder === "hide") cell.style.borderLeft = "none";
        if (column.rightBorder === "show" || (column.rightBorder === "inherit" && usesCustomColor)) {
            cell.style.borderRight = customBorder;
        } else if (column.rightBorder === "hide") {
            cell.style.borderRight = "none";
        }
    }

    /* Per-edge border overrides (top/right/bottom/left) for the header row
       and individual data rows: show / hide / inherit. */
    function rvApplyEdgeOverrides(cell, edges, style, width, color) {
        if (!cell || !edges) return;
        var css = rvBorderCss(width, style || "solid", color || "#374151");
        if (edges.top === "show") cell.style.borderTop = css;
        else if (edges.top === "hide") cell.style.borderTop = "none";
        if (edges.right === "show") cell.style.borderRight = css;
        else if (edges.right === "hide") cell.style.borderRight = "none";
        if (edges.bottom === "show") cell.style.borderBottom = css;
        else if (edges.bottom === "hide") cell.style.borderBottom = "none";
        if (edges.left === "show") cell.style.borderLeft = css;
        else if (edges.left === "hide") cell.style.borderLeft = "none";
    }

    function rvAggregateValue(dataRows, column, columnIndex, el, kind) {
        var values = dataRows.map(function (row) {
            return rvValueForDataRow(row, column, columnIndex, el);
        });
        var present = values.filter(function (value) { return value !== "" && value !== null && value !== undefined; });
        if (kind === "count") return present.length;

        var numbers = present.map(Number).filter(function (value) { return !isNaN(value); });
        if (!numbers.length) return "";
        if (kind === "sum") return numbers.reduce(function (sum, value) { return sum + value; }, 0);
        if (kind === "avg") return numbers.reduce(function (sum, value) { return sum + value; }, 0) / numbers.length;
        if (kind === "min") return Math.min.apply(Math, numbers);
        if (kind === "max") return Math.max.apply(Math, numbers);
        return "";
    }

    function rvAggregateLabel(kind, scope, el, groupValue) {
        var item = null;
        for (var ai = 0; ai < RV_AGGREGATES.length; ai++) {
            if (RV_AGGREGATES[ai].v === kind) { item = RV_AGGREGATES[ai]; break; }
        }
        var kindLabel = item ? item.l : formatTitle(kind);

        if (scope === "grand") {
            if (el && el.grandTotalLabelMode === "custom") {
                var grandText = el.grandTotalLabelText;
                return (grandText === undefined || grandText === null || String(grandText).trim() === "")
                    ? "Grand Total"
                    : String(grandText);
            }
            return "Grand " + kindLabel;
        }

        var mode = el ? (el.subtotalLabelMode || "group") : "group";
        if (mode === "custom") {
            var subtotalText = el.subtotalLabelText;
            return (subtotalText === undefined || subtotalText === null || String(subtotalText).trim() === "")
                ? "Subtotal"
                : String(subtotalText);
        }
        if (mode === "kind") return "Group " + kindLabel;
        return (groupValue === undefined || groupValue === null || String(groupValue).trim() === "")
            ? "Subtotal"
            : String(groupValue);
    }

    function rvGroupHeaderCellText(dataRows, column, columnIndex, el) {
        var parts = [];
        (column.aggregates || []).forEach(function (kind) {
            var raw = rvAggregateValue(dataRows, column, columnIndex, el, kind);
            if (raw === "") return;
            var formatted = kind === "count"
                ? formatValue(raw, "number", 0)
                : formatValue(raw, column.format || "number", column.decimals);
            var valueText = formatted === "" ? "" : (column.prefix || "") + formatted + (column.suffix || "");
            if (valueText === "") return;
            var aggregateItem = null;
            for (var ai = 0; ai < RV_AGGREGATES.length; ai++) {
                if (RV_AGGREGATES[ai].v === kind) { aggregateItem = RV_AGGREGATES[ai]; break; }
            }
            parts.push((aggregateItem ? aggregateItem.l : formatTitle(kind)) + ": " + valueText);
        });
        return parts.join("  ·  ");
    }

    function rvMakeCell(tagName, el, column) {
        var cell = document.createElement(tagName);
        cell.style.padding = "5px 6px";
        cell.style.overflow = "hidden";
        cell.style.whiteSpace = "normal";
        cell.style.wordBreak = "break-word";
        cell.style.fontSize = (Number(el.fontSize) || 12) + "px";
        cell.style.fontFamily = el.fontFamily || "inherit";
        rvApplyCellBorders(cell, el, column);
        return cell;
    }

    /* Resolve {{field.path}} tokens inside a column title, using the
       array-first data resolver (details[].classNumber -> first item). */
    function rvResolveTitle(text, data) {
        if (!text || String(text).indexOf("{{") === -1) return text;
        return String(text).replace(/\{\{\s*([^}]+)\s*\}\}/g, function (_, path) {
            return getDataValue(data, path.trim());
        });
    }

    function rvRenderAdvancedTable(container, el, data, options) {
        options = options || {};
        RV_CURRENT_DATA = data || RV_CURRENT_DATA;
        rvEnsureTableDefaults(el);
        var model = options.model || rvBuildLogicalRows(el, data);
        var columns = model.columns;

        if (!columns.length) {
            container.innerHTML = '<div class="rv-img-placeholder">Set an array data source, or add columns below.</div>';
            return;
        }

        var logicalRows = model.logicalRows;
        if (!options.forceAll && options.fragment) {
            logicalRows = logicalRows.slice(options.fragment.rowStart, options.fragment.rowStart + options.fragment.rowCount);
            if (options.fragment.repeatGroupRow) logicalRows.unshift(options.fragment.repeatGroupRow);
        }

        var table = document.createElement("table");
        table.className = "rv-table";
        table.style.width = "100%";
        table.style.height = "auto";
        table.style.borderCollapse = "collapse";
        table.style.borderSpacing = "0";
        table.style.fontFamily = el.fontFamily || "inherit";
        table.style.border = el.outerBorder
            ? rvBorderCss(el.outerBorderWidth, el.outerBorderStyle, el.outerBorderColor)
            : "none";

        var anyFixedWidth = !!el.showIndex || columns.some(function (column) { return Number(column.width) > 0; });
        table.style.tableLayout = anyFixedWidth ? "fixed" : "auto";

        var colgroup = document.createElement("colgroup");
        if (el.showIndex) {
            var indexCol = document.createElement("col");
            indexCol.style.width = Math.max(24, Number(el.indexWidth) || 46) + "px";
            colgroup.appendChild(indexCol);
        }
        columns.forEach(function (column) {
            var col = document.createElement("col");
            if (Number(column.width) > 0) col.style.width = Number(column.width) + "px";
            colgroup.appendChild(col);
        });
        table.appendChild(colgroup);

        if (el.showHeader !== false) {
            var thead = document.createElement("thead");
            var headerRow = document.createElement("tr");
            if (Number(el.headerHeight) > 0) headerRow.style.height = Number(el.headerHeight) + "px";

            if (el.showIndex) {
                var indexHeader = rvMakeCell("th", el, null);
                indexHeader.textContent = el.indexTitle || "#";
                indexHeader.style.background = el.headerBackground || "#f3f4f6";
                indexHeader.style.color = el.headerColor || "#111827";
                indexHeader.style.fontWeight = el.headerWeight || "bold";
                indexHeader.style.textAlign = "center";
                headerRow.appendChild(indexHeader);
            }

            columns.forEach(function (column) {
                var th = rvMakeCell("th", el, column);
                th.textContent = rvResolveTitle(column.title, data) || formatTitle(column.field);
                th.style.background = column.headerBackground || el.headerBackground || "#f3f4f6";
                th.style.color = column.headerColor || el.headerColor || "#111827";
                th.style.fontWeight = el.headerWeight || "bold";
                th.style.textAlign = column.align || "left";
                th.style.verticalAlign = "middle";
                if (Number(el.headerHeight) > 0) th.style.height = Number(el.headerHeight) + "px";
                headerRow.appendChild(th);
            });
            // Per-edge header border overrides.
            Array.prototype.forEach.call(headerRow.cells, function (th) {
                rvApplyEdgeOverrides(th, el.headerBorders,
                    el.headerBorderStyle || el.rowBorderStyle,
                    el.headerBorderWidth,
                    el.headerBorderColor || el.rowBorderColor);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }

        var tbody = document.createElement("tbody");
        var pageDataIndex = 0;
        logicalRows.forEach(function (logicalRow) {
            var tr = document.createElement("tr");
            tr.dataset.rowKind = logicalRow.kind;

            if (logicalRow.kind === "group") {
                tr.className = "rv-group-row" + (logicalRow.repeated ? " repeated" : "");
                var groupLabel = logicalRow.label + " (" + logicalRow.count + ")" +
                    (logicalRow.repeated ? " — continued" : "");
                var hasHeaderTotals = el.showGroupHeaderTotals &&
                    rvAggregateTypes(el).length &&
                    logicalRow.dataRows && logicalRow.dataRows.length;

                if (!hasHeaderTotals) {
                    var groupCell = rvMakeCell("td", el, null);
                    groupCell.colSpan = columns.length + (el.showIndex ? 1 : 0);
                    groupCell.style.background = el.groupHeaderBackground;
                    groupCell.style.color = el.groupHeaderColor;
                    groupCell.style.fontWeight = "700";
                    groupCell.textContent = groupLabel;
                    tr.appendChild(groupCell);
                } else {
                    var labelCell = rvMakeCell("td", el, null);
                    labelCell.style.background = el.groupHeaderBackground;
                    labelCell.style.color = el.groupHeaderColor;
                    labelCell.style.fontWeight = "700";
                    labelCell.textContent = groupLabel;
                    tr.appendChild(labelCell);

                    columns.forEach(function (column, columnIndex) {
                        var td = rvMakeCell("td", el, column);
                        td.style.background = el.groupHeaderBackground;
                        td.style.color = el.groupHeaderColor;
                        td.style.fontWeight = "600";
                        td.style.textAlign = column.align || "left";
                        td.textContent = rvGroupHeaderCellText(logicalRow.dataRows, column, columnIndex, el);
                        tr.appendChild(td);
                    });
                }
                tbody.appendChild(tr);
                return;
            }

            if (logicalRow.kind === "summary") {
                tr.className = logicalRow.scope === "grand" ? "rv-grand-total-row" : "rv-subtotal-row";
                var label = rvAggregateLabel(logicalRow.aggregate, logicalRow.scope, el, logicalRow.groupValue);
                var background = logicalRow.scope === "grand" ? el.grandTotalBackground : el.subtotalBackground;
                var labelCol = logicalRow.scope === "grand"
                    ? Number(el.grandTotalLabelColumn)
                    : Number(el.subtotalLabelColumn);
                if (isNaN(labelCol) || labelCol < -1) labelCol = -1;
                if (labelCol >= columns.length) labelCol = columns.length - 1;
                if (labelCol === -1 && !el.showIndex) labelCol = 0;
                var usesIndexForLabel = labelCol === -1;

                if (el.showIndex) {
                    var summaryLabelCell = rvMakeCell("td", el, null);
                    summaryLabelCell.textContent = usesIndexForLabel ? label : "";
                    summaryLabelCell.style.background = background;
                    summaryLabelCell.style.fontWeight = "700";
                    tr.appendChild(summaryLabelCell);
                }

                columns.forEach(function (column, columnIndex) {
                    var td = rvMakeCell("td", el, column);
                    td.style.background = background;
                    td.style.fontWeight = "700";
                    td.style.textAlign = column.align || "left";
                    var enabled = (column.aggregates || []).indexOf(logicalRow.aggregate) !== -1;
                    var raw = enabled ? rvAggregateValue(logicalRow.dataRows, column, columnIndex, el, logicalRow.aggregate) : "";
                    var formatted = raw === "" ? "" : (logicalRow.aggregate === "count"
                        ? formatValue(raw, "number", 0)
                        : formatValue(raw, column.format || "number", column.decimals));
                    var valueText = formatted === "" ? "" : (column.prefix || "") + formatted + (column.suffix || "");
                    if (!usesIndexForLabel && labelCol === columnIndex) {
                        td.textContent = valueText ? label + ": " + valueText : label;
                    } else {
                        td.textContent = valueText;
                    }
                    if (column.textColor) td.style.color = column.textColor;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
                return;
            }

            var rowHeight = Number(el.rowHeight) || 0;
            if (!el.dataSource && Array.isArray(el.manualRowHeights) && el.manualRowHeights[logicalRow.sourceIndex]) {
                rowHeight = Number(el.manualRowHeights[logicalRow.sourceIndex]) || 0;
            }
            if (rowHeight) tr.style.height = rowHeight + "px";
            if (el.stripe && logicalRow.globalDataIndex % 2 === 1) {
                tr.style.background = el.stripeColor || "#f9fafb";
            }

            var rowBorderOverride = (Array.isArray(el.rowBorderOverrides) && el.rowBorderOverrides[logicalRow.sourceIndex]) || null;
            var rowCells = [];

            if (el.showIndex) {
                var indexCell = rvMakeCell("td", el, null);
                var startNumber = Number(el.indexStart) || 1;
                var indexNumber = el.indexMode === "page"
                    ? startNumber + pageDataIndex
                    : el.indexMode === "group"
                        ? startNumber + logicalRow.groupDataIndex
                        : startNumber + logicalRow.globalDataIndex;
                indexCell.textContent = String(indexNumber);
                indexCell.style.textAlign = "center";
                indexCell.style.verticalAlign = el.cellValign || "middle";
                tr.appendChild(indexCell);
                rowCells.push(indexCell);
            }

            columns.forEach(function (column, columnIndex) {
                var td = rvMakeCell("td", el, column);
                var rawValue = rvValueForDataRow(logicalRow, column, columnIndex, el);
                var formattedValue = formatValue(rawValue, column.format || "none", column.decimals);
                td.textContent = (column.prefix || "") + formattedValue + (column.suffix || "");
                td.style.textAlign = column.align || "left";
                td.style.verticalAlign = el.cellValign || "middle";
                if (rowHeight) td.style.height = rowHeight + "px";
                if (column.textColor) td.style.color = column.textColor;
                if (column.backgroundColor) td.style.background = column.backgroundColor;
                tr.appendChild(td);
                rowCells.push(td);
            });
            if (rowBorderOverride) {
                rowCells.forEach(function (cell) {
                    rvApplyEdgeOverrides(cell, rowBorderOverride,
                        rowBorderOverride.style || el.rowBorderStyle,
                        rowBorderOverride.width ? Number(rowBorderOverride.width) : el.rowBorderWidth,
                        rowBorderOverride.color || el.rowBorderColor);
                });
            }
            tbody.appendChild(tr);
            pageDataIndex++;
        });

        if (!model.dataRows.length) {
            var emptyRow = document.createElement("tr");
            var emptyCell = rvMakeCell("td", el, null);
            emptyCell.colSpan = columns.length + (el.showIndex ? 1 : 0);
            emptyCell.textContent = el.dataSource ? "No data rows in source" : "No manual rows";
            emptyCell.style.color = "#9ca3af";
            emptyCell.style.textAlign = "center";
            emptyCell.style.padding = "8px";
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        }

        table.appendChild(tbody);
        container.appendChild(table);
    }

    /* =============================================================
       CHART SVG GENERATOR (inline SVG — no library)
       v2: multi-series (el.series with per-series colours), pie slice
       colours, font family, title font size, background, legend position.
    ============================================================= */
    var RV_PALETTES = {
        default: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#64748b"],
        ocean: ["#0ea5e9", "#2563eb", "#14b8a6", "#6366f1", "#06b6d4", "#3b82f6", "#2dd4bf", "#818cf8"],
        forest: ["#16a34a", "#65a30d", "#0d9488", "#4d7c0f", "#22c55e", "#84cc16", "#14b8a6", "#a3e635"],
        sunset: ["#f97316", "#ef4444", "#f59e0b", "#ec4899", "#fb923c", "#f43f5e", "#fbbf24", "#e879f9"],
        slate: ["#64748b", "#94a3b8", "#475569", "#cbd5e1", "#334155", "#a8b8cc", "#1e293b", "#e2e8f0"]
    };

    function rvCompactNumber(n) {
        if (n === null || n === undefined || isNaN(n)) return "";
        var abs = Math.abs(n);
        if (abs >= 1000000) return (n / 1000000).toFixed(abs >= 10000000 ? 0 : 1).replace(/\.0$/, "") + "M";
        if (abs >= 10000) return (n / 1000).toFixed(abs >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k";
        return String(Math.round(n * 100) / 100);
    }

    function rvNiceMax(value) {
        if (!(value > 0)) return 1;
        var exp = Math.floor(Math.log10(value));
        var base = Math.pow(10, exp);
        var frac = value / base;
        var nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
        return nice * base;
    }

    function rvChartSeries(el) {
        var series = Array.isArray(el.series) && el.series.length ? el.series.slice() : [];
        if (el.valueField && !series.some(function (s) { return s.field === el.valueField; })) {
            series.push({ field: el.valueField, color: "" });
        }
        if (el.valueField2 && !series.some(function (s) { return s.field === el.valueField2; })) {
            series.push({ field: el.valueField2, color: "" });
        }
        return series;
    }

    function rvChartSeriesColor(el, index, palette) {
        var s = el.series && el.series[index];
        if (s && s.color) return s.color;
        return palette[index % palette.length];
    }

    function rvChartFontAttr(el) {
        return el && el.fontFamily ? ' font-family="' + escapeHtml(el.fontFamily) + '"' : "";
    }

    function rvChartSvg(el, data) {
        el = el || {};
        var W = Math.max(60, Number(el.width) || 400);
        var H = Math.max(60, Number(el.height) || 240);
        var type = el.chartType || "bar";
        var palette = (RV_PALETTES[el.palette] || RV_PALETTES.default).slice();
        var fontSize = Math.max(8, Number(el.fontSize) || 10);
        var titleFs = Number(el.titleFontSize) || (fontSize + 2);
        var fontAttr = rvChartFontAttr(el);
        var titleColor = el.titleColor || "#111827";
        var labelColor = el.labelColor || "#6b7280";
        var gridColor = el.gridColor || "#e5e7eb";
        var bg = el.background && el.background !== "transparent" ? el.background : "";
        var showLegend = el.showLegend !== false;
        var showValues = !!el.showValues;

        var rows = el.dataSource ? getArrayValue(data, el.dataSource) : [];
        if (!Array.isArray(rows)) rows = [];

        var labels = [];
        rows.forEach(function (row) {
            if (!row || typeof row !== "object" || Array.isArray(row)) return;
            var rawLabel = rvRawPath(row, el.labelField || "");
            labels.push(rawLabel === "" || rawLabel === null || rawLabel === undefined ? "—" : String(rawLabel));
        });

        var series = rvChartSeries(el);
        var seriesData = series.map(function (s) {
            return {
                field: s.field,
                values: rows.map(function (row) {
                    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
                    var v = rvRawPath(row, s.field || "");
                    return v === "" || v === null || v === undefined ? null : Number(v);
                })
            };
        });

        var hasData = seriesData.some(function (sd) {
            return sd.values.some(function (v) { return v !== null && !isNaN(v); });
        });
        if (!rows.length || !labels.length || !hasData) {
            var emptyText = el.dataSource ? "No numeric data in source" : "Set an array data source";
            return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;' +
                'color:' + labelColor + ';font-size:' + fontSize + 'px;border:1px dashed #d1d5db;border-radius:6px;' +
                'background:rgba(243,244,246,.4);text-align:center;padding:8px;">' + escapeHtml(emptyText) + "</div>";
        }

        var multiSeries = series.length > 1;
        var legendBottom = 0;
        if (type !== "pie" && type !== "donut" && showLegend && multiSeries) legendBottom = 18;
        if ((type === "pie" || type === "donut") && showLegend && el.legendPosition === "bottom") legendBottom = 18;

        var margin = { top: el.title ? Math.max(26, titleFs + 14) : 10, right: 12, bottom: 36 + legendBottom, left: 46 };
        var pw = Math.max(20, W - margin.left - margin.right);
        var ph = Math.max(20, H - margin.top - margin.bottom);
        var n = labels.length;

        var svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
        '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;width:100%;height:100%;">'];

        if (bg) {
            svg.push('<rect width="' + W + '" height="' + H + '" rx="6" fill="' + escapeHtml(bg) + '"/>');
        }
        if (el.title) {
            svg.push('<text x="' + (W / 2) + '" y="16" text-anchor="middle" font-size="' + titleFs +
                '" font-weight="700" fill="' + titleColor + '"' + fontAttr + '>' + escapeHtml(String(el.title)) + "</text>");
        }

        if (type === "pie" || type === "donut") {
            var pieValues = (seriesData[0] ? seriesData[0].values : []).map(function (v) {
                return v !== null && !isNaN(v) && v > 0 ? v : 0;
            });
            var total = pieValues.reduce(function (s, v) { return s + v; }, 0);
            if (total <= 0) {
                return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;' +
                    'color:' + labelColor + ';font-size:' + fontSize + 'px;">No positive values</div>';
            }
            var legendRight = showLegend && el.legendPosition !== "bottom";
            var legendW = legendRight ? Math.min(150, W * 0.34) : 0;
            var cx = (W - legendW) / 2;
            var cy = H / 2 + (el.title ? 6 : 0) - (legendBottom ? 8 : 0);
            var R = Math.max(20, Math.min(pw - legendW - 8, ph) / 2 - 4);
            var innerR = type === "donut" ? R * 0.55 : 0;
            var start = -Math.PI / 2;

            for (var i = 0; i < n; i++) {
                var val = pieValues[i];
                if (!(val > 0)) continue;
                var angle = (val / total) * Math.PI * 2;
                var large = angle > Math.PI ? 1 : 0;
                var a1x = cx + R * Math.cos(start);
                var a1y = cy + R * Math.sin(start);
                var a2x = cx + R * Math.cos(start + angle);
                var a2y = cy + R * Math.sin(start + angle);
                var color = (el.sliceColors && el.sliceColors[i]) || palette[i % palette.length];
                var path;
                if (type === "donut") {
                    var b1x = cx + innerR * Math.cos(start);
                    var b1y = cy + innerR * Math.sin(start);
                    var b2x = cx + innerR * Math.cos(start + angle);
                    var b2y = cy + innerR * Math.sin(start + angle);
                    path = "M" + a1x.toFixed(2) + " " + a1y.toFixed(2) +
                        " A" + R + " " + R + " 0 " + large + " 1 " + a2x.toFixed(2) + " " + a2y.toFixed(2) +
                        " L" + b2x.toFixed(2) + " " + b2y.toFixed(2) +
                        " A" + innerR + " " + innerR + " 0 " + large + " 0 " + b1x.toFixed(2) + " " + b1y.toFixed(2) + " Z";
                } else {
                    path = "M" + cx + " " + cy +
                        " L" + a1x.toFixed(2) + " " + a1y.toFixed(2) +
                        " A" + R + " " + R + " 0 " + large + " 1 " + a2x.toFixed(2) + " " + a2y.toFixed(2) + " Z";
                }
                svg.push('<path d="' + path + '" fill="' + color + '" stroke="#ffffff" stroke-width="1.5"/>');
                if (angle > 0.06 && (showValues || type === "pie")) {
                    var mid = start + angle / 2;
                    var lr = type === "donut" ? (R + innerR) / 2 : R * 0.62;
                    var px = cx + lr * Math.cos(mid);
                    var py = cy + lr * Math.sin(mid);
                    svg.push('<text x="' + px.toFixed(1) + '" y="' + (py + fontSize * 0.35).toFixed(1) +
                        '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#ffffff" font-weight="700"' +
                        fontAttr + ">" + Math.round((val / total) * 100) + "%</text>");
                }
                if (showLegend && legendRight) {
                    var ly = margin.top + i * (fontSize + 5);
                    svg.push('<rect x="' + (W - legendW + 4) + '" y="' + (ly - 8) + '" width="9" height="9" rx="2" fill="' + color + '"/>');
                    svg.push('<text x="' + (W - legendW + 17) + '" y="' + ly + '" font-size="' + (fontSize - 1) +
                        '" fill="' + labelColor + '"' + fontAttr + ">" + escapeHtml(labels[i]) + "</text>");
                }
                start += angle;
            }

            if (showLegend && legendBottom) {
                var itemW = labels.map(function (lb) { return 14 + lb.length * (fontSize * 0.62); });
                var totalW = itemW.reduce(function (s, w) { return s + w; }, 0) + Math.max(0, labels.length - 1) * 10;
                var lx = Math.max(4, (W - totalW) / 2);
                var ly = H - 10;
                for (var li = 0; li < n; li++) {
                    var lc = (el.sliceColors && el.sliceColors[li]) || palette[li % palette.length];
                    svg.push('<rect x="' + lx + '" y="' + (ly - 8) + '" width="9" height="9" rx="2" fill="' + lc + '"/>');
                    svg.push('<text x="' + (lx + 13) + '" y="' + ly + '" font-size="' + (fontSize - 1) +
                        '" fill="' + labelColor + '"' + fontAttr + ">" + escapeHtml(labels[li]) + "</text>");
                    lx += itemW[li] + 10;
                }
            }

            svg.push("</svg>");
            return svg.join("");
        }

        var allValues = [];
        seriesData.forEach(function (sd) {
            sd.values.forEach(function (v) { if (v !== null && !isNaN(v)) allValues.push(v); });
        });
        var maxVal = rvNiceMax(Math.max.apply(null, allValues.map(function (v) { return Math.abs(v); }).concat([1])));
        var y = function (val) { return margin.top + ph - (val / maxVal) * ph; };
        var groupW = pw / n;
        var labelStep = n > 24 ? 3 : n > 12 ? 2 : 1;

        for (var gi = 0; gi <= 4; gi++) {
            var gv = maxVal * gi / 4;
            var gy = y(gv);
            svg.push('<line x1="' + margin.left + '" y1="' + gy.toFixed(1) + '" x2="' + (W - margin.right) +
                '" y2="' + gy.toFixed(1) + '" stroke="' + gridColor + '" stroke-width="1"/>');
            svg.push('<text x="' + (margin.left - 6) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end" font-size="' +
                fontSize + '" fill="' + labelColor + '"' + fontAttr + ">" + escapeHtml(rvCompactNumber(gv)) + "</text>");
        }

        if (type === "bar") {
            var seriesCount = series.length;
            var barW = Math.max(2, Math.min(42, (groupW * 0.6) / seriesCount));
            var gap = Math.max(1, Math.min(8, barW * 0.25));
            for (var bi = 0; bi < n; bi++) {
                var bcx = margin.left + bi * groupW + groupW / 2;
                if (bi % labelStep === 0) {
                    var labText = labels[bi];
                    if (labText.length > 14) labText = labText.slice(0, 13) + "…";
                    svg.push('<text x="' + bcx.toFixed(1) + '" y="' + (H - margin.bottom + 14) + '" text-anchor="middle" font-size="' +
                        fontSize + '" fill="' + labelColor + '"' + fontAttr + ">" + escapeHtml(labText) + "</text>");
                }
                for (var si = 0; si < seriesCount; si++) {
                    var val = seriesData[si].values[bi];
                    if (val === null || isNaN(val)) continue;
                    var color = rvChartSeriesColor(el, si, palette);
                    var bx = bcx - (barW * seriesCount) / 2 + si * (barW + gap);
                    var by = y(val);
                    svg.push('<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + barW +
                        '" height="' + Math.max(0, margin.top + ph - by).toFixed(1) + '" fill="' + color +
                        '" rx="' + (barW > 6 ? 2 : 0) + '"/>');
                    if (showValues) {
                        svg.push('<text x="' + (bx + barW / 2).toFixed(1) + '" y="' + (by - 4).toFixed(1) +
                            '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="' + titleColor + '"' +
                            fontAttr + ">" + escapeHtml(rvCompactNumber(val)) + "</text>");
                    }
                }
            }
        } else {
            var allPts = [];
            seriesData.forEach(function (sd, si) {
                var pts = [];
                for (var i2 = 0; i2 < n; i2++) {
                    var lcx = margin.left + (n === 1 ? pw / 2 : (i2 / (n - 1)) * pw);
                    if (i2 % labelStep === 0 && si === 0) {
                        var labText2 = labels[i2];
                        if (labText2.length > 14) labText2 = labText2.slice(0, 13) + "…";
                        svg.push('<text x="' + lcx.toFixed(1) + '" y="' + (H - margin.bottom + 14) + '" text-anchor="middle" font-size="' +
                            fontSize + '" fill="' + labelColor + '"' + fontAttr + ">" + escapeHtml(labText2) + "</text>");
                    }
                    var v = sd.values[i2];
                    if (v !== null && !isNaN(v)) pts.push(lcx.toFixed(1) + "," + y(v).toFixed(1));
                }
                allPts.push(pts);
                if (type === "area" && pts.length) {
                    var base = margin.top + ph;
                    var acolor = rvChartSeriesColor(el, si, palette);
                    svg.push('<polygon points="' + pts[0].split(",")[0] + ',' + base + ' ' + pts.join(" ") + " " +
                        pts[pts.length - 1].split(",")[0] + "," + base + '" fill="' + acolor + '" opacity="0.15"/>');
                }
            });
            allPts.forEach(function (pts, si) {
                if (!pts.length) return;
                var pcolor = rvChartSeriesColor(el, si, palette);
                svg.push('<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + pcolor +
                    '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' +
                    (si >= 1 ? ' stroke-dasharray="4 3"' : "") + "/>");
                pts.forEach(function (p) {
                    var xy = p.split(",");
                    svg.push('<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3" fill="' + pcolor + '" stroke="#fff" stroke-width="1.2"/>');
                });
                if (showValues) {
                    pts.forEach(function (p, pi) {
                        var xy = p.split(",");
                        svg.push('<text x="' + xy[0] + '" y="' + (Number(xy[1]) - 7) + '" text-anchor="middle" font-size="' +
                            (fontSize - 1) + '" fill="' + titleColor + '"' + fontAttr + ">" +
                            escapeHtml(rvCompactNumber(seriesData[si].values[pi])) + "</text>");
                    });
                }
            });
        }

        if (legendBottom && showLegend && multiSeries) {
            var lx2 = margin.left;
            var ly2 = H - 10;
            series.forEach(function (s, si) {
                var color = rvChartSeriesColor(el, si, palette);
                var label = s.field || ("Series " + (si + 1));
                svg.push('<rect x="' + lx2 + '" y="' + (ly2 - 8) + '" width="9" height="9" rx="2" fill="' + color + '"/>');
                svg.push('<text x="' + (lx2 + 13) + '" y="' + ly2 + '" font-size="' + (fontSize - 1) +
                    '" fill="' + labelColor + '"' + fontAttr + ">" + escapeHtml(String(label)) + "</text>");
                lx2 += 13 + label.length * (fontSize * 0.62) + 12;
            });
        }

        svg.push("</svg>");
        return svg.join("");
    }


    /* =============================================================
       EXPRESSION ENGINE (safe — parsed, never eval'd)
    ============================================================= */
    var RV_CURRENT_DATA = {};

    function rxeRawPath(object, path) {
        if (path === "" || path === null || path === undefined) return object;
        var normalized = String(path).replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
        var parts = normalized.split(".").filter(Boolean);
        var current = object;
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            current = current[parts[i]];
        }
        return current;
    }

    function rxeRawPathFirst(object, path) {
        if (!path) return undefined;
        var parts = String(path).replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
        var current = object;
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            var part = parts[i];
            if (Array.isArray(current)) {
                if (!current.length) return undefined;
                if (/^\d+$/.test(part)) {
                    var index = Number(part);
                    if (!current[index]) return undefined;
                    current = current[index];
                    continue;
                }
                current = current[0];
            }
            if (part.indexOf("[]") !== -1) {
                var key = part.slice(0, -2);
                if (!Array.isArray(current[key]) || !current[key].length) return undefined;
                current = current[key][0];
            } else {
                current = current[part];
            }
        }
        return current;
    }

    function rxeToNumber(v) {
        if (typeof v === "number") return v;
        if (typeof v === "boolean") return v ? 1 : 0;
        if (v === null || v === undefined) return NaN;
        var n = Number(String(v).replace(/[^0-9.\-eE]/g, ""));
        return isNaN(n) ? NaN : n;
    }

    function rxeToBool(v) {
        if (typeof v === "boolean") return v;
        if (v === null || v === undefined) return false;
        if (typeof v === "number") return v !== 0;
        if (typeof v === "string") return v !== "" && v.toLowerCase() !== "false";
        return true;
    }
    /* True when an argument is the engine's context object (always pushed last in
       function calls) — lets optional arguments be detected when omitted. */
    function rxeIsCtx(v) {
        return !!v && typeof v === "object" && typeof v.resolve === "function";
    }


    /* Resolve a path for AGGREGATE arguments: array steps collect the
       values across all items (sales[].revenue -> array of revenues),
       plain paths return the raw value. */
    function rxeRawPathCollect(object, path) {
        if (!path) return undefined;
        var parts = String(path).replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
        var current = object;
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            var part = parts[i];
            if (part.indexOf("[]") !== -1) {
                var key = part.slice(0, -2);
                if (Array.isArray(current)) {
                    current = current.map(function (item) { return item ? item[key] : undefined; });
                } else {
                    current = current ? current[key] : undefined;
                }
            } else if (Array.isArray(current)) {
                current = current.map(function (item) { return item ? item[part] : undefined; });
            } else {
                current = current[part];
            }
        }
        return current;
    }

    function rxeResolveMaybe(ctx, v) {
        if (typeof v === "string" && ctx && ctx.data && /[.[]/.test(v)) {
            var collected = rxeRawPathCollect(ctx.data, v);
            if (collected !== undefined) return collected;
            var resolved = rxeRawPath(ctx.data, v);
            if (resolved !== undefined) return resolved;
        }
        return v;
    }

    function rxeToArray(v, ctx) {
        v = rxeResolveMaybe(ctx, v);
        if (Array.isArray(v)) return v;
        if (v === undefined || v === null) return [];
        return [v];
    }

    function rxeNumbers(arr) {
        return arr.map(rxeToNumber).filter(function (n) { return !isNaN(n); });
    }

    function rxeToDate(v) {
        if (v === null || v === undefined || v === "") return null;
        if (v instanceof Date) return v;
        var d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }

    function rxeDatePart(v, part) {
        var d = rxeToDate(v);
        if (!d) return 0;
        if (part === "year") return d.getFullYear();
        if (part === "month") return d.getMonth() + 1;
        if (part === "day") return d.getDate();
        if (part === "hour") return d.getHours();
        if (part === "minute") return d.getMinutes();
        if (part === "second") return d.getSeconds();
        return 0;
    }

    var RXE_FUNCTIONS = {
        abs: function (v) { return Math.abs(rxeToNumber(v)); },
        round: function (v, d) { var n = rxeToNumber(v); var dec = (d === undefined || rxeIsCtx(d)) ? 0 : Math.max(0, Math.round(rxeToNumber(d))); var f = Math.pow(10, dec); return Math.round(n * f) / f; },
        floor: function (v) { return Math.floor(rxeToNumber(v)); },
        ceil: function (v) { return Math.ceil(rxeToNumber(v)); },
        trunc: function (v) { return Math.trunc(rxeToNumber(v)); },
        sqrt: function (v) { return Math.sqrt(rxeToNumber(v)); },
        cbrt: function (v) { return Math.cbrt(rxeToNumber(v)); },
        sign: function (v) { return Math.sign(rxeToNumber(v)); },
        pow: function (a, b) { return Math.pow(rxeToNumber(a), rxeToNumber(b)); },
        exp: function (v) { return Math.exp(rxeToNumber(v)); },
        log: function (v) { return Math.log(rxeToNumber(v)); },
        log10: function (v) { return Math.log10(rxeToNumber(v)); },
        min: function () { var args = [].slice.call(arguments); var ctx = args[args.length - 1]; var arr = []; args.slice(0, -1).forEach(function (a) { arr = arr.concat(rxeToArray(a, ctx)); }); var nums = rxeNumbers(arr); return nums.length ? Math.min.apply(Math, nums) : 0; },
        max: function () { var args = [].slice.call(arguments); var ctx = args[args.length - 1]; var arr = []; args.slice(0, -1).forEach(function (a) { arr = arr.concat(rxeToArray(a, ctx)); }); var nums = rxeNumbers(arr); return nums.length ? Math.max.apply(Math, nums) : 0; },
        clamp: function (v, lo, hi) { var n = rxeToNumber(v); return Math.max(rxeToNumber(lo), Math.min(rxeToNumber(hi), n)); },
        random: Math.random,
        roundTo: function (v, d) { return RXE_FUNCTIONS.round(v, d); },
        sin: function (v) { return Math.sin(rxeToNumber(v)); },
        cos: function (v) { return Math.cos(rxeToNumber(v)); },
        tan: function (v) { return Math.tan(rxeToNumber(v)); },
        asin: function (v) { return Math.asin(rxeToNumber(v)); },
        acos: function (v) { return Math.acos(rxeToNumber(v)); },
        atan: function (v) { return Math.atan(rxeToNumber(v)); },
        atan2: function (y, x) { return Math.atan2(rxeToNumber(y), rxeToNumber(x)); },
        degrees: function (v) { return rxeToNumber(v) * 180 / Math.PI; },
        radians: function (v) { return rxeToNumber(v) * Math.PI / 180; },
        upper: function (v) { return String(v).toUpperCase(); },
        lower: function (v) { return String(v).toLowerCase(); },
        title: function (v) { return String(v).replace(/\b\w/g, function (c) { return c.toUpperCase(); }); },
        trim: function (v) { return String(v).trim(); },
        length: function (v) { return String(v).length; },
        concat: function () { var args = [].slice.call(arguments); args.pop(); return args.map(String).join(""); },
        substr: function (v, start, len) { var s = String(v); var st = rxeToNumber(start); if (len === undefined || rxeIsCtx(len)) return s.slice(st); return s.slice(st, st + rxeToNumber(len)); },
        slice: function (v, a, b) { return String(v).slice(rxeToNumber(a), (b === undefined || rxeIsCtx(b)) ? undefined : rxeToNumber(b)); },
        replace: function (v, from, to) { return String(v).replace(String(from), String(to)); },
        replaceAll: function (v, from, to) { return String(v).split(String(from)).join(String(to)); },
        startsWith: function (v, pre) { return String(v).indexOf(String(pre)) === 0; },
        endsWith: function (v, suf) { var s = String(v), tt = String(suf); return s.slice(-tt.length) === tt; },
        contains: function (v, sub) { return String(v).indexOf(String(sub)) !== -1; },
        indexOf: function (v, sub) { return String(v).indexOf(String(sub)); },
        split: function (v, sep) { return String(v).split(String((sep === undefined || rxeIsCtx(sep)) ? "," : sep)); },
        join: function () { var args = [].slice.call(arguments); var ctx = args[args.length - 1]; var sep = args.length > 2 ? String(args[args.length - 2]) : ","; var arr = rxeToArray(args[0], ctx); return arr.map(String).join(sep); },
        padStart: function (v, len, pad) { return String(v).padStart(rxeToNumber(len), String((pad === undefined || rxeIsCtx(pad)) ? " " : pad)); },
        padEnd: function (v, len, pad) { return String(v).padEnd(rxeToNumber(len), String((pad === undefined || rxeIsCtx(pad)) ? " " : pad)); },
        repeat: function (v, n) { return String(v).repeat(Math.max(0, rxeToNumber(n))); },
        reverse: function (v) { return String(v).split("").reverse().join(""); },
        charAt: function (v, i) { return String(v).charAt(rxeToNumber(i)); },
        formatNumber: function (v, d) { return formatValue(rxeToNumber(v), "number", (d === undefined || rxeIsCtx(d)) ? 2 : rxeToNumber(d)); },
        currency: function (v, d) { return formatValue(rxeToNumber(v), "currency", (d === undefined || rxeIsCtx(d)) ? 2 : rxeToNumber(d)); },
        percent: function (v, d) { return formatValue(rxeToNumber(v), "percent", (d === undefined || rxeIsCtx(d)) ? 2 : rxeToNumber(d)); },
        toFixed: function (v, d) { return rxeToNumber(v).toFixed(Math.max(0, Math.round(rxeToNumber((d === undefined || rxeIsCtx(d)) ? 2 : d)))); },
        now: function () { return Date.now(); },
        year: function (v) { return rxeDatePart(v, "year"); },
        month: function (v) { return rxeDatePart(v, "month"); },
        day: function (v) { return rxeDatePart(v, "day"); },
        hour: function (v) { return rxeDatePart(v, "hour"); },
        minute: function (v) { return rxeDatePart(v, "minute"); },
        second: function (v) { return rxeDatePart(v, "second"); },
        addDays: function (v, n) { var d = rxeToDate(v); return d ? d.getTime() + rxeToNumber(n) * 86400000 : 0; },
        addMonths: function (v, n) { var d = rxeToDate(v); if (!d) return 0; d.setMonth(d.getMonth() + rxeToNumber(n)); return d.getTime(); },
        addYears: function (v, n) { var d = rxeToDate(v); if (!d) return 0; d.setFullYear(d.getFullYear() + rxeToNumber(n)); return d.getTime(); },
        diffDays: function (a, b) { var da = rxeToDate(a), db = rxeToDate(b); if (!da || !db) return 0; return Math.round((db.getTime() - da.getTime()) / 86400000); },
        formatDate: function (v, fmt) { return formatDateValue(v, String((fmt === undefined || rxeIsCtx(fmt)) ? "short" : fmt)); },
        if: function (cond, a, b) { return rxeToBool(cond) ? a : b; },
        coalesce: function () { var args = [].slice.call(arguments); for (var i = 0; i < args.length; i++) { if (rxeIsCtx(args[i])) continue; if (args[i] !== null && args[i] !== undefined && args[i] !== "") return args[i]; } return null; },
        between: function (v, lo, hi) { var n = rxeToNumber(v); return n >= rxeToNumber(lo) && n <= rxeToNumber(hi); },
        sum: function () { var args = [].slice.call(arguments); var ctx = args[args.length - 1]; var arr = []; args.slice(0, -1).forEach(function (a) { arr = arr.concat(rxeToArray(a, ctx)); }); var nums = rxeNumbers(arr); return nums.reduce(function (s, n) { return s + n; }, 0); },
        avg: function () { var args = [].slice.call(arguments); var ctx = args[args.length - 1]; var arr = []; args.slice(0, -1).forEach(function (a) { arr = arr.concat(rxeToArray(a, ctx)); }); var nums = rxeNumbers(arr); return nums.length ? nums.reduce(function (s, n) { return s + n; }, 0) / nums.length : 0; },
        count: function () { var args = [].slice.call(arguments); var ctx = args[args.length - 1]; var arr = []; args.slice(0, -1).forEach(function (a) { arr = arr.concat(rxeToArray(a, ctx)); }); return arr.filter(function (v) { return v !== "" && v !== null && v !== undefined; }).length; },
        number: function (v) { return rxeToNumber(v); },
        string: function (v) { return v === null || v === undefined ? "" : String(v); },
        boolean: function (v) { return rxeToBool(v); }
    };

    function rxeTokenize(src) {
        var tokens = [];
        var i = 0;
        var s = String(src || "");
        while (i < s.length) {
            var ch = s[i];
            if (/\s/.test(ch)) { i++; continue; }
            if (ch === "{" && s[i + 1] === "{") {
                var end = s.indexOf("}}", i + 2);
                if (end === -1) throw new Error("Unclosed {{ in expression");
                tokens.push({ type: "placeholder", path: s.slice(i + 2, end).trim() });
                i = end + 2;
                continue;
            }
            if (ch === '"' || ch === "'") {
                var q = ch, j = i + 1, out = "";
                while (j < s.length && s[j] !== q) {
                    if (s[j] === "\\" && j + 1 < s.length) { out += s[j + 1]; j += 2; }
                    else { out += s[j]; j++; }
                }
                if (j >= s.length) throw new Error("Unclosed string in expression");
                tokens.push({ type: "string", value: out });
                i = j + 1;
                continue;
            }
            var num = s.slice(i).match(/^\d*\.?\d+(?:[eE][+-]?\d+)?/);
            if (num) { tokens.push({ type: "number", value: parseFloat(num[0]) }); i += num[0].length; continue; }
            var ident = s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
            if (ident) { tokens.push({ type: "ident", name: ident[0] }); i += ident[0].length; continue; }
            var op2 = s.slice(i, i + 2);
            if (["==", "!=", "<=", ">=", "&&", "||", "**"].indexOf(op2) !== -1) {
                tokens.push({ type: "op", op: op2 }); i += 2; continue;
            }
            if ("+-*/%^<>!?:,()".indexOf(ch) !== -1) {
                tokens.push({ type: "op", op: ch }); i++; continue;
            }
            throw new Error("Unexpected character '" + ch + "' in expression");
        }
        return tokens;
    }

    function rxeParse(tokens) {
        var pos = 0;
        function peek() { return tokens[pos]; }
        function next() { return tokens[pos++]; }
        function expectOp(op) {
            var t = next();
            if (!t || t.type !== "op" || t.op !== op) throw new Error("Expected '" + op + "' in expression");
            return t;
        }
        function parseTernary() {
            var cond = parseOr();
            if (peek() && peek().type === "op" && peek().op === "?") {
                next();
                var a = parseTernary();
                expectOp(":");
                var b = parseTernary();
                return { type: "ternary", cond: cond, a: a, b: b };
            }
            return cond;
        }
        function binLevel(ops, sub) {
            return function () {
                var l = sub();
                while (peek() && peek().type === "op" && ops.indexOf(peek().op) !== -1) {
                    var op = next().op;
                    var r = sub();
                    l = { type: "bin", op: op, l: l, r: r };
                }
                return l;
            };
        }
        var parseOr = binLevel(["||"], function () { return parseAnd(); });
        var parseAnd = binLevel(["&&"], function () { return parseEq(); });
        var parseEq = binLevel(["==", "!="], function () { return parseCmp(); });
        var parseCmp = binLevel(["<", "<=", ">", ">="], function () { return parseAdd(); });
        var parseAdd = binLevel(["+", "-"], function () { return parseMul(); });
        var parseMul = binLevel(["*", "/", "%"], function () { return parsePow(); });
        function parsePow() {
            var l = parseUnary();
            if (peek() && peek().type === "op" && (peek().op === "^" || peek().op === "**")) {
                next();
                return { type: "bin", op: "**", l: l, r: parsePow() };
            }
            return l;
        }
        function parseUnary() {
            if (peek() && peek().type === "op" && (peek().op === "!" || peek().op === "-" || peek().op === "+")) {
                var op = next().op;
                return { type: "unary", op: op, arg: parseUnary() };
            }
            return parsePrimary();
        }
        function parsePrimary() {
            var t = next();
            if (!t) throw new Error("Unexpected end of expression");
            if (t.type === "number" || t.type === "string") return t;
            if (t.type === "placeholder") return { type: "placeholder", path: t.path };
            if (t.type === "ident") {
                if (t.name === "true") return { type: "number", value: 1, truthy: true };
                if (t.name === "false") return { type: "number", value: 0, truthy: false };
                if (t.name === "null") return { type: "null" };
                if (t.name === "pi") return { type: "number", value: Math.PI };
                if (t.name === "e") return { type: "number", value: Math.E };
                if (peek() && peek().type === "op" && peek().op === "(") {
                    next();
                    var args = [];
                    if (!(peek() && peek().type === "op" && peek().op === ")")) {
                        do { args.push(parseTernary()); } while (peek() && peek().type === "op" && peek().op === "," && (next(), true));
                    }
                    expectOp(")");
                    return { type: "call", name: t.name, args: args };
                }
                throw new Error("Unknown identifier '" + t.name + "' in expression");
            }
            if (t.type === "op" && t.op === "(") {
                var inner = parseTernary();
                expectOp(")");
                return inner;
            }
            throw new Error("Unexpected token in expression");
        }
        var ast = parseTernary();
        if (pos < tokens.length) throw new Error("Unexpected trailing input in expression");
        return ast;
    }

    function rxeEvaluate(node, ctx) {
        switch (node.type) {
            case "number": return node.value;
            case "string": return node.value;
            case "null": return null;
            case "placeholder": return ctx.resolve(node.path);
            case "ternary":
                return rxeToBool(rxeEvaluate(node.cond, ctx)) ? rxeEvaluate(node.a, ctx) : rxeEvaluate(node.b, ctx);
            case "unary": {
                var v = rxeEvaluate(node.arg, ctx);
                if (node.op === "!") return !rxeToBool(v);
                return node.op === "-" ? -rxeToNumber(v) : rxeToNumber(v);
            }
            case "bin": {
                if (node.op === "&&") return rxeToBool(rxeEvaluate(node.l, ctx)) ? rxeEvaluate(node.r, ctx) : false;
                if (node.op === "||") return rxeToBool(rxeEvaluate(node.l, ctx)) ? rxeEvaluate(node.l, ctx) : rxeEvaluate(node.r, ctx);
                var l = rxeEvaluate(node.l, ctx);
                var r = rxeEvaluate(node.r, ctx);
                switch (node.op) {
                    case "+": return (typeof l === "string" || typeof r === "string") ? String(l) + String(r) : rxeToNumber(l) + rxeToNumber(r);
                    case "-": return rxeToNumber(l) - rxeToNumber(r);
                    case "*": return rxeToNumber(l) * rxeToNumber(r);
                    case "/": return rxeToNumber(l) / rxeToNumber(r);
                    case "%": return rxeToNumber(l) % rxeToNumber(r);
                    case "**": return Math.pow(rxeToNumber(l), rxeToNumber(r));
                    case "==": return l == r;
                    case "!=": return l != r;
                    case "<": return l < r;
                    case "<=": return l <= r;
                    case ">": return l > r;
                    case ">=": return l >= r;
                }
                return null;
            }
            case "call": {
                var fn = RXE_FUNCTIONS[node.name];
                if (!fn) throw new Error("Unknown function '" + node.name + "'");
                var args = node.args.map(function (a) { return rxeEvaluate(a, ctx); });
                args.push(ctx);
                return fn.apply(null, args);
            }
        }
        return null;
    }

    function rxeMakeContext(row, data) {
        return {
            row: row || null,
            data: data || {},
            resolve: function (path) {
                if (!path) return undefined;
                if (this.row) {
                    var rowVal = rxeRawPath(this.row, path);
                    if (rowVal !== undefined) return rowVal;
                }
                return rxeRawPathFirst(this.data, path);
            }
        };
    }

    function rxeEvaluateString(src, ctx) {
        if (src === null || src === undefined || String(src).trim() === "") return "";
        return rxeEvaluate(rxeParse(rxeTokenize(src)), ctx || rxeMakeContext(null, {}));
    }

    function rxeRenderValue(el, value) {
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "true" : "false";
        if (typeof value === "number") {
            return formatValue(value, el.format || "number", el.decimals);
        }
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    }

    /* =============================================================
       ELEMENT RENDERING
    ============================================================= */
    function rvApplyTextStyle(content, el) {
        content.style.fontSize = (el.fontSize || 14) + "px";
        content.style.fontWeight = el.fontWeight || "normal";
        content.style.fontStyle = el.fontStyle || "normal";
        if (el.fontFamily && el.fontFamily !== "inherit") content.style.fontFamily = el.fontFamily;
        content.style.color = el.color || "#111827";
        content.style.textAlign = el.textAlign || "left";
        if (el.lineHeight) content.style.lineHeight = el.lineHeight;
        if (el.padding !== undefined) content.style.padding = el.padding + "px";
        content.style.whiteSpace = "pre-wrap";

        var decoration = el.textDecoration;
        if (decoration && decoration !== "none") {
            content.style.textDecoration = decoration;
            if (el.textDecorationStyle && el.textDecorationStyle !== "solid") {
                content.style.textDecorationStyle = el.textDecorationStyle;
            }
            if (el.textDecorationColor) content.style.textDecorationColor = el.textDecorationColor;
        }
        if (el.textTransform && el.textTransform !== "none") {
            content.style.textTransform = el.textTransform;
        }
        var spacing = el.letterSpacing;
        if (spacing !== undefined && spacing !== null && spacing !== "") {
            content.style.letterSpacing = Number(spacing) + "px";
        }
    }

    function rvApplyBoxChrome(content, el) {
        if (el.background && el.background !== "transparent") content.style.background = el.background;
        if (el.borderStyle && el.borderStyle !== "none") {
            content.style.border = el.borderWidth + "px " + el.borderStyle + " " + el.borderColor;
        }
    }

    function rvPlaceholder(text) {
        var div = document.createElement("div");
        div.className = "rv-img-placeholder";
        div.textContent = text || "Image";
        return div;
    }

    /* =============================================================
       VIEWER INSTANCE
    ============================================================= */
    function ReportViewer(container, template, data, options) {
        options = options || {};
        this.container = typeof container === "string" ? document.querySelector(container) : container;
        if (!this.container) throw new Error("ReportViewer: container not found.");
        this.template = parseTemplate(template);
        this.data = (typeof data === "string") ? JSON.parse(data) : (data || {});
        this.options = options;

        rvInjectCss();
        this.applyPrintStyle();

        this.viewer = document.createElement("div");
        this.viewer.className = "rv-viewer";
        this.toolbar = document.createElement("div");
        this.toolbar.className = "rv-toolbar";
        this.pagesArea = document.createElement("div");
        this.pagesArea.className = "rv-pages";
        this.viewer.appendChild(this.toolbar);
        this.viewer.appendChild(this.pagesArea);
        this.container.innerHTML = "";
        this.container.appendChild(this.viewer);

        // Mark the container and its ancestors so the print CSS can isolate
        // the report: everything outside this chain is hidden when printing.
        this.printAncestors = [];
        var node = this.container;
        while (node && node !== document.body && node.nodeType === 1) {
            if (node.classList) node.classList.add("rv-print-ancestor");
            this.printAncestors.push(node);
            node = node.parentElement;
        }

        this.pageShells = [];
        this.currentPage = 0;
        this.zoom = options.zoom || 1;
        this.reserveBands = options.reserveBands !== false;
        this.debug = !!options.debug;
        this.stickyEnabled = options.stickyHeader === true;
        this.buildToolbar();

        var self = this;

        // Optional web fonts (e.g. Google Fonts) used by the template.
        if (Array.isArray(options.fonts)) {
            options.fonts.forEach(function (href) {
                if (!document.querySelector('link[href="' + href + '"]')) {
                    var link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = href;
                    document.head.appendChild(link);
                }
            });
        }

        this.renderAll();

        // Once fonts are loaded, re-measure so row heights and pagination
        // match the final typography (fonts can change measured heights).
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                if (self.viewer && self.viewer.parentNode) self.renderAll();
            });
        }

        if (options.zoom === undefined && this.container.clientWidth > 0) {
            this.fitWidth();
        }
        if (typeof options.onReady === "function") {
            options.onReady(this);
        }
        if (this.indicator) {
            this.indicator.textContent = "Page 1 / " + this.plan.length;
        }

        // Track the most recent live viewer so RV.print() can isolate too.
        RV._active = this;

        // Sticky report header: pins the header band while scrolling.
        this.setupStickyHeader();
    }

    ReportViewer.prototype.buildToolbar = function () {
        var self = this;
        var brand = document.createElement("span");
        brand.className = "rv-brand";
        brand.textContent = "Report Viewer";
        this.toolbar.appendChild(brand);

        var zoomOut = document.createElement("button");
        zoomOut.className = "rv-btn";
        zoomOut.textContent = "−";
        zoomOut.title = "Zoom out";
        zoomOut.addEventListener("click", function () { self.setZoom(self.zoom - 0.1); });
        this.toolbar.appendChild(zoomOut);

        var zoomLabel = document.createElement("span");
        zoomLabel.className = "rv-zoom-label";
        zoomLabel.textContent = "100%";
        this.toolbar.appendChild(zoomLabel);
        this.zoomLabel = zoomLabel;

        var zoomIn = document.createElement("button");
        zoomIn.className = "rv-btn";
        zoomIn.textContent = "+";
        zoomIn.title = "Zoom in";
        zoomIn.addEventListener("click", function () { self.setZoom(self.zoom + 0.1); });
        this.toolbar.appendChild(zoomIn);

        var fit = document.createElement("button");
        fit.className = "rv-btn";
        fit.textContent = "Fit width";
        fit.addEventListener("click", function () { self.fitWidth(); });
        this.toolbar.appendChild(fit);

        var nav = document.createElement("div");
        nav.className = "rv-nav";

        var prev = document.createElement("button");
        prev.className = "rv-btn";
        prev.textContent = "←";
        prev.title = "Previous page";
        prev.addEventListener("click", function () { self.goToPage(self.currentPage - 1); });
        nav.appendChild(prev);

        var indicator = document.createElement("span");
        indicator.className = "rv-page-indicator";
        indicator.textContent = "Page 1 / 1";
        nav.appendChild(indicator);
        this.indicator = indicator;

        var next = document.createElement("button");
        next.className = "rv-btn";
        next.textContent = "→";
        next.title = "Next page";
        next.addEventListener("click", function () { self.goToPage(self.currentPage + 1); });
        nav.appendChild(next);

        this.toolbar.appendChild(nav);

        var print = document.createElement("button");
        print.className = "rv-btn rv-primary";
        print.textContent = "Print";
        print.title = "Print the report";
        print.addEventListener("click", function () { self.print(); });
        this.toolbar.appendChild(print);
    };

    ReportViewer.prototype.computeBandZones = function () {
        var pageH = this.px.h;
        if (!this.reserveBands) return { headerBottom: 0, footerTop: pageH };

        var headerBandMax = Math.max(40, Math.min(220, Math.floor(pageH * 0.25)));
        var footerBandMin = Math.min(pageH - 40, Math.max(pageH - 220, Math.floor(pageH * 0.75)));

        var headerBottom = 0;
        var footerTop = pageH;
        var hasFooter = false;
        this.template.elements.forEach(function (el) {
            if (el.visible === false) return;
            var y = Number(el.y) || 0;
            if (el.band === "header" && y < headerBandMax) {
                headerBottom = Math.max(headerBottom, y + (Number(el.height) || 0));
            } else if (el.band === "footer" && y > footerBandMin) {
                hasFooter = true;
                footerTop = Math.min(footerTop, y);
            }
        });

        headerBottom = Math.max(0, Math.min(headerBottom, headerBandMax));
        if (!hasFooter || footerTop <= headerBandMax) footerTop = pageH;
        footerTop = Math.max(headerBottom + 20, Math.min(footerTop, pageH));
        return { headerBottom: headerBottom, footerTop: footerTop };
    };

    ReportViewer.prototype.buildPlan = function () {
        var self = this;
        var plan = [];
        var autoCounter = 0;
        var flowCounter = 0;
        this.px = getPagePx(this.template);
        var pageW = this.px.w;
        var pageH = this.px.h;
        var zones = this.computeBandZones();

        this.flowedIds = {};
        this.template.pages.forEach(function (pageId) {
            var page = { pageId: pageId, isAuto: false, fragments: {}, flowElements: [], flowIds: {} };
            plan.push(page);

            var bodyEls = [];
            self.template.elements.forEach(function (el) {
                if (el.band === "header" || el.band === "footer") return;
                if (el.visible === false) return;
                if (el.page !== pageId) return;
                bodyEls.push(el);
            });
            bodyEls.sort(function (a, b) { return (Number(a.y) || 0) - (Number(b.y) || 0); });

            var tables = [];
            var pending = [];
            var shift = 0;
            var anchorIndex = -1;

            bodyEls.forEach(function (el) {
                if (el.type === "table") {
                    var startY = (Number(el.y) || 0) + shift;
                    var fragments = rvPaginateTable(el, self.data, pageW, pageH, zones, self.debug, startY);

                    if (self.debug) {
                        console.log("[ReportViewer] table " + el.id + " y=" + el.y + " startY=" + startY +
                            " natural=" + fragments.naturalHeight + " designH=" + (Number(el.height) || 0) +
                            " zones={headerBottom:" + zones.headerBottom + ", footerTop:" + zones.footerTop + "}" +
                            " fragments=" + JSON.stringify(fragments.map(function (f) {
                                return { start: f.rowStart, count: f.rowCount, y: f.y };
                            })));
                    }

                    var lastFragPage = page;
                    fragments.forEach(function (frag, i) {
                        if (i === 0) {
                            page.fragments[el.id] = frag;
                        } else {
                            autoCounter++;
                            lastFragPage = {
                                pageId: el.id + "-auto-" + autoCounter,
                                isAuto: true,
                                fragments: {},
                                flowElements: [],
                                flowIds: {}
                            };
                            lastFragPage.fragments[el.id] = frag;
                            plan.push(lastFragPage);
                        }
                    });

                    var designH = Math.max(0, Number(el.height) || 0);
                    var growth = Math.max(0, (fragments.naturalHeight || 0) - designH);
                    tables.push({
                        el: el,
                        growth: growth,
                        designH: designH,
                        frags: fragments,
                        lastFrag: fragments[fragments.length - 1],
                        lastFragPage: lastFragPage
                    });
                    shift += growth;
                    anchorIndex = tables.length - 1;
                } else {
                    pending.push({
                        el: el,
                        anchorIndex: anchorIndex,
                        yAbs: (Number(el.y) || 0) + shift
                    });
                }
            });

            var flowPages = [];
            function flowPage() {
                var fp = {
                    pageId: "rv-flow-" + (++flowCounter),
                    isAuto: true,
                    fragments: {},
                    flowElements: [],
                    flowIds: {},
                    flowRefGap: null
                };
                flowPages.push(fp);
                return fp;
            }

            var perAnchor = {};
            pending.forEach(function (pnd) {
                var key = String(pnd.anchorIndex);
                if (!perAnchor[key]) perAnchor[key] = [];
                perAnchor[key].push(pnd);
            });

            Object.keys(perAnchor).forEach(function (ai) {
                var anchor = tables[Number(ai)];
                if (!anchor) return;
                var items = perAnchor[ai];
                var lastFrag = anchor.lastFrag;
                var tableEndLocal = lastFrag.y + lastFrag.height;
                var currentFlowPage = null;

                items.forEach(function (item) {
                    var gap = (Number(item.el.y) || 0) - ((Number(anchor.el.y) || 0) + anchor.designH);
                    var y = tableEndLocal + gap;
                    var targetPage = anchor.lastFragPage;

                    if (y + (Number(item.el.height) || 0) > zones.footerTop) {
                        if (!currentFlowPage ||
                            zones.headerBottom + Math.max(0, gap - (currentFlowPage.flowRefGap === null ? gap : currentFlowPage.flowRefGap)) +
                            (Number(item.el.height) || 0) > zones.footerTop) {
                            currentFlowPage = flowPage();
                            currentFlowPage.flowRefGap = gap;
                        }
                        targetPage = currentFlowPage;
                        y = zones.headerBottom + Math.max(0, gap - currentFlowPage.flowRefGap);
                    }

                    if (self.debug) {
                        console.log("[ReportViewer] flow: " + item.el.id + " designed y=" + item.el.y +
                            " gap=" + gap + " -> page " + targetPage.pageId + " y=" + y);
                    }
                    self.flowedIds[item.el.id] = true;
                    targetPage.flowElements.push({ el: item.el, x: item.el.x, y: y });
                    targetPage.flowIds[item.el.id] = true;
                });
            });

            flowPages.forEach(function (fp) { plan.push(fp); });
        });
        return plan;
    };

    ReportViewer.prototype.renderAll = function () {
        var self = this;
        this.pagesArea.innerHTML = "";
        this.pageShells = [];
        this.plan = this.buildPlan();
        var totalPages = this.plan.length;

        if (!this.template.elements.length) {
            var empty = document.createElement("div");
            empty.className = "rv-empty";
            empty.textContent = "The template has no elements.";
            this.pagesArea.appendChild(empty);
            if (this.stickyBar) this.updateStickyHeader();
            return;
        }

        this.plan.forEach(function (planPage, pageIndex) {
            var shell = document.createElement("div");
            shell.className = "rv-page-shell";

            var label = document.createElement("div");
            label.className = "rv-page-label";
            label.textContent = "Page " + (pageIndex + 1) + " · " + totalPages;
            shell.appendChild(label);

            var page = document.createElement("div");
            page.className = "rv-page";
            page.dataset.page = planPage.pageId;
            page.style.width = self.px.w + "px";
            page.style.height = self.px.h + "px";

            self.renderPage(page, planPage, pageIndex, totalPages);

            shell.appendChild(page);
            self.pagesArea.appendChild(shell);
            self.pageShells.push(shell);
        });

        this.applyZoom();
        if (this.indicator) {
            this.indicator.textContent = "Page 1 / " + totalPages;
        }
    };

    ReportViewer.prototype.renderPage = function (pageEl, planPage, pageIndex, totalPages) {
        var self = this;
        this.template.elements.forEach(function (el) {
            if (el.visible === false) return;

            if (el.band === "header" || el.band === "footer") {
                self.renderElement(pageEl, el, pageIndex, totalPages);
                return;
            }
            if (self.flowedIds && self.flowedIds[el.id]) return;
            if (el.type === "table") {
                var fragment = planPage.fragments[el.id];
                if (fragment) self.renderTableFragment(pageEl, el, fragment, pageIndex, totalPages);
                return;
            }
            if (planPage.isAuto) return;
            if (el.page !== planPage.pageId) return;

            self.renderElement(pageEl, el, pageIndex, totalPages);
        });

        (planPage.flowElements || []).forEach(function (item) {
            self.renderElement(pageEl, item.el, pageIndex, totalPages, { x: item.x, y: item.y });
        });
    };

    ReportViewer.prototype.renderTableFragment = function (pageEl, el, fragment, pageIndex, totalPages) {
        var wrapper = document.createElement("div");
        wrapper.className = "rv-element rv-table-host";
        wrapper.style.left = fragment.x + "px";
        wrapper.style.top = fragment.y + "px";
        wrapper.style.width = fragment.width + "px";
        if (el.opacity !== undefined) wrapper.style.opacity = el.opacity;

        var content = document.createElement("div");
        content.className = "rv-content";
        rvRenderAdvancedTable(content, el, this.data, { fragment: fragment });

        wrapper.appendChild(content);
        pageEl.appendChild(wrapper);
    };

    ReportViewer.prototype.renderElement = function (pageEl, el, pageIndex, totalPages, pos) {
        var wrapper = document.createElement("div");
        wrapper.className = "rv-element";
        if (el.band) wrapper.classList.add("rv-band-" + el.band);
        if (el.id) wrapper.dataset.elId = el.id;
        wrapper.style.left = (pos ? pos.x : el.x) + "px";
        wrapper.style.top = (pos ? pos.y : el.y) + "px";
        wrapper.style.width = el.width + "px";
        wrapper.style.height = el.height + "px";
        if (el.opacity !== undefined) wrapper.style.opacity = el.opacity;
        if (el.rotation) wrapper.style.transform = "rotate(" + el.rotation + "deg)";

        var content = document.createElement("div");
        content.className = "rv-content";

        if (el.type === "text") {
            var resolved = resolveTokens(el.content || "", this.data, pageIndex, totalPages);
            // escapeHtml + pre-wrap (set by rvApplyTextStyle) preserves newlines.
            content.innerHTML = escapeHtml(resolved);
            rvApplyTextStyle(content, el);
            rvApplyBoxChrome(content, el);
        } else if (el.type === "field") {
            var value;
            if (el.expression) {
                try {
                    value = rxeRenderValue(el, rxeEvaluateString(el.expression, rxeMakeContext(null, this.data)));
                } catch (e) {
                    value = "! " + (e.message || String(e));
                }
            } else {
                value = formatValue(getDataValue(this.data, el.field), el.format, el.decimals);
            }
            content.innerHTML = escapeHtml(el.prefix || "") + escapeHtml(value) + escapeHtml(el.suffix || "");
            rvApplyTextStyle(content, el);
        } else if (el.type === "expression") {
            var exprValue;
            try {
                exprValue = rxeRenderValue(el, rxeEvaluateString(el.expression, rxeMakeContext(null, this.data)));
            } catch (e) {
                exprValue = "! " + (e.message || String(e));
            }
            content.innerHTML = escapeHtml(el.prefix || "") + escapeHtml(exprValue) + escapeHtml(el.suffix || "");
            rvApplyTextStyle(content, el);
        } else if (el.type === "pagenum") {
            content.textContent = formatPagePattern(el.pattern, pageIndex, totalPages);
            rvApplyTextStyle(content, el);
        } else if (el.type === "date") {
            content.textContent = (el.prefix || "") + formatCurrentDate(el.dateFormat || "short") + (el.suffix || "");
            rvApplyTextStyle(content, el);
        } else if (el.type === "table") {
            rvRenderAdvancedTable(content, el, this.data);
        } else if (el.type === "chart") {
            content.innerHTML = rvChartSvg(el, this.data);
        } else if (el.type === "image") {
            var src = "";
            if (el.imageField) src = rvGetFirstDataValue(this.data, el.imageField);
            var imgNorm = rvNormalizeImageSource(src);
            if (!imgNorm) {
                /* field empty/garbage → fall back to the manual URL
                   (normalised too, so raw base64 in the URL box works) */
                src = rvNormalizeImageSource(el.src || "") || el.src || "";
            } else {
                src = imgNorm;
            }
            if (src) {
                var img = document.createElement("img");
                img.src = src;
                img.alt = "";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = el.objectFit || "contain";
                img.style.borderRadius = (el.borderRadius || 0) + "px";
                img.addEventListener("error", function () {
                    if (img.parentNode) {
                        img.parentNode.replaceChild(rvPlaceholder("Image not found"), img);
                    }
                });
                content.appendChild(img);
            } else {
                content.appendChild(rvPlaceholder(el.imageField ? "No image value in field" : "Image"));
            }
        } else if (el.type === "line") {
            var line = document.createElement("div");
            var thickness = Math.max(1, Number(el.thickness) || 1);
            if (el.lineStyle && el.lineStyle !== "solid") {
                line.style.borderTop = thickness + "px " + el.lineStyle + " " + (el.color || "#111827");
            } else {
                line.style.height = thickness + "px";
                line.style.background = el.color || "#111827";
            }
            content.appendChild(line);
        } else if (el.type === "rectangle") {
            content.style.background = el.background === "transparent" ? "transparent" : (el.background || "transparent");
            content.style.border = (el.borderWidth || 0) + "px solid " + (el.borderColor || "#111827");
            content.style.borderRadius = (el.borderRadius || 0) + "px";
            if (el.shadow) content.style.boxShadow = "0 6px 16px rgba(0,0,0,.18)";
        }

        wrapper.appendChild(content);
        pageEl.appendChild(wrapper);
    };

    ReportViewer.prototype.applyZoom = function () {
        var self = this;
        var zoom = Math.max(0.2, Math.min(3, Math.round(this.zoom * 100) / 100));
        this.zoom = zoom;
        if (this.zoomLabel) this.zoomLabel.textContent = Math.round(zoom * 100) + "%";
        this.pageShells.forEach(function (shell) {
            shell.style.width = (self.px.w * zoom) + "px";
            shell.style.height = (self.px.h * zoom) + "px";
            var page = shell.querySelector(".rv-page");
            if (page) page.style.transform = "scale(" + zoom + ")";
        });
        if (this.stickyBar) this.scheduleStickyUpdate();
    };

    ReportViewer.prototype.setZoom = function (zoom) {
        this.zoom = zoom;
        this.applyZoom();
    };

    ReportViewer.prototype.fitWidth = function () {
        var available = Math.max(200, this.container.clientWidth - 28);
        var zoom = Math.max(0.2, Math.min(1.5, available / this.px.w));
        this.setZoom(zoom);
    };

    ReportViewer.prototype.goToPage = function (index) {
        if (index < 0 || index >= this.pageShells.length) return;
        this.currentPage = index;
        var shell = this.pageShells[index];
        if (shell && typeof shell.scrollIntoView === "function") {
            shell.scrollIntoView({ block: "start", behavior: "smooth" });
        }
        if (this.indicator) {
            this.indicator.textContent = "Page " + (index + 1) + " / " + this.pageShells.length;
        }
    };

    ReportViewer.prototype.setData = function (data) {
        this.data = (typeof data === "string") ? JSON.parse(data) : (data || {});
        this.renderAll();
    };

    ReportViewer.prototype.setTemplate = function (template) {
        this.template = parseTemplate(template);
        this.applyPrintStyle();
        this.renderAll();
    };

    ReportViewer.prototype.loadTemplate = function (url) {
        var self = this;
        return fetch(url).then(function (response) {
            if (!response.ok) {
                throw new Error("ReportViewer: failed to load template (" + response.status + " " + response.statusText + ")");
            }
            return response.text();
        }).then(function (text) {
            self.template = parseTemplate(text);
            self.applyPrintStyle();
            self.renderAll();
            return self;
        });
    };

    ReportViewer.prototype.applyPrintStyle = function () {
        var mm = getPageMm(this.template);
        var style = document.getElementById("rv-print-style");
        if (!style) {
            style = document.createElement("style");
            style.id = "rv-print-style";
            document.head.appendChild(style);
        }
        style.textContent = "@page { size: " + mm.w + "mm " + mm.h + "mm; margin: 0; }";
    };

    /* Build a self-contained print stylesheet: only the rules the report
       needs, never the host page's layout / framework CSS. Used inside
       the isolated print iframe (and as a reference for host Ctrl+P). */
    function rvPrintDocumentCss(pageMm) {
        return [
            "@page{size:" + pageMm.w + "mm " + pageMm.h + "mm;margin:0;}",
            "html,body{margin:0;padding:0;background:#fff;}",
            "body{color:#111827;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif;}",
            "*,*::before,*::after{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}",
            ".rv-print-root{margin:0;padding:0;background:#fff;}",
            ".rv-page-shell{margin:0;padding:0;width:auto;height:auto;}",
            ".rv-page-label{display:none;}",
            ".rv-sticky-header{display:none !important;}",
            ".rv-page{position:relative;background:#fff;box-shadow:none;overflow:visible;transform:none;margin:0 auto;",
            "  break-after:page;page-break-after:always;break-inside:avoid-page;}",
            ".rv-page:last-child{break-after:auto;page-break-after:auto;}",
            ".rv-element{position:absolute;user-select:none;z-index:1;overflow:visible;}",
            ".rv-content{width:100%;height:100%;overflow:visible;}",
            ".rv-element.rv-table-host{height:auto;}",
            ".rv-element.rv-table-host .rv-content{height:auto;overflow:visible;}",
            ".rv-img-placeholder{display:flex;align-items:center;justify-content:center;width:100%;height:100%;",
            "  color:#9ca3af;font-size:13px;font-weight:700;background:rgba(243,244,246,.4);",
            "  border:2px dashed #d1d5db;border-radius:6px;text-align:center;padding:4px;}",
            ".rv-table{width:100%;height:auto;border-collapse:collapse;table-layout:fixed;}",
            ".rv-table th,.rv-table td{border:1px solid #374151;padding:5px 6px;font-size:12px;overflow:hidden;",
            "  text-overflow:clip;white-space:normal !important;word-break:break-word;overflow-wrap:break-word;}",
            ".rv-table th{background:#f3f4f6;font-weight:700;}",
            ".rv-group-row td{letter-spacing:.01em;}",
            ".rv-group-total-cell{font-weight:600;white-space:normal;}",
            ".rv-subtotal-row td,.rv-grand-total-row td{white-space:normal;}",
            "img{max-width:100%;-webkit-print-color-adjust:exact;print-color-adjust:exact;}"
        ].join("\n");
    }

    /* Resolve relative URLs (img src, etc.) against the host document so
       resources still load inside the print iframe. */
    function rvAbsolutizeUrls(root, baseHref) {
        if (!root || !root.querySelectorAll) return;
        var base = baseHref || (typeof location !== "undefined" ? location.href : "");
        var attrs = ["src", "href"];
        attrs.forEach(function (attr) {
            Array.prototype.forEach.call(root.querySelectorAll("[" + attr + "]"), function (node) {
                var value = node.getAttribute(attr);
                if (!value || /^(?:#|data:|blob:|https?:|\/\/|mailto:|javascript:)/i.test(value)) return;
                try {
                    node.setAttribute(attr, new URL(value, base).href);
                } catch (e) { /* leave as-is */ }
            });
        });
        // Inline style url(...) is rare for reports; skip for safety/perf.
    }

    function rvWaitForImages(doc, timeoutMs) {
        var images = doc ? Array.prototype.slice.call(doc.images || []) : [];
        if (!images.length) return Promise.resolve();
        var pending = images.filter(function (img) { return !img.complete; });
        if (!pending.length) return Promise.resolve();
        return new Promise(function (resolve) {
            var left = pending.length;
            var settled = false;
            var finish = function () {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve();
            };
            var timer = setTimeout(finish, timeoutMs || 4000);
            var onOne = function () {
                left--;
                if (left <= 0) finish();
            };
            pending.forEach(function (img) {
                img.addEventListener("load", onOne, { once: true });
                img.addEventListener("error", onOne, { once: true });
            });
        });
    }

    /* Print via a detached iframe that contains ONLY the report pages and
       the viewer's own CSS. Host layout, Bootstrap/Tailwind/app chrome, etc.
       never reach the printed output. Falls back to window.print() if the
       iframe path is unavailable.
       options.printMode:
         - "iframe" (default) — isolated document
         - "host"             — classic in-page @media print path
    */
    /* ReportViewer.prototype.print = function () {
         var mode = (this.options && this.options.printMode) || "iframe";
         if (mode === "host") {
             try { window.print(); } catch (e) { /!* unavailable *!/ }
             return;
         }
         try {
             this.printIsolated();
         } catch (err) {
             if (this.debug) console.warn("[ReportViewer] isolated print failed, falling back:", err);
             try { window.print(); } catch (e) { /!* unavailable *!/ }
         }
     };
 
     ReportViewer.prototype.printIsolated = function () {
         var self = this;
         if (!this.viewer || !this.pagesArea) {
             try { window.print(); } catch (e) { /!* unavailable *!/ }
             return;
         }
 
         var mm = getPageMm(this.template);
         var pagesClone = this.pagesArea.cloneNode(true);
 
         // Drop screen-only chrome that may have been cloned.
         Array.prototype.forEach.call(pagesClone.querySelectorAll(".rv-page-label"), function (node) {
             if (node.parentNode) node.parentNode.removeChild(node);
         });
         // Undo zoom transform so pages print at real size.
         Array.prototype.forEach.call(pagesClone.querySelectorAll(".rv-page-shell"), function (shell) {
             shell.style.width = "";
             shell.style.height = "";
             shell.style.margin = "0";
             shell.style.transform = "";
             shell.removeAttribute("style");
             shell.style.margin = "0";
         });
         Array.prototype.forEach.call(pagesClone.querySelectorAll(".rv-page"), function (page) {
             // Keep width/height (page size) but clear zoom/shadow.
             var w = page.style.width;
             var h = page.style.height;
             page.removeAttribute("style");
             if (w) page.style.width = w;
             if (h) page.style.height = h;
             page.style.transform = "none";
             page.style.boxShadow = "none";
             page.style.margin = "0 auto";
             page.style.overflow = "visible";
         });
 
         rvAbsolutizeUrls(pagesClone, typeof location !== "undefined" ? location.href : "");
 
         // Collect font stylesheets the host injected for this report.
         var fontLinks = "";
         var fonts = (this.options && this.options.fonts) || [];
         fonts.forEach(function (href) {
             if (!href) return;
             try {
                 var abs = new URL(href, typeof location !== "undefined" ? location.href : href).href;
                 fontLinks += '<link rel="stylesheet" href="' + escapeHtml(abs) + '">';
             } catch (e) {
                 fontLinks += '<link rel="stylesheet" href="' + escapeHtml(String(href)) + '">';
             }
         });
 
         // Serialize page shells only (unwrap .rv-pages chrome).
         var bodyHtml = "";
         Array.prototype.forEach.call(pagesClone.children, function (child) {
             bodyHtml += child.outerHTML;
         });
         if (!bodyHtml) bodyHtml = pagesClone.innerHTML;
 
         var css = rvPrintDocumentCss(mm);
         var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
             "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
             "<title>Print</title>" +
             fontLinks +
             "<style>" + css + "</style>" +
             "</head><body class=\"rv-print-root\">" + bodyHtml + "</body></html>";
 
         // Remove any previous print frame.
         var old = document.getElementById("rv-print-frame");
         if (old && old.parentNode) old.parentNode.removeChild(old);
 
         var frame = document.createElement("iframe");
         frame.id = "rv-print-frame";
         frame.setAttribute("aria-hidden", "true");
         frame.setAttribute("title", "Print frame");
         // Off-screen but sized so layout/pagination metrics stay valid.
         frame.style.cssText = [
             "position:fixed",
             "left:0",
             "top:0",
             "width:0",
             "height:0",
             "border:0",
             "opacity:0",
             "pointer-events:none",
             "visibility:hidden"
         ].join(";");
 
         var cleanup = function () {
             try {
                 if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
             } catch (e) { /!* ignore *!/ }
         };
 
         var doPrint = function () {
             var win = frame.contentWindow;
             try {
                 if (win) {
                     win.focus();
                     win.print();
                 } else {
                     window.print();
                 }
             } catch (e) {
                 try { window.print(); } catch (e2) { /!* unavailable *!/ }
             } finally {
                 // Delay removal so the print dialog can snapshot the document.
                 setTimeout(cleanup, 1500);
             }
         };
 
         var onFrameReady = function () {
             var win = frame.contentWindow;
             var doc = frame.contentDocument || (win && win.document);
             if (!doc) {
                 cleanup();
                 try { window.print(); } catch (e) { /!* unavailable *!/ }
                 return;
             }
 
             var ready = Promise.resolve();
             if (doc.fonts && doc.fonts.ready) {
                 ready = ready.then(function () { return doc.fonts.ready; }).catch(function () {});
             }
             ready = ready.then(function () { return rvWaitForImages(doc, 4000); });
             ready.then(function () {
                 if (win && win.requestAnimationFrame) {
                     win.requestAnimationFrame(function () {
                         win.requestAnimationFrame(doPrint);
                     });
                 } else {
                     setTimeout(doPrint, 50);
                 }
             }).catch(function () {
                 doPrint();
             });
         };
 
         // Prefer srcdoc (atomic, no host CSS inheritance). Fallback to write().
         frame.addEventListener("load", onFrameReady, { once: true });
         document.body.appendChild(frame);
 
         if ("srcdoc" in frame) {
             frame.srcdoc = html;
         } else {
             var win = frame.contentWindow;
             var doc = frame.contentDocument || (win && win.document);
             if (!doc) {
                 cleanup();
                 try { window.print(); } catch (e) { /!* unavailable *!/ }
                 return;
             }
             doc.open();
             doc.write(html);
             doc.close();
             // load may not fire after document.write in all browsers
             setTimeout(onFrameReady, 0);
         }
     };*/
    ReportViewer.prototype.print = function () {
        var self = this;
        var mode = (this.options && this.options.printMode) || "iframe";

        if (mode === "host") {
            window.print();
            return Promise.resolve(true);
        }

        // Catch asynchronous failures too, unlike a try/catch around the call.
        return this.printIsolated().catch(function (error) {
            console.error("[ReportViewer] Print preparation failed:", error);
            if (self.options && typeof self.options.onPrintError === "function") {
                self.options.onPrintError(error);
            } else {
                window.alert("Could not prepare the report for printing. " + error.message);
            }
            // Do not silently print the entire host application as a fallback.
            return false;
        });
    };

    ReportViewer.prototype.printIsolated = function () {
        var self = this;
        if (this._rvPrintPreparing) return this._rvPrintPreparing;

        var frame = null;
        var deadline = null;
        var stopped = false;
        var timeoutMs = Number(this.options && this.options.printTimeoutMs) || 30000;

        function removeFrame() {
            if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
            if (self._rvPrintFrame === frame) self._rvPrintFrame = null;
        }

        function waitForImage(img) {
            return new Promise(function (resolve, reject) {
                var finished = false;
                function finish() {
                    if (finished) return;
                    finished = true;
                    img.removeEventListener("load", finish);
                    img.removeEventListener("error", finish);
                    if (!img.naturalWidth) {
                        reject(new Error("A report image could not load. Check the Network tab for failed image requests."));
                        return;
                    }
                    if (typeof img.decode === "function") {
                        img.decode().then(resolve, function () {
                            // Some browsers reject decode() for an otherwise loaded image.
                            if (img.complete && img.naturalWidth) resolve();
                            else reject(new Error("A report image could not be decoded."));
                        });
                    } else {
                        resolve();
                    }
                }
                img.addEventListener("load", finish);
                img.addEventListener("error", finish);
                if (img.complete) finish();
            });
        }

        var operation = new Promise(function (resolve, reject) {
            function fail(error) {
                if (stopped) return;
                stopped = true;
                clearTimeout(deadline);
                removeFrame();
                reject(error);
            }

            deadline = setTimeout(function () {
                fail(new Error("Print resources did not become ready within " + Math.round(timeoutMs / 1000) + " seconds. Check blocked or slow stylesheets, fonts and images."));
            }, timeoutMs);

            try {
                if (!self.pagesArea || !self.pagesArea.querySelector(".rv-page")) {
                    throw new Error("There are no report pages to print.");
                }

                // If afterprint was not delivered for the previous job, retain that
                // frame until the next explicit print request, rather than removing
                // it while the browser might still be consuming its document.
                if (self._rvPrintFrame && self._rvPrintFrame.parentNode) {
                    self._rvPrintFrame.parentNode.removeChild(self._rvPrintFrame);
                }

                var mm = getPageMm(self.template);
                var clone = self.pagesArea.cloneNode(true);
                Array.prototype.forEach.call(clone.querySelectorAll(".rv-page-label"), function (label) {
                    label.parentNode.removeChild(label);
                });
                Array.prototype.forEach.call(clone.querySelectorAll(".rv-page-shell"), function (shell) {
                    shell.removeAttribute("style");
                });
                Array.prototype.forEach.call(clone.querySelectorAll(".rv-page"), function (page) {
                    var w = page.style.width;
                    var h = page.style.height;
                    page.removeAttribute("style");
                    page.style.width = w;
                    page.style.height = h;
                    page.style.transform = "none";
                });
                Array.prototype.forEach.call(clone.querySelectorAll("img"), function (img) {
                    img.setAttribute("loading", "eager");
                });
                rvAbsolutizeUrls(clone, document.baseURI);

                var fontLinks = ((self.options && self.options.fonts) || []).map(function (href) {
                    return '<link rel="stylesheet" href="' + escapeHtml(new URL(href, document.baseURI).href) + '">';
                }).join("");

                // Each .rv-page is the last child of its own shell. The original
                // .rv-page:last-child rule therefore disabled EVERY page break.
                // Put explicit breaks on the shells instead.
                var css = rvPrintDocumentCss(mm) + "\n" + [
                    ".rv-page{break-after:auto;page-break-after:auto;}",
                    ".rv-page-shell{break-after:page;page-break-after:always;}",
                    ".rv-page-shell:last-child{break-after:auto;page-break-after:auto;}"
                ].join("\n");
                var marker = "rv-print-" + Date.now() + "-" + Math.random().toString(36).slice(2);
                var html = '<!doctype html><html><head><meta charset="utf-8">' +
                    '<title>Report</title><base href="' + escapeHtml(document.baseURI) + '">' +
                    fontLinks + '<style>' + css + '</style></head>' +
                    '<body class="rv-print-root" data-rv-print-job="' + marker + '">' +
                    clone.innerHTML + '</body></html>';

                frame = document.createElement("iframe");
                frame.title = "Report print document";
                frame.setAttribute("aria-hidden", "true");
                frame.tabIndex = -1;
                // Keep a non-zero, laid-out viewport. Do not use display:none,
                // visibility:hidden, or the child window's requestAnimationFrame.
                frame.style.cssText = "position:fixed;left:-100000px;top:0;" +
                    "width:" + getPagePx(self.template).w + "px;" +
                    "height:" + getPagePx(self.template).h + "px;" +
                    "border:0;pointer-events:none;";
                self._rvPrintFrame = frame;

                var started = false;
                function onLoad() {
                    if (stopped || started) return;
                    var win;
                    var doc;
                    try {
                        win = frame.contentWindow;
                        doc = frame.contentDocument;
                        // Ignore an initial about:blank event and incomplete writes.
                        if (!doc || doc.readyState !== "complete" || !doc.body ||
                            doc.body.getAttribute("data-rv-print-job") !== marker) return;
                        started = true;
                        // Trigger layout/font use before obtaining fonts.ready.
                        void doc.body.offsetHeight;
                        var waits = Array.prototype.map.call(doc.images, waitForImage);
                        if (doc.fonts && doc.fonts.ready) waits.push(doc.fonts.ready);
                        Promise.all(waits).then(function () {
                            if (stopped) return;
                            // A task in the HOST window, not rAF in an invisible frame.
                            setTimeout(function () {
                                if (stopped) return;
                                try {
                                    void doc.body.offsetHeight;
                                    if (typeof win.print !== "function") {
                                        throw new Error("This browser does not expose iframe printing.");
                                    }
                                    win.addEventListener("afterprint", function () {
                                        // afterprint is a lifecycle signal, not proof
                                        // the user actually completed a print job.
                                        setTimeout(removeFrame, 0);
                                    }, { once: true });
                                    clearTimeout(deadline);
                                    win.focus();
                                    win.print();
                                    stopped = true;
                                    resolve(true); // print() was invoked, not proof of printing
                                } catch (error) {
                                    fail(error);
                                }
                            }, 100);
                        }).catch(fail);
                    } catch (error) {
                        fail(error);
                    }
                }

                frame.addEventListener("load", onLoad);
                if ("srcdoc" in frame) {
                    // Set the target document BEFORE insertion.
                    frame.srcdoc = html;
                    document.body.appendChild(frame);
                } else {
                    document.body.appendChild(frame);
                    var doc = frame.contentDocument || frame.contentWindow.document;
                    doc.open();
                    doc.write(html);
                    doc.close();
                    // Fallback for implementations that omit load after write().
                    // Poll readiness, not elapsed time as a proxy for readiness.
                    (function checkReady() {
                        if (stopped || started) return;
                        onLoad();
                        if (!stopped && !started) setTimeout(checkReady, 50);
                    })();
                }
            } catch (error) {
                fail(error);
            }
        });

        this._rvPrintPreparing = operation.then(function (result) {
            self._rvPrintPreparing = null;
            return result;
        }, function (error) {
            self._rvPrintPreparing = null;
            throw error;
        });
        return this._rvPrintPreparing;
    };


    /* =============================================================
       STICKY HEADER — pins the header band to the top of the scroll
       area while scrolling through the report.
    ============================================================= */
    ReportViewer.prototype.setupStickyHeader = function () {
        var self = this;
        if (this.stickyBar) return;
        var bar = document.createElement("div");
        bar.className = "rv-sticky-header";
        bar.setAttribute("aria-hidden", "true");
        var inner = document.createElement("div");
        inner.className = "rv-sticky-inner";
        bar.appendChild(inner);
        document.body.appendChild(bar);
        this.stickyBar = bar;
        this.stickyInner = inner;
        this.pagesArea.addEventListener("scroll", function () { self.scheduleStickyUpdate(); });
        window.addEventListener("resize", function () { self.scheduleStickyUpdate(); });
        window.addEventListener("scroll", function () { self.scheduleStickyUpdate(); }, { passive: true });
        this.updateStickyHeader();
    };

    ReportViewer.prototype.scheduleStickyUpdate = function () {
        var self = this;
        if (this._stickyRaf) return;
        this._stickyRaf = requestAnimationFrame(function () {
            self._stickyRaf = 0;
            self.updateStickyHeader();
        });
    };

    /* Index of the page currently at the top of the scroll area. */
    ReportViewer.prototype.stickyCurrentIndex = function () {
        var area = this.pagesArea;
        if (!area || !this.pageShells.length) return 0;
        var rect = area.getBoundingClientRect();
        var scrollTop = area.scrollTop || 0;
        var current = 0;
        for (var i = 0; i < this.pageShells.length; i++) {
            var s = this.pageShells[i];
            var sTop = (s.getBoundingClientRect().top - rect.top) + scrollTop;
            if (sTop <= scrollTop + 1) current = i;
        }
        return current;
    };

    ReportViewer.prototype.updateStickyHeader = function () {
        var bar = this.stickyBar;
        if (!bar) return;
        var self = this;

        function hide() { bar.classList.remove("rv-sticky-on"); }

        if (!this.stickyEnabled) return hide();
        if (!this.template || !Array.isArray(this.template.elements)) return hide();

        var headerEls = this.template.elements.filter(function (e) {
            return e.visible !== false && e.band === "header";
        });
        if (!headerEls.length) return hide();

        var area = this.pagesArea;
        if (!area || !this.pageShells.length) return hide();
        /* Nothing to pin when the report fits without scrolling. */
        if (area.scrollHeight <= area.clientHeight + 2) return hide();

        var current = this.stickyCurrentIndex();
        var shell = this.pageShells[current];
        var pageEl = shell ? shell.querySelector(".rv-page") : null;
        if (!pageEl) return hide();

        /* Height of the header region, clamped like band reservation. */
        var headerBandMax = Math.max(40, Math.min(220, Math.floor(this.px.h * 0.25)));
        var headerH = 0;
        headerEls.forEach(function (el) {
            var bottom = (Number(el.y) || 0) + (Number(el.height) || 0);
            if (bottom > headerH) headerH = bottom;
        });
        headerH = Math.max(1, Math.min(headerH, headerBandMax));

        var zoom = this.zoom || 1;
        var pageRect = pageEl.getBoundingClientRect();
        var areaRect = area.getBoundingClientRect();

        bar.style.left = pageRect.left + "px";
        bar.style.top = Math.max(areaRect.top, pageRect.top) + "px";
        bar.style.width = pageRect.width + "px";
        bar.style.height = (headerH * zoom) + "px";
        this.stickyInner.style.width = this.px.w + "px";
        this.stickyInner.style.height = headerH + "px";
        this.stickyInner.style.transform = "scale(" + zoom + ")";

        /* Clone the current page's header elements into the bar. */
        this.stickyInner.innerHTML = "";
        var clones = pageEl.querySelectorAll(".rv-element.rv-band-header");
        for (var i = 0; i < clones.length; i++) {
            this.stickyInner.appendChild(clones[i].cloneNode(true));
        }
        bar.classList.add("rv-sticky-on");
    };

    ReportViewer.prototype.destroy = function () {
        if (this.stickyBar && this.stickyBar.parentNode) this.stickyBar.parentNode.removeChild(this.stickyBar);
        this.stickyBar = null;
        this.stickyInner = null;
        if (this.viewer && this.viewer.parentNode) this.viewer.parentNode.removeChild(this.viewer);
        var style = document.getElementById("rv-print-style");
        if (style && style.parentNode) style.parentNode.removeChild(style);
        (this.printAncestors || []).forEach(function (node) {
            if (node.classList) node.classList.remove("rv-print-ancestor");
        });
        if (RV._active === this) RV._active = null;
    };

    /* =============================================================
       PUBLIC API
    ============================================================= */
    RV.version = "1.3.6";
    RV.render = function (container, template, data, options) {
        // A string that is neither a JSON object/array nor an exported
        // HTML document is treated as a URL to fetch.
        if (typeof template === "string" &&
            !/^\s*[\[{]/.test(template) &&
            template.indexOf("<!--") === -1) {
            return RV.load(container, template, data, options);
        }
        return new ReportViewer(container, template, data, options);
    };
    RV.load = function (container, url, data, options) {
        return fetch(url).then(function (response) {
            if (!response.ok) {
                throw new Error("ReportViewer: failed to load template (" + response.status + " " + response.statusText + ")");
            }
            return response.text();
        }).then(function (text) {
            return new ReportViewer(container, parseTemplate(text), data, options);
        });
    };
    RV.parseTemplate = parseTemplate;
    RV.print = function () {
        if (RV._active && typeof RV._active.print === "function") {
            RV._active.print();
            return;
        }
        try { window.print(); } catch (e) { /* unavailable */ }
    };

    /* =============================================================
       VUE 3 COMPONENT (Options API, for the global / CDN build)
       Parity with Report Viewer engine v1.3.0
    ============================================================= */
    var ReportViewerComponent = {
        name: "ReportViewer",

        // Render function so it works with BOTH the full build
        // (vue.global.js) and the runtime-only build (vue.runtime.global.js)
        // — no in-browser template compiler required.
        render: function () {
            var VueGlobal = global.Vue;
            var h = VueGlobal && VueGlobal.h
                ? VueGlobal.h
                : (this.$createElement || null);
            if (!h) {
                throw new Error(
                    "ReportViewer: Vue not found. Load Vue 3 (vue.global.js or " +
                    "vue.runtime.global.js) before report-viewer-vue.js."
                );
            }
            return h("div", {
                ref: "container",
                class: "report-viewer-root",
                style: {
                    width: "100%",
                    minHeight: "120px",
                    boxSizing: "border-box"
                }
            });
        },

        props: {
            /** Template object, JSON string, exported HTML document, or URL. */
            template: { type: [Object, String], default: null },
            /** Report data object / array / JSON string. */
            data: { type: [Object, Array, String], default: null },
            /**
             * Engine options (zoom, debug, fonts, reserveBands, onReady, …).
             * onReady is chained with the component's "ready" event.
             */
            options: { type: Object, default: function () { return {}; } }
        },

        emits: ["ready", "error", "loading"],

        data: function () {
            return {
                viewer: null,       // underlying ReportViewer instance
                loading: false,     // true while a URL template is fetched
                _setupToken: 0      // cancels stale async setups
            };
        },

        mounted: function () {
            this.setup();
        },

        beforeUnmount: function () {
            this.teardown();
        },

        // Vue 2 compatibility
        beforeDestroy: function () {
            this.teardown();
        },

        watch: {
            // A new template replaces the viewer entirely.
            template: {
                deep: true,
                handler: function (next, prev) {
                    // Skip no-op reference-equal object identity when both null
                    if (next === prev) return;
                    // For two identical URL strings, still skip
                    if (typeof next === "string" && next === prev) return;
                    this.teardown();
                    var self = this;
                    this.$nextTick(function () { self.setup(); });
                }
            },
            // New data re-renders in place (deep so nested mutations apply).
            data: {
                deep: true,
                handler: function (val) {
                    if (this.viewer) {
                        try {
                            this.viewer.setData(val);
                        } catch (err) {
                            this.$emit("error", err);
                        }
                    }
                }
            },
            // Options are applied at construction time → rebuild.
            options: {
                deep: true,
                handler: function () {
                    this.teardown();
                    var self = this;
                    this.$nextTick(function () { self.setup(); });
                }
            }
        },

        methods: {
            setup: function () {
                var el = this.$refs.container;
                if (!el) return;

                var token = ++this._setupToken;

                if (this.template == null || this.template === "") {
                    el.innerHTML =
                        '<div class="rv-empty">No template provided.</div>';
                    this.viewer = null;
                    this.loading = false;
                    this.$emit("loading", false);
                    return;
                }

                // Ensure CSS is present even before the engine paints.
                try { rvInjectCss(); } catch (e) { /* engine not ready */ }

                var options = this.options || {};
                var userOnReady = options.onReady;
                var self = this;
                var opts = Object.assign({}, options, {
                    onReady: function (viewer) {
                        if (token !== self._setupToken) return;
                        if (typeof userOnReady === "function") {
                            try { userOnReady(viewer); } catch (e) { /* user */ }
                        }
                        self.$emit("ready", viewer);
                    }
                });

                var result;
                try {
                    result = RV.render(el, this.template, this.data, opts);
                } catch (err) {
                    this.loading = false;
                    this.$emit("loading", false);
                    el.innerHTML =
                        '<div class="rv-empty">Failed to render template: ' +
                        escapeHtml((err && err.message) || String(err)) +
                        "</div>";
                    this.$emit("error", err);
                    return;
                }

                if (result && typeof result.then === "function") {
                    // URL template — Promise resolves to a viewer instance.
                    this.loading = true;
                    this.$emit("loading", true);
                    result
                        .then(function (viewer) {
                            if (token !== self._setupToken) {
                                // Stale: a newer setup superseded this one.
                                try { viewer.destroy(); } catch (e) { /* ignore */ }
                                return;
                            }
                            self.viewer = viewer;
                            self.loading = false;
                            self.$emit("loading", false);
                        })
                        .catch(function (err) {
                            if (token !== self._setupToken) return;
                            self.loading = false;
                            self.$emit("loading", false);
                            el.innerHTML =
                                '<div class="rv-empty">Failed to load template: ' +
                                escapeHtml((err && err.message) || String(err)) +
                                "</div>";
                            self.$emit("error", err);
                        });
                } else {
                    this.viewer = result;
                    this.loading = false;
                    this.$emit("loading", false);
                }
            },

            teardown: function () {
                // Invalidate any in-flight async setup.
                this._setupToken++;
                if (this.viewer) {
                    try { this.viewer.destroy(); } catch (e) { /* ignore */ }
                    this.viewer = null;
                }
                this.loading = false;
                var el = this.$refs.container;
                if (el) el.innerHTML = "";
            },

            /* ---- imperative API (callable via template ref) ---- */
            print: function () {
                if (this.viewer) this.viewer.print();
                else RV.print();
            },
            setData: function (data) {
                if (this.viewer) this.viewer.setData(data);
            },
            setTemplate: function (template) {
                if (this.viewer) {
                    try {
                        this.viewer.setTemplate(template);
                        return;
                    } catch (err) {
                        this.$emit("error", err);
                        return;
                    }
                }
                // No viewer yet — drive through the prop-like path.
                this.teardown();
                var self = this;
                // Temporarily assign and setup with the given template.
                var prev = this.template;
                // Call setup with an override by rendering directly:
                var el = this.$refs.container;
                if (!el) return;
                try {
                    var options = this.options || {};
                    var userOnReady = options.onReady;
                    var token = ++this._setupToken;
                    var opts = Object.assign({}, options, {
                        onReady: function (viewer) {
                            if (token !== self._setupToken) return;
                            if (typeof userOnReady === "function") userOnReady(viewer);
                            self.$emit("ready", viewer);
                        }
                    });
                    var result = RV.render(el, template, this.data, opts);
                    if (result && typeof result.then === "function") {
                        this.loading = true;
                        result.then(function (viewer) {
                            if (token !== self._setupToken) {
                                try { viewer.destroy(); } catch (e) {}
                                return;
                            }
                            self.viewer = viewer;
                            self.loading = false;
                        }).catch(function (err) {
                            if (token !== self._setupToken) return;
                            self.loading = false;
                            self.$emit("error", err);
                        });
                    } else {
                        this.viewer = result;
                    }
                } catch (err) {
                    this.$emit("error", err);
                }
            },
            loadTemplate: function (url) {
                var self = this;
                if (this.viewer) {
                    this.loading = true;
                    this.$emit("loading", true);
                    return this.viewer.loadTemplate(url).then(function (viewer) {
                        self.loading = false;
                        self.$emit("loading", false);
                        self.$emit("ready", viewer);
                        return viewer;
                    }).catch(function (err) {
                        self.loading = false;
                        self.$emit("loading", false);
                        self.$emit("error", err);
                        throw err;
                    });
                }
                // Initialize from URL.
                this.teardown();
                var el = this.$refs.container;
                if (!el) {
                    return Promise.reject(
                        new Error("ReportViewer: container is not available.")
                    );
                }
                this.loading = true;
                this.$emit("loading", true);
                var options = this.options || {};
                var userOnReady = options.onReady;
                var token = ++this._setupToken;
                var opts = Object.assign({}, options, {
                    onReady: function (viewer) {
                        if (token !== self._setupToken) return;
                        if (typeof userOnReady === "function") userOnReady(viewer);
                        self.$emit("ready", viewer);
                    }
                });
                return RV.load(el, url, this.data, opts).then(function (viewer) {
                    if (token !== self._setupToken) {
                        try { viewer.destroy(); } catch (e) {}
                        return viewer;
                    }
                    self.viewer = viewer;
                    self.loading = false;
                    self.$emit("loading", false);
                    return viewer;
                }).catch(function (err) {
                    if (token !== self._setupToken) throw err;
                    self.loading = false;
                    self.$emit("loading", false);
                    el.innerHTML =
                        '<div class="rv-empty">Failed to load template: ' +
                        escapeHtml((err && err.message) || String(err)) +
                        "</div>";
                    self.$emit("error", err);
                    throw err;
                });
            },
            goToPage: function (index) {
                if (this.viewer) this.viewer.goToPage(index);
            },
            setZoom: function (zoom) {
                if (this.viewer) this.viewer.setZoom(zoom);
            },
            fitWidth: function () {
                if (this.viewer) this.viewer.fitWidth();
            },
            render: function () {
                if (this.viewer) this.viewer.renderAll();
            },
            destroy: function () {
                this.teardown();
            },
            /** Returns the underlying ReportViewer instance (or null). */
            getViewer: function () {
                return this.viewer;
            }
        }
    };

    /* ---- auto-register ----
       Vue 2: global Vue.component() registration works.
       Vue 3: components are per-app, so patch Vue.createApp to register
       <report-viewer> into every app created after this script loads —
       this makes the documented "auto-registered" usage work with the
       Vue 3 CDN build too. Manual registration is always available via
       window.ReportViewerComponent. */
    if (global.Vue) {
        if (typeof global.Vue.component === "function") {
            try {
                global.Vue.component("report-viewer", ReportViewerComponent);
            } catch (e) { /* ignore */ }
        }
        if (typeof global.Vue.createApp === "function" && !global.Vue.__rvPatched) {
            var rvOrigCreateApp = global.Vue.createApp;
            global.Vue.createApp = function () {
                var app = rvOrigCreateApp.apply(global.Vue, arguments);
                try {
                    app.component("report-viewer", ReportViewerComponent);
                } catch (e) { /* ignore */ }
                return app;
            };
            global.Vue.__rvPatched = true;
        }
    }

    /* ---- expose for manual use ---- */
    global.ReportViewer = RV;                              // standalone engine
    global.ReportViewerComponent = ReportViewerComponent;  // Vue component
    if (typeof global.rv === "undefined") global.rv = RV;


})(typeof window !== "undefined" ? window : this);
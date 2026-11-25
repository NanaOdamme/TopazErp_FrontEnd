/*!
 * shimmer.js — automatic loading shimmer for ASP.NET Core (Razor) pages
 * ------------------------------------------------------------------------
 * WHY
 *   Every page that pulls data over JSON shows the same ugly moment: empty
 *   cards, empty tables, then content popping in. This file gives every page
 *   a shimmer skeleton without touching a single .cshtml.
 *
 * HOW
 *   1. It wraps window.fetch and XMLHttpRequest (so jQuery $.ajax / $.get,
 *      axios and native fetch are all covered).
 *   2. When the first data request starts it measures the content blocks on
 *      the page and floats an opaque skeleton overlay on top of each one.
 *   3. When the last request settles the overlays are removed.
 *
 *   Nothing inside your page is modified: no innerHTML is replaced, no node
 *   is moved. Overlays are appended to <body> and absolutely positioned over
 *   the element they cover, so Vue / jQuery / DataTables keep their own DOM.
 *
 * INSTALL (one line, in your shared layout — Views/Shared/_Layout.cshtml)
 *   <script src="~/js/shimmer.js" asp-append-version="true" defer></script>
 *   Put it BEFORE the scripts that issue requests (defer keeps document
 *   order: first script in <head> runs first, so the hooks are in place
 *   before any page script fires its first fetch).
 *
 * CONFIGURE (optional, without editing this file)
 *   <script src="~/js/shimmer.js"
 *           data-delay="120"            wait before showing (no flash on fast calls)
 *           data-min-duration="450"     keep it up at least this long
 *           data-selectors="table,.card"
 *           data-root=".content"
 *           data-block-pointer="true"></script>
 *   …or set window.shimmerConfig = { ... } before the script loads,
 *   …or call Shimmer.configure({ ... }) at any time.
 *
 * OPT OUT
 *   Per request : fetch(url, { shimmer: false })
 *                 Shimmer.track(promise)          // for manual control
 *   Per element : add class "no-shimmer" or attribute data-shimmer-off
 *   Per page    : Shimmer.configure({ enabled: false })
 *
 * Public API: Shimmer.show() / Shimmer.hide() / Shimmer.track(promise)
 *             Shimmer.configure(opts) / Shimmer.refresh() / Shimmer.config
 */
(function (window, document) {
    'use strict';

    var STYLE_ID = 'shimmer-loader-styles';

    /* ==================================================================
     * Defaults
     * ================================================================ */
    var DEFAULTS = {
        enabled: true,

        /* timing (ms) */
        delay: 120,          // wait before showing — avoids flashing on fast calls
        minDuration: 450,    // keep the shimmer up at least this long once shown
        settleDelay: 120,    // quiet period after the last request before hiding
        maxDuration: 20000,  // hard safety cap so a hung call cannot shimmer forever

        /* where to look */
        root: 'main, [role="main"], .content-wrapper, .content, #content, #main, .main-content, body',

        /* what to cover — first match wins, bigger blocks swallow nested ones */
        selectors: [
            '[data-shimmer]',
            'table',
            'ul.list-group', 'ul.divide-y', 'ol.list-group',
            'article', 'section', 'aside',
            '.card', '.kpi', '.stat', '.stat-card', '.tile', '.panel', '.widget', '.chart-box'
        ],

        /* never shimmer these (nor anything inside them) */
        exclude: [
            '[data-shimmer-off]', '[data-shimmer="off"]', '.no-shimmer',
            'nav', 'header', 'footer', '.sidebar', 'script', 'style'
        ],

        /* requests to ignore */
        ignore: [
            /\.(js|css|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|pdf)(\?|$)/i,
            /\/signalr/i, /\/_blazor/i, /\/hubs?\//i,
            /(^|\/)(ping|health|heartbeat|keepalive|track|telemetry)(\?|$)/i
        ],

        /* sizing */
        minWidth: 140,       // px — ignore narrow strips
        minHeight: 56,       // px — ignore thin bars / empty rows
        maxHeight: 1400,     // px — ignore page-sized wrappers
        maxTargets: 40,

        /* look */
        surface: null,       // overlay background, auto-detected from the page
        barBase: null,       // skeleton bar colour, auto from the surface
        barHighlight: null,
        blockPointer: false, // set true to swallow clicks while loading
        sweep: 1500,         // ms per shimmer sweep

        debug: false
    };

    var config = assign({}, DEFAULTS);

    /* ==================================================================
     * State
     * ================================================================ */
    var pending = 0;
    var active = false;
    var showTimer = null;
    var hideTimer = null;
    var capTimer = null;
    var shownAt = 0;
    var generation = 0;   // guards the hide() countdown against a new show()
    var overlays = [];

    /* ==================================================================
     * Small helpers
     * ================================================================ */
    function assign(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (!source) continue;
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
            }
        }
        return target;
    }

    function toArray(list) {
        return Array.prototype.slice.call(list || []);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function log() {
        if (config.debug && window.console) {
            window.console.debug.apply(window.console, ['[shimmer]'].concat(toArray(arguments)));
        }
    }

    function toRegex(rule) {
        if (rule instanceof RegExp) return rule;
        return new RegExp(String(rule).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    /* ---------- measurement ---------- */

    function isVisible(el) {
        if (!el || el.nodeType !== 1) return false;
        var style = window.getComputedStyle(el);
        if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
        if (parseFloat(style.opacity) === 0) return false;
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    }

    function boxOf(el) {
        if (!isVisible(el)) return null;
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return { width: rect.width, height: rect.height, left: rect.left, top: rect.top };
    }

    // absolute page coordinates for an element appended to <body>
    function pageOffset(box) {
        var originX = 0;
        var originY = 0;
        var host = document.body;
        if (host) {
            var style = window.getComputedStyle(host);
            if (style && style.position !== 'static') {
                var hostRect = host.getBoundingClientRect();
                originX = hostRect.left + window.pageXOffset;
                originY = hostRect.top + window.pageYOffset;
            }
        }
        return {
            x: box.left + window.pageXOffset - originX,
            y: box.top + window.pageYOffset - originY
        };
    }

    function parseColor(value) {
        var match = String(value || '').match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        var parts = match[1].split(',').map(function (n) { return parseFloat(n); });
        return {
            r: parts[0] || 0,
            g: parts[1] || 0,
            b: parts[2] || 0,
            a: parts.length > 3 ? parts[3] : 1
        };
    }

    function isDark(color) {
        // perceived brightness (ITU-R BT.601)
        return ((color.r * 299) + (color.g * 587) + (color.b * 114)) / 1000 < 128;
    }

    // walk up until an opaque background is found
    function effectiveBackground(el) {
        var node = el;
        var guard = 0;
        while (node && node.nodeType === 1 && guard++ < 12) {
            var color = parseColor(window.getComputedStyle(node).backgroundColor);
            if (color && color.a > 0.55) {
                return 'rgb(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ')';
            }
            node = node.parentElement;
        }
        return '#ffffff';
    }

    function radiusOf(el) {
        var style = window.getComputedStyle(el);
        var value = parseFloat(style.borderTopLeftRadius) || 0;
        return value > 0 ? value + 'px' : '4px';
    }

    function paddingOf(el) {
        var style = window.getComputedStyle(el);
        return {
            top: Math.max(parseFloat(style.paddingTop) || 0, 10),
            right: Math.max(parseFloat(style.paddingRight) || 0, 14),
            bottom: Math.max(parseFloat(style.paddingBottom) || 0, 10),
            left: Math.max(parseFloat(style.paddingLeft) || 0, 14)
        };
    }

    /* ==================================================================
     * Styles (injected once)
     * ================================================================ */
    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var css =
            '.shimmer-overlay{position:absolute;z-index:2147483000;overflow:hidden;' +
            'pointer-events:none;opacity:0;transition:opacity .18s ease;' +
            'box-sizing:border-box;contain:paint}' +
            '.shimmer-overlay.is-visible{opacity:1}' +
            '.shimmer-overlay[data-block="1"]{pointer-events:auto;cursor:progress}' +
            '.shimmer-stack{position:absolute;top:0;left:0;right:0;bottom:0;' +
            'display:flex;flex-direction:column;box-sizing:border-box}' +
            '.shimmer-row{display:flex;align-items:center;box-sizing:border-box}' +
            '.shimmer-bar{border-radius:6px;flex:0 0 auto;box-sizing:border-box;' +
            'background-image:linear-gradient(90deg,var(--sh-base) 25%,var(--sh-hi) 37%,var(--sh-base) 63%);' +
            'background-size:400% 100%;animation:shimmer-sweep ' + (config.sweep || 1500) + 'ms ease-in-out infinite}' +
            '.shimmer-bar.shimmer-grow{flex:1 1 auto}' +
            '.shimmer-bar.shimmer-round{border-radius:999px}' +
            '.shimmer-bar.shimmer-square{border-radius:8px}' +
            '@keyframes shimmer-sweep{0%{background-position:100% 0}100%{background-position:0 0}}' +
            '@media (prefers-reduced-motion:reduce){.shimmer-bar{animation:none;opacity:.9}}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        (document.head || document.documentElement).appendChild(style);
    }

    /* ==================================================================
     * Skeleton builders
     * ================================================================ */
    function makeEl(tag, className) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        return node;
    }

    function makeBar(width, height, options) {
        var bar = makeEl('div', 'shimmer-bar');
        bar.style.height = height + 'px';
        bar.style.width = typeof width === 'number' ? width + 'px' : width;
        if (options) {
            if (options.square) bar.className += ' shimmer-square';
            if (options.round) bar.className += ' shimmer-round';
            if (options.grow) bar.className += ' shimmer-grow';
            if (options.delay) bar.style.animationDelay = options.delay + 'ms';
        }
        return bar;
    }

    // stable pseudo-random width so the skeleton does not jitter between scans
    function widthJitter(row, col) {
        return 58 + ((row * 37 + col * 53) % 34);
    }

    function tableSkeleton(el, width, height, pad) {
        var stack = makeEl('div', 'shimmer-stack');
        stack.style.padding = pad.top + 'px ' + pad.right + 'px ' + pad.bottom + 'px ' + pad.left + 'px';

        var innerW = Math.max(width - pad.left - pad.right, 40);
        var innerH = Math.max(height - pad.top - pad.bottom, 40);

        // column widths come from the real table, so columns line up
        var cells = toArray(el.querySelectorAll('thead th'));
        if (!cells.length) {
            var firstRow = el.querySelector('tbody tr');
            if (firstRow) cells = toArray(firstRow.children);
        }
        var fractions = cells.map(function (cell) { return cell.getBoundingClientRect().width; });
        if (!fractions.length) fractions = [1, 1, 1, 1];

        var total = fractions.reduce(function (sum, n) { return sum + n; }, 0) || 1;
        var count = fractions.length;
        var gap = 14;
        var columns = fractions.map(function (w) {
            return Math.max((w / total) * (innerW - gap * (count - 1)), 24);
        });

        var bodyRows = toArray(el.querySelectorAll('tbody tr')).filter(isVisible);
        var rowHeight = bodyRows.length ? clamp(bodyRows[0].getBoundingClientRect().height, 12, 72) : 18;
        var rowGap = 12;

        var rows;
        if (bodyRows.length) {
            rows = Math.min(bodyRows.length, 25);
        } else {
            rows = clamp(Math.floor(innerH / (rowHeight + rowGap)), 3, 12);
        }

        var hasHeader = cells.length > 0 && el.querySelector('thead');
        if (hasHeader) {
            var headRow = makeEl('div', 'shimmer-row');
            headRow.style.gap = gap + 'px';
            headRow.style.marginBottom = (rowGap + 4) + 'px';
            columns.forEach(function (w, i) {
                headRow.appendChild(makeBar(Math.max(w * 0.55, 20), 10, { round: true, delay: 0 }));
            });
            stack.appendChild(headRow);
        }

        for (var r = 0; r < rows; r++) {
            var row = makeEl('div', 'shimmer-row');
            row.style.gap = gap + 'px';
            row.style.marginBottom = r === rows - 1 ? '0px' : rowGap + 'px';
            columns.forEach(function (w, c) {
                row.appendChild(makeBar(Math.max(w * widthJitter(r, c) / 100, 18), rowHeight, { delay: r * 60 }));
            });
            stack.appendChild(row);
        }

        return stack;
    }

    function listSkeleton(el, width, height, pad) {
        var stack = makeEl('div', 'shimmer-stack');
        stack.style.padding = pad.top + 'px ' + pad.right + 'px ' + pad.bottom + 'px ' + pad.left + 'px';

        var innerW = Math.max(width - pad.left - pad.right, 40);
        var innerH = Math.max(height - pad.top - pad.bottom, 40);

        var items = toArray(el.children).filter(isVisible);
        var itemHeight = items.length ? clamp(items[0].getBoundingClientRect().height, 24, 96) : 40;
        var count = items.length
            ? Math.min(items.length, 14)
            : clamp(Math.floor(innerH / (itemHeight + 12)), 3, 8);

        for (var i = 0; i < count; i++) {
            var row = makeEl('div', 'shimmer-row');
            row.style.gap = '12px';
            row.style.marginBottom = i === count - 1 ? '0px' : '12px';

            row.appendChild(makeBar(Math.min(itemHeight - 6, 34), Math.min(itemHeight - 6, 34), { square: true, delay: i * 60 }));

            var text = makeEl('div');
            text.style.flex = '1 1 auto';
            text.style.minWidth = '0';
            var line = makeBar('100%', Math.min(12, itemHeight / 3), { round: true, delay: i * 60 });
            line.style.width = widthJitter(i, 1) + '%';
            text.appendChild(line);
            row.appendChild(text);

            row.appendChild(makeBar(Math.max(innerW * 0.14, 40), Math.min(12, itemHeight / 3), { round: true, delay: i * 60 }));
            stack.appendChild(row);
        }

        return stack;
    }

    // a tall block reads as a chart: draw it as columns
    function chartRow(width, height, index) {
        var row = makeEl('div', 'shimmer-row');
        row.style.gap = '8px';
        row.style.alignItems = 'flex-end';
        row.style.height = height + 'px';

        var pattern = [0.55, 0.8, 0.42, 1, 0.68, 0.5, 0.86];
        for (var i = 0; i < pattern.length; i++) {
            var h = Math.max(height * pattern[(i + index) % pattern.length], 8);
            var col = makeBar('100%', h, { grow: true, delay: i * 70 });
            row.appendChild(col);
        }
        return row;
    }

    // generic block: mirror the height/width of the element's own children,
    // which makes a KPI card, a chart box or a paragraph all look right
    function blockSkeleton(el, width, height, pad) {
        var stack = makeEl('div', 'shimmer-stack');
        stack.style.padding = pad.top + 'px ' + pad.right + 'px ' + pad.bottom + 'px ' + pad.left + 'px';

        var innerW = Math.max(width - pad.left - pad.right, 40);
        var innerH = Math.max(height - pad.top - pad.bottom, 40);

        var rect = el.getBoundingClientRect();
        var children = toArray(el.children)
            .filter(isVisible)
            .slice(0, 6)
            .map(function (child) {
                var r = child.getBoundingClientRect();
                return {
                    h: clamp(r.height, 8, 160),
                    w: clamp(r.width / Math.max(rect.width, 1), 0.15, 1),
                    square: Math.abs(r.width - r.height) < 18 && r.width <= 72 && r.width > 0
                };
            });

        if (!children.length) {
            children = [
                { h: 12, w: 0.45, square: false },
                { h: 28, w: 0.6, square: false },
                { h: 12, w: 0.8, square: false }
            ];
        }

        var gap = 12;
        var wanted = children.reduce(function (sum, c) { return sum + c.h; }, 0) + gap * (children.length - 1);
        var scale = wanted > innerH ? innerH / wanted : 1;

        children.forEach(function (child, i) {
            var row = makeEl('div', 'shimmer-row');
            row.style.gap = '12px';
            row.style.marginBottom = i === children.length - 1 ? '0px' : gap * scale + 'px';

            var h = Math.max(child.h * scale, 8);

            if (!child.square && h >= 56) {
                stack.appendChild(chartRow(innerW, h, i));
                return;
            }

            if (child.square) {
                var size = clamp(child.w * rect.width * scale, 12, 64);
                row.appendChild(makeBar(size, size, { square: true, delay: i * 60 }));
                row.appendChild(makeBar('100%', h, { grow: true, round: true, delay: i * 60 }));
            } else {
                var w = clamp(child.w * 100, 18, 100);
                row.appendChild(makeBar(w + '%', h, { round: true, delay: i * 60 }));
            }

            stack.appendChild(row);
        });

        return stack;
    }

    /* ==================================================================
     * Overlays
     * ================================================================ */
    function buildSkeleton(el, box) {
        var pad = paddingOf(el);
        var tag = el.tagName.toLowerCase();

        if (tag === 'table') return tableSkeleton(el, box.width, box.height, pad);
        if (tag === 'ul' || tag === 'ol') return listSkeleton(el, box.width, box.height, pad);
        return blockSkeleton(el, box.width, box.height, pad);
    }

    function createOverlay(el, box) {
        var surface = config.surface || effectiveBackground(el);
        var dark = isDark(parseColor(surface) || { r: 255, g: 255, b: 255 });

        var overlay = makeEl('div', 'shimmer-overlay');
        overlay.setAttribute('aria-hidden', 'true');
        if (config.blockPointer) overlay.setAttribute('data-block', '1');

        var offset = pageOffset(box);
        overlay.style.left = offset.x + 'px';
        overlay.style.top = offset.y + 'px';
        overlay.style.width = box.width + 'px';
        overlay.style.height = box.height + 'px';
        overlay.style.background = surface;
        overlay.style.borderRadius = radiusOf(el);
        overlay.style.setProperty('--sh-base', config.barBase || (dark ? '#1e293b' : '#e2e8f0'));
        overlay.style.setProperty('--sh-hi', config.barHighlight || (dark ? '#334155' : '#f8fafc'));

        overlay.appendChild(buildSkeleton(el, box));

        document.body.appendChild(overlay);
        // next frame so the opacity transition actually runs
        window.requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
        return overlay;
    }

    function clearOverlays() {
        overlays.forEach(function (overlay) {
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        });
        overlays = [];
    }

    function isExcluded(el) {
        var exclude = config.exclude || [];
        for (var i = 0; i < exclude.length; i++) {
            try {
                if (el.matches(exclude[i])) return true;
                if (el.closest && el.closest(exclude[i])) return true;
            } catch (e) { /* invalid selector — skip */ }
        }
        return false;
    }

    // a card that simply wraps a table or a list should shimmer as that
    // table/list — the static heading above it can stay readable
    function isContentBlock(el) {
        var tag = el.tagName.toLowerCase();
        return tag === 'table' || tag === 'ul' || tag === 'ol' || el.hasAttribute('data-shimmer');
    }

    function refine(item) {
        if (isContentBlock(item.el)) return item;

        var best = null;
        var bestShare = 0;
        var area = item.box.width * item.box.height;

        toArray(item.el.querySelectorAll('table, ul, ol, [data-shimmer]')).forEach(function (child) {
            var box = boxOf(child);
            if (!box) return;
            var share = (box.width * box.height) / area;
            if (share > 0.3 && share > bestShare) {
                bestShare = share;
                best = { el: child, box: box };
            }
        });

        return best || item;
    }

    function findRoot() {
        var selectors = String(config.root || '').split(',');
        for (var i = 0; i < selectors.length; i++) {
            var selector = selectors[i].trim();
            if (!selector) continue;
            var node;
            try { node = document.querySelector(selector); } catch (e) { continue; }
            if (node && isVisible(node)) return node;
        }
        return document.body;
    }

    function scan() {
        clearOverlays();
        if (!document.body) return;

        var root = findRoot();
        if (!root) return;

        var candidates = [];
        (config.selectors || []).forEach(function (selector) {
            try {
                toArray(root.querySelectorAll(selector)).forEach(function (el) { candidates.push(el); });
            } catch (e) { /* invalid selector — skip */ }
        });

        var unique = candidates.filter(function (el, index) {
            return candidates.indexOf(el) === index;
        });

        var sized = unique
            .filter(function (el) { return !isExcluded(el); })
            .map(function (el) { return { el: el, box: boxOf(el) }; })
            .filter(function (item) {
                return item.box
                    && item.box.width >= config.minWidth
                    && item.box.height >= config.minHeight
                    && item.box.height <= config.maxHeight;
            })
            .map(refine)
            .sort(function (a, b) {
                return (b.box.width * b.box.height) - (a.box.width * a.box.height);
            })
            .slice(0, config.maxTargets);

        // biggest first, so a parent block wins over anything nested inside it
        var kept = [];
        sized.forEach(function (item) {
            for (var i = 0; i < kept.length; i++) {
                if (kept[i].el.contains(item.el)) return;
            }
            kept.push(item);
        });

        kept.forEach(function (item) {
            overlays.push(createOverlay(item.el, item.box));
        });

        log('covering ' + overlays.length + ' block(s)');
    }

    /* ==================================================================
     * Show / hide
     * ================================================================ */
    function show() {
        showTimer = null;
        if (!config.enabled || active) return;

        active = true;
        generation++;          // invalidate any hide() still counting down
        shownAt = Date.now();
        ensureStyles();
        scan();

        if (!capTimer) {
            capTimer = window.setTimeout(function () {
                log('safety cap reached — hiding');
                hide();
            }, config.maxDuration);
        }
    }

    function hide() {
        clearTimeout(showTimer); showTimer = null;
        clearTimeout(hideTimer); hideTimer = null;
        clearTimeout(capTimer); capTimer = null;

        if (!active) return;

        active = false;

        // a request may start again while this is counting down; if it does,
        // show() bumps the generation and this cleanup is abandoned
        var token = ++generation;
        var elapsed = Date.now() - shownAt;
        var wait = Math.max(0, config.minDuration - elapsed);

        window.setTimeout(function () {
            if (token !== generation || active) return;
            clearOverlays();
            log('hidden after ' + (Date.now() - shownAt) + 'ms');
        }, Math.min(wait, 260));
    }

    function begin(url) {
        if (!config.enabled) return;

        pending++;
        clearTimeout(hideTimer); hideTimer = null;

        if (!active && !showTimer) {
            showTimer = window.setTimeout(show, config.delay);
        }
        if (!capTimer) {
            capTimer = window.setTimeout(function () {
                log('safety cap reached — hiding');
                hide();
            }, config.maxDuration);
        }
        log('start', url, '(' + pending + ' in flight)');
    }

    function end(url) {
        pending = Math.max(0, pending - 1);
        log('end', url, '(' + pending + ' left)');

        if (pending > 0) return;

        clearTimeout(showTimer); showTimer = null;
        clearTimeout(capTimer); capTimer = null;

        if (active) {
            clearTimeout(hideTimer);
            hideTimer = window.setTimeout(hide, config.settleDelay);
        }
    }

    /* ==================================================================
     * Request hooks
     * ================================================================ */
    function urlOf(input) {
        if (typeof input === 'string') return input;
        if (input && input.url) return input.url;
        if (input instanceof window.Request) return input.url;
        return String(input);
    }

    function shouldTrack(url, options) {
        if (!config.enabled) return false;
        if (options && options.shimmer === false) return false;

        var text = String(url || '');
        if (!text) return false;

        var ignore = config.ignore || [];
        for (var i = 0; i < ignore.length; i++) {
            if (toRegex(ignore[i]).test(text)) return false;
        }

        if (typeof config.match === 'function') {
            try {
                if (!config.match(text, options)) return false;
            } catch (e) { /* noop */ }
        }
        return true;
    }

    function hookFetch() {
        if (typeof window.fetch !== 'function') return;

        var original = window.fetch;

        window.fetch = function (input, init) {
            var url = urlOf(input);
            if (!shouldTrack(url, init)) return original.apply(this, arguments);

            begin(url);

            var settle = function () { end(url); };
            try {
                var promise = original.apply(this, arguments);
                if (promise && typeof promise.then === 'function') {
                    promise.then(settle, settle);
                } else {
                    settle();
                }
                return promise;
            } catch (error) {
                settle();
                throw error;
            }
        };

        window.fetch.displayName = 'shimmerFetch';
    }

    function hookXhr() {
        if (!window.XMLHttpRequest) return;

        var Original = window.XMLHttpRequest;
        var open = Original.prototype.open;
        var send = Original.prototype.send;

        Original.prototype.open = function (method, url) {
            this.__shimmerUrl = url;
            this.__shimmerMethod = method;
            return open.apply(this, arguments);
        };

        Original.prototype.send = function () {
            if (shouldTrack(this.__shimmerUrl, { method: this.__shimmerMethod })) {
                begin(this.__shimmerUrl);
                var self = this;
                var settle = function () { end(self.__shimmerUrl); };
                this.addEventListener('loadend', settle);
                this.addEventListener('abort', settle);
                this.addEventListener('timeout', settle);
            }
            return send.apply(this, arguments);
        };
    }

    /* ==================================================================
     * Configuration from the script tag / global
     * ================================================================ */
    function readConfig() {
        var script = document.currentScript
            || document.querySelector('script[src*="shimmer.js"]');

        if (window.shimmerConfig) assign(config, window.shimmerConfig);

        if (script) {
            var json = script.getAttribute('data-config');
            if (json) {
                try { assign(config, JSON.parse(json)); } catch (e) { /* noop */ }
            }

            var numbers = ['delay', 'min-duration', 'settle-delay', 'max-duration', 'sweep', 'min-width', 'min-height', 'max-height', 'max-targets'];
            numbers.forEach(function (name) {
                var raw = script.getAttribute('data-' + name);
                if (raw === null) return;
                var value = parseFloat(raw);
                if (!isNaN(value)) {
                    config[name.replace(/-(\w)/g, function (m, c) { return c.toUpperCase(); })] = value;
                }
            });

            var lists = ['selectors', 'exclude', 'ignore'];
            lists.forEach(function (name) {
                var raw = script.getAttribute('data-' + name);
                if (raw === null) return;
                var items = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                if (items.length) config[name] = items;
            });

            var texts = ['root', 'surface', 'bar-base', 'bar-highlight'];
            texts.forEach(function (name) {
                var raw = script.getAttribute('data-' + name);
                if (raw !== null && raw !== '') {
                    config[name.replace(/-(\w)/g, function (m, c) { return c.toUpperCase(); })] = raw;
                }
            });

            var flag = script.getAttribute('data-block-pointer');
            if (flag !== null) config.blockPointer = (flag === 'true' || flag === '1' || flag === '');

            flag = script.getAttribute('data-debug');
            if (flag !== null) config.debug = (flag === 'true' || flag === '1' || flag === '');
        }
    }

    /* ==================================================================
     * Public API
     * ================================================================ */
    window.Shimmer = {
        config: config,

        configure: function (options) {
            assign(config, options || {});
            if (config.enabled === false) {
                clearTimeout(showTimer); showTimer = null;
                hide();
            }
            return this;
        },

        /** show the shimmer immediately (bypasses the delay) */
        show: function (options) {
            assign(config, options || {});
            if (!config.enabled) return this;
            clearTimeout(showTimer); showTimer = null;
            show();
            return this;
        },

        /** hide right away */
        hide: function () {
            pending = 0;
            hide();
            return this;
        },

        /** shimmer for as long as a promise is pending */
        track: function (promise, url) {
            if (!promise || typeof promise.then !== 'function') return promise;
            begin(url || 'manual');
            var settle = function () { end(url || 'manual'); };
            promise.then(settle, settle);
            return promise;
        },

        /** re-measure while visible (after the layout shifts) */
        refresh: function () {
            if (active) scan();
            return this;
        },

        pendingRequests: function () { return pending; },
        isActive: function () { return active; }
    };

    /* ==================================================================
     * Boot
     * ================================================================ */
    readConfig();
    hookFetch();
    hookXhr();

    // a hung overlay is worse than a hung request
    window.addEventListener('pagehide', clearOverlays);
})(window, document);

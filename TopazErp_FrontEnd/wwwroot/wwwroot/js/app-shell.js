/* ==========================================================================
   shell.js — enhancement layer for the server-rendered Topaz ERP shell.
   --------------------------------------------------------------------------
   It contains NO menu data. The menu is written in the Razor layout with tag helpers
   (<a asp-controller asp-action>), and this file only adds behaviour to it:

     · collapse / expand the sidebar (icon rail), persisted, drag-to-resize
     · expanded  → clicking a parent toggles its sub-menu (inline accordion, animated)
     · collapsed → hovering a parent moves its real <ul> into a floating flyout
                   (nested levels open flyouts too); hovering a leaf shows a tooltip;
                   clicking a parent pins the flyout
     · mobile    → off-canvas drawer + backdrop
     · header    → dropdowns, notifications, dark mode, "/" search over the rendered
                   menu (or over your API when data-search-url is set)
     · keyboard  → Ctrl+B / [ collapse, / or Ctrl+K search, Esc closes everything
     · active    → markActiveFromUrl() highlights the row whose href matches the
                   current URL and opens its parent — so it works with plain
                   asp-controller/asp-action links and still respects an
                   `active`/`open` class you wrote yourself in the .cshtml

   Markup contract (that's all the layout has to render):
     .nav-item                     row        .nav-item.has-sub   has a submenu
     .menu-title                   label      .menu-content       the submenu <ul>
     .nav-section                  group heading
     li.active / li.open           optional, if you want to set it server side
   ========================================================================== */
(function () {
    'use strict';

    var CFG = Object.assign({
        breakpoint: 1024,        // below this → drawer
        railWidth: 72,
        minWidth: 210,
        maxWidth: 420,
        openWidth: 272,
        demo: false,             // true → clicks only move the highlight (static preview)
        storagePrefix: 'shell'
    }, window.__SHELL__ || {});

    /* ---------------------------------------------------------------- helpers */
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var kidsOf = function (el, tag) {
        return Array.prototype.filter.call(el.children, function (c) { return c.tagName === tag; });
    };
    var directLink = function (li) { return kidsOf(li, 'A')[0] || null; };
    var directSub = function (li) { return kidsOf(li, 'UL')[0] || null; };
    var labelOf = function (li) {
        var a = directLink(li); if (!a) return '';
        var t = a.querySelector('.menu-title, .menu-text, .menu-link-text');
        return (t ? t.textContent : a.textContent).replace(/\s+/g, ' ').trim();
    };
    var debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };
    var store = {
        get: function (k, d) { try { var v = localStorage.getItem(CFG.storagePrefix + ':' + k); return v === null ? d : v; } catch (e) { return d; } },
        set: function (k, v) { try { localStorage.setItem(CFG.storagePrefix + ':' + k, v); } catch (e) {} }
    };

    /* Icon fonts are CDN assets; if they are blocked or the app runs offline the rail
       would be a column of empty slots. Flag the ones that failed on <html> so shell.css
       can paint a placeholder chip instead. Re-runs once the fonts settle. */
    var ICON_FONTS = [
        ['Line Awesome Free', '900', 'no-la-font'],
        ['bootstrap-icons', '400', 'no-bi-font']
    ];
    function iconFontLoaded(family, weight) {
        var fonts = document.fonts;
        if (fonts && typeof fonts.check === 'function') {
            try { return fonts.check(weight + ' 16px "' + family + '"'); } catch (e) { /* fall through */ }
        }
        /* no FontFaceSet (or it threw): compare the reported width against a font that cannot exist */
        if (!document.body) return true;
        var probe = document.createElement('i');                       // offline mode → flagged
        probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;font-size:24px;line-height:1';
        probe.textContent = '\uf2c2';
        document.body.appendChild(probe);
        probe.style.fontFamily = '"' + family + '", monospace';
        var withFont = probe.getBoundingClientRect().width;
        probe.style.fontFamily = '__shell_missing_font__, monospace';
        var withoutFont = probe.getBoundingClientRect().width;
        probe.parentNode.removeChild(probe);
        return Math.abs(withFont - withoutFont) > 1;
    }
    function flagIconFonts() {
        ICON_FONTS.forEach(function (font) {
            document.documentElement.classList.toggle(font[2], !iconFontLoaded(font[0], font[1]));
        });
    }

    var sidebar = $('#appSidebar');
    var topbar = $('#appTopbar');
    var nav = $('#appNav');
    if (!sidebar || !topbar || !nav) return;

    var state = {
        collapsed: store.get('collapsed', '0') === '1',
        openWidth: parseFloat(store.get('w', '')) || CFG.openWidth,
        isMobile: window.innerWidth < CFG.breakpoint,
        drawer: false,
        flyouts: [],          // [{ level, panel, host, rect }]
        moved: [],            // [{ node, parent, next }] — DOM nodes borrowed by a flyout
        pinned: null,         // nav id whose flyout was pinned by a click
        tooltip: null,
        searchIndex: [],
        closeTimer: null
    };

    /* =====================================================================
       1. FLOATING LAYER (flyouts + tooltip) — appended to <body> so the
          scrolling sidebar can never clip it
       ===================================================================== */
    var layer = document.createElement('div');
    layer.className = 'nav-flyout-layer';
    layer.id = 'navFlyoutLayer';
    document.body.appendChild(layer);

    var tooltipEl = document.createElement('div');
    tooltipEl.className = 'nav-tooltip';
    tooltipEl.id = 'navTooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.hidden = true;
    layer.appendChild(tooltipEl);

    function borrow(node, container) {                        // move a server-rendered node
        state.moved.push({ node: node, parent: node.parentNode, next: node.nextSibling });
        container.appendChild(node);
    }
    function restoreAll() {                                   // …and put it straight back
        while (state.moved.length) {
            var m = state.moved.pop();
            try { m.parent.insertBefore(m.node, m.next); } catch (e) {}
        }
    }

    /* The <ul> of a row can be borrowed by a flyout while it is open. Rows must keep
       behaving like parents in that state (click pins/keeps the flyout instead of
       navigating as if the row were a leaf), so look the borrowed node up too. */
    function submenuOf(li) {
        var own = directSub(li);
        if (own) return own;
        for (var i = state.moved.length - 1; i >= 0; i--) {
            if (state.moved[i].parent === li && state.moved[i].node.tagName === 'UL') return state.moved[i].node;
        }
        return null;
    }

    function closeFlyouts(fromLevel) {
        fromLevel = fromLevel || 0;
        state.flyouts.slice(fromLevel).forEach(function (f) { if (f.panel.parentNode) f.panel.parentNode.removeChild(f.panel); });
        state.flyouts = state.flyouts.slice(0, fromLevel);
        if (!state.flyouts.length) { state.pinned = null; restoreAll(); }
        hideTooltip();
    }
    function clearCloseTimer() { clearTimeout(state.closeTimer); }
    function scheduleClose(level) {
        if (state.pinned) return;                               // a pinned flyout stays until the user clicks away
        clearCloseTimer();
        state.closeTimer = setTimeout(function () { closeFlyouts(level); }, 200);
    }

    function panelRect(panel) { return panel.getBoundingClientRect(); }

    function openFlyout(li, level, anchorEl) {
        var sub = submenuOf(li);
        if (!sub) return;
        closeFlyouts(level);                                    // replace anything deeper

        var anchorRect = (anchorEl || directLink(li) || li).getBoundingClientRect();
        var panel = document.createElement('div');
        panel.className = 'nav-flyout';
        panel.setAttribute('data-flyout-level', String(level));
        panel.setAttribute('role', 'menu');
        panel.setAttribute('aria-label', labelOf(li));

        var title = document.createElement('p');
        title.className = 'nav-flyout-title';
        title.textContent = labelOf(li);
        panel.appendChild(title);

        var body = document.createElement('div');
        body.className = 'nav-flyout-body';
        panel.appendChild(body);
        borrow(sub, body);                                      // ← the real server-rendered <ul>

        layer.appendChild(panel);

        /* position: right of the icon (level 0) or right of the hovered row (deeper levels) */
        var top = Math.max(8, Math.min(anchorRect.top - 6, window.innerHeight - (panel.offsetHeight || 160) - 12));
        var left = level === 0 ? anchorRect.right + 12 : anchorRect.right - 6;
        if (left + (panel.offsetWidth || 240) > window.innerWidth - 8) {
            left = level === 0 ? anchorRect.left - (panel.offsetWidth || 240) - 12 : anchorRect.left - (panel.offsetWidth || 240) + 6;
        }
        panel.style.top = top + 'px';
        panel.style.left = Math.max(8, left) + 'px';

        state.flyouts[level] = { level: level, panel: panel, host: li };

        panel.addEventListener('mouseenter', clearCloseTimer);
        panel.addEventListener('mouseleave', function () { scheduleClose(level); });
        /* delegation — the rows are server-rendered nodes, so nothing is bound to them directly */
        panel.addEventListener('mouseover', function (e) {
            var hovered = e.target.closest ? e.target.closest('li') : null;
            if (!hovered) return;
            /* only rows of THIS panel (a nested panel is a sibling in the layer, never a descendant) */
            if (hovered.closest('.nav-flyout') !== panel) return;
            var nested = submenuOf(hovered);
            if (nested) { clearCloseTimer(); openFlyout(hovered, level + 1, hovered); }
            else { closeFlyouts(level + 1); }
        });
        panel.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a');
            if (!a) return;
            onNavActivate(a);                                     // demo mode / close flyouts
        });

        markRailSemantics();
        return panel;
    }

    function showTooltip(li, anchorEl) {
        var rect = (anchorEl || directLink(li) || li).getBoundingClientRect();
        var label = labelOf(li);
        var badge = li.querySelector('.badge, .menu-badge');
        var soon = li.classList.contains('is-disabled');
        tooltipEl.innerHTML = '';
        tooltipEl.appendChild(document.createTextNode(label));
        if (soon) { var s = document.createElement('span'); s.className = 'nav-tooltip-hint'; s.textContent = '· Coming soon'; tooltipEl.appendChild(s); }
        else if (badge) { var b = document.createElement('span'); b.className = 'nav-tooltip-hint'; b.textContent = '· ' + badge.textContent.trim(); tooltipEl.appendChild(b); }
        tooltipEl.style.top = Math.round(rect.top + rect.height / 2 - 14) + 'px';
        tooltipEl.style.left = Math.round(rect.right + 12) + 'px';
        tooltipEl.hidden = false;
        state.tooltip = li;
    }
    function hideTooltip() { tooltipEl.hidden = true; state.tooltip = null; }

    /* =====================================================================
       2. RAIL BEHAVIOUR — hover/click handling on the server menu
       ===================================================================== */
    function isRail() { return state.collapsed && !state.isMobile; }

    function markRailSemantics() {
        $$('.nav-item', nav).forEach(function (li) {
            var a = directLink(li); if (!a) return;
            var parent = !!submenuOf(li);
            if (parent) {
                a.setAttribute('aria-haspopup', 'true');
                if (!isRail()) a.setAttribute('aria-expanded', li.classList.contains('open') ? 'true' : 'false');
                else a.removeAttribute('aria-expanded');
            }
            if (li.classList.contains('active') || (a.classList.contains('active'))) a.setAttribute('aria-current', 'page');
        });
    }

    nav.addEventListener('mouseover', function (e) {
        if (!isRail()) return;
        var li = e.target.closest ? e.target.closest('.nav-item') : null;
        if (!li) return;
        var a = directLink(li) || li;
        if (e.relatedTarget && li.contains(e.relatedTarget)) return;   // still inside the same row
        clearCloseTimer();
        if (state.pinned && state.pinned !== li) { state.pinned = null; closeFlyouts(); }
        if (submenuOf(li)) { hideTooltip(); openFlyout(li, 0, a); }
        else { closeFlyouts(); showTooltip(li, a); }
    });
    nav.addEventListener('mouseleave', function (e) {
        if (!isRail()) return;
        if (e.relatedTarget && (layer.contains(e.relatedTarget) || sidebar.contains(e.relatedTarget))) return;
        scheduleClose(0);
    });
    nav.addEventListener('focusin', function (e) {              // keyboard users get the same popovers
        if (!isRail()) return;
        var li = e.target.closest ? e.target.closest('.nav-item') : null;
        if (!li) return;
        if (submenuOf(li)) openFlyout(li, 0, directLink(li) || li); else showTooltip(li, directLink(li) || li);
    });
    nav.addEventListener('scroll', function () { closeFlyouts(); }, { passive: true });

    /* =====================================================================
       3. CLICK BEHAVIOUR — accordion (expanded) / flyout pinning (rail)
       ===================================================================== */
    function toggleAccordion(li) {
        var sub = directSub(li);
        var open = li.classList.toggle('open');
        var a = directLink(li);
        if (a) a.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (sub) li.style.setProperty('--sub-h', sub.scrollHeight + 'px');
        if (open) {                                               // close siblings at the same level
            Array.prototype.forEach.call(li.parentNode.children, function (sib) {
                if (sib !== li && sib.classList.contains('nav-item') && sib.classList.contains('open')) {
                    sib.classList.remove('open');
                    var sa = directLink(sib); if (sa) sa.setAttribute('aria-expanded', 'false');
                }
            });
        }
        refreshHeights();
    }

    /* measured sub-menu heights keep the CSS accordion animation snappy and exact */
    function measure(li) {
        var sub = directSub(li);
        if (sub) li.style.setProperty('--sub-h', sub.scrollHeight + 'px');
        $$('.nav-item.has-sub', li).forEach(measure);
    }
    function refreshHeights() { $$('#appNav > .nav-menu > .nav-item', sidebar).forEach(measure); }
    var refreshHeightsSoon = debounce(refreshHeights, 150);

    function onNavActivate(a) {
        var li = a.closest && a.closest('.nav-item');
        if (!li) return false;
        if (li.classList.contains('is-disabled')) { return false; }

        if (submenuOf(li)) {                                      // parent row
            if (isRail()) {                                         // rail → pin the flyout
                var alreadyOpen = state.flyouts.length && state.flyouts[0].host === li;
                if (alreadyOpen && state.pinned === li) { closeFlyouts(); return false; }
                closeFlyouts();
                openFlyout(li, 0, directLink(li) || li);
                state.pinned = li;
            } else {
                toggleAccordion(li);
            }
            return false;                                           // parent rows never navigate
        }

        closeFlyouts();
        if (state.isMobile) closeDrawer();

        if (CFG.demo) {                                           // static preview: just move the highlight
            $$('.nav-item.active', nav).forEach(function (n) { n.classList.remove('active'); });
            li.classList.add('active');
            $$('.nav-menu > .nav-item.open', nav).forEach(function (n) { if (!n.contains(li)) n.classList.remove('open'); });
            var ancestors = [];
            var p = li.parentNode;
            while (p && p !== nav) {
                if (p.classList && p.classList.contains('nav-item')) { ancestors.push(p); p.classList.add('open'); }
                p = p.parentNode;
            }
            var header = $('.topbar-title h1', topbar);
            if (header) header.textContent = labelOf(li);
            markRailSemantics();
            return false;
        }
        return true;                                              // real navigation proceeds
    }

    nav.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a');
        if (!a || !nav.contains(a)) return;
        var proceed = onNavActivate(a);
        if (proceed === false || (a.getAttribute('href') || '#') === '#') e.preventDefault();
    });

    /* clicking anywhere else closes flyouts / tooltips */
    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('#navFlyoutLayer')) return;
        if (e.target.closest && e.target.closest('#appSidebar')) return;
        if (state.flyouts.length || state.tooltip) closeFlyouts();
    });

    /* =====================================================================
       4. SIDEBAR CHROME — collapse, resize, drawer
       ===================================================================== */
    function applySidebar() {
        document.documentElement.style.setProperty('--sidebar-w', (state.isMobile ? 0 : (state.collapsed ? CFG.railWidth : state.openWidth)) + 'px');
        document.documentElement.style.setProperty('--sidebar-w-open', state.openWidth + 'px');
        document.body.classList.toggle('shell-collapsed', state.collapsed && !state.isMobile);
        document.body.classList.toggle('shell-mobile', state.isMobile);
        sidebar.classList.toggle('is-rail', isRail());
        sidebar.classList.toggle('is-drawer', state.isMobile);
        document.body.classList.toggle('shell-drawer-open', state.drawer && state.isMobile);
        var backdrop = $('.sidebar-backdrop');
        if (backdrop) backdrop.hidden = !(state.drawer && state.isMobile);
        var collapseBtn = $('[data-action="collapse"]', sidebar);
        if (collapseBtn) collapseBtn.setAttribute('title', 'Collapse sidebar (Ctrl+B)');
        var toggle = $('[data-action="toggle-sidebar"]', topbar);
        if (toggle) {
            var icon = toggle.querySelector('i');
            if (icon) icon.className = 'bi ' + (state.isMobile ? 'bi-list' : (state.collapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar-inset-reverse'));
            toggle.setAttribute('aria-label', state.isMobile ? 'Open navigation' : (state.collapsed ? 'Expand sidebar' : 'Collapse sidebar'));
        }
        markRailSemantics();
        refreshHeightsSoon();
    }
    function toggleCollapse() {
        if (state.isMobile) { toggleDrawer(); return; }
        closeFlyouts(); hideTooltip();
        state.collapsed = !state.collapsed;
        store.set('collapsed', state.collapsed ? '1' : '0');
        applySidebar();
    }
    function toggleDrawer() {
        state.drawer = !state.drawer;
        document.body.classList.toggle('shell-scroll-lock', state.drawer && state.isMobile);
        applySidebar();
        if (state.drawer) { var first = $('.nav-item a', sidebar); if (first) first.focus({ preventScroll: true }); }
    }
    function closeDrawer() {
        state.drawer = false;
        document.body.classList.remove('shell-scroll-lock');
        applySidebar();
    }
    function resetWidth() { state.openWidth = CFG.openWidth; store.set('w', String(state.openWidth)); applySidebar(); }
    function clampWidth(px) { return Math.max(CFG.minWidth, Math.min(CFG.maxWidth, Math.round(px))); }

    (function bindResize() {
        var handle = $('[data-action="resize"]', sidebar);
        if (handle) {
            handle.addEventListener('mousedown', function (e) {
                if (state.collapsed || state.isMobile) return;
                e.preventDefault();
                var startX = e.clientX, startW = state.openWidth;
                document.body.classList.add('shell-resizing');
                var move = function (ev) {
                    state.openWidth = clampWidth(startW + ev.clientX - startX);
                    document.documentElement.style.setProperty('--sidebar-w', state.openWidth + 'px');
                    document.documentElement.style.setProperty('--sidebar-w-open', state.openWidth + 'px');
                };
                var up = function () {
                    document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                    document.body.classList.remove('shell-resizing');
                    store.set('w', String(state.openWidth));
                    applySidebar();
                };
                document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
            });
            handle.addEventListener('dblclick', resetWidth);
        }
    })();

    /* =====================================================================
       5. HEADER — dropdowns, notifications, theme, mobile search
       ===================================================================== */
    $$('.dropdown', topbar).forEach(function (dd) {
        var toggle = $('[data-toggle]', dd);
        if (!toggle) return;
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = dd.classList.contains('open');
            closeDropdowns();
            if (!open) { dd.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
        });
    });
    function closeDropdowns() {
        $$('.dropdown.open', topbar).forEach(function (dd) {
            dd.classList.remove('open');
            var t = $('[data-toggle]', dd); if (t) t.setAttribute('aria-expanded', 'false');
        });
    }
    document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('.dropdown')) closeDropdowns();
    });

    var unread = $('[data-unread-count]');
    var markRead = $('[data-action="mark-read"]');
    if (markRead) markRead.addEventListener('click', function () {
        $$('.notif-list li').forEach(function (li) { li.classList.remove('is-unread'); });
        if (unread) unread.remove();
    });

    (function bindTheme() {
        var btn = $('[data-action="theme"]', topbar);
        if (!btn) return;
        var icon = $('[data-theme-icon]', btn);
        var stored = store.get('theme', '');
        if (stored === 'dark') document.documentElement.classList.add('dark');
        var sync = function () {
            var dark = document.documentElement.classList.contains('dark');
            if (icon) icon.className = 'bi ' + (dark ? 'bi-sun' : 'bi-moon-stars');
            btn.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
        };
        sync();
        btn.addEventListener('click', function () {
            var dark = document.documentElement.classList.toggle('dark');
            store.set('theme', dark ? 'dark' : 'light');
            sync();
        });
    })();

    /* =====================================================================
       6b. ACTIVE ROW — from the URL, not from a menu config
       =====================================================================
       Compares the href the tag helper rendered with location.pathname, so
       /Sales/Orders is highlighted on reload and its parent opens. Anything
       you mark up yourself (class="nav-item active" / "open") is left alone
       when no link matches. */
    function pathOf(a) {
        var href = a.getAttribute('href');
        if (!href || href === '#' || /^(#|mailto:|tel:|javascript:)/i.test(href)) return '';
        var p = a.pathname || href.split('#')[0].split('?')[0];
        if (!p) return '';
        return p.replace(/\/+$/, '').toLowerCase() || '/';
    }

    function markActiveFromUrl() {
        var here = (location.pathname || '/').replace(/\/+$/, '').toLowerCase() || '/';
        var matched = [];
        $$('.nav-item', nav).forEach(function (li) {
            var a = directLink(li);
            if (a && pathOf(a) === here) matched.push(li);
        });
        if (!matched.length) return false;                 // no match → keep the server-rendered state

        $$('.nav-item.active', nav).forEach(function (li) { li.classList.remove('active'); });
        matched.forEach(function (li) {
            li.classList.add('active');
            $$('a', li).forEach(function (a) { if (a === directLink(li)) a.setAttribute('aria-current', 'page'); });
            for (var p = li.parentNode; p && p !== nav; p = p.parentNode) {
                if (p.classList && p.classList.contains('nav-item') && p.classList.contains('has-sub')) p.classList.add('open');
            }
        });
        return true;
    }

    /* collapsed rail: build the search index + tooltips from the rendered menu */
    function buildSearchIndex() {
        var out = [];
        $$('.nav-item', nav).forEach(function (li) {
            var a = directLink(li);
            if (!a) return;
            var href = a.getAttribute('href') || '';
            if (!href || href === '#') return;
            var trail = [];
            var p = li.parentNode;
            while (p && p !== nav) {
                if (p.classList && p.classList.contains('nav-item')) trail.unshift(labelOf(p));
                p = p.parentNode;
            }
            var icon = a.querySelector('i');
            out.push({ label: labelOf(li), href: href, trail: trail.join(' › '), icon: icon ? icon.className : 'bi bi-link-45deg', el: li });
        });
        state.searchIndex = out;
    }

    function renderResults(input, container, query) {
        var q = (query || '').trim().toLowerCase();
        if (!q) { container.hidden = true; container.innerHTML = ''; return; }
        var hits = state.searchIndex.filter(function (i) {
            return (i.label + ' ' + i.trail).toLowerCase().indexOf(q) !== -1;
        }).slice(0, 8);
        if (!hits.length) { container.hidden = true; container.innerHTML = ''; return; }
        container.innerHTML = '<p class="search-head">' + hits.length + ' result(s)</p>' +
            hits.map(function (h, i) {
                return '<a href="' + h.href + '" class="search-result' + (i === 0 ? ' is-active' : '') + '" data-search-result>' +
                    '<i class="' + h.icon + '" aria-hidden="true"></i>' +
                    '<span class="search-result-text"><span class="label">' + escapeHtml(h.label) + '</span>' +
                    '<span class="path">' + escapeHtml(h.trail) + '</span></span>' +
                    '<i class="bi bi-arrow-return-left" aria-hidden="true"></i></a>';
            }).join('');
        container.hidden = false;
    }
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); }

    function bindSearch(inputId, containerId) {
        var input = document.getElementById(inputId), box = document.getElementById(containerId);
        if (!input || !box) return;
        var url = input.getAttribute('data-search-url');
        var run = debounce(function () {
            var q = input.value.trim();
            if (!url) { renderResults(input, box, q); return; }        // local index built from the menu
            if (!q) { box.hidden = true; return; }
            fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 'q=' + encodeURIComponent(q))
                .then(function (r) { return r.ok ? r.json() : []; })
                .then(function (rows) {
                    box.innerHTML = rows.map(function (r, i) {
                        return '<a href="' + r.url + '" class="search-result' + (i === 0 ? ' is-active' : '') + '" data-search-result>' +
                            '<i class="' + (r.icon || 'bi bi-link-45deg') + '" aria-hidden="true"></i>' +
                            '<span class="search-result-text"><span class="label">' + escapeHtml(r.label) + '</span>' +
                            '<span class="path">' + escapeHtml(r.subtitle || '') + '</span></span></a>';
                    }).join('');
                    box.hidden = !rows.length;
                })
                .catch(function () { box.hidden = true; });
        }, 180);
        input.addEventListener('input', run);
        input.addEventListener('focus', function () { if (input.value.trim()) run(); });
        input.addEventListener('keydown', function (e) {
            var items = $$('[data-search-result]', box);
            var idx = items.findIndex(function (el) { return el.classList.contains('is-active'); });
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!items.length) return;
                idx = e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
                items.forEach(function (el) { el.classList.remove('is-active'); });
                items[idx].classList.add('is-active');
            } else if (e.key === 'Enter') {
                if (!items.length) return;
                e.preventDefault();
                var target = items[Math.max(0, idx)];
                if (CFG.demo) { moveHighlightTo(target.getAttribute('href')); input.value = ''; box.hidden = true; }
                else window.location.href = target.getAttribute('href');
            } else if (e.key === 'Escape') {
                input.value = ''; box.hidden = true; input.blur();
            }
        });
        box.addEventListener('click', function (e) {
            if (CFG.demo) {
                var a = e.target.closest('[data-search-result]');
                if (a) { e.preventDefault(); moveHighlightTo(a.getAttribute('href')); input.value = ''; box.hidden = true; }
            }
            closeMobileSearch();
        });
        input.addEventListener('blur', function () { setTimeout(function () { box.hidden = true; }, 150); });
    }
    function moveHighlightTo(href) {
        var found = state.searchIndex.filter(function (i) { return i.href === href; })[0];
        if (!found) return;
        $$('.nav-item.active', nav).forEach(function (n) { n.classList.remove('active'); });
        found.el.classList.add('active');
        var p = found.el.parentNode;
        while (p && p !== nav) { if (p.classList && p.classList.contains('nav-item')) p.classList.add('open'); p = p.parentNode; }
        var header = $('.topbar-title h1', topbar);
        if (header) header.textContent = found.label;
        markRailSemantics();
        refreshHeights();
    }
    bindSearch('topbarSearch', 'searchResults');
    bindSearch('topbarSearchMobile', 'searchResultsMobile');

    function closeMobileSearch() {
        var row = $('#topbarMobileSearch');
        if (row) row.hidden = true;
    }
    function openMobileSearch() {
        var row = $('#topbarMobileSearch');
        if (!row) return;
        row.hidden = false;
        var input = $('#topbarSearchMobile');
        if (input) input.focus();
    }

    /* =====================================================================
       6. ACTIONS + KEYBOARD
       ===================================================================== */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('[data-action]');
        if (!btn) return;
        switch (btn.getAttribute('data-action')) {
            case 'toggle-sidebar': toggleCollapse(); break;
            case 'collapse': toggleCollapse(); break;
            case 'expand': toggleCollapse(); break;
            case 'close-drawer': closeDrawer(); break;
            case 'backdrop': closeDrawer(); break;
            case 'mobile-search': openMobileSearch(); break;
            case 'resize': break;
        }
    });

    document.addEventListener('keydown', function (e) {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        var typing = /input|textarea|select/i.test(tag);
        if (e.key === 'Escape') {
            if (state.flyouts.length || state.tooltip) { closeFlyouts(); return; }
            if ($('.dropdown.open', topbar)) { closeDropdowns(); return; }
            if (state.drawer) { closeDrawer(); return; }
            if (!$('#topbarMobileSearch').hidden) { closeMobileSearch(); return; }
        }
        if ((e.key === 'b' || e.key === 'B') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggleCollapse(); return; }
        if (e.key === '[' && !typing) { e.preventDefault(); toggleCollapse(); return; }
        if ((e.key === '/' && !typing) || ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            if (state.isMobile) openMobileSearch();
            else { var input = $('#topbarSearch'); if (input) { input.focus(); input.select(); } }
        }
    });

    window.addEventListener('resize', debounce(function () {
        var mobile = window.innerWidth < CFG.breakpoint;
        if (mobile !== state.isMobile) {
            state.isMobile = mobile;
            if (mobile) { state.drawer = false; closeFlyouts(); hideTooltip(); }
            else { document.body.classList.remove('shell-scroll-lock'); }
        }
        applySidebar();
    }, 120));

    /* =====================================================================
       7. INIT
       ===================================================================== */
    document.documentElement.classList.add('shell-js');
    flagIconFonts();
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(flagIconFonts);          // CDN fonts may arrive after init
    }
    window.addEventListener('load', flagIconFonts);
    markActiveFromUrl();                                    // highlight the menu row for this URL
    buildSearchIndex();
    applySidebar();
    refreshHeights();
    markRailSemantics();

    window.Shell = {                                        // small API for your views
        refresh: function () { markActiveFromUrl(); buildSearchIndex(); refreshHeights(); markRailSemantics(); applySidebar(); },
        collapse: function () { if (!state.collapsed) toggleCollapse(); },
        expand: function () { if (state.collapsed) toggleCollapse(); },
        closeFlyouts: closeFlyouts,
        state: state
    };
})();

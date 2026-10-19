/* ==========================================================================
   card.js — the card component for Topaz ERP.  No dependencies.
   --------------------------------------------------------------------------
   Drop the markup anywhere and the script finishes the job:

       <div class="card" data-card-title="Recent orders" style="width: 420px">
           ...the content...
       </div>

   It builds the header (title left, the three icons in a flex on the right),
   wraps the content, and wires:

     refresh  → spins the icon, fires `card:refresh`, and either fetches
                data-card-refresh-url or lets your own listener do the work
     resize   → toggle resize mode, then drag the edge/corner grips (your own
                width/height are the starting point; double-click to reset)
     hide     → collapses the content and reduces the card to its header

   No width/height is ever set by this file unless you drag a grip, so inline
   styles, Tailwind classes or your own CSS decide the size.

   API (window.Card)
     Card.init(elOrSelector)   → instance      Card.mount(root)   → instance[]
     Card.refresh(el) → Promise                Card.get(el) → instance
     Card.hide(el) / Card.show(el) / Card.toggle(el)
     Card.resize(el, true|false)               Card.reset(el) → authored size
     Card.measure(el)                          Card.destroy(el)
     Card.defaults  (icons, labels, min sizes, duration)

   Events (all bubble, so you can listen on document):
     card:init      card:refresh (cancelable)   card:refreshed   card:error
     card:hide      card:show                   card:resize      card:resized
     card:reset     card:destroy
   ========================================================================== */
(function (global) {
    'use strict';

    var DEFAULTS = {
        /* what to auto-mount — add data-card-ignore to opt a node out */
        selector: '.card:not([data-card-ignore]), [data-card]:not([data-card-ignore])',
        autoMount: true,

        /* markup the script creates */
        icons: {
            refresh: 'bi bi-arrow-clockwise',
            resize: 'bi bi-aspect-ratio',
            hide: 'bi bi-dash-lg',
            show: 'bi bi-plus-lg'
        },
        labels: {
            refresh: 'Refresh',
            resize: 'Resize (double-click to reset)',
            hide: 'Hide content',
            show: 'Show content',
            grip: 'Drag to resize · double-click to reset'
        },

        /* limits for the drag-resize (per card: data-card-min-width, …-max-width, …) */
        minWidth: 240,
        minHeight: 140,
        maxWidth: 0,          // 0 → as wide as the window allows
        maxHeight: 0,         // 0 → as tall as the window allows

        duration: 300,        // keep in sync with .card-content transition in card.css
        minSpin: 300,         // the refresh icon spins at least this long (feedback is visible)
        refreshFallback: 500  // spin time when neither a url nor a listener provides data
    };

    /* ------------------------------------------------------------- helpers */
    var assign = function (target) {
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i] || {};
            for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) {
                var v = src[k];
                if (v && typeof v === 'object' && !Array.isArray(v) && typeof target[k] === 'object' && target[k] !== null) {
                    assign(target[k], v);
                } else { target[k] = v; }
            }
        }
        return target;
    };
    var clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
    var num = function (v, fallback) { var n = parseFloat(v); return isFinite(n) ? n : fallback; };
    var emit = function (el, type, detail, cancelable) {
        return el.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: !!cancelable, detail: detail || {} }));
    };
    var delay = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var debounce = function (fn, ms) {
        var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); };
    };

    function resolve(target) {
        if (!target) return null;
        if (typeof target === 'string') return document.querySelector(target);
        if (target.jquery && target[0]) return target[0];
        return target.nodeType === 1 ? target : null;
    }

    /* =========================================================================
       Card
       ========================================================================= */
    function CardInstance(el, options) {
        if (el.__cardInstance) return el.__cardInstance;
        el.__cardInstance = this;
        this.el = el;
        this.opts = assign({}, DEFAULTS, options || {});
        this.collapsed = false;
        this.loading = false;
        this.savedHeight = null;
        /* the inline size the author wrote — reset() must give exactly this back */
        this.authored = { width: el.style.width || '', height: el.style.height || '' };

        this.buildHeader();
        this.buildContent();
        this.buildGrips();
        this.bind();

        if (this.attr('data-card-resize') === 'on') this.setResize(true);
        this.restore();
        this.measure();
        this.syncSized();

        el.classList.add('is-ready');
        emit(el, 'card:init', { instance: this });
        return this;
    }

    /* ---------------------------------------------------------------- markup */
    CardInstance.prototype.attr = function (name, fallback) {
        var v = this.el.getAttribute(name);
        return v === null || v === '' ? fallback : v;
    };

    CardInstance.prototype.buildHeader = function () {
        var el = this.el;
        var header = el.querySelector(':scope > .card-header');
        var title = this.attr('data-card-title');
        var subtitle = this.attr('data-card-subtitle');

        if (!header) {
            header = document.createElement('div');
            header.className = 'card-header';
            el.insertBefore(header, el.firstChild);
        }

        /* a title from data-card-title, unless the header already has one */
        if (title && !header.querySelector('.card-title')) {
            var heading = document.createElement('div');
            heading.className = 'card-heading';
            var t = document.createElement('p');
            t.className = 'card-title';
            t.textContent = title;
            heading.appendChild(t);
            if (subtitle) {
                var s = document.createElement('p');
                s.className = 'card-subtitle';
                s.textContent = subtitle;
                heading.appendChild(s);
            }
            header.insertBefore(heading, header.firstChild);
        }

        /* the action cluster */
        var actions = header.querySelector('.card-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'card-actions';
            header.appendChild(actions);
        }
        this.actions = actions;

        if (this.attr('data-card-actions') !== 'none') {
            this.ensureAction('refresh');
            if (this.attr('data-card-resize') !== 'off') this.ensureAction('resize');
            this.ensureAction('hide');
        }
        this.syncButtons();
    };

    /* create a default button only when the author did not write one */
    CardInstance.prototype.ensureAction = function (action) {
        var el = this.el;
        var existing = el.querySelector('[data-card-action="' + action + '"]') ||
            (action === 'hide' ? el.querySelector('[data-card-action="collapse"]') : null);
        if (existing) return existing;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'card-action';
        btn.setAttribute('data-card-action', action);
        btn.setAttribute('data-card-icon', this.opts.icons[action === 'hide' ? 'hide' : action]);
        if (action === 'hide') btn.setAttribute('data-card-icon-alt', this.opts.icons.show);
        btn.setAttribute('aria-label', this.opts.labels[action]);
        btn.title = this.opts.labels[action];
        var i = document.createElement('i');
        i.className = this.opts.icons[action === 'hide' ? 'hide' : action];
        i.setAttribute('aria-hidden', 'true');
        btn.appendChild(i);
        this.actions.appendChild(btn);
        return btn;
    };

    CardInstance.prototype.buildContent = function () {
        var el = this.el;
        var content = el.querySelector(':scope > .card-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'card-content';
            Array.prototype.slice.call(el.childNodes).forEach(function (node) {
                if (node === el.querySelector(':scope > .card-header')) return;
                if (node.nodeType === 1 && node.classList.contains('card-grips')) return;
                content.appendChild(node);
            });
            el.appendChild(content);
        }
        this.contentEl = content;
    };

    CardInstance.prototype.buildGrips = function () {
        if (this.attr('data-card-resize') === 'off') return;
        var grips = document.createElement('div');
        grips.className = 'card-grips';
        grips.setAttribute('aria-hidden', 'true');
        var self = this;
        ['e', 's', 'se'].forEach(function (dir) {
            var grip = document.createElement('span');
            grip.className = 'card-grip';
            grip.setAttribute('data-grip', dir);
            grip.setAttribute('title', self.opts.labels.grip);
            grips.appendChild(grip);
        });
        this.el.appendChild(grips);
        this.grips = grips;
    };

    /* ---------------------------------------------------------------- events */
    /* the content can change on its own (images, ajax, a details element) — re-measure */
    CardInstance.prototype.observe = function () {
        if (typeof global.ResizeObserver !== 'function' || !this.contentEl) return;
        var self = this;
        this.measureSoon = debounce(function () { if (!self.collapsed && !self.drag) self.measure(); }, 120);
        this._ro = new global.ResizeObserver(function () { if (self.measureSoon) self.measureSoon(); });
        this._ro.observe(this.contentEl);
    };

    CardInstance.prototype.unobserve = function () {
        if (this._ro) { this._ro.disconnect(); this._ro = null; }
    };

    CardInstance.prototype.bind = function () {
        var self = this;

        this._onClick = function (e) {
            var btn = e.target.closest && e.target.closest('[data-card-action]');
            if (!btn || !self.el.contains(btn)) return;
            e.preventDefault();
            var action = btn.getAttribute('data-card-action');
            if (action === 'refresh') self.refresh();
            else if (action === 'resize') self.toggleResize();
            else if (action === 'hide') self.toggle();          // the icon button hides and shows
            else if (action === 'collapse') self.hide();        // explicit one-way actions
            else if (action === 'expand') self.show();
        };

        this._onDblClick = function (e) {
            var t = e.target.closest && e.target.closest('[data-card-action="resize"], .card-grip');
            if (!t) return;
            e.preventDefault();
            self.reset();
        };

        this._onPointerDown = function (e) { self.startDrag(e); };

        this._onPointerMove = function (e) { self.moveDrag(e); };
        this._onPointerUp = function (e) { self.endDrag(e); };

        this._onWinResize = debounce(function () { self.measure(); self.syncSized(); }, 150);

        this.observe();
        this.el.addEventListener('click', this._onClick);
        this.el.addEventListener('dblclick', this._onDblClick);
        this.el.addEventListener('pointerdown', this._onPointerDown);
        global.addEventListener('resize', this._onWinResize);
    };

    CardInstance.prototype.unbind = function () {
        this.el.removeEventListener('click', this._onClick);
        this.el.removeEventListener('dblclick', this._onDblClick);
        this.el.removeEventListener('pointerdown', this._onPointerDown);
        global.removeEventListener('resize', this._onWinResize);
        global.removeEventListener('pointermove', this._onPointerMove);
        global.removeEventListener('pointerup', this._onPointerUp);
        global.removeEventListener('pointercancel', this._onPointerUp);
        this.unobserve();
    };

    /* --------------------------------------------------------- sizes / state */
    /* measure the content and publish it as --card-h, the value the collapse
       animation needs. Never smaller than the space the card already gives the
       body, so a card with a height of its own does not leave a gap. */
    CardInstance.prototype.measure = function () {
        if (this.collapsed) return 0;
        var el = this.el, content = this.contentEl;
        var wasAnimating = el.classList.contains('card-no-anim');
        if (this._measuring) return 0;
        this._measuring = true;
        var restoreMeasuring = this._measuring;
        el.classList.add('card-no-anim');
        var had = el.style.getPropertyValue('--card-h') !== '';
        el.style.removeProperty('--card-h');
        var natural = content.scrollHeight || 0;
        var box = content.clientHeight || 0;                 // the space the card actually gives the body
        var h = box > 0 ? box : natural;                     // taller content scrolls, it never spills

        if (h > 0) {
            el.style.setProperty('--card-h', h + 'px');
            el.classList.add('is-measured');
        } else if (had) {
            el.style.setProperty('--card-h', '0px');
        }
        if (!wasAnimating) el.classList.remove('card-no-anim');
        this._measuring = false;
        return h;
    };

    /* forget the measured height again — lets a flexible card fill its box */
    CardInstance.prototype.releaseHeight = function () {
        if (this.collapsed) return;
        this.el.style.removeProperty('--card-h');
    };

    /* is the content taller than the box the card was given? → let it scroll */
    CardInstance.prototype.syncSized = function () {
        if (this.collapsed) return;
        var el = this.el;
        el.classList.toggle('is-sized', el.scrollHeight > el.clientHeight + 1);
    };

    /* ------------------------------------------------------------ hide/show */
    CardInstance.prototype.hide = function () {
        if (this.collapsed) return this;
        var el = this.el, content = this.contentEl;

        this.measure();
        var h = num(el.style.getPropertyValue('--card-h'), 0) || content.scrollHeight || 0;
        if (h > 0) el.style.setProperty('--card-h', h + 'px');
        el.classList.add('is-measured');
        void content.offsetHeight;                       // flush so the animation has a start value

        /* an explicit height would keep the card tall — remember it and let it shrink */
        this.savedHeight = el.style.height || null;
        if (this.savedHeight) el.style.height = 'auto';

        this.collapsed = true;
        el.classList.add('is-collapsed');
        this.syncButtons();
        emit(el, 'card:hide', { instance: this });
        return this;
    };

    CardInstance.prototype.show = function () {
        if (!this.collapsed) return this;
        var el = this.el;
        var self = this;

        this.collapsed = false;
        /* if we never measured (markup added while collapsed), take the value from the
           last time it was open — expand() then transitions 0 → that height */
        if (!el.style.getPropertyValue('--card-h')) {
            el.classList.add('card-no-anim');
            el.classList.remove('is-collapsed');
            var h = this.contentEl.scrollHeight;
            el.classList.add('is-collapsed');             // put it back, still un-painted
            if (h > 0) el.style.setProperty('--card-h', h + 'px');
            this.collapsed = true;
            void this.contentEl.offsetHeight;
            el.classList.remove('card-no-anim');
            this.collapsed = false;
        }
        el.classList.remove('is-collapsed');
        this.syncButtons();
        this.syncSized();

        /* after the animation: re-measure (the content may have changed while hidden)
           and give the authored height back */
        global.clearTimeout(this._showTimer);
        this._showTimer = global.setTimeout(function () {
            if (self.collapsed) return;
            if (self.savedHeight) { el.style.height = self.savedHeight; self.savedHeight = null; }
            self.releaseHeight();
            self.measure();
            self.syncSized();
        }, this.opts.duration + 60);

        emit(el, 'card:show', { instance: this });
        return this;
    };

    CardInstance.prototype.toggle = function () { return this.collapsed ? this.show() : this.hide(); };

    CardInstance.prototype.syncButtons = function () {
        var hideBtn = this.el.querySelector('[data-card-action="hide"], [data-card-action="collapse"]');
        if (hideBtn) {
            var icon = hideBtn.querySelector('i');
            var alt = hideBtn.getAttribute('data-card-icon-alt');
            if (icon && alt) icon.className = this.collapsed ? alt : (hideBtn.getAttribute('data-card-icon') || icon.className);
            hideBtn.setAttribute('aria-expanded', this.collapsed ? 'false' : 'true');
            var label = this.collapsed ? this.opts.labels.show : this.opts.labels.hide;
            hideBtn.setAttribute('aria-label', label);
            hideBtn.title = label;
        }
        var resizeBtn = this.el.querySelector('[data-card-action="resize"]');
        if (resizeBtn) resizeBtn.setAttribute('aria-pressed', this.el.classList.contains('is-resizable') ? 'true' : 'false');
    };

    /* -------------------------------------------------------------- refresh */
    CardInstance.prototype.refresh = function () {
        var self = this;
        if (this.loading) return Promise.resolve(false);

        this.loading = true;
        this.el.classList.add('is-loading');

        var settled = false, doneCalled = false, resolveOuter;
        var outer = new Promise(function (r) { resolveOuter = r; });

        var finish = function (ok, err) {
            if (settled) return;
            settled = true;
            self.loading = false;
            self.el.classList.remove('is-loading');
            if (ok) {
                self.el.classList.add('is-flash');
                global.setTimeout(function () { self.el.classList.remove('is-flash'); }, 700);
            } else {
                self.el.classList.add('is-error');
                global.setTimeout(function () { self.el.classList.remove('is-error'); }, 2000);
            }
            self.measure();
            self.syncSized();
            emit(self.el, 'card:refreshed', { instance: self, ok: ok, error: err || null });
            resolveOuter(ok);
        };

        var done = function (ok) { doneCalled = true; finish(ok !== false, null); };

        var proceed = emit(this.el, 'card:refresh', { instance: this, card: this.el, done: done }, true);
        if (!proceed || doneCalled) return outer;          // a listener took over

        var url = this.attr('data-card-refresh-url');
        var work;
        if (url) {
            var target = this.refreshTarget();
            work = fetchText(url).then(function (html) { target.innerHTML = html; });
        } else {
            work = delay(this.opts.refreshFallback);
        }
        Promise.all([work, delay(this.loading ? this.opts.minSpin : 0)]).then(function () {
            finish(true);
        }, function (err) {
            emit(self.el, 'card:error', { instance: self, error: err });
            finish(false, err);
        });
        return outer;
    };

    CardInstance.prototype.refreshTarget = function () {
        var sel = this.attr('data-card-refresh-target');
        if (sel) return this.el.querySelector(sel) || this.contentEl;
        return this.el.querySelector('.card-body') || this.contentEl;
    };

    function fetchText(url) {
        return fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            });
    }

    /* --------------------------------------------------------------- resize */
    CardInstance.prototype.setResize = function (on) {
        if (this.attr('data-card-resize') === 'off') return this;
        this.el.classList.toggle('is-resizable', on !== false);
        this.syncButtons();
        return this;
    };

    CardInstance.prototype.toggleResize = function () {
        return this.setResize(!this.el.classList.contains('is-resizable'));
    };

    CardInstance.prototype.startDrag = function (e) {
        var grip = e.target.closest && e.target.closest('.card-grip');
        if (!grip || !this.el.classList.contains('is-resizable')) return;
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();

        var rect = this.el.getBoundingClientRect();
        var parent = this.el.parentElement;
        var parentW = parent ? parent.getBoundingClientRect().width : global.innerWidth;

        this.drag = {
            dir: grip.getAttribute('data-grip'),
            x: e.clientX, y: e.clientY,
            w: rect.width || this.el.offsetWidth,
            h: rect.height || this.el.offsetHeight,
            maxW: num(this.attr('data-card-max-width'), this.opts.maxWidth || Math.max(240, parentW - (rect.left - (parent ? parent.getBoundingClientRect().left : 0)) - 8)),
            maxH: num(this.attr('data-card-max-height'), this.opts.maxHeight || Math.max(140, global.innerHeight - rect.top - 24))
        };

        this.el.classList.add('is-resizing');
        document.documentElement.classList.add('card-resizing');
        if (grip.setPointerCapture && e.pointerId != null) {
            try { grip.setPointerCapture(e.pointerId); } catch (err) {}
        }
        global.addEventListener('pointermove', this._onPointerMove);
        global.addEventListener('pointerup', this._onPointerUp);
        global.addEventListener('pointercancel', this._onPointerUp);
        emit(this.el, 'card:resize', { instance: this, start: true, width: this.drag.w, height: this.drag.h });
    };

    CardInstance.prototype.moveDrag = function (e) {
        var d = this.drag;
        if (!d) return;
        e.preventDefault && e.preventDefault();
        var minW = num(this.attr('data-card-min-width'), this.opts.minWidth);
        var minH = num(this.attr('data-card-min-height'), this.opts.minHeight);

        if (d.dir.indexOf('e') > -1) {
            d.width = clamp(d.w + (e.clientX - d.x), minW, d.maxW);
            this.el.style.width = Math.round(d.width) + 'px';
        }
        if (d.dir.indexOf('s') > -1) {
            d.height = clamp(d.h + (e.clientY - d.y), minH, d.maxH);
            this.el.style.height = Math.round(d.height) + 'px';
        }
        this.syncSized();
        emit(this.el, 'card:resize', { instance: this, width: d.width || null, height: d.height || null });
    };

    CardInstance.prototype.endDrag = function (e) {
        if (!this.drag) return;
        var d = this.drag;
        this.drag = null;
        this.el.classList.remove('is-resizing');
        document.documentElement.classList.remove('card-resizing');
        global.removeEventListener('pointermove', this._onPointerMove);
        global.removeEventListener('pointerup', this._onPointerUp);
        global.removeEventListener('pointercancel', this._onPointerUp);
        this.measure();
        this.syncSized();
        this.persist();
        emit(this.el, 'card:resized', {
            instance: this,
            width: d.width || this.el.offsetWidth,
            height: d.height || this.el.offsetHeight
        });
    };

    /* programmatic size, same rules as the drag */
    CardInstance.prototype.setSize = function (w, h) {
        if (w != null) this.el.style.width = Math.round(w) + 'px';
        if (h != null) this.el.style.height = Math.round(h) + 'px';
        this.measure();
        this.syncSized();
        this.persist();
        return this;
    };

    /* back to the size you authored in the markup / CSS */
    CardInstance.prototype.reset = function () {
        this.el.style.width = this.authored.width;
        this.el.style.height = this.authored.height;
        this.savedHeight = null;
        this.clearPersist();
        this.measure();
        this.syncSized();
        emit(this.el, 'card:reset', { instance: this });
        return this;
    };

    /* ------------------------------------------------------------ persistence */
    CardInstance.prototype.persistKey = function () {
        var key = this.el.getAttribute('data-card-persist');
        if (key === null) return null;                       // opt-in only
        if (key === '' || key === 'true') key = this.el.id || null;
        return key ? 'card:' + key : null;
    };

    CardInstance.prototype.persist = function () {
        var key = this.persistKey();
        if (!key) return;
        try {
            global.localStorage.setItem(key, JSON.stringify({
                w: this.el.style.width || null,
                h: this.el.style.height || null
            }));
        } catch (e) {}
    };

    CardInstance.prototype.clearPersist = function () {
        var key = this.persistKey();
        if (!key) return;
        try { global.localStorage.removeItem(key); } catch (e) {}
    };

    CardInstance.prototype.restore = function () {
        var key = this.persistKey();
        if (!key) return;
        try {
            var saved = JSON.parse(global.localStorage.getItem(key) || 'null');
            if (saved && (saved.w || saved.h)) {
                if (saved.w) this.el.style.width = saved.w;
                if (saved.h) this.el.style.height = saved.h;
                this.syncSized();
            }
        } catch (e) {}
    };

    /* ----------------------------------------------------------------- life */
    CardInstance.prototype.getState = function () {
        var el = this.el;
        return {
            collapsed: this.collapsed,
            loading: this.loading,
            resizable: el.classList.contains('is-resizable'),
            sized: el.classList.contains('is-sized'),
            width: el.offsetWidth || null,
            height: el.offsetHeight || null,
            authoredWidth: el.style.width || null,
            authoredHeight: el.style.height || null
        };
    };

    CardInstance.prototype.destroy = function () {
        global.clearTimeout(this._showTimer);
        this.unbind();
        var grips = this.el.querySelector(':scope > .card-grips');
        if (grips) grips.parentNode.removeChild(grips);
        var actions = this.el.querySelector(':scope > .card-header > .card-actions');
        if (actions && actions.children.length === 0 && actions.parentNode) actions.parentNode.removeChild(actions);
        this.el.classList.remove('is-ready', 'is-measured', 'is-resizable', 'is-collapsed', 'is-sized', 'is-loading');
        this.el.style.removeProperty('--card-h');
        delete this.el.__cardInstance;
        emit(this.el, 'card:destroy', { instance: this });
    };

    /* =========================================================================
       public API
       ========================================================================= */
    var Card = {
        defaults: DEFAULTS,
        version: '1.0.0',

        init: function (target, options) {
            var el = resolve(target);
            if (!el) return null;
            if (el.__cardInstance) return el.__cardInstance;
            if (el.classList.contains('card') || el.hasAttribute('data-card')) return new CardInstance(el, options);
            return null;
        },

        mount: function (root, options) {
            var scope = resolve(root) || document;
            return Array.prototype.slice.call(scope.querySelectorAll(DEFAULTS.selector))
                .filter(function (el) { return !el.__cardInstance; })
                .map(function (el) { return new CardInstance(el, options); });
        },

        get: function (target) { var el = resolve(target); return el ? el.__cardInstance || null : null; },

        refresh: function (target) { var c = Card.get(target); return c ? c.refresh() : Promise.resolve(false); },
        hide: function (target) { var c = Card.get(target); if (!c) return null; c.hide(); return c; },
        show: function (target) { var c = Card.get(target); if (!c) return null; c.show(); return c; },
        toggle: function (target) { var c = Card.get(target); if (!c) return null; c.toggle(); return c; },
        resize: function (target, on) { var c = Card.get(target); if (!c) return null; c.setResize(on); return c; },
        reset: function (target) { var c = Card.get(target); if (!c) return null; c.reset(); return c; },
        measure: function (target) { var c = Card.get(target); return c ? c.measure() : 0; },
        destroy: function (target) { var c = Card.get(target); if (c) c.destroy(); },

        destroyAll: function (root) {
            var scope = resolve(root) || document;
            Array.prototype.slice.call(scope.querySelectorAll(DEFAULTS.selector))
                .forEach(function (el) { if (el.__cardInstance) el.__cardInstance.destroy(); });
        }
    };

    global.Card = Card;

    /* auto-mount */
    var boot = function () { if (DEFAULTS.autoMount) Card.mount(document); };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    global.addEventListener('load', boot);      // late markup too
})(window);

(() => {
    'use strict';
    const API = {
        students: '/SchoolManager/GetStudentBios',
        staff: '/SchoolManager/GetStaffBios',
        results: '/SchoolManager/GetResults',
        payments: '/SchoolManager/GetSchPayments',
        subjects: '/SchoolManager/GetSubjects',
        classes: '/SchoolManager/GetRegisteredClasses',
        currencies: '/SharedResource/GetCurrencies',
        levelClasses: '/SchoolManager/GetLevelClasses/'
    };
    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706', '#7c3aed', '#64748b'];
    const TYPES = ['ClassAssignment', 'ClassTest', 'HomeWork', 'Project', 'Exam'];

    Vue.createApp({
        data() { return { students: [], staff: [], results: [], payments: [], subjects: [], classes: [], currencies: [], levelClasses: [], loadIssues: [], isLoading: false, lastUpdated: null, chartReady: false }; },
        computed: {
            cards() {
                const metric = (label, key, caption, icon, gradient) => ({ label, caption, icon, gradient, value: this.isLoading ? '…' : this.hasIssue(label) ? '—' : this.formatCount(this[key].length) });
                return [
                    metric('Students', 'students', 'All student records', 'bi-people', 'linear-gradient(to right,#1e3a8a,#2563eb)'),
                    metric('Staff', 'staff', 'All staff records', 'bi-person-badge', 'linear-gradient(to right,#6366f1,#8b5cf6)'),
                    metric('Classes', 'classes', 'Registered class records', 'bi-building', 'linear-gradient(to right,#8b5cf6,#d946ef)'),
                    metric('Subjects', 'subjects', 'Available subject records', 'bi-book', 'linear-gradient(to right,#10b981,#14b8a6)'),
                    metric('Results', 'results', 'All assessment records', 'bi-clipboard-check', 'linear-gradient(to right,#f59e0b,#f97316)')
                ];
            },
            community() {
                const make = (label, rows, field, issue, color) => {
                    const count = rows.filter(row => this.bool(row, field)).length;
                    const unavailable = this.isLoading || this.hasIssue(issue);
                    return { label, color, percent: !unavailable && rows.length ? 100 * count / rows.length : 0, text: unavailable ? '—' : `${this.formatCount(count)} of ${this.formatCount(rows.length)}` };
                };
                return [make('Pre-class students', this.students, 'isPreClassStudent', 'Students', '#1d4ed8'), make('Teachers', this.staff, 'isTeacher', 'Staff', '#10b981'), make('Boarders', this.students, 'isBoarder', 'Students', '#0ea5e9'), make('Alumni', this.students, 'isAlumni', 'Students', '#f59e0b')];
            },
            activeResults() { return this.results.filter(row => !this.bool(row, 'isCanceled')); },
            activePayments() { return this.payments.filter(row => !this.bool(row, 'isCanceled')); },
            assessmentTypes() {
                const norm = x => String(x || '').replace(/[\s_-]/g, '').toLowerCase();
                const items = TYPES.map((type, i) => ({ label: this.typeLabel(type), count: this.activeResults.filter(row => norm(this.value(row, 'type')) === norm(type)).length, color: COLORS[i] }));
                const other = this.activeResults.filter(row => !TYPES.some(type => norm(type) === norm(this.value(row, 'type')))).length;
                if (other) items.push({ label: 'Other / unknown', count: other, color: COLORS[5] });
                const max = Math.max(1, ...items.map(x => x.count));
                return items.map(item => ({ ...item, width: 100 * item.count / max }));
            },
            paymentGroups() {
                const groups = new Map();
                this.activePayments.forEach(row => { const id = this.currencyId(row); const group = groups.get(id) || { id, total: 0, count: 0 }; group.total += this.number(this.value(row, 'amountToPaid')); group.count++; groups.set(id, group); });
                return [...groups.values()].map(group => ({ ...group, name: this.currencyName(group.id) })).sort((a, b) => b.count - a.count);
            },
            recentStudents() { return this.sortRecent(this.students, 'admissionDate').slice(0, 7); },
            recentResults() { return this.sortRecent(this.activeResults, 'assignedDate').slice(0, 6); },
            recentPayments() { return this.sortRecent(this.activePayments, 'paymentDate').slice(0, 8); },
            currencyLookup() { const map = new Map(); this.currencies.forEach(row => { const id = this.value(row, 'id') ?? this.value(row, 'currencyId'); const name = this.value(row, 'currencyName') || this.value(row, 'name'); if (id && name) map.set(String(id).toLowerCase(), String(name)); }); return map; },
            classLookup() { const map = new Map(); this.levelClasses.forEach(row => { const id = this.value(row, 'id') ?? this.value(row, 'classId'); const name = this.value(row, 'className') || this.value(row, 'name'); if (id && name) map.set(String(id).toLowerCase(), String(name)); }); return map; },
            studentLookup() { const map = new Map(); this.students.forEach(s => { const id = this.value(s, 'id'); if (id) map.set(String(id).toLowerCase(), this.fullName(s)); }); return map; },
            lastUpdatedLabel() { return this.lastUpdated ? this.lastUpdated.toLocaleTimeString() : '—'; },
            admissionChart() {
                const buckets = new Map();
                this.students.forEach(row => { const d = this.parseDate(this.value(row, 'admissionDate')); if (!d) return; const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; buckets.set(key, (buckets.get(key) || 0) + 1); });
                const keys = [...buckets.keys()].sort();
                if (!keys.length) return { points: [], line: '', area: '', ticks: [] };
                const [y, m] = keys[keys.length - 1].split('-').map(Number);
                const last = new Date(y, m - 1, 1); const firstKey = keys[0]; const series = [];
                for (let i = 11; i >= 0; i--) { const date = new Date(last.getFullYear(), last.getMonth() - i, 1); const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; if (key < firstKey) continue; series.push({ key, label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), count: buckets.get(key) || 0 }); }
                const max = Math.max(1, ...series.map(x => x.count));
                const points = series.map((p, i) => ({ ...p, x: series.length === 1 ? 497.5 : 55 + i * 885 / (series.length - 1), y: 230 - p.count / max * 205 }));
                const line = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
                const area = points.length > 1 ? `${line} L ${points[points.length - 1].x} 230 L ${points[0].x} 230 Z` : '';
                const tickIntervals = Math.min(max, 4);
                const ticks = Array.from({ length: tickIntervals + 1 }, (_, i) => { const value = Math.round(i * max / tickIntervals); return { value, y: 230 - value / max * 205 }; });
                return { points, line, area, ticks };
            }
        },
        methods: {
            value(row, key) { if (!row) return undefined; return row[key] ?? row[key.charAt(0).toUpperCase() + key.slice(1)]; },
            bool(row, key) { const v = this.value(row, key); return v === true || v === 1 || (typeof v === 'string' && v.toLowerCase() === 'true'); },
            number(v) { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0; },
            formatCount(v) { return Math.round(this.number(v)).toLocaleString(); },
            formatAmount(v) { return this.number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
            fullName(row) { return ['firstName', 'otherName', 'lastName'].map(key => this.value(row, key)).filter(Boolean).join(' ') || '—'; },
            currencyId(row) { const id = this.value(row, 'currencyId'); return !id || String(id).toLowerCase() === EMPTY_GUID ? 'Unspecified' : String(id); },
            currencyName(id) { return this.currencyLookup.get(String(id).toLowerCase()) || id; },
            className(row) { const name = this.value(row, 'className'); if (name) return name; const id = this.value(row, 'classId'); return (id && this.classLookup.get(String(id).toLowerCase())) || (id && String(id).toLowerCase() !== EMPTY_GUID ? String(id) : '—'); },
            studentName(row) { const id = this.value(row, 'studentId'); return (id && this.studentLookup.get(String(id).toLowerCase())) || (id && String(id).toLowerCase() !== EMPTY_GUID ? String(id) : '—'); },
            typeLabel(value) { return ({ classassignment: 'Class Assignment', classtest: 'Class Test', homework: 'Homework', project: 'Project', exam: 'Exam' })[String(value || '').replace(/[\s_-]/g, '').toLowerCase()] || String(value || 'Unknown'); },
            parseDate(value) {
                if (!value) return null;
                const text = String(value); let date;
                const dotnet = text.match(/\/Date\((-?\d+)(?:[+-]\d+)?\)\//);
                if (dotnet) date = new Date(Number(dotnet[1]));
                else if (/^\d{4}-\d{2}-\d{2}/.test(text)) { const [y,m,d] = text.slice(0,10).split('-').map(Number); date = new Date(y, m-1, d); if (date.getFullYear() !== y || date.getMonth() !== m-1 || date.getDate() !== d) return null; }
                else date = new Date(value);
                return !Number.isFinite(date.getTime()) || date.getFullYear() <= 1 ? null : date;
            },
            formatDate(value) { const d = this.parseDate(value); return d ? d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; },
            sortRecent(rows, key) { return rows.slice().sort((a,b) => (this.parseDate(this.value(b,key))?.getTime() || 0) - (this.parseDate(this.value(a,key))?.getTime() || 0)); },
            hasIssue(label) { return this.loadIssues.includes(label); },
            rowsFrom(raw) {
                if (Array.isArray(raw)) return raw;
                if (!raw || typeof raw !== 'object') throw new Error('Unexpected response format');
                if (raw.success === false || raw.Success === false || raw.error || raw.Error) throw new Error('API reported an error');
                for (const key of ['result', 'items', 'data', 'records', 'studentBios', 'staffBios', 'results', 'payments', 'subjects', 'registeredClasses', 'currencies', 'levelClasses', 'classes']) {
                    const nested = this.value(raw, key);
                    if (nested !== undefined && nested !== null) return this.rowsFrom(nested);
                }
                throw new Error('Response does not contain a recognized list');
            },
            async fetchRows(url) {
                const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return this.rowsFrom(await response.json());
            },
            async loadDashboard() {
                if (this.isLoading) return;
                this.isLoading = true; this.chartReady = false;
                const sources = [['students','Students'], ['staff','Staff'], ['results','Results'], ['payments','Payments'], ['subjects','Subjects'], ['classes','Classes'], ['currencies','Currencies'], ['levelClasses','Class names']];
                try {
                    const outcomes = await Promise.all(sources.map(async ([key, label]) => {
                        try { return { key, label, rows: await this.fetchRows(API[key]) }; }
                        catch (error) { console.error(`${label} loading error:`, error); return { key, label, error }; }
                    }));
                    this.loadIssues = outcomes.filter(x => x.error).map(x => x.label);
                    outcomes.forEach(x => { this[x.key] = x.error ? [] : x.rows; });
                    this.lastUpdated = new Date();
                    this.$nextTick(() => requestAnimationFrame(() => { this.chartReady = true; }));
                } finally { this.isLoading = false; }
            }
        },
        mounted() { this.loadDashboard(); }
    }).mount('#schoolDashboard');
})();

/* Vue 3 global-build W-Select component. No build step; load Vue before this file. */
/* use-example
*app.use(WSelectPlugin);
* <w-select
  v-model="supplierId"
  :options="suppliers"
  display-key="name"
  value-key="id"
  :search-keys="['accountNumber']"
  label="Supplier"
  placeholder="Choose a supplier"
  search-placeholder="Search suppliers…"
  clearable
  @change="onSupplierChange">
</w-select>
* */

(function registerWSelect(global) {
    'use strict';

    let nextDropdownId = 0;
    const getPath = (object, path) => {
        if (object === null || object === undefined || !path) return undefined;
        return String(path).split('.').reduce((value, key) => value == null ? undefined : value[key], object);
    };
    const displayString = (value) => value === null || value === undefined ? '' : String(value);

    const WSelect = {
        name: 'WSelect',
        inheritAttrs: false,
        props: {
            modelValue: { default: null },
            options: { type: Array, default: () => [] },
            displayKey: { type: String, default: 'label' },
            valueKey: { type: String, default: 'value' },
            searchKeys: { type: Array, default: () => [] },
            disabledKey: { type: String, default: 'disabled' },
            id: { type: String, default: '' },
            name: { type: String, default: '' },
            label: { type: String, default: '' },
            placeholder: { type: String, default: 'Select an option…' },
            searchPlaceholder: { type: String, default: 'Search options…' },
            noResultsText: { type: String, default: 'No matching options' },
            helperText: { type: String, default: '' },
            error: { type: String, default: '' },
            disabled: { type: Boolean, default: false },
            required: { type: Boolean, default: false },
            clearable: { type: Boolean, default: false },
            maxHeight: { type: String, default: '15rem' },
            size: { type: String, default: 'md', validator: (value) => ['sm', 'md', 'lg'].includes(value) }
        },
        emits: ['update:modelValue', 'change', 'select', 'open', 'close', 'search'],
        data() {
            const id = this.id || `w-select-${++nextDropdownId}`;
            return {
                isOpen: false,
                searchQuery: '',
                activeIndex: -1,
                inputId: id,
                labelId: `${id}-label`,
                listboxId: `${id}-listbox`
            };
        },
        computed: {
            normalizedOptions() {
                return this.options.map((raw, index) => {
                    const isObject = raw !== null && typeof raw === 'object';
                    const value = isObject ? getPath(raw, this.valueKey) : raw;
                    let label = isObject ? getPath(raw, this.displayKey) : raw;
                    if (label === null || label === undefined) label = value;
                    const searchParts = [label];
                    this.searchKeys.forEach((key) => searchParts.push(getPath(raw, key)));
                    return {
                        raw,
                        index,
                        value,
                        label: displayString(label),
                        searchText: searchParts.map(displayString).join(' ').toLocaleLowerCase(),
                        disabled: isObject && this.disabledKey ? Boolean(getPath(raw, this.disabledKey)) : false,
                        domId: `${this.listboxId}-option-${index}`
                    };
                });
            },
            filteredOptions() {
                const query = this.searchQuery.trim().toLocaleLowerCase();
                if (!query) return this.normalizedOptions;
                return this.normalizedOptions.filter((option) => option.searchText.includes(query));
            },
            selectedOption() {
                if (this.modelValue === null || this.modelValue === undefined) return null;
                const exact = this.normalizedOptions.find((option) => Object.is(option.value, this.modelValue));
                if (exact) return exact;
                const wanted = String(this.modelValue);
                return this.normalizedOptions.find((option) => String(option.value) === wanted) || null;
            },
            selectedLabel() { return this.selectedOption ? this.selectedOption.label : ''; },
            activeDescendant() {
                const option = this.filteredOptions[this.activeIndex];
                return this.isOpen && option ? option.domId : undefined;
            },
            triggerClasses() {
                const sizeClasses = {
                    sm: 'min-h-9 px-3 py-1.5 text-sm',
                    md: 'min-h-11 px-3.5 py-2.5 text-sm',
                    lg: 'min-h-12 px-4 py-3 text-base'
                };
                return [
                    'flex w-full items-center justify-between gap-3 rounded-lg border bg-white text-left text-slate-900 shadow-sm outline-none transition',
                    'border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
                    'dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/50',
                    sizeClasses[this.size] || sizeClasses.md,
                    this.error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:border-rose-500' : '',
                    this.disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400 opacity-70 dark:bg-slate-800 dark:text-slate-500' : 'cursor-pointer'
                ];
            }
        },
        watch: {
            searchQuery(value) {
                this.activeIndex = this.firstEnabledIndex();
                this.$emit('search', value);
            },
            options() {
                if (this.isOpen) this.activeIndex = this.firstEnabledIndex();
            },
            modelValue() {
                if (this.isOpen) this.activeIndex = this.firstEnabledIndex();
            }
        },
        mounted() {
            document.addEventListener('mousedown', this.onOutsidePointer);
            document.addEventListener('touchstart', this.onOutsidePointer, { passive: true });
        },
        beforeUnmount() {
            document.removeEventListener('mousedown', this.onOutsidePointer);
            document.removeEventListener('touchstart', this.onOutsidePointer);
        },
        methods: {
            optionId(option) { return option.domId; },
            firstEnabledIndex() { return this.filteredOptions.findIndex((option) => !option.disabled); },
            openDropdown() {
                if (this.disabled || this.isOpen) return;
                this.isOpen = true;
                this.searchQuery = '';
                this.activeIndex = this.firstEnabledIndex();
                this.$emit('open');
                this.$nextTick(() => {
                    if (this.$refs.searchInput) this.$refs.searchInput.focus();
                    this.scrollActiveOptionIntoView();
                });
            },
            closeDropdown(returnFocus = false) {
                if (!this.isOpen) return;
                this.isOpen = false;
                this.searchQuery = '';
                this.activeIndex = -1;
                this.$emit('close');
                if (returnFocus) this.$nextTick(() => this.$refs.trigger && this.$refs.trigger.focus());
            },
            toggleDropdown() {
                if (this.isOpen) this.closeDropdown();
                else this.openDropdown();
            },
            onOutsidePointer(event) {
                if (this.isOpen && this.$el && !this.$el.contains(event.target)) this.closeDropdown();
            },
            onTriggerKeydown(event) {
                if (this.disabled) return;
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (!this.isOpen) this.openDropdown();
                    else if (event.key === 'ArrowDown') this.moveActive(1);
                    else if (event.key === 'ArrowUp') this.moveActive(-1);
                }
            },
            onSearchKeydown(event) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.moveActive(1);
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.moveActive(-1);
                } else if (event.key === 'Home') {
                    event.preventDefault();
                    this.setActiveEdge(false);
                } else if (event.key === 'End') {
                    event.preventDefault();
                    this.setActiveEdge(true);
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    const option = this.filteredOptions[this.activeIndex];
                    if (option && !option.disabled) this.selectOption(option);
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    this.closeDropdown(true);
                } else if (event.key === 'Tab') {
                    this.closeDropdown();
                }
            },
            moveActive(direction) {
                const options = this.filteredOptions;
                if (!options.length) { this.activeIndex = -1; return; }
                let index = this.activeIndex;
                for (let attempts = 0; attempts < options.length; attempts += 1) {
                    index = (index + direction + options.length) % options.length;
                    if (!options[index].disabled) {
                        this.activeIndex = index;
                        this.scrollActiveOptionIntoView();
                        return;
                    }
                }
                this.activeIndex = -1;
            },
            setActiveEdge(last) {
                const options = this.filteredOptions;
                if (last) {
                    for (let index = options.length - 1; index >= 0; index -= 1) {
                        if (!options[index].disabled) { this.activeIndex = index; this.scrollActiveOptionIntoView(); return; }
                    }
                } else {
                    this.activeIndex = this.firstEnabledIndex();
                    this.scrollActiveOptionIntoView();
                }
            },
            scrollActiveOptionIntoView() {
                this.$nextTick(() => {
                    const option = this.filteredOptions[this.activeIndex];
                    const element = option && document.getElementById(option.domId);
                    if (element && typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest' });
                });
            },
            selectOption(option) {
                if (!option || option.disabled) return;
                this.$emit('update:modelValue', option.value);
                this.$emit('change', { value: option.value, option: option.raw });
                this.$emit('select', option.raw);
                this.closeDropdown(true);
            },
            clearSelection(event) {
                if (event) event.stopPropagation();
                if (this.disabled) return;
                this.$emit('update:modelValue', null);
                this.$emit('change', { value: null, option: null });
                this.closeDropdown(true);
            }
        },
        template: `
      <div ref="root" class="relative w-full" v-bind="$attrs">
        <label v-if="label" :id="labelId" :for="inputId" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {{ label }} <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
        </label>
        <div class="relative">
          <button ref="trigger" :id="inputId" type="button" role="combobox" :disabled="disabled"
            :aria-labelledby="label ? labelId : undefined" :aria-label="label ? undefined : placeholder"
            aria-haspopup="listbox" :aria-expanded="isOpen" :aria-controls="listboxId" :aria-required="required"
            :class="triggerClasses" @click="toggleDropdown" @keydown="onTriggerKeydown">
            <span class="min-w-0 flex-1 truncate" :class="selectedOption ? '' : 'text-slate-400 dark:text-slate-500'">
              {{ selectedOption ? selectedLabel : placeholder }}
            </span>
            <span class="flex shrink-0 items-center text-slate-400 dark:text-slate-500" :class="clearable && selectedOption && !disabled ? 'pr-6' : ''">
              <i class="bi bi-chevron-down text-xs transition-transform" :class="isOpen ? 'rotate-180' : ''" aria-hidden="true"></i>
            </span>
          </button>
          <button v-if="clearable && selectedOption && !disabled" type="button" class="absolute right-8 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100" aria-label="Clear selection" @click.stop="clearSelection">
            <i class="bi bi-x-lg text-xs" aria-hidden="true"></i>
          </button>
          <input v-if="name" type="hidden" :name="name" :value="modelValue == null ? '' : modelValue">

          <div v-if="isOpen" class="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10">
            <div class="border-b border-slate-100 p-2.5 dark:border-slate-700">
              <label class="sr-only" :for="inputId + '-search'">Search {{ label || 'options' }}</label>
              <div class="relative">
                <i class="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500" aria-hidden="true"></i>
                <input ref="searchInput" :id="inputId + '-search'" v-model="searchQuery" type="search" role="combobox"
                  :placeholder="searchPlaceholder" autocomplete="off" :aria-expanded="true" :aria-controls="listboxId"
                  :aria-activedescendant="activeDescendant" aria-autocomplete="list" @keydown="onSearchKeydown"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-950 dark:focus:ring-blue-900/50">
              </div>
            </div>
            <ul :id="listboxId" role="listbox" :aria-labelledby="label ? labelId : undefined" :style="{ maxHeight: maxHeight }" class="overflow-y-auto p-1.5">
              <li v-for="(option, index) in filteredOptions" :id="optionId(option)" :key="option.index" role="option"
                :aria-selected="selectedOption && Object.is(selectedOption.value, option.value) ? 'true' : 'false'"
                :aria-disabled="option.disabled ? 'true' : undefined"
                @mouseenter="!option.disabled && (activeIndex = index)"
                @click="!option.disabled && selectOption(option)"
                class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition"
                :class="option.disabled ? 'cursor-not-allowed text-slate-300 dark:text-slate-600' : index === activeIndex ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'">
                <span class="min-w-0 truncate">{{ option.label }}</span>
                <i v-if="selectedOption && Object.is(selectedOption.value, option.value)" class="bi bi-check2 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true"></i>
              </li>
              <li v-if="filteredOptions.length === 0" role="status" class="px-3 py-5 text-center text-sm text-slate-500 dark:text-slate-400">{{ noResultsText }}</li>
            </ul>
            <div v-if="filteredOptions.length" class="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
              {{ filteredOptions.length }} option{{ filteredOptions.length === 1 ? '' : 's' }}
            </div>
          </div>
        </div>
        <p v-if="error" class="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">{{ error }}</p>
        <p v-else-if="helperText" class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{{ helperText }}</p>
      </div>
    `
    };

    const WSelectPlugin = {
        install(app) { app.component('WSelect', WSelect); }
    };

    global.WSelect = WSelect;
    global.WSelectPlugin = WSelectPlugin;
})(globalThis);

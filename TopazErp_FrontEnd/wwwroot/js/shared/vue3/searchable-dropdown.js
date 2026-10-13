let activeDropdown = null;
document.addEventListener('mousedown', (e) => {
    if (!activeDropdown) return;

    const inputEl = document.getElementById(activeDropdown.inputId);
    const dropdownEl = document.getElementById(activeDropdown.dropdownId);

    const clickedInsideInput = inputEl && inputEl.contains(e.target);
    const clickedInsideDropdown = dropdownEl && dropdownEl.contains(e.target);

    if (clickedInsideInput || clickedInsideDropdown) return;

    activeDropdown.showDropdown = false;
    activeDropdown.search = '';
    activeDropdown._removeListeners();
    activeDropdown = null;
});
const SearchableDropdown = {

    props: {
        options: { type: Array, default: () => [] },
        modelValue: { default: null },
        placeholder: { type: String, default: 'Search...' },
        textField: { type: String, default: 'name' },
        valueField: { type: String, default: 'id' },
        emptyText: { type: String, default: 'No records found' }
    },

    data() {
        return {
            search: '',
            showDropdown: false,
            dropdownStyle: {},
            inputId: 'sd-' + Math.random().toString(36).slice(2, 9),
            dropdownId: 'sd-dd-' + Math.random().toString(36).slice(2, 9),
        };
    },

    computed: {
        filteredOptions() {
            if (!this.search) return this.options;
            return this.options.filter(option => {
                const text = option[this.textField];
                if (!text) return false;
                return text.toString().toLowerCase().includes(this.search.toLowerCase());
            });
        },

        selectedText() {
            const selected = this.options.find(x => x[this.valueField] === this.modelValue);
            return selected ? selected[this.textField] : '';
        }
    },

    watch: {
        selectedText: {
            immediate: true,
            handler(value) {
                this.search = value || '';
            }
        }
    },

    methods: {
         onFocus() {
            this._positionDropdown();
            this.showDropdown = true;
            this._addListeners();
        },
        
        _positionDropdown() {
            const input = document.getElementById(this.inputId);
            const rect = input.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = 250;

            // Open upward if not enough space below
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                this.dropdownStyle = {
                    position: 'fixed',
                    bottom: (window.innerHeight - rect.top) + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px',
                    maxHeight: Math.min(spaceAbove - 8, dropdownHeight) + 'px',
                    top: 'auto'
                };
            } else {
                this.dropdownStyle = {
                    position: 'fixed',
                    top: rect.bottom + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px',
                    maxHeight: Math.min(spaceBelow - 8, dropdownHeight) + 'px',
                    bottom: 'auto'
                };
            }
        },

        _onScroll() {
            if (this.showDropdown) this._positionDropdown();
        },

        _addListeners() {
            this._scrollHandler = this._onScroll.bind(this);
            window.addEventListener('scroll', this._scrollHandler, true);
            window.addEventListener('resize', this._scrollHandler);
        },

        _removeListeners() {
            if (this._scrollHandler) {
                window.removeEventListener('scroll', this._scrollHandler, true);
                window.removeEventListener('resize', this._scrollHandler);
            }
        },

        toggleDropdown() {
            if (this.showDropdown) {
                this.showDropdown = false;
                this.search = '';
                this._removeListeners();
                activeDropdown = null;
            } else {
                // close whichever dropdown is currently open
                if (activeDropdown && activeDropdown !== this) {
                    activeDropdown.showDropdown = false;
                    activeDropdown.search = '';
                    activeDropdown._removeListeners();
                }
                this.search = '';
                this._positionDropdown();
                this.showDropdown = true;
                this._addListeners();
                activeDropdown = this;
            }
        },

        selectOption(option) {
            this.$emit('update:modelValue', option[this.valueField]);
            this.search = '';
            this.showDropdown = false;
            this._removeListeners();
            activeDropdown = null;
        },

        closeDropdown() {
            setTimeout(() => {
                this.showDropdown = false;
                this.search = '';
                this._removeListeners();
                activeDropdown = null;
            }, 200);
        },
    },

    beforeUnmount() {
        this._removeListeners();
    },

    template: `
       <div style="position: relative;">

        <div :id="inputId"
         style="display: flex; align-items: center; background: #ffffff; border: 0.5px solid #9f9f9f; border-radius: 5px; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer;"
         :style="showDropdown ? 'border-color: #FFFFFFFF; box-shadow: 0 0 0 3px rgba(0,0,0,0.06);' : ''"
         @mousedown.prevent="toggleDropdown">
    
        <span style="flex: 1; padding: 9px 12px; font-size: 14px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
              :style="selectedText ? 'color: #333333;' : 'color: #9f9f9f;'">
            {{ selectedText || placeholder }}
        </span>
    
        <button type="button"
                style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: transparent; cursor: pointer; color: #9f9f9f; flex-shrink: 0; transition: color 0.15s;">
            <i class="la la-caret-down"
               style="font-size: 16px; transition: transform 0.2s;"
               :style="showDropdown ? 'transform: rotate(180deg);' : ''"></i>
        </button>
    </div>

        <teleport to="body">
            <div v-if="showDropdown"
                 :id="dropdownId"
                 :style="{ ...dropdownStyle, zIndex: 9999 }"
                 style="background: #FFFFFFFF; border: 0.5px solid #9f9f9f; border-radius: 5px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); padding: 4px;">
        
                <div style="padding: 4px 4px 6px;">
                    <input type="text"
                           v-model="search"
                           :ref="el => { if (el) el.focus() }"
                           placeholder="Search..."
                           @blur="closeDropdown"
                           style="width: 100%; box-sizing: border-box; border: 0.5px solid #9f9f9f; border-radius: 4px; padding: 7px 10px; font-size: 13px; outline: none; color: #333333;">
                </div>
        
                <div style="overflow-y: auto; max-height: 160px;">
                    <a href="javascript:void(0)"
                       v-for="option in filteredOptions"
                       :key="option[valueField]"
                       @mousedown.prevent="selectOption(option)"
                       style="display: block; padding: 8px 10px; font-size: 14px; color: #2e2e2e; transition: background 0.1s; text-decoration: none; border-bottom: 1px solid #9f9f9f;"
                       onmouseover="this.style.background='#EBF3FF'"
                       onmouseout="this.style.background='transparent'">
                        {{ option[textField] }}
                    </a>
        
                    <div v-if="filteredOptions.length === 0"
                         style="padding: 10px; font-size: 13px; color: #9f9f9f; text-align: center;">
                        {{ emptyText }}
                    </div>
                </div>
            </div>
        </teleport>

      </div>
    `
};
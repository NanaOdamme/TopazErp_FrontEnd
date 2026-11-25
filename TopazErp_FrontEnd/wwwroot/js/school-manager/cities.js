(() => {
    'use strict';

    const norm = value => String(value ?? '').trim().toLowerCase();
    const asArray = data => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.result)) return data.result;
        if (Array.isArray(data?.result?.items)) return data.result.items;
        if (Array.isArray(data?.items)) return data.items;
        throw new Error('Expected an array in the JSON response.');
    };

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                payload: {},
                countries: [],
                regions: [],
                cities: [],
                columns: [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'name', label: 'Country', type: 'avatar', required: true, editable: false, searchable: true, width: '150', subtitleKey: 'code' },
                    { key: 'numericIsoCode', label: 'Iso Code', type: 'number', required: true, editable: false, searchable: true, width: '50' },
                    { key: 'nationality', label: 'Nationality', type: 'text', required: true, editable: false, searchable: true, width: '150' }
                ]
            };
        },
        computed: {
            // Bind this object to the same DataGrid detail configuration prop
            // that your academic-year page uses for termCol.
            regionCol() {
                return {
                    key: 'regions',
                    title: 'Regions',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                        { key: 'name', label: 'Region / State', type: 'text', width: 220, editable: false, searchable: true },
                       /* { key: 'adminCode', label: 'Admin Code', type: 'text', width: 130, editable: false, searchable: true },
                        { key: 'countryName', label: 'Country', type: 'text', width: 180, editable: false, searchable: true },
                        { key: 'countryCode', label: 'Country Code', type: 'text', width: 120, editable: false, searchable: true },
                        { key: 'geonameId', label: 'GeoName ID', type: 'text', width: 130, editable: false, searchable: true }
                    */],
                    child: { key: 'cities', title: 'Cities', columns: this.cityColumns }
                };
            },
            cityColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'name', label: 'City', type: 'text', width: 220, editable: false, searchable: true },
                   /* { key: 'countryName', label: 'Country', type: 'text', width: 180, editable: false, searchable: true },
                    { key: 'admin1', label: 'Region Code', type: 'text', width: 130, editable: false, searchable: true },
                    { key: 'admin2', label: 'District Code', type: 'text', width: 130, editable: false, searchable: true },
                    { key: 'population', label: 'Population', type: 'number', width: 130, editable: false, searchable: true },
                    { key: 'isOther', label: 'Other?', type: 'boolean', width: 100, editable: false },
                    { key: 'geonameId', label: 'GeoName ID', type: 'text', width: 130, editable: false }*/
                ];
            }
        },
        methods: {
            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const version = Date.now();
                    const [countryResponse, regionResponse, cityResponse] = await Promise.all([
                        axios.get(`/jsonDataSample/countries.json?v=${version}`),
                        axios.get(`/jsonDataSample/regions.json?v=${version}`),
                        axios.get(`/jsonDataSample/cities.json?v=${version}`)
                    ]);
                    const countries = asArray(countryResponse.data);
                    const regions = asArray(regionResponse.data);
                    const cities = asArray(cityResponse.data);

                    // Index records by country, and regions by country + adminCode.
                    const regionsByCountry = new Map();
                    const regionByKey = new Map();
                    const nestedRegions = regions.map(region => ({ ...region, cities: [] }));
                    nestedRegions.forEach(region => {
                        const country = norm(region.countryCode);
                        if (!regionsByCountry.has(country)) regionsByCountry.set(country, []);
                        regionsByCountry.get(country).push(region);
                        const admin = norm(region.adminCode);
                        if (country && admin) {
                            const key = `${country}|${admin}`;
                            if (!regionByKey.has(key)) regionByKey.set(key, []);
                            regionByKey.get(key).push(region);
                        }
                    });

                    // Empty or unknown admin1 values cannot be mapped to a real region.
                    // Preserve those cities in a clearly labelled synthetic region.
                    const unassigned = new Map();
                    cities.forEach(city => {
                        const country = norm(city.countryCode);
                        const admin = norm(city.admin1);
                        const matches = country && admin ? regionByKey.get(`${country}|${admin}`) : null;
                        if (matches?.length === 1) {
                            matches[0].cities.push({ ...city });
                        } else {
                            if (!unassigned.has(country)) unassigned.set(country, []);
                            unassigned.get(country).push({ ...city });
                        }
                    });

                    this.regions = regions;
                    this.cities = cities;
                    this.countries = countries.map(country => {
                        const code = norm(country.code);
                        const countryRegions = (regionsByCountry.get(code) || []).slice();
                        const remaining = unassigned.get(code) || [];
                        if (remaining.length) {
                            countryRegions.push({
                                id: `unassigned:${country.id || code}`,
                                name: 'Unassigned / Other',
                                countryCode: country.code,
                                countryName: country.name,
                                adminCode: '',
                                geonameId: null,
                                isSynthetic: true,
                                cities: remaining
                            });
                        }
                        return { ...country, regions: countryRegions };
                    });

                    const countryCodes = new Set(countries.map(country => norm(country.code)).filter(Boolean));
                    const unmatchedRegions = regions.filter(region => !countryCodes.has(norm(region.countryCode))).length;
                    const unmatchedCities = cities.filter(city => !countryCodes.has(norm(city.countryCode))).length;
                    if (unmatchedRegions || unmatchedCities) {
                        console.warn('Records with no matching country:', { unmatchedRegions, unmatchedCities });
                       /* this.toastHandler('warning', `${unmatchedRegions} region(s) and ${unmatchedCities} city/cities have no matching country code.`);*/
                    }
                } catch (error) {
                    console.error('Unable to load country setup:', error);
                    this.toastHandler('error', 'Unable to load countries, regions and cities.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') {
                    console.log(`[${type.toUpperCase()}] ${message}`);
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
            }
        },
        mounted() { this.getSetupData(); }
    });

    app.use(DataGridPlugin);
    app.mount('#app');
})();

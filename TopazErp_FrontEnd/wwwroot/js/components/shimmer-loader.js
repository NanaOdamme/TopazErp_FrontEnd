const ShimmerLoader = {
    name: 'ShimmerLoader',
    props: {
        layout: {
            type: Array,
            default: () => [
                ['short', 'short', 'short'],
                ['tall']
            ]
        }
    },
    template: `
        <div class="shimmer-wrapper">
            <div v-for="(row, ri) in layout" :key="ri" class="shimmer-row">
                <div v-for="(block, bi) in row" :key="bi" class="shimmer-block" :class="block"></div>
            </div>
        </div>
    `
};
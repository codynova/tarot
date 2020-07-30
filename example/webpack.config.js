const { build } = require('tarot')

module.exports = build({
    entries: {
        app: {
            file: 'App.tsx',
            useCssModules: true,
        },
        'scripts/bundle': {
            file: 'test.js',
        },
        styles: {
            file: 'styles/styles.scss',
        },
    },
    alias: {
        Components: 'components',
    },
})
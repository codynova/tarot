const { build } = require('tarot')

module.exports = (env, argv) => build({
    argv,
    entries: {
        bundle: {
            file: 'index.js',
        },
        'ts-bundle': {
            file: 'test.ts',
        },
        styles: {
            file: 'styles/styles.scss',
            useCssModules: true,
        },
    },
    aliases: {
        Data: 'data',
        Styles: 'styles',
        Types: 'types',
    },
})
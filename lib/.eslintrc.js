module.exports = {
    extends: [
        // In Eslint 7+, plugins are resolved
        // relative to the config file. Tarot
        // expects to be installed in node_modules
        // alongside tarot-eslint-config.
        require.resolve('tarot-eslint-config'),
    ],
}

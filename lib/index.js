'use strict';

const pkg = require('../package.json');
const fs = require('fs');
const webpack = require('webpack');
const path = require('path');
const sass = require('sass');
const fibers = require('fibers');
const autoPrefix = require('autoprefixer');
const sortQueries = require('postcss-sort-media-queries');
const PluginCopy = require('copy-webpack-plugin');
const PluginForkTypeScriptCheck = require('fork-ts-checker-webpack-plugin')
const PluginStyleLint = require('stylelint-webpack-plugin');
const PluginESLint = require('eslint-webpack-plugin');
const PluginCSSExtract = require('extract-css-chunks-webpack-plugin');
const PluginOptimizeCSS = require('optimize-css-assets-webpack-plugin');
const PluginIgnoreEmit = require('ignore-emit-webpack-plugin');

// TO DO:
// * ensure .eslintignore works as expected (glob paths relative to src directory)
// * improve error handling and options validation
// * make use of webpack.DefinePlugin for inserting user package name/version
// * allow specifying ts-loader compilerOptions like aliases, target, module (and maybe lib?)
// * add @types devDependencies for convenience? (react, react-dom, etc?)
// * make devServerSettings work with output in individual entry configs

let DEV_MODE = true;

const VALID_FILE_EXTENSIONS = [ '.ts', '.tsx', '.js', '.jsx', '.scss', '.css' ];
const RELATIVE_FILE_PATH_REGEX = /^(\.\/|\.\\)/;
const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i;
const POLYFILLS_MODULE = 'core-js/stable';
const LIB_PATH = path.resolve(__dirname);
const CWD_RELATIVE_PATH = path.relative(LIB_PATH, process.cwd());
const CWD_ABSOLUTE_PATH = path.resolve(LIB_PATH, CWD_RELATIVE_PATH);

const DEFAULT_SOURCE = 'src';
const DEFAULT_OUTPUT = 'dist';

const OPTIONS = {
    set (config) {
        const {
            aliases,
            useHttps,
            allowCors,
            nodeModuleBabelIncludes,
            plugins,
            source,
            output,
            useScriptLoaders,
            useCssModules,
            cssGlobalIncludes,
            cssModuleIncludes,
            usePolyfills,
            useLinting,
            useStyleLinting,
            useScriptLinting,
            eslintConfigPath,
            eslintIgnorePath,
            eslintExcludes,
            stylelintConfigPath,
            tsConfigPath,
            babelConfigPath,
        } = config;
        this.source = path.resolve(CWD_ABSOLUTE_PATH, source !== null ? source : DEFAULT_SOURCE);
        this.output = path.resolve(CWD_ABSOLUTE_PATH, output !== null ? output : DEFAULT_OUTPUT);
        this.aliases = (() => {
            const map = {};
            Object.entries(aliases).forEach(([key, value]) => map[key] = path.resolve(this.source, value))
            return map;
        })();
        this.useHttps = useHttps;
        this.allowCors = allowCors;
        this.nodeModuleBabelIncludes = nodeModuleBabelIncludes.map(moduleName => path.resolve(CWD_ABSOLUTE_PATH, 'node_modules', moduleName));
        this.plugins = plugins;
        this.useScriptLoaders = useScriptLoaders;
        this.useCssModules = useCssModules;
        this.cssGlobalIncludes = cssGlobalIncludes.length ? cssGlobalIncludes.map(dir => path.resolve(this.source, dir)) : [ path.resolve(this.source, 'styles') ];
        this.cssModuleIncludes = cssModuleIncludes.length ? cssModuleIncludes.map(dir => path.resolve(this.source, dir)) : [ path.resolve(this.source, 'components') ];
        this.usePolyfills = usePolyfills;
        this.useLinting = useLinting;
        this.useStyleLinting = useStyleLinting;
        this.useScriptLinting = useScriptLinting;
        this.eslintConfigPath = eslintConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, eslintConfigPath) : path.resolve(LIB_PATH, '.eslintrc.js');
        this.eslintIgnorePath = eslintIgnorePath ? path.resolve(CWD_ABSOLUTE_PATH, eslintIgnorePath) : path.resolve(LIB_PATH, '.eslintignore');
        this.eslintExcludes = eslintExcludes.length ? eslintExcludes : [];
        this.stylelintConfigPath = stylelintConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, stylelintConfigPath) : path.resolve(LIB_PATH, 'stylelint.config.js');
        if (tsConfigPath) {
            this.tsConfigPath = path.resolve(CWD_ABSOLUTE_PATH, tsConfigPath)
        }
        else {
            this.tsConfigPath = path.resolve(LIB_PATH, 'tsconfig.json');
            const tsConfigJSON = JSON.parse(fs.readFileSync(this.tsConfigPath));
            tsConfigJSON.include = [
                `${CWD_RELATIVE_PATH}/${source !== null ? source : DEFAULT_SOURCE}/**/*.ts`,
                `${CWD_RELATIVE_PATH}/${output !== null ? output : DEFAULT_OUTPUT}/**/*.tsx`,
            ];
            fs.writeFileSync(this.tsConfigPath, JSON.stringify(tsConfigJSON, null, 4));
        }
        this.babelConfigPath = babelConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, babelConfigPath) : path.resolve(LIB_PATH, 'babel.config.js');
        _validateConfigOptions(config, this);
    },
};

const _validateConfigOptions = (raw, gen) => {
    try {
        if (raw.source && !fs.existsSync(gen.source)) {
            throw new Error(`You provided a source option, but no directory exists at ${gen.source}`);
        }
        if (raw.output && !fs.existsSync(gen.output)) {
            throw new Error(`You provided a output option, but no directory exists at ${gen.output}`);
        }
        if (raw.cssModuleIncludes && raw.cssModuleIncludes.length && gen.cssModuleIncludes.some(dir => !fs.existsSync(dir))) {
            const missingDir = gen.cssModuleIncludes.find(dir => !fs.existsSync(dir));
            throw new Error(`You provided a cssModuleIncludes option, but no directory exists at ${missingDir}`);
        }
        if (raw.cssGlobalIncludes && raw.cssGlobalIncludes.length && gen.cssGlobalIncludes.some(dir => !fs.existsSync(dir))) {
            const missingDir = gen.cssGlobalIncludes.find(dir => !fs.existsSync(dir));
            throw new Error(`You provided a cssGlobalIncludes option, but no directory exists at ${missingDir}`);
        }
        if (raw.eslintConfigPath && !fs.existsSync(gen.eslintConfigPath)) {
            throw new Error(`You provided a eslintConfigPath option, but no file exists at ${gen.eslintConfigPath}`);
        }
        if (raw.eslintIgnorePath && !fs.existsSync(gen.eslintIgnorePath)) {
            throw new Error(`You provided a eslintIgnorePath option, but no file exists at ${gen.eslintIgnorePath}`);
        }
        if (raw.stylelintConfigPath && !fs.existsSync(gen.stylelintConfigPath)) {
            throw new Error(`You provided a stylelintConfigPath option, but no file exists at ${gen.stylelintConfigPath}`);
        }
        if (raw.tsConfigPath && !fs.existsSync(gen.tsConfigPath)) {
            throw new Error(`You provided a tsConfigPath option, but no file exists at ${gen.tsConfigPath}`);
        }
        if (raw.babelConfigPath && !fs.existsSync(gen.babelConfigPath)) {
            throw new Error(`You provided a babelConfigPath option, but no file exists at ${gen.babelConfigPath}`);
        }
    }
    catch (error) {
        console.error('\n\n\x1b[31m%s\x1b[0m', error, '\n\n');
        process.exit(1);
    }
};

const defineEntry = (entryFile, usePolyfills) => ({ entry: usePolyfills ? [ POLYFILLS_MODULE, entryFile ] : [ entryFile ] });

const defineOutput = (output, jsOutputFile) => ({ output: { path: output, filename: jsOutputFile } });

const commonSettings = source => ({
    mode: DEV_MODE ? 'development' : 'production',
    context: source,
    resolve: {
		extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
		alias: OPTIONS.aliases,
	},
    devtool: DEV_MODE ? 'eval' : false, // Script source maps
    performance: { hints: DEV_MODE ? false : 'warning' },
    stats: 'normal',
});

const devServerSettings = () => ({
    devServer: {
		contentBase: OPTIONS.output,
		hot: DEV_MODE,
        historyApiFallback: true,
        https: OPTIONS.useHttps,
        headers: OPTIONS.allowCors ? { 'Access-Control-Allow-Origin': '*' } : {},
	},
});

const rulesForScripts = ({ useScriptLoaders, source, output, usePolyfills, babelConfigPath, tsConfigPath }) => !useScriptLoaders ? [] : [
    {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
            configFile: tsConfigPath,
            transpileOnly: true,
            compilerOptions: {
                baseUrl: source,
                outDir: output,
                // module: usePolyfills ? 'commonjs' : 'es6',
            },
        },
    },
    {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [ source, ...OPTIONS.nodeModuleBabelIncludes ],
        options: { configFile: babelConfigPath },
    },
];

const styleLoaders = (useModuleLoaders) => ([
    {
        loader: PluginCSSExtract.loader,
        options: { hot: DEV_MODE },
    },
    {
        loader: 'css-loader',
        options: !useModuleLoaders ? { url: false } : {
            modules: true,
            url: false,
            localsConvention: 'camelCaseOnly',
        },
    },
    {
        loader: 'postcss-loader',
        options: { plugins: [ autoPrefix(), sortQueries() ] },
    },
    {
        loader: 'sass-loader',
        options: {
            implementation: sass,
            prependData: `$env: ${DEV_MODE ? 'dev' : 'prod'};`,
            sassOptions: { fiber: fibers },
        },
    },
])

const rulesForStyles = ({ source, useCssModules, cssGlobalIncludes, cssModuleIncludes }) => useCssModules ? [
    { test: /\.(scss|css)$/, include: cssModuleIncludes, use: styleLoaders(true) },
    { test: /\.(scss|css)$/, include: cssGlobalIncludes, use: styleLoaders(false) },
] : [ { test: /\.(scss|css)$/, include: [ source ], use: styleLoaders(false) } ];

const pluginCopyFiles = (...patterns) => new PluginCopy({ patterns });

const pluginIgnoreOutput = (...filenames) => new PluginIgnoreEmit(filenames);

const pluginForkTypeScriptCheck = (source, eslintConfigPath, tsConfigPath) => new PluginForkTypeScriptCheck({
    eslint: { files: source, options: { configFile: eslintConfigPath, fix: true } },
    typescript: { configFile: tsConfigPath },
})

const pluginLintStyles = stylelintConfigPath => new PluginStyleLint({ configFile: stylelintConfigPath, fix: true, allowEmptyInput: true });

const pluginLintScripts = ({ source, eslintConfigPath, eslintIgnorePath, eslintExcludes }) => new PluginESLint({ fix: true, context: source, cwd: source, configFile: eslintConfigPath, ignorePath: eslintIgnorePath, ignorePattern: eslintExcludes, errorOnUnmatchedPattern: false });

const pluginExtractStyles = cssOutputFile => new PluginCSSExtract({ filename: cssOutputFile, chunkFilename: '[id].css' });

const pluginOptimizeStyles = () => new PluginOptimizeCSS({
    cssProcessorOptions: {
        minimize: !DEV_MODE,
        map: DEV_MODE ? { inline: false, annotation: true } : undefined, // Style source maps
    },
});

const generateConfig = ({
    source,
    entryFile,
    output,
    jsOutputFile,
    cssOutputFile,
    plugins,
    useScriptLoaders,
    useCssModules,
    cssGlobalIncludes,
    cssModuleIncludes,
    usePolyfills,
    useLinting,
    useStyleLinting,
    useScriptLinting,
    eslintConfigPath,
    eslintIgnorePath,
    eslintExcludes,
    stylelintConfigPath,
    babelConfigPath,
    tsConfigPath,
    ignoredOutputFiles,
}) => ({
    ...defineEntry(entryFile, usePolyfills),
    ...defineOutput(output, jsOutputFile),
    ...commonSettings(source),
    ...devServerSettings(output),
    module: {
        rules: [
            ...rulesForScripts({ useScriptLoaders, source, output, usePolyfills, babelConfigPath, tsConfigPath }),
            ...rulesForStyles({ source, useCssModules, cssGlobalIncludes, cssModuleIncludes }),
        ],
    },
    plugins: [
        useStyleLinting && useLinting ? pluginLintStyles(stylelintConfigPath) : () => {},
        useScriptLinting && useLinting ? pluginLintScripts({ source, eslintConfigPath, eslintIgnorePath, eslintExcludes }) : () => {},
        useScriptLoaders ? pluginForkTypeScriptCheck(source, eslintConfigPath, tsConfigPath) : () => {},
        pluginExtractStyles(cssOutputFile),
        pluginOptimizeStyles(),
        fs.existsSync(path.resolve(source, 'index.html')) ? pluginCopyFiles({ from: 'index.html', to: 'index.html' }) : () => {},
        pluginIgnoreOutput(ignoredOutputFiles),
        // new webpack.DefinePlugin({ 'testKey': 'test1' }),
        ...plugins,
    ],
});

const build = ({
    entries,
    aliases = {},
    useHttps = false,
    allowCors = false,
    nodeModuleBabelIncludes = [],
    plugins = [],
    source = null,
    output = null,
    useScriptLoaders = true,
    useCssModules = false,
    cssGlobalIncludes = [],
    cssModuleIncludes = [],
    usePolyfills = false,
    useLinting = true,
    useStyleLinting = true,
    useScriptLinting = true,
    eslintConfigPath = null,
    eslintIgnorePath = null,
    eslintExcludes = [],
    stylelintConfigPath = null,
    tsConfigPath = null,
    babelConfigPath = null,
}) => {
    return (env, argv) => {
        try {
            if (!entries || !Object.values(entries).length
                || Object.values(entries).some(entry => typeof entry !== 'string' && typeof entry !== 'object')
                || Object.values(entries).some(entry => typeof entry !== 'string' && !entry.file)
            ) {
                throw new Error('Invalid entries configuration format.');
            }

            DEV_MODE = argv === undefined || argv.prod === undefined;
            const analyzeMode = argv && argv.analyze !== undefined;
            OPTIONS.set({
                aliases,
                useHttps,
                allowCors,
                nodeModuleBabelIncludes,
                plugins,
                source,
                output,
                useScriptLoaders,
                useCssModules,
                cssGlobalIncludes,
                cssModuleIncludes,
                usePolyfills,
                useLinting,
                useStyleLinting,
                useScriptLinting,
                eslintConfigPath,
                eslintIgnorePath,
                eslintExcludes,
                stylelintConfigPath,
                tsConfigPath,
                babelConfigPath,
            });

            return Object.entries(entries).map(([ entryKey, entryConfig ]) => {
                let {
                    file,
                    jsOutputFile = null,
                    cssOutputFile = null,
                    plugins = [],
                    source = null,
                    output = null,
                    useScriptLoaders = null,
                    useCssModules = null,
                    cssGlobalIncludes = [],
                    cssModuleIncludes = [],
                    usePolyfills = null,
                    useLinting = null,
                    useStyleLinting = null,
                    useScriptLinting = null,
                    eslintConfigPath = null,
                    eslintIgnorePath = null,
                    eslintExcludes = [],
                    stylelintConfigPath = null,
                    tsConfigPath = null,
                    babelConfigPath = null,
                } = entryConfig;

                const options = {};
                options.entryFile = `./${file.replace(RELATIVE_FILE_PATH_REGEX, '')}`;
                const fileExtensionMatches = options.entryFile.match(FILE_EXTENSION_REGEX);
                const fileExtension = fileExtensionMatches[0];

                if (!fileExtensionMatches || !VALID_FILE_EXTENSIONS.includes(fileExtension)) {
                    throw new Error(`Invalid file extension "${fileExtension}" in entry with key ${entryKey}: ${entryConfig}`);
                }
                if (!Array.isArray(plugins)) {
                    throw new Error(`Invalid plugins format in entry with key ${entryKey}:\n\n${JSON.stringify(plugins)}`);
                }

                const isStyleEntryFile = fileExtension === '.scss' || fileExtension === '.css';
                
                options.source = source ? path.resolve(CWD_ABSOLUTE_PATH, source) : OPTIONS.source;
                options.output = output ? path.resolve(CWD_ABSOLUTE_PATH, output) : OPTIONS.output;
                options.jsOutputFile = jsOutputFile ? `${jsOutputFile.replace(FILE_EXTENSION_REGEX, '')}.js` : `${entryKey}.js`;
                options.cssOutputFile = cssOutputFile ? `${cssOutputFile.replace(FILE_EXTENSION_REGEX, '')}.css` : `${entryKey}.css`;
                options.useScriptLoaders = useScriptLoaders !== null ? useScriptLoaders : isStyleEntryFile ? false : OPTIONS.useScriptLoaders;
                options.useCssModules = useCssModules !== null ? useCssModules : OPTIONS.useCssModules;
                options.cssGlobalIncludes = cssGlobalIncludes.length ? cssGlobalIncludes.map(dir => path.resolve(options.source, dir)) : OPTIONS.cssGlobalIncludes;
                options.cssModuleIncludes = cssModuleIncludes.length ? cssModuleIncludes.map(dir => path.resolve(options.source, dir)) : OPTIONS.cssModuleIncludes;
                options.usePolyfills = usePolyfills !== null ? usePolyfills : OPTIONS.usePolyfills;
                options.useLinting = useLinting !== null ? useLinting : OPTIONS.useLinting;
                options.useStyleLinting = useStyleLinting !== null ? useStyleLinting : OPTIONS.useStyleLinting;
                options.useScriptLinting = useScriptLinting !== null ? useScriptLinting : OPTIONS.useScriptLinting;
                options.eslintConfigPath = eslintConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, eslintConfigPath) : OPTIONS.eslintConfigPath;
                options.eslintIgnorePath = eslintIgnorePath ? path.resolve(CWD_ABSOLUTE_PATH, eslintIgnorePath) : OPTIONS.eslintIgnorePath;
                options.eslintExcludes = eslintExcludes.length ? eslintExcludes : OPTIONS.eslintExcludes;
                options.stylelintConfigPath = stylelintConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, stylelintConfigPath) : OPTIONS.stylelintConfigPath;
                options.tsConfigPath = tsConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, tsConfigPath) : OPTIONS.tsConfigPath;
                options.babelConfigPath = babelConfigPath ? path.resolve(CWD_ABSOLUTE_PATH, babelConfigPath) : OPTIONS.babelConfigPath;
                options.ignoredOutputFiles = isStyleEntryFile ? [ options.jsOutputFile ] : [];

                options.plugins = plugins.length ? plugins : OPTIONS.plugins;
                options.plugins = options.plugins.map(plugin => {
                    if (plugin instanceof PluginCopy) {
                        plugin.patterns = plugin.patterns.map(({ from, to }) => ({ from: path.resolve(options.source, from), to: path.resolve(options.output, to) }));
                    }
                    return plugin;
                });

                _validateConfigOptions(entryConfig, options);
                
                return generateConfig(options);
            });
        }
        catch (error) {
            console.error('\n\n\x1b[31m%s\x1b[0m', error, '\n\n');
            process.exit(1);
        }
    }
};

module.exports = {
    defineEntry,
    defineOutput,
    commonSettings,
    devServerSettings,
    rulesForScripts,
    rulesForStyles,
    pluginCopyFiles,
    pluginIgnoreOutput,
    pluginLintStyles,
    pluginExtractStyles,
    pluginOptimizeStyles,
    generateConfig,
    build,
};

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
const PluginStyleLint = require('stylelint-webpack-plugin');
const PluginCSSExtract = require('extract-css-chunks-webpack-plugin');
const PluginOptimizeCSS = require('optimize-css-assets-webpack-plugin');
const PluginIgnoreEmit = require('ignore-emit-webpack-plugin');

// TO DO:
// * fix tsconfig.json include paths (they don't allow configuring a src directory path)
// * allow configuring src/dist directories
// * allow configuring css global/module directories
// * improve error handling and options validation
// * make use of webpack.DefinePlugin for inserting user package name/version
// * allow specifying ts-loader compilerOptions like aliases, target, module (and maybe lib?)
// * add @types devDependencies for convenience? (react, react-dom, etc?)
// * make devServerSettings work with outputDirectory in individual entry configs

let DEV_MODE = true;

const VALID_FILE_EXTENSIONS = [ '.ts', '.tsx', '.js', '.jsx', '.scss', '.css' ];
const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i;
const POLYFILLS_MODULE = 'core-js/stable';
const LIB_PATH = path.resolve('node_modules', pkg.name, 'lib');

const OPTIONS = {
    set (config) {
        const {
            aliases,
            useHttps,
            allowCors,
            nodeModulesToBabel,
            plugins,
            sourceDirectory,
            outputDirectory,
            useCssModules,
            cssGlobalDirectories,
            cssModuleDirectories,
            usePolyfills,
            useLinting,
            eslintConfigPath,
            stylelintConfigPath,
            tsConfigPath,
            babelConfigPath,
        } = config;
        this.sourceDirectory = path.resolve('.', sourceDirectory !== null ? sourceDirectory : 'src');
        this.outputDirectory = path.resolve('.', outputDirectory !== null ? outputDirectory : 'dist');
        this.aliases = (() => {
            const map = {};
            Object.entries(aliases).forEach(([key, value]) => map[key] = path.resolve(this.sourceDirectory, value))
            return map;
        })();
        this.useHttps = useHttps;
        this.allowCors = allowCors;
        this.nodeModulesToBabel = nodeModulesToBabel.map(moduleName => path.resolve('.', 'node_modules', moduleName));
        this.plugins = plugins;
        this.useCssModules = useCssModules;
        this.cssGlobalDirectories = cssGlobalDirectories.length ? cssGlobalDirectories.map(dir => path.resolve(this.sourceDirectory, dir)) : [ path.resolve(this.sourceDirectory, 'styles') ];
        this.cssModuleDirectories = cssModuleDirectories.length ? cssModuleDirectories.map(dir => path.resolve(this.sourceDirectory, dir)) : [ path.resolve(this.sourceDirectory, 'components') ];
        this.usePolyfills = usePolyfills;
        this.useLinting = useLinting;
        this.eslintConfigPath = eslintConfigPath ? path.resolve('.', eslintConfigPath) : path.resolve(LIB_PATH, '.eslintrc');
        this.stylelintConfigPath = stylelintConfigPath ? path.resolve('.', stylelintConfigPath) : path.resolve(LIB_PATH, '.stylelintrc');
        this.tsConfigPath = tsConfigPath ? path.resolve('.', tsConfigPath) : path.resolve(LIB_PATH, 'tsconfig.json');
        this.babelConfigPath = babelConfigPath ? path.resolve('.', babelConfigPath) : path.resolve(LIB_PATH, 'babel.config.js');
        _validateConfigOptions(config, this);
    },
};

const _validateConfigOptions = (raw, gen) => {
    try {
        if (raw.sourceDirectory && !fs.existsSync(gen.sourceDirectory)) {
            throw new Error(`You provided a sourceDirectory option, but no directory exists at ${gen.sourceDirectory}`);
        }
        if (raw.outputDirectory && !fs.existsSync(gen.outputDirectory)) {
            throw new Error(`You provided a outputDirectory option, but no directory exists at ${gen.outputDirectory}`);
        }
        if (raw.cssModuleDirectories && raw.cssModuleDirectories.length && gen.cssModuleDirectories.some(dir => !fs.existsSync(dir))) {
            const missingDir = gen.cssModuleDirectories.find(dir => !fs.existsSync(dir));
            throw new Error(`You provided a cssModuleDirectories option, but no directory exists at ${missingDir}`);
        }
        if (raw.cssGlobalDirectories && raw.cssGlobalDirectories.length && gen.cssGlobalDirectories.some(dir => !fs.existsSync(dir))) {
            const missingDir = gen.cssGlobalDirectories.find(dir => !fs.existsSync(dir));
            throw new Error(`You provided a cssGlobalDirectories option, but no directory exists at ${missingDir}`);
        }
        if (raw.eslintConfigPath && !fs.existsSync(gen.eslintConfigPath)) {
            throw new Error(`You provided a eslintConfigPath option, but no file exists at ${gen.eslintConfigPath}`);
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

const defineOutput = (outputDirectory, scriptOutputFilename) => ({ output: { path: outputDirectory, filename: scriptOutputFilename } });

const commonSettings = sourceDirectory => ({
    mode: DEV_MODE ? 'development' : 'production',
    context: sourceDirectory,
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
		contentBase: OPTIONS.outputDirectory,
		hot: DEV_MODE,
        historyApiFallback: true,
        https: OPTIONS.useHttps,
        headers: OPTIONS.allowCors ? { 'Access-Control-Allow-Origin': '*' } : {},
	},
});

const rulesForScripts = ({ sourceDirectory, outputDirectory, usePolyfills, useLinting, eslintConfigPath, babelConfigPath, tsConfigPath }) => ([
    !useLinting ? {} : {
        test: /\.(tsx?|jsx?)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [ sourceDirectory ],
        options: {
            configFile: eslintConfigPath,
            fix: true,
        },
    },
    {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
            configFile: tsConfigPath,
            transpileOnly: true,
            compilerOptions: {
                baseUrl: sourceDirectory,
                outDir: outputDirectory,
                // module: usePolyfills ? 'commonjs' : 'es6',
            },
        },
    },
    {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [ sourceDirectory, ...OPTIONS.nodeModulesToBabel ],
        options: { configFile: babelConfigPath },
    },
]);

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

const rulesForStyles = ({ sourceDirectory, useCssModules, cssGlobalDirectories, cssModuleDirectories }) => useCssModules ? [
    { test: /\.(scss|css)$/, include: cssModuleDirectories, use: styleLoaders(true) },
    { test: /\.(scss|css)$/, include: cssGlobalDirectories, use: styleLoaders(false) },
] : [ { test: /\.(scss|css)$/, include: [ sourceDirectory ], use: styleLoaders(false) } ];

const pluginCopyFiles = (...pathObjects) => new PluginCopy(pathObjects.map(({ from, to }) => ({ from: path.resolve(OPTIONS.sourceDirectory, from), to: path.resolve(OPTIONS.outputDirectory, to) })), { info: true });

const pluginIgnoreOutput = (...filenames) => new PluginIgnoreEmit(filenames);

const pluginLintStyles = stylelintConfigPath => new PluginStyleLint({ configFile: stylelintConfigPath, fix: true, allowEmptyInput: true });

const pluginExtractStyles = styleOutputFilename => new PluginCSSExtract({ filename: styleOutputFilename, chunkFilename: '[id].css' });

const pluginOptimizeStyles = () => new PluginOptimizeCSS({
    cssProcessorOptions: {
        minimize: !DEV_MODE,
        map: DEV_MODE ? { inline: false, annotation: true } : undefined, // Style source maps
    },
});

const generateConfig = ({
    sourceDirectory,
    entryFile,
    outputDirectory,
    scriptOutputFilename,
    styleOutputFilename,
    plugins,
    useCssModules,
    cssGlobalDirectories,
    cssModuleDirectories,
    usePolyfills,
    useLinting,
    eslintConfigPath,
    stylelintConfigPath,
    babelConfigPath,
    tsConfigPath,
    ignoredOutputFiles,
}) => ({
    ...defineEntry(entryFile, usePolyfills),
    ...defineOutput(outputDirectory, scriptOutputFilename),
    ...commonSettings(sourceDirectory),
    ...devServerSettings(outputDirectory),
    module: {
        rules: [
            ...rulesForScripts({ sourceDirectory, outputDirectory, usePolyfills, useLinting, eslintConfigPath, babelConfigPath, tsConfigPath }),
            ...rulesForStyles({ sourceDirectory, useCssModules, cssGlobalDirectories, cssModuleDirectories }),
        ],
    },
    plugins: [
        useLinting ? pluginLintStyles(stylelintConfigPath) : () => {},
        pluginExtractStyles(styleOutputFilename),
        pluginOptimizeStyles(),
        fs.existsSync(path.resolve(sourceDirectory, 'index.html')) ? pluginCopyFiles({ from: 'index.html', to: 'index.html' }) : () => {},
        pluginIgnoreOutput(ignoredOutputFiles),
        // new webpack.DefinePlugin({ 'testKey': 'test1' }),
        ...plugins,
    ],
});

const build = ({
    argv,
    entries,
    aliases = {},
    useHttps = true,
    allowCors = false,
    nodeModulesToBabel = [],
    env,
    plugins = [],
    sourceDirectory = null,
    outputDirectory = null,
    useCssModules = false,
    cssGlobalDirectories = [],
    cssModuleDirectories = [],
    usePolyfills = false,
    useLinting = true,
    eslintConfigPath = null,
    stylelintConfigPath = null,
    tsConfigPath = null,
    babelConfigPath = null,
}) => {
    try {
        if (!entries || !Object.values(entries).length
            || Object.values(entries).some(entry => typeof entry !== 'string' && typeof entry !== 'object')
            || Object.values(entries).some(entry => typeof entry !== 'string' && !entry.file)
        ) {
            throw new Error('Invalid entries configuration format.');
        }
        if (env) {
            throw new Error('You passed the env prop to tarot.build. Did you mean to pass argv?')
        }

        DEV_MODE = argv === undefined || argv.prod === undefined;
        const analyzeMode = argv && argv.analyze !== undefined;
        OPTIONS.set({
            aliases,
            useHttps,
            allowCors,
            nodeModulesToBabel,
            plugins,
            sourceDirectory,
            outputDirectory,
            useCssModules,
            cssGlobalDirectories,
            cssModuleDirectories,
            usePolyfills,
            useLinting,
            eslintConfigPath,
            stylelintConfigPath,
            tsConfigPath,
            babelConfigPath,
        });

        return Object.entries(entries).map(([ entryKey, entryConfig ]) => {
            let {
                file,
                scriptOutputFilename = null,
                styleOutputFilename = null,
                plugins = [],
                sourceDirectory = null,
                outputDirectory = null,
                useCssModules = null,
                cssGlobalDirectories = [],
                cssModuleDirectories = [],
                usePolyfills = null,
                useLinting = null,
                eslintConfigPath = null,
                stylelintConfigPath = null,
                tsConfigPath = null,
                babelConfigPath = null,
            } = entryConfig;

            const options = {};
            options.entryFile = `./${file.replace(/^(\.\/|\.\\)/, '')}`;
            const fileExtensionMatches = options.entryFile.match(FILE_EXTENSION_REGEX);
            const fileExtension = fileExtensionMatches[0];

            if (!fileExtensionMatches || !VALID_FILE_EXTENSIONS.includes(fileExtension)) {
                throw new Error(`Invalid file extension "${fileExtension}" in entry with key ${entryKey}: ${entryConfig}`);
            }
            if (!Array.isArray(plugins)) {
                throw new Error(`Invalid plugins format in entry with key ${entryKey}:\n\n${JSON.stringify(plugins)}`);
            }
            
            options.sourceDirectory = sourceDirectory ? path.resolve('.', sourceDirectory) : OPTIONS.sourceDirectory;
            options.outputDirectory = outputDirectory ? path.resolve('.', outputDirectory) : OPTIONS.outputDirectory;
            options.scriptOutputFilename = scriptOutputFilename ? `${scriptOutputFilename.replace(FILE_EXTENSION_REGEX, '')}.js` : `${entryKey}.js`;
            options.styleOutputFilename = styleOutputFilename ? `${styleOutputFilename.replace(FILE_EXTENSION_REGEX, '')}.css` : `${entryKey}.css`;
            options.plugins = plugins.length ? plugins : OPTIONS.plugins;
            options.useCssModules = useCssModules !== null ? useCssModules : OPTIONS.useCssModules;
            options.cssGlobalDirectories = cssGlobalDirectories.length ? cssGlobalDirectories.map(dir => path.resolve(sourceDirectory, dir)) : OPTIONS.cssGlobalDirectories;
            options.cssModuleDirectories = cssModuleDirectories.length ? cssModuleDirectories.map(dir => path.resolve(sourceDirectory, dir)) : OPTIONS.cssModuleDirectories;
            options.usePolyfills = usePolyfills !== null ? usePolyfills : OPTIONS.usePolyfills;
            options.useLinting = useLinting !== null ? useLinting : OPTIONS.useLinting;
            options.eslintConfigPath = eslintConfigPath ? path.resolve('.', eslintConfigPath) : OPTIONS.eslintConfigPath;
            options.stylelintConfigPath = stylelintConfigPath ? path.resolve('.', stylelintConfigPath) : OPTIONS.stylelintConfigPath;
            options.tsConfigPath = tsConfigPath ? path.resolve('.', tsConfigPath) : OPTIONS.tsConfigPath;
            options.babelConfigPath = babelConfigPath ? path.resolve('.', babelConfigPath) : OPTIONS.babelConfigPath;
            const isStyleEntryFile = fileExtension === '.scss' || fileExtension === '.css';
            options.ignoredOutputFiles = isStyleEntryFile ? [ options.scriptOutputFilename ] : [];

            _validateConfigOptions(entryConfig, options);
            
            return generateConfig(options);
        });
    }
    catch (error) {
        console.error('\n\n\x1b[31m%s\x1b[0m', error, '\n\n');
        process.exit(1);
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

# Tarot

🔮 Bleeding edge web architecture

Webpack configuration for TS, JS, SCSS, and React with ESNext and optional CSS modules, JS polyfills, and IE11 support
<br><br>


### Objectives

&nbsp;&nbsp;&nbsp;&nbsp;🌈 Excellent dev experience<br>
&nbsp;&nbsp;&nbsp;&nbsp;🚀 Powerful build tools<br>
&nbsp;&nbsp;&nbsp;&nbsp;🏛 Standardized architecture<br>
<br>


#### Features

Optional and configurable support for:

* TypeScript and ESNext
* React
* SCSS and CSS Modules
* JS polyfills and IE11 support
* Linting
* Prettification
* Dev server
* Production builds
* Git hooks via husky
* Style entry files
<br>


#### Simplicity

Tarot exports a `build` function, which takes care of configuring Webpack for you. Build, bundle, lint, and polyfill with dead simple config:

```js
// webpack.config.js
const { build } = require('tarot')

module.exports = build({
  entries: {
    bundle: { file: 'index.js' },
  },
})
```
<br>


#### Flexibility

Generate multiple output files, change input and output directories, turn on CSS Modules or polyfilling, provide your own transpile or lint settings, tweak dev server config, and add Webpack plugins with minimal configuration.

```js
// webpack.config.js
const { build, pluginCopyFiles } = require('tarot')

module.exports = build({
  source: 'src',
  output: 'dist',
  entries: {
    bundle: {
      file: 'index.tsx',
      scriptOutputFile: `bundle_${Date.now()}`,
      styleOutputFile: 'styles',
      usePolyfills: false,
      useStyleLinting: false,
      useCssModules: true,
      tsConfigPath: 'tsconfig.json',
      babelConfigPath: 'babel.config.js',
    },
    'vendor/styles': {
      file: 'vendor.scss',
      useScriptLoaders: true,
      stylelintConfigPath: '.stylelintrc'
    },
  },
  plugins: [
    pluginCopyFiles({ from: 'assets', to: 'assets' })
  ],
  useHttps: true,
  allowCors: true,
  aliases: {
    react-dom: '@hot-loader/react-dom',
    Components: 'src/components',
  },
  nodeModuleBabelIncludes: [ 'react-spring' ],
})
```
<br>


### CLI

You can run tarot via the CLI with the following commands:

* **`tarot dev`** - launch the local development server and watch for changes

* **`tarot build`** - build every application entry in the webpack config with dev env settings

* **`tarot prod`** - build every application entry in the webpack config with production env settings


Note that Tarot does not clean up your output directory on each consecutive build.
<br><br>

#### Package.json

This is a basic `package.json` for a project using Tarot. The `dev`, `build`, and `prod` scripts in the example below are equivalent to running the same script via the Tarot CLI. The Tarot node module is the only module required in `devDependencies`:

```jsonc
  "scripts": {
    "dev": "webpack-dev-server --open",
    "clean": "rimraf ./dist/",
    "build": "npm run clean && webpack",
    "prod": "npm run build -- --prod"
  },
  "devDependencies": {
    "tarot": "latest"
  }
```
<br>


### Options

Tarot has sensible defaults to encourage standardized architecture. However it is possible to tweak every aspect of the build process. All options are listed under the API section of the readme.
<br><br>


#### Build Options

"Build Options" are only available at the top level of the object passed to Tarot's `build` function. Only the `entries` object is required.


```js
// webpack.config.js
const { build } = require('tarot')

module.exports = build({
  // You can put Build Options here
  useHttps: true,
  allowCors: false,
  entries: {
    bundle: { file: 'index.js' },
  },
})
```
<br>

* **`entries`** - Required. An object which contains all entry files. Entries are identified by keys. When Tarot builds the entries, the output files will be named according to that entry's key by default. Entries can be individually configured, including the output file names.

* **`aliases`** - A [Webpack alias object](https://webpack.js.org/configuration/resolve/#resolvealias).

* **`useHttps`** - Whether to use HTTPS with `webpack-dev-server`, defaults to false.

* **`allowCors`** - Whether to allows CORS with `webpack-dev-server`, defaults to false.

* **`nodeModuleBabelIncludes`** - Package names from `node_modules` to include in `babel-loader`'s module resolution, defaults to empty.
<br>


#### Entry Options

"Entry Options" are only available in individual entries. Only the `file` option is required.

```js
// webpack.config.js
const { build } = require('tarot')

module.exports = build({
  entries: {
    bundle: {
      file: 'index.js',
      // You can put Entry Options here
    },
  },
})
```
<br>

* **`file`** - Required. The path to an entry file relative to `source`.

* **`scriptOutputFile`** - Provide a name for the output JavaScript bundle file, defaults to the key for this entry.

* **`styleOutputFile`** - Provide a name for the output CSS bundle file, defaults to the key for this entry.
<br>


#### Common Options

"Common Options" are available at the top level of the object passed to Tarot's `build` function, as well as in each individual entry. All Common Options are optional.

Options placed at the top level will be applied as the default to every entry. Options placed in each entry will only apply to that entry, and will override top-level options.

```js
// webpack.config.js
const { build } = require('tarot')

module.exports = build({
  // You can put Common Options here
  entries: {
    bundle: {
      file: 'index.js',
      // And also here
    },
  },
})
```
<br>

* **`source`** - The source directory in which to resolve files.

* **`output`** - The output directory where built files will reside.

* **`plugins`** - An array of [Webpack plugins](https://webpack.js.org/concepts/plugins/).

* **`useScriptLoaders`** - Whether to use `babel-loader` and `ts-loader`, defaults to true unless the entry file is not ECMAScript (i.e. a SCSS entry file).

* **`styleIncludes`** - An array of directories relative to `source`, to be compiled as standard stylesheets, defaults to `'styles/'`.

* **`cssModuleIncludes`** - An array of directories relative to `source`, to be compiled as CSS Modules, defaults to `'components/'`.

* **`useCssModules`** - Whether to build CSS Modules, defaults to false. When true, files in `cssModuleIncludes` directories will be treated as CSS Modules (but not files in `styleIncludes`).

* **`usePolyfills`** - Whether to use `core-js` polyfills, defaults to false.

* **`useLinting`** - Whether to use any kind of linting, defaults to true.

* **`useStyleLinting`** - Whether to lint styles, defaults to true.

* **`useScriptLinting`** - Whether to lint scripts, defaults to true.

* **`eslintConfigPath`** - Provide a path to a custom eslint config relative to the cwd, defaults to Tarot's internal eslint config.

* **`eslintIgnorePath`** - Provide a path to a custom eslint ignore config relative to the cwd, defaults to Tarot's internal eslint ignore config.

* **`eslintExcludes`** - An array of directories to be passed to [eslint's `ignorePatterns` option](https://eslint.org/docs/user-guide/configuring#ignorepatterns-in-config-files) (paths are resolved according to eslint's `ignorePatterns` rules).

* **`stylelintConfigPath`** - Provide a path to a custom stylelint config relative to the cwd, defaults to Tarot's internal stylelint config.

* **`tsConfigPath`** - Provide a path to a custom tsconfig relative to the cwd, defaults to Tarot's internal tsconfig.

* **`babelConfigPath`** - Provide a path to a custom babel config relative to the cwd, defaults to Tarot's internal babel config.
<br>


### Plugins

Tarot exports a couple plugins for your convenience. Tarot also uses several other plugins internally that aren't exported, for tasks like linting and typechecking. Plugins are passed directly to Webpack, so you are not limited to using Tarot's plugins - any valid Webpack plugin should work.
<br>

* **`pluginCopyFiles`** - Copy files or directories from one location to another. Accepts an unlimited number of arguments, where each argument is an object in the shape `{ from: 'vendor', to: 'vendor' }`. The `from` path is relative to `source`, while the `to` path is relative to `output`.

```js
pluginCopyFiles(
  // Copy files from `images/` in `source`, to `assets/images/` in `output`
  { from: 'images', to: 'assets/images' },
  // Copy a file from `source` to `output`, and rename it
  { from: 'test.html', to: `test_${Date.now}.html` },
)
```

* **`pluginIgnoreOutput`** - Prevent Webpack from emitting files with names that match a pattern. Accepts a string, RegExp, or an array of strings and/or RegExp to match filenames against.

```js
pluginIgnoreOutput([
  'styles.css',
  /^bundle\.js/
])
```
<br>


### API

This is the type signature of the API, where Tarot's build function will return a complete Webpack configuration:

```typescript
type CommonOptions = {
    source?: string
    output?: string
    plugins?: Function[]
    useScriptLoaders?: boolean
    useCssModules?: boolean
    styleIncludes?: string[]
    cssModuleIncludes?: string[]
    usePolyfills?: boolean
    useLinting?: boolean
    useStyleLinting?: boolean
    useScriptLinting?: boolean
    eslintConfigPath?: string
    eslintIgnorePath?: string
    eslintExcludes?: string[]
    stylelintConfigPath?: string
    tsConfigPath?: string
    babelConfigPath?: string
}

type EntryOptions = CommonOptions & {
    file: string
    scriptOutputFile?: string
    styleOutputFile?: string
}

// Values from CommonOptions that are specified
// here will be used as the default value for all
// entries. Individual entries can override options.
type BuildOptions = CommonOptions & {
    entries: { [key: string]: EntryOptions }
    aliases?: { [key: string]: string }
    useHttps?: boolean
    allowCors?: boolean
    nodeModuleBabelIncludes?: string[]
}

export const build = (options: BuildOptions) => WebpackConfig

export const pluginCopyFiles = (...patterns: { from: string, to: string }[]) => void

export const pluginIgnoreOutput = (...filenames: string[]) => void
```
<br>

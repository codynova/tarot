# Tarot

🔮 Bleeding edge web architecture

Webpack configuration for TS, JS, SCSS, and React with ESNext and optional CSS modules, JS polyfills, and IE11 support

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
    bundle: { file: 'index.js' },
    'vendor/styles': { file: 'vendor.scss' },
  },
  plugins: [
    pluginCopyFiles({ from: 'assets', to: 'assets' })
  ]
})
```
<br>


#### CLI

You can run tarot via the CLI with the following commands:

* `tarot dev` - launch the local development server and watch for changes
* `tarot build` - build every application entry in the webpack config with dev env settings
* `tarot prod` - build every application entry in the webpack config with production env settings

Note that Tarot does not clean up your output directory on each consecutive build.


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


### API

This is the type signature of the API, where Tarot's build function will return a complete Webpack configuration:

```typescript
type CommonOptions = {
    source?: string
    output?: string
    plugins?: Function[]
    useCssModules?: boolean
    cssGlobalIncludes?: string[]
    cssModuleIncludes?: string[]
    usePolyfills?: boolean
    useLinting?: boolean
    eslintConfigPath?: string
    eslintIgnorePath?: string
    eslintExcludes?: string[]
    stylelintConfigPath?: string
    prettierConfigPath?: string
    tsConfigPath?: string
    babelConfigPath?: string
}

type EntryOptions = CommonOptions & {
    file: string
    jsOutputFile?: string
    cssOutputFile?: string
}

// Values from CommonOptions that are specified
// here will be used as the default value for all
// entries. Individual entries can override options.
type BuildOptions = CommonOptions & {
    argv?: { prod?: boolean, analyze?: boolean } // Pass arguments from the CLI
    entries: { [key: string]: EntryOptions }
    aliases?: { [key: string]: string }
    useHttps?: boolean
    allowCors?: boolean
    nodeModuleBabelIncludes?: string[]
}

export const build = (options: BuildOptions) => WebpackConfig
```
<br>


### Options

Tarot has sensible defaults to encourage standardized architecture. However it is possible to tweak every aspect of the build process. All options are listed under the API section of the readme.
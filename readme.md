# Tarot

🔮 Bleeding edge web build processes, without the headache

Webpack configuration for TS, JS, SCSS, and React with ESNext and optional CSS modules + IE11 support

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
* IE11 with polyfills
* Linting
* Dev server
* Production builds
<br>


#### Simplicity

Tarot exports a `build` function, which takes care of configuring Webpack for you. Build, bundle, lint, and polyfill with dead simple config:

```js
// webpack.config.js
const { build } = require('tarot')

module.exports = (env, argv) => build({
  argv,
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

module.exports = (env, argv) => build({
  argv,
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


### API

This is the type signature of the API, where `TopLevelOptions` is the type of the config object that is passed into Tarot's `build` function:

```typescript
type CommonOptions = {
    source?: string
    output?: string
    plugins?: function[]
    useCssModules?: boolean
    cssGlobalDirectories?: string[]
    cssModuleDirectories?: string[]
    usePolyfills?: boolean
    useLinting?: boolean
    eslintConfigPath?: string
    stylelintConfigPath?: string
    tsConfigPath?: string
    babelConfigPath?: string
}

type EntryOptions = CommonOptions & {
    file: string
    jsOutputFile?: string
    cssOutputFile?: string
}

type TopLevelOptions = CommonOptions & {
    argv?: { prod?: boolean, analyze?: boolean }
    entries: { [key: string]: EntryOptions }
    aliases?: { [key: string]: string }
    useHttps?: boolean
    allowCors?: boolean
    nodeModulesToBabel?: string[]
}
```
<br>


### Options

Tarot has sensible defaults to encourage standardized architecture. However it is possible to tweak every aspect of the build process.

You are only required to provide an `entries` object. However it is strongly encouraged to also pass the `argv` object so Tarot can differentiate between build environments.
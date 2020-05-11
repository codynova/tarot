# tarot

🔮 Discover the secret of build process abstraction

Webpack configuration for TS, JS, SCSS, and React with ESNext and optional CSS modules + IE11 support

### Objectives

&nbsp;&nbsp;&nbsp;&nbsp;🌈 Excellent dev experience<br>
&nbsp;&nbsp;&nbsp;&nbsp;🚀 Powerful tooling<br>
&nbsp;&nbsp;&nbsp;&nbsp;🏛 Standardized architecture<br>
<br>

#### Simplicity

Provides cutting edge build, bundle, and polyfill capabilities with dead simple config:

```js
const { build } = require('tarot')

module.exports = (env, argv) => build({
  argv,
  entries: {
    bundle: { file: 'index.js' },
  },
})
```

#### Flexibility

Generate multiple output files with ease. Change input and output directories, turn on CSS Modules or polyfilling, provide your own transpile or lint settings, tweak dev server config, and add Webpack plugins with minimal configuration.

```js
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


### Options

```typescript
type SharedOptions = {
    plugins?: function[]
    sourceDirectory?: string
    outputDirectory?: string
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

type EntryOptions = SharedOptions & {
    file: string
    scriptOutputFilename?: string
    styleOutputFilename?: string
}

type GlobalOptions = SharedOptions & {
    argv?: { prod?: boolean, analyze?: boolean }
    entries: { [key: string]: EntryOptions }
    aliases?: { [key: string]: string }
    useHttps?: boolean
    allowCors?: boolean
    nodeModulesToBabel?: string[]
}
```
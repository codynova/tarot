# tarot

🔮 Discover the secret of build process abstraction

Webpack configuration for TS, JS, SCSS, and React with ESNext and optional CSS modules + IE11 support


## Options

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
#!/usr/bin/env node

const { exec } = require('child_process')
const command = process.argv[2]

const logError = (message) => console.error('\n\x1b[31mERROR: %s\x1b[0m\n', message)

let script = ''

switch (command) {
    case 'dev': {
        script = 'webpack-dev-server --open'
    }
    case 'build': {
        script = 'webpack'
    }
    case 'prod': {
        script = 'webpack --prod'
    }
    default: {
        if (!command) logError('No command was passed to tarot CLI')
        else logError('An unrecognized command was passed to tarot CLI: ', command)
        process.exit(1)
    }
}

exec(script)
process.exit(0)
#!/usr/bin/env node

const { spawn } = require('child_process')
const command = process.argv[2]

const logError = (message) => console.error('\n\x1b[31mERROR: %s\x1b[0m\n', message)

let script = ''

switch (command) {
    case 'dev': {
        script = 'webpack-dev-server --open'
        break
    }
    case 'build': {
        script = 'webpack'
        break
    }
    case 'prod': {
        script = 'webpack --prod'
        break
    }
    default: {
        if (!command) logError('No command was passed to tarot CLI')
        else logError('An unrecognized command was passed to tarot CLI: ', command)
        process.exit(1)
    }
}

const words = script.split(' ')

const child = spawn(words.shift(), words, { shell: true, cwd: process.cwd() })

child.on('error', (error) => {
    console.error('Error spawning new storybookProcess: ', error)
    process.exit(1)
})

child.stdout.on('data', (data) => {
    console.log('stdout: ', data.toString('utf-8'))
})

child.stderr.on('data', (data) => {
    console.log('stderr: ', data.toString('utf-8'))
})

child.on('close', (code) => {
    console.log('child process exited with code ' + code)
    process.exit(0)
})

process.on('close', (code) => {
    console.log('parent process exited with code ' + code)
    child.kill()
    process.exit(0)
})
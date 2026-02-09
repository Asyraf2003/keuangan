import { readFileSync, writeFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const v = pkg.version || '0.0.0'
writeFileSync('.env', `VITE_APP_VERSION=${v}\n`, 'utf8')
console.log('Wrote .env with VITE_APP_VERSION=', v)

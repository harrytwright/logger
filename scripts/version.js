const npmVersion = require('child_process').spawnSync('npm', ['--version']).stdout.toString().trim()

if (require('semver').satisfies(npmVersion, '>=7.x')) return console.log('TRUE')
console.log('FALSE')

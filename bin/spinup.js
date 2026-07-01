#!/usr/bin/env node

const { parseArgs } = require('util');
const { version } = require('../package.json');

const { values } = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    'dry-run': { type: 'boolean' },
    agent: { type: 'string', short: 'a' },
  },
  strict: false,
});

if (values.help) {
  console.log(`
  spinup v${version}

  One command to install and configure Claude Code or OpenCode
  with MCP servers, skills, and model providers.

  Usage:
    npx spinup [options]

  Options:
    -h, --help       Show this help message
    -v, --version    Show version number
    -a, --agent      Specify agent (claude or opencode)
    --dry-run        Preview what would be installed

  Examples:
    npx spinup
    npx spinup --agent claude
    npx spinup --dry-run
  `);
  process.exit(0);
}

if (values.version) {
  console.log(version);
  process.exit(0);
}

require('../src/index.js')({
  dryRun: values['dry-run'] || false,
  agent: values.agent || null,
});

#!/usr/bin/env node
/**
 * SANDBOXED test runner for spinup.
 * 
 * Overrides os.homedir() so ALL config paths resolve inside ./test-sandbox/
 * Nothing touches your real ~/.claude/, ~/.config/opencode/, or ~/.spinup/
 * 
 * Usage:
 *   node test-sandbox.js                  # full interactive test
 *   node test-sandbox.js --dry-run        # preview only
 *   node test-sandbox.js --agent claude   # skip agent prompt
 *   rm -rf test-sandbox                   # clean up when done
 */

const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const SANDBOX = path.join(__dirname, 'test-sandbox');

// CLEAN SLATE: remove previous test run
fs.removeSync(SANDBOX);
fs.ensureDirSync(SANDBOX);

// OVERRIDE homedir BEFORE anything else loads
const realHomedir = os.homedir;
os.homedir = () => SANDBOX;

// Also override HOME/USERPROFILE env vars for child processes
process.env.HOME = SANDBOX;
process.env.USERPROFILE = SANDBOX;

console.log('');
console.log('\x1b[1m\x1b[36m  ╔══════════════════════════════════════════╗');
console.log('  ║   SANDBOX MODE — nothing leaves this    ║');
console.log('  ║   folder. Safe to test everything.       ║');
console.log('  ╚══════════════════════════════════════════╝\x1b[0m');
console.log('');
console.log(`  Sandbox: ${SANDBOX}`);
console.log(`  Real home: ${realHomedir()}`);
console.log('');

// Show what WILL be created
console.log('  Config paths (all inside sandbox):');
console.log(`    Claude:    ${path.join(SANDBOX, '.claude', 'settings.json')}`);
console.log(`    OpenCode:  ${path.join(SANDBOX, '.config', 'opencode', 'opencode.json')}`);
console.log(`    API keys:  ${path.join(SANDBOX, '.spinup', '.env')}`);
console.log('');

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const agentIdx = args.indexOf('--agent');
const agent = agentIdx !== -1 ? args[agentIdx + 1] : null;

if (dryRun) console.log('  \x1b[33mDRY RUN — no files will be written\x1b[0m\n');

// Run spinup with sandboxed paths
require('./src/index.js')({
  dryRun,
  agent,
}).then(() => {
  console.log('\n\x1b[1m--- SANDBOX CONTENTS ---\x1b[0m');
  try {
    const files = [];
    const walk = (dir, prefix = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(full, rel);
        } else {
          const stat = fs.statSync(full);
          files.push(`  ${rel} (${stat.size} bytes)`);
        }
      }
    };
    walk(SANDBOX);
    if (files.length === 0) {
      console.log('  (empty — dry run or no configs generated)');
    } else {
      files.forEach(f => console.log(f));
    }
  } catch (e) {
    console.log('  (could not list sandbox contents)');
  }
  console.log(`\n  Clean up: rm -rf ${SANDBOX}\n`);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

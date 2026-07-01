#!/usr/bin/env node
/**
 * SANDBOXED test runner for spinup.
 * 
 * Overrides os.homedir() so ALL config paths resolve inside ./test-sandbox/
 * Nothing touches your real ~/.claude/, ~/.config/opencode/, or ~/.spinup/
 * 
 * Usage (from project root):
 *   node test-sandbox.js                  # full interactive test
 *   node test-sandbox.js --dry-run        # preview only
 *   node test-sandbox.js --agent claude   # skip agent prompt
 *   Remove-Item -Recurse -Force test-sandbox   # clean up (Windows)
 */

const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const PROJECT_ROOT = __dirname;
const SANDBOX = path.join(PROJECT_ROOT, 'test-sandbox');

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
console.log('  All configs write to test-sandbox/ inside this project.');
console.log('  Your real ~/.claude/ and ~/.config/opencode/ are NOT touched.');
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
  console.log('');
  console.log('\x1b[1m--- WHAT WAS GENERATED ---\x1b[0m');
  console.log('');
  try {
    const files = [];
    const walk = (dir, prefix = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = prefix ? `${prefix}\\${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(full, rel);
        } else {
          const stat = fs.statSync(full);
          files.push({ rel, full, size: stat.size });
        }
      }
    };
    walk(SANDBOX);
    if (files.length === 0) {
      console.log('  (empty — dry run or no configs generated)');
    } else {
      for (const f of files) {
        console.log(`  test-sandbox\\${f.rel}  (${f.size} bytes)`);
      }
      console.log('');
      console.log('  View contents:');
      for (const f of files) {
        console.log(`    type test-sandbox\\${f.rel}`);
      }
    }
  } catch (e) {
    console.log('  (could not list sandbox contents)');
  }
  console.log('');
  console.log('  Clean up:  Remove-Item -Recurse -Force test-sandbox');
  console.log('');
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

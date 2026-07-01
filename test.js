#!/usr/bin/env node
/**
 * Non-interactive test script for spinup.
 * Exercises the full flow without user input.
 * Writes test output to ./test-output/ — NOT to your real config.
 */

const fs = require('fs-extra');
const path = require('path');
const { fetchModels, fetchModelsFromDev, parseModelsDev } = require('./src/utils/models');
const { generateClaudeConfig, generateClaudeMcpJson } = require('./src/config/claude');
const { generateOpenCodeConfig } = require('./src/config/opencode');
const serversData = require('./src/mcp/servers.json');

const TEST_DIR = path.join(__dirname, 'test-output');

// Override config paths to use test directory
const os = require('os');
const origHomedir = os.homedir;

let step = 0;
const pass = (msg) => console.log(`  \x1b[32m✔\x1b[0m [${++step}] ${msg}`);
const fail = (msg) => console.log(`  \x1b[31m✖\x1b[0m [${++step}] ${msg}`);
const info = (msg) => console.log(`  ℹ ${msg}`);

async function testModelsDev() {
  console.log('\n--- Test: Models.dev API ---');
  try {
    const data = await fetchModelsFromDev();
    const keys = Object.keys(data);
    info(`Models.dev returned ${keys.length} models`);

    // Check specific models exist
    const expected = [
      ['openai', 'gpt-5.5'],
      ['anthropic', 'claude-opus-4-8'],
      ['google', 'gemini-3.5-flash'],
      ['nvidia', 'nvidia/nemotron-3-super-120b-a12b'],
      ['deepseek', 'deepseek-v4-flash'],
    ];
    for (const [provider, modelId] of expected) {
      const providerData = data[provider];
      if (providerData?.models?.[modelId]) {
        const m = providerData.models[modelId];
        pass(`${provider}/${modelId} found (ctx: ${m.limit?.context}, price: $${m.cost?.input}/$${m.cost?.output})`);
      } else {
        fail(`${provider}/${modelId} NOT found`);
      }
    }
    return data;
  } catch (e) {
    fail(`Models.dev API: ${e.message}`);
    return null;
  }
}

async function testParseModels(devData) {
  console.log('\n--- Test: Parse Models.dev for each provider ---');
  const providers = ['openai', 'anthropic', 'google', 'groq', 'nvidia', 'deepseek', 'together'];
  for (const p of providers) {
    const models = parseModelsDev(devData, p);
    if (models.length > 0) {
      pass(`${p}: ${models.length} models (first: ${models[0].id}, ctx: ${models[0].contextLength}, reasoning: ${models[0].capabilities?.reasoning})`);
    } else {
      fail(`${p}: 0 models parsed`);
    }
  }
}

async function testMcpPresets() {
  console.log('\n--- Test: MCP Presets ---');
  const presets = serversData.presets;
  for (const [id, preset] of Object.entries(presets)) {
    if (preset.name && preset.servers && preset.servers.length > 0) {
      pass(`${id}: "${preset.name}" — ${preset.servers.length} servers`);
    } else {
      fail(`${id}: missing name or servers`);
    }
  }

  // Verify each preset server ID exists in the server list
  const allServerIds = new Set();
  for (const category of Object.values(serversData.servers)) {
    for (const s of category) allServerIds.add(s.id);
  }

  for (const [id, preset] of Object.entries(presets)) {
    for (const serverId of preset.servers) {
      if (!allServerIds.has(serverId)) {
        fail(`Preset "${id}" references unknown server: ${serverId}`);
      }
    }
  }
  pass('All preset server IDs valid');
}

async function testMcpServerConfigs() {
  console.log('\n--- Test: MCP Server Configs ---');
  let allValid = true;
  for (const [category, servers] of Object.entries(serversData.servers)) {
    for (const server of servers) {
      if (!server.claude?.command || !server.claude?.args) {
        fail(`${server.id}: missing claude config`);
        allValid = false;
      }
      if (!server.opencode?.command || !server.opencode?.args) {
        fail(`${server.id}: missing opencode config`);
        allValid = false;
      }
    }
  }
  if (allValid) pass('All servers have claude + opencode configs');
}

async function testClaudeConfig() {
  console.log('\n--- Test: Claude Code Config Generation ---');
  await fs.ensureDir(TEST_DIR);

  // Mock selections
  const selections = {
    mcpServers: serversData.presets.recommended.servers.map(id => {
      for (const cat of Object.values(serversData.servers)) {
        const s = cat.find(x => x.id === id);
        if (s) return s;
      }
    }).filter(Boolean),
    selectedModels: [],
    apiKey: 'sk-test-fake-key',
  };

  // Temporarily override the config path
  const origGetConfigPaths = require('./src/utils/detect').getConfigPaths;
  const detect = require('./src/utils/detect');
  const origFunc = detect.getConfigPaths;
  detect.getConfigPaths = () => ({
    claude: {
      settings: path.join(TEST_DIR, 'claude-settings.json'),
      mcp: path.join(TEST_DIR, 'claude-mcp.json'),
      projects: path.join(TEST_DIR, 'claude-projects'),
    },
    opencode: {
      global: path.join(TEST_DIR, 'opencode.json'),
      auth: path.join(TEST_DIR, 'auth.json'),
      agents: path.join(TEST_DIR, 'agents'),
      skills: path.join(TEST_DIR, 'skills'),
    },
    spinup: {
      root: TEST_DIR,
      env: path.join(TEST_DIR, '.env'),
      config: path.join(TEST_DIR, 'config.json'),
    },
  });

  try {
    const result = await generateClaudeConfig(selections);
    pass(`Generated: ${result.settingsPath}`);
    pass(`MCP servers: ${result.mcpServers.join(', ')}`);

    // Verify file contents
    const content = await fs.readJson(result.settingsPath);
    if (content.permissions?.allow?.includes('Bash(*)')) {
      pass('permissions.allow includes Bash(*)');
    } else {
      fail('permissions.allow missing Bash(*)');
    }
    if (content.mcpServers && Object.keys(content.mcpServers).length > 0) {
      pass(`mcpServers has ${Object.keys(content.mcpServers).length} entries`);
    } else {
      fail('mcpServers is empty');
    }
    if (content.env?.ANTHROPIC_API_KEY === 'sk-test-fake-key') {
      pass('API key stored in settings.json env');
    } else {
      fail('API key not in settings.json env');
    }
  } catch (e) {
    fail(`Claude config: ${e.message}`);
  }

  detect.getConfigPaths = origFunc;
}

async function testOpenCodeConfig() {
  console.log('\n--- Test: OpenCode Config Generation ---');

  const detect = require('./src/utils/detect');
  const origFunc = detect.getConfigPaths;
  detect.getConfigPaths = () => ({
    claude: { settings: path.join(TEST_DIR, 'claude-settings.json'), mcp: '', projects: '' },
    opencode: { global: path.join(TEST_DIR, 'opencode.json'), auth: '', agents: '', skills: '' },
    spinup: { root: TEST_DIR, env: path.join(TEST_DIR, '.env'), config: '' },
  });

  const selections = {
    mcpServers: serversData.presets.minimal.servers.map(id => {
      for (const cat of Object.values(serversData.servers)) {
        const s = cat.find(x => x.id === id);
        if (s) return s;
      }
    }).filter(Boolean),
    selectedProviders: [
      { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', npm: '@ai-sdk/openai-compatible', envVar: 'OPENROUTER_API_KEY', apiKey: 'sk-or-test' },
    ],
    primaryModel: 'openrouter/openai/gpt-5.5',
  };

  try {
    const result = await generateOpenCodeConfig(selections);
    pass(`Generated: ${result.configPath}`);
    pass(`Providers: ${result.providers.join(', ')}`);
    pass(`MCP servers: ${result.mcpServers.join(', ')}`);

    // Verify file contents
    const content = await fs.readJson(result.configPath);
    if (content.$schema === 'https://opencode.ai/config.json') {
      pass('$schema present');
    } else {
      fail('$schema missing');
    }
    if (content.model === 'openrouter/openai/gpt-5.5') {
      pass('primary model set correctly');
    } else {
      fail(`primary model wrong: ${content.model}`);
    }
    if (content.provider?.openrouter?.npm === '@ai-sdk/openai-compatible') {
      pass('OpenCode provider config correct');
    } else {
      fail('OpenCode provider config missing/wrong');
    }
  } catch (e) {
    fail(`OpenCode config: ${e.message}`);
  }

  detect.getConfigPaths = origFunc;
}

async function testSkillRepos() {
  console.log('\n--- Test: Skill Repos ---');
  const { SKILL_REPOS } = require('./src/prompts/skills');
  for (const repo of SKILL_REPOS) {
    if (repo.id && repo.name && repo.url && repo.url.startsWith('https://github.com/')) {
      pass(`${repo.id}: ${repo.name} (${repo.url})`);
    } else {
      fail(`${repo.id}: invalid repo data`);
    }
  }
}

async function testLogger() {
  console.log('\n--- Test: Logger/Output ---');
  const { logger, banner } = require('./src/utils/logger');
  banner();
  pass('Banner renders without crash');
  logger.success('Test success message');
  logger.warning('Test warning message');
  logger.error('Test error message');
  logger.info('Test info message');
  pass('All log levels work');
}

// Mock os.homedir to prevent writing to real home dir
os.homedir = () => TEST_DIR;

async function run() {
  console.log('\n\x1b[1m=== SPINUP NON-INTERACTIVE TEST ===\x1b[0m');
  console.log('  Test output directory: ./test-output/\n');

  await fs.ensureDir(TEST_DIR);

  const devData = await testModelsDev();
  if (devData) {
    await testParseModels(devData);
  }
  await testMcpPresets();
  await testMcpServerConfigs();
  await testClaudeConfig();
  await testOpenCodeConfig();
  await testSkillRepos();
  await testLogger();

  console.log('\n\x1b[1m=== TEST COMPLETE ===\x1b[0m');
  console.log('  Check ./test-output/ for generated files');
  console.log('  Delete it when done: rm -rf test-output/\n');
}

run().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});

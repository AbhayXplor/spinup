const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { run, commandExists } = require('./shell');

const getHomeDir = () => os.homedir();

const getPlatform = () => process.platform;

const isWindows = () => getPlatform() === 'win32';
const isMac = () => getPlatform() === 'darwin';
const isLinux = () => getPlatform() === 'linux';

const detectAgent = async () => {
  const agents = [];

  // Check Claude Code
  const claudeExists = await commandExists('claude');
  if (claudeExists) {
    const claudeConfigPath = path.join(getHomeDir(), '.claude', 'settings.json');
    const claudeConfigExists = await fs.pathExists(claudeConfigPath);
    agents.push({
      id: 'claude',
      name: 'Claude Code',
      installed: true,
      configured: claudeConfigExists,
      configPath: claudeConfigPath,
    });
  } else {
    agents.push({
      id: 'claude',
      name: 'Claude Code',
      installed: false,
      configured: false,
      configPath: path.join(getHomeDir(), '.claude', 'settings.json'),
    });
  }

  // Check OpenCode
  const opencodeExists = await commandExists('opencode');
  if (opencodeExists) {
    const opencodeConfigPath = path.join(getHomeDir(), '.config', 'opencode', 'opencode.json');
    const opencodeConfigExists = await fs.pathExists(opencodeConfigPath);
    agents.push({
      id: 'opencode',
      name: 'OpenCode',
      installed: true,
      configured: opencodeConfigExists,
      configPath: opencodeConfigPath,
    });
  } else {
    agents.push({
      id: 'opencode',
      name: 'OpenCode',
      installed: false,
      configured: false,
      configPath: path.join(getHomeDir(), '.config', 'opencode', 'opencode.json'),
    });
  }

  return agents;
};

const detectOllama = async () => {
  const ollamaRunning = await commandExists('ollama');
  if (!ollamaRunning) return { running: false, models: [] };

  try {
    const response = await run('ollama', ['list']);
    if (response.success) {
      const models = response.stdout
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('NAME'))
        .map(line => {
          const parts = line.split(/\s+/);
          return {
            name: parts[0],
            size: parts[2] + ' ' + parts[3],
          };
        });
      return { running: true, models };
    }
  } catch (e) {
    // Ollama not running
  }

  return { running: false, models: [] };
};

const detectLMStudio = async () => {
  const configPath = path.join(getHomeDir(), '.cache', 'lm-studio', 'config.json');
  const exists = await fs.pathExists(configPath);
  return { installed: exists, configPath };
};

const getConfigPaths = () => {
  const home = getHomeDir();
  return {
    claude: {
      settings: path.join(home, '.claude', 'settings.json'),
      mcp: path.join(home, '.claude', 'mcp.json'),
      projects: path.join(home, '.claude', 'projects'),
    },
    opencode: {
      global: path.join(home, '.config', 'opencode', 'opencode.json'),
      auth: path.join(home, '.local', 'share', 'opencode', 'auth.json'),
      agents: path.join(home, '.config', 'opencode', 'agents'),
      skills: path.join(home, '.config', 'opencode', 'skills'),
    },
    spinup: {
      root: path.join(home, '.spinup'),
      env: path.join(home, '.spinup', '.env'),
      config: path.join(home, '.spinup', 'config.json'),
    },
  };
};

module.exports = {
  detectAgent,
  detectOllama,
  detectLMStudio,
  getConfigPaths,
  getHomeDir,
  getPlatform,
  isWindows,
  isMac,
  isLinux,
};

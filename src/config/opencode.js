const fs = require('fs-extra');
const path = require('path');
const { getConfigPaths } = require('../utils/detect');

const generateOpenCodeConfig = async (selections) => {
  const { mcpServers, selectedProviders, primaryModel } = selections;
  const paths = getConfigPaths();

  // Ensure .config/opencode directory exists
  await fs.ensureDir(path.dirname(paths.opencode.global));

  // Build MCP servers config
  const mcpConfig = {};
  for (const server of mcpServers) {
    mcpConfig[server.id] = {
      type: 'stdio',
      command: server.opencode.command,
      args: server.opencode.args,
    };
  }

  // Build provider config
  const providerConfig = {};
  for (const provider of selectedProviders) {
    providerConfig[provider.id] = {
      options: {},
    };
    if (provider.apiKey) {
      providerConfig[provider.id].options.apiKey = `{env:${provider.envVar}}`;
    }
    if (provider.baseUrl) {
      providerConfig[provider.id].options.baseURL = provider.baseUrl;
    }
    if (provider.npm) {
      providerConfig[provider.id].npm = provider.npm;
    }
  }

  // Build config
  const config = {
    $schema: 'https://opencode.ai/config.json',
    model: primaryModel || 'anthropic/claude-sonnet-5',
    mcp: mcpConfig,
  };

  if (Object.keys(providerConfig).length > 0) {
    config.provider = providerConfig;
  }

  // Write config
  await fs.writeFile(paths.opencode.global, JSON.stringify(config, null, 2), 'utf-8');

  return {
    configPath: paths.opencode.global,
    mcpServers: Object.keys(mcpConfig),
    providers: Object.keys(providerConfig),
  };
};

const generateOpenCodeProjectConfig = async (selections) => {
  const { mcpServers, primaryModel } = selections;

  // Build MCP servers config
  const mcpConfig = {};
  for (const server of mcpServers) {
    mcpConfig[server.id] = {
      type: 'stdio',
      command: server.opencode.command,
      args: server.opencode.args,
    };
  }

  // Build config
  const config = {
    $schema: 'https://opencode.ai/config.json',
    model: primaryModel || 'anthropic/claude-sonnet-5',
    mcp: mcpConfig,
  };

  // Write config
  const configPath = path.join(process.cwd(), 'opencode.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

  return {
    configPath,
    mcpServers: Object.keys(mcpConfig),
  };
};

module.exports = { generateOpenCodeConfig, generateOpenCodeProjectConfig };

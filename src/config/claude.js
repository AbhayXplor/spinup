const fs = require('fs-extra');
const path = require('path');
const { getConfigPaths } = require('../utils/detect');

const generateClaudeConfig = async (selections) => {
  const { mcpServers, selectedModels, apiKey } = selections;
  const paths = getConfigPaths();

  // Ensure .claude directory exists
  await fs.ensureDir(path.dirname(paths.claude.settings));

  // Build MCP servers config
  const mcpConfig = {};
  for (const server of mcpServers) {
    mcpConfig[server.id] = {
      command: server.claude.command,
      args: server.claude.args,
    };
  }

  // Build settings.json
  const settings = {
    permissions: {
      allow: [
        "Read",
        "Edit",
        "Write",
        "Bash(*)",
        "WebFetch(*)",
      ],
    },
    mcpServers: mcpConfig,
  };

  // Add API key to env if provided
  if (apiKey) {
    settings.env = {
      ANTHROPIC_API_KEY: apiKey,
    };
  }

  // Write settings.json
  await fs.writeFile(paths.claude.settings, JSON.stringify(settings, null, 2), 'utf-8');

  return {
    settingsPath: paths.claude.settings,
    mcpServers: Object.keys(mcpConfig),
  };
};

const generateClaudeMcpJson = async (mcpServers) => {
  const mcpConfig = {};
  for (const server of mcpServers) {
    mcpConfig[server.id] = {
      command: server.claude.command,
      args: server.claude.args,
    };
  }

  const mcpJsonPath = path.join(process.cwd(), '.mcp.json');
  await fs.writeFile(mcpJsonPath, JSON.stringify({ mcpServers: mcpConfig }, null, 2), 'utf-8');

  return { mcpJsonPath, servers: Object.keys(mcpConfig) };
};

module.exports = { generateClaudeConfig, generateClaudeMcpJson };

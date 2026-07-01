const inquirer = require('inquirer');
const serversData = require('../mcp/servers.json');

const promptMcpPreset = async () => {
  const choices = Object.entries(serversData.presets).map(([id, preset]) => ({
    name: `${preset.name} - ${preset.description}`,
    value: id,
  }));

  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Select MCP server preset:',
      choices: [
        ...choices,
        { name: 'Custom (select individual servers)', value: 'custom' },
      ],
    },
  ]);

  return preset;
};

const promptMcpServers = async (preset) => {
  if (preset !== 'custom') {
    return serversData.presets[preset].servers.map(id => {
      for (const category of Object.values(serversData.servers)) {
        const server = category.find(s => s.id === id);
        if (server) return server;
      }
      return null;
    }).filter(Boolean);
  }

  const choices = [];
  for (const [category, servers] of Object.entries(serversData.servers)) {
    choices.push(new inquirer.Separator(`--- ${category.toUpperCase()} ---`));
    for (const server of servers) {
      choices.push({
        name: `${server.name} (${server.stars}★) - ${server.description}`,
        value: server.id,
        checked: category === 'essential',
      });
    }
  }

  const { servers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'servers',
      message: 'Select MCP servers (use space to select, enter to confirm):',
      choices,
    },
  ]);

  // Map selected IDs to full server objects
  const selected = [];
  for (const id of servers) {
    for (const category of Object.values(serversData.servers)) {
      const server = category.find(s => s.id === id);
      if (server) {
        selected.push(server);
        break;
      }
    }
  }

  return selected;
};

module.exports = { promptMcpPreset, promptMcpServers };

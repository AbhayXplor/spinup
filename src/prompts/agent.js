const inquirer = require('inquirer');

const promptAgent = async (detectedAgents) => {
  const choices = detectedAgents.map(agent => ({
    name: `${agent.name}${agent.installed ? ' (installed)' : ''}${agent.configured ? ' (configured)' : ''}`,
    value: agent.id,
    checked: agent.installed,
  }));

  const { agent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'agent',
      message: 'Which AI coding agent are you setting up?',
      choices: [
        ...choices,
        { name: 'Both (Claude Code + OpenCode)', value: 'both' },
      ],
    },
  ]);

  return agent;
};

module.exports = { promptAgent };

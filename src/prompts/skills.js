const inquirer = require('inquirer');

const SKILL_REPOS = [
  {
    id: 'superpowers',
    name: 'Superpowers (obra)',
    description: '242K★ - Security, testing, debugging, git, frontend, docs skills',
    url: 'https://github.com/obra/superpowers',
    skills: ['agent', 'simplify', 'brainstorming', 'tdd', 'debugging', 'frontend-design', 'writing-plans', 'using-git', 'security', 'requesting-code-review', 'receiving-code-review', 'dispatching-parallel-agents'],
  },
  {
    id: 'agent-skills',
    name: 'Agent Skills (addyosmani)',
    description: '68K★ - Frontend architecture, web platform, testing, performance',
    url: 'https://github.com/addyosmani/agent-skills',
    skills: ['frontend-system-architecture', 'web-platform-api-integration', 'web-accessibility', 'performance-budgets', 'testing-strategy', 'release-prep', 'security-hardening', 'debugging-leak', 'bundle-analysis', 'api-design', 'data-fetching', 'design-system', 'ssr-framework', 'migration-framework', 'mobile-responsive', 'monorepo'],
  },
  {
    id: 'agents',
    name: 'Agents (wshobson)',
    description: '37K★ - 88 skills for full-stack development',
    url: 'https://github.com/wshobson/agents',
    skills: ['fastapi', 'nextjs', 'terraform', 'kubernetes', 'prometheus', 'graphql', 'grpc', 'redis', 'security'],
  },
  {
    id: 'taste-skill',
    name: 'Taste Skill (Leon)',
    description: '54K★ - 10-step QA flow, UI/UX taste evaluation',
    url: 'https://github.com/Leon/taste-skill',
    skills: ['taste-skill'],
  },
  {
    id: 'security-skills',
    name: 'Security Skills (kalshamsi)',
    description: '6.5K★ - Security audit, OWASP Top 10, auth hardening',
    url: 'https://github.com/kalshamsi/claude-security-skills',
    skills: ['full-security-audit', 'owasp-top-10', 'auth-hardening'],
  },
];

const promptSkills = async () => {
  const choices = SKILL_REPOS.map(repo => ({
    name: `${repo.name} - ${repo.description}`,
    value: repo.id,
    checked: repo.id === 'superpowers',
  }));

  const { repos } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'repos',
      message: 'Select skill repositories (use space to select, enter to confirm):',
      choices,
    },
  ]);

  return repos;
};

module.exports = { SKILL_REPOS, promptSkills };

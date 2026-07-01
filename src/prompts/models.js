const inquirer = require('inquirer');
const { fetchModels } = require('../utils/models');
const { logger } = require('../utils/logger');

const PROVIDERS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '300+ models, 33 free, one API key (GPT-5.5, Claude Opus 4.8, Gemini 3.5)',
    envVar: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: true,
    url: 'openrouter.ai',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Opus 4.8, Sonnet 4.6, Sonnet 5, Fable 5',
    envVar: 'ANTHROPIC_API_KEY',
    baseUrl: null,
    npm: null,
    hasFreeModels: false,
    url: 'console.anthropic.com',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-5.5, GPT-5.4, o3, o4-mini',
    envVar: 'OPENAI_API_KEY',
    baseUrl: null,
    npm: null,
    hasFreeModels: false,
    url: 'platform.openai.com',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Gemini 3.5 Flash, 3.1 Pro, Gemma 4 (free tier)',
    envVar: 'GOOGLE_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: true,
    url: 'aistudio.google.com',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast LPU inference, Llama 4, Qwen3 (all free)',
    envVar: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: true,
    url: 'console.groq.com',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    description: 'Nemotron 3 Ultra/Super, 187+ models, free tier',
    envVar: 'NVIDIA_API_KEY',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: true,
    url: 'build.nvidia.com',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek V3, R1 reasoning models',
    envVar: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: false,
    url: 'platform.deepseek.com',
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Llama 4, Mistral, Qwen, 200+ open source models',
    envVar: 'TOGETHER_API_KEY',
    baseUrl: 'https://api.together.xyz/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: false,
    url: 'api.together.xyz',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Free local models, no API key',
    envVar: null,
    baseUrl: 'http://localhost:11434/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: true,
    local: true,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Free local models, no API key',
    envVar: null,
    baseUrl: 'http://localhost:1234/v1',
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: true,
    local: true,
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    description: 'Add any OpenAI-compatible endpoint',
    envVar: null,
    baseUrl: null,
    npm: '@ai-sdk/openai-compatible',
    hasFreeModels: false,
    custom: true,
  },
];

const promptProviders = async () => {
  const choices = PROVIDERS.map(p => ({
    name: `${p.name} - ${p.description}${p.hasFreeModels ? ' ★' : ''}`,
    value: p.id,
  }));

  const { providers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Select model providers (use space to select, enter to confirm):',
      choices,
      validate: (answer) => {
        if (answer.length === 0) return 'Select at least one provider';
        return true;
      },
    },
  ]);

  return providers;
};

const promptApiKey = async (provider) => {
  const providerInfo = PROVIDERS.find(p => p.id === provider);
  if (!providerInfo || !providerInfo.envVar) return null;

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${providerInfo.name} API key (or press Enter to skip):`,
      mask: '*',
    },
  ]);

  return apiKey || null;
};

const promptCustomProvider = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Provider name:',
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'API base URL:',
      validate: (input) => input.startsWith('http') ? true : 'Must be a valid URL',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API key (optional, press Enter to skip):',
      mask: '*',
    },
  ]);

  return {
    id: answers.name.toLowerCase().replace(/\s+/g, '-'),
    name: answers.name,
    baseUrl: answers.baseUrl,
    apiKey: answers.apiKey || null,
    npm: '@ai-sdk/openai-compatible',
    envVar: null,
  };
};

const promptSelectModels = async (provider, models) => {
  if (models.length === 0) {
    logger.warning(`No models found for ${provider}`);
    return [];
  }

  const choices = models.map(m => {
    const badges = [];
    if (m.isFree) badges.push('FREE');
    if (m.capabilities?.reasoning) badges.push('think');
    if (m.capabilities?.tools) badges.push('tools');
    if (m.capabilities?.vision) badges.push('vision');
    const badgeStr = badges.length ? ` [${badges.join(', ')}]` : '';
    const ctx = m.contextLength ? (m.contextLength / 1000) + 'K' : '?';
    const price = m.inputPrice != null ? ` $${m.inputPrice}/M in` : '';
    return {
      name: `${m.name} (${ctx})${badgeStr}${price}`,
      value: m.id,
      checked: m.isFree,
    };
  });

  const { models: selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'models',
      message: `Select models from ${provider} (use space to select, enter to confirm):`,
      choices,
    },
  ]);

  return selected;
};

const promptPrimaryModel = async (allModels) => {
  const choices = allModels.map(m => ({
    name: `${m.provider}/${m.id}${m.isFree ? ' (FREE)' : ''}`,
    value: `${m.provider}/${m.id}`,
  }));

  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: 'Select your primary model:',
      choices,
    },
  ]);

  return model;
};

module.exports = {
  PROVIDERS,
  promptProviders,
  promptApiKey,
  promptCustomProvider,
  promptSelectModels,
  promptPrimaryModel,
};

const fs = require('fs-extra');
const path = require('path');
const { getConfigPaths } = require('./detect');

const ENV_VARS = {
  ANTHROPIC_API_KEY: { label: 'Anthropic API Key', provider: 'anthropic', url: 'console.anthropic.com' },
  OPENAI_API_KEY: { label: 'OpenAI API Key', provider: 'openai', url: 'platform.openai.com' },
  OPENROUTER_API_KEY: { label: 'OpenRouter API Key', provider: 'openrouter', url: 'openrouter.ai' },
  GOOGLE_API_KEY: { label: 'Google Gemini API Key', provider: 'google', url: 'aistudio.google.com' },
  GROQ_API_KEY: { label: 'Groq API Key', provider: 'groq', url: 'console.groq.com' },
  NVIDIA_API_KEY: { label: 'NVIDIA NIM API Key', provider: 'nvidia', url: 'build.nvidia.com' },
  DEEPSEEK_API_KEY: { label: 'DeepSeek API Key', provider: 'deepseek', url: 'platform.deepseek.com' },
  TOGETHER_API_KEY: { label: 'Together AI API Key', provider: 'together', url: 'api.together.xyz' },
};

const loadEnv = async () => {
  const paths = getConfigPaths();
  const envPath = paths.spinup.env;

  if (await fs.pathExists(envPath)) {
    const content = await fs.readFile(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...value] = line.split('=');
        if (key && value.length) {
          env[key.trim()] = value.join('=').trim();
        }
      }
    });
    return env;
  }
  return {};
};

const saveEnv = async (envData) => {
  const paths = getConfigPaths();
  await fs.ensureDir(paths.spinup.root);

  const content = Object.entries(envData)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  await fs.writeFile(paths.spinup.env, content, 'utf-8');
};

const getApiKey = async (provider) => {
  const env = await loadEnv();
  const envVar = Object.entries(ENV_VARS).find(([_, v]) => v.provider === provider);
  if (envVar) {
    return env[envVar[0]] || process.env[envVar[0]] || null;
  }
  return null;
};

const hasApiKey = async (provider) => {
  const key = await getApiKey(provider);
  return key !== null && key !== undefined && key !== '';
};

module.exports = { ENV_VARS, loadEnv, saveEnv, getApiKey, hasApiKey };

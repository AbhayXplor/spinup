const https = require('https');
const http = require('http');

const MODELS_DEV_API = 'https://models.dev/api.json';

const fetchJSON = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'spinup/2.0.0',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timed out')); });
  });
};

// Provider ID mapping: spinup provider ID -> Models.dev provider ID
const PROVIDER_MAP = {
  openrouter: 'openrouter',
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  groq: 'groq',
  nvidia: 'nvidia',
  deepseek: 'deepseek',
  together: 'together',
};

// Fetch model metadata from Models.dev (open-source database by OpenCode team)
const fetchModelsFromDev = async () => {
  const data = await fetchJSON(MODELS_DEV_API);
  return data;
};

// Parse Models.dev response into spinup model format
const parseModelsDev = (devData, providerId) => {
  const results = [];

  // Models.dev API returns an object keyed by model ID
  // Each value has: name, cost, limit, reasoning, tool_call, etc.
  for (const [modelId, model] of Object.entries(devData)) {
    // Check if this model belongs to the requested provider
    const modelProvider = modelId.split('/')[0];
    const targetProvider = PROVIDER_MAP[providerId] || providerId;

    if (modelProvider !== targetProvider) continue;

    results.push({
      id: modelId,
      name: model.name || modelId,
      provider: providerId,
      contextLength: model.limit?.context || 0,
      inputPrice: model.cost?.input ?? null,
      outputPrice: model.cost?.output ?? null,
      isFree: (model.cost?.input === 0 && model.cost?.output === 0),
      capabilities: {
        vision: model.attachment || false,
        tools: model.tool_call || false,
        reasoning: model.reasoning || false,
        structuredOutput: model.structured_output || false,
      },
    });
  }

  return results;
};

// OpenRouter: use live API for free model detection (:free suffix)
const fetchOpenRouterModels = async (apiKey) => {
  const url = 'https://openrouter.ai/api/v1/models';
  const headers = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data.map(m => ({
    id: m.id,
    name: m.name || m.id,
    provider: 'openrouter',
    contextLength: m.context_length || 0,
    inputPrice: m.pricing?.prompt ? parseFloat(m.pricing.prompt) * 1000000 : null,
    outputPrice: m.pricing?.completion ? parseFloat(m.pricing.completion) * 1000000 : null,
    isFree: m.id.endsWith(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0'),
    capabilities: {
      vision: m.architecture?.modality?.includes('image') || false,
      tools: m.supported_parameters?.includes('tools') || false,
      reasoning: m.supported_parameters?.includes('reasoning') || false,
    },
  }));
};

// Primary fetch: use Models.dev for most providers, live API for OpenRouter
const fetchModels = async (provider, apiKey) => {
  // OpenRouter needs live API for :free model detection
  if (provider === 'openrouter') {
    return fetchOpenRouterModels(apiKey);
  }

  // Local providers: return empty (user configures manually)
  if (provider === 'ollama' || provider === 'lmstudio') {
    return [];
  }

  // Custom provider: return empty
  if (provider === 'custom') {
    return [];
  }

  // All other providers: use Models.dev
  try {
    const devData = await fetchModelsFromDev();
    return parseModelsDev(devData, provider);
  } catch (e) {
    // Fallback: return empty if Models.dev is down
    return [];
  }
};

module.exports = { fetchModels, fetchOpenRouterModels, fetchModelsFromDev, parseModelsDev };

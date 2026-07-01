const https = require('https');
const http = require('http');

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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timed out')); });
  });
};

const fetchOpenRouterModels = async (apiKey) => {
  const url = 'https://openrouter.ai/api/v1/models';
  const headers = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data.map(m => ({
    id: m.id,
    name: m.name || m.id,
    provider: m.id.split('/')[0],
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

const fetchOpenAIModels = async (apiKey) => {
  const url = 'https://api.openai.com/v1/models';
  const headers = { 'Authorization': `Bearer ${apiKey}` };
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data
    .filter(m => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('o4'))
    .map(m => ({
      id: m.id,
      name: m.id,
      provider: 'openai',
      contextLength: 128000,
      inputPrice: null,
      outputPrice: null,
      isFree: false,
      capabilities: { vision: true, tools: true, reasoning: m.id.startsWith('o') },
    }));
};

const fetchAnthropicModels = async (apiKey) => {
  const url = 'https://api.anthropic.com/v1/models';
  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data.map(m => ({
    id: m.id,
    name: m.display_name || m.id,
    provider: 'anthropic',
    contextLength: m.context_window || 200000,
    inputPrice: null,
    outputPrice: null,
    isFree: false,
    capabilities: {
      vision: m.id.includes('claude') && !m.id.includes('haiku'),
      tools: true,
      reasoning: m.id.includes('opus') || m.id.includes('sonnet'),
    },
  }));
};

const fetchGroqModels = async (apiKey) => {
  const url = 'https://api.groq.com/openai/v1/models';
  const headers = { 'Authorization': `Bearer ${apiKey}` };
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data.map(m => ({
    id: m.id,
    name: m.id,
    provider: 'groq',
    contextLength: m.context_window || 32000,
    inputPrice: null,
    outputPrice: null,
    isFree: true,
    capabilities: { vision: false, tools: true, reasoning: false },
  }));
};

const fetchTogetherModels = async (apiKey) => {
  const url = 'https://api.together.xyz/v1/models';
  const headers = { 'Authorization': `Bearer ${apiKey}` };
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data.map(m => ({
    id: m.id,
    name: m.display_name || m.id,
    provider: 'together',
    contextLength: m.context_length || 0,
    inputPrice: m.pricing?.input || null,
    outputPrice: m.pricing?.output || null,
    isFree: false,
    capabilities: { vision: false, tools: true, reasoning: false },
  }));
};

const fetchNvidiaModels = async (apiKey) => {
  const url = 'https://integrate.api.nvidia.com/v1/models';
  const headers = { 'Authorization': `Bearer ${apiKey}` };
  const data = await fetchJSON(url, { headers });

  if (!data.data) return [];

  return data.data.map(m => ({
    id: m.id,
    name: m.id,
    provider: 'nvidia',
    contextLength: 0,
    inputPrice: null,
    outputPrice: null,
    isFree: false,
    capabilities: { vision: false, tools: false, reasoning: false },
  }));
};

const fetchModels = async (provider, apiKey) => {
  switch (provider) {
    case 'openrouter': return fetchOpenRouterModels(apiKey);
    case 'openai': return fetchOpenAIModels(apiKey);
    case 'anthropic': return fetchAnthropicModels(apiKey);
    case 'groq': return fetchGroqModels(apiKey);
    case 'together': return fetchTogetherModels(apiKey);
    case 'nvidia': return fetchNvidiaModels(apiKey);
    default: return [];
  }
};

module.exports = { fetchModels, fetchOpenRouterModels, fetchOpenAIModels, fetchAnthropicModels, fetchGroqModels, fetchTogetherModels, fetchNvidiaModels };

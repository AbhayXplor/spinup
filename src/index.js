const { logger, spinner, banner } = require('./utils/logger');
const { detectAgent, detectOllama, getConfigPaths } = require('./utils/detect');
const { saveEnv, loadEnv } = require('./utils/env');
const { fetchModels } = require('./utils/models');
const { promptAgent } = require('./prompts/agent');
const { promptProviders, promptApiKey, promptCustomProvider, promptSelectModels, promptPrimaryModel, PROVIDERS } = require('./prompts/models');
const { promptMcpPreset, promptMcpServers } = require('./prompts/mcp');
const { promptSkills, SKILL_REPOS } = require('./prompts/skills');
const { generateClaudeConfig, generateClaudeMcpJson } = require('./config/claude');
const { generateOpenCodeConfig, generateOpenCodeProjectConfig } = require('./config/opencode');

const main = async (options = {}) => {
  banner();

  const selections = {
    agent: null,
    providers: [],
    apiKeys: {},
    models: [],
    primaryModel: null,
    mcpServers: [],
    skills: [],
  };

  try {
    // Step 1: Detect existing agents
    logger.step(1, 'Detecting AI coding agents...');
    const detectedAgents = await detectAgent();
    const ollamaInfo = await detectOllama();

    for (const agent of detectedAgents) {
      if (agent.installed) {
        logger.success(`${agent.name} installed${agent.configured ? ' (configured)' : ''}`);
      } else {
        logger.dim(`${agent.name} not installed`);
      }
    }

    if (ollamaInfo.running) {
      logger.success(`Ollama running with ${ollamaInfo.models.length} local models`);
    }

    // Step 2: Select agent
    logger.step(2, 'Select agent');
    if (options.agent) {
      selections.agent = options.agent;
      logger.info(`Using agent: ${options.agent}`);
    } else {
      selections.agent = await promptAgent(detectedAgents);
    }

    // Step 3: Configure model providers
    logger.step(3, 'Configure model providers');
    logger.info('Select providers to configure (you can add more later)');

    const selectedProviderIds = await promptProviders();
    logger.success(`Selected ${selectedProviderIds.length} providers`);

    // Configure each provider
    for (const providerId of selectedProviderIds) {
      const providerInfo = PROVIDERS.find(p => p.id === providerId);

      if (providerInfo.custom) {
        // Custom provider
        const custom = await promptCustomProvider();
        selections.providers.push({
          ...custom,
          envVar: null,
        });
      } else if (providerInfo.local) {
        // Local provider (Ollama/LM Studio)
        selections.providers.push({
          id: providerInfo.id,
          name: providerInfo.name,
          baseUrl: providerInfo.baseUrl,
          npm: providerInfo.npm,
          envVar: null,
        });
        logger.success(`Added ${providerInfo.name} (local, no API key needed)`);
      } else {
        // Remote provider - fetch API key
        const apiKey = await promptApiKey(providerId);
        selections.providers.push({
          id: providerInfo.id,
          name: providerInfo.name,
          baseUrl: providerInfo.baseUrl,
          npm: providerInfo.npm,
          envVar: providerInfo.envVar,
          apiKey,
        });

        if (apiKey) {
          selections.apiKeys[providerInfo.envVar] = apiKey;
          logger.success(`Added ${providerInfo.name} with API key`);

          // Fetch live models
          const s = spinner(`Fetching models from ${providerInfo.name}...`);
          try {
            const models = await fetchModels(providerId, apiKey);
            s.succeed(`Found ${models.length} models from ${providerInfo.name}`);

            // Select models
            const selectedModelIds = await promptSelectModels(providerInfo.name, models);
            for (const modelId of selectedModelIds) {
              const model = models.find(m => m.id === modelId);
              if (model) {
                selections.models.push({
                  ...model,
                  provider: providerId,
                });
              }
            }
          } catch (e) {
            s.fail(`Failed to fetch models from ${providerInfo.name}: ${e.message}`);
          }
        } else {
          logger.warning(`Skipped API key for ${providerInfo.name}`);
        }
      }
    }

    // Step 4: Select primary model
    if (selections.models.length > 0) {
      logger.step(4, 'Select primary model');
      selections.primaryModel = await promptPrimaryModel(selections.models);
      logger.success(`Primary model: ${selections.primaryModel}`);
    }

    // Step 5: Configure MCP servers
    logger.step(5, 'Configure MCP servers (all free, no API keys needed)');
    const mcpPreset = await promptMcpPreset();
    selections.mcpServers = await promptMcpServers(mcpPreset);
    logger.success(`Selected ${selections.mcpServers.length} MCP servers`);

    // Step 6: Select skills
    logger.step(6, 'Select skills');
    const selectedRepoIds = await promptSkills();
    selections.skills = SKILL_REPOS.filter(r => selectedRepoIds.includes(r.id));
    logger.success(`Selected ${selections.skills.length} skill repositories`);

    // Step 7: Generate configs
    logger.step(7, 'Generating configurations');

    if (options.dryRun) {
      logger.info('DRY RUN - would generate:');
      if (selections.agent === 'claude' || selections.agent === 'both') {
        logger.info(`  Claude Code: settings.json with ${selections.mcpServers.length} MCP servers`);
      }
      if (selections.agent === 'opencode' || selections.agent === 'both') {
        logger.info(`  OpenCode: opencode.json with ${selections.mcpServers.length} MCP servers`);
      }
      logger.info(`  Skills: ${selections.skills.map(s => s.name).join(', ')}`);
      logger.blank();
      logger.info('No files written (dry run)');
      return;
    }

    // Save API keys
    if (Object.keys(selections.apiKeys).length > 0) {
      await saveEnv(selections.apiKeys);
      logger.success('Saved API keys to ~/.spinup/.env');
    }

    // Generate Claude Code config
    if (selections.agent === 'claude' || selections.agent === 'both') {
      const s = spinner('Generating Claude Code config...');
      try {
        const result = await generateClaudeConfig(selections);
        s.succeed(`Claude Code config: ${result.settingsPath}`);
        logger.dim(`  MCP servers: ${result.mcpServers.join(', ')}`);
      } catch (e) {
        s.fail(`Failed to generate Claude Code config: ${e.message}`);
      }
    }

    // Generate OpenCode config
    if (selections.agent === 'opencode' || selections.agent === 'both') {
      const s = spinner('Generating OpenCode config...');
      try {
        const result = await generateOpenCodeConfig(selections);
        s.succeed(`OpenCode config: ${result.configPath}`);
        logger.dim(`  MCP servers: ${result.mcpServers.join(', ')}`);
        logger.dim(`  Providers: ${result.providers.join(', ')}`);
      } catch (e) {
        s.fail(`Failed to generate OpenCode config: ${e.message}`);
      }
    }

    // Summary
    logger.blank();
    logger.success('Spinup setup complete!');
    logger.blank();

    // Check if agents are installed for accurate next steps
    const { checkAgentInstalled } = require('./utils/detect');
    const claudeInstalled = (selections.agent === 'claude' || selections.agent === 'both')
      ? await checkAgentInstalled('claude') : false;
    const opencodeInstalled = (selections.agent === 'opencode' || selections.agent === 'both')
      ? await checkAgentInstalled('opencode') : false;

    logger.info('Next steps:');
    let step = 1;

    if (selections.agent === 'claude' || selections.agent === 'both') {
      if (claudeInstalled) {
        logger.info(`  ${step++}. Restart Claude Code to load new config`);
        logger.info(`  ${step++}. Run: claude`);
      } else {
        logger.info(`  ${step++}. Install Claude Code: npm install -g @anthropic-ai/claude-code`);
        logger.info(`  ${step++}. Run: claude`);
      }
    }

    if (selections.agent === 'opencode' || selections.agent === 'both') {
      if (opencodeInstalled) {
        logger.info(`  ${step++}. Run: opencode`);
        logger.info(`  ${step++}. Use /models to switch models`);
        logger.info(`  ${step++}. Use /connect to add more providers`);
      } else {
        logger.info(`  ${step++}. Install OpenCode: npm install -g opencode-ai`);
        logger.info(`  ${step++}. Run: opencode`);
        logger.info(`  ${step++}. Use /models to switch models`);
      }
    }

    logger.blank();

  } catch (error) {
    if (error.isTtyError) {
      logger.error('Prompt could not be rendered in the current environment');
    } else {
      logger.error(`Something went wrong: ${error.message}`);
    }
    process.exit(1);
  }
};

module.exports = main;

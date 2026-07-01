<div align="center">

# `spinup`

### Spin up your AI dev stack in one command.

[![npm version](https://img.shields.io/npm/v/spinup?style=flat-square&color=00C8FF)](https://www.npmjs.com/package/spinup)
[![license](https://img.shields.io/github/license/AbhayXplor/spinup?style=flat-square&color=10B981)](https://github.com/AbhayXplor/spinup/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-22C55E?style=flat-square)](https://nodejs.org)
[![stars](https://img.shields.io/github/stars/AbhayXplor/spinup?style=flat-square&color=FBBF24)](https://github.com/AbhayXplor/spinup)

[Installation](#installation) · [How It Works](#how-it-works) · [Providers](#model-providers) · [MCP Servers](#mcp-servers) · [Skills](#skills) · [Comparison](#comparison)

---

```bash
npx spinup
```

> Set up Claude Code or OpenCode with model providers, MCP servers, skills, and agent configs — **in under 60 seconds.**

</div>

---

## Table of Contents

- [What It Does](#what-it-does)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Interactive Flow](#interactive-flow)
- [Model Providers](#model-providers)
- [MCP Servers](#mcp-servers)
- [Skills](#skills)
- [Supported Agents](#supported-agents)
- [Configuration](#configuration)
- [Comparison](#comparison)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## What It Does

**spinup** is a one-command setup for your AI coding environment. It detects what you have installed, lets you pick providers and models, installs free MCP servers, downloads skills, and generates all the config files — interactively, with zero manual JSON editing.

**The problem it solves:** Setting up Claude Code or OpenCode with providers, MCP servers, and skills currently takes 30-60 minutes of manual configuration. spinup does it in one command.

**What gets configured:**

- Model providers with verified data from Models.dev (11 providers, 300+ models)
- MCP servers with zero API keys (11 servers, 3 presets)
- Skill repositories from top open-source collections (5 repos, 400K+ stars)
- Agent-specific config files (Claude Code and/or OpenCode)

---

## Installation

```bash
npx spinup
```

No install required. Also works with:

```bash
npm install -g spinup && spinup    # global install
yarn dlx spinup                     # yarn
pnpm dlx spinup                     # pnpm
```

**Requirements:** Node.js >= 18, plus Claude Code or OpenCode installed.

---

## How It Works

### 7-Step Flow

| Step | Action | Output |
|:----:|--------|--------|
| 1 | Detect installed agents and Ollama | Lists what is installed |
| 2 | Select agent (Claude Code, OpenCode, or both) | Interactive prompt |
| 3 | Select model providers | 11 options with live API |
| 4 | Pick models from verified data | Models.dev + live pricing |
| 5 | Choose MCP server preset | minimal / recommended / full |
| 6 | Select skill repositories | 5 curated repos |
| 7 | Generate config files | Done |

### CLI Flags

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `-a, --agent` | Skip agent prompt (claude or opencode) |
| `--dry-run` | Preview changes without writing anything |

```bash
npx spinup                        # full interactive setup
npx spinup --agent claude         # skip agent selection
npx spinup --dry-run              # preview only, no changes
```

---

## Interactive Flow

Below is a preview of what the CLI looks like when you run `npx spinup`:

```
  ╔═══════════════════════════════════════╗
  ║          spinup v2.0.0              ║
  ║   Your AI coding environment, ready   ║
  ╚═══════════════════════════════════════╝

 [1] Detecting AI coding agents...

   ✔ Claude Code installed (configured)
   ✔ OpenCode installed
   ✔ Ollama running with 3 local models

 [2] Select agent
   > Claude Code
     OpenCode
     Both

 [3] Configure model providers
   > OpenRouter          (28+ free models, no key needed)
   > Anthropic           (Claude family)
     OpenAI              (GPT / o-series)
     Google Gemini       (free tier available)
     Groq                (all models free)
     NVIDIA NIM          (free tier available)
     DeepSeek
     Together AI
     Ollama              (local, free)
     LM Studio           (local, free)
     Custom              (any OpenAI-compatible)

 [4] Select models from OpenRouter

   > openai/gpt-5.5                        $3.00/$18.00   1M ctx
      anthropic/claude-opus-4.8              $4.29/$21.46   1M ctx
      google/gemini-3.5-flash               $1.50/$9.00    1M ctx
      meta-llama/llama-4-maverick           $0.20/$0.80    1M ctx
      nvidia/nemotron-3-super               FREE            1M ctx

 [5] Configure MCP servers
   > minimal     (2 servers - Context7, Sequential Thinking)
     recommended (5 servers - + Memory, Filesystem, Fetch)
     full        (9 servers - + Playwright, Git, SQLite, Time)
     custom

 [6] Select skills
   > obra/superpowers          242K stars
     addyosmani/agent-skills   68K stars
     wshobson/agents           37K stars
     Leon/taste-skill          54K stars
     kalshamsi/security        6.5K stars

 [7] Generating configurations...

   ✔ Saved API keys to ~/.spinup/.env
   ✔ Claude Code config: ~/.claude/settings.json
     MCP servers: context7, sequential-thinking, memory, filesystem, fetch
   ✔ Skills cloned to ~/.claude/projects/skills/

   Spinup setup complete!
```

---

## Model Providers

### How It Works

spinup uses [Models.dev](https://models.dev) — the same open-source model database that powers OpenCode — for verified model IDs, pricing, and capabilities. You always see **accurate, up-to-date information**, not stale hardcoded lists.

For OpenRouter, spinup also calls the live `/v1/models` API to detect `:free` models in real-time.

### Data Source: Models.dev

[Models.dev](https://models.dev) is an open-source database of AI model specifications maintained by the [OpenCode team](https://github.com/anomalyco/models.dev). It provides:

- Verified model IDs (same identifiers used by AI SDK and OpenCode)
- Accurate pricing (input/output cost per million tokens)
- Context window sizes
- Capability flags (reasoning, tool calling, vision, structured output)
- Release dates and update timestamps

spinup uses this as the single source of truth instead of maintaining hardcoded model lists that go stale.

### Provider Matrix

| Provider | Free Models | API Key Required | Endpoint | Latest Models (June 2026) |
|----------|:-----------:|:----------------:|----------|---------------------------|
| OpenRouter | 33+ | Optional | `/v1/models` | GPT-5.5, Claude Opus 4.8, Gemini 3.5, Kimi K2.7 |
| Anthropic | -- | Yes | Models.dev | Claude Opus 4.8, Sonnet 4.6, Fable 5, Sonnet 5 |
| OpenAI | -- | Yes | Models.dev | GPT-5.5, GPT-5.4, o3, o4-mini |
| Google Gemini | Free tier | Yes | Models.dev | Gemini 3.5 Flash, 3.1 Pro, Gemma 4 |
| Groq | All free | Yes | Models.dev | Llama 4 Scout/Maverick, Qwen3 |
| NVIDIA NIM | Free tier | Yes | Models.dev | Nemotron 3 Ultra, Nemotron 3 Super |
| DeepSeek | -- | Yes | Models.dev | DeepSeek V4 Flash, V4 Pro, V3 |
| Together AI | -- | Yes | Models.dev | Llama 4, Mistral, Qwen3.7 |
| Ollama | All free | No | Local | Llama 4 Scout, Gemma 4, Mistral Small 4 |
| LM Studio | All free | No | Local | Any GGUF model |
| Custom | -- | Varies | User-provided | Any OpenAI-compatible endpoint |

### Cost Spectrum

```
  FREE                                                    PAID
  <──────────────────────────────────────────────────────>
  |              |                 |                       |
  Ollama         Groq              OpenRouter (free tier)  Anthropic
  LM Studio      Gemini            Together AI             OpenAI
                 NVIDIA NIM                              DeepSeek
  Local          Free API           Limited free           Per-token

  Verified pricing from Models.dev (open-source, same database as OpenCode)
```

### OpenRouter Free Models

OpenRouter offers free models tagged with a `:free` suffix. Current top free models (from live API):

| Model | Context | Capabilities |
|-------|:-------:|:------------:|
| `openrouter/owl-alpha` | 1M | Tools, Agentic |
| `nvidia/nemotron-3-super:free` | 1M | Tools, Reasoning |
| `moonshotai/kimi-k2.7-code:free` | 256K | Coding, Tools |
| `qwen/qwen3-coder:free` | 128K | Coding, Tools |
| `mistralai/devstral-2512:free` | 128K | Coding |
| `google/gemma-4-31b-it:free` | 256K | Vision, Tools |
| `deepseek/deepseek-v4-flash:free` | 1M | Tools, Reasoning |

> Models rotate frequently. spinup fetches the live list from the API at runtime.

### Custom Providers

Any OpenAI-compatible endpoint works. Use the **Custom** provider option to add your own:

```bash
# Example: adding a self-hosted model
npx spinup
> Select "Custom Provider"
> Enter name: My Local Model
> Enter base URL: http://localhost:8080/v1
> Enter API key (optional): ...
```

---

## MCP Servers

### Zero API Keys Required

Every MCP server bundled with spinup is completely free. They run locally via `npx` or `uvx`.

### Server List

| Server | Package | Runner | What It Does |
|--------|---------|:------:|-------------|
| Context7 | `@upstash/context7-mcp` | npx | Real-time library documentation |
| Sequential Thinking | `@modelcontextprotocol/server-sequential-thinking` | npx | Structured step-by-step reasoning |
| Memory | `@modelcontextprotocol/server-memory` | npx | Persistent knowledge graph |
| Filesystem | `@modelcontextprotocol/server-filesystem` | npx | Secure file operations |
| Fetch | `@modelcontextprotocol/server-fetch` | npx | HTTP requests and API calls |
| Playwright | `@playwright/mcp` | npx | Browser automation and screenshots |
| Git | `mcp-server-git` | uvx | Git diff, log, commit, branch |
| SQLite | `@modelcontextprotocol/server-sqlite` | npx | Local database queries |
| Time | `@modelcontextprotocol/server-time` | npx | Current time and timezones |
| Weather | `@h1deya/mcp-server-weather` | npx | Weather data via Open-Meteo |

### Presets

| Preset | Included Servers | Count |
|--------|-----------------|:-----:|
| **minimal** | Context7, Sequential Thinking | 2 |
| **recommended** | Above + Memory, Filesystem, Fetch | 5 |
| **full** | Above + Playwright, Git, SQLite, Time | 9 |
| **custom** | Pick any combination | -- |

### Preset Matrix

| Server | minimal | recommended | full |
|--------|:-------:|:-----------:|:----:|
| Context7 | Y | Y | Y |
| Sequential Thinking | Y | Y | Y |
| Memory | | Y | Y |
| Filesystem | | Y | Y |
| Fetch | | Y | Y |
| Playwright | | | Y |
| Git | | | Y |
| SQLite | | | Y |
| Time | | | Y |

---

## Skills

### Curated Repositories

spinup clones skills from these open-source repos:

| Repository | Stars | Skills | Focus Area |
|-----------|:-----:|:------:|------------|
| [obra/superpowers](https://github.com/obra/superpowers) | 242K+ | 100+ | Security, architecture, debugging |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 68K+ | 50+ | Performance, testing, React |
| [wshobson/agents](https://github.com/wshobson/agents) | 37K+ | 30+ | Full-stack, backend, DevOps |
| [Leon/taste-skill](https://github.com/Leon/taste-skill) | 54K+ | 20+ | UI/UX, design systems |
| [kalshamsi/claude-security-skills](https://github.com/kalshamsi/claude-security-skills) | 6.5K+ | 15+ | Security audits, pen testing |

### Skill Categories

| Category | Topics Covered |
|----------|----------------|
| Security | OWASP Top 10, pen testing, auth flaws, crypto |
| Architecture | Clean code, SOLID, DDD, event sourcing |
| Testing | Unit, integration, E2E, TDD |
| Performance | Lighthouse, core vitals, caching |
| Frontend | React patterns, accessibility, SSR/SSG |
| DevOps | Docker, CI/CD, K8s, monitoring |
| Code Quality | Linting, refactoring, code review |
| Debugging | Profiling, memory leaks, tracing |

---

## Supported Agents

| Feature | Claude Code | OpenCode |
|---------|:-----------:|:--------:|
| Language | TypeScript/Node | Go |
| Config format | JSON | JSON |
| MCP support | Native | Native |
| Custom providers | Via CCR | 75+ built-in |
| Interactive mode | Terminal UI | Terminal UI |
| LSP support | Yes | Yes |
| Cost tracking | Yes | Yes |
| Model switching | `/model` | `/models` |
| Latest model | Claude Opus 4.8 | GPT-5.5, Gemini 3.5 Flash |

### Claude Code

- Config: `~/.claude/settings.json`
- MCP: `~/.claude.json` (user) or `.mcp.json` (project)
- Install: `npm install -g @anthropic-ai/claude-code`
- Custom providers: Via [Claude Code Router](https://github.com/anthropics/claude-code-router)

### OpenCode

- Config: `~/.config/opencode/opencode.json`
- Install: `go install github.com/opencode-ai/opencode@latest`
- Custom providers: 75+ via `@ai-sdk/openai-compatible`
- Built-in commands: `/models` (live discovery), `/connect` (add providers)

---

## Configuration

### Claude Code Example

`~/.claude/settings.json`

```json
{
  "permissions": {
    "allow": ["Read", "Edit", "Write", "Bash(*)", "WebFetch(*)"]
  },
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### OpenCode Example

`~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/openai/gpt-5.5",
  "provider": {
    "openrouter": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenRouter",
      "options": {
        "baseURL": "https://openrouter.ai/api/v1",
        "apiKey": "{env:OPENROUTER_API_KEY}"
      }
    }
  },
  "mcp": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### API Key Storage

All keys are saved to `~/.spinup/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=gsk_...
```

Keys are stored locally and only sent to the respective provider APIs.

---

## Comparison

### Manual Setup vs. spinup

| Step | Manual | spinup |
|------|--------|--------|
| Agent setup | Install manually | Auto-detected |
| Provider config | Edit JSON by hand | Interactive selection |
| Model discovery | Browse provider docs | Models.dev verified data + live API |
| MCP servers | Add one at a time | Presets (2/5/9 servers) |
| Skills | Git clone each repo | One-click selection |
| API keys | Write `.env` manually | Automated |
| Time | 30-60 minutes | Under 60 seconds |

### vs. Similar Tools

| Tool | What It Does | How spinup Differs |
|------|-------------|-------------------|
| `create-next-app` | Scaffolds a Next.js project | spinup sets up your AI coding environment |
| `opencode auth login` | Connects one provider | spinup configures multiple providers + MCP + skills |
| `claude mcp add` | Adds one MCP server | spinup installs a curated set with presets |
| Awesome lists | Curate links to tools | spinup actually installs and configures them |
| Manual config | Write everything yourself | One command does it all |

### The Problem spinup Solves

```
  WITHOUT spinup:                          WITH spinup:

  Install agent ........... 10 min         npx spinup
  Find MCP servers ........ 15 min              |
  Configure providers ..... 10 min              |
  Install skills .......... 10 min          < 60 seconds
  ──────────────────────────────                 |
  Total: 45+ minutes                        Done.
```

---

## Architecture

### Project Structure

```
spinup/
  bin/
    spinup.js                 # CLI entry point
  src/
    index.js                  # Main orchestrator
    config/
      claude.js               # Claude Code config generator
      opencode.js             # OpenCode config generator
    prompts/
      agent.js                # Agent selection
      models.js               # Provider + model selection
      mcp.js                  # MCP preset/server selection
      skills.js               # Skills repo selection
    mcp/
      servers.json            # MCP server registry
    utils/
      detect.js               # Agent + Ollama detection
      env.js                  # API key management
      logger.js               # Output formatting
      models.js               # Live model fetching
      shell.js                # Shell command wrapper
  package.json
  LICENSE
  README.md
```

### How It Works Internally

```
  User runs `npx spinup`
         |
         v
  Detect agents + Ollama
         |
         v
  Prompt: select agent
         |
         v
  Prompt: select providers (11 options)
         |
         v
  Prompt: enter API keys (saved to ~/.spinup/.env)
         |
         v
  Fetch live models from provider APIs
         |
         v
  Prompt: select models (with pricing/context info)
         |
         v
  Prompt: select MCP preset (minimal/recommended/full/custom)
         |
         v
  Prompt: select skills (5 repos)
         |
         v
  Generate agent config files
         |
         v
  Done. Restart agent.
```

---

## Development

```bash
git clone https://github.com/AbhayXplor/spinup.git
cd spinup
npm install
npm run dev          # run in dev mode
npm run test         # dry run (no changes written)
```

### Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Run spinup |
| `npm run test` | Run with `--dry-run` |
| `npm run lint` | Lint source files |
| `npm run typecheck` | Type checking |

### Adding a Provider

1. Add config to `src/prompts/models.js`
2. If the provider is on Models.dev, add the mapping in `src/utils/models.js` PROVIDER_MAP
3. If not on Models.dev, add a custom fetcher in `src/utils/models.js`

### Adding an MCP Server

Add an entry to `src/mcp/servers.json`:

```json
{
  "id": "my-server",
  "name": "My Server",
  "category": "custom",
  "command": "npx",
  "args": ["-y", "my-mcp-server-package"],
  "description": "What it does",
  "stars": 1000,
  "requiresApiKey": false
}
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `command not found: spinup` | Use `npx spinup` or `npm install -g spinup` |
| `spawnSync npx ENOENT` | Install Node.js 18+: `node --version` |
| Provider returns 401 | Check API key is valid and has credits |
| MCP server fails to start | Test manually: `npx -y @upstash/context7-mcp` |
| Config file not found | Agent may not be installed: `which claude` |
| Ollama not detected | Start Ollama: `ollama serve` |

### Debug

```bash
npx spinup --dry-run                    # preview only
cat ~/.claude/settings.json             # check Claude config
cat ~/.config/opencode/opencode.json    # check OpenCode config
cat ~/.spinup/.env                      # check stored keys
```

### Fresh Start

```bash
rm -rf ~/.spinup
npx spinup
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

**Good first issues:** Add an MCP server, add a provider, improve formatting, add tests.

---

## License

MIT -- [AbhayXplor](https://github.com/AbhayXplor)

# The Beast Code Creator

**AI agent for direct code project output.**

Generate playable game prototypes from simple text prompts — powered by `matrix-engine-wgpu`.

---

## Objective

Create games from simple prompts. Describe what you want ("a maze with no physics", "a 2D platformer with physics"), pick reference examples, and the agent dispatches working engine code straight into a live preview.

## Status

July 2026 — active development.

## Prerequisites

- Node.js

## Running Standalone

If you cloned this repo on its own:

```bash
npm install
npm run dev
```

No build step needed — `npm run dev` runs a watcher, so changes apply automatically.

## Running from the Engine Monorepo

If you cloned the full `matrix-engine-wgpu` repo, run these from the **engine root folder**:

```bash
npm run creator          # frontend
npm run creator-backend  # backend (socket server)
```

## How It Works

`Code Creator` consumes `matrix-engine-wgpu` from npm at runtime. It also ships as part of the engine's own repo, but the tool itself is fully standalone and independent from the engine's build/runtime — it just targets the engine as its output API.
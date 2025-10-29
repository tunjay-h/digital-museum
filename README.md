# ANAS Digital Museum

This project implements the MVP hallway experience for the Azerbaijan National Academy of Sciences (ANAS) digital museum. Visitors enter through a splash screen inspired by the Ismailiyya Palace and explore a photo-textured 3D corridor that celebrates all presidents of the academy. The experience is built with React, Vite, and [react-three-fiber](https://github.com/pmndrs/react-three-fiber), and it supports both desktop pointer-lock navigation and mobile landscape controls.

## Features

- **Interactive hallway** with 13 framed portraits (6 left, 6 right, 1 end wall) sourced from official ANAS references.
- **Localized UI (AZ/EN)** powered by i18next; Azerbaijani is the default locale with real-time switching.
- **Info panels** featuring bilingual biographies, source attribution, shareable deep links (`/hall/art/{person_id}`), and audio controls that gracefully handle yet-to-be-added recordings.
- **Settings & accessibility**: adjustable look sensitivity, master volume, “reduce effects” performance mode, camera bob toggle, and optional crosshair for motion comfort.
- **Desktop & mobile navigation**: WASD/Shift/F pointer-lock controls on desktop, dual virtual joysticks on mobile, and a landscape-only prompt for touch devices.
- **Graceful fallbacks**: detects WebGL support and, when unavailable, renders an accessible 2D portrait gallery with identical content.
- **Pluggable audio stubs** for Web Speech, ElevenLabs, and Google Cloud TTS providers (ready for future enablement).

## Getting started

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173/` by default. Open it in a modern desktop browser for the full hallway experience or in a landscape mobile simulator to exercise touch controls.

## Available scripts

| Command        | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `npm run dev`  | Start the Vite development server with hot-module reload.     |
| `npm run build`| Type-check with `tsc` and produce an optimized production build in `dist/`. |
| `npm run lint` | Lint the project with ESLint using the provided configuration. |
| `npm run preview` | Serve the production build locally for smoke testing.     |

## Project structure

```
src/
  audio/providers/    # Text-to-speech provider interfaces and stubs
  data/               # Presidents dataset and localization bundles
  hooks/              # Shared React hooks (asset preloading, etc.)
  routes/             # Splash and Hall pages
  scene/              # 3D scene composition, controls, and hall layout
  ui/                 # HUD, panels, overlays, fallback gallery, controls
  store/              # Zustand store for global museum state
  styles/             # Global styling tokens
```

## Assets & attribution

- Portrait metadata lives in `src/data/presidents.ts` and references high-quality public URLs.
- Additional acknowledgements and asset licensing can be surfaced through the in-app credits overlay (`hud-panel` bottom-right).

## Roadmap considerations

This MVP is structured for future wings and rooms. Adding new halls or audio recordings primarily requires updating the presidents dataset, dropping new textures/assets into `public/`, and extending scene modules under `src/scene/`.

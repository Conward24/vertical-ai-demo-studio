# Vertical AI Demo Studio

AI-native production platform for designing and generating structured vertical (9:16) demo videos. Uses **Gemini** for storyboard orchestration and is designed to work with **Replicate** (NanoBanana Pro, Veo) and external TTS for production.

## Features

- **Project wizard** — Video objective, audience, energy level, visual mode, scene count, brand kit, persona, reference characters toggle
- **Producer personas** — Documentary Restraint, Poetic Minimalism, Precision Tech Realism, Design-Led Product, Conversational Minimal, Kinetic SaaS Explainer
- **Character studio** — Optional reference characters with NanoBanana prompts and approval; only enforced for scenes with "Uses Character = YES"
- **Storyboard** — Horizontal timeline, scene cards (title, purpose, mockup/character toggles, NanoBanana/Veo prompts, VO lines, on-screen text, status, comments), drag-and-drop reorder, **Auto sequence** (max 2 consecutive UI-only, variation, no identical back-to-back)
- **Cost engine** — Editable pricing (NanoBanana per image, Veo per clip, VO per minute), per-scene and total cost, optimization suggestions
- **Collaboration lite** — Scene status (Draft / In Review / Approved / Locked), scene comments, project notes, **Export/Import JSON**
- **Settings** — Editable runtime system prompt (Gemini), pricing, default scene count/energy, collaboration mode
- **Sample project** — Pre-loaded 12-scene SaaS onboarding with Precision Tech Realism persona

## Run locally

1. **Clone or open the project**
   ```bash
   cd vertical-ai-demo-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set API token(s)**  
   You need at least one of:
   - **Replicate** — Get a token from [Replicate Account → API tokens](https://replicate.com/account/api-tokens). Used for Gemini (scene generation), Veo, and NanoBanana Pro image generation.
   - **Google (optional fallback)** — Get a key from [Google AI Studio](https://aistudio.google.com/apikey). When Replicate is overloaded (e.g. “high demand” errors), the app will try Google’s same NanoBanana Pro model so image generation still works.
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local: set REPLICATE_API_TOKEN and optionally GOOGLE_GENERATIVE_AI_API_KEY
   ```
   Use one Replicate token for Gemini, Veo, and NanoBanana Pro. Add `GOOGLE_GENERATIVE_AI_API_KEY` to avoid being blocked when Replicate is at capacity.

4. **Start dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Generate scenes**  
   Create or load a project, open **Storyboard**, click **Generate scenes**. The app calls Replicate’s Gemini (e.g. `google/gemini-2.5-flash`) with your project config and persona; returned scenes are rendered as storyboard cards.

## Reusing your Replicate setup

Your existing scripts in `bulk_video_generator` use:

- **Veo:** `google/veo-3-fast` (image + prompt → video; 9:16, 720p/1080p, duration 8s)
- **NanoBanana:** `google/nano-banana-pro` (prompt + optional reference images → image; 9:16, 2K)

This app produces **storyboard JSON** (NanoBanana prompts, Veo prompts, VO, etc.). To actually generate media:

- **Option A:** Export the project JSON, then run your own script that reads it and calls Replicate (reuse `bulk_video_generator.py` / `bulk_image_generator.py` patterns).
- **Option B:** Add backend routes that proxy to Replicate (using `REPLICATE_API_TOKEN`) and call them from the UI when you’re ready.

Cost defaults in Settings match typical Replicate-style pricing; adjust as needed.

## Tech stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, react-dnd (storyboard reorder)
- **Backend:** Next.js API route `POST /api/generate-scenes` (Gemini)
- **Persistence:** Browser `localStorage` (MVP); no database or auth required

## Project structure

```
src/
  app/
    api/generate-scenes/route.ts   # Gemini orchestration
    layout.tsx
    page.tsx                       # Main SPA
  components/
    ProjectWizard.tsx
    PersonaSelector.tsx
    CharacterStudio.tsx
    Storyboard.tsx
    SceneCard.tsx
    BudgetDashboard.tsx
    SettingsPanel.tsx
    ExportImport.tsx
  data/
    personas.ts
    sampleProject.ts
    defaultSettings.ts
  lib/
    costEngine.ts
    autoSequence.ts
    storage.ts
  types/
    index.ts
```

## Future roadmap (storage, collaboration, media durability)

This is a high-level backlog of requested features so they are easy to revisit later.

- **Multi-project library**
  - Store **multiple named projects** instead of a single `vertical-ai-demo-studio-project` entry in `localStorage`.
  - Simple project list UI: “Recent projects”, rename, duplicate, delete.
  - Ability to switch between projects without exporting/importing JSON.

- **Shareable project bundles**
  - Export a **bundle** that includes:
    - Structured project JSON (scenes, prompts, characters, costs, metadata).
    - A manifest of **mockup** and **generated image/video** URLs (with types and roles).
  - Later iteration: option to upload media to a persistent bucket (e.g. S3/GCS/Drive connector) so collaborators see the same assets instead of expired Replicate links.
  - Import should restore:
    - Full storyboard state (including character proposals/approvals).
    - Any media whose URLs are still reachable (or downloaded and rehosted).

- **Cloud / team collaboration (future)**
  - Move from purely-local `localStorage` to an optional **server-backed project store**.
  - Each project gets a stable ID/slug so sharing a URL can load the same project for collaborators (read-only or editable).
  - Optional auth later (GitHub/Google) to support per-user project lists and permissions.

These are *not* implemented yet; they’re captured here so we can design APIs, storage (e.g. S3 vs Drive vs Railway volume), and collaboration flows in a future pass.

## Deploy (so mockup/character uploads work with Replicate)

The app needs a **public URL** so Replicate can fetch your uploaded mockup and character images. Two options:

### Option A: Railway (recommended for uploads)

The app serves uploads at `https://your-app.railway.app/api/uploads/...`. So Replicate can fetch mockup/character images from that URL when generating.

**Important:** By default Railway’s container filesystem is **ephemeral** (uploads are lost on deploy or restart). To avoid 404s when Replicate fetches your upload URLs, attach a **volume** so uploads persist:

1. **Push your code to GitHub** (if you haven’t):
   ```bash
   cd vertical-ai-demo-studio
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vertical-ai-demo-studio.git
   git push -u origin main
   ```

2. **Sign up at [railway.app](https://railway.app)** and create a new project.

3. **Deploy from GitHub:**  
   New Project → **Deploy from GitHub repo** → choose `vertical-ai-demo-studio` → Railway will detect Next.js and build it.

4. **Attach a volume (so uploads persist):**  
   In your service → **Settings** (or **Variables** tab) → **Volumes** → **Add Volume**. Mount path: `/data`.  
   Then add a variable: `RAILWAY_VOLUME_MOUNT_PATH` = `/data`.  
   Uploads are then stored on the volume and survive deploys/restarts, so Replicate can fetch them.

5. **Add your Replicate token:**  
   Open your service → **Variables** → Add variable:  
   `REPLICATE_API_TOKEN` = your token from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).

6. **Generate a domain:**  
   **Settings** → **Networking** → **Generate domain**. You’ll get a URL like `https://vertical-ai-demo-studio-production-xxxx.up.railway.app`.

7. Open that URL. Upload mockups/character images and use **Generate image** — Replicate will be able to fetch them.

**Note:** Railway may spin down free-tier apps when idle; the first request after a while can be slow. Paid plans keep the app always on.

---

### Option B: Vercel

Vercel is great for Next.js but **serverless functions don’t persist files**. The current upload route writes to `public/uploads/`, which won’t persist on Vercel. So:

- **Without changes:** You can deploy to Vercel and use the app, but **uploaded mockups/character images won’t be stored** (or will disappear). Generate image/video without uploads will still work.
- **With storage:** To make uploads work on Vercel, you’d add something like [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) and change the upload API to store files there and return a public URL. If you want to go that route, we can add Blob in a follow-up.

**Deploy to Vercel (no upload persistence):**

1. Push the project to GitHub (as in step 1 above).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import `vertical-ai-demo-studio`.
3. Under **Environment Variables**, add `REPLICATE_API_TOKEN`.
4. Deploy. You’ll get `https://vertical-ai-demo-studio-xxx.vercel.app`.

---

### After deploy

- Use the **deployed URL** (e.g. `https://your-app.railway.app`) when you use the app.
- Uploaded mockups and character reference images will have public URLs, so **Generate image** will use them with Replicate.
- No need to refresh or regenerate for deploy; just use the live site.

## MVP constraints

- No enterprise auth; runs standalone
- Local storage only; optional DB later
- One Replicate API token for Gemini (scene generation), Veo, and NanoBanana Pro

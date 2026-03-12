# Storyboard generation input spec (for GPT or other assistants)

Use this when you want another assistant (e.g. a custom GPT) to output **all inputs required** to run a storyboard generation trial in the Vertical AI Demo Studio. The studio’s “Generate scenes” flow uses these values; the user can paste or map them into the app.

---

## 1. What to ask your GPT

Ask it to produce a **Storyboard Generation Brief** in this format (and to improve the demo concept as needed):

- **Project name** (short title)
- **Video objective** (1–3 sentences: what the video should accomplish and for whom)
- **Target audience type** (one line, e.g. “Healthcare systems, health plans, maternal care programs”)
- **Audience description** (2–4 sentences: who they are, what they care about, how they’ll use the video)
- **Energy level** (integer 1–5; see table below)
- **Visual mode** (exactly one of the strings below)
- **Estimated scene count** (integer, e.g. 4–20)
- **Reference characters required** (yes or no)
- **Persona id** (exactly one of the persona ids below)
- **Mockups to prepare** (optional): list of mockup descriptions so the user knows what screens/frames to upload. The AI will then assign them to scenes; if the user has no mockups yet, the generator can still propose scenes and the user can add mockups later.

The GPT should **copy the exact labels and values** for **Energy level**, **Visual mode**, and **Persona id** from the tables below so the user can paste them into the studio without guessing.

---

## 2. Energy level (use number and label)

| Value | Label |
|-------|--------|
| 1 | Documentary stillness |
| 2 | Observational explainer |
| 3 | Premium product demo |
| 4 | Kinetic SaaS demo |
| 5 | High-energy motion-forward |

*Enterprise / healthcare demos usually use 1 or 2.*

---

## 3. Visual mode (use exact string)

- `UI-heavy with occasional B-roll`
- `Talking head + B-roll`
- `Full UI/screen capture`
- `Mixed (person + UI)`
- `Abstract/visual only`

*Enterprise / product demos often use “UI-heavy with occasional B-roll” or “Full UI/screen capture”.*

---

## 4. Persona id (use exact id)

- `doc-restraint` — Documentary Restraint (observational, restrained)
- `poetic-minimal` — Poetic Human Minimalism (human, intimate)
- `precision-tech` — Precision Tech Realism (clean tech, high fidelity)
- `design-product` — Design-Led Product Stage (Apple-style, product hero)
- `conversational-stripe` — Conversational Product Minimal (clear, friendly, no hype)
- `kinetic-saas` — Kinetic SaaS Explainer (energetic, handheld)

*Enterprise / healthcare often fits `precision-tech` or `doc-restraint`.*

---

## 5. Example brief (enterprise demo)

```text
Project name: MyLÚA Enterprise Demo — 4 Scenes

Video objective: Show healthcare systems, health plans, and maternal care programs how the platform supports maternal health at scale. The video should feel premium and documentary-style, with no UI drift or sci-fi aesthetics. Focus on: establishing context (hospital/community), population analytics, white-label platform, and brand close.

Target audience type: Healthcare systems, health plans, maternal care programs

Audience description: Enterprise decision-makers evaluating maternal health and care-between-visits solutions. They care about scalability, white-label, analytics, and trust. The video will be used in sales and partnership conversations.

Energy level: 2 — Observational explainer

Visual mode: UI-heavy with occasional B-roll

Estimated scene count: 4

Reference characters required: no

Persona id: precision-tech

Mockups to prepare (optional):
1. Aerial or establishing shot (city/hospital at sunrise) — or leave to AI to describe.
2. Desktop monitor showing maternal health analytics dashboard (charts, metrics).
3. Three phones in a row showing same app with different branding (hospital, health plan, program).
4. Minimal end card (gradient + logo/lotus).
```

---

## 6. How the user runs the trial in the studio

1. **New project** → fill in the form using the brief (name, video objective, audience, energy level, visual mode, scene count, reference characters, persona).
2. **Mockups tab** → upload images that match “Mockups to prepare” (or skip and let the generator work from descriptions).
3. **Storyboard tab** → click **Generate scenes**. The AI will return a scene list, assign mockups to scenes if mockups were uploaded, and optionally propose characters if “Reference characters required” is yes and none were added.
4. Scenes are created with nano_prompt, veo_prompt, and VO lines; mockups and proposed characters are auto-attached where applicable.

---

## 7. Optional: JSON export/import

If the studio supports loading a full project from JSON (e.g. from Export/Import), the GPT could instead output a **minimal project JSON** that includes `config`, `persona` (by reference or inline), and optionally `scenes: []`, so the user can import it and then run Generate scenes. The exact schema is in the repo (`src/types/index.ts`, `public/*.json`). For a quick trial, the brief above is enough; the user just types or pastes into the form.

# Vertical AI Demo Studio – Project brief for AI assistants

Use this document when helping a user prepare a project for **Vertical AI Demo Studio** (a vertical 9:16 demo video storyboard app). The app can **import a full project as JSON** or the user can **type in the fields** and click **Generate scenes** to have AI create the storyboard.

---

## What to collect from the user

Ask the user for the following. You can ask in conversation; they can also attach files (see Attachments below).

### 1. Project basics

| Field | Type | Notes / options |
|-------|------|------------------|
| **Project name** | text | e.g. "Q4 Product Launch Demo" |
| **Video objective** | one of: "Product onboarding", "Feature explainer", "Brand story", "Testimonial", "Tutorial", "Launch announcement", "Other" |
| **Target audience type** | text | e.g. "Product teams", "CTOs", "SMB owners" |
| **Audience description** | text (1–3 sentences) | Who they are, what they care about, what they need to see |
| **Energy level** | number 1–5 | 1 = calm/minimal, 5 = high energy/kinetic |
| **Visual mode** | one of: "UI-heavy with occasional B-roll", "Talking head + B-roll", "Full UI/screen capture", "Mixed (person + UI)", "Abstract/visual only" |
| **Estimated scene count** | number | Typically 6–15 for a short demo |
| **Reference characters required?** | Yes / No | Yes = they want consistent on-screen characters; then we need character definitions too |

### 2. Producer persona (style)

Pick **one** of these. The persona drives visual and voice style.

| Persona ID | Name | Best for |
|------------|------|----------|
| `doc-restraint` | Documentary Restraint | Observational, restrained, no flash |
| `poetic-minimal` | Poetic Human Minimalism | Human, intimate, minimal staging |
| `precision-tech` | Precision Tech Realism | Clean tech, precise, high fidelity (good for SaaS/product) |
| `design-product` | Design-Led Product Stage | Apple-style: product hero, minimal copy |
| `conversational-stripe` | Conversational Product Minimal | Stripe-style: clear, friendly, no hype |
| `kinetic-saas` | Kinetic SaaS Explainer | Energetic, handheld, dynamic |

### 3. Optional: Brand kit (for consistency)

If the user has brand guidelines, collect:

- **Logo URL** (or say “user will add logo file later”)
- **Primary font** (e.g. "Inter", "SF Pro")
- **Secondary font** (optional)
- **Color palette** (e.g. ["#3B82F6", "#1E40AF", "#FFFFFF"])

### 4. Optional: Reference characters (only if “Reference characters required = Yes”)

For each character (e.g. host, expert, customer):

- **Role label** (e.g. "Host", "Product expert")
- **NanoBanana reference prompt** (short description for AI image generation, e.g. "Professional woman, 30s, neutral expression, business casual, clean background")
- **Character anchor description** (text used to keep the character consistent across scenes)

### 5. Optional: Existing script or outline

If the user has a script, bullet list, or outline, ask them to paste it or attach it. You can use it to derive **scene count**, **VO lines**, and **on-screen text** for each scene.

---

## What the app expects (scene structure)

Each **scene** in the storyboard has:

| Field | Type | Purpose |
|-------|------|---------|
| scene_number | number | 1, 2, 3, … |
| title | text | e.g. "Hook", "Feature 1" |
| purpose | text | Why this scene exists |
| mockup_required | boolean | true = need an image (NanoBanana); false = no image |
| uses_character | boolean | true = this scene uses a reference character |
| nano_prompt | text | Prompt for image generation (9:16 vertical); empty if mockup_required is false |
| veo_prompt | text | Motion/video direction (e.g. "Static hold", "Slow pan left") |
| vo_line_1 | text | First line of voiceover |
| vo_line_2 | text | Second line of voiceover |
| on_screen_text | text | Text overlay on screen |
| audio_direction | text | e.g. "Upbeat", "Calm", "Confident" |
| estimated_cost | number | e.g. 0.15 (optional; app can calculate) |
| status | text | One of: "Draft", "In Review", "Approved", "Locked" |
| comment | text | Optional note |
| version | number | Usually 1 |

---

## Attachments the user might provide

- **Script or outline** (doc, PDF, or pasted text) – to derive scenes and VO.
- **Brand guidelines** (PDF or doc) – for brand_kit (fonts, colors, tone).
- **Reference images** – for character look or style; the app doesn’t upload images yet, but the user can describe them and you can turn that into **nano_prompt** or **anchor_description**.
- **Logo** – URL or “I’ll add later”; you can put the URL in **brand_kit.logo_url**.

---

## Output format for the AI assistant

After you have the user’s answers (and optional script/attachments), give the user **one** of the following.

### Option A: Form-style answers (for typing into the app)

Reply with a clear list they can copy from:

```
PROJECT NAME: [name]
VIDEO OBJECTIVE: [one of the options]
TARGET AUDIENCE TYPE: [their answer]
AUDIENCE DESCRIPTION: [1–3 sentences]
ENERGY LEVEL: [1–5]
VISUAL MODE: [one of the options]
ESTIMATED SCENE COUNT: [number]
REFERENCE CHARACTERS REQUIRED: [Yes/No]
PERSONA: [exact name from table, e.g. "Precision Tech Realism"]
```

If they have brand kit or characters, add those in the same style.

Then say: “In the app, go to **Project** → **Edit** (or **New project**) and fill these in. Then open **Storyboard** and click **Generate scenes** to create the full storyboard with AI.”

### Option B: Full project JSON (for Import)

If you have enough detail (including scene-by-scene VO or script), output a **single JSON object** that matches the **Project** structure below. Tell the user: “In the app, click **Import .json**, then select this file (or paste the JSON into a file and import it).”

**Project JSON shape:**

- **config**: object with id, name, video_objective, target_audience_type, audience_description, energy_level, visual_mode, estimated_scene_count, brand_kit (object), reference_characters_required (boolean), persona_id (one of the persona IDs above), created_at, updated_at (ISO date strings).
- **persona**: object with id, name, description, motion_intensity, lighting_style, ui_dominance, rhythm, voice_tone, framing_rules, color_behavior (use the persona that matches persona_id).
- **characters**: array of { id, role_label, nano_prompt, anchor_description, approved (boolean) }; can be [].
- **scenes**: array of scene objects (see scene structure above); each needs scene_number, title, purpose, mockup_required, uses_character, nano_prompt, veo_prompt, vo_line_1, vo_line_2, on_screen_text, audio_direction, estimated_cost, status ("Draft"), comment (""), version (1).
- **project_notes**: string (optional).

Use **persona_id** and **persona** from this list (exact IDs matter for the app):

- doc-restraint, poetic-minimal, precision-tech, design-product, conversational-stripe, kinetic-saas

---

## Short checklist for the user

Before generating a video, the user should have:

1. [ ] Project name and video objective  
2. [ ] Target audience (type + short description)  
3. [ ] Energy level (1–5) and visual mode  
4. [ ] Scene count and persona chosen  
5. [ ] (Optional) Script or outline  
6. [ ] (Optional) Brand kit (logo URL, fonts, colors)  
7. [ ] (If using characters) Reference character(s) with role and description  

After that, they can either **enter the project in the app and click Generate scenes** or **import a full project JSON** you provide.

# Enterprise demo — exact inputs for storyboard generation trial

Use these values in the Vertical AI Demo Studio to run the MyLÚA Enterprise storyboard generation. The brief is aligned with your Enterprise Demo Convo (4 acts: system context → member experience → care team intelligence → platform) and the GPT’s 18-scene recommendation.

---

## 1. Project (New Project form)

| Field | Value |
|-------|--------|
| **Project name** | `MyLÚA Enterprise Demo — Care Between Visits` |
| **Video objective** | *(paste the block below)* |
| **Target audience type** | `Healthcare systems, health plans, maternal care programs` |
| **Audience description** | *(paste the block below)* |
| **Energy level** | `2` (choose **2 – Observational explainer** in the dropdown) |
| **Visual mode** | `Mixed (person + UI)` (choose exactly that option) |
| **Estimated scene count** | `18` |
| **Reference characters required?** | `Yes — some scenes will show a person (add them in Characters tab)` |
| **Persona** | `precision-tech` (choose **Precision Tech Realism** in the dropdown) |

---

## 2. Video objective (paste into “In a sentence or two, what should this video do?”)

```
Create a premium enterprise sales demo that shows health plans, health systems, and maternal care programs how MyLÚA supports mothers between visits, surfaces earlier non-claims signals, equips care teams with meaningful insight, and operates as configurable maternal care infrastructure. The video should position MyLÚA as an interoperable, agentic care layer that improves maternal support without replacing existing care teams. Structure the film in four acts: (1) System context and care fragmentation, (2) Member experience and low-friction engagement, (3) Signal detection and care-team visibility, (4) Interoperability, configuration, multilingual support, and platform infrastructure. Include short chapter or transition moments between acts if the scene count allows (e.g. title cards: Member Experience, Care Team Insight, The Platform).
```

---

## 3. Audience description (paste into “Audience description” in More options)

```
Enterprise decision-makers evaluating maternal health, population health, digital health, and community care solutions. They care about earlier visibility than claims data, better care-team capacity, scalable member engagement, interoperability, multilingual support, trust, and configurable infrastructure that can adapt to different maternal care programs and populations. The video will be used in sales, partnership, and pilot conversations to show MyLÚA as between-visit care infrastructure rather than just a member-facing app.
```

---

## 4. Exact dropdown / numeric values (no typos)

- **Energy level:** `2` (Observational explainer)
- **Visual mode:** `Mixed (person + UI)`
- **Estimated scene count:** `18`
- **Reference characters required:** `Yes`
- **Persona:** **Precision Tech Realism** (id `precision-tech`)

---

## 5. Mockups to prepare (optional but recommended)

Upload these (or close matches) in the **Mockups** tab before generating so the AI can assign them to scenes. Order doesn’t matter; the model will assign by content.

1. Aerial establishing shot of hospital campus or healthcare district at sunrise  
2. Care coordination office (clinicians/care coordinators, laptops, phones, notes)  
3. Pregnant woman alone at night on couch with phone (quiet between-visit moment)  
4. MyLÚA mobile home screen (calm maternal UI)  
5. Ask-anything chat screen on mobile  
6. Local resources / support results screen on mobile  
7. Health check-in survey screen on mobile  
8. Insights / needs summary screen on mobile  
9. Activity / education screen on mobile  
10. Provider phone or desktop showing top client needs / surfaced insights  
11. Doula or provider preparing before a visit  
12. Session notes / documentation UI  
13. Scheduling / follow-up coordination UI  
14. Multi-interface workspace (member app + provider tool + chat together)  
15. Language selection screen on mobile  
16. Three branded app variants or configurable program versions (e.g. three phones)  
17. Agentic platform architecture (central platform node + modular agent blocks)  
18. Minimal end card (lotus logo + gradient background)  

You don’t need all 18 to run the trial. With fewer mockups, the generator will still create 18 scenes and assign mockups where they fit; other scenes will get nano_prompts only.

---

## 6. How to run the trial

1. **Project tab** → New project (or edit existing).  
   Fill in **Project name**, **Video objective**, **Audience description**, and open **More options** to set **Target audience type**, **Visual mode**, **Reference characters required**, **Persona**. Set **Energy level** and **Estimated scene count** (18). Save.

2. **Mockups tab** → Upload as many of the mockups above as you have (or skip and generate from prompts only).

3. **Characters tab** → Leave empty if you want the generator to **propose** a character (e.g. mom) and auto-attach to member-experience scenes. Or add one reference character and upload a photo if you already have one.

4. **Storyboard tab** → Click **Generate scenes**.  
   The AI will return ~18 scenes with nano_prompt, veo_prompt, and VO lines; it will assign mockups to scenes where you uploaded them and, if you left characters empty, may propose a character and set `character_id` on relevant scenes.

5. Review and edit scenes (and proposed character prompts) as needed.

---

## 7. Note on transition / chapter cards

Your Enterprise Demo Convo used **3 transition cards** (Member Experience, Care Team Insight, The Platform) between acts. The video objective above asks the generator to “include short chapter or transition moments between acts if the scene count allows.” So the model may output 18 scenes that include 2–3 title-card-style scenes, or you can raise **Estimated scene count** to **20** and paste the same objective so it has room for three explicit transition beats. Either way, the same form inputs above apply; only the number is 18 vs 20.

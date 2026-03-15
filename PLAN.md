# POC Ressource IA — Suivi & Cadrage

## Contexte

POC basé sur le PRD "CONTENT V2 — La Ressource IA" (voir `prd_ai_content.md`).
Objectif : valider le concept end-to-end avec les 5 formats de consommation.

---

## Stack technique

| Composant | Choix |
|---|---|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19 + Tailwind CSS 4 |
| LLM | Claude API (Anthropic SDK) |
| Base de données | SQLite via Prisma |
| Extraction PDF | pdf-parse |
| Validation | Zod |
| Animations | Framer Motion |
| UI Kit | shadcn/ui |

---

## Périmètre POC

### Inclus

- Flow créateur : Upload PDF → Analyse IA → Objectif → Génération → Preview
- Flow enrollee : Sélecteur de format → Consommation → Navigation entre formats → Complétion
- 5 formats : Synthèse, Flashcards, Chat questionneur, Module structuré, Mises en situation
- Contenu JSON structuré pour chaque format
- Chat streaming en temps réel avec Claude
- Mobile-first responsive

### Exclus (hors POC)

- Authentification / SSO
- Extensions (rappels, questionnaire, email, défi, attestation, connexion)
- Analytics / dashboard
- Multi-documents (1 PDF par ressource)
- Intégration HeyTeam (API, webhooks)
- Déploiement production

---

## Modèle de données

```
Resource
├── id, title, description
├── pdfPath, extractedText
├── analysis (JSON)
├── objective
├── tone, language
├── enabledFormats (JSON array)
├── status (draft | generated | published)
└── createdAt, updatedAt

FormatContent
├── id, resourceId, format
├── content (JSON structuré)
└── version

ConsumptionSession
├── id, resourceId
├── currentFormat, completed
├── progress (JSON)
└── startedAt, completedAt
```

---

## Routes API

| Route | Méthode | Description |
|---|---|---|
| `/api/resources` | GET | Liste des ressources |
| `/api/resources` | POST | Créer une ressource (upload PDF) |
| `/api/resources/[id]` | GET | Détail d'une ressource |
| `/api/resources/[id]` | PATCH | Mise à jour métadonnées |
| `/api/resources/[id]` | DELETE | Suppression |
| `/api/resources/[id]/analyze` | POST | Extraction PDF + analyse IA |
| `/api/resources/[id]/generate` | POST | Génération contenu par format |
| `/api/resources/[id]/complete` | POST | Marquer comme complété |
| `/api/chat` | POST | Chat streaming (Claude) |

---

## Pages / Routes frontend

| Route | Rôle |
|---|---|
| `/` | Landing / redirection |
| `/creator` | Dashboard créateur (liste des ressources) |
| `/creator/new` | Wizard création (5 étapes) |
| `/creator/[resourceId]` | Édition / preview |
| `/consume/[resourceId]` | Sélecteur de format |
| `/consume/[resourceId]/[format]` | Renderer du format choisi |

---

## Phases d'implémentation

### Phase A — Bootstrap projet
- [ ] Init Next.js 15 + TypeScript + Tailwind
- [ ] Setup Prisma + SQLite + schema
- [ ] Installer dépendances (Anthropic SDK, pdf-parse, zod, framer-motion)
- [ ] Configurer shadcn/ui
- [ ] Layout de base (Header, container mobile-first)
- [ ] `.env.local` avec `ANTHROPIC_API_KEY`

### Phase B — Creator flow : Upload & Analyse
- [ ] API upload PDF (POST `/api/resources`)
- [ ] Extraction texte PDF (pdf-parse)
- [ ] API analyse IA (POST `/api/resources/[id]/analyze`)
- [ ] UI wizard : UploadStep → AnalysisStep → ObjectiveStep

### Phase C — Génération de contenu
- [ ] Prompts de génération par format (synthèse, flashcards, module, scénarios)
- [ ] Schemas JSON Zod pour chaque format
- [ ] API génération (POST `/api/resources/[id]/generate`)
- [ ] UI wizard : GenerateStep → PreviewStep

### Phase D — Renderers de formats
- [ ] SyntheseRenderer (sections + points clés)
- [ ] FlashcardsRenderer (flip animation, progression)
- [ ] ModuleRenderer (steps leçons/quiz, progression)
- [ ] ScenariosRenderer (narration + choix branchés)
- [ ] FormatSelector (grille de sélection)
- [ ] FormatNav (barre navigation entre formats)

### Phase E — Chat questionneur
- [ ] API streaming chat (POST `/api/chat`)
- [ ] ChatRenderer (messages + input + streaming)
- [ ] System prompt Socratique basé sur le document + objectif

### Phase F — Flow enrollee complet
- [ ] Page sélecteur de format (`/consume/[id]`)
- [ ] Page renderer (`/consume/[id]/[format]`)
- [ ] Navigation entre formats (état conservé)
- [ ] Bouton "J'ai terminé" + écran complétion
- [ ] Tracking session de consommation

### Phase G — Polish
- [ ] Responsive mobile-first pass
- [ ] Loading states et gestion d'erreurs
- [ ] Empty states
- [ ] Dashboard créateur (liste, statuts, actions)

---

## Formats JSON — Structures cibles

### Synthèse
```json
{
  "title": "string",
  "duration": "1-2 min",
  "sections": [
    { "heading": "string", "content": "string", "keyPoints": ["string"] }
  ],
  "takeaways": ["string"]
}
```

### Flashcards
```json
{
  "title": "string",
  "cards": [
    { "id": 1, "question": "string", "answer": "string", "hint": "string", "difficulty": "easy|medium|hard" }
  ]
}
```

### Module structuré
```json
{
  "title": "string",
  "estimatedDuration": "string",
  "steps": [
    { "id": 1, "type": "lesson", "title": "string", "content": "string" },
    { "id": 2, "type": "quiz", "question": "string", "options": [
      { "label": "string", "correct": true, "explanation": "string" }
    ]}
  ]
}
```

### Mises en situation
```json
{
  "title": "string",
  "context": "string",
  "steps": [
    { "id": "step-1", "narrative": "string", "choices": [
      { "label": "string", "nextStepId": "step-2", "feedback": "string", "quality": "optimal|acceptable|poor" }
    ]}
  ],
  "conclusion": "string"
}
```

### Chat (dynamique)
Pas de JSON pré-généré. Streaming Claude en temps réel avec system prompt construit à partir du texte extrait + objectif pédagogique.

---

## Risques & Mitigations

| Risque | Mitigation |
|---|---|
| JSON mal formé par Claude | Validation Zod + retry avec erreur dans le prompt |
| Extraction PDF de mauvaise qualité | Afficher le texte extrait au créateur, permettre l'édition |
| PDF trop gros (dépassement contexte) | Troncature à ~80k tokens + avertissement |
| Génération lente (5 formats) | Progression par format, possibilité d'en générer moins |
| Coût chat (appels par message) | Acceptable pour POC |

---

## Décisions techniques

1. **Pas d'auth** — Routes ouvertes, utilisateur unique assumé
2. **PDF stocké localement** — `public/uploads/` (S3 en prod)
3. **Génération séquentielle** — Un appel Claude par format (pas de parallélisme pour éviter rate limits)
4. **Chat éphémère** — Pas de FormatContent stocké, conversation côté client
5. **Tout en français** — UI et contenu généré en FR par défaut
6. **Validation stricte** — Zod sur tous les outputs Claude avant stockage

---

## Changelog

| Date | Entrée |
|---|---|
| 15/03/2026 | Création du plan POC. Stack : Next.js + Claude API + SQLite. 5 formats, 7 phases. |

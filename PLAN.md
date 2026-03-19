# Plan d'implémentation — Agent IA (V1 Demo)

> Basé sur `AGENT_STUDIO_SPEC.md` + décisions de cadrage session Q&A.

## Décisions de cadrage

| Aspect | Décision |
|---|---|
| Navigation | 1 entrée "Agent IA" tout en haut de la sidebar (sous Retour au menu) |
| Structure | Page unique avec 3 onglets : Bibliothèque \| Cockpit \| Historique |
| Agents templates | 11 (6 Skills RH + 5 Skills Managers) |
| Création custom | Chat guidé avec Claude (conversationnel) |
| Personnaliser suggestion | Panel inline (pas de modale) — Qui / Quoi / Quand |
| Données | Mockées : table Employee seedée + suggestions pré-générées |
| Suggestions IA | Générées dynamiquement via Claude API |
| Actions validation | Toutes simulées (email, tâche, meeting) avec log |
| Notifications | Pas de notif push, consultation libre |
| Historique | Onglet dédié complet (validées, personnalisées, ignorées) |

---

## Phase 1 — Fondations (Schema + Types + Navigation)

### 1.1 Schema Prisma
- Ajouter modèle `Employee` (données mock RH)
- Ajouter modèle `Agent` (config agent, basé sur spec existante)
- Ajouter modèle `Suggestion` (basé sur spec existante)
- Ajouter modèle `ActionLog` (trace des actions simulées)
- `prisma db push`

### 1.2 Types TypeScript
- Reprendre les types de la spec `AGENT_STUDIO_SPEC.md`
- Ajouter types Employee, ActionLog
- Ajouter metadata constants + 11 AGENT_TEMPLATES

### 1.3 Navigation Sidebar
- Ajouter "Agent IA" (icône Bot) en PREMIÈRE position dans NAV_ITEMS
- Route : `/creator/agent`

---

## Phase 2 — API Routes

### 2.1 CRUD Agents
- `GET/POST /api/agents`
- `GET/PUT/DELETE /api/agents/[id]`
- `POST /api/agents/[id]/activate`
- `POST /api/agents/[id]/pause`

### 2.2 Suggestions
- `GET /api/agents/suggestions` (filtres: status, agentId, severity)
- `PUT /api/agents/suggestions/[id]` (valider/ignorer/personnaliser)
- `GET /api/agents/suggestions/stats` (KPI cockpit)

### 2.3 Génération IA
- `POST /api/agents/[id]/generate` — Claude génère suggestions depuis config agent + données Employee
- `POST /api/agents/chat` — Chat streaming pour création agent custom

### 2.4 Seed
- `POST /api/seed/agents` — 11 templates + ~15 employés + ~20 suggestions

---

## Phase 3 — Pages & Composants

### 3.1 Page principale (`/creator/agent/page.tsx`)
- 3 onglets : Bibliothèque | Cockpit | Historique
- Onglet par défaut : Cockpit

### 3.2 Onglet Bibliothèque
- `AgentLibrary.tsx` — Grille cartes + filtres catégorie
- `AgentCard.tsx` — Icône, nom, trigger, toggle actif
- `AgentDetail.tsx` — Config détaillée (slide-in ou section)
- `AgentCreationChat.tsx` — Chat guidé Claude pour création custom
- Bouton "+ Créer un agent"

### 3.3 Onglet Cockpit
- `SuggestionsCockpit.tsx` — Feed + filtres + KPI sidebar
- `SuggestionCard.tsx` — Sévérité, titre, employé, actions rapides
- `SuggestionCustomize.tsx` — Panel inline (qui/quoi/quand)
- Bouton "Générer suggestions" (appel Claude)

### 3.4 Onglet Historique
- `SuggestionsHistory.tsx` — Tableau complet des suggestions traitées
- Filtres : statut, agent, période
- Détail au clic

---

## Phase 4 — Prompts Claude

### 4.1 Génération de suggestions
- System prompt : config agent + données employés → JSON suggestions structurées

### 4.2 Chat création agent
- System prompt conversationnel guidant en 3-4 échanges

---

## Phase 5 — Seed & Polish

### 5.1 Seed complet
- 15 employés fictifs variés
- 11 agents templates configurés
- 20+ suggestions réalistes (mix statuts)
- Logs d'actions pour les validées

### 5.2 Polish
- Animations Framer Motion
- Responsive mobile
- Edge cases

---

## Ordre d'exécution

| # | Tâche | Fichiers |
|---|-------|----------|
| 1 | Schema Prisma + db push | `prisma/schema.prisma` |
| 2 | Types TypeScript | `src/types/index.ts` |
| 3 | Sidebar navigation | `src/components/shared/Sidebar.tsx` |
| 4 | API CRUD agents | `src/app/api/agents/**` |
| 5 | API suggestions | `src/app/api/agents/suggestions/**` |
| 6 | Seed données | `src/app/api/seed/agents/route.ts` |
| 7 | Page principale + onglets | `src/app/creator/agent/page.tsx` |
| 8 | Bibliothèque (cartes + détail) | `src/components/agent/AgentLibrary.tsx` etc. |
| 9 | Cockpit (feed + actions) | `src/components/agent/SuggestionsCockpit.tsx` etc. |
| 10 | Personnalisation inline | `src/components/agent/SuggestionCustomize.tsx` |
| 11 | Historique | `src/components/agent/SuggestionsHistory.tsx` |
| 12 | Prompts + génération IA | `src/lib/prompts/agent-*.ts` |
| 13 | Chat création agent | `src/components/agent/AgentCreationChat.tsx` |
| 14 | Polish UX | Tous |

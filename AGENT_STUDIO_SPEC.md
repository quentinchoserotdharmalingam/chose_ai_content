# Agent Studio — Spécification technique (V1 Demo)

## Vision produit

L'Agent Studio est un **cockpit IA pour les processus RH**. Un utilisateur configure des agents qui surveillent son activité RH et remontent des suggestions d'actions. L'objectif de cette V1 est une **démo réaliste et simple**.

### Parcours utilisateur

1. **Bibliothèque d'agents** — Je parcours les agents templates disponibles et j'en active/configure selon mes besoins
2. **Configuration simple** — Pour chaque agent : Quand il se déclenche + Quelle info il remonte + Quelle action il suggère (assisté par IA)
3. **Vue globale** — Je vois mes agents configurés, leur statut, un résumé
4. **Cockpit de contrôle** — Feed central de toutes les remontées, je consulte les détails, je valide ou ignore les actions suggérées

---

## 1. Modèle de données (Prisma)

### 1.1 `Agent`

```prisma
model Agent {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  icon        String   @default("🤖")
  color       String   @default("#3B82F6")

  // Classification
  category    String   @default("skill_rh")  // "skill_rh" | "skill_manager" | "custom"

  // Configuration simple
  triggerType   String                        // "event" | "scheduled"
  triggerLabel  String                        // Label humain du déclencheur (ex: "Document(s) non complété(s) après N jours")
  triggerConfig String  @default("{}") @db.Text  // JSON — paramètres du trigger

  // Ce que l'agent remonte
  infoDescription String? @db.Text           // Description de l'information remontée

  // Actions suggérées
  actions     String   @default("[]") @db.Text  // JSON array d'actions
  // [{ "id": 1, "label": "Envoyer un rappel au collaborateur", "enabled": true }]

  // État
  status      String   @default("draft")     // "draft" | "active" | "paused"

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  suggestions Suggestion[]
}
```

### 1.2 `Suggestion` — Remontée d'un agent

```prisma
model Suggestion {
  id        String   @id @default(cuid())
  agentId   String

  // Affichage
  severity  String                            // "urgent" | "attention" | "opportunity" | "optimization"
  category  String                            // "onboarding" | "documents" | "engagement" | "management"
  title     String
  summary   String   @db.Text

  // Détail (JSON)
  context       String   @db.Text            // JSON — infos contextuelles (employé, situation...)
  actionPlan    String   @db.Text            // JSON — [{ id, label, detail? }]
  alternatives  String   @default("[]") @db.Text  // JSON — actions alternatives
  preview       String?  @db.Text            // Markdown — prévisualisation document

  // État
  status    String   @default("pending")      // "pending" | "accepted" | "customized" | "ignored"
  resolvedAt DateTime?

  createdAt DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
}
```

> **Pas de modèle AgentTestRun** — Le test est hors scope V1.

---

## 2. Types TypeScript

Ajout dans `src/types/index.ts` :

```typescript
// --- Agent Studio ---

export type AgentCategory = "skill_rh" | "skill_manager" | "custom";
export type AgentTriggerType = "event" | "scheduled";
export type AgentStatus = "draft" | "active" | "paused";

export type SuggestionSeverity = "urgent" | "attention" | "opportunity" | "optimization";
export type SuggestionStatus = "pending" | "accepted" | "customized" | "ignored";

export interface AgentAction {
  id: number;
  label: string;
  enabled: boolean;
}

export interface SuggestionContext {
  employeeName: string;
  employeeRole?: string;
  department?: string;
  contractType?: string;
  startDate?: string;
  team?: string;
  additionalInfo?: Record<string, string>;
}

export interface SuggestionActionStep {
  id: number;
  label: string;
  detail?: string;
}

export interface SuggestionAlternative {
  label: string;
  description?: string;
}

export interface AgentImpactStats {
  timeSavedMinutes: number;
  actionsValidated: number;
  totalActions: number;
  acceptanceRate: number;
}

// Métadonnées pour les catégories d'agents
export const AGENT_CATEGORY_META: Record<AgentCategory, { label: string; description: string }> = {
  skill_rh: { label: "Skills RH", description: "Agents pour les équipes RH" },
  skill_manager: { label: "Skills Managers", description: "Agents pour les managers" },
  custom: { label: "Custom", description: "Agents personnalisés" },
};

export const SUGGESTION_SEVERITY_META: Record<SuggestionSeverity, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgent", color: "#DC2626", bgColor: "#FEF2F2" },
  attention: { label: "Attention", color: "#D97706", bgColor: "#FFFBEB" },
  opportunity: { label: "Opportunité", color: "#2563EB", bgColor: "#EFF6FF" },
  optimization: { label: "Optimisation", color: "#7C3AED", bgColor: "#F5F3FF" },
};

export const SUGGESTION_CATEGORY_META: Record<string, { label: string; icon: string }> = {
  onboarding: { label: "Onboarding", icon: "🚀" },
  documents: { label: "Documents", icon: "📄" },
  engagement: { label: "Engagement", icon: "💪" },
  management: { label: "Management", icon: "👔" },
  formation: { label: "Formation", icon: "📚" },
  administratif: { label: "Administratif", icon: "📋" },
};
```

---

## 3. Agents templates (seed)

11 agents pré-construits, organisés en 2 catégories :

### Skills RH

| # | Nom | Icône | Déclencheur | Info remontée | Actions |
|---|-----|-------|-------------|---------------|---------|
| 1 | Rappel message de bienvenue | 👋 | event: Nouveau collaborateur détecté | Collaborateur sans message de bienvenue envoyé | 1. Envoyer message de bienvenue 2. Notifier le manager |
| 2 | Rappel documents incomplets | 📄 | event: Document(s) non complété(s) après N jours | Liste des pièces manquantes par collaborateur | 1. Relancer le collaborateur 2. Notifier le RH référent |
| 3 | Alerte satisfaction onboarding | 📊 | event: Score de satisfaction bas détecté | Score NPS < seuil et verbatims négatifs | 1. Alerter le RH 2. Suggérer un entretien |
| 4 | Détection inactivité manager | 👤 | event: Manager inactif depuis N jours | Manager n'ayant réalisé aucune action depuis X jours | 1. Notifier le manager 2. Planifier un meeting |
| 5 | Rapport hebdomadaire RH | 📈 | scheduled: Chaque lundi | Synthèse hebdomadaire de l'activité RH | 1. Générer le rapport 2. Envoyer au RH |
| 6 | Vérification pré-onboarding | ✅ | event: Onboarding dans < 7 jours | Checklist des éléments manquants avant arrivée | 1. Vérifier les documents 2. Alerter si incomplet |

### Skills Managers

| # | Nom | Icône | Déclencheur | Info remontée | Actions |
|---|-----|-------|-------------|---------------|---------|
| 7 | Dashboard équipe | 📊 | scheduled: Quotidien | État global de l'équipe (onboarding, tâches, engagement) | 1. Afficher métriques 2. Alerter si anomalie |
| 8 | Rappel check-in | 🔔 | event: Check-in approche (J-2) | Prochain check-in planifié avec contexte | 1. Notifier le manager 2. Proposer un créneau |
| 9 | Suivi engagement | 💚 | scheduled: Hebdomadaire | Score d'engagement et tendance par collaborateur | 1. Analyser activité 2. Envoyer rapport 3. Alerter si engagement < seuil |
| 10 | Nudge tâches en retard | ⚠️ | event: Tâche en retard détectée | Tâches non complétées après deadline | 1. Rappeler le collaborateur 2. Notifier le manager |
| 11 | Alerte buddy inactif | 🤝 | event: Buddy inactif depuis N jours | Buddy n'ayant pas interagi avec le nouveau | 1. Alerter le buddy 2. Notifier le RH |

---

## 4. Suggestions seed (données mockées)

~15-20 suggestions réalistes pré-remplies, réparties sur les différents agents et niveaux de sévérité :

**Exemples :**

1. **URGENT / Onboarding** — "Julie Mercier - Arrivée dans 3 jours" : Aucun manager assigné, risque d'arrivée sans référent. Actions : Assigner un manager, Proposer un buddy.

2. **URGENT / Documents** — "Karim Benali - Premier jour aujourd'hui" : Dossier administratif incomplet, 3 pièces manquantes (RIB, Attestation sécu, Carte vitale). Actions : Relancer le salarié, Voir les pièces.

3. **ATTENTION / Engagement** — "Sarah Dubois - Arrivée il y a 5 jours" : Aucune connexion à la plateforme détectée. Actions : Envoyer un rappel, Notifier le manager.

4. **OPPORTUNITY / Management** — "Équipe Commercial (15 pers.)" : 3 fins de période d'essai cette semaine, bilans non planifiés. Actions : Planifier les bilans, Générer les documents.

5. **OPTIMIZATION / Formation** — "12 collaborateurs onboardés ce mois" : Taux de complétion formation à 45%. Actions : Envoyer des rappels ciblés, Proposer des formats courts.

*(+ 10-15 autres suggestions variées)*

---

## 5. Routes

### 5.1 Pages

```
/creator/agent                          → Bibliothèque d'agents (liste + vue globale)
/creator/agent/new                      → Configuration assistée IA (création/édition)
/creator/agent/[id]                     → Détail/configuration d'un agent existant
/creator/agent/suggestions              → Cockpit de contrôle (feed des remontées)
```

### 5.2 API Routes

```
GET    /api/agents                      → Liste des agents (filtres: category, status)
POST   /api/agents                      → Créer un agent
GET    /api/agents/[id]                 → Détail
PUT    /api/agents/[id]                 → Modifier
DELETE /api/agents/[id]                 → Supprimer
POST   /api/agents/[id]/activate        → Activer
POST   /api/agents/[id]/pause           → Mettre en pause
POST   /api/agents/[id]/duplicate       → Dupliquer

GET    /api/agents/suggestions           → Liste suggestions (filtres: severity, status, agentId)
PUT    /api/agents/suggestions/[id]      → Changer statut (accept/ignore/customize)
GET    /api/agents/suggestions/stats     → KPI cockpit

POST   /api/seed/agents                 → Seed agents templates + suggestions
```

---

## 6. Composants React

```
src/components/agent/
├── AgentLibrary.tsx              # Page bibliothèque : sidebar catégorisée + welcome/détail
├── AgentCard.tsx                 # Card agent dans la sidebar (icône, nom, statut, trigger)
├── AgentDetail.tsx               # Vue détail : sections collapsibles (trigger, actions, params)
├── AgentPreviewPanel.tsx         # Panneau latéral "Aperçu de l'agent" (visuel + JSON)
├── AgentConfigForm.tsx           # Formulaire config assisté IA (prompt → suggestions)
├── SuggestionsDashboard.tsx      # Cockpit : feed central + sidebar KPI
├── SuggestionCard.tsx            # Card suggestion (sévérité, titre, résumé, actions rapides)
├── SuggestionDetailModal.tsx     # Modal détail (contexte, plan d'actions, alternatives, preview)
├── SuggestionFilters.tsx         # Onglets filtres (Toutes, Urgentes, Opportunités, etc.)
└── ImpactSidebar.tsx             # Sidebar droite KPI (temps économisé, taux acceptation)
```

---

## 7. Configuration assistée IA

Au lieu d'un wizard rigide en 3 étapes, la configuration d'un agent (création ou édition) est **assistée par IA** :

1. L'utilisateur choisit un template OU décrit ce qu'il veut en texte libre
2. L'IA pré-remplit la configuration (trigger, info remontée, actions) basée sur le template ou la description
3. L'utilisateur ajuste les paramètres dans un formulaire simple avec les sections :
   - **Déclencheur** — Quand l'agent se déclenche (dropdown + paramètres)
   - **Information remontée** — Ce que l'agent détecte et remonte (textarea pré-rempli)
   - **Actions suggérées** — Liste d'actions avec toggles on/off (pré-remplies par l'IA)
4. L'utilisateur active l'agent

> **Note :** Pour la V1, l'IA ne génère pas dynamiquement — les templates fournissent les valeurs par défaut. L'aide IA est "simulée" via les pré-remplissages intelligents des templates.

---

## 8. Détail des écrans

### 8.1 Bibliothèque (`/creator/agent`)

Layout master-detail inspiré des maquettes :
- **Sidebar gauche** : Logo "Agent Studio", barre de recherche, filtres (Tous les profils / Tous les types), liste des agents par catégorie (Skills RH ▸ Skills Managers), bouton "Créer un agent custom"
- **Zone principale** :
  - Si aucun agent sélectionné : écran d'accueil "Bienvenue dans Agent Studio" avec conseils et CTA
  - Si agent sélectionné : vue détail avec Déclencheur + Actions + Paramètres + panneau Aperçu à droite
- **Couleur dominante** : bleu (#3B82F6) au lieu du rouge HeyTeam

### 8.2 Détail agent (`/creator/agent/[id]`)

Sections collapsibles :
- **Déclencheur** — Badge type (EVENT/SCHEDULED) + label + configuration
- **Actions** — Liste numérotée avec toggle on/off par action
- **Paramètres avancés** — Spécifiques au type d'agent (ex: documents concernés, délais, seuils)
- **Panneau aperçu** (droite) — Vue "Visuel" (flowchart simplifié) + vue "JSON"
- **Boutons** : "Activer l'agent" / "Mettre en pause"

### 8.3 Cockpit suggestions (`/creator/agent/suggestions`)

- **Header** : "Suggestions" + sous-titre + compteur
- **Onglets** : Toutes (N) | Urgentes (N) | Opportunités (N) | Optimisations (N) | Ignorées
- **Feed** : Liste de SuggestionCard triées par date/sévérité
- **Chaque card** : Badge sévérité + catégorie, nom employé + contexte, boutons d'action rapide
- **Sidebar droite** : "Votre impact aujourd'hui" (temps économisé, actions validées, taux d'acceptation) + "À venir cette semaine"
- **Modal détail** : Contexte complet, "Ce que je vais faire" (plan numéroté), prévisualisation document, actions alternatives, boutons Valider/Personnaliser/Ignorer, lien "Pourquoi cette suggestion ?"

---

## 9. Navigation

Ajout dans `Sidebar.tsx` (après "Interview IA") :

```typescript
{ href: "/creator/agent", label: "Agent IA", icon: Bot },
```

Avec `isActive` couvrant `/creator/agent` et ses sous-routes (y compris `/creator/agent/suggestions`).

---

## 10. Plan d'implémentation

### Phase 1 — Fondations
1. Schema Prisma (Agent + Suggestion) + `prisma db push`
2. Types TypeScript dans `src/types/index.ts`
3. Navigation Sidebar (ajout Agent IA)

### Phase 2 — Bibliothèque d'agents
4. API CRUD agents (`/api/agents`)
5. Route seed (`/api/seed/agents`) — 11 templates + données démo
6. Page bibliothèque (`/creator/agent/page.tsx`) — Layout master-detail
7. Composants : AgentLibrary, AgentCard

### Phase 3 — Détail & Configuration
8. Page détail (`/creator/agent/[id]/page.tsx`)
9. Composants : AgentDetail, AgentPreviewPanel
10. API activate/pause/duplicate
11. Page création (`/creator/agent/new`) + AgentConfigForm

### Phase 4 — Cockpit de contrôle
12. API suggestions (list + update + stats)
13. Seed suggestions (~15-20 suggestions réalistes)
14. Page cockpit (`/creator/agent/suggestions/page.tsx`)
15. Composants : SuggestionsDashboard, SuggestionCard, SuggestionFilters, ImpactSidebar
16. SuggestionDetailModal (contexte, actions, alternatives, valider/ignorer/personnaliser)

---

## 11. Points d'attention

- **Données statiques** — Suggestions pré-seedées, pas de génération IA dynamique pour la V1
- **Pas de test d'agent** — Fonctionnalité hors scope V1
- **Pas d'auth** — Comme le reste du POC
- **Pas d'exécution réelle** — Les actions sont simulées (changement de statut uniquement)
- **Design** — Thème bleu (#3B82F6) pour Agent Studio, réutilisation des composants UI existants
- **Mobile** — Responsive comme le reste de l'app (sidebar collapse sur mobile)
- **Performance** — Les suggestions sont chargées côté client, pagination si > 50 items

# Interview IA — Spécifications

## Vue d'ensemble

Agent conversationnel IA intégré à HeyTeam pour mener des entretiens adaptatifs avec les collaborateurs (onboarding, satisfaction, rétention). Format chat interactif avec relances contextuelles basées sur les réponses. Analyse automatique post-entretien avec structure configurable. MVP aligné sur le besoin client LPCr.

## Positionnement dans l'application

- **Nouveau type de ressource** distinct de Content, avec son propre workflow de création
- Pas de lien direct avec les formats Content (synthèse, flashcards, chat, module, scénarios)
- Déclenchable à terme depuis les **extensions** (comme email, questionnaire, etc.)
- Pour le POC : accès par **lien direct** uniquement (`/interview/[id]`)

---

## Configuration créateur (admin/RH)

### Paramètres généraux

| Paramètre | Description | Obligatoire |
|---|---|---|
| **Titre** | Nom de l'entretien (ex: "Suivi d'intégration M+1") | Oui |
| **Description** | Description interne pour l'admin | Non |
| **Thème** | Onboarding, satisfaction, rétention, ou custom | Oui |
| **Ton** | Bienveillant, formel, direct, décontracté | Oui |

### Périmètre de l'entretien

| Zone | Description | Exemple |
|---|---|---|
| **Zone verte** (scopeIn) | Sujets à explorer, dans le périmètre | "Intégration équipe, relation manager, charge de travail, outils" |
| **Zone rouge** (scopeOut) | Sujets hors périmètre, à éviter | "Rémunération, politique d'entreprise, collègues nommément" |

### Questions structurantes

- **Questions d'ancrage** : questions fixes posées en début d'entretien pour cadrer (ex: "Sur une échelle de 1 à 10, comment évaluez-vous votre intégration ?")
- **Questions de passage** : questions fixes à poser à des moments clés de l'entretien, pas nécessairement au début (ex: "Avez-vous identifié un point bloquant dans vos premiers projets ?")
- Toutes optionnelles — l'IA peut mener l'entretien de façon 100% adaptative si aucune question n'est configurée

### Limites

| Paramètre | Description | Défaut |
|---|---|---|
| **Durée cible** | Durée estimée de l'entretien en minutes | 15 min |
| **Nombre max de questions** | Limite haute de questions posées par l'IA | 25 |

### Structure d'analyse (configurable)

L'administrateur configure les dimensions d'analyse souhaitées. L'IA suggère une structure par défaut adaptée au thème choisi.

Exemples de dimensions configurables :
- Score de satisfaction (1-10)
- Score de risque de départ (faible/moyen/élevé)
- Thèmes positifs identifiés
- Thèmes négatifs / points d'alerte
- Suggestions d'amélioration
- Verbatim clés
- Indicateurs custom

---

## Déroulement de l'entretien

### Schéma type

```
1. Accueil       → Message d'introduction contextuel
2. Ancrage       → Questions d'ancrage (si configurées)
3. Exploration   → Relances adaptatives basées sur les réponses
4. Passages      → Questions de passage intercalées au bon moment
5. Clôture       → Synthèse orale + remerciement
```

### Règles de l'agent IA

- Pose **une question à la fois**
- **Creuse en profondeur** un sujet avant de passer au suivant (pas de liste déroulante)
- Respecte le **périmètre** (zone verte/rouge)
- Adapte le **ton** configuré tout au long de l'échange
- Respecte les **limites** (durée/nombre de questions)
- Intercale les **questions de passage** au moment pertinent
- Amorce la **clôture** quand les limites approchent

### Interactions collaborateur

- Le collaborateur peut **répondre librement** (format chat)
- Le collaborateur peut **clôturer manuellement** l'entretien à tout moment
- Le collaborateur peut **quitter et reprendre** plus tard (messages persistés en base)
- V1 : entretien **lié à l'identité** du collaborateur (pas anonyme)

---

## Analyse post-entretien

- Générée **après clôture** de l'entretien (pas en temps réel)
- Basée sur l'intégralité du verbatim de la conversation
- **Structure configurable** par l'administrateur à la création de la ressource
- L'IA **suggère** la structure d'analyse adaptée au thème lors de la configuration

### Contenu de l'analyse

- **Résumé structuré** (JSON) selon le template configuré
- **Analyse brute** (texte complet généré par l'IA)
- **Verbatim complet** consultable (tous les messages de la conversation)

### Visibilité

- V1 : visible uniquement par l'**administrateur** (créateur de la ressource)
- À terme : choix du rôle destinataire (manager, RH, etc.)

---

## Données d'entrée IA

### V1

- **Paramétrage textuel** : thème, ton, périmètre, questions structurantes
- **Questions d'ancrage** optionnelles
- Pas d'injection automatique de données collaborateur

### Futur (post-V1)

- Injection automatique des **infos collaborateur** depuis la plateforme HeyTeam (poste, équipe, manager, date d'arrivée, ancienneté)
- Enrichissement avec **signaux HeyTeam** (engagement, complétion parcours, etc.)

---

## Architecture technique

### Modèle de données

```
InterviewResource (configuration de l'entretien)
├── id                    String    @id @default(cuid())
├── title                 String
├── description           String?
├── theme                 String                          // "onboarding" | "satisfaction" | "retention" | custom
├── tone                  String    @default("bienveillant")
├── scopeIn               String?   @db.Text              // Zone verte — sujets à explorer (texte libre)
├── scopeOut              String?   @db.Text              // Zone rouge — sujets hors périmètre (texte libre)
├── anchorQuestions       String    @default("[]")        // JSON — questions d'ancrage
├── checkpointQuestions   String    @default("[]")        // JSON — questions de passage
├── targetDurationMinutes Int       @default(15)
├── maxQuestions          Int       @default(25)
├── analysisTemplate      String?   @db.Text              // JSON — structure d'analyse configurable
├── status                String    @default("draft")     // "draft" | "published"
├── createdAt             DateTime  @default(now())
├── updatedAt             DateTime  @updatedAt
└── Relations: sessions[]

InterviewSession (un entretien par collaborateur)
├── id                    String    @id @default(cuid())
├── interviewResourceId   String
├── participantName       String?                         // Nom du collaborateur
├── status                String    @default("in_progress") // "in_progress" | "completed" | "abandoned"
├── startedAt             DateTime  @default(now())
├── completedAt           DateTime?
└── Relations: messages[], analysis?

InterviewMessage (persistence de la conversation)
├── id                    String    @id @default(cuid())
├── sessionId             String
├── role                  String                          // "user" | "assistant"
├── content               String    @db.Text
├── isAnchorQuestion      Boolean   @default(false)
├── isCheckpoint          Boolean   @default(false)
├── createdAt             DateTime  @default(now())

InterviewAnalysis (synthèse post-entretien)
├── id                    String    @id @default(cuid())
├── sessionId             String    @unique
├── summary               String    @db.Text              // JSON structuré selon analysisTemplate
├── rawAnalysis           String    @db.Text              // Texte complet de l'analyse IA
├── createdAt             DateTime  @default(now())
```

### Routes API

```
# CRUD Ressource Interview
GET    /api/interviews                              → Liste des interviews
POST   /api/interviews                              → Créer une interview
GET    /api/interviews/[id]                          → Détail interview + sessions
PATCH  /api/interviews/[id]                          → Modifier configuration
DELETE /api/interviews/[id]                          → Supprimer interview

# Suggestions IA pour la configuration
POST   /api/interviews/[id]/suggest-title            → Suggérer titre + description
POST   /api/interviews/[id]/suggest-scope            → Suggérer périmètre (zones verte/rouge)
POST   /api/interviews/[id]/suggest-questions         → Suggérer questions d'ancrage + passage
POST   /api/interviews/[id]/suggest-analysis         → Suggérer une structure d'analyse

# Entretien (collaborateur)
POST   /api/interviews/[id]/chat                     → SSE streaming — message entretien
POST   /api/interviews/[id]/sessions                 → Créer / reprendre une session
GET    /api/interviews/[id]/sessions/[sid]            → Détail session + messages

# Clôture et analyse
POST   /api/interviews/[id]/sessions/[sid]/complete   → Clôturer + générer analyse
GET    /api/interviews/[id]/sessions/[sid]/analysis    → Consulter l'analyse
```

### Pages UI

```
# Créateur (admin/RH)
/creator                              → Dashboard — onglet Interviews ajouté
/creator/interview/new                → Wizard création interview (5 étapes)

# Collaborateur
/interview/[id]                       → Page d'entretien (chat)

# Admin — résultats
/creator/interview/[id]/sessions      → Liste des sessions d'un entretien
/creator/interview/[id]/sessions/[sid] → Détail session : verbatim + analyse
```

### Workflow créateur (5 étapes)

```
1. Configuration   → Titre, thème, ton, description
2. Périmètre       → Zone verte / zone rouge
3. Questions       → Questions d'ancrage + points de passage
4. Analyse         → Structure d'analyse (suggestion IA + personnalisation)
5. Publication     → Récapitulatif + publier
```

### Suggestions IA dans le wizard

Chaque étape du wizard dispose d'un bouton **"Générer via IA"** (icône Sparkles) qui appelle un endpoint dédié pour pré-remplir les champs :

| Étape | Endpoint | Modèle | Données générées |
|---|---|---|---|
| Configuration | `POST /api/interviews/[id]/suggest-title` | Haiku | Titre + description |
| Périmètre | `POST /api/interviews/[id]/suggest-scope` | Haiku | Zone verte + zone rouge |
| Questions | `POST /api/interviews/[id]/suggest-questions` | Haiku | Questions d'ancrage + de passage |
| Analyse | `POST /api/interviews/[id]/suggest-analysis` | Haiku | Dimensions d'analyse (template) |

- L'interview est auto-sauvegardée (`ensureSaved()`) avant chaque appel IA pour que l'endpoint ait accès aux paramètres déjà configurés
- Les suggestions utilisent le modèle **Claude Haiku** (rapide, peu coûteux) pour la génération de suggestions
- Le créateur peut modifier librement les suggestions après génération

### Initialisation du chat

Lors du démarrage d'une nouvelle session (aucun message existant), le backend injecte automatiquement un message d'introduction avec le prénom du participant :

```
"Bonjour, je m'appelle {participantName}. Je suis prêt pour l'interview."
```

Ce message n'est pas visible dans l'UI mais permet à l'agent IA de se présenter et de poser sa première question de manière naturelle et personnalisée.

### Contraintes techniques

| Contrainte | Valeur |
|---|---|
| **Streaming** | SSE (Server-Sent Events), comme le chat Content existant |
| **Modèle IA (entretien)** | Claude Sonnet (contexte riche, relances adaptatives) |
| **Modèle IA (analyse)** | Claude Sonnet (analyse post-entretien) |
| **Modèle IA (suggestions)** | Claude Haiku (génération rapide dans le wizard) |
| **Volumétrie messages** | ~20-30 messages par entretien |
| **Persistence** | Tous les messages stockés en base (reprise possible) |
| **Max tokens / réponse** | ~400 tokens (réponses concises, 1 question à la fois) |

---

## Périmètre MVP / POC

### Inclus

- [x] CRUD ressource Interview (créer, configurer, publier)
- [x] Wizard de création en 5 étapes
- [x] Configuration complète : thème, ton, périmètre, questions, limites, analyse
- [x] Suggestions IA à chaque étape du wizard (titre, périmètre, questions, analyse)
- [x] Entretien conversationnel streaming (chat adaptatif)
- [x] Persistence des messages (quitter/reprendre)
- [x] Clôture manuelle par le collaborateur
- [x] Clôture automatique à l'atteinte des limites
- [x] Génération d'analyse post-entretien
- [x] Consultation verbatim + analyse par l'admin
- [x] Dashboard créateur avec onglet Interviews
- [x] Accès collaborateur par lien direct
- [x] UI responsive mobile (sidebar toggle, layouts adaptatifs)
- [x] Labels UI en français : "Interview" (et non "Entretien")

### Bugs corrigés

- **Initialisation du chat** : l'envoi d'un tableau de messages vide à l'API Claude causait une erreur silencieuse. Corrigé par injection d'un message d'introduction côté backend.
- **Responsive mobile** : sidebar fixe qui cassait le layout sur mobile. Corrigé avec un hamburger toggle + overlay + layouts carte pour les tableaux.
- **Premier message lent** : le premier message utilisait Sonnet (lent). Corrigé en utilisant Haiku pour le greeting initial, Sonnet pour le reste.
- **Clavier mobile masquant les messages** : scroll auto vers le bas sur focus textarea et resize `visualViewport`.
- **Textarea avec scroll interne** : remplacé par un mirror div invisible + textarea positionnée en absolute, scroll naturel jusqu'à `40dvh` max.
- **Bouton "Terminer" lent** : la génération d'analyse bloquait la réponse (10+ sec avec Sonnet). Corrigée en lançant l'analyse en background — retour instantané pour l'utilisateur.

### Améliorations UX post-MVP

#### Transparence IA et réassurance

- **Écran d'accueil** : 3 cartes d'information (confidentialité, transparence IA, durée/reprise)
- **Chat** : avatar Bot sur les messages assistant, label "Assistant IA" sur le premier message, "Interview menée par IA" dans le header
- **Loading** : "L'IA rédige sa réponse..." avec spinner
- **Footer** : disclaimer permanent "échange mené par une IA"
- **Complétion** : mention analyse générée par IA + garantie de confidentialité
- **Wizard** : bannière explicative sur le fonctionnement de l'interview IA (étape config) et ce que verra le collaborateur (étape publish)

#### Qualité conversationnelle

- **Ton sobre** : règle explicite contre les superlatifs et la flatterie ("formidable", "excellent", "incroyable"). L'agent utilise des accusés neutres ("D'accord", "Je comprends", "Je vois").
- **Enchaînements naturels** : l'agent ne commente pas systématiquement chaque réponse. Variété de transitions : parfois enchaîne directement, parfois reformulation brève, parfois question directe.
- **Clôture claire** : le message de clôture IA se termine par une instruction explicite de cliquer "Terminer". Un bouton CTA proéminent remplace l'input quand l'interview est terminée.

#### Performance

- **Premier message** : Haiku (rapide) pour le greeting, Sonnet pour les relances adaptatives
- **Analyse en background** : le endpoint `/complete` répond instantanément, l'analyse Sonnet tourne en arrière-plan
- **Max tokens optimisés** : 250 tokens pour le premier message, 400 pour les réponses suivantes

#### Mobile

- **Textarea auto-resize** : mirror div invisible, max `40dvh`, pas de scroll interne
- **Safe-area** : padding bottom avec `env(safe-area-inset-bottom)` pour iOS/Android
- **Viewport** : `h-dvh` (dynamic viewport height) au lieu de `vh` pour gérer la barre de navigateur mobile
- **Bouton d'envoi** : 48px pour faciliter le tap mobile
- **Scroll automatique** : sur focus textarea et resize `visualViewport` (ouverture clavier)

### Exclu (post-MVP)

- [ ] Vue manager dédiée / dashboard agrégé
- [ ] Injection automatique des données collaborateur HeyTeam
- [ ] Déclenchement depuis extensions / campagnes
- [ ] Choix du rôle destinataire de l'analyse
- [ ] Récurrence programmée des entretiens
- [ ] Enrichissement avec signaux HeyTeam (ancienneté, engagement)
- [ ] Comparaison temporelle entre entretiens d'un même collaborateur
- [ ] Export des résultats (CSV, PDF)

---

## Design & UX

### Responsive

- **Desktop** : sidebar fixe 200px à gauche, contenu principal avec margin-left
- **Mobile** (< `lg`) : sidebar masquée, hamburger en haut à gauche, overlay au tap
- La page d'interview collaborateur (`/interview/[id]`) utilise un layout dédié `fixed inset-0 z-[60]` qui recouvre entièrement la sidebar
- Les tableaux de données (dashboard, sessions) basculent en **cards** sur mobile (`md:hidden` / `hidden md:block`)

### Navigation & Architecture

#### Séparation Formation IA / Interview IA

La sidebar contient deux entrées distinctes :
- **Formation IA** (`/creator`) — Ressources de contenu IA (synthèse, flashcards, module, etc.)
- **Interview IA** (`/creator/interview`) — Dashboard interviews et pulses

#### Page hub Interview (`/creator/interview/[id]`)

Page de détail dédiée par interview/pulse avec :
- Résumé de la configuration (thème, ton, périmètre, questions)
- Statistiques rapides (sessions, complétées, en cours)
- Sessions récentes (priorité d'affichage au-dessus de la config)
- Bouton copier le lien de partage
- Pour les pulses : stats spécifiques (score moyen, tendance, scores bas), graphique SVG d'évolution des scores

### Terminologie UI

- Labels affichés : **"Interview IA"** (et non "Entretien")
- Cohérence dans tous les composants : dashboard, wizard, chat, sessions

---

## Pulse — Micro-interview récurrente

### Vue d'ensemble

Le **Pulse** est une variante légère de l'interview IA, conçue pour des suivis récurrents et rapides (~3 min). Le collaborateur donne un **score de 1 à 10** à une question, puis l'IA pose des **questions de suivi adaptatives** dont la profondeur varie selon le score donné.

### Positionnement

- Même modèle de données que l'Interview (`InterviewResource` avec `type: "pulse"`)
- Wizard de configuration en **2 étapes** (Configuration → Publication)
- Accès collaborateur par lien direct (`/pulse/[id]`)
- Fréquence configurable : hebdomadaire, bi-mensuel, mensuel

---

### Configuration créateur (admin/RH)

#### Paramètres

| Paramètre | Description | Obligatoire | Défaut |
|---|---|---|---|
| **Titre** | Nom du pulse (ex: "Bien-être hebdomadaire") | Oui | — |
| **Question score** | Question à laquelle le collaborateur répond avec un score 1-10 | Oui | — |
| **Thème** | Onboarding, satisfaction, rétention, personnalisé | Oui | satisfaction |
| **Ton** | Bienveillant, formel, direct, décontracté | Oui | bienveillant |
| **Fréquence** | Hebdomadaire, bi-mensuel, mensuel | Oui | hebdomadaire |
| **Questions de suivi IA (max)** | Nombre max de questions de suivi (1-5) | Oui | 3 |

#### Suggestion IA dans le wizard

Le créateur dispose d'un bouton **"Générer titre et question via IA"** (icône Sparkles, style purple) qui pré-remplit le titre et la question score en fonction du thème, ton et fréquence sélectionnés.

| Étape | Endpoint | Modèle | Données générées |
|---|---|---|---|
| Configuration | `POST /api/interviews/[id]/suggest-pulse-content` | Haiku | Titre + question score |

- Le pulse est auto-sauvegardé (`ensureSaved()`) avant l'appel IA
- Le créateur peut modifier librement les suggestions après génération

#### Wizard (2 étapes)

```
1. Configuration   → Titre, question score, thème, ton, fréquence, max follow-ups
                     + bouton "Générer titre et question via IA"
2. Publication     → Récapitulatif + publier
```

Le stepper est centré avec des labels ("Configuration" / "Publication") et une ligne de connexion fixe entre les deux étapes.

---

### Déroulement du pulse (collaborateur)

```
1. Identification    → Le collaborateur entre son prénom
2. Score             → Sélection d'un score de 1 à 10 (échelle visuelle colorée)
3. Suivi IA          → L'IA pose entre 1 et {maxFollowUps} questions adaptatives
4. Clôture           → Message de remerciement + "Vous pouvez fermer cette page"
```

### Profondeur adaptative selon le score

L'IA adapte le nombre et la profondeur de ses questions en fonction du score donné ET du maxFollowUps configuré :

| Score | Comportement | Questions (pour max=5) |
|---|---|---|
| **8-10** (élevé) | Exploration brève et positive | 1-2 questions |
| **5-7** (mitigé) | Exploration nuancée (positif + pistes d'amélioration) | 1-3 questions |
| **1-4** (bas) | Exploration empathique et approfondie | 3-5 questions |

La formule de scaling est proportionnelle au `maxFollowUps` configuré :
- Score élevé : `ceil(max * 0.4)` questions max
- Score mitigé : `ceil(max * 0.6)` questions max
- Score bas : `ceil(max * 0.6)` à `max` questions

### Règles de l'agent IA (Pulse)

1. UNE SEULE question par message
2. Maximum 2 phrases par message (hors question)
3. Vouvoiement (sauf ton décontracté)
4. Ne mentionne JAMAIS être une IA
5. Réponses en français
6. Pas de superlatifs — ton sobre et professionnel
7. Enchaîne directement sans accuser réception systématiquement
8. Clôture : bref remerciement + "Merci pour ce retour. Vous pouvez maintenant fermer cette page."

---

### Analyse post-pulse

Analyse légère générée après complétion :

```json
{
  "sentiment": "positif | mitigé | négatif",
  "keyInsight": "Une phrase résumant l'insight principal",
  "themes": ["thème1", "thème2"],
  "verbatim": "La citation la plus révélatrice du collaborateur",
  "actionSuggestion": "Une suggestion d'action concrète (ou null si score élevé)"
}
```

- Modèle : **Claude Haiku** (analyse rapide, volume potentiellement élevé)
- Déclenchée à la complétion de la session

---

### Architecture technique (Pulse)

#### Champs spécifiques en base

| Champ | Type | Description |
|---|---|---|
| `type` | String | `"pulse"` |
| `pulseQuestion` | String? | La question score (1-10) |
| `pulseFrequency` | String? | `"weekly"` / `"biweekly"` / `"monthly"` |
| `pulseMaxFollowUps` | Int | Max questions de suivi (1-5, défaut 3) |

Le champ `pulseScore` est stocké sur la session (`InterviewSession.pulseScore`).

#### Routes API spécifiques

```
# Suggestion IA pour configuration Pulse
POST   /api/interviews/[id]/suggest-pulse-content    → Suggérer titre + question score

# Stats agrégées par pulse
GET    /api/interviews/[id]/pulse-stats              → Score moyen, tendance, sentiments
```

Les routes existantes (`/chat`, `/sessions`, `/complete`) sont partagées entre Interview et Pulse, avec un branchement conditionnel basé sur `interview.type`.

#### Pages UI

```
# Créateur
/creator/interview/new-pulse         → Wizard création pulse (2 étapes)
/creator/interview/[id]              → Détail pulse + sessions + stats

# Collaborateur
/pulse/[id]                          → Page pulse (score + chat)
```

#### Modèles IA

| Usage | Modèle | Max tokens |
|---|---|---|
| Chat pulse (suivi) | Claude Haiku | 200 |
| Analyse pulse | Claude Haiku | 1000 |
| Suggestion contenu pulse | Claude Haiku | 500 |

---

### Périmètre Pulse MVP

#### Inclus

- [x] Création et configuration pulse (wizard 2 étapes)
- [x] Suggestion IA du titre et de la question score
- [x] Score 1-10 avec suivi adaptatif (1-5 questions max)
- [x] Profondeur adaptative selon le score ET le maxFollowUps
- [x] Analyse légère post-pulse (sentiment, insight, thèmes, verbatim, suggestion)
- [x] Dashboard créateur avec onglet Pulse
- [x] Stats agrégées (score moyen, tendance, sentiments)
- [x] Stepper UI centré avec labels
- [x] Chat UX aligné avec l'interview long (auto-resize, visualViewport, notice confidentialité, avatar Bot)
- [x] Accès collaborateur par lien direct

#### Exclu (post-MVP)

- [ ] Récurrence automatique programmée (envoi automatique hebdo/bi-mensuel/mensuel)
- [ ] Comparaison temporelle des scores d'un même collaborateur
- [ ] Dashboard agrégé multi-pulse
- [ ] Export des tendances (CSV, PDF)
- [ ] Alertes automatiques sur scores bas
- [ ] Injection des données collaborateur HeyTeam

---

## Changelog

| Date | Entrée |
|---|---|
| 16/03/2026 | Transparence IA : écran d'accueil avec 3 cartes info (confidentialité, IA, durée), avatar Bot, label "Assistant IA", disclaimer permanent dans le chat. |
| 16/03/2026 | Performance : premier message via Haiku (rapide), Sonnet pour les relances. Analyse en background (retour instantané sur "Terminer"). |
| 16/03/2026 | Mobile : textarea auto-resize (mirror div), safe-area padding, `h-dvh`, scroll auto sur ouverture clavier (`visualViewport`), bouton envoi 48px. |
| 16/03/2026 | Qualité conversationnelle : interdiction superlatifs/flatterie, enchaînements variés et naturels, clôture claire avec CTA. |
| 16/03/2026 | UX complétion : bouton "Fermer" sur l'écran de fin, CTA "Terminer l'interview" remplace l'input quand l'IA a fini. |
| 16/03/2026 | Navigation : séparation Formation IA / Interview IA dans la sidebar, page hub `/creator/interview/[id]` avec config + stats + sessions. |
| 16/03/2026 | Layout : sessions affichées au-dessus de la config sur la page de détail (priorité mobile). |
| 16/03/2026 | Ajout section Pulse complète : configuration, wizard 2 étapes, profondeur adaptative, analyse légère, architecture technique. |
| 16/03/2026 | Pulse : suggestion IA du titre et question score (`suggest-pulse-content`), max follow-ups passé de 3 à 5, stepper UI centré avec labels. |
| 17/03/2026 | Pulse chat UX aligné avec interview long : auto-resize textarea, visualViewport, label "Assistant IA", notice confidentialité, bouton Terminer avec LogOut. |

---

## Notes & décisions ouvertes

_Section à compléter au fil du développement._

- ...

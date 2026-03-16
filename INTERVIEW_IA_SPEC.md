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

# Suggestion IA pour la configuration
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

### Contraintes techniques

| Contrainte | Valeur |
|---|---|
| **Streaming** | SSE (Server-Sent Events), comme le chat Content existant |
| **Modèle IA (entretien)** | Claude Sonnet (contexte riche, relances adaptatives) |
| **Modèle IA (analyse)** | Claude Sonnet (analyse post-entretien) |
| **Volumétrie messages** | ~20-30 messages par entretien |
| **Persistence** | Tous les messages stockés en base (reprise possible) |
| **Max tokens / réponse** | ~300 tokens (réponses concises, 1 question à la fois) |

---

## Périmètre MVP / POC

### Inclus

- [x] CRUD ressource Interview (créer, configurer, publier)
- [x] Wizard de création en 5 étapes
- [x] Configuration complète : thème, ton, périmètre, questions, limites, analyse
- [x] Suggestion IA de la structure d'analyse
- [x] Entretien conversationnel streaming (chat adaptatif)
- [x] Persistence des messages (quitter/reprendre)
- [x] Clôture manuelle par le collaborateur
- [x] Clôture automatique à l'atteinte des limites
- [x] Génération d'analyse post-entretien
- [x] Consultation verbatim + analyse par l'admin
- [x] Dashboard créateur avec onglet Interviews
- [x] Accès collaborateur par lien direct

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

## Notes & décisions ouvertes

_Section à compléter au fil du développement._

- ...

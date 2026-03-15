# [CONTENT V2] La Ressource IA — PRD Discovery

PROJETS: IA (https://www.notion.so/IA-29c37089422d803ba0b4fe0bb259e77f?pvs=21)
Priorité: PRIO 2
Résumé: PRD complet de la Ressource IA V2 : nouveau type de ressource dans le parcours HeyTeam où le RH fournit une source + un objectif pédagogique, et l'IA génère un contenu multi-format que l'enrollee consomme dans le format de son choix. 5 formats de consommation (synthèse, flashcards, chat, module structuré, mises en situation), 6 extensions activables (rappels, connexion, questionnaire, email, défi, attestation). Micro-app séparée connectée à la plateforme.
STATUT: Discovery
TARGET MONTH: 2026-06

## Vue d'ensemble

Un nouveau type de ressource dans le parcours HeyTeam — la **Ressource IA** — où le RH fournit une source (PDF) + un objectif pédagogique, et l'IA génère un contenu que l'enrollee consomme dans le **format de son choix**.

Ce n'est pas un outil IA externe. C'est une ressource native du parcours. Mais contrairement aux autres ressources, elle est **vivante** : multi-format côté enrollee, capable de générer des effets sur le workflow via les extensions, et pilotée par un objectif pédagogique.

> **PRD complet** : Le document de référence (~2300 lignes) est dans le fichier `discovery-v2-ressource-ia.md` partagé par Quentin. Cette page Notion en est le résumé structuré.
> 

---

## Architecture

**Micro-app séparée** : L'outil auteur (RH) et le renderer (enrollee) sont construits comme une application indépendante du monolithe HeyTeam. Transition transparente pour l'utilisateur (auth SSO invisible).

**Contrat API en 6 flux** : Ouverture → Tracking continu → Complétion → Extensions → Création/publication → Regénération.

**HeyTeam reste "bête"** : La plateforme reçoit des JSON structurés et crée des objets natifs. Toute l'intelligence IA est côté micro-app.

---

## Flow créateur (RH) — 8 étapes

1. **Point d'entrée** — "Ajouter une ressource → Contenu IA" dans le parcours
2. **Upload source** — PDF, PPTX, DOCX (1 document principal)
3. **Analyse IA + Objectif pédagogique** — L'IA analyse le doc, le RH définit l'objectif (avec suggestions IA)
4. **Config formats** — Le RH active les formats parmi les 5 disponibles + paramètres (ton, langue, couleur)
5. **Génération + Preview** — Aperçu par format, ajustement via chat par format
6. **Config extensions** — Le RH active les extensions souhaitées (6 disponibles, toutes OFF par défaut)
7. **Publication** — Titre, description, position dans le parcours, format par défaut
8. **Post-publication** — Modifier, regénérer, dupliquer, dépublier, analytics

**Temps estimé** : ~5-10 min pour un premier contenu, ~2-3 min pour les suivants.

---

## Les 5 formats de consommation

Chaque format est justifié par la recherche en sciences cognitives (Dunlosky et al., 2013 — méta-analyse 242 études, 169 000 participants).

| Format | Mécanisme scientifique | Durée | Rôle |
| --- | --- | --- | --- |
| 📋 **Synthèse** | Vue d'ensemble | 1-2 min | Référence rapide, point d'entrée |
| 🃏 **Flashcards** | Active recall (haute utilité) | 2-5 min | Renforcement, mémorisation |
| 💬 **Chat questionneur** | Interrogation élaborative | 3-8 min | Exploration libre, personnalisation |
| 📖 **Module structuré** | Microlearning + active recall | 5-15 min | Apprentissage profond |
| 🎭 **Mises en situation** | Transfert connaissance → compétence | 3-5 min | Ancrage comportemental |

**L'enrollee choisit son format** parmi ceux activés par le RH. Il peut switcher librement entre formats, son état est conservé.

**Tous les formats produisent du JSON structuré** (pas du HTML). Le renderer React interprète le JSON. Le chat est dynamique (LLM en temps réel).

---

## Les 6 extensions activables

Les extensions créent automatiquement des objets dans le parcours HeyTeam (types existants) à la complétion de la Ressource IA. Toutes sont opt-in (OFF par défaut).

| Extension | Objet HeyTeam créé | Déclenché quand |
| --- | --- | --- |
| ⏰ **Rappels espacés** | Ressource formation × N | J+1, J+7, J+30 après complétion |
| 🤝 **Connexion** | Événement ou Tâche | J+X configurable |
| 📝 **Questionnaire** | Questionnaire natif | J+X ou immédiat |
| 📧 **Email/Notification** | Email via notifs existantes | Dès complétion (4 scénarios : brief, alerte score, alerte non-complétion, intérêt) |
| 🏆 **Défi/Challenge** | Challenge natif | J+X configurable |
| 📄 **Attestation** | PA / Document dynamique | Après complétion ou réussite quiz |

**Principe** : Le Content Engine envoie le contenu pré-généré. HeyTeam crée l'objet natif. Zéro nouveau type d'objet côté plateforme.

---

## Complétion

**Déclarative** : L'enrollee clique "J'ai terminé". Le callback met à jour le statut dans le parcours et déclenche les extensions.

Le tracking (formats ouverts, temps passé, scores) est envoyé en continu indépendamment de la complétion.

---

## Expérience enrollee

1. **Entrée** — Clic sur la ressource dans le parcours → transition transparente vers la micro-app
2. **Sélecteur de format** — Si 2+ formats activés (sinon sauté)
3. **Consommation** — Le format choisi + barre de navigation entre formats
4. **Complétion** — Bouton "J'ai terminé" → écran récap → retour au parcours

**Mobile-first**. Reprise de session (état persisté serveur). Navigation libre entre formats.

---

## Séquençage

| Phase | Contenu |
| --- | --- |
| **Phase 1 — V1 MVP** (avril 2026) | PDF → page HTML statique. 1 format. En cours ✅ |
| **Phase 2 — Fondations micro-app** | Bootstrap micro-app + auth + 3 premiers formats (synthèse, flashcards, module) + sélecteur |
| **Phase 3 — Chat + Extensions** | Chat questionneur + mises en situation + 6 extensions activables |
| **Phase 4 — Analytics + Itération** | Dashboard, suggestions IA, nouveaux formats |

---

## Liens

- **V1 MVP Discovery** : [CONTENT — Génération page HTML depuis un PDF](https://www.notion.so/CONTENT-G-n-ration-page-html-depuis-un-pdf-prompt-32237089422d8054a7dcc67adcdaeb5f?pvs=21)
- **Initiative connexe** : [Pulse Onboarding / Satisfaction](https://www.notion.so/TESTER-avec-les-clients-Agent-Interviewer-Pulse-Onboarding-Satisfaction-31f37089422d815299d6ed366193c3be?pvs=21)
- **Projet** : IA

---

## Changelog

| Date | Entrée |
| --- | --- |
| 14/03/2026 | Création PRD V2 discovery complet (~2300 lignes). 5 formats, 6 extensions, flow créateur 8 étapes, expérience enrollee, contrat API 6 flux, architecture micro-app. |
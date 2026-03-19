import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AGENT_TEMPLATES } from "@/types";

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 10) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

export async function POST() {
  // Clean existing data
  await prisma.actionLog.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.employee.deleteMany();

  // --- Seed Employees ---
  const employees = await Promise.all([
    prisma.employee.create({ data: { firstName: "Julie", lastName: "Mercier", email: "julie.mercier@company.com", position: "Product Designer", department: "Produit", hireDate: daysAgo(3), status: "active", onboardingCompleted: false } }),
    prisma.employee.create({ data: { firstName: "Karim", lastName: "Benali", email: "karim.benali@company.com", position: "Développeur Frontend", department: "Tech", hireDate: daysAgo(0), status: "active", onboardingCompleted: false } }),
    prisma.employee.create({ data: { firstName: "Sarah", lastName: "Dubois", email: "sarah.dubois@company.com", position: "Chargée de communication", department: "Marketing", hireDate: daysAgo(5), status: "active", onboardingCompleted: false, lastPulseScore: 3.2 } }),
    prisma.employee.create({ data: { firstName: "Thomas", lastName: "Martin", email: "thomas.martin@company.com", position: "Commercial Senior", department: "Commercial", hireDate: daysAgo(90), status: "active", onboardingCompleted: true, lastPulseScore: 7.5 } }),
    prisma.employee.create({ data: { firstName: "Léa", lastName: "Rousseau", email: "lea.rousseau@company.com", position: "RH Généraliste", department: "RH", hireDate: daysAgo(365), status: "active", onboardingCompleted: true, lastPulseScore: 8.1 } }),
    prisma.employee.create({ data: { firstName: "Alexandre", lastName: "Petit", email: "alexandre.petit@company.com", position: "Tech Lead", department: "Tech", hireDate: daysAgo(540), status: "active", onboardingCompleted: true, lastPulseScore: 6.2 } }),
    prisma.employee.create({ data: { firstName: "Emma", lastName: "Laurent", email: "emma.laurent@company.com", position: "Account Manager", department: "Commercial", hireDate: daysAgo(14), status: "active", onboardingCompleted: false } }),
    prisma.employee.create({ data: { firstName: "Nicolas", lastName: "Moreau", email: "nicolas.moreau@company.com", position: "Data Analyst", department: "Tech", hireDate: daysAgo(7), status: "active", onboardingCompleted: false, lastPulseScore: 5.0 } }),
    prisma.employee.create({ data: { firstName: "Camille", lastName: "Girard", email: "camille.girard@company.com", position: "Office Manager", department: "Opérations", hireDate: daysAgo(180), status: "active", onboardingCompleted: true, lastPulseScore: 7.8 } }),
    prisma.employee.create({ data: { firstName: "Maxime", lastName: "Durand", email: "maxime.durand@company.com", position: "Directeur Commercial", department: "Commercial", hireDate: daysAgo(730), status: "active", onboardingCompleted: true, lastPulseScore: 8.5 } }),
    prisma.employee.create({ data: { firstName: "Chloé", lastName: "Bernard", email: "chloe.bernard@company.com", position: "UX Researcher", department: "Produit", hireDate: daysAgo(21), status: "active", onboardingCompleted: false } }),
    prisma.employee.create({ data: { firstName: "Romain", lastName: "Lefebvre", email: "romain.lefebvre@company.com", position: "Ingénieur DevOps", department: "Tech", hireDate: daysAgo(120), status: "departing", onboardingCompleted: true, lastPulseScore: 4.1 } }),
    prisma.employee.create({ data: { firstName: "Marie", lastName: "Fontaine", email: "marie.fontaine@company.com", position: "Responsable Formation", department: "RH", hireDate: daysAgo(450), status: "active", onboardingCompleted: true, lastPulseScore: 7.9 } }),
    prisma.employee.create({ data: { firstName: "Lucas", lastName: "Garnier", email: "lucas.garnier@company.com", position: "Stagiaire Marketing", department: "Marketing", hireDate: daysAgo(10), status: "active", onboardingCompleted: false } }),
    prisma.employee.create({ data: { firstName: "Inès", lastName: "Chevalier", email: "ines.chevalier@company.com", position: "Comptable", department: "Finance", hireDate: daysAgo(60), status: "onleave", onboardingCompleted: true, lastPulseScore: 6.8 } }),
  ]);

  // Set managers
  await prisma.employee.update({ where: { id: employees[0].id }, data: { managerId: employees[5].id } }); // Julie -> Alexandre
  await prisma.employee.update({ where: { id: employees[1].id }, data: { managerId: employees[5].id } }); // Karim -> Alexandre
  await prisma.employee.update({ where: { id: employees[6].id }, data: { managerId: employees[9].id } }); // Emma -> Maxime
  await prisma.employee.update({ where: { id: employees[13].id }, data: { managerId: employees[2].id } }); // Lucas -> Sarah (weird but demo)

  // --- Seed Agents from templates ---
  const agents = [];
  for (const template of AGENT_TEMPLATES) {
    const agent = await prisma.agent.create({
      data: {
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        category: template.category,
        triggerType: template.triggerType,
        triggerLabel: template.triggerLabel,
        triggerConfig: JSON.stringify(template.triggerConfig),
        infoDescription: template.infoDescription,
        actions: JSON.stringify(template.actions),
        isTemplate: true,
        templateId: template.templateId,
        status: template.templateId === "weekly_report" || template.templateId === "team_dashboard" ? "paused" : "active",
      },
    });
    agents.push(agent);
  }

  // Map agents by templateId for easy lookup
  const agentMap: Record<string, typeof agents[0]> = {};
  agents.forEach((a, i) => { agentMap[AGENT_TEMPLATES[i].templateId] = a; });

  // --- Seed Suggestions ---
  const suggestions = [
    // URGENT
    {
      agentId: agentMap["pre_onboarding"].id,
      employeeId: employees[0].id, // Julie
      severity: "urgent",
      category: "onboarding",
      title: "Julie Mercier — Arrivée dans 3 jours, aucun manager assigné",
      summary: "Julie Mercier arrive le 22 mars en tant que Product Designer. Aucun manager n'a encore été assigné et le poste de travail n'est pas préparé. Risque d'arrivée sans référent.",
      context: JSON.stringify({ employeeName: "Julie Mercier", employeeRole: "Product Designer", department: "Produit", startDate: "2026-03-22", additionalInfo: { managerAssigned: "Non", workstationReady: "Non", buddyAssigned: "Non" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Assigner Alexandre Petit comme manager", detail: "Manager de l'équipe Produit", type: "task", preview: { subject: "Assignation manager pour Julie Mercier", body: "Assigner Alexandre Petit (Head of Product) comme manager de Julie Mercier avant son arrivée le 22 mars.", to: "Alexandre Petit" } },
        { id: 2, label: "Préparer le poste de travail", detail: "Vérifier les accès outils", type: "task", preview: { subject: "Préparation poste — Julie Mercier", body: "Checklist :\n• Accès Figma (licence Designer)\n• Compte Slack (channels #produit, #general)\n• Espace Notion équipe Produit\n• Badge d'accès bureau", to: "IT Support" } },
        { id: 3, label: "Proposer Chloé Bernard comme buddy", detail: "UX Researcher, même équipe", type: "email", preview: { to: "chloe.bernard@company.com", subject: "Parrainage : Julie Mercier (arrivée le 22 mars)", body: "Bonjour Chloé,\n\nJulie Mercier rejoint l'équipe Produit en tant que Product Designer le 22 mars.\n\nPourrais-tu être sa marraine pour ses premières semaines ? Cela implique :\n• Un café d'accueil le jour J\n• Un point quotidien de 15min la 1ère semaine\n• Répondre à ses questions pratiques\n\nMerci !" } },
      ]),
      alternatives: JSON.stringify([{ label: "Reporter l'onboarding d'une semaine", description: "Si les prérequis ne peuvent pas être remplis à temps" }]),
      status: "pending",
      createdAt: daysAgo(1),
    },
    {
      agentId: agentMap["doc_incomplete"].id,
      employeeId: employees[1].id, // Karim
      severity: "urgent",
      category: "documents",
      title: "Karim Benali — Dossier incomplet (3 pièces manquantes)",
      summary: "Karim commence aujourd'hui comme Développeur Frontend. Son dossier administratif est incomplet : RIB, attestation de sécurité sociale et carte vitale manquants.",
      context: JSON.stringify({ employeeName: "Karim Benali", employeeRole: "Développeur Frontend", department: "Tech", startDate: "2026-03-19", additionalInfo: { missingDocs: "RIB, Attestation sécu, Carte vitale", completionRate: "40%" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un rappel à Karim", detail: "Email avec liste des pièces et lien de dépôt", type: "email", preview: { to: "karim.benali@company.com", subject: "Documents manquants pour finaliser votre dossier", body: "Bonjour Karim,\n\nBienvenue chez nous ! Pour finaliser votre dossier administratif, nous avons besoin des documents suivants :\n\n1. RIB (relevé d'identité bancaire)\n2. Attestation de sécurité sociale\n3. Copie de carte vitale\n\nVous pouvez les déposer directement ici : [lien de dépôt sécurisé]\n\nMerci de nous les transmettre d'ici demain si possible.\n\nBonne première journée !\nL'équipe RH" } },
        { id: 2, label: "Alerter Léa Rousseau (RH)", detail: "Notification interne pour suivi", type: "notification", preview: { to: "Léa Rousseau", subject: "Dossier incomplet — Karim Benali (J1)", body: "Karim Benali a commencé aujourd'hui avec un dossier incomplet (3 pièces manquantes : RIB, attestation sécu, carte vitale). Un rappel lui a été envoyé. Merci de suivre la réception des documents." } },
      ]),
      alternatives: JSON.stringify([{ label: "Accorder un délai de 48h", description: "Envoyer un rappel doux avec deadline à J+2" }]),
      status: "pending",
      createdAt: daysAgo(0),
    },
    // ATTENTION
    {
      agentId: agentMap["onboarding_satisfaction"].id,
      employeeId: employees[2].id, // Sarah
      severity: "attention",
      category: "engagement",
      title: "Sarah Dubois — Aucune connexion après 5 jours",
      summary: "Sarah Dubois a rejoint l'équipe Marketing il y a 5 jours mais n'a jamais accédé à la plateforme. Son score d'engagement est très bas (3.2/10). Risque de désengagement précoce.",
      context: JSON.stringify({ employeeName: "Sarah Dubois", employeeRole: "Chargée de communication", department: "Marketing", startDate: "2026-03-14", additionalInfo: { lastLogin: "Jamais", pulseScore: "3.2/10", completedTasks: "0/12" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un email de bienvenue personnalisé", detail: "Rappel des accès et guide de démarrage", type: "email", preview: { to: "sarah.dubois@company.com", subject: "Bienvenue Sarah ! Vos accès et guide de démarrage", body: "Bonjour Sarah,\n\nToute l'équipe Marketing est ravie de vous accueillir !\n\nVoici vos accès :\n• Plateforme HeyTeam : [lien]\n• Slack : vous êtes sur #marketing et #general\n• Google Drive : dossier partagé Marketing\n\nN'hésitez pas à me contacter si vous avez la moindre question.\n\nÀ très vite !" } },
        { id: 2, label: "Alerter le manager pour planifier un point", detail: "Notification au responsable Marketing", type: "email", preview: { to: "manager.marketing@company.com", subject: "Sarah Dubois — Aucune connexion après 5 jours", body: "Bonjour,\n\nSarah Dubois (Chargée de communication) a rejoint l'équipe il y a 5 jours mais ne s'est pas encore connectée à la plateforme. Son score d'engagement est de 3.2/10.\n\nJe vous suggère de planifier un point rapide avec elle pour vous assurer que tout va bien.\n\nCordialement" } },
      ]),
      alternatives: JSON.stringify([{ label: "Appeler directement Sarah", description: "Contact téléphonique pour vérifier qu'elle a bien reçu ses accès" }]),
      status: "pending",
      createdAt: daysAgo(2),
    },
    {
      agentId: agentMap["checkin_reminder"].id,
      employeeId: employees[6].id, // Emma
      severity: "attention",
      category: "management",
      title: "Emma Laurent — Check-in M+0.5 à planifier",
      summary: "Emma est arrivée il y a 14 jours. Le check-in de mi-mois n'a pas encore été planifié par son manager Maxime Durand.",
      context: JSON.stringify({ employeeName: "Emma Laurent", employeeRole: "Account Manager", department: "Commercial", startDate: "2026-03-05", additionalInfo: { manager: "Maxime Durand", checkinType: "M+0.5", lastCheckin: "Aucun" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un rappel à Maxime Durand", detail: "Email de rappel pour planifier le check-in", type: "email", preview: { to: "maxime.durand@company.com", subject: "Rappel : check-in M+0.5 avec Emma Laurent", body: "Bonjour Maxime,\n\nEmma Laurent est arrivée il y a 14 jours et son check-in de mi-mois n'a pas encore été planifié.\n\nCe point est important pour :\n• Recueillir ses premières impressions\n• Identifier d'éventuels points de blocage\n• Valider l'avancement de son onboarding\n\nMerci de le planifier cette semaine." } },
        { id: 2, label: "Proposer un créneau automatiquement", detail: "Créer un événement basé sur les dispos", type: "meeting", preview: { subject: "Check-in M+0.5 — Emma Laurent / Maxime Durand", date: "Vendredi 21 mars à 14h00", duration: "30 minutes", participants: ["Emma Laurent", "Maxime Durand"], note: "Créneau suggéré automatiquement sur la base des disponibilités communes." } },
      ]),
      alternatives: JSON.stringify([]),
      status: "pending",
      createdAt: daysAgo(1),
    },
    {
      agentId: agentMap["doc_incomplete"].id,
      employeeId: employees[10].id, // Chloé
      severity: "attention",
      category: "documents",
      title: "Chloé Bernard — Mutuelle non souscrite après 21 jours",
      summary: "Chloé Bernard n'a toujours pas complété son adhésion à la mutuelle d'entreprise, 21 jours après son arrivée. Deadline légale dans 9 jours.",
      context: JSON.stringify({ employeeName: "Chloé Bernard", employeeRole: "UX Researcher", department: "Produit", startDate: "2026-02-26", additionalInfo: { missingDocs: "Formulaire mutuelle", deadline: "J+30", daysLeft: "9" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Relancer Chloé par email", detail: "Email avec formulaire mutuelle et deadline", type: "email", preview: { to: "chloe.bernard@company.com", subject: "Action requise : adhésion mutuelle (deadline dans 9 jours)", body: "Bonjour Chloé,\n\nVotre adhésion à la mutuelle d'entreprise n'a pas encore été complétée. La date limite légale est dans 9 jours (J+30).\n\nVous trouverez en pièce jointe :\n• Le formulaire d'adhésion mutuelle\n• La notice d'information du contrat\n\nPour toute question, n'hésitez pas à me contacter.\n\nCordialement,\nL'équipe RH" } },
        { id: 2, label: "Alerter le RH référent", detail: "Escalade pour suivi légal", type: "notification", preview: { to: "Léa Rousseau", subject: "Mutuelle non souscrite — Chloé Bernard (J+21, deadline J+30)", body: "Chloé Bernard n'a toujours pas souscrit à la mutuelle d'entreprise. Deadline légale dans 9 jours. Un email de relance lui a été envoyé. Merci de vérifier la bonne réception et de relancer si nécessaire." } },
      ]),
      alternatives: JSON.stringify([{ label: "Planifier un appel avec Chloé", description: "L'accompagner dans la procédure" }]),
      status: "pending",
      createdAt: daysAgo(3),
    },
    {
      agentId: agentMap["task_overdue"].id,
      employeeId: employees[7].id, // Nicolas
      severity: "attention",
      category: "management",
      title: "Nicolas Moreau — 4 tâches d'onboarding en retard",
      summary: "Nicolas (Data Analyst, arrivé il y a 7 jours) a 4 tâches d'onboarding en retard : accès data warehouse, formation SQL, rencontre équipe, objectifs 30j.",
      context: JSON.stringify({ employeeName: "Nicolas Moreau", employeeRole: "Data Analyst", department: "Tech", startDate: "2026-03-12", additionalInfo: { overdueTasks: "4", completedTasks: "3/7", pulseScore: "5.0/10" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un récapitulatif à Nicolas", detail: "Email avec checklist des tâches en retard", type: "email", preview: { to: "nicolas.moreau@company.com", subject: "Vos tâches d'onboarding en attente", body: "Bonjour Nicolas,\n\nVoici les tâches restantes de votre onboarding :\n\n❌ Accès data warehouse — Demander à IT via le portail\n❌ Formation SQL avancé — Module en ligne (2h)\n❌ Rencontre équipe Data — Planifier avec votre manager\n❌ Objectifs 30 jours — À compléter avec Alexandre\n\n✅ 3/7 tâches déjà complétées, bravo !\n\nN'hésitez pas à me contacter si vous avez besoin d'aide." } },
        { id: 2, label: "Alerter Alexandre Petit (manager)", detail: "Notification sur le retard d'onboarding", type: "notification", preview: { to: "Alexandre Petit", subject: "Onboarding Nicolas Moreau — 4 tâches en retard (J+7)", body: "Nicolas Moreau a complété 3 tâches sur 7 de son onboarding. 4 tâches sont en retard dont l'accès data warehouse et la formation SQL. Un récapitulatif lui a été envoyé. Merci de planifier un point pour débloquer les accès." } },
      ]),
      alternatives: JSON.stringify([]),
      status: "pending",
      createdAt: daysAgo(1),
    },
    // OPPORTUNITY
    {
      agentId: agentMap["engagement_tracking"].id,
      employeeId: employees[9].id, // Maxime (team)
      severity: "opportunity",
      category: "management",
      title: "Équipe Commercial — 3 fins de période d'essai cette semaine",
      summary: "3 collaborateurs de l'équipe Commercial terminent leur période d'essai cette semaine. Les bilans n'ont pas encore été planifiés par Maxime Durand.",
      context: JSON.stringify({ employeeName: "Équipe Commercial (Maxime Durand)", employeeRole: "Directeur Commercial", department: "Commercial", additionalInfo: { trialEndCount: "3", bilansPlanned: "0/3", collaborators: "Emma Laurent, Thomas Martin, +1" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Planifier les 3 bilans de période d'essai", detail: "Créer les événements dans l'agenda de Maxime", type: "meeting", preview: { subject: "Bilan de période d'essai", date: "Cette semaine (3 créneaux de 45min)", duration: "45 minutes chacun", participants: ["Maxime Durand", "Emma Laurent", "Thomas Martin", "+1 collaborateur"], note: "3 bilans à planifier. Les créneaux seront proposés sur les disponibilités communes de Maxime." } },
        { id: 2, label: "Générer les documents de bilan", detail: "Pré-remplir les formulaires d'évaluation", type: "task", preview: { subject: "Préparation documents bilan période d'essai", body: "Pré-remplir les 3 formulaires d'évaluation avec :\n• Infos collaborateur (poste, date d'arrivée, manager)\n• Objectifs définis à l'arrivée\n• Tâches d'onboarding complétées\n• Score d'engagement Pulse", to: "Maxime Durand" } },
      ]),
      alternatives: JSON.stringify([{ label: "Déléguer au RH", description: "Demander à Léa Rousseau de gérer les bilans" }]),
      status: "pending",
      createdAt: daysAgo(2),
    },
    {
      agentId: agentMap["welcome_message"].id,
      employeeId: employees[13].id, // Lucas
      severity: "opportunity",
      category: "onboarding",
      title: "Lucas Garnier — Message de bienvenue non envoyé (J+10)",
      summary: "Lucas Garnier (stagiaire Marketing) n'a pas reçu de message de bienvenue officiel après 10 jours. Son intégration pourrait être améliorée.",
      context: JSON.stringify({ employeeName: "Lucas Garnier", employeeRole: "Stagiaire Marketing", department: "Marketing", startDate: "2026-03-09", additionalInfo: { welcomeMessageSent: "Non", buddyAssigned: "Non" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un message de bienvenue", detail: "Email personnalisé avec ressources", type: "email", preview: { to: "lucas.garnier@company.com", subject: "Bienvenue Lucas ! Votre guide de démarrage", body: "Bonjour Lucas,\n\nBienvenue dans l'équipe Marketing !\n\nVoici vos ressources pour bien démarrer :\n• Plateforme HeyTeam : [lien d'accès]\n• Guide du stagiaire : [lien]\n• Organigramme équipe Marketing : [lien]\n\nVotre manager et l'équipe ont hâte de travailler avec vous.\n\nBon stage !" } },
        { id: 2, label: "Proposer Sarah Dubois comme buddy", detail: "Buddy recommandée (même équipe Marketing)", type: "email", preview: { to: "sarah.dubois@company.com", subject: "Parrainage stagiaire : Lucas Garnier", body: "Bonjour Sarah,\n\nLucas Garnier a rejoint l'équipe Marketing en stage il y a 10 jours. Pourrais-tu être sa marraine pour l'aider à s'intégrer ?\n\nCela implique un café d'accueil et un point hebdomadaire de 15min.\n\nMerci !" } },
      ]),
      alternatives: JSON.stringify([]),
      status: "pending",
      createdAt: daysAgo(4),
    },
    {
      agentId: agentMap["buddy_inactive"].id,
      employeeId: employees[7].id, // Nicolas
      severity: "opportunity",
      category: "onboarding",
      title: "Buddy de Nicolas Moreau inactif depuis 5 jours",
      summary: "Le buddy assigné à Nicolas Moreau n'a eu aucune interaction avec lui depuis 5 jours. Nicolas est en onboarding depuis 7 jours et pourrait bénéficier d'un accompagnement plus actif.",
      context: JSON.stringify({ employeeName: "Nicolas Moreau", employeeRole: "Data Analyst", department: "Tech", additionalInfo: { buddy: "Camille Girard", lastInteraction: "Il y a 5 jours", buddyInteractions: "1" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un rappel à Camille Girard", detail: "Rappel de son rôle de buddy", type: "email", preview: { to: "camille.girard@company.com", subject: "Rappel : parrainage de Nicolas Moreau", body: "Bonjour Camille,\n\nVous êtes la marraine de Nicolas Moreau (Data Analyst) qui est en onboarding depuis 7 jours.\n\nNous avons remarqué qu'il n'y a pas eu d'échange depuis 5 jours. Un petit café ou un message pourrait faire une grande différence pour son intégration !\n\nSuggestion : proposer un déjeuner ou un café cette semaine.\n\nMerci pour votre implication !" } },
        { id: 2, label: "Notifier le RH pour suivi", detail: "Information sur le parrainage inactif", type: "notification", preview: { to: "Léa Rousseau", subject: "Buddy inactif — Nicolas Moreau / Camille Girard", body: "Le parrainage de Nicolas Moreau par Camille Girard semble inactif (1 seule interaction en 7 jours). Un rappel a été envoyé à Camille. À surveiller." } },
      ]),
      alternatives: JSON.stringify([{ label: "Changer de buddy", description: "Proposer Alexandre Petit à la place" }]),
      status: "pending",
      createdAt: daysAgo(1),
    },
    // OPTIMIZATION
    {
      agentId: agentMap["weekly_report"].id,
      severity: "optimization",
      category: "administratif",
      title: "Synthèse hebdomadaire — 12 onboardings ce mois",
      summary: "12 collaborateurs ont été onboardés ce mois. Taux de complétion formation : 45%. 8 dossiers administratifs complets sur 12. 3 scores d'engagement < 5/10.",
      context: JSON.stringify({ employeeName: "Équipe RH", department: "Global", additionalInfo: { onboardingsThisMonth: "12", trainingCompletion: "45%", adminComplete: "8/12", lowEngagement: "3" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer des rappels de formation ciblés", detail: "Email aux 7 collaborateurs en retard", type: "email", preview: { to: "7 collaborateurs (envoi groupé)", subject: "Rappel : formations d'onboarding à compléter", body: "Bonjour,\n\nVous avez des formations d'onboarding en attente. Voici ce qu'il reste à faire :\n\n[Liste personnalisée par collaborateur]\n\nCes formations sont essentielles pour votre intégration. Elles sont disponibles en ligne et prennent entre 15min et 1h chacune.\n\nMerci de les compléter cette semaine !" } },
        { id: 2, label: "Proposer des formats courts alternatifs", detail: "Flashcards et synthèses pour les contenus longs", type: "task", preview: { subject: "Créer des formats courts de formation", body: "Générer des versions condensées pour les 3 formations les plus longues :\n• Sécurité informatique → Flashcard 5min\n• Culture d'entreprise → Synthèse 1 page\n• Process commercial → Checklist interactive", to: "Équipe RH" } },
      ]),
      alternatives: JSON.stringify([{ label: "Organiser une session collective", description: "Webinar de rattrapage pour les retardataires" }]),
      status: "pending",
      createdAt: daysAgo(0),
    },
    {
      agentId: agentMap["manager_inactive"].id,
      employeeId: employees[9].id, // Maxime
      severity: "optimization",
      category: "management",
      title: "Maxime Durand — Aucune action manager depuis 12 jours",
      summary: "Maxime Durand (Directeur Commercial) n'a effectué aucune action sur la plateforme depuis 12 jours : pas de check-in, pas de validation de tâches, pas de feedback.",
      context: JSON.stringify({ employeeName: "Maxime Durand", employeeRole: "Directeur Commercial", department: "Commercial", additionalInfo: { lastAction: "Il y a 12 jours", pendingCheckins: "2", pendingValidations: "5" } }),
      actionPlan: JSON.stringify([
        { id: 1, label: "Envoyer un récapitulatif à Maxime", detail: "Email avec les actions en attente", type: "email", preview: { to: "maxime.durand@company.com", subject: "Récapitulatif de vos actions en attente", body: "Bonjour Maxime,\n\nVous avez plusieurs actions en attente sur la plateforme :\n\n• 2 check-ins à réaliser (Emma Laurent, Thomas Martin)\n• 5 validations de tâches en attente\n• 0 feedback donné ce mois\n\nVotre dernière connexion remonte à 12 jours.\n\nUn besoin d'accompagnement ? N'hésitez pas à contacter l'équipe RH." } },
        { id: 2, label: "Planifier un point RH / Maxime", detail: "Vérifier si le manager a besoin d'aide", type: "meeting", preview: { subject: "Point accompagnement manager — Maxime Durand", date: "Cette semaine", duration: "30 minutes", participants: ["Maxime Durand", "Léa Rousseau (RH)"], note: "Objectif : comprendre le manque d'activité sur la plateforme et proposer un accompagnement si nécessaire." } },
      ]),
      alternatives: JSON.stringify([]),
      status: "pending",
      createdAt: daysAgo(5),
    },
    // Already resolved suggestions (for history)
    {
      agentId: agentMap["doc_incomplete"].id,
      employeeId: employees[3].id, // Thomas
      severity: "attention",
      category: "documents",
      title: "Thomas Martin — Attestation formation sécurité manquante",
      summary: "Thomas Martin n'avait pas fourni son attestation de formation sécurité obligatoire.",
      context: JSON.stringify({ employeeName: "Thomas Martin", employeeRole: "Commercial Senior", department: "Commercial" }),
      actionPlan: JSON.stringify([{ id: 1, label: "Relancer Thomas Martin", detail: "Email de rappel envoyé" }]),
      alternatives: JSON.stringify([]),
      status: "accepted",
      resolvedAt: daysAgo(3),
      createdAt: daysAgo(7),
    },
    {
      agentId: agentMap["welcome_message"].id,
      employeeId: employees[7].id, // Nicolas
      severity: "opportunity",
      category: "onboarding",
      title: "Nicolas Moreau — Message de bienvenue envoyé",
      summary: "Message de bienvenue personnalisé envoyé à Nicolas Moreau avec les accès et le guide de démarrage.",
      context: JSON.stringify({ employeeName: "Nicolas Moreau", employeeRole: "Data Analyst", department: "Tech" }),
      actionPlan: JSON.stringify([{ id: 1, label: "Envoyer message de bienvenue", detail: "Email envoyé avec succès" }]),
      alternatives: JSON.stringify([]),
      status: "accepted",
      resolvedAt: daysAgo(5),
      createdAt: daysAgo(7),
    },
    {
      agentId: agentMap["checkin_reminder"].id,
      employeeId: employees[10].id, // Chloé
      severity: "attention",
      category: "management",
      title: "Chloé Bernard — Check-in planifié avec Alexandre",
      summary: "Check-in M+0.5 planifié entre Chloé Bernard et Alexandre Petit.",
      context: JSON.stringify({ employeeName: "Chloé Bernard", employeeRole: "UX Researcher", department: "Produit" }),
      actionPlan: JSON.stringify([{ id: 1, label: "Planifier le check-in", detail: "Meeting créé le 10 mars à 14h" }]),
      alternatives: JSON.stringify([]),
      status: "customized",
      customizedAction: JSON.stringify({ note: "Check-in avancé d'une semaine à la demande du manager", date: "2026-03-10" }),
      resolvedAt: daysAgo(8),
      createdAt: daysAgo(10),
    },
    {
      agentId: agentMap["engagement_tracking"].id,
      employeeId: employees[11].id, // Romain
      severity: "urgent",
      category: "engagement",
      title: "Romain Lefebvre — Score engagement critique (4.1/10)",
      summary: "Romain Lefebvre montre des signes de désengagement importants. Score pulse très bas et activité en chute.",
      context: JSON.stringify({ employeeName: "Romain Lefebvre", employeeRole: "Ingénieur DevOps", department: "Tech" }),
      actionPlan: JSON.stringify([{ id: 1, label: "Planifier un entretien de rétention", detail: "Entretien confidentiel avec le RH" }]),
      alternatives: JSON.stringify([]),
      status: "accepted",
      resolvedAt: daysAgo(2),
      createdAt: daysAgo(6),
    },
    {
      agentId: agentMap["onboarding_satisfaction"].id,
      employeeId: employees[6].id, // Emma
      severity: "attention",
      category: "engagement",
      title: "Emma Laurent — Satisfaction onboarding moyenne",
      summary: "Emma a donné un score de 6/10 à son onboarding. Quelques frustrations remontées sur les accès outils.",
      context: JSON.stringify({ employeeName: "Emma Laurent", employeeRole: "Account Manager", department: "Commercial" }),
      actionPlan: JSON.stringify([{ id: 1, label: "Vérifier les accès outils", detail: "CRM, email, téléphone" }]),
      alternatives: JSON.stringify([]),
      status: "ignored",
      resolvedAt: daysAgo(4),
      createdAt: daysAgo(8),
    },
  ];

  for (const s of suggestions) {
    const suggestion = await prisma.suggestion.create({ data: s as Parameters<typeof prisma.suggestion.create>[0]["data"] });

    // Create action logs for resolved suggestions
    if (s.status === "accepted" || s.status === "customized") {
      const actions = JSON.parse(s.actionPlan) as Array<{ id: number; label: string }>;
      for (const action of actions) {
        await prisma.actionLog.create({
          data: {
            suggestionId: suggestion.id,
            actionType: action.label.includes("email") || action.label.includes("Envoyer") || action.label.includes("Notifier") || action.label.includes("Relancer") ? "email" : action.label.includes("Planifier") || action.label.includes("meeting") ? "meeting" : "task",
            actionDetails: JSON.stringify({ label: action.label, simulatedAt: s.resolvedAt?.toISOString(), status: "simulated" }),
          },
        });
      }
    }
  }

  const counts = {
    employees: employees.length,
    agents: agents.length,
    suggestions: suggestions.length,
  };

  return NextResponse.json({ success: true, ...counts });
}

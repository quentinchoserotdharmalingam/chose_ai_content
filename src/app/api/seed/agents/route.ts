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
      actionPlan: JSON.stringify([{ id: 1, label: "Assigner un manager (Alexandre Petit suggéré)", detail: "Envoyer la demande d'assignation au manager de l'équipe Produit" }, { id: 2, label: "Préparer le poste de travail", detail: "Vérifier l'accès aux outils : Figma, Slack, Notion" }, { id: 3, label: "Proposer un buddy", detail: "Chloé Bernard (UX Researcher) comme buddy recommandée" }]),
      alternatives: JSON.stringify([{ label: "Reporter l'onboarding d'une semaine", description: "Si les prérequis ne peuvent pas être remplis à temps" }]),
      status: "pending",
      createdAt: daysAgo(1),
    },
    {
      agentId: agentMap["doc_incomplete"].id,
      employeeId: employees[1].id, // Karim
      severity: "urgent",
      category: "documents",
      title: "Karim Benali — Premier jour, dossier incomplet (3 pièces)",
      summary: "Karim Benali commence aujourd'hui en tant que Développeur Frontend. Son dossier administratif est incomplet : RIB, attestation de sécurité sociale et carte vitale manquants.",
      context: JSON.stringify({ employeeName: "Karim Benali", employeeRole: "Développeur Frontend", department: "Tech", startDate: "2026-03-19", additionalInfo: { missingDocs: "RIB, Attestation sécu, Carte vitale", completionRate: "40%" } }),
      actionPlan: JSON.stringify([{ id: 1, label: "Envoyer un rappel à Karim", detail: "Email avec la liste des pièces manquantes et le lien de dépôt" }, { id: 2, label: "Notifier Léa Rousseau (RH)", detail: "Alerte au RH référent pour suivi" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Envoyer un email de bienvenue personnalisé", detail: "Rappel des accès et guide de démarrage" }, { id: 2, label: "Notifier le manager", detail: "Alerter pour qu'il planifie un point" }]),
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
      summary: "Emma Laurent est arrivée il y a 14 jours. Le check-in de mi-mois n'a pas encore été planifié par son manager Maxime Durand.",
      context: JSON.stringify({ employeeName: "Emma Laurent", employeeRole: "Account Manager", department: "Commercial", startDate: "2026-03-05", additionalInfo: { manager: "Maxime Durand", checkinType: "M+0.5", lastCheckin: "Aucun" } }),
      actionPlan: JSON.stringify([{ id: 1, label: "Notifier Maxime Durand", detail: "Rappel du check-in à planifier avec Emma" }, { id: 2, label: "Proposer un créneau", detail: "Suggestion automatique basée sur les agendas" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Relancer Chloé par email", detail: "Email avec formulaire mutuelle en pièce jointe et deadline" }, { id: 2, label: "Notifier le RH référent", detail: "Escalade pour suivi légal" }]),
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
      summary: "Nicolas Moreau (Data Analyst, arrivé il y a 7 jours) a 4 tâches d'onboarding en retard : accès data warehouse, formation SQL, rencontre équipe, objectifs 30j.",
      context: JSON.stringify({ employeeName: "Nicolas Moreau", employeeRole: "Data Analyst", department: "Tech", startDate: "2026-03-12", additionalInfo: { overdueTasks: "4", completedTasks: "3/7", pulseScore: "5.0/10" } }),
      actionPlan: JSON.stringify([{ id: 1, label: "Rappeler Nicolas", detail: "Email récapitulatif des tâches en retard" }, { id: 2, label: "Notifier Alexandre Petit (manager)", detail: "Alerte sur le retard d'onboarding" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Planifier les bilans de période d'essai", detail: "Créer 3 événements dans l'agenda de Maxime" }, { id: 2, label: "Générer les documents de bilan", detail: "Pré-remplir les formulaires d'évaluation" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Envoyer message de bienvenue", detail: "Email personnalisé avec présentation de l'équipe et des ressources" }, { id: 2, label: "Assigner un buddy", detail: "Proposer Sarah Dubois comme buddy Marketing" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Alerter Camille Girard (buddy)", detail: "Rappel de son rôle de buddy et suggestion de café" }, { id: 2, label: "Notifier le RH", detail: "Information pour suivi" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Envoyer rappels de formation ciblés", detail: "Email aux 7 collaborateurs n'ayant pas complété leur formation" }, { id: 2, label: "Proposer des formats courts", detail: "Flashcards et synthèses pour les contenus prioritaires" }]),
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
      actionPlan: JSON.stringify([{ id: 1, label: "Notifier Maxime Durand", detail: "Rappel des actions en attente avec récap" }, { id: 2, label: "Planifier un point avec le RH", detail: "Vérifier si le manager a besoin d'accompagnement" }]),
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

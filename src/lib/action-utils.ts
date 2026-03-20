import { Mail, CalendarDays, ClipboardList, Bell } from "lucide-react";

export const ACTION_TYPE_META: Record<string, { icon: typeof Mail; label: string; color: string; bg: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-600", bg: "bg-blue-50" },
  meeting: { icon: CalendarDays, label: "Événement", color: "text-purple-600", bg: "bg-purple-50" },
  task: { icon: ClipboardList, label: "Tâche", color: "text-green-600", bg: "bg-green-50" },
  notification: { icon: Bell, label: "Notification", color: "text-orange-600", bg: "bg-orange-50" },
};

export function inferActionType(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("email") || l.includes("envoyer") || l.includes("notifier") || l.includes("rappel") || l.includes("relancer")) return "email";
  if (l.includes("planifier") || l.includes("meeting") || l.includes("point") || l.includes("check-in") || l.includes("entretien")) return "meeting";
  if (l.includes("vérifier") || l.includes("créer") || l.includes("préparer") || l.includes("proposer")) return "task";
  return "notification";
}

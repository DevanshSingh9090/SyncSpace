import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getProjectProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "Done").length;
  return Math.round((done / tasks.length) * 100);
}

export function getTaskStatusColor(status) {
  switch (status) {
    case "To Do": return "bg-slate-100 text-slate-700";
    case "In Progress": return "bg-blue-100 text-blue-700";
    case "Review": return "bg-purple-100 text-purple-700";
    case "Done": return "bg-green-100 text-green-700";
    case "Planning": return "bg-purple-100 text-purple-700";
    case "On Hold": return "bg-yellow-100 text-yellow-700";
    case "Completed": return "bg-green-100 text-green-700";
    case "Cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getTaskPriorityColor(priority) {
  switch (priority) {
    case "High": return "text-red-600 bg-red-50";
    case "Medium": return "text-yellow-600 bg-yellow-50";
    case "Low": return "text-green-600 bg-green-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

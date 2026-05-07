import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStageConfig = (stage: string) => {
  switch (stage) {
    case "discovery":
      return {
        label: "Discovery",
        classes: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
      };
    case "architectural_design":
      return {
        label: "Architectural Design",
        classes: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
      };
    case "execution_package":
      return {
        label: "Execution Package",
        classes: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
      };
    case "complete":
      return {
        label: "Complete",
        classes: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
      };
    default:
      const fallbackLabel = stage
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      return {
        label: fallbackLabel,
        classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
      };
  }
};

export const formatStageName = (stage: string) => {
  if (stage === "All") return "All Stages";
  return getStageConfig(stage).label;
};
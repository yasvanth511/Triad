import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDateOnly(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function kmToMilesLabel(distanceKm?: number | null) {
  if (distanceKm == null) {
    return null;
  }

  const miles = distanceKm * 0.621371;
  return `${Math.round(miles)} mi away`;
}

export function joinLocation(...parts: Array<string | null | undefined>) {
  return parts.filter((part) => part && part.trim().length > 0).join(", ");
}

export function toTitleCase(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

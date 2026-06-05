import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a YYYY-MM-DD date string as local noon to avoid UTC-midnight timezone shifts.
 * Use this instead of `new Date(dateStr)` for calendar dates (not timestamps).
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00")
}

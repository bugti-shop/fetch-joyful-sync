import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility functions for the app

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined) {
    return '0';
  }

  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(2) + 'B';
  } else if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2) + 'M';
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(2) + 'K';
  } else {
    return amount.toFixed(2);
  }
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// TEST CI: intentionally broken import to test auto-monitor
import { nonExistentHelper } from './does-not-exist';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function brokenHelper(input: string): string {
  return nonExistentHelper(input);
}

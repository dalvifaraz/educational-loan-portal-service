import { randomInt } from 'crypto';

export function generateUniqueCode(): string {
  return randomInt(100000, 1000000).toString();
}

export function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

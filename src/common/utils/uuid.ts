import { randomInt } from 'crypto';

export function generateUniqueCode(): string {
  return randomInt(100000, 1000000).toString();
}

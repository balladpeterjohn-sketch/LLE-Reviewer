import * as Crypto from 'expo-crypto';

export function generateId(): string {
  return Crypto.randomUUID();
}

export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

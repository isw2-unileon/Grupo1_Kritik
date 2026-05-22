export function isEmpty(value: string): boolean {
  return value.trim().length === 0;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

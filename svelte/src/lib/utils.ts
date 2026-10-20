type ClassValue = string | number | false | null | undefined | ClassValue[] | Record<string, unknown>;

export function cn(...values: ClassValue[]): string {
  const result: string[] = [];
  const visit = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      result.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    for (const [name, enabled] of Object.entries(value)) if (enabled) result.push(name);
  };
  for (const value of values) visit(value);
  return result.join(' ');
}

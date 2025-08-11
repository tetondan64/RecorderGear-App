export function generateUniqueId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
}

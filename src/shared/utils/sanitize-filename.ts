export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Remove caracteres especiais
    .replace(/\.{2,}/g, '.')            // Remove .. (path traversal)
    .replace(/^\.+/, '')                // Remove pontos no início
    .slice(0, 255);                     // Limita tamanho
}

/** Lee el payload de un JWT. No verifica la firma: eso lo hace el back en cada petición. */
export function leerPayload(token: string): Record<string, unknown> | null {
  try {
    const parte = token.split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    return JSON.parse(decodeURIComponent(bytes)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True si el token ya venció o si no se puede leer su `exp`. */
export function tokenExpirado(token: string, ahoraMs: number = Date.now()): boolean {
  const exp = leerPayload(token)?.['exp'];
  return typeof exp !== 'number' || exp * 1000 <= ahoraMs;
}

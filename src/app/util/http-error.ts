import { HttpErrorResponse } from '@angular/common/http';

/**
 * Convierte un error de HttpClient en un texto para mostrar.
 * El back responde errores como texto plano (409, 406, 401...), pero un 404 de Tomcat
 * (contexto mal escrito) llega como HTML: en ese caso se muestra el mensaje por defecto + código.
 */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa la URL del back, tu conexión o el CORS.';
    }
    if (err.status === 403) {
      return 'No tienes permisos para esta acción o tu sesión expiró.';
    }
    if (typeof err.error === 'string' && err.error.trim() && !err.error.trimStart().startsWith('<')) {
      return err.error;
    }
    return `${porDefecto} (HTTP ${err.status}).`;
  }
  if (err instanceof Error && err.message) return err.message;
  return porDefecto;
}

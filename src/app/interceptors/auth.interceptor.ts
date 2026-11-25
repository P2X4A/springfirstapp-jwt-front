import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService } from '../services/auth.service';
import { tokenExpirado } from '../util/jwt';

/**
 * Agrega `Authorization: Bearer <token>` a las llamadas protegidas del back (todo menos /auth/**).
 * El filtro JWT del back ignora en silencio un token vencido y Spring responde 403 (no 401),
 * así que 403 + token vencido (o 401) significa "sesión expirada": se cierra y se va al login.
 * Un 403 con token vigente es un USER intentando una acción de ADMIN: se deja pasar al componente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  const esProtegida =
    req.url.startsWith(environment.apiBaseUrl) &&
    !req.url.startsWith(`${environment.apiBaseUrl}/auth/`);
  const peticion =
    token && esProtegida ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      const sesionExpirada =
        err instanceof HttpErrorResponse &&
        (err.status === 401 || (err.status === 403 && tokenExpirado(token ?? '')));
      if (esProtegida && token && sesionExpirada) {
        auth.logout();
        void router.navigate(['/login'], { queryParams: { expirada: 1 } });
      }
      return throwError(() => err);
    }),
  );
};

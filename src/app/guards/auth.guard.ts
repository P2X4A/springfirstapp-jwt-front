import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Deja pasar solo con sesión vigente; si no, manda al login y recuerda a dónde iba. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.haySesionValida()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

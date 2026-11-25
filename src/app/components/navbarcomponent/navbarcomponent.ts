import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbarcomponent',
  standalone: false,
  templateUrl: './navbarcomponent.html',
})
export class Navbarcomponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Cierra la sesión y vuelve al login. */
  salir(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

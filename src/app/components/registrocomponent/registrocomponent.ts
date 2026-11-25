import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensajeDeError } from '../../util/http-error';

/** Error de grupo: password y confirmación distintos. */
function coinciden(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('password')?.value === grupo.get('confirmar')?.value
    ? null
    : { noCoinciden: true };
}

@Component({
  selector: 'app-registrocomponent',
  standalone: false,
  templateUrl: './registrocomponent.html',
})
export class Registrocomponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.group(
    {
      username: ['', [Validators.required, Validators.maxLength(50)]],
      // El README del back pide al menos 8 caracteres.
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', Validators.required],
    },
    { validators: coinciden },
  );
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Registra (el back asigna rol USER) y manda al login. */
  onSubmit(): void {
    if (this.cargando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.register(username, password).subscribe({
      next: () => void this.router.navigate(['/login'], { queryParams: { registrado: 1 } }),
      error: (err: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo registrar el usuario'));
      },
    });
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Role, User } from '../../models/user';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { mensajeDeError } from '../../util/http-error';

@Component({
  selector: 'app-usuarioscomponent',
  standalone: false,
  templateUrl: './usuarioscomponent.html',
})
export class Usuarioscomponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly usuarios = signal<User[]>([]);
  protected readonly total = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly consultando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly resultadoConsulta = signal<string | null>(null);
  /** Id del usuario en edición; null cuando el formulario crea. */
  protected readonly editandoId = signal<number | null>(null);

  protected readonly roles: Role[] = ['USER', 'ADMIN'];

  protected readonly formulario = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    userAge: [18, [Validators.required, Validators.min(0), Validators.max(120)]],
    dateOfBirth: ['', Validators.required],
    role: ['USER' as Role, Validators.required],
  });
  protected readonly consulta = this.fb.group({
    id: [null as number | null, [Validators.required, Validators.min(1)]],
  });
  protected readonly eliminarNombre = this.fb.group({
    nombre: ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Trae la lista y el total. */
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({ lista: this.users.listar(), total: this.users.contar() }).subscribe({
      next: ({ lista, total }) => {
        this.usuarios.set(lista);
        this.total.set(total);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.usuarios.set([]);
        this.total.set(null);
        this.cargando.set(false);
        // getall y count los puede llamar USER y ADMIN: un 403 aquí no es falta de rol sino un
        // token que el back no acepta (otra clave, back reiniciado, otro servidor). Se reautentica.
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.auth.logout();
          void this.router.navigate(['/login'], { queryParams: { expirada: 1 } });
          return;
        }
        this.error.set(mensajeDeError(err, 'No se pudo cargar la lista de usuarios'));
      },
    });
  }

  /** GET /user/getbyid/{id}. */
  buscarPorId(): void {
    const id = this.idConsulta();
    if (id === null) return;
    this.consultando.set(true);
    this.resultadoConsulta.set(null);
    this.error.set(null);
    this.users.obtener(id).subscribe({
      next: (u) => {
        this.consultando.set(false);
        this.resultadoConsulta.set(
          `#${u.id} · ${u.username} · ${u.role ?? 'sin rol'} · ${u.userAge ?? '?'} años · ${u.dateOfBirth ?? 'sin fecha'}`,
        );
      },
      error: (err: unknown) => {
        this.consultando.set(false);
        this.error.set(mensajeDeError(err, `No se encontró el usuario con id ${id}`));
      },
    });
  }

  /** GET /user/exists/{id}. */
  verificarExiste(): void {
    const id = this.idConsulta();
    if (id === null) return;
    this.consultando.set(true);
    this.resultadoConsulta.set(null);
    this.error.set(null);
    this.users.existe(id).subscribe({
      next: (existe) => {
        this.consultando.set(false);
        this.resultadoConsulta.set(`El usuario con id ${id} ${existe ? 'existe' : 'no existe'}.`);
      },
      error: (err: unknown) => {
        this.consultando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo verificar la existencia'));
      },
    });
  }

  /** Crea o actualiza según haya un usuario en edición. */
  guardar(): void {
    if (this.guardando()) return;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const id = this.editandoId();
    const usuario: User = this.formulario.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    const peticion = id === null ? this.users.crear(usuario) : this.users.actualizar(id, usuario);
    peticion.subscribe({
      next: (texto) => {
        this.guardando.set(false);
        this.mensaje.set(texto);
        this.cancelarEdicion();
        this.cargar();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.error.set(
          mensajeDeError(err, id === null ? 'No se pudo crear el usuario' : 'No se pudo actualizar'),
        );
      },
    });
  }

  /** Pasa una fila al formulario. El password se pide de nuevo: el back siempre lo re-cifra. */
  editar(u: User): void {
    if (u.id === undefined) return;
    this.editandoId.set(u.id);
    this.formulario.reset({
      username: u.username,
      password: '',
      userAge: u.userAge ?? 0,
      dateOfBirth: u.dateOfBirth ?? '',
      role: u.role ?? 'USER',
    });
    this.error.set(null);
    this.mensaje.set(null);
    document.getElementById('usuario-username')?.focus();
  }

  /** Sale del modo edición y limpia el formulario. */
  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.formulario.reset();
  }

  /** DELETE /user/deletebyid/{id}. */
  eliminar(u: User): void {
    if (u.id === undefined || this.guardando()) return;
    if (!confirm(`¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    this.ejecutarBorrado(this.users.eliminar(u.id), 'No se pudo eliminar el usuario');
  }

  /** DELETE /user/deletebyname?name=. */
  eliminarPorNombre(): void {
    if (this.guardando()) return;
    if (this.eliminarNombre.invalid) {
      this.eliminarNombre.markAllAsTouched();
      return;
    }
    const { nombre } = this.eliminarNombre.getRawValue();
    if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    this.ejecutarBorrado(this.users.eliminarPorNombre(nombre), 'No se pudo eliminar el usuario', () =>
      this.eliminarNombre.reset(),
    );
  }

  private ejecutarBorrado(
    peticion: ReturnType<UserService['eliminar']>,
    porDefecto: string,
    alTerminar?: () => void,
  ): void {
    this.guardando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    peticion.subscribe({
      next: (texto) => {
        this.guardando.set(false);
        this.mensaje.set(texto);
        alTerminar?.();
        this.cargar();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, porDefecto));
      },
    });
  }

  private idConsulta(): number | null {
    if (this.consulta.invalid) {
      this.consulta.markAllAsTouched();
      return null;
    }
    return this.consulta.getRawValue().id;
  }
}

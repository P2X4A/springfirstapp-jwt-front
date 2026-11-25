import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthResponse, Session } from '../models/auth';
import { tokenExpirado } from '../util/jwt';

const CLAVE_SESION = 'springfirstapp.sesion';

/** Login, registro y sesión JWT contra /auth del back. La sesión vive en sessionStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly URL_BASE: string = `${environment.apiBaseUrl}/auth`;
  private readonly _session = signal<Session | null>(this.leerSesion());

  readonly session = this._session.asReadonly();
  readonly isAdmin = computed(() => this._session()?.role === 'ADMIN');

  /** Token actual o null si no hay sesión. */
  token(): string | null {
    return this._session()?.token ?? null;
  }

  /** True si hay sesión y el token no venció. Si venció, cierra la sesión. */
  haySesionValida(): boolean {
    const token = this.token();
    if (!token) return false;
    if (tokenExpirado(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  /** El back responde {token, role} o 401 con texto. */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.URL_BASE}/login`, { username, password })
      .pipe(tap((res) => this.guardarSesion({ token: res.token, role: res.role, username })));
  }

  /** El back responde texto: 201 ok, 409 si el usuario ya existe. */
  register(username: string, password: string): Observable<string> {
    return this.http.post(
      `${this.URL_BASE}/register`,
      { username, password },
      { responseType: 'text' },
    );
  }

  logout(): void {
    this._session.set(null);
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      /* storage bloqueado: la sesión en memoria ya se limpió */
    }
  }

  private guardarSesion(sesion: Session): void {
    this._session.set(sesion);
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      /* storage bloqueado: la sesión dura mientras no se recargue la página */
    }
  }

  private leerSesion(): Session | null {
    try {
      const crudo = sessionStorage.getItem(CLAVE_SESION);
      if (!crudo) return null;
      const sesion = JSON.parse(crudo) as Partial<Session>;
      return typeof sesion.token === 'string' && typeof sesion.username === 'string'
        ? { token: sesion.token, username: sesion.username, role: sesion.role ?? null }
        : null;
    } catch {
      return null;
    }
  }
}

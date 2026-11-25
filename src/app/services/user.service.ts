import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { User } from '../models/user';

/**
 * CRUD de usuarios contra /user del back. Necesita JWT (lo agrega auth.interceptor).
 * USER: getall, count, exists, getbyid. ADMIN: todo lo demás.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly URL_BASE: string = `${environment.apiBaseUrl}/user`;

  /** Lista todos. El back da 204 (sin cuerpo) si no hay usuarios. */
  listar(): Observable<User[]> {
    return this.http.get<User[] | null>(`${this.URL_BASE}/getall`).pipe(map((l) => l ?? []));
  }

  /** Total de usuarios. 204 (sin cuerpo) equivale a 0. */
  contar(): Observable<number> {
    return this.http.get<number | null>(`${this.URL_BASE}/count`).pipe(map((n) => n ?? 0));
  }

  /** True si existe. El back da 204 (sin cuerpo) cuando no existe. */
  existe(id: number): Observable<boolean> {
    return this.http
      .get<boolean | null>(`${this.URL_BASE}/exists/${id}`)
      .pipe(map((existe) => existe ?? false));
  }

  /** Busca por id. 404 si no existe. */
  obtener(id: number): Observable<User> {
    return this.http.get<User>(`${this.URL_BASE}/getbyid/${id}`);
  }

  /** Crea (ADMIN). El back responde texto: 201 ok, 406 nombre repetido, 400 caracteres inválidos. */
  crear(usuario: User): Observable<string> {
    return this.http.post(`${this.URL_BASE}/createjson`, usuario, { responseType: 'text' });
  }

  /**
   * Actualiza (ADMIN). El back responde 226 (IM_USED) cuando el nombre ya está en uso,
   * que HttpClient ve como éxito: se convierte en error para que la UI lo trate como tal.
   * Nota del back: updateById re-cifra siempre el password y también da 226 si el
   * nombre de usuario no cambia.
   */
  actualizar(id: number, usuario: User): Observable<string> {
    return this.http
      .put(`${this.URL_BASE}/updatejson`, usuario, {
        params: new HttpParams().set('id', String(id)),
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        map((res) => {
          if (res.status === 226) {
            throw new Error(res.body || 'El nuevo nombre de usuario ya está en uso');
          }
          return res.body ?? '';
        }),
      );
  }

  /** Elimina por id (ADMIN). 404 si no existe. */
  eliminar(id: number): Observable<string> {
    return this.http.delete(`${this.URL_BASE}/deletebyid/${id}`, { responseType: 'text' });
  }

  /** Elimina por nombre de usuario (ADMIN). 404 si no existe. */
  eliminarPorNombre(nombre: string): Observable<string> {
    return this.http.delete(`${this.URL_BASE}/deletebyname`, {
      params: new HttpParams().set('name', nombre),
      responseType: 'text',
    });
  }
}

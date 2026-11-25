import { Role } from './user';

/** Respuesta de POST /auth/login. */
export interface AuthResponse {
  token: string;
  role: Role | null;
}

/** Sesión guardada en el navegador tras iniciar sesión. */
export interface Session {
  token: string;
  username: string;
  role: Role | null;
}

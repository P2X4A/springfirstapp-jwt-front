/** Roles del back (enum User.Role). */
export type Role = 'USER' | 'ADMIN';

/**
 * Espejo de UserDTO. El back también devuelve `password` (hash BCrypt) en /user/getall;
 * la UI nunca lo muestra.
 */
export interface User {
  id?: number;
  username: string;
  password?: string;
  userAge?: number;
  /** LocalDate serializado por Jackson: yyyy-MM-dd. */
  dateOfBirth?: string;
  role?: Role;
}

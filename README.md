# SpringFirstApp JWT · Front Angular

Front mínimo en Angular 22 (**NgModules, sin standalone**) que consume el back `SpringFirstAppJWT`
(Spring Boot 3 + JWT) desplegado en Tomcat.

## Configurar la URL del back

Tomcat publica el WAR bajo el contexto de su nombre: `SpringFirstApp-1.2.war` → `/SpringFirstApp-1.2`
(salvo que lo hayas renombrado, p. ej. `ROOT.war` → sin contexto).

| Modo | Dónde se cambia | Cómo se usa |
| --- | --- | --- |
| Desarrollo (`npm start`) | `proxy.conf.js` o la variable `API_TARGET` | El navegador llama a `/api/*` y el dev-server lo reenvía al Tomcat |
| Producción (`npm run build`) | `src/app/environments/environment.ts` → `apiBaseUrl` | El navegador llama directo al Tomcat |

Por defecto `npm start` apunta a tu back local (`http://localhost:8081`, el de Run As Spring Boot
App, sin contexto). Para usar el Tomcat de la nube:

```powershell
$env:API_TARGET='https://tu-servidor/SpringFirstApp-1.2'; npm start
```

Si cambias de back, cierra sesión y vuelve a entrar: cada back firma sus JWT con su propia clave.

## Comandos

```bash
npm install
npm start        # http://localhost:4200
npm run build    # dist/springfirstapp-jwt-front/browser
```

## Pantallas (hash routing: `/#/ruta`)

| Ruta | Descripción |
| --- | --- |
| `/login` | `POST /auth/login`, guarda el JWT en `sessionStorage` |
| `/registro` | `POST /auth/register` (rol USER) |
| `/usuarios` | Protegida por `authGuard`. USER: ver lista, contar, consultar por ID. ADMIN: además crear, editar y eliminar |

`auth.interceptor` añade `Authorization: Bearer <token>` a todo lo que no sea `/auth/**`.
Si el token venció (el back responde **403**, no 401) o hay un 401, cierra la sesión y manda a `/login`.

## Endpoints usados

`/auth/login`, `/auth/register`, `/user/getall`, `/user/count`, `/user/exists/{id}`,
`/user/getbyid/{id}`, `/user/createjson`, `/user/updatejson?id=`, `/user/deletebyid/{id}`,
`/user/deletebyname?name=`.

## Notas sobre el back (no se modificó)

- **CORS**: `SecurityConfig` no activa CORS y solo `UserController` tiene
  `@CrossOrigin(localhost:8080, localhost:8081)`. Un navegador en otro origen no puede llamar a
  `/auth/login`. En desarrollo el proxy lo evita (y además quita el header `Origin`, que Spring
  rechazaría con 403 en `/user/**`). **En producción** hay dos opciones: servir este build desde el
  mismo Tomcat (mismo origen, no necesita CORS) o añadir `.cors(...)` al `SecurityFilterChain`
  permitiendo el origen del front.
- **Editar usuario**: `updateById` siempre re-cifra el password (con `null` falla) y responde 226
  "ya está en uso" si el nombre de usuario no cambia. Por eso el formulario de edición exige
  contraseña y la UI muestra ese 226 como error.
- `/user/getall` devuelve también el hash del password de cada usuario; la UI no lo muestra.

## Desplegar el build en el mismo Tomcat

Copia el contenido de `dist/springfirstapp-jwt-front/browser` a `webapps/<nombre>/` y compila con
`npm run build -- --base-href /<nombre>/`. Como el routing usa hash, no hace falta reescribir rutas.
Para que sea mismo origen con el back, usa una URL relativa al contexto del back en ese Tomcat,
p. ej. `apiBaseUrl: '/SpringFirstApp-1.2'`.

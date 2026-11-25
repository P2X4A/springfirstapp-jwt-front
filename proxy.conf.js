/**
 * Proxy de `ng serve`: el navegador llama a http://localhost:4200/api/* y el dev-server
 * lo reenvía al Tomcat en la nube. Así el navegador no hace una petición cross-origin y
 * no hace falta tocar el CORS del back.
 *
 * URL destino: la variable de entorno API_TARGET o, si no existe, tu back local.
 *  - Back local (Run As Spring Boot App): http://localhost:8081, sin contexto. Es el valor por defecto.
 *  - Back en Tomcat en la nube: URL + contexto del WAR, sin "/" al final.
 *
 *   PowerShell:  $env:API_TARGET='https://mi-servidor/SpringFirstApp-1.2'; npm start
 *   bash:        API_TARGET='https://mi-servidor/SpringFirstApp-1.2' npm start
 */
const target = process.env.API_TARGET || 'http://localhost:8081';

module.exports = {
  '/api': {
    target,
    secure: true,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    configure: (proxy) => {
      // UserController tiene @CrossOrigin solo para localhost:8080/8081. El navegador manda
      // `Origin: http://localhost:4200` en POST/PUT/DELETE y Spring respondería 403
      // "Invalid CORS request". Sin Origin, el back trata la petición como same-origin.
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
    },
  },
};

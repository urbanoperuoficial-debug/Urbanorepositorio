# URBANO · Pagos NFC con acceso privado

Proyecto web independiente de la aplicación principal URBANO. Está preparado para Vercel, con seis logos proporcionados por el propietario, seis opciones de pago, copia de datos y un acceso con clave comprobada por el servidor.

## Despliegue en Vercel

1. Importar el repositorio de GitHub `urbanoperuoficial-debug/Urbanorepositorio` con **Root Directory = urbano-pagos-vercel**.
2. Elegir **Framework: Other** (sirve el directorio `public` y las funciones de `api`).
3. Configurar las tres variables de entorno en Vercel, nunca en el repositorio:
   - `URBANO_PAYMENT_PIN`: código de acceso acordado con los clientes.
   - `URBANO_SESSION_SECRET`: secreto aleatorio de mínimo 32 caracteres.
   - `URBANO_PAYMENT_ACCOUNTS_JSON`: JSON con 6 campos exactos `Yape`, `Plin`, `BBVA`, `BCP`, `Interbank`, `Scotiabank` (solo dígitos).
4. Configurar una regla de **rate limit** en Vercel Firewall para `Request Path Equals /api/login` antes de compartir el enlace. Por ejemplo, 5 solicitudes por IP y por ventana de 10 minutos, según las posibilidades del plan.
5. Desplegar, verificar que `GET /api/payments` devuelve HTTP 401 sin haber iniciado sesión, y que devuelve la información después de entrar con una clave correcta. Probar también `Salir`.
6. Copiar el dominio HTTPS del sitio, grabarlo en NFC Tools con `Escribir > Añadir un registro > URL/URI`.

## Seguridad

- Los números de cuentas no están en el repositorio ni en los archivos HTML o JavaScript enviados al navegador antes de autenticar.
- Cookie firmada HMAC SHA-256, `HttpOnly`, `Secure`, `SameSite=Strict`, vigencia renovable de hasta 400 días desde cada visita autenticada al mismo navegador. En algunos dispositivos o navegadores puede expirar antes.
- No es un procesador de pagos y no inicia Yape con beneficiario precargado: el usuario debe copiar el dato y confirmar el pago desde su propia app.
- Con clave de solo 4 dígitos, el límite de intentos es indispensable. Considerar sustituirla por una contraseña más larga.
- Logos y la pantalla pública son accesibles; **los datos privados de pago no se entregan sin sesión autenticada**. No equivale a una red privada o VPN.

No modifica la aplicación principal de URBANO ni sus bases de datos.

## Límite de acceso y permanencia de sesión

- El firewall de Vercel limita **3 solicitudes POST a /api/login por IP cada 10 minutos**. Es una medida contra el abuso, no un contador exacto de claves incorrectas, y puede afectar a clientes que comparten una IP.
- El navegador conserva una cookie de sesión firmada y segura durante hasta **400 días**, renovada tras cada consulta autenticada. Mientras el cliente vuelva a abrir el portal antes de que expire en ese mismo navegador, no necesita ingresar otra vez el PIN.
- Al usar **Salir** se elimina la cookie del navegador. También deberá ingresar la clave si elimina cookies, cambia de navegador o dispositivo, usa modo incógnito o supera el tiempo de inactividad.
- Este modelo no permite revocación selectiva de sesiones sin una base de datos de sesiones. En equipos compartidos, se recomienda cerrar sesión.
- El proyecto está aislado de la aplicación principal URBANO; su publicación comercial requiere un plan de Vercel que lo permita.

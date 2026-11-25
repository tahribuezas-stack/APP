# KINET OS · v57 · Seguridad y protección de datos

## Orden para aplicarlo (importante)
1. **Sube el código v57 a GitHub** (todo el contenido de la carpeta, como siempre). Espera 1–2 min a que GitHub Pages despliegue.
2. En Supabase → **SQL Editor**, pega y ejecuta **`14_privacidad_rls.sql`** (entero, una vez). Es seguro repetirlo.
3. (Recomendado) Ejecuta también **`13_copia_estado.sql`**: guarda una copia automática si alguien pierde datos.
4. Comprueba abriendo la app con tu cuenta: Comunidad (feed, mensajes y directorio), Analizador (plantilla) y Perfil deben cargar igual que antes.

> Si ejecutas el SQL antes de subir el código, la lista de usuarios de Comunidad/Analizador puede quedar vacía unos minutos. No se pierde nada.

## Qué se ha corregido

### Pérdida de datos (CV, perfil, color…)
- **Causa:** la sincronización propagaba los *borrados*: si un dispositivo perdía claves (navegador limpiado, modo invitado, otro dispositivo con datos incompletos) la nube las borraba y el resto de dispositivos también.
- **Ahora:** los datos del usuario (perfil, CV, chats, plantilla…) **nunca se borran de la nube por desaparecer de un dispositivo**. Solo se vacían si el usuario deja el campo vacío a propósito. Si la nube pierde algo que un dispositivo sí tiene, ese dispositivo lo vuelve a subir (autoreparación). Un borrado masivo sospechoso se ignora.
- Probado en simulación: con el código antiguo se perdía todo; con el nuevo se recupera.
- `13_copia_estado.sql` añade una red de seguridad en el servidor (copia de las últimas 10 versiones si alguien pierde ≥25 % de sus datos).

### Base de datos abierta (crítico)
- `direct_messages`: **cualquiera podía leer los mensajes directos sin iniciar sesión**. Ahora solo los ven el remitente y el destinatario; no se puede suplantar a otro ni editar mensajes (solo marcarlos como leídos).
- `posts`: solo el autor puede crear con su identidad y borrar lo suyo; los demás solo actualizan el contador de "me gusta".
- `app_config`: nadie escribe desde la web (solo las funciones del panel de staff).
- `profiles`: antes cualquier usuario con sesión podía leer email, plan, correo del tutor y todo el estado privado (chats, etc.) de **todos**. Ahora cada uno ve lo suyo (y el staff todo); el resto ve la vista `profiles_public` con datos mínimos.
- Sin sesión (anon) ya no se puede escribir nada, salvo abrir un ticket de soporte.
- Las claves de API personales (Gemini/Groq/OpenAI) y tokens de Spotify **dejan de subirse a la nube**; el SQL borra las que ya estuvieran.

### XSS almacenado (crítico)
- Un usuario podía ejecutar código en el navegador de otro con un nombre, @usuario, titular, insignia o **mensaje directo** malicioso (robo de sesión). Ahora todo lo que llega de otros usuarios se sanea y se escapa al pintarlo.

### Rendimiento
- El micro-corte al cambiar de sección venía de `kinet-fx.js` (luz LED + barra de progreso) trabajando justo durante la entrada de los cuadros. Ahora se reparte en trozos de ≤5 ms y se hace después de la animación.

## Lo que NO está (sé honesto con los usuarios)
- **Los mensajes directos NO tienen cifrado de extremo a extremo.** Quedan privados frente a otros usuarios y visitantes (RLS), pero se guardan en texto en tu base de datos y tú, como administrador, puedes leerlos. No lo anuncies como "cifrado E2E". Implementarlo de verdad (claves por dispositivo) es un proyecto aparte.
- Otros recomendados en Supabase → Authentication: activar *Leaked password protection* y una longitud mínima de contraseña de 8–10; valorar MFA para cuentas de staff.
- `email_from_handle` (entrar con @usuario) permite saber el email de un @usuario sin sesión. Es una decisión de comodidad; si no quieres ese comportamiento, quita el login por @usuario.
- GitHub Pages no permite cabeceras de seguridad propias (CSP, HSTS). Si más adelante pasas a Cloudflare delante del dominio, se pueden añadir.

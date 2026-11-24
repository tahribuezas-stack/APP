/* ==========================================================
   KINET OS · Base de soluciones de Soporte (respuestas inmediatas, sin coste de IA)
   Se usa en la página de Soporte y en el chat @kinet_support de Comunidad.
   Estructura de cada respuesta:  diagnóstico en una línea · Pasos numerados · Si persiste.
   API: KinetSupportKB.isVague(text) · .match(text) · .format(topic) · .chips()
   ========================================================== */
(function () {
  'use strict';
  if (window.KinetSupportKB) return;

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var T = [
    {
      id: 'acceso', icon: '🔑', label: 'No puedo entrar a mi cuenta',
      re: /(iniciar sesion|no puedo entrar|no me deja entrar|contrasena|password|login|acceder a mi cuenta|no accedo|sesion caduc)/,
      lead: 'Suele resolverse en un minuto comprobando el correo y renovando la sesión.',
      steps: ['Comprueba que escribes el mismo correo con el que te registraste (sin espacios al final).', 'Si no recuerdas la contraseña, usa «¿Olvidaste tu contraseña?» en la pantalla de acceso y revisa también la carpeta de spam.', 'Recarga con Ctrl + F5 o prueba en una ventana de incógnito u otro navegador.'],
      persist: 'escríbenos desde «Contacto directo con Soporte» indicando tu correo y el mensaje exacto que ves.'
    },
    {
      id: 'ia', icon: '🧠', label: 'El Cuerpo Técnico IA no responde',
      re: /(cuerpo tecnico|entrenador ia|la ia no|ia no responde|no responde la ia|no contesta|error de api|api ia|clave de api|api key|se queda pensando)/,
      lead: 'Casi siempre es el cupo diario de consultas o un fallo temporal de conexión.',
      steps: ['Mira cuántas consultas te quedan en la tarjeta «Uso de IA» de la barra lateral o en la franja «IA HOY» del chat: se reinicia a las 00:00 h.', 'Comprueba tu conexión y recarga la página (Ctrl + F5).', 'Si usas clave propia, revisa el botón «API IA» de la cabecera del chat y vuelve a guardarla.', 'Reformula la consulta de forma más concreta e inténtalo otra vez.'],
      persist: 'envíanos el mensaje de error completo desde el formulario de contacto.'
    },
    {
      id: 'pagos', icon: '💳', label: 'Pagos, plan o suscripción',
      re: /(pago|cobro|cobrado|tarjeta|factura|suscripcion|plan pro|plan club|reembolso|cancelar|devolucion|stripe|bono|precio)/,
      lead: 'Los cambios de plan y la compra de bonos se gestionan desde tu cuenta; los cobros concretos los revisa el equipo.',
      steps: ['Entra en «Despacho & Ajustes» → «Suscripción» para cambiar de plan (mensual o anual) o comprar bonos de minutos.', 'Tras pagar, recarga la página: el plan se actualiza en unos segundos.', 'Para facturas, reembolsos o cancelaciones, usa el formulario de contacto con el motivo «Pagos».'],
      persist: 'indícanos el correo de la cuenta y la fecha aproximada del cobro (nunca envíes datos de tu tarjeta).'
    },
    {
      id: 'card', icon: '🎴', label: 'Mi KINET Card muestra ??',
      re: /(kinet card|carta|\?\?|calibrar|calibra|barras|atributos|grl)/,
      lead: 'La carta muestra «??» hasta que está calibrada.',
      steps: ['Entra en «Ficha & KINET Card» o en el Analizador 3D («Crear / Editar»).', 'Con el modo manual, asigna tus 6 barras entre 50 y 99.', 'Con AI Verified, sube los 3 micro-clips de tu posición para que la IA la calcule.'],
      persist: 'dinos en qué pantalla te quedas y qué ves.'
    },
    {
      id: 'video', icon: '🎬', label: 'Mi vídeo no se sube o no se analiza',
      re: /(video|clip|vision lab|laboratorio|subir un|no se sube|no carga el video|short|minutos de video)/,
      lead: 'Revisa formato, duración y minutos disponibles.',
      steps: ['Usa MP4 o MOV. Los clips de la comunidad no pueden pasar de 20 segundos y se comprimen antes de subir.', 'Comprueba que tu plan tiene minutos de vídeo disponibles (Despacho → «Desglose»).', 'Prueba con una conexión estable y con un archivo más ligero.'],
      persist: 'cuéntanos el formato, la duración del archivo y el mensaje que aparece.'
    },
    {
      id: 'media', icon: '🎨', label: 'Media Studio no genera lo que pido',
      re: /(media studio|poster|imagen generada|generar imagen|no genera|edicion de imagen|spotify)/,
      lead: 'Las imágenes tienen cupo diario y funcionan mejor con una descripción concreta.',
      steps: ['Comprueba tus imágenes disponibles hoy en la cabecera del estudio.', 'Describe el sujeto, el estilo y el formato (ej.: «balón de fútbol sobre césped, luz de estadio, vertical 9:16»).', 'Si subes una foto, indica qué quieres cambiar de ella.'],
      persist: 'envíanos tu descripción exacta y qué resultado obtuviste.'
    },
    {
      id: 'calendario', icon: '🗓️', label: 'Calendario y sesiones',
      re: /(calendario|sesion|sesiones|programar|entrenamiento programado|semana)/,
      lead: 'El calendario empieza vacío: solo aparece lo que tú o la IA programáis.',
      steps: ['En Vestuario pulsa «Calendario / Ajustar» y elige el día.', 'Añade la sesión (hora, tipo y título) o pulsa «Programar con IA» para generar tu semana.', 'Marca cada sesión como hecha desde la lista del día.'],
      persist: 'dinos qué día y qué acción no funciona.'
    },
    {
      id: 'cuenta', icon: '⚙️', label: 'Cambiar deporte, rol o mis datos',
      re: /(cambiar de deporte|cambiar deporte|cambiar de rol|cambiar rol|mis datos|editar perfil|nombre de usuario|handle|foto de perfil)/,
      lead: 'Se hace desde Despacho y Mi Perfil.',
      steps: ['Despacho & Ajustes → «Cambiar Rol» para pasar de deportista a entrenador u ojeador (máx. 3 perfiles).', 'Mi Perfil → edita tus datos y pulsa «Guardar Ficha y Sincronizar».', 'El deporte activo se cambia desde Despacho; los datos propios de cada deporte se guardan por separado.'],
      persist: 'indícanos qué dato no se guarda.'
    },
    {
      id: 'privacidad', icon: '🔒', label: 'Borrar mi cuenta o mis datos',
      re: /(borrar mi cuenta|eliminar mi cuenta|dar de baja|borrar mis datos|privacidad|rgpd|mis datos personales|baja)/,
      lead: 'Puedes ejercer tus derechos sobre tus datos en cualquier momento.',
      steps: ['Revisa Despacho & Ajustes → «Privacidad» para gestionar tus consentimientos.', 'Para borrar la cuenta o pedir una copia de tus datos, usa el formulario de contacto con el motivo «Privacidad».', 'Te confirmaremos por correo cuando esté tramitado.'],
      persist: 'la información legal completa está en la página Legal.'
    },
    {
      id: 'abuso', icon: '🚩', label: 'Denunciar contenido o a un usuario',
      re: /(denunciar|reportar un|reportar a|contenido ofensivo|acoso|insulto|porno|abuso|spam|suplant)/,
      lead: 'Retiramos el contenido que incumple las normas (pornografía, acoso, insultos, suplantación o datos de terceros).',
      steps: ['En la publicación abre el menú «⋮» y elige «Reportar».', 'Si es una persona, puedes bloquearla desde su perfil para no recibir sus mensajes.', 'Para casos graves, escríbenos con el enlace o el @usuario desde el formulario de contacto.'],
      persist: 'suspendemos las cuentas reincidentes.'
    }
  ];

  function match(text) {
    var q = norm(text);
    if (q.length < 3) return null;
    for (var i = 0; i < T.length; i++) if (T[i].re.test(q)) return T[i];
    return null;
  }
  function isVague(text) {
    var q = norm(text).trim();
    if (!q || q.length > 70) return false;
    return /(problema|ayuda|ayudame|auxilio|error|fallo|no funciona|no va|bug|incidencia|se ha roto|no me deja|necesito soporte)/.test(q) && !match(q);
  }
  function format(t) {
    return t.lead + '\n\nPasos:\n' + t.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n') + '\n\nSi persiste: ' + t.persist;
  }
  function chips() { return T.slice(0, 6).map(function (t) { return { id: t.id, label: t.icon + ' ' + t.label, ask: t.label }; }); }

  window.KinetSupportKB = { topics: T, match: match, isVague: isVague, format: format, chips: chips,
    vagueIntro: 'Para ayudarte más rápido, elige el tema que más se parezca a tu problema:' };
})();

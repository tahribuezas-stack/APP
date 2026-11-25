/* KINET OS · Juego 6 · Adivina la jugada (sala de vídeo táctica) · 5 niveles con jugadas de varias decisiones. Sin registro.
   actor: [id, equipo, x0, y0, x1, y1]  ·  opción: {t, to:[x,y]|'id', ok, why, stop:'id', cont:1 (la jugada sigue aunque el destino sea un punto)}
   next: decisiones siguientes de la misma jugada → {mv:{id:[x,y]}, o:[opciones]} (los actores parten de donde se congelaron). */
(function () {
  'use strict';
  var PL = {
    futbol: [
      { n: 'Contraataque 3 contra 2', ball: 'A1', a: [['A1', 'a', 30, 50, 60, 50], ['A2', 'a', 36, 22, 68, 24], ['A3', 'a', 36, 78, 68, 76], ['B1', 'b', 80, 44, 76, 43], ['B2', 'b', 80, 58, 77, 58]],
        o: [{ t: 'Pase a A2 por fuera arriba', to: 'A2', ok: 0, stop: 'B1', why: 'B1 cierra ese carril y corta el pase. Con 3 contra 2 el que decide tiene que fijar a un defensor antes de pasar.' },
          { t: 'Pase a A3 al espacio libre', to: 'A3', ok: 1, why: 'B2 está lejos de A3. El pase al espacio libre deja al compañero con ventaja para encarar o tirar.' },
          { t: 'Disparo de lejos', to: [100, 50], ok: 0, stop: 'B2', why: 'Disparar a 40 metros con compañeros libres es desperdiciar una ventaja numérica.' }] },
      { n: 'Presión alta del rival', ball: 'A1', a: [['A1', 'a', 30, 52, 40, 50], ['A2', 'a', 22, 70, 28, 66], ['A3', 'a', 52, 40, 64, 40], ['B1', 'b', 56, 56, 47, 50], ['B2', 'b', 70, 44, 66, 42]],
        o: [{ t: 'Pase largo a A3', to: 'A3', ok: 0, stop: 'B2', why: 'A3 está marcado por B2: es un pase de 50 % que, si se pierde, deja a tu equipo expuesto.' },
          { t: 'Pase atrás a A2 y cambio de lado', to: 'A2', ok: 1, why: 'Al ir B1 a presionar, deja un hueco a su espalda. El pase atrás conserva el balón y rompe la presión.' },
          { t: 'Regatear a B1', to: [56, 50], ok: 0, stop: 'B1', why: 'Regatear con un defensor encima y en tu campo es el riesgo más alto posible.' }] },
      { n: 'Llegada por banda', ball: 'A1', a: [['A1', 'a', 62, 14, 80, 18], ['A2', 'a', 80, 52, 86, 50], ['A3', 'a', 66, 62, 72, 58], ['B1', 'b', 90, 42, 91, 42], ['B2', 'b', 76, 40, 82, 32], ['B3', 'b', 92, 60, 92, 60]],
        o: [{ t: 'Centro al área a A2', to: 'A2', ok: 0, stop: 'B1', why: 'A2 está entre dos defensas: el centro lo ganará el rival.' },
          { t: 'Pase atrás a A3, que llega libre', to: 'A3', ok: 1, why: 'Los defensas miran al balón y a A2. A3 llega desde atrás sin marca: la jugada clásica de cutback.' },
          { t: 'Tiro directo desde el ángulo cerrado', to: [100, 46], ok: 0, stop: 'B3', why: 'Desde ese ángulo casi no hay portería que ver.' }],
        next: [{ mv: { A3: [78, 58], B1: [91, 46], B2: [80, 46], B3: [92, 56] },
          o: [{ t: 'Tiro raso al palo largo', to: [100, 66], ok: 1, why: 'B1 y B3 están pendientes de A2 en el área pequeña y B2 llega tarde: queda el hueco del palo largo para un tiro raso y colocado.' },
            { t: 'Pase a A2 en el área pequeña', to: 'A2', ok: 0, stop: 'B1', why: 'A2 tiene a dos defensas encima. Con el tiro a mano, ese pase es complicarse.' },
            { t: 'Pase atrás a A1 en la banda', to: 'A1', ok: 0, stop: 'B2', why: 'Retrocedes la jugada y B2, que se está recomponiendo, corta el pase.' }] }] },
      { n: 'Ataque posicional', ball: 'A1', a: [['A1', 'a', 46, 50, 56, 50], ['A2', 'a', 56, 20, 66, 22], ['A3', 'a', 60, 78, 68, 76], ['A4', 'a', 56, 40, 70, 42], ['B1', 'b', 62, 54, 62, 54], ['B2', 'b', 74, 34, 72, 36], ['B3', 'b', 82, 30, 80, 32], ['B4', 'b', 74, 74, 72, 72]],
        o: [{ t: 'Pase a A4 entre líneas', to: 'A4', ok: 0, stop: 'B2', why: 'A4 está marcado por B2 y B1 vigila la línea de pase: se pierde.' },
          { t: 'Pase a A2, abierto en la banda', to: 'A2', ok: 1, cont: 1, why: 'A2 está solo: B3 queda lejos y B2 no puede soltar a A4. Abres el campo y obligas a toda la defensa a moverse.' },
          { t: 'Cambio de orientación a A3', to: 'A3', ok: 0, stop: 'B4', why: 'A3 tiene a B4 pegado. Un pase largo da tiempo a la defensa para ajustar.' },
          { t: 'Disparo lejano', to: [100, 50], ok: 0, stop: 'B1', why: 'Disparar a 45 metros con tres compañeros desmarcándose es regalar el balón.' }],
        next: [{ mv: { A2: [70, 24], A4: [82, 40], A3: [84, 66], A1: [66, 50], B1: [66, 52], B2: [80, 40], B3: [74, 28], B4: [80, 77] },
          o: [{ t: 'Centro tenso al primer palo (A4)', to: 'A4', ok: 0, stop: 'B2', why: 'B2 se ha pegado a A4 y gana el primer palo.' },
            { t: 'Centro al segundo palo (A3)', to: 'A3', ok: 1, why: 'A3 llega lanzado desde atrás y su par se ha quedado mirando el balón: remata libre en el segundo palo.' },
            { t: 'Pase atrás a A1', to: 'A1', ok: 0, stop: 'B1', why: 'Frenas la jugada y B1 llega a tiempo para cortar.' },
            { t: 'Tiro desde el ángulo', to: [100, 30], ok: 0, stop: 'B3', why: 'Desde ese ángulo B3 tapa el disparo y el portero lo tiene fácil.' }] }] },
      { n: 'Cuatro contra tres con transición', ball: 'A1', a: [['A1', 'a', 46, 50, 60, 50], ['A2', 'a', 44, 28, 66, 26], ['A3', 'a', 44, 72, 66, 74], ['A4', 'a', 40, 50, 58, 52], ['B1', 'b', 74, 44, 72, 46], ['B2', 'b', 74, 56, 72, 54], ['B3', 'b', 80, 34, 72, 30]],
        o: [{ t: 'Pase a A2 por la banda de arriba', to: 'A2', ok: 0, stop: 'B3', why: 'B3 ha salido a cerrar a A2: ese pase llega con un defensor encima.' },
          { t: 'Pase a A3 por la banda libre', to: 'A3', ok: 1, cont: 1, why: 'Toda la defensa se ha escorado hacia arriba. La banda de abajo está sin nadie: ahí está la superioridad.' },
          { t: 'Pase atrás a A4', to: 'A4', ok: 0, stop: 'B2', why: 'Retrasar el balón en un 4 contra 3 es regalar la ventaja que tanto costó crear.' },
          { t: 'Disparo desde lejos', to: [100, 50], ok: 0, stop: 'B1', why: 'Con tres compañeros desmarcados, tirar de lejos es renunciar a la ventaja.' }],
        next: [{ mv: { A1: [76, 52], A2: [80, 38], A4: [70, 60], B1: [78, 50], B2: [72, 70], B3: [80, 42] },
          o: [{ t: 'Pase diagonal a A1', to: 'A1', ok: 0, stop: 'B1', why: 'B1 se ha quedado con A1 y tiene el pase en la línea de visión.' },
            { t: 'Pase atrás a A4, que llega de segunda línea', to: 'A4', ok: 1, why: 'B2 salió a por ti y dejó el pasillo de segunda línea. A4 llega con espacio y de cara para rematar.' },
            { t: 'Centro a A2', to: 'A2', ok: 0, stop: 'B3', why: 'B3 ya está con A2: el centro es una pérdida casi segura.' },
            { t: 'Disparo desde la banda', to: [100, 66], ok: 0, stop: 'B2', why: 'Desde la banda el ángulo es muy cerrado y B2 está encima.' }] }] }
    ],
    baloncesto: [
      { n: 'Bloqueo y continuación', ball: 'A1', a: [['A1', 'a', 48, 50, 62, 50], ['A2', 'a', 60, 40, 66, 45], ['A3', 'a', 78, 22, 90, 12], ['B1', 'b', 56, 52, 64, 50], ['B2', 'b', 74, 44, 82, 44], ['B3', 'b', 80, 24, 85, 36]],
        o: [{ t: 'Forzar la bandeja', to: [92.5, 50], ok: 0, stop: 'B2', why: 'B2 espera bajo el aro: la bandeja sería taponada o muy forzada.' },
          { t: 'Pase a A3 en la esquina', to: 'A3', ok: 1, why: 'B3 se ha cerrado a ayudar en la pintura y deja la esquina libre. Es el tiro cómodo que busca la jugada.' },
          { t: 'Tiro lejano con B1 encima', to: [92.5, 50], ok: 0, stop: 'B1', why: 'B1 sigue pegado tras el bloqueo: el tiro saldría defendido.' }] },
      { n: 'Contraataque 2 contra 1', ball: 'A1', a: [['A1', 'a', 38, 50, 66, 50], ['A2', 'a', 40, 28, 70, 24], ['B1', 'b', 84, 40, 80, 44]],
        o: [{ t: 'Tiro de tres con B1 acercándose', to: [92.5, 50], ok: 0, stop: 'B1', why: 'Con ventaja de 2 contra 1 no hace falta tirar de lejos con un defensor encima.' },
          { t: 'Atacar el aro y pasar cuando B1 se comprometa', to: 'A2', ok: 1, why: 'B1 tiene que elegir y cualquier elección deja libre a uno de los dos. Fijas al defensor y la bandeja es fácil.' },
          { t: 'Parar la jugada y colocar el ataque', to: [60, 50], ok: 0, stop: 'B1', why: 'Pierdes la ventaja: la defensa se recompone en segundos.' }] },
      { n: 'Defensa en zona', ball: 'A1', a: [['A1', 'a', 62, 24, 66, 28], ['A2', 'a', 80, 50, 80, 50], ['A3', 'a', 88, 84, 90, 84], ['B1', 'b', 70, 30, 70, 32], ['B2', 'b', 78, 42, 77, 40], ['B3', 'b', 78, 60, 78, 62], ['B4', 'b', 90, 70, 88, 72]],
        o: [{ t: 'Pase a A2 en el poste alto', to: 'A2', ok: 1, cont: 1, why: 'A2 recibe en el hueco entre B2 y B3: ahí la zona se rompe, y desde allí puede pasar, tirar o penetrar.' },
          { t: 'Pase cruzado a A3 en la otra esquina', to: 'A3', ok: 0, stop: 'B4', why: 'B4 está esperando en esa esquina: un pase largo y fácil de robar.' },
          { t: 'Tiro de tres de A1', to: [92.5, 50], ok: 0, stop: 'B1', why: 'B1 sale a tapar el tiro: sin espacio, es un lanzamiento forzado.' }],
        next: [{ mv: { A1: [88, 38], B1: [76, 38], B2: [79, 46], B3: [79, 54], B4: [88, 66] },
          o: [{ t: 'Pase al corte de A1 hacia canasta', to: 'A1', ok: 1, why: 'B2 y B3 han saltado a doblar a A2 y B1 llega tarde. El corte de A1 por la línea de fondo queda libre: bandeja o mate.' },
            { t: 'Tiro a pesar del doble marcaje', to: [92.5, 50], ok: 0, stop: 'B2', why: 'Con dos defensas encima, un tiro con la mano de B2 en la cara es la peor opción.' },
            { t: 'Pase a A3 en la esquina', to: 'A3', ok: 0, stop: 'B4', why: 'B4 ha ido bajando a ayudar justo en esa línea de pase.' }] }] },
      { n: 'Bloqueo directo', ball: 'A1', a: [['A1', 'a', 56, 50, 66, 52], ['A2', 'a', 66, 42, 84, 46], ['A3', 'a', 84, 18, 90, 14], ['A4', 'a', 84, 84, 90, 86], ['B1', 'b', 64, 52, 72, 50], ['B2', 'b', 72, 42, 68, 56], ['B3', 'b', 88, 26, 90, 22], ['B4', 'b', 88, 74, 88, 70]],
        o: [{ t: 'Pase picado a A2, que rueda hacia el aro', to: 'A2', ok: 1, cont: 1, why: 'B1 quedó atrapado en el bloqueo y B2 salió a por A1: A2 rueda al aro con la defensa a su espalda.' },
          { t: 'Tiro de tres de A1', to: [92.5, 50], ok: 0, stop: 'B2', why: 'B2 vuelve rápido a taparte la línea de tiro: era la peor opción con el bloqueo ya hecho.' },
          { t: 'Pase a A3 en la esquina', to: 'A3', ok: 0, stop: 'B3', why: 'B3 sigue pegado a A3: la esquina está cubierta.' },
          { t: 'Pase largo a A4 en la otra esquina', to: 'A4', ok: 0, stop: 'B4', why: 'B4 está mirando a A4 y el pase cruza toda la pista.' }],
        next: [{ mv: { A2: [88, 48], A1: [68, 52], B1: [72, 52], B2: [70, 58], B4: [86, 64] },
          o: [{ t: 'Bandeja o mate de A2', to: [92.5, 50], ok: 1, why: 'B4 llega tarde y A2 tiene el aro a un paso. Cuando el camino está libre, se acaba la jugada: no la compliques.' },
            { t: 'Pase a A4 en la esquina', to: 'A4', ok: 0, stop: 'B4', why: 'Das un pase largo teniendo la canasta delante. B4 solo tiene que adelantar el brazo.' },
            { t: 'Pase atrás a A1', to: 'A1', ok: 0, stop: 'B1', why: 'Devuelves el balón a la defensa, que se recompone.' },
            { t: 'Pase a A3 en la esquina', to: 'A3', ok: 0, stop: 'B3', why: 'B3 sigue mirando a A3: no hay ventaja en ese pase.' }] }] },
      { n: 'Contraataque 3 contra 2', ball: 'A1', a: [['A1', 'a', 40, 50, 66, 50], ['A2', 'a', 42, 26, 72, 22], ['A3', 'a', 42, 74, 72, 78], ['B1', 'b', 82, 44, 80, 36], ['B2', 'b', 86, 58, 82, 42]],
        o: [{ t: 'Pase a A2 por la banda de arriba', to: 'A2', ok: 0, stop: 'B1', why: 'Los dos defensas se han ido hacia arriba: ese pase llega con ayuda de B1 y B2.' },
          { t: 'Pase a A3 por la banda libre', to: 'A3', ok: 1, cont: 1, why: 'Los dos defensas están tapando arriba. A3 viene solo por abajo: el 3 contra 2 deja una banda abierta.' },
          { t: 'Bote hasta el aro', to: [92.5, 50], ok: 0, stop: 'B2', why: 'Te encuentras de frente con los dos defensas: ya no hay ventaja numérica si decides tú solo.' },
          { t: 'Tiro de tres', to: [92.5, 50], ok: 0, stop: 'B1', why: 'Desperdicias un 3 contra 2 con un tiro lejano y con defensas cerca.' }],
        next: [{ mv: { A3: [82, 74], A1: [86, 52], A2: [90, 20], B1: [84, 46], B2: [82, 60] },
          o: [{ t: 'Bandeja de A3', to: [92.5, 50], ok: 0, stop: 'B2', why: 'B2 ha salido a cerrar a A3: la bandeja iría contra un defensor firme.' },
            { t: 'Pase a A1 que llega por el centro', to: 'A1', ok: 0, stop: 'B1', why: 'B1 ya está en esa zona y A1 no tendría tiro limpio.' },
            { t: 'Pase a A2 en la esquina y tiro de tres', to: 'A2', ok: 1, why: 'Los dos defensas han cerrado dentro. A2 está solo en la esquina: es el pase de oro del 3 contra 2.' },
            { t: 'Parar el balón y esperar', to: [76, 74], ok: 0, stop: 'B2', why: 'Parar da tiempo a que vuelva el resto de la defensa y se acaba la ventaja.' }] }] }
    ],
    tenis: [
      { n: 'El rival, fuera de posición', ball: 'A1', a: [['A1', 'a', 8, 70, 18, 70], ['B1', 'b', 90, 30, 90, 20]],
        o: [{ t: 'Al lado donde corre el rival', to: [94, 18], ok: 0, stop: 'B1', why: 'Devolver al punto donde ya está el rival le regala la bola.' },
          { t: 'Cruzado al otro lado, pista abierta', to: [92, 82], ok: 1, why: 'El rival está descolocado y la pista se queda abierta al otro lado: el golpe más sencillo y ganador.' },
          { t: 'Dejada con el rival en el fondo', to: [66, 50], ok: 0, stop: 'B1', why: 'Con tiempo para llegar, una dejada arriesgada es regalar el punto.' }] },
      { n: 'El rival sube a la red', ball: 'A1', a: [['A1', 'a', 8, 55, 12, 55], ['B1', 'b', 78, 50, 64, 46]],
        o: [{ t: 'Passing shot paralelo', to: [94, 12], ok: 0, stop: 'B1', why: 'Con el rival tan cerca de la red cubriendo, la línea es un tiro de alto riesgo.' },
          { t: 'Globo sobre la volea', to: [94, 55], ok: 1, why: 'El rival está muy adelantado y no puede retroceder a tiempo: el globo le pasa por encima y gana el punto.' },
          { t: 'Pelota al centro de la pista', to: [64, 46], ok: 0, stop: 'B1', why: 'Se la pones a la altura de la volea: la remata a placer.' }] },
      { n: 'Bola corta del rival', ball: 'A1', a: [['A1', 'a', 6, 50, 56, 50], ['B1', 'b', 92, 52, 92, 50]],
        o: [{ t: 'Dejada con efecto', to: [66, 50], ok: 1, why: 'El rival está en el fondo, lejos de la red: la dejada no le da tiempo a llegar.' },
          { t: 'Globo profundo', to: [96, 50], ok: 0, stop: 'B1', why: 'Con el rival en el fondo, el globo le da tiempo de sobra para llegar.' },
          { t: 'Golpe plano fuerte al centro', to: [92, 50], ok: 0, stop: 'B1', why: 'Se lo pones justo a su golpe favorito: el centro del fondo.' }] },
      { n: 'Construir el punto', ball: 'A1', a: [['A1', 'a', 8, 50, 10, 50], ['B1', 'b', 92, 50, 92, 50]],
        o: [{ t: 'Paralelo por la línea', to: [94, 18], ok: 0, stop: 'B1', why: 'Con la rival cómoda en el centro, la línea es una apuesta de alto riesgo y poco margen.' },
          { t: 'Cruzado profundo y abierto', to: [92, 80], ok: 1, cont: 1, why: 'Abre la pista y la obliga a correr. Es el golpe seguro que prepara el siguiente.' },
          { t: 'Dejada desde el fondo', to: [62, 50], ok: 0, stop: 'B1', why: 'Demasiado pronto: desde el fondo la dejada da tiempo a la rival para llegar.' }],
        next: [{ mv: { B1: [88, 82], A1: [14, 50] },
          o: [{ t: 'Paralelo a la pista abierta', to: [92, 20], ok: 1, why: 'La rival ha corrido hasta la esquina de abajo: toda la pista de arriba está libre. Es el golpe ganador.' },
            { t: 'Devolver al mismo sitio', to: [92, 80], ok: 0, stop: 'B1', why: 'Se lo devuelves justo donde ya está: la rival ni se mueve.' },
            { t: 'Globo alto al centro', to: [86, 50], ok: 0, stop: 'B1', why: 'Le das tiempo de sobra para recuperar la posición.' },
            { t: 'Subir a la red sin atacar', to: [58, 50], ok: 0, stop: 'B1', why: 'Subir con una bola sin intención es regalar el passing shot.' }] }] },
      { n: 'Aproximación y volea', ball: 'A1', a: [['A1', 'a', 22, 50, 36, 50], ['B1', 'b', 92, 50, 90, 56]],
        o: [{ t: 'Aproximación profunda a la esquina contraria', to: [92, 24], ok: 1, cont: 1, why: 'Una aproximación profunda y al lado contrario a su tendencia le deja sin tiempo para pasarte y te permite subir con ventaja.' },
          { t: 'Aproximación corta al centro', to: [74, 50], ok: 0, stop: 'B1', why: 'Una bola corta y al centro es un regalo para un passing shot.' },
          { t: 'Dejada desde media pista', to: [66, 50], ok: 0, stop: 'B1', why: 'Con la rival bien colocada, la dejada llega tarde y sin sorpresa.' }],
        next: [{ mv: { A1: [48, 50], B1: [86, 32] },
          o: [{ t: 'Volea al lado abierto', to: [92, 76], ok: 1, why: 'La rival ha llegado tarde a la esquina de arriba: el lado de abajo está libre y la volea es ganadora.' },
            { t: 'Volea al mismo lado', to: [92, 24], ok: 0, stop: 'B1', why: 'Se lo devuelves justo donde ya está y le das la opción del passing shot.' },
            { t: 'Volea larga al centro', to: [92, 50], ok: 0, stop: 'B1', why: 'Le das tiempo a recuperarse y a contraatacar.' }] }] }
    ],
    running: [
      { n: 'Último giro de 1.500 m', ball: 'A1', a: [['A1', 'a', 30, 50, 46, 50], ['B1', 'b', 40, 50, 54, 50], ['B2', 'b', 40, 60, 54, 60], ['B3', 'b', 28, 66, 42, 66]],
        o: [{ t: 'Salir por fuera ya y adelantar', to: [74, 66], ok: 0, stop: 'B2', why: 'Salir ahora por la calle 3 te hace correr más metros y gastar energía antes de tiempo.' },
          { t: 'Seguir pegado y esperar el hueco en la recta', to: [70, 50], ok: 1, why: 'Ahorras energía pegado a B1 y esprintas en la recta con las piernas más frescas.' },
          { t: 'Frenar y dejar que se escapen', to: [38, 50], ok: 0, stop: 'B3', why: 'Si pierdes el contacto en el último giro, el esprint final ya no sirve.' }] },
      { n: 'Entrega del testigo', ball: 'A1', a: [['A1', 'a', 14, 50, 40, 50], ['A2', 'a', 50, 50, 56, 50], ['B1', 'b', 34, 62, 46, 62]],
        o: [{ t: 'Gritar «¡ya!» y entregar con A2 lanzado', to: 'A2', ok: 1, why: 'Dentro de la zona y con A2 ya a velocidad, el testigo no pierde ritmo. Es la clave del relevo.' },
          { t: 'Entregar antes de la zona', to: [47, 50], ok: 0, stop: 'B1', why: 'Entregar antes de la zona de cambio descalifica al equipo: todo ese esfuerzo se perdería.' },
          { t: 'Frenar para asegurar la entrega', to: [44, 50], ok: 0, stop: 'B1', why: 'Frenar le cuesta decimas muy valiosas a tu equipo.' }] },
      { n: 'Viento de cara en el 5K', ball: 'A1', a: [['A1', 'a', 30, 50, 44, 50], ['A2', 'a', 22, 46, 38, 46], ['A3', 'a', 24, 56, 40, 56], ['B1', 'b', 16, 50, 34, 52]],
        o: [{ t: 'Tirar tú del grupo contra el viento', to: [70, 50], ok: 0, stop: 'A2', why: 'Quien va delante contra el viento gasta mucha más energía que quien se resguarda.' },
          { t: 'Ponerte detrás del grupo y relevar luego', to: [34, 50], ok: 1, why: 'Resguardado de espalda del viento ahorras hasta un 6-7 % de energía. Relevas más adelante, descansado.' },
          { t: 'Salirte por la calle 3 en solitario', to: [58, 70], ok: 0, stop: 'A3', why: 'Sin protección ni grupo, el viento te frena el doble.' }] },
      { n: 'Cuerpo a cuerpo en los 800 m', ball: 'A1', a: [['A1', 'a', 24, 62, 38, 62], ['B1', 'b', 30, 52, 44, 52], ['B2', 'b', 26, 70, 40, 71]],
        o: [{ t: 'Pasar por fuera ya', to: [56, 74], ok: 0, stop: 'B2', why: 'Pasar ahora por fuera te cuesta metros extra y B2 te cierra el paso.' },
          { t: 'Mantener el puesto detrás de B1 hasta la última curva', to: [48, 56], ok: 1, cont: 1, why: 'Corres abrigado y con la zancada cómoda. En los 800 m el movimiento decisivo se hace al final de la curva.' },
          { t: 'Frenar y recuperar sitio atrás', to: [30, 62], ok: 0, stop: 'B2', why: 'Perder el contacto en la primera vuelta suele ser definitivo.' },
          { t: 'Acelerar al máximo desde ahora', to: [64, 56], ok: 0, stop: 'B1', why: 'Aceleras 300 m antes de tiempo y te quedarás sin gasolina en la recta final.' }],
        next: [{ mv: { A1: [52, 58], B1: [56, 52], B2: [50, 64] },
          o: [{ t: 'Esprintar por la calle exterior libre', to: [66, 70], ok: 1, why: 'B1 y B2 ocupan las calles interiores; por fuera tienes espacio para acelerar sin que te cierren.' },
            { t: 'Esperar a que se abra un hueco por dentro', to: [60, 52], ok: 0, stop: 'B1', why: 'B1 no te lo va a abrir, y en la recta se acaban los metros.' },
            { t: 'Cerrarte pegado a B2', to: [58, 64], ok: 0, stop: 'B2', why: 'Estás atrapado entre los dos: sin espacio no hay esprint.' }] }] },
      { n: 'Ritmo de maratón', ball: 'A1', a: [['A1', 'a', 22, 50, 36, 50], ['A2', 'a', 28, 44, 42, 44], ['B1', 'b', 36, 58, 52, 58], ['B2', 'b', 40, 52, 56, 52]],
        o: [{ t: 'Seguir con tu ritmo previsto', to: [60, 50], ok: 1, cont: 1, why: 'El maratón se gana en la segunda mitad. Los ataques tempranos suelen pagarse en el km 35.' },
          { t: 'Seguir el ataque de B1', to: [62, 58], ok: 0, stop: 'B1', why: 'No es tu ritmo: acabarás pagándolo en los últimos 10 km.' },
          { t: 'Parar a beber con el grupo pasando', to: [38, 50], ok: 0, stop: 'A2', why: 'Parar en carrera te hace perder el ritmo y la concentración.' }],
        next: [{ mv: { A1: [50, 52], A2: [48, 44], B1: [56, 62], B2: [58, 56] },
          o: [{ t: 'Acelerar con decisión en el km 40', to: [68, 52], ok: 1, why: 'Has ahorrado fuerzas y B1 y B2 empiezan a sufrir: tu cambio los dejará sin respuesta.' },
            { t: 'Esperar al último kilómetro', to: [56, 52], ok: 0, stop: 'B2', why: 'Si esperas, te decidirá un sprint que quizá ellos tengan más fresco.' },
            { t: 'Pararte a andar para recuperar', to: [44, 50], ok: 0, stop: 'A2', why: 'Andar tras 40 km te arruina el ritmo y te será casi imposible volver a arrancar.' }] }] }
    ]
  };
  var LVN = ['Observador', 'Aprendiz', 'Analista', 'Táctico', 'Estratega'];
  var COACH = { futbol: 'Guardiola', baloncesto: 'Gregg Popovich', tenis: 'Toni Nadal', running: 'Renato Canova' };
  var RANK = ['Aficionado', 'Ojeador de cantera', 'Ayudante de campo', 'Analista táctico', 'Entrenador', 'Estratega'];
  function rankMsg(k) {
    var c = COACH[KG.sport];
    return ['Aún estás aprendiendo a leer el juego. ¡Repite y verás cómo mejoras!', 'Empiezas a leer el juego: ya ves dónde está el espacio libre.', 'Ya anticipas jugadas como un ayudante de campo.', 'Lees los espacios mejor que muchos aficionados: vas camino de analista profesional.', 'Te acercas a la gestión de ' + c + ': ves la jugada antes de que ocurra.', 'Nivel ' + c + ': lectura táctica de élite en todas las jugadas.'][k];
  }
  var stage = KG.$('#kg-stage'), cv, ctx, W, H, DPR, raf = 0, S, col = '#00FF88', colr = '0,255,136', lastT = 0;

  function rgb() { var cs = getComputedStyle(document.documentElement); col = cs.getPropertyValue('--kc').trim() || '#00FF88'; colr = cs.getPropertyValue('--kcr').trim() || '0,255,136'; }
  function mount() {
    stage.innerHTML = '<div class="jg"><div class="jg-vw"><canvas id="jg-cv" aria-label="Tablero táctico"></canvas><div class="jg-rec"><i></i>REPETICIÓN TÁCTICA</div><div class="jg-nm kg-mono" id="jg-nm"></div><div class="jg-cap" id="jg-cap"></div></div><div class="jg-side" id="jg-side"></div></div>';
    cv = KG.$('#jg-cv'); ctx = cv.getContext('2d'); size();
  }
  function size() { var box = cv.parentNode.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1); W = Math.max(300, box.width); H = Math.round(W * (innerWidth < 700 ? .78 : .56)); cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  addEventListener('resize', function () { if (cv) size(); });
  var VX = { futbol: 24, baloncesto: 36, tenis: 0, running: 8 };
  var VR = { running: 68 };
  var XW = function (w) { return w / ((VR[KG.sport] || 100) - (VX[KG.sport] || 0)) * W; };
  var X = function (x) { var v = VX[KG.sport] || 0; return (x - v) / ((VR[KG.sport] || 100) - v) * W; }, Y = function (y) { return y / 100 * H; };
  var T2 = Math.PI * 2;

  /* ───── pistas ───── */
  function court() {
    var s = KG.sport, i, g;
    ctx.save();
    if (s === 'futbol') {
      g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#11602d'); g.addColorStop(1, '#0a3d1d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'; ctx.fillRect(X(i * 10), 0, XW(10), H); }
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      var R = function (x, y, w, h) { ctx.strokeRect(X(x), Y(y), XW(w), Y(h)); };
      R(3, 4, 94, 92); line(50, 4, 50, 96); R(81, 22, 16, 56); R(91, 38, 6, 24);
      ctx.beginPath(); ctx.ellipse(X(50), Y(50), Y(16) * 1.0, Y(16), 0, 0, T2); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(87), Y(50), 3, 0, T2); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(X(81), Y(50), Y(11), Y(11), 0, -1.0, 1.0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(X(97), Y(43), XW(3), Y(14)); ctx.strokeStyle = '#fff'; ctx.strokeRect(X(97), Y(43), XW(3) - 1, Y(14));
      for (i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(X(97) + i * XW(3) / 6, Y(43)); ctx.lineTo(X(97) + i * XW(3) / 6, Y(57)); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.stroke(); }
    } else if (s === 'baloncesto') {
      g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9a5a22'); g.addColorStop(1, '#7a4317'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var pw = W / 22; for (i = 0; i < 22; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,220,160,.05)' : 'rgba(40,16,0,.08)'; ctx.fillRect(i * pw, 0, pw, H); ctx.fillStyle = 'rgba(30,12,0,.18)'; ctx.fillRect(i * pw, 0, 1, H); }
      var BL = 99, HX = 92.5, ELL = function (cx, cy, rx, ry, a0, a1, ccw) { ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), XW(rx), Y(ry), 0, a0, a1, !!ccw); ctx.stroke(); };
      /* pintura teñida (5,8 m de largo × 4,9 m de ancho, proporciones reales) */
      ctx.fillStyle = 'rgba(' + colr + ',.20)'; ctx.fillRect(X(75), Y(36), XW(BL - 75), Y(28));
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.strokeRect(X(0), Y(4), XW(BL), Y(92)); ctx.strokeRect(X(75), Y(36), XW(BL - 75), Y(28));
      /* círculo de tiros libres: sólido hacia fuera, discontinuo dentro de la pintura */
      ELL(75, 50, 7.4, 11, Math.PI / 2, Math.PI * 1.5);
      ctx.setLineDash([6, 6]); ELL(75, 50, 7.4, 11, -Math.PI / 2, Math.PI / 2); ctx.setLineDash([]);
      /* línea de triple: rectas de esquina + arco de 6,75 m */
      ctx.beginPath(); ctx.moveTo(X(BL), Y(9.5)); ctx.lineTo(X(88.2), Y(9.5)); ctx.ellipse(X(HX), Y(50), XW(28), Y(41), 0, 4.558, 1.725, true); ctx.lineTo(X(BL), Y(90.5)); ctx.stroke();
      /* semicírculo de no-carga */
      ELL(HX, 50, 5.2, 7.6, Math.PI / 2, Math.PI * 1.5);
      /* tablero, soporte y aro con red */
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(94), Y(50)); ctx.lineTo(X(BL), Y(50)); ctx.stroke();
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(94), Y(43)); ctx.lineTo(X(94), Y(57)); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; for (i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(X(HX - 1.1), Y(50) + i * Y(1.3)); ctx.lineTo(X(HX + 1.2) - 2, Y(50) + i * Y(.8)); ctx.stroke(); }
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(X(HX), Y(50), XW(1.7), Y(3.4), 0, 0, T2); ctx.stroke();
    } else if (s === 'tenis') {
      g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16498c'); g.addColorStop(1, '#0e2e5c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(X(4), Y(18), XW(92), Y(64));
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.strokeRect(X(4), Y(6), XW(92), Y(88)); line(4, 18, 96, 18); line(4, 82, 96, 82); line(27, 18, 27, 82); line(73, 18, 73, 82); line(27, 50, 73, 50); line(4, 50, 6, 50); line(94, 50, 96, 50);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; line(50, 3, 50, 97); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(X(50) + 3, Y(3), 4, Y(94));
    } else {
      g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9a2323'); g.addColorStop(1, '#6e1616'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(34,197,94,.55)'; ctx.fillRect(0, 0, W, Y(22)); ctx.fillRect(0, Y(84), W, H - Y(84));
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; for (i = 0; i < 7; i++) line(0, 26 + i * 9, 120, 26 + i * 9);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.font = '700 ' + Math.round(H * .045) + 'px Inter,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (i = 0; i < 6; i++) ctx.fillText(String(i + 1), X(9.5), Y(30.5 + i * 9));
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(X(66), Y(26), 4, Y(54));
    }
    var v = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, W * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    function line(x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); }
  }

  function act(id) { return S.play.a.filter(function (a) { return a[0] === id; })[0]; }
  function frozen(a) { return [a[4], a[5]]; }
  function ptOf(to) { return typeof to === 'string' ? frozen(act(to)) : to; }
  function pos(a, k) { var e = k * k * (3 - 2 * k); return [a[2] + (a[4] - a[2]) * e, a[3] + (a[5] - a[3]) * e]; }
  function arrow(x0, y0, x1, y1, w) {
    var an = Math.atan2(y1 - y0, x1 - x0), L = 11 + w * 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - L * Math.cos(an - .45), y1 - L * Math.sin(an - .45)); ctx.lineTo(x1 - L * Math.cos(an + .45), y1 - L * Math.sin(an + .45)); ctx.closePath(); ctx.fill();
  }
  var LET = 'ABCD';

  function frame(now) {
    raf = requestAnimationFrame(frame); var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now; if (!S || !S.play || !ctx) return;
    court(); var p = S.play, dur = S.b ? 1.8 : 2.4, k = S.phase === 'run' ? Math.min(1, S.t / dur) : 1;
    if (S.phase === 'run') { S.t += dt; if (S.t >= dur) freeze(); }
    var rad = Math.max(11, Math.min(W * .035, H * .06)), ball;
    p.a.forEach(function (a) { var q = pos(a, k), ex = S.rev && S.rev.stop === a[0]; if (ex) { var tgt = S.rev.stopAt, m = Math.min(1, S.rev.t * 1.4); q = [q[0] + (tgt[0] - q[0]) * m, q[1] + (tgt[1] - q[1]) * m]; } a.cur = q; });
    /* flechas de opciones al congelarse */
    if (S.phase === 'pick') {
      var from = act(S.holder).cur;
      S.opts.forEach(function (o, ix) {
        var to = ptOf(o.to), hov = S.hover === ix, fx = X(from[0]), fy = Y(from[1]), tx = X(to[0]), ty = Y(to[1]);
        ctx.setLineDash([8, 7]); ctx.lineDashOffset = -now / 45; ctx.strokeStyle = hov ? col : 'rgba(255,255,255,.42)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = hov ? 3.5 : 2;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); arrow(fx, fy, tx, ty, hov ? 2 : 1);
        var lx = fx + (tx - fx) * .55, ly = fy + (ty - fy) * .55;
        ctx.fillStyle = hov ? col : 'rgba(10,14,20,.85)'; ctx.beginPath(); ctx.arc(lx, ly, 11, 0, T2); ctx.fill(); ctx.strokeStyle = hov ? col : 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = hov ? '#04110a' : '#fff'; ctx.font = '800 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LET[ix], lx, ly + 1);
      });
    }
    /* revelado: pase / disparo */
    if (S.phase === 'rev') {
      var o = S.rev.o, f = act(S.holder).cur, to = S.rev.end; S.rev.t = Math.min(1, S.rev.t + dt / .95); var tt = S.rev.t, bx = f[0] + (to[0] - f[0]) * tt, by = f[1] + (to[1] - f[1]) * tt;
      ctx.strokeStyle = o.ok ? '#22c55e' : '#fb7185'; ctx.lineWidth = 4; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14; ctx.beginPath(); ctx.moveTo(X(f[0]), Y(f[1])); ctx.lineTo(X(bx), Y(by)); ctx.stroke(); ctx.shadowBlur = 0; ball = [bx, by];
      if (tt >= 1 && !S.rev.done) { S.rev.done = true; showWhy(); }
      if (tt >= 1 && !o.ok) { ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 5; var ex = X(to[0]), ey = Y(to[1]); ctx.beginPath(); ctx.moveTo(ex - 10, ey - 10); ctx.lineTo(ex + 10, ey + 10); ctx.moveTo(ex + 10, ey - 10); ctx.lineTo(ex - 10, ey + 10); ctx.stroke(); }
      if (tt >= 1 && o.ok) { ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(to[0]), Y(to[1]), rad * 2 + 4 * Math.sin(now / 160), 0, T2); ctx.stroke(); }
    }
    p.a.forEach(function (a) {
      var q = a.cur, isA = a[1] === 'a', isC = a[0] === S.holder, x = X(q[0]), y = Y(q[1]);
      if (isC && S.phase === 'pick') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rad * 2 + 3 * Math.sin(now / 200), 0, T2); ctx.stroke(); }
      ctx.shadowColor = isA ? col : '#fb7185'; ctx.shadowBlur = 16; ctx.fillStyle = isA ? col : '#fb7185'; ctx.beginPath(); ctx.arc(x, y, rad, 0, T2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = isA ? '#04110a' : '#1a0408'; ctx.font = '800 ' + Math.round(rad * .95) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a[0], x, y + 1);
    });
    var c = act(S.holder).cur; if (!ball) ball = [c[0], c[1]];
    var bo = rad * .9; ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(X(ball[0]) + bo, Y(ball[1]) - bo, rad * .45, 0, T2); ctx.fill(); ctx.shadowBlur = 0;
  }

  /* ───── flujo del juego ───── */
  function newRound() { S = { i: 0, score: 0, cleared: 0, fast: 0, dec: 0, decOk: 0 }; load(); }
  function nBeats(p) { return 1 + (p.next ? p.next.length : 0); }
  function load() {
    var src = PL[KG.sport][S.i]; S.play = JSON.parse(JSON.stringify(src)); S.holder = S.play.ball; S.b = 0; S.phase = 'run'; S.t = 0; S.rev = null; S.hover = -1;
    S.play.a.forEach(function (a) { a.cur = [a[2], a[3]]; });
    S.opts = KG.shuffle(S.play.o, Math.random); hud();
    KG.$('#jg-cap').innerHTML = 'Mira la jugada…'; KG.$('#jg-cap').className = 'jg-cap on';
    var dots = '', n = PL[KG.sport].length; for (var k = 0; k < n; k++) dots += '<i class="' + (k < S.i ? 'd' : k === S.i ? 'c' : '') + '"></i>';
    KG.$('#jg-side').innerHTML = '<div class="jg-wait"><small class="kg-mono">Sala de vídeo · ' + KG.sports[KG.sport].n + '</small><h2>Nivel ' + (S.i + 1) + ' · <em>' + LVN[S.i] + '</em></h2><p><b>' + KG.esc(S.play.n) + '</b>. ' + (nBeats(S.play) > 1 ? 'Esta jugada tiene ' + nBeats(S.play) + ' decisiones seguidas: si aciertas, la jugada continúa.' : 'El vídeo se congelará en el momento clave.') + ' Fíjate en dónde están los defensores y los espacios libres.</p><div class="jg-dots">' + dots + '</div><div class="jg-rk"><small class="kg-mono">Rango actual</small><b>' + RANK[S.cleared] + '</b></div></div>';
  }
  function hud() { var p = S.play; KG.$('#jg-nm').textContent = 'NIVEL ' + (S.i + 1) + '/' + PL[KG.sport].length + ' · ' + p.n.toUpperCase() + (nBeats(p) > 1 ? ' · DECISIÓN ' + (S.b + 1) + '/' + nBeats(p) : ''); }
  function beat() {
    var nx = S.play.next[S.b - 1], p = S.play;
    p.a.forEach(function (a) { a[2] = a[4]; a[3] = a[5]; if (nx.mv && nx.mv[a[0]]) { a[4] = nx.mv[a[0]][0]; a[5] = nx.mv[a[0]][1]; } });
    S.opts = KG.shuffle(nx.o, Math.random); S.phase = 'run'; S.t = 0; S.rev = null; S.hover = -1; hud();
    KG.$('#jg-cap').innerHTML = 'La jugada continúa…'; KG.$('#jg-cap').className = 'jg-cap on';
    KG.$('#jg-side').innerHTML = '<div class="jg-wait"><small class="kg-mono">Decisión ' + (S.b + 1) + ' de ' + nBeats(p) + '</small><h2>La jugada <em>sigue</em></h2><p>Los jugadores se recolocan tras tu decisión. Vuelve a leer dónde está el espacio.</p></div>';
  }
  function freeze() {
    S.phase = 'pick'; S.tf = performance.now(); KG.sfx.tick(); var cap = KG.$('#jg-cap'); cap.innerHTML = '<b>¡Congelado!</b> ¿Qué haces con el balón?'; cap.className = 'jg-cap on freeze';
    var side = KG.$('#jg-side'); side.innerHTML = '<div class="jg-ch"><small class="kg-mono">Tú decides · nivel ' + (S.i + 1) + (nBeats(S.play) > 1 ? ' · decisión ' + (S.b + 1) + '/' + nBeats(S.play) : '') + '</small><h2>' + KG.esc(S.play.n) + '</h2><div class="jg-opts">' + S.opts.map(function (o, i) { return '<button type="button" class="jg-o" data-i="' + i + '"><i>' + LET[i] + '</i><span>' + KG.esc(o.t) + '</span></button>'; }).join('') + '</div></div>';
    KG.$$('.jg-o').forEach(function (b) { var i = +b.dataset.i; b.addEventListener('mouseenter', function () { S.hover = i; }); b.addEventListener('mouseleave', function () { S.hover = -1; }); b.addEventListener('focus', function () { S.hover = i; }); b.addEventListener('blur', function () { S.hover = -1; }); b.addEventListener('click', function () { choose(i); }); });
  }
  function choose(i) {
    if (S.phase !== 'pick') return; var o = S.opts[i], secs = (performance.now() - S.tf) / 1000, to = ptOf(o.to), from = act(S.holder).cur, end = to, stopAt = null;
    if (!o.ok && o.stop) { stopAt = [from[0] + (to[0] - from[0]) * .6, from[1] + (to[1] - from[1]) * .6]; end = stopAt; }
    S.phase = 'rev'; S.rev = { o: o, t: 0, end: end, stop: o.ok ? null : o.stop, stopAt: stopAt, i: i, secs: secs }; S.dec++;
    if (o.ok) { S.decOk++; var pts = 100 * (S.i + 1) * .6 + (secs < 6 ? 40 : 0); pts = Math.round(pts); if (secs < 6) S.fast++; S.score += pts; S.rev.pts = pts; KG.sfx.ok(); } else { KG.sfx.bad(); }
    var cap = KG.$('#jg-cap'); cap.className = 'jg-cap on ' + (o.ok ? 'good' : 'bad'); cap.innerHTML = o.ok ? '<b>¡Buena decisión!</b>' : '<b>Decisión arriesgada</b>';
    KG.$$('.jg-o').forEach(function (b, k) { b.disabled = true; b.classList.toggle('pick', k === i); b.classList.toggle('ok', !!S.opts[k].ok); if (k === i && !o.ok) b.classList.add('bad'); });
  }
  function showWhy() {
    var o = S.rev.o, wrap = KG.$('.jg-ch'), good = S.opts.filter(function (x) { return x.ok; })[0], more = o.ok && S.b + 1 < nBeats(S.play), lastLevel = S.i + 1 >= PL[KG.sport].length, played = o.ok && !more;
    if (played) { S.cleared++; var r = KG.$('.jg-vw').getBoundingClientRect(); KG.burst(r.left + r.width * .75, r.top + r.height * .5, col, 24); }
    var rk = played ? '<div class="jg-rk up"><small class="kg-mono">Rango conseguido</small><b>' + RANK[S.cleared] + '</b><p>' + KG.esc(rankMsg(S.cleared)) + '</p></div>' : '';
    var btn = more ? 'Seguir la jugada' : lastLevel ? 'Ver resultado' : 'Siguiente nivel';
    var box = KG.el('div', 'jg-why ' + (o.ok ? 'good' : 'bad'), '<b>' + (o.ok ? '✔ Correcto' : '✘ No era la mejor') + (o.ok ? ' · +' + S.rev.pts + (S.rev.secs < 6 ? ' (incluye +40 por decidir rápido)' : '') : '') + '</b><p>' + KG.esc(o.why) + '</p>' + (!o.ok ? '<p class="g"><b>Mejor opción:</b> ' + KG.esc(good.t) + '. ' + KG.esc(good.why) + '</p>' : '') + rk + '<button class="kg-btn pri" id="jg-next" type="button">' + btn + '</button>');
    wrap.appendChild(box);
    KG.$('#jg-next').onclick = function () {
      if (more) { S.holder = typeof o.to === 'string' ? o.to : S.holder; S.b++; beat(); }
      else if (lastLevel) end(); else { S.i++; load(); }
    };
  }
  function end() {
    var key = 'jugada_' + KG.sport, best = KG.get(key, 0), sc = S.score, rec = sc > best; if (rec) KG.set(key, sc);
    var n = PL[KG.sport].length, t = RANK[S.cleared];
    KG.sheet({ game: 'adivina-la-jugada', kicker: 'Sala de vídeo · ' + KG.sports[KG.sport].n, big: sc, title: 'Rango ' + t, bigSize: 170,
      lines: [rankMsg(S.cleared), S.cleared + ' de ' + n + ' jugadas resueltas · ' + S.decOk + '/' + S.dec + ' decisiones', S.fast ? S.fast + ' decididas en menos de 6 s' : 'Intenta decidir en menos de 6 s para ganar puntos extra', rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best + ' pts'],
      tip: '<b>Idea clave:</b> la mejor decisión casi siempre sale de mirar primero dónde está el espacio libre y quién te lo puede dar.',
      shareText: 'Alcancé el rango «' + t + '» en Adivina la jugada (' + KG.sports[KG.sport].n + ') con ' + sc + ' puntos. ¿Lees mejor el juego?', shareUrl: location.origin + '/juegos/adivina-la-jugada.html?d=' + KG.sport,
      again: newRound, win: S.cleared >= 3, ctaTitle: 'Analiza tu propio juego', ctaText: 'Sube un vídeo y KINET te ayuda a entender tus decisiones.' });
  }
  mount(); rgb(); raf = requestAnimationFrame(frame); newRound();
  KG.onSport(function () { rgb(); newRound(); });
})();

/* KINET OS · Modo carrera · datos: rivales y momentos de partido por deporte.
   Los nombres de clubes y selecciones se usan solo como referencia; plantillas, valoraciones y resultados son ficticios.
   Momento: [texto, [mejor opción, opción media, mala opción], explicación de la mejor] */
(function () {
  'use strict';
  window.KGC = {
    cfg: {
      futbol: {
        team: 'Tu equipo', unit: 'gol', units: 'goles', slots: [['Portero', 'POR'], ['Defensa', 'DEF'], ['Centrocampista', 'MED'], ['Mediapunta', 'MED'], ['Delantero', 'DEL']], def: [0, 1, 2], att: [2, 3, 4], gk: 0,
        label: function (i) { return 'Minuto ' + (6 + i * 11); }, season: 'Liga rápida', guard: 'portero', shoot: 'Chutar', save: 'Defender el disparo', val: function () { return 1; },
        real: [['Real Madrid', 88], ['FC Barcelona', 87], ['Atlético de Madrid', 84], ['Sevilla', 78], ['Athletic Club', 79], ['Real Sociedad', 78], ['Villarreal', 77], ['Real Betis', 77], ['Girona', 75], ['Valencia', 75], ['Liverpool', 86], ['Manchester City', 89], ['Bayern de Múnich', 88], ['Inter', 85], ['Juventus', 82], ['Paris Saint-Germain', 86]]
      },
      baloncesto: {
        team: 'Tu equipo', unit: 'canasta', units: 'puntos', slots: [['Base', 'Base'], ['Escolta', 'Escolta'], ['Alero', 'Alero'], ['Ala-pívot', 'Ala-pívot'], ['Pívot', 'Pívot']], def: [3, 4, 0], att: [0, 1, 2], gk: 4,
        label: function (i) { return 'Cuarto ' + (Math.floor(i / 2) + 1) + ' · posesión ' + (i % 2 + 1); }, season: 'Liga rápida', guard: 'defensor', shoot: 'Lanzar', save: 'Defender el tiro', val: function (col) { return col === 1 ? 2 : 3; },
        real: [['Real Madrid', 87], ['FC Barcelona', 85], ['Baskonia', 78], ['Unicaja', 76], ['Valencia Basket', 77], ['Joventut', 74], ['Panathinaikos', 82], ['Olympiacos', 83], ['Fenerbahçe', 82], ['Los Angeles Lakers', 86], ['Boston Celtics', 88], ['Golden State Warriors', 85]]
      },
      tenis: {
        team: 'Tu equipo', unit: 'punto', units: 'puntos', slots: [['Jugador 1 (individual)', 'Derecha'], ['Jugador 2 (individual)', 'Izquierda'], ['Pareja de dobles', 'Derecha']], def: [0, 1], att: [0, 1, 2], gk: 0,
        label: function (i) { return 'Juego ' + (i + 1); }, season: 'Copa de equipos', guard: 'rival', shoot: 'Golpear', save: 'Devolver el golpe', val: function () { return 1; },
        real: [['España', 86], ['Serbia', 87], ['Italia', 88], ['EE. UU.', 85], ['Francia', 82], ['Alemania', 84], ['Australia', 83], ['Argentina', 80], ['Reino Unido', 81], ['Canadá', 80], ['Países Bajos', 78], ['Noruega', 79]]
      },
      running: {
        team: 'Tu equipo', unit: 'punto', units: 'puntos', slots: [['Relevista 1 · salida', 'Relevista'], ['Relevista 2', 'Relevista'], ['Relevista 3', 'Relevista'], ['Relevista 4 · ancla', 'Relevista']], def: [0, 1, 2, 3], att: [1, 2, 3], gk: 3,
        label: function (i) { return 'Tramo ' + (i + 1); }, season: 'Circuito de relevos 4×100', guard: 'rival', shoot: 'Atacar', save: 'Defender el carril', val: function () { return 1; },
        real: [['Jamaica', 88], ['EE. UU.', 89], ['Reino Unido', 84], ['Canadá', 83], ['Japón', 82], ['Italia', 83], ['Sudáfrica', 81], ['China', 80], ['Brasil', 81], ['Países Bajos', 80], ['Kenia', 78], ['Cuba', 78]]
      }
    },
    A: {
      futbol: [
        ['Recuperas el balón en campo rival y la defensa contraria está mal colocada.', ['Pase vertical al delantero que ataca el espacio', 'Pase atrás para reorganizarte', 'Disparo desde 35 metros'], 'Con la defensa desordenada, el pase vertical aprovecha la ventaja antes de que se reorganice.'],
        ['Tu extremo recibe en banda y tu delantero entra al segundo palo con los centrales mirando el balón.', ['Centro rasante al segundo palo', 'Regatear otra vez al lateral', 'Pase atrás sin profundidad'], 'Los centrales miran el balón: el delantero que llega por detrás les gana la espalda.'],
        ['Córner a favor y el rival defiende al hombre con todos en el área.', ['Saque corto y centro desde otro ángulo', 'Centro directo al primer palo', 'Balón largo al borde del área'], 'El saque corto desordena las marcas y permite centrar con la defensa recolocándose.'],
        ['Vas perdiendo y el rival se ha encerrado con diez hombres tras el balón.', ['Cambios de orientación para abrir la defensa', 'Pelotazos al área', 'Tiros sin ver la portería'], 'Contra un bloque bajo, el balón viaja rápido de lado a lado para abrir huecos.'],
        ['Contraataque 3 contra 2 con espacio por delante.', ['Fijar al defensa y pasar al compañero libre', 'Disparar de lejos', 'Parar y esperar a los demás'], 'Fijar al defensor le obliga a elegir y deja libre a un compañero.']
      ],
      baloncesto: [
        ['Tu base recibe un bloqueo directo y el defensor queda atrapado.', ['Pase picado al pívot que rueda al aro', 'Tiro de tres con el defensor recuperando', 'Penetrar sin mirar a los lados'], 'Si el defensor queda atrapado, el pívot que rueda recibe libre bajo el aro.'],
        ['Contraataque 2 contra 1.', ['Atacar el aro y pasar cuando el defensor se comprometa', 'Tirar de tres', 'Parar y colocar el ataque'], 'El defensor debe elegir y deja libre a uno de los dos atacantes.'],
        ['El rival defiende en zona 2-3 y las esquinas están vacías.', ['Mover el balón rápido hasta encontrar al tirador libre', 'Tiros forzados con la mano encima', 'Botar contra la zona'], 'La zona se rompe moviendo el balón más rápido que los defensores.'],
        ['Tu pívot tiene a un defensor más bajo en el poste.', ['Dar el balón en el poste bajo', 'Tiro exterior muy defendido', 'Ignorar al pívot'], 'Si hay ventaja física, el balón debe entrar dentro.'],
        ['Posesión con 24 segundos y el marcador igualado.', ['Mover el balón y buscar un buen tiro antes de los últimos segundos', 'Tirar en los primeros cinco segundos', 'Perder tiempo sin intención'], 'Se usa la posesión para conseguir un tiro de calidad, no el primero que aparece.']
      ],
      tenis: [
        ['Tu rival responde corto y tienes la pista abierta.', ['Subir a la red y cerrar con la volea', 'Mantener el fondo y repetir', 'Dejada desde el fondo'], 'Con la bola corta, atacar y subir a la red cierra el punto.'],
        ['El rival está cansado y pierde el golpeo desde el fondo.', ['Alargar el intercambio y mover de lado a lado', 'Ir a ganar el punto de un golpe', 'Jugar bolas muy cortas sin riesgo'], 'Hacerle correr de lado a lado agrava el cansancio y fuerza el error.'],
        ['Servicio a la T con el rival muy pegado al centro.', ['Sacar abierto al ángulo contrario', 'Sacar a la T', 'Sacar flojo al cuerpo'], 'Sacar abierto lo saca de pista y abre el campo para el siguiente golpe.'],
        ['El rival juega siempre cruzado con el revés.', ['Cambiar a paralelo para pillarle a contrapié', 'Seguir cruzado', 'Resto flojo al medio'], 'Cambiar la dirección le coge a contrapié.'],
        ['Punto largo y el rival ha subido a la red.', ['Globo alto sobre su volea', 'Passing shot sin ángulo', 'Bola al medio de la pista'], 'Con el rival adelantado, el globo le pasa por encima.']
      ],
      running: [
        ['Tu relevista entra en la zona de cambio a tope y el siguiente ya está lanzado.', ['Entregar el testigo dentro de la zona sin frenar', 'Entregar antes de la zona', 'Frenar para asegurar'], 'El relevo se hace dentro de la zona y a velocidad, sin frenar.'],
        ['Vas segundo por la calle exterior y se acerca la última recta.', ['Mantener el ritmo y atacar al entrar en la recta', 'Atacar ya con 200 m', 'Frenar para recuperar'], 'Atacar en la recta final ahorra fuerzas y evita sufrir en los últimos metros.'],
        ['Tu rival va justo delante y a su estela hay menos viento.', ['Ir a su estela y esperar a la curva', 'Pasarlo por fuera ya', 'Quedarte atrás'], 'La estela ahorra energía: se ataca en el momento decisivo.'],
        ['Último relevo con ventaja de dos metros.', ['Mantener la técnica y no aflojar hasta la meta', 'Levantar los brazos antes de cruzar', 'Mirar atrás al rival'], 'Hay que correr hasta pasar la meta, sin mirar atrás.'],
        ['Salida desde los tacos con el pistoletazo inminente.', ['Mantener el cuerpo bajo y empujar los primeros pasos', 'Levantarte rápido', 'Anticipar la salida'], 'En la salida se empuja y se sube el cuerpo progresivamente.']
      ]
    },
    D: {
      futbol: [
        ['El rival presiona alto tu salida de balón.', ['Saltar la presión con un pase largo a la banda libre', 'Regatear al presionador en tu área', 'Despejar a cualquier sitio'], 'El pase largo a la banda libre salta la presión y aprovecha el espacio que dejan a su espalda.'],
        ['Contragolpe rival 2 contra 1 y solo hay un defensor.', ['Retroceder y frenar al que lleva el balón', 'Lanzarte a por el balón', 'Pedir fuera de juego'], 'Retrasar al atacante da tiempo a que lleguen los compañeros.'],
        ['Córner en contra y el rival tiene cabeceadores muy altos.', ['Defensa mixta: zona en el primer palo y marcas en el área', 'Todos sobre la línea de gol', 'Todos al hombre sin cubrir los palos'], 'La mixta cubre el primer palo y marca a los mejores rematadores.'],
        ['El rival gana la línea de fondo y busca el pase atrás.', ['Cerrar el pasillo interior', 'Ir todos a la línea de fondo', 'Salir con el portero al balón'], 'El peligro es el pase atrás: hay que cerrar el pasillo central.'],
        ['El rival lanza un balón al espacio a tu espalda.', ['Defensa en línea y salir al fuera de juego', 'Retroceder cada uno por su cuenta', 'Dejar a los defensas muy adelantados sin coordinar'], 'La línea coordinada deja al delantero en fuera de juego.']
      ],
      baloncesto: [
        ['El rival juega un bloqueo directo con su base.', ['Comunicar el cambio de marca y mantener el contacto', 'Quedarte pegado sin hablar', 'Ignorar el bloqueo'], 'Los defensores deben hablar para no dejar un hombre libre.'],
        ['El rival corre un contraataque rápido.', ['Retroceder a proteger el aro y tapar el pasillo central', 'Perseguir al balón por detrás', 'Quedarte en el medio campo'], 'Primero se protege el aro y después se persigue.'],
        ['El mejor tirador rival se mueve sin balón.', ['Seguirlo pegado sin dejarle recibir cómodo', 'Dejarle libre para ayudar', 'Perder la marca al mirar el balón'], 'Al tirador se le niega la recepción y no se le deja tirar cómodo.'],
        ['Su pívot recibe pegado al aro.', ['Doblar la marca desde el lado del balón', 'Dejarle un contra uno', 'Abandonar la zona'], 'Una ayuda desde el lado del balón evita la canasta fácil.'],
        ['Último cuarto: te quedan faltas personales.', ['Defender con los pies, sin levantar los brazos innecesariamente', 'Hacer falta para detener la jugada', 'Dejar pasar al rival'], 'Con faltas acumuladas, se defiende con los pies para no ser expulsado.']
      ],
      tenis: [
        ['El rival saca fuerte al cuerpo.', ['Retroceder un paso y blocar la devolución', 'Intentar un golpe fuerte', 'Quedarte quieto sin reaccionar'], 'Ante un saque fuerte, un bloqueo corto y firme mantiene la bola en juego.'],
        ['El rival sube a la red tras un golpe profundo.', ['Passing shot o globo según su posición', 'Golpear a su pecho', 'Dejar pasar la bola'], 'Hay que buscar el hueco con un passing shot o con un globo.'],
        ['Punto largo y notas cansancio.', ['Alargar el punto con altura y profundidad', 'Ir a todo o nada', 'Dejadas continuas'], 'Con altura y profundidad ganas tiempo para recuperar y obligas al rival a golpear.'],
        ['El rival ataca tu revés una y otra vez.', ['Cambiar a paralelo para cambiar la dirección', 'Seguir al mismo lado', 'Intentar correr el drive siempre'], 'Cambiar la dirección rompe el ritmo del rival.'],
        ['Dejada rival y estás en el fondo de la pista.', ['Arrancar con el primer paso explosivo y responder con una dejada', 'Esperar a que la bola bote dos veces', 'Quedarte en el fondo'], 'La respuesta rápida es clave en la bola corta: hay que anticipar.']
      ],
      running: [
        ['Un rival intenta adelantarte por el exterior en la curva.', ['Mantener tu línea y no cerrar el paso a destiempo', 'Cerrarle de golpe', 'Frenar para dejarle pasar'], 'Se mantiene la línea sin invadir su calle: los obstáculos son falta.'],
        ['El relevista rival entra con el testigo mucho más rápido.', ['Responder con tu mejor aceleración en el tramo siguiente', 'Frenar para no cansarte', 'Mirar atrás'], 'La respuesta rápida mantiene el contacto y reduce su ventaja.'],
        ['Viento de cara en la recta final.', ['Mantener la técnica y acortar un poco la zancada', 'Aumentar mucho la zancada', 'Parar a andar'], 'Con viento de cara se acorta la zancada y se mantiene la frecuencia.'],
        ['Tu ancla sale desde atrás y el rival marca el ritmo.', ['Ir a su ritmo y atacar al final', 'Salir como un loco de inicio', 'Aflojar en el primer tramo'], 'Controlar el ritmo y atacar al final ahorra energía.'],
        ['Tu relevista siente un tirón en los últimos 20 metros.', ['Mantener la mecánica y reducir un poco la velocidad hasta pasar la meta', 'Frenar en seco', 'Tirarte con el testigo'], 'Se evita agravar la lesión sin perder el testigo ni quedar fuera de la zona.']
      ]
    },
    invented: ['Atlético Brisa', 'CD Albatros', 'Real Montaña', 'UD Costa Norte', 'Racing Delta', 'Unión Faro', 'FC Aurora', 'Sporting Ámbar', 'CD Cierzo', 'Athletic Meseta']
  };
})();

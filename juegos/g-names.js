/* KINET OS · Juegos · base de nombres compartida (Once con presupuesto y Modo carrera).
   Nombres reales con país y club orientativos; las valoraciones son inventadas para el juego (no oficiales).
   Formato por línea: Nombre|País|Club (o mano en tenis)|Valoración|L (leyenda, opcional) */
(function () {
  'use strict';
  var RAW = {
    futbol: {
      POR: [
        'Thibaut Courtois|Bélgica|Real Madrid|90', 'Marc-André ter Stegen|Alemania|FC Barcelona|87', 'Jan Oblak|Eslovenia|Atlético de Madrid|88', 'Alisson Becker|Brasil|Liverpool|89',
        'Ederson|Brasil|Manchester City|86', 'Gianluigi Donnarumma|Italia|Paris Saint-Germain|88', 'Mike Maignan|Francia|AC Milan|87', 'Emiliano Martínez|Argentina|Aston Villa|86',
        'Unai Simón|España|Athletic Club|84', 'David Raya|España|Arsenal|85', 'Yassine Bounou|Marruecos|Sevilla|83', 'Keylor Navas|Costa Rica|Real Madrid|82',
        'Manuel Neuer|Alemania|Bayern de Múnich|88', 'Hugo Lloris|Francia|Tottenham|82', 'Wojciech Szczęsny|Polonia|Juventus|80', 'Yann Sommer|Suiza|Inter|82',
        'André Onana|Camerún|Manchester United|79', 'Jordan Pickford|Inglaterra|Everton|81', 'Kepa Arrizabalaga|España|Chelsea|78', 'Diogo Costa|Portugal|FC Porto|84',
        'Gregor Kobel|Suiza|Borussia Dortmund|84', 'Bart Verbruggen|Países Bajos|Brighton|78', 'Oliver Baumann|Alemania|Hoffenheim|79', 'Lukáš Hrádecký|Finlandia|Bayer Leverkusen|80',
        'Álex Remiro|España|Real Sociedad|80', 'Giorgi Mamardashvili|Georgia|Valencia|82', 'Ivan Provedel|Italia|Lazio|78', 'Brice Samba|Francia|Lens|78',
        'Guglielmo Vicario|Italia|Tottenham|80', 'Robert Sánchez|España|Chelsea|75', 'Nick Pope|Inglaterra|Newcastle|78', 'Aaron Ramsdale|Inglaterra|Arsenal|77',
        'Édouard Mendy|Senegal|Chelsea|78', 'Rui Patrício|Portugal|AS Roma|76', 'Samir Handanović|Eslovenia|Inter|78', 'Pepe Reina|España|Liverpool|76',
        'Jordi Masip|España|Real Valladolid|66', 'Mark Flekken|Países Bajos|Brentford|74', 'Alphonse Areola|Francia|West Ham|77',
        'Jasper Cillessen|Países Bajos|Valencia|74', 'Lukasz Fabiański|Polonia|West Ham|75', 'Pau López|España|Olympique de Marsella|75',
        'Sergio Asenjo|España|Villarreal|72', 'Jaume Domènech|España|Valencia|68', 'Vicente Guaita|España|Crystal Palace|74', 'Iñaki Peña|España|FC Barcelona|68',
        'Iker Casillas|España|Real Madrid|92|L', 'Gianluigi Buffon|Italia|Juventus|93|L', 'Lev Yashin|Unión Soviética|Dinamo de Moscú|93|L',
        'Peter Schmeichel|Dinamarca|Manchester United|89|L', 'Oliver Kahn|Alemania|Bayern de Múnich|91|L', 'Dino Zoff|Italia|Juventus|89|L', 'Gordon Banks|Inglaterra|Stoke City|88|L',
        'Petr Čech|Chequia|Chelsea|89|L', 'Edwin van der Sar|Países Bajos|Manchester United|89|L', 'Rogério Ceni|Brasil|São Paulo|85|L', 'Andoni Zubizarreta|España|FC Barcelona|85|L',
        'Santiago Cañizares|España|Valencia|84|L', 'Víctor Valdés|España|FC Barcelona|86|L', 'José Luis Chilavert|Paraguay|Vélez Sarsfield|84|L', 'Fabien Barthez|Francia|Manchester United|85|L'
      ],
      DEF: [
        'Virgil van Dijk|Países Bajos|Liverpool|89', 'Rúben Dias|Portugal|Manchester City|88', 'William Saliba|Francia|Arsenal|88', 'Antonio Rüdiger|Alemania|Real Madrid|86',
        'Éder Militão|Brasil|Real Madrid|85', 'Marquinhos|Brasil|Paris Saint-Germain|87', 'Alessandro Bastoni|Italia|Inter|87', 'Gleison Bremer|Brasil|Juventus|84',
        'Josko Gvardiol|Croacia|Manchester City|86', 'Dayot Upamecano|Francia|Bayern de Múnich|83', 'Kim Min-jae|Corea del Sur|Bayern de Múnich|84', 'Jonathan Tah|Alemania|Bayern de Múnich|84',
        'Pau Cubarsí|España|FC Barcelona|85', 'Ronald Araújo|Uruguay|FC Barcelona|85', 'Pau Torres|España|Aston Villa|80', 'Aymeric Laporte|España|Athletic Club|82',
        'Robin Le Normand|España|Atlético de Madrid|81', 'Dean Huijsen|España|Real Madrid|80', 'Evan N\'Dicka|Costa de Marfil|AS Roma|79', 'Nico Schlotterbeck|Alemania|Borussia Dortmund|82',
        'Micky van de Ven|Países Bajos|Tottenham|82', 'Cristian Romero|Argentina|Tottenham|84', 'Lisandro Martínez|Argentina|Manchester United|81', 'Gabriel Magalhães|Brasil|Arsenal|86',
        'Ben White|Inglaterra|Arsenal|82', 'John Stones|Inglaterra|Manchester City|84', 'Marc Guéhi|Inglaterra|Crystal Palace|83', 'Trent Alexander-Arnold|Inglaterra|Real Madrid|87',
        'Achraf Hakimi|Marruecos|Paris Saint-Germain|87', 'Jules Koundé|Francia|FC Barcelona|85', 'Dani Carvajal|España|Real Madrid|86', 'Alphonso Davies|Canadá|Bayern de Múnich|83',
        'Theo Hernández|Francia|AC Milan|85', 'Ferland Mendy|Francia|Real Madrid|80', 'Alejandro Balde|España|FC Barcelona|82', 'Andrew Robertson|Escocia|Liverpool|84',
        'Nuno Mendes|Portugal|Paris Saint-Germain|86', 'João Cancelo|Portugal|Manchester City|83', 'Marc Cucurella|España|Chelsea|80',
        'Jordi Alba|España|FC Barcelona|82', 'Kyle Walker|Inglaterra|Manchester City|82', 'Reece James|Inglaterra|Chelsea|83', 'Pedro Porro|España|Tottenham|80',
        'Denzel Dumfries|Países Bajos|Inter|81', 'Federico Dimarco|Italia|Inter|84', 'Giovanni Di Lorenzo|Italia|Napoli|81', 'Alessandro Buongiorno|Italia|Napoli|80',
        'Leny Yoro|Francia|Manchester United|79', 'Matthijs de Ligt|Países Bajos|Manchester United|82', 'Stefan de Vrij|Países Bajos|Inter|80',
        'Jurriën Timber|Países Bajos|Arsenal|83', 'Nathan Aké|Países Bajos|Manchester City|81', 'Fikayo Tomori|Inglaterra|AC Milan|80',
        'Joel Matip|Camerún|Liverpool|76', 'Ibrahima Konaté|Francia|Liverpool|84', 'Jeremie Frimpong|Países Bajos|Liverpool|80', 'Lucas Digne|Francia|Aston Villa|76',
        'Fran García|España|Real Madrid|76', 'Álex Grimaldo|España|Bayer Leverkusen|84', 'Iñigo Martínez|España|Athletic Club|79',
        'Dani Vivian|España|Athletic Club|78', 'Yeray Álvarez|España|Athletic Club|77', 'Jesús Navas|España|Sevilla|76', 'Marcos Llorente|España|Atlético de Madrid|82',
        'José María Giménez|Uruguay|Atlético de Madrid|82', 'Nahuel Molina|Argentina|Atlético de Madrid|78', 'Mario Hermoso|España|AS Roma|77', 'Axel Witsel|Bélgica|Atlético de Madrid|75',
        'Eric García|España|FC Barcelona|77', 'Andreas Christensen|Dinamarca|FC Barcelona|79', 'Sergi Roberto|España|FC Barcelona|73',
        'Gerard Piqué|España|FC Barcelona|86|L', 'Sergio Ramos|España|Real Madrid|90|L', 'Carles Puyol|España|FC Barcelona|89|L', 'Paolo Maldini|Italia|AC Milan|95|L',
        'Franco Baresi|Italia|AC Milan|92|L', 'Fabio Cannavaro|Italia|Real Madrid|90|L', 'Alessandro Nesta|Italia|AC Milan|90|L', 'Franz Beckenbauer|Alemania|Bayern de Múnich|94|L',
        'Bobby Moore|Inglaterra|West Ham|88|L', 'Lilian Thuram|Francia|Juventus|88|L', 'Roberto Carlos|Brasil|Real Madrid|91|L', 'Cafu|Brasil|AC Milan|91|L',
        'Dani Alves|Brasil|FC Barcelona|90|L', 'Philipp Lahm|Alemania|Bayern de Múnich|90|L', 'Javier Zanetti|Argentina|Inter|89|L', 'Marcel Desailly|Francia|AC Milan|88|L',
        'Rio Ferdinand|Inglaterra|Manchester United|88|L', 'Nemanja Vidić|Serbia|Manchester United|89|L', 'John Terry|Inglaterra|Chelsea|88|L', 'Fernando Hierro|España|Real Madrid|87|L',
        'Ashley Cole|Inglaterra|Chelsea|86|L', 'Gianluca Zambrotta|Italia|Juventus|85|L', 'Lucio|Brasil|Bayern de Múnich|86|L',
        'Daniel Passarella|Argentina|River Plate|87|L', 'Karlheinz Förster|Alemania|Stuttgart|82|L', 'Laurent Blanc|Francia|Olympique de Marsella|86|L', ],
      MED: [
        'Rodri|España|Manchester City|91', 'Jude Bellingham|Inglaterra|Real Madrid|91', 'Pedri|España|FC Barcelona|88', 'Gavi|España|FC Barcelona|84',
        'Federico Valverde|Uruguay|Real Madrid|88', 'Aurélien Tchouaméni|Francia|Real Madrid|85', 'Eduardo Camavinga|Francia|Real Madrid|83', 'Luka Modrić|Croacia|Real Madrid|88',
        'Toni Kroos|Alemania|Real Madrid|91', 'Kevin De Bruyne|Bélgica|Manchester City|91', 'Bernardo Silva|Portugal|Manchester City|88', 'Phil Foden|Inglaterra|Manchester City|88',
        'Martin Ødegaard|Noruega|Arsenal|88', 'Declan Rice|Inglaterra|Arsenal|87', 'Bukayo Saka|Inglaterra|Arsenal|89', 'Florian Wirtz|Alemania|Liverpool|88',
        'Jamal Musiala|Alemania|Bayern de Múnich|88', 'Joshua Kimmich|Alemania|Bayern de Múnich|88', 'Leon Goretzka|Alemania|Bayern de Múnich|82', 'Ilkay Gündogan|Alemania|Manchester City|84',
        'Frenkie de Jong|Países Bajos|FC Barcelona|85', 'Marc Casadó|España|FC Barcelona|78', 'Fermín López|España|FC Barcelona|82', 'Dani Olmo|España|FC Barcelona|85',
        'Koke|España|Atlético de Madrid|83', 'Rodrigo De Paul|Argentina|Atlético de Madrid|82', 'Pablo Barrios|España|Atlético de Madrid|79', 'Conor Gallagher|Inglaterra|Atlético de Madrid|79',
        'Martín Zubimendi|España|Arsenal|85', 'Mikel Merino|España|Arsenal|83', 'Fabián Ruiz|España|Paris Saint-Germain|83', 'Vitinha|Portugal|Paris Saint-Germain|86',
        'João Neves|Portugal|Paris Saint-Germain|84', 'Warren Zaïre-Emery|Francia|Paris Saint-Germain|82', 'Nicolò Barella|Italia|Inter|87', 'Hakan Çalhanoğlu|Turquía|Inter|86',
        'Henrikh Mkhitaryan|Armenia|Inter|79', 'Sandro Tonali|Italia|Newcastle|83', 'Lorenzo Pellegrini|Italia|AS Roma|79', 'Federico Chiesa|Italia|Liverpool|78',
        'Bruno Fernandes|Portugal|Manchester United|87', 'Casemiro|Brasil|Manchester United|81', 'Kobbie Mainoo|Inglaterra|Manchester United|79', 'Mason Mount|Inglaterra|Manchester United|76',
        'Enzo Fernández|Argentina|Chelsea|82', 'Moisés Caicedo|Ecuador|Chelsea|83', 'Cole Palmer|Inglaterra|Chelsea|87', 'Alexis Mac Allister|Argentina|Liverpool|86',
        'Dominik Szoboszlai|Hungría|Liverpool|85', 'Ryan Gravenberch|Países Bajos|Liverpool|84', 'Curtis Jones|Inglaterra|Liverpool|77', 'Cody Gakpo|Países Bajos|Liverpool|82',
        'James Maddison|Inglaterra|Tottenham|80', 'Pape Matar Sarr|Senegal|Tottenham|76', 'Rodrigo Bentancur|Uruguay|Tottenham|78',
        'Bruno Guimarães|Brasil|Newcastle|84', 'Joelinton|Brasil|Newcastle|80', 'Sean Longstaff|Inglaterra|Newcastle|74', 'Kalvin Phillips|Inglaterra|Manchester City|70',
        'Granit Xhaka|Suiza|Bayer Leverkusen|82', 'Robert Andrich|Alemania|Bayer Leverkusen|78', 'Exequiel Palacios|Argentina|Bayer Leverkusen|79', 'Xavi Simons|Países Bajos|RB Leipzig|82',
        'Dani Ceballos|España|Real Madrid|77', 'Brahim Díaz|España|Real Madrid|80', 'Arda Güler|Turquía|Real Madrid|83', 'Nuri Şahin|Turquía|Borussia Dortmund|74',
        'Julian Brandt|Alemania|Borussia Dortmund|80', 'Marcel Sabitzer|Austria|Borussia Dortmund|79', 'Emre Can|Alemania|Borussia Dortmund|79', 'Jobe Bellingham|Inglaterra|Borussia Dortmund|78',
        'Mikel Oyarzabal|España|Real Sociedad|85', 'Brais Méndez|España|Real Sociedad|80', 'Takefusa Kubo|Japón|Real Sociedad|82',
        'Oihan Sancet|España|Athletic Club|80', 'Iker Muniain|España|Athletic Club|76', 'Mikel Vesga|España|Athletic Club|72', 'Beñat Prados|España|Athletic Club|70',
        'Isco|España|Real Betis|80', 'Sergi Darder|España|Mallorca|74', 'Álex Baena|España|Villarreal|82', 'Santi Comesaña|España|Villarreal|75',
        'Jon Moncayola|España|Osasuna|71', 'Lucas Torreira|Uruguay|Galatasaray|74',
        'Ruben Neves|Portugal|Al-Hilal|80', 'Joao Palhinha|Portugal|Bayern de Múnich|80', 'Ángel Di María|Argentina|Benfica|83', 'Ivan Rakitić|Croacia|Sevilla|76', 'Marcelo Brozović|Croacia|Inter|79', 'Mateo Kovačić|Croacia|Manchester City|82',
        'N\'Golo Kanté|Francia|Chelsea|83', 'Paul Pogba|Francia|Juventus|82', 'Adrien Rabiot|Francia|AC Milan|80', 'Youri Tielemans|Bélgica|Aston Villa|79',
        'Andrés Iniesta|España|FC Barcelona|94|L', 'Xavi Hernández|España|FC Barcelona|93|L', 'Zinedine Zidane|Francia|Real Madrid|95|L', 'Diego Maradona|Argentina|Napoli|97|L',
        'Johan Cruyff|Países Bajos|Ajax|96|L', 'Michel Platini|Francia|Juventus|93|L', 'Ronaldinho|Brasil|FC Barcelona|94|L', 'Kaká|Brasil|AC Milan|91|L',
        'Andrea Pirlo|Italia|AC Milan|91|L', 'Steven Gerrard|Inglaterra|Liverpool|90|L', 'Frank Lampard|Inglaterra|Chelsea|89|L', 'Paul Scholes|Inglaterra|Manchester United|89|L',
        'Clarence Seedorf|Países Bajos|AC Milan|88|L', 'Lothar Matthäus|Alemania|Inter|92|L', 'Roy Keane|Irlanda|Manchester United|89|L', 'Claude Makélélé|Francia|Real Madrid|86|L',
        'Xabi Alonso|España|Real Madrid|89|L', 'Sergio Busquets|España|FC Barcelona|90|L', 'Fernando Redondo|Argentina|Real Madrid|89|L', 'Pavel Nedvěd|Chequia|Juventus|90|L',
        'Karl-Heinz Rummenigge|Alemania|Bayern de Múnich|90|L', 'Bobby Charlton|Inglaterra|Manchester United|92|L', 'Luis Figo|Portugal|Real Madrid|92|L', 'Rui Costa|Portugal|AC Milan|87|L',
        'Hristo Stoichkov|Bulgaria|FC Barcelona|91|L', 'Gheorghe Hagi|Rumanía|Galatasaray|88|L', 'Juan Román Riquelme|Argentina|Boca Juniors|89|L', 'Ruud Gullit|Países Bajos|AC Milan|91|L'
      ],
      DEL: [
        'Lamine Yamal|España|FC Barcelona|90', 'Kylian Mbappé|Francia|Real Madrid|93', 'Vinícius Júnior|Brasil|Real Madrid|91', 'Rodrygo|Brasil|Real Madrid|85',
        'Erling Haaland|Noruega|Manchester City|93', 'Mohamed Salah|Egipto|Liverpool|90', 'Harry Kane|Inglaterra|Bayern de Múnich|91', 'Robert Lewandowski|Polonia|FC Barcelona|88',
        'Raphinha|Brasil|FC Barcelona|88', 'Ferran Torres|España|FC Barcelona|80', 'Antoine Griezmann|Francia|Atlético de Madrid|87', 'Julián Álvarez|Argentina|Atlético de Madrid|86',
        'Alexander Sørloth|Noruega|Atlético de Madrid|79', 'Ángel Correa|Argentina|Atlético de Madrid|76', 'Álvaro Morata|España|AC Milan|79', 'Lautaro Martínez|Argentina|Inter|89',
        'Marcus Thuram|Francia|Inter|85', 'Rafael Leão|Portugal|AC Milan|86', 'Christian Pulisic|EE. UU.|AC Milan|82', 'Victor Osimhen|Nigeria|Galatasaray|86',
        'Khvicha Kvaratskhelia|Georgia|Paris Saint-Germain|86', 'Ousmane Dembélé|Francia|Paris Saint-Germain|88', 'Bradley Barcola|Francia|Paris Saint-Germain|83', 'Gonçalo Ramos|Portugal|Paris Saint-Germain|79',
        'Desiré Doué|Francia|Paris Saint-Germain|82', 'Gabriel Martinelli|Brasil|Arsenal|83', 'Leandro Trossard|Bélgica|Arsenal|80',
        'Kai Havertz|Alemania|Arsenal|82', 'Gabriel Jesus|Brasil|Arsenal|80', 'Viktor Gyökeres|Suecia|Arsenal|85', 'Son Heung-min|Corea del Sur|Tottenham|85',
        'Dominic Solanke|Inglaterra|Tottenham|80', 'Dejan Kulusevski|Suecia|Tottenham|80', 'Alexander Isak|Suecia|Liverpool|87', 'Darwin Núñez|Uruguay|Liverpool|79',
        'Luis Díaz|Colombia|Bayern de Múnich|85', 'Michael Olise|Francia|Bayern de Múnich|86', 'Leroy Sané|Alemania|Galatasaray|83', 'Serge Gnabry|Alemania|Bayern de Múnich|81',
        'Kingsley Coman|Francia|Bayern de Múnich|82', 'Nico Williams|España|Athletic Club|86', 'Iñaki Williams|Ghana|Athletic Club|79', 'Gorka Guruzeta|España|Athletic Club|76',
        'Borja Iglesias|España|Real Betis|76', 'Antony|Brasil|Real Betis|78', 'Ayoze Pérez|España|Villarreal|76', 'Joselu|España|Real Madrid|72', 'Gerard Moreno|España|Villarreal|79', 'Ante Budimir|Croacia|Osasuna|74', 'Raúl García|España|Osasuna|70', 'Sergio Camello|España|Rayo Vallecano|71', 'Isi Palazón|España|Rayo Vallecano|74',
        'Vedat Muriqi|Kosovo|Mallorca|75', 'Hugo Duro|España|Valencia|73', 'Kike García|España|Alavés|67', 'Samu Omorodion|España|Chelsea|72',
        'Artem Dovbyk|Ucrania|AS Roma|79', 'Paulo Dybala|Argentina|AS Roma|82', 'Romelu Lukaku|Bélgica|Napoli|82', 'Scott McTominay|Escocia|Napoli|80',
        'David Neres|Brasil|Napoli|76', 'Dušan Vlahović|Serbia|Juventus|82', 'Kenan Yıldız|Turquía|Juventus|80', 'Randal Kolo Muani|Francia|Juventus|77',
        'Ademola Lookman|Nigeria|Atalanta|84', 'Mateo Retegui|Italia|Atalanta|79', 'Charles De Ketelaere|Bélgica|Atalanta|77', 'Marcus Rashford|Inglaterra|FC Barcelona|82',
        'Bryan Mbeumo|Camerún|Manchester United|82', 'Matheus Cunha|Brasil|Manchester United|82', 'Rasmus Højlund|Dinamarca|Manchester United|76', 'Joshua Zirkzee|Países Bajos|Manchester United|74',
        'Jérémy Doku|Bélgica|Manchester City|82', 'Savinho|Brasil|Manchester City|79', 'Omar Marmoush|Egipto|Manchester City|84', 'Jack Grealish|Inglaterra|Everton|78',
        'Nicolas Jackson|Senegal|Chelsea|78', 'Pedro Neto|Portugal|Chelsea|82', 'João Pedro|Brasil|Chelsea|80', 'Noni Madueke|Inglaterra|Arsenal|78',
        'Jarrod Bowen|Inglaterra|West Ham|80', 'Ollie Watkins|Inglaterra|Aston Villa|83', 'Morgan Rogers|Inglaterra|Aston Villa|82', 'Anthony Gordon|Inglaterra|Newcastle|82',
        'Yoane Wissa|RD Congo|Newcastle|77', 'Eberechi Eze|Inglaterra|Arsenal|82', 'Jean-Philippe Mateta|Francia|Crystal Palace|78', 'Raúl Jiménez|México|Fulham|74',
        'Hirving Lozano|México|PSV|74', 'Santiago Giménez|México|AC Milan|80', 'Luis Suárez|Uruguay|Inter Miami|82', 'Lionel Messi|Argentina|Inter Miami|92',
        'Cristiano Ronaldo|Portugal|Al-Nassr|90', 'Neymar Jr|Brasil|Santos|84', 'Karim Benzema|Francia|Al-Ittihad|87', 'Sadio Mané|Senegal|Al-Nassr|82',
        'Ronaldo Nazário|Brasil|Real Madrid|96|L', 'Thierry Henry|Francia|Arsenal|94|L', 'Raúl González|España|Real Madrid|91|L', 'David Villa|España|Valencia|90|L',
        'Fernando Torres|España|Atlético de Madrid|89|L', 'Samuel Eto\'o|Camerún|FC Barcelona|91|L', 'Didier Drogba|Costa de Marfil|Chelsea|90|L', 'Zlatan Ibrahimović|Suecia|AC Milan|92|L',
        'Gabriel Batistuta|Argentina|Fiorentina|91|L', 'Marco van Basten|Países Bajos|AC Milan|95|L', 'Dennis Bergkamp|Países Bajos|Arsenal|91|L', 'Alan Shearer|Inglaterra|Newcastle|89|L',
        'Wayne Rooney|Inglaterra|Manchester United|91|L', 'Eric Cantona|Francia|Manchester United|88|L', 'Romário|Brasil|FC Barcelona|92|L', 'Rivaldo|Brasil|FC Barcelona|91|L',
        'Pelé|Brasil|Santos|99|L', 'Alfredo Di Stéfano|Argentina|Real Madrid|96|L', 'Ferenc Puskás|Hungría|Real Madrid|95|L', 'George Best|Irlanda del Norte|Manchester United|93|L',
        'Eusébio|Portugal|Benfica|94|L', 'Gerd Müller|Alemania|Bayern de Múnich|94|L', 'Paolo Rossi|Italia|Juventus|88|L', 'Roberto Baggio|Italia|Juventus|92|L',
        'Francesco Totti|Italia|AS Roma|91|L', 'Alessandro Del Piero|Italia|Juventus|91|L', 'Andriy Shevchenko|Ucrania|AC Milan|90|L',
        'Michael Owen|Inglaterra|Liverpool|86|L', 'Gary Lineker|Inglaterra|FC Barcelona|88|L', 'Kenny Dalglish|Escocia|Liverpool|90|L', 'Hugo Sánchez|México|Real Madrid|89|L',
        'Jairzinho|Brasil|Botafogo|90|L', 'Garrincha|Brasil|Botafogo|93|L', 'Zico|Brasil|Flamengo|92|L', 'Mario Kempes|Argentina|Valencia|88|L',
        'Emilio Butragueño|España|Real Madrid|89|L', 'Michael Laudrup|Dinamarca|FC Barcelona|90|L', 'Juanito|España|Real Madrid|82|L', 'Paulo Futre|Portugal|Atlético de Madrid|84|L'
      ]
    },
    baloncesto: {
      Base: [
        'Stephen Curry|EE. UU.|Golden State Warriors|93', 'Luka Dončić|Eslovenia|Los Angeles Lakers|94', 'Shai Gilgeous-Alexander|Canadá|Oklahoma City Thunder|93', 'Trae Young|EE. UU.|Atlanta Hawks|85',
        'Damian Lillard|EE. UU.|Portland Trail Blazers|87', 'Tyrese Haliburton|EE. UU.|Indiana Pacers|87', 'Jalen Brunson|EE. UU.|New York Knicks|89', 'Ja Morant|EE. UU.|Memphis Grizzlies|85',
        'Chris Paul|EE. UU.|Los Angeles Clippers|83', 'Kyrie Irving|EE. UU.|Dallas Mavericks|88', 'De\'Aaron Fox|EE. UU.|San Antonio Spurs|85', 'Darius Garland|EE. UU.|Cleveland Cavaliers|82',
        'LaMelo Ball|EE. UU.|Charlotte Hornets|85', 'James Harden|EE. UU.|Los Angeles Clippers|86', 'Ricky Rubio|España|Cleveland Cavaliers|76', 'Sergio Llull|España|Real Madrid|80',
        'Facundo Campazzo|Argentina|Real Madrid|78', 'Juan Núñez|España|Ratiopharm Ulm|76', 'Lorenzo Brown|EE. UU.|Panathinaikos|79',
        'Kostas Sloukas|Grecia|Fenerbahçe|80', 'Mike James|EE. UU.|Mónaco|78', 'Thomas Heurtel|Francia|Barcelona|74', 'Nico Laprovittola|Argentina|Barcelona|74',
        'Magic Johnson|EE. UU.|Los Angeles Lakers|96|L', 'John Stockton|EE. UU.|Utah Jazz|93|L', 'Isiah Thomas|EE. UU.|Detroit Pistons|92|L', 'Steve Nash|Canadá|Phoenix Suns|92|L',
        'Jason Kidd|EE. UU.|New Jersey Nets|91|L', 'Allen Iverson|EE. UU.|Philadelphia 76ers|91|L', 'Gary Payton|EE. UU.|Seattle SuperSonics|90|L', 'Tony Parker|Francia|San Antonio Spurs|90|L',
        'Juan Carlos Navarro|España|FC Barcelona|88|L', 'Oscar Robertson|EE. UU.|Milwaukee Bucks|94|L', 'Walt Frazier|EE. UU.|New York Knicks|90|L', 'Manu Ginóbili|Argentina|San Antonio Spurs|91|L'
      ],
      Escolta: [
        'Anthony Edwards|EE. UU.|Minnesota Timberwolves|90', 'Devin Booker|EE. UU.|Phoenix Suns|88', 'Donovan Mitchell|EE. UU.|Cleveland Cavaliers|88', 'Jaylen Brown|EE. UU.|Boston Celtics|88',
        'Klay Thompson|EE. UU.|Golden State Warriors|84', 'Zach LaVine|EE. UU.|Sacramento Kings|83', 'Tyler Herro|EE. UU.|Miami Heat|83', 'CJ McCollum|EE. UU.|New Orleans Pelicans|82',
        'Bradley Beal|EE. UU.|Phoenix Suns|82', 'Jalen Green|EE. UU.|Houston Rockets|82', 'Desmond Bane|EE. UU.|Orlando Magic|84', 'Anfernee Simons|EE. UU.|Portland Trail Blazers|79',
        'Álex Abrines|España|Barcelona|75', 'Rudy Fernández|España|Real Madrid|80', 'Nando de Colo|Francia|Fenerbahçe|79', 'Kendrick Nunn|EE. UU.|Panathinaikos|76',
        'Shane Larkin|EE. UU.|Anadolu Efes|80', 'Will Clyburn|EE. UU.|Anadolu Efes|78', 'Nick Calathes|Grecia|Panathinaikos|77', 'Juancho Hernangómez|España|Boston Celtics|72',
        'Michael Jordan|EE. UU.|Chicago Bulls|99|L', 'Kobe Bryant|EE. UU.|Los Angeles Lakers|96|L', 'Dwyane Wade|EE. UU.|Miami Heat|92|L', 'Clyde Drexler|EE. UU.|Portland Trail Blazers|90|L',
        'Reggie Miller|EE. UU.|Indiana Pacers|88|L', 'Ray Allen|EE. UU.|Boston Celtics|89|L', 'George Gervin|EE. UU.|San Antonio Spurs|90|L', 'Vince Carter|EE. UU.|Toronto Raptors|88|L',
        'Drazen Petrovic|Croacia|New Jersey Nets|90|L', 'Jerry West|EE. UU.|Los Angeles Lakers|94|L', 'Pete Maravich|EE. UU.|Atlanta Hawks|90|L',
        'Predrag Danilović|Serbia|Virtus Bolonia|86|L', 'Toni Kukoč|Croacia|Chicago Bulls|88|L', 'Vassilis Spanoulis|Grecia|Olympiacos|87|L'
      ],
      Alero: [
        'LeBron James|EE. UU.|Los Angeles Lakers|94', 'Kevin Durant|EE. UU.|Phoenix Suns|93', 'Jayson Tatum|EE. UU.|Boston Celtics|93', 'Kawhi Leonard|EE. UU.|Los Angeles Clippers|89',
        'Paul George|EE. UU.|Philadelphia 76ers|85', 'Jimmy Butler|EE. UU.|Golden State Warriors|88', 'DeMar DeRozan|EE. UU.|Sacramento Kings|84', 'Brandon Ingram|EE. UU.|Toronto Raptors|84',
        'Mikal Bridges|EE. UU.|New York Knicks|85', 'OG Anunoby|Reino Unido|New York Knicks|84', 'Franz Wagner|Alemania|Orlando Magic|85', 'Paolo Banchero|EE. UU.|Orlando Magic|86',
        'Scottie Barnes|Canadá|Toronto Raptors|84', 'Jaden McDaniels|EE. UU.|Minnesota Timberwolves|78', 'Dillon Brooks|Canadá|Phoenix Suns|76', 'Willy Hernangómez|España|New Orleans Pelicans|75', 'Santi Aldama|España|Memphis Grizzlies|78', 'Dennis Schröder|Alemania|Sacramento Kings|79', 'Sasha Vezenkov|Bulgaria|Olympiacos|82',
        'Larry Bird|EE. UU.|Boston Celtics|97|L', 'Scottie Pippen|EE. UU.|Chicago Bulls|92|L', 'Julius Erving|EE. UU.|Philadelphia 76ers|93|L', 'Dominique Wilkins|EE. UU.|Atlanta Hawks|89|L',
        'Carmelo Anthony|EE. UU.|New York Knicks|88|L', 'Paul Pierce|EE. UU.|Boston Celtics|88|L', 'Dirk Nowitzki|Alemania|Dallas Mavericks|93|L', 'Rick Barry|EE. UU.|Golden State Warriors|89|L',
        'Elgin Baylor|EE. UU.|Los Angeles Lakers|91|L', 'Tracy McGrady|EE. UU.|Orlando Magic|90|L', 'Fernando Martín|España|Real Madrid|82|L', 'Dejan Bodiroga|Serbia|Panathinaikos|90|L', 'Nikos Galis|Grecia|Aris|90|L'
      ],
      'Ala-pívot': [
        'Giannis Antetokounmpo|Grecia|Milwaukee Bucks|94', 'Anthony Davis|EE. UU.|Dallas Mavericks|88', 'Zion Williamson|EE. UU.|New Orleans Pelicans|84', 'Pascal Siakam|Camerún|Indiana Pacers|85',
        'Bam Adebayo|EE. UU.|Miami Heat|85', 'Evan Mobley|EE. UU.|Cleveland Cavaliers|86', 'Jabari Smith Jr.|EE. UU.|Houston Rockets|80', 'Julius Randle|EE. UU.|Minnesota Timberwolves|83',
        'Draymond Green|EE. UU.|Golden State Warriors|82', 'Jaren Jackson Jr.|EE. UU.|Memphis Grizzlies|85', 'Lauri Markkanen|Finlandia|Utah Jazz|85', 'Alperen Şengün|Turquía|Houston Rockets|86',
        'Domantas Sabonis|Lituania|Sacramento Kings|88', 'Jonas Valančiūnas|Lituania|Washington Wizards|80', 'Marc Gasol|España|Memphis Grizzlies|88|L', 'Pau Gasol|España|Los Angeles Lakers|91|L', 'Karl Malone|EE. UU.|Utah Jazz|93|L', 'Charles Barkley|EE. UU.|Phoenix Suns|92|L',
        'Kevin Garnett|EE. UU.|Minnesota Timberwolves|92|L', 'Tim Duncan|EE. UU.|San Antonio Spurs|95|L', 'Dennis Rodman|EE. UU.|Chicago Bulls|86|L', 'Chris Bosh|EE. UU.|Miami Heat|87|L',
        'Kevin McHale|EE. UU.|Boston Celtics|90|L', 'Bob Pettit|EE. UU.|St. Louis Hawks|90|L', 'Detlef Schrempf|Alemania|Seattle SuperSonics|84|L', 'Felipe Reyes|España|Real Madrid|82|L', 'Antoine Rigaudeau|Francia|Kinder Bolonia|86|L'
      ],
      'Pívot': [
        'Nikola Jokić|Serbia|Denver Nuggets|97', 'Joel Embiid|Camerún|Philadelphia 76ers|91', 'Victor Wembanyama|Francia|San Antonio Spurs|93', 'Rudy Gobert|Francia|Minnesota Timberwolves|84',
        'Karl-Anthony Towns|EE. UU.|New York Knicks|88', 'Chet Holmgren|EE. UU.|Oklahoma City Thunder|84', 'Jarrett Allen|EE. UU.|Cleveland Cavaliers|82', 'Walker Kessler|EE. UU.|Utah Jazz|78',
        'Clint Capela|Suiza|Houston Rockets|78', 'Deandre Ayton|Bahamas|Portland Trail Blazers|80', 'Mitchell Robinson|EE. UU.|New York Knicks|77', 'Ivica Zubac|Croacia|Los Angeles Clippers|82',
        'Walter Tavares|Cabo Verde|Real Madrid|85', 'Mario Hezonja|Croacia|Real Madrid|80', 'Shaquille O\'Neal|EE. UU.|Los Angeles Lakers|97|L', 'Kareem Abdul-Jabbar|EE. UU.|Los Angeles Lakers|97|L', 'Hakeem Olajuwon|Nigeria|Houston Rockets|95|L', 'Bill Russell|EE. UU.|Boston Celtics|95|L',
        'Wilt Chamberlain|EE. UU.|Philadelphia 76ers|98|L', 'Patrick Ewing|Jamaica|New York Knicks|90|L', 'David Robinson|EE. UU.|San Antonio Spurs|92|L', 'Moses Malone|EE. UU.|Houston Rockets|91|L',
        'Dikembe Mutombo|RD Congo|Atlanta Hawks|86|L', 'Yao Ming|China|Houston Rockets|88|L', 'Arvydas Sabonis|Lituania|Portland Trail Blazers|90|L', 'Bob Lanier|EE. UU.|Detroit Pistons|86|L',
        'Dwight Howard|EE. UU.|Orlando Magic|88|L', 'Vlade Divac|Serbia|Los Angeles Lakers|85|L', 'Fernando Romay|España|Real Madrid|78|L'
      ]
    },
    tenis: {
      Derecha: [
        'Carlos Alcaraz|España|D|93', 'Jannik Sinner|Italia|D|93', 'Novak Djokovic|Serbia|D|94', 'Alexander Zverev|Alemania|D|88', 'Daniil Medvedev|Rusia|D|88',
        'Taylor Fritz|EE. UU.|D|84', 'Stefanos Tsitsipas|Grecia|D|84', 'Casper Ruud|Noruega|D|84', 'Holger Rune|Dinamarca|D|83', 'Andrey Rublev|Rusia|D|84',
        'Alex de Miñaur|Australia|D|82', 'Grigor Dimitrov|Bulgaria|D|82', 'Tommy Paul|EE. UU.|D|80', 'Félix Auger-Aliassime|Canadá|D|82', 'Ben Shelton|EE. UU.|Z|83',
        'Roberto Bautista Agut|España|D|78', 'Pablo Carreño|España|D|74', 'Alejandro Davidovich|España|D|77', 'Jaume Munar|España|D|72', 
        'Iga Świątek|Polonia|D|93', 'Aryna Sabalenka|Bielorrusia|D|93', 'Coco Gauff|EE. UU.|D|88', 'Jessica Pegula|EE. UU.|D|85', 'Elena Rybakina|Kazajistán|D|87',
        'Jasmine Paolini|Italia|D|83', 'Paula Badosa|España|D|80', 'Garbiñe Muguruza|España|D|82', 'Ons Jabeur|Túnez|D|82', 'Madison Keys|EE. UU.|D|84',
        'Roger Federer|Suiza|D|98|L', 'Pete Sampras|EE. UU.|D|95|L', 'Andre Agassi|EE. UU.|D|94|L', 'Björn Borg|Suecia|D|94|L', 'Boris Becker|Alemania|D|92|L',
        'Stefan Edberg|Suecia|D|91|L', 'Ivan Lendl|Chequia|D|93|L', 'Andy Murray|Reino Unido|D|90|L', 'Juan Martín del Potro|Argentina|D|88|L', 'Stan Wawrinka|Suiza|D|88|L',
        'Carlos Moyà|España|D|86|L', 'Juan Carlos Ferrero|España|D|86|L', 'David Ferrer|España|D|88|L', 'Gustavo Kuerten|Brasil|D|88|L', 'Lleyton Hewitt|Australia|D|87|L',
        'Serena Williams|EE. UU.|D|98|L', 'Venus Williams|EE. UU.|D|92|L', 'Steffi Graf|Alemania|D|97|L', 'Chris Evert|EE. UU.|D|94|L', 'Arantxa Sánchez Vicario|España|D|90|L',
        'Conchita Martínez|España|D|88|L', 'Justine Henin|Bélgica|D|91|L', 'Maria Sharapova|Rusia|D|90|L', 'Martina Hingis|Suiza|D|92|L', 'Ashleigh Barty|Australia|D|90|L'
      ],
      Izquierda: [
        'Rafael Nadal|España|Z|96|L', 'Ben Shelton|EE. UU.|Z|83', 'Jack Draper|Reino Unido|Z|82', 'Lorenzo Musetti|Italia|D|82', 'Francisco Cerúndolo|Argentina|D|78',
        'Cameron Norrie|Reino Unido|Z|77', 'Denis Shapovalov|Canadá|Z|76', 'Diego Schwartzman|Argentina|D|76', 'Albert Ramos|España|Z|72', 'Feliciano López|España|Z|75',
        'Fernando Verdasco|España|Z|78', 'Marcelo Melo|Brasil|D|70', 'Rohan Bopanna|India|D|72', 'Marcel Granollers|España|D|74', 'Horacio Zeballos|Argentina|Z|74',
        'Martina Navratilova|EE. UU.|Z|97|L', 'Monica Seles|EE. UU.|Z|94|L', 'Petra Kvitová|Chequia|Z|86', 'Jimmy Connors|EE. UU.|Z|93|L',
        'John McEnroe|EE. UU.|Z|96|L', 'Rod Laver|Australia|Z|97|L', 'Goran Ivanišević|Croacia|Z|88|L', 'Thomas Muster|Austria|Z|86|L', 'Guillermo Vilas|Argentina|Z|88|L',
        'Manuel Orantes|España|Z|85|L', 'Marcelo Ríos|Chile|Z|84|L', 'Emma Raducanu|Reino Unido|D|78', 'Sloane Stephens|EE. UU.|D|78', 'Naomi Osaka|Japón|D|84', 'Victoria Azarenka|Bielorrusia|D|82', 'Karolína Plíšková|Chequia|D|80',
        'Mirra Andreeva|Rusia|D|84', 'Jelena Ostapenko|Letonia|D|80', 'Marta Kostyuk|Ucrania|D|78', 'Danielle Collins|EE. UU.|D|78', 'Sara Sorribes|España|D|72',
        'Carla Suárez|España|D|78', 'Lucas Pouille|Francia|D|74', 'Gaël Monfils|Francia|D|82', 'Gilles Simon|Francia|D|76', 'Richard Gasquet|Francia|D|80',
        'Marat Safin|Rusia|D|90|L', 'Andy Roddick|EE. UU.|D|88|L', 'Patrick Rafter|Australia|D|86|L', 'Mats Wilander|Suecia|D|91|L', 'Michael Chang|EE. UU.|D|84|L'
      ]
    },
    running: {
      Relevista: [
        'Usain Bolt|Jamaica||99|L', 'Yohan Blake|Jamaica||92|L', 'Asafa Powell|Jamaica||91|L', 'Nesta Carter|Jamaica||88', 'Shelly-Ann Fraser-Pryce|Jamaica||94|L',
        'Noah Lyles|EE. UU.||92', 'Fred Kerley|EE. UU.||88', 'Christian Coleman|EE. UU.||88', 'Kenny Bednarek|EE. UU.||86', 'Trayvon Bromell|EE. UU.||86',
        'Carl Lewis|EE. UU.||96|L', 'Maurice Greene|EE. UU.||93|L', 'Justin Gatlin|EE. UU.||90|L', 'Tyson Gay|EE. UU.||90|L', 'Michael Johnson|EE. UU.||95|L',
        'Marcell Jacobs|Italia||90', 'Filippo Tortu|Italia||82', 'Zharnel Hughes|Reino Unido||86', 'Reece Prescod|Reino Unido||78',
        'Linford Christie|Reino Unido||90|L', 'Dwain Chambers|Reino Unido||82', 'Christophe Lemaitre|Francia||84', 'Jimmy Vicaut|Francia||84', 'Ronnie Baker|EE. UU.||82',
        'Akani Simbine|Sudáfrica||86', 'Ferdinand Omanyala|Kenia||84', 'Letsile Tebogo|Botsuana||90', 'Oblique Seville|Jamaica||87', 'Kishane Thompson|Jamaica||90',
        'Andre De Grasse|Canadá||88', 'Aaron Brown|Canadá||80', 'Su Bingtian|China||85', 'Yoshihide Kiryu|Japón||80', 'Abdul Hakim Sani Brown|Japón||82',
        'Ángel David Rodríguez|España||74', 'Bruno Hortelano|España||80', 'Óscar Husillos|España||80',
        'Ato Boldon|Trinidad y Tobago||88|L', 'Frankie Fredericks|Namibia||88|L', 'Donovan Bailey|Canadá||90|L', 'Allyson Felix|EE. UU.||94|L', 'Elaine Thompson-Herah|Jamaica||93|L', 'Sha\'Carri Richardson|EE. UU.||88', 'Marie-Josée Ta Lou|Costa de Marfil||85', 'Dina Asher-Smith|Reino Unido||86'
      ]
    }
  };

  /* convierte las líneas en objetos y descarta las entradas incompletas */
  function parse(list, pos) {
    var out = [];
    list.forEach(function (ln) {
      var p = ln.split('|'); if (p.length < 4) return;
      var r = parseInt(p[3], 10); if (!p[0] || !p[1] || isNaN(r)) return;
      out.push({ name: p[0].trim(), country: p[1].trim(), club: p[2].trim(), r: r, leg: p[4] === 'L', pos: pos });
    });
    return out;
  }
  KG.DB = {};
  Object.keys(RAW).forEach(function (sport) {
    KG.DB[sport] = {};
    Object.keys(RAW[sport]).forEach(function (pos) { KG.DB[sport][pos] = parse(RAW[sport][pos], pos); });
  });
})();

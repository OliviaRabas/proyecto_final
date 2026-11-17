(function () {
    // ---- Elementos ----
    var elPuntos = document.getElementById('puntos');
    var elRecord = document.getElementById('record');
    var elMensaje = document.getElementById('mensaje');
    var elBotones = document.querySelector('.botones');
    var btnHigher = document.getElementById('btn-higher');
    var btnLower = document.getElementById('btn-lower');
    var btnReiniciar = document.getElementById('btn-reiniciar');
    var elFin = document.getElementById('fin');
    var elFinPuntos = document.getElementById('fin-puntos');

    // Ranking
    var elRankingMini = document.getElementById('ranking-mini');
    var elListaRanking = document.getElementById('lista-ranking');
    var elNuevoRecord = document.getElementById('nuevo-record');
    var inputNombre = document.getElementById('input-nombre');
    var btnGuardar = document.getElementById('btn-guardar');
    var elMsgNombre = document.getElementById('msg-nombre');

    var izq = {
        tarjeta: document.getElementById('tarjeta-izq'),
        img: document.getElementById('img-izq'),
        nombre: document.getElementById('nombre-izq'),
        pob: document.getElementById('pob-izq')
    };
    var der = {
        tarjeta: document.getElementById('tarjeta-der'),
        img: document.getElementById('img-der'),
        nombre: document.getElementById('nombre-der'),
        pob: document.getElementById('pob-der')
    };

    function mostrarError(texto) {
        elMensaje.textContent = '⚠ ' + texto;
        elMensaje.className = 'mensaje mal';
        console.error(texto);
    }

    // ---- Datos ----
    var LISTA = [];
    try {
        LISTA = JSON.parse(document.getElementById('datos-paises').textContent);
    } catch (e) {
        mostrarError('No se pudieron leer los países: ' + e.message);
        return;
    }
    if (!LISTA || LISTA.length < 2) {
        mostrarError('La lista de países llegó vacía. Revisá /higher-lower en app.py y data/paises.json.');
        return;
    }

    // ---- Estado ----
    var MAX_RANKING = 3;            // tiene que coincidir con MAX_RANKING de app.py
    var MEDALLAS = ['🥇', '🥈', '🥉'];

    var mazo = [];
    var paisIzq = null;
    var paisDer = null;
    var puntos = 0;
    var record = 0;                 // mejor puntaje: el del ranking guardado o el de esta sesión
    var seleccion = 0;              // 0 = Higher, 1 = Lower
    var bloqueado = false;          // true mientras se muestra el resultado
    var terminado = false;
    var ranking = [];               // [{nombre, puntos}, ...] que viene del servidor
    var capturandoNombre = false;   // true mientras el jugador escribe su nombre
    var guardando = false;          // true mientras se envía el nombre al servidor
    var partida = 0;                // se incrementa en cada partida (evita respuestas tardías)

    elRecord.textContent = record;

    // ---- Utilidades ----
    function mezclar(lista) {
        for (var i = lista.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
        }
        return lista;
    }

    // Saca un país del mazo barajado (no se repiten hasta usar todos)
    function sacarPais() {
        if (mazo.length === 0) mazo = mezclar(LISTA.slice());
        return mazo.pop();
    }

    function formatear(n) {
        return Number(n).toLocaleString('es-AR');
    }

    function contar(elemento, hasta) {
        var duracion = 700;
        var inicio = performance.now();
        function paso(ahora) {
            var t = Math.min((ahora - inicio) / duracion, 1);
            elemento.textContent = formatear(Math.round(hasta * t)) + ' hab.';
            if (t < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
    }

    function mostrarPais(lado, pais, mostrarPoblacion) {
        var intentos = 0;
        lado.img.onerror = function () {
            intentos++;
            if (intentos === 1) {
                // Si falla la imagen local, probamos con flagcdn
                lado.img.src = 'https://flagcdn.com/' + pais.codigo + '.svg';
            }
        };
        lado.img.src = pais.imagen;
        lado.img.alt = 'Bandera de ' + pais.nombre;
        lado.nombre.textContent = pais.nombre;
        lado.pob.textContent = mostrarPoblacion ? formatear(pais.poblacion) + ' hab.' : '???';
        lado.tarjeta.classList.remove('correcta', 'incorrecta');
    }

    function resaltar() {
        btnHigher.classList.toggle('seleccionada', seleccion === 0);
        btnLower.classList.toggle('seleccionada', seleccion === 1);
    }

    // ---- Ranking ----
    function entraEnRanking(pts, lista) {
        return pts > 0 && (lista.length < MAX_RANKING || pts > lista[lista.length - 1].puntos);
    }

    // Franja con los 3 mejores, arriba del juego
    function dibujarRankingMini() {
        elRankingMini.innerHTML = '';
        if (ranking.length === 0) {
            var vacio = document.createElement('span');
            vacio.textContent = '🏆 Todavía no hay récords';
            elRankingMini.appendChild(vacio);
            return;
        }
        ranking.forEach(function (r, i) {
            var s = document.createElement('span');
            s.textContent = MEDALLAS[i] + ' ' + r.nombre + ' · ' + r.puntos;
            elRankingMini.appendChild(s);
        });
    }

    // Tabla de la pantalla de fin. "posicionNueva" resalta el puesto recién conseguido
    function dibujarListaRanking(posicionNueva) {
        elListaRanking.innerHTML = '';
        if (ranking.length === 0) {
            var li0 = document.createElement('li');
            li0.textContent = 'Sin puntajes todavía';
            elListaRanking.appendChild(li0);
            return;
        }
        ranking.forEach(function (r, i) {
            var li = document.createElement('li');
            if (i === posicionNueva) li.className = 'nuevo';
            var nombre = document.createElement('span');
            nombre.textContent = MEDALLAS[i] + ' ' + r.nombre;
            var pts = document.createElement('b');
            pts.textContent = r.puntos;
            li.appendChild(nombre);
            li.appendChild(pts);
            elListaRanking.appendChild(li);
        });
    }

    function actualizarRecord() {
        var mejor = ranking.length ? ranking[0].puntos : 0;
        if (mejor > record) record = mejor;
        elRecord.textContent = record;
    }

    function aplicarRanking(lista) {
        ranking = Array.isArray(lista) ? lista : [];
        actualizarRecord();
        dibujarRankingMini();
    }

    function cargarRanking() {
        return fetch('/api/ranking', { cache: 'no-store' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(aplicarRanking);
    }

    function pedirNombre() {
        capturandoNombre = true;
        guardando = false;
        elMsgNombre.textContent = '';
        inputNombre.value = '';
        btnGuardar.classList.remove('bloqueado');
        elNuevoRecord.style.display = 'flex';
        btnReiniciar.style.display = 'none';   // primero hay que guardar el nombre
        setTimeout(function () { inputNombre.focus(); }, 60);
    }

    function terminarCaptura() {
        capturandoNombre = false;
        guardando = false;
        elNuevoRecord.style.display = 'none';
        btnReiniciar.style.display = '';
    }

    function guardarNombre() {
        if (!capturandoNombre || guardando) return;

        var nombre = inputNombre.value.replace(/\s+/g, ' ').trim();
        if (!nombre) {
            elMsgNombre.textContent = 'Escribí un nombre para guardar tu puntaje';
            inputNombre.focus();
            return;
        }

        guardando = true;
        btnGuardar.classList.add('bloqueado');
        elMsgNombre.textContent = 'Guardando...';
        var miPartida = partida;

        fetch('/api/ranking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre, puntos: puntos })
        })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (d) {
                if (miPartida !== partida) return;
                aplicarRanking(d.ranking);
                dibujarListaRanking(d.entro ? d.posicion : -1);
                terminarCaptura();
                btnReiniciar.focus();
            })
            .catch(function (e) {
                console.error('No se pudo guardar el ranking:', e);
                if (miPartida !== partida) return;
                guardando = false;
                btnGuardar.classList.remove('bloqueado');
                elMsgNombre.textContent = 'No se pudo guardar. Probá de nuevo.';
            });
    }

    // ---- Rondas ----
    function nuevaRonda() {
        paisIzq = sacarPais();
        paisDer = sacarPais();
        while (paisDer.codigo === paisIzq.codigo) paisDer = sacarPais();

        mostrarPais(izq, paisIzq, true);
        mostrarPais(der, paisDer, false);

        elMensaje.textContent = '';
        elMensaje.className = 'mensaje';
        elBotones.classList.remove('bloqueado');
        bloqueado = false;
    }

    function responder(esHigher) {
        if (bloqueado || terminado) return;
        bloqueado = true;
        elBotones.classList.add('bloqueado');

        // Si las poblaciones fueran iguales, cuenta como acierto
        var acierto = esHigher
            ? paisDer.poblacion >= paisIzq.poblacion
            : paisDer.poblacion <= paisIzq.poblacion;

        contar(der.pob, paisDer.poblacion);

        if (acierto) {
            puntos++;
            elPuntos.textContent = puntos;
            der.tarjeta.classList.add('correcta');
            elMensaje.textContent = '✔ ¡Correcto! +1 punto';
            elMensaje.className = 'mensaje ok';
            setTimeout(nuevaRonda, 1700);
        } else {
            der.tarjeta.classList.add('incorrecta');
            elMensaje.textContent = '✘ Incorrecto';
            elMensaje.className = 'mensaje mal';
            setTimeout(finDelJuego, 1700);
        }
    }

    function finDelJuego() {
        terminado = true;
        var miPartida = partida;

        if (puntos > record) {
            record = puntos;
            elRecord.textContent = record;
        }
        elFinPuntos.textContent = puntos;
        elNuevoRecord.style.display = 'none';
        btnReiniciar.style.display = '';
        dibujarListaRanking(-1);
        elFin.style.display = 'flex';
        elFin.scrollTop = 0;

        // Pedimos el ranking más nuevo al servidor (otros jugadores pudieron cambiarlo)
        cargarRanking()
            .catch(function (e) { console.warn('No se pudo leer el ranking:', e); })
            .then(function () {
                if (miPartida !== partida || !terminado) return;
                dibujarListaRanking(-1);
                if (entraEnRanking(puntos, ranking)) pedirNombre();
            });
    }

    function reiniciar() {
        if (capturandoNombre) return;   // primero hay que guardar el nombre
        partida++;
        puntos = 0;
        elPuntos.textContent = 0;
        terminado = false;
        elFin.style.display = 'none';
        seleccion = 0;
        resaltar();
        nuevaRonda();
    }

    // ---- Entrada (teclado) ----
    var ultimoEvento = '';
    var ultimaHora = 0;

    function manejar(evento) {
        // Mientras se escribe el nombre, el juego no responde a las flechas ni a Esc
        if (capturandoNombre) return;

        // Evita procesar dos veces la misma tecla (teclado directo + alEntrada)
        var ahora = Date.now();
        if (evento === ultimoEvento && ahora - ultimaHora < 80) return;
        ultimoEvento = evento;
        ultimaHora = ahora;

        if (evento === 'volver') { window.location = '/modo'; return; }

        if (terminado) {
            if (evento === 'aceptar') reiniciar();
            return;
        }
        if (bloqueado) return;

        if (evento === 'izquierda' || evento === 'arriba') seleccion = 0;
        if (evento === 'derecha' || evento === 'abajo') seleccion = 1;
        if (evento === 'aceptar') { responder(seleccion === 0); return; }
        resaltar();
    }

    // 1) Teclado directo, no depende de input.js
    document.addEventListener('keydown', function (e) {
        // Si se está escribiendo en un campo de texto, no tocamos las teclas
        if (e.target && e.target.tagName === 'INPUT') return;

        var mapa = {
            ArrowLeft: 'izquierda', ArrowRight: 'derecha',
            ArrowUp: 'arriba', ArrowDown: 'abajo',
            Enter: 'aceptar', Escape: 'volver'
        };
        var evento = mapa[e.key];
        if (evento) {
            e.preventDefault();
            manejar(evento);
        }
    });

    // 2) También se engancha a tu input.js (por si maneja botones especiales)
    if (typeof alEntrada === 'function') {
        try { alEntrada(manejar); } catch (e) { console.warn('alEntrada falló:', e); }
    }

    // 3) Campo del nombre: Enter guarda, y las teclas no llegan al resto del juego
    ['keydown', 'keyup', 'keypress'].forEach(function (tipo) {
        inputNombre.addEventListener(tipo, function (e) {
            e.stopPropagation();
            if (tipo === 'keydown' && e.key === 'Enter') {
                e.preventDefault();
                guardarNombre();
            }
        });
    });

    // ---- Mouse / toque ----
    btnHigher.addEventListener('mouseenter', function () { if (!bloqueado && !terminado) { seleccion = 0; resaltar(); } });
    btnLower.addEventListener('mouseenter', function () { if (!bloqueado && !terminado) { seleccion = 1; resaltar(); } });
    btnHigher.addEventListener('click', function () { seleccion = 0; resaltar(); responder(true); });
    btnLower.addEventListener('click', function () { seleccion = 1; resaltar(); responder(false); });
    btnReiniciar.addEventListener('click', reiniciar);
    btnGuardar.addEventListener('click', guardarNombre);

    // ---- Arranque ----
    dibujarRankingMini();
    cargarRanking().catch(function (e) { console.warn('No se pudo leer el ranking:', e); });
    resaltar();
    nuevaRonda();
})();
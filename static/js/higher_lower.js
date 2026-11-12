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
    var mazo = [];
    var paisIzq = null;
    var paisDer = null;
    var puntos = 0;
    var record = 0;         // solo en memoria: se reinicia al recargar la página
    var seleccion = 0;      // 0 = Higher, 1 = Lower
    var bloqueado = false;  // true mientras se muestra el resultado
    var terminado = false;

    // Borra el récord viejo que pudo haber quedado guardado en el navegador
    try { localStorage.removeItem('hl_record'); } catch (e) {}
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
        if (puntos > record) {
            record = puntos;
            elRecord.textContent = record;
        }
        elFinPuntos.textContent = puntos;
        elFin.style.display = 'flex';
    }

    function reiniciar() {
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

    // ---- Mouse ----
    btnHigher.addEventListener('mouseenter', function () { if (!bloqueado && !terminado) { seleccion = 0; resaltar(); } });
    btnLower.addEventListener('mouseenter', function () { if (!bloqueado && !terminado) { seleccion = 1; resaltar(); } });
    btnHigher.addEventListener('click', function () { seleccion = 0; resaltar(); responder(true); });
    btnLower.addEventListener('click', function () { seleccion = 1; resaltar(); responder(false); });
    btnReiniciar.addEventListener('click', reiniciar);

    // ---- Arranque ----
    resaltar();
    nuevaRonda();
})();
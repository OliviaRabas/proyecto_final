// El continente viene del HTML: <body data-continente="europa">
const continente = document.body.dataset.continente;
const RUTA_BANDERAS = "/static/flags/";

// Cada botón del joystick = una respuesta (mismo orden que la cuadrícula)
const BOTONES = {
    arriba_izquierda: 0,
    arriba_derecha: 1,
    abajo_izquierda: 2,
    abajo_derecha: 3
};

const pantallaJuego = document.getElementById('pantalla-juego');
const pantallaFinal = document.getElementById('pantalla-final');
const ayuda = document.getElementById('ayuda');

let puntos = 0;
let tiempo = 60;
let terminado = false;
let bloqueado = true;   // true mientras se muestra si acertó o no

async function cargarPregunta() {
    const resp = await fetch('/api/pregunta/' + continente);
    const p = await resp.json();

    if (p.error) {
        alert(p.error);
        return;
    }

    document.getElementById('bandera').src = RUTA_BANDERAS + p.bandera + '.svg';
    p.opciones.forEach((nombre, i) => {
        const caja = document.getElementById('op' + i);
        caja.textContent = nombre;
        caja.classList.remove('bien', 'mal');
    });
    bloqueado = false;
}

async function responder(numero) {
    bloqueado = true;
    const resp = await fetch('/api/responder', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({opcion: numero})
    });
    const r = await resp.json();

    // La correcta en verde y, si falló, la elegida en rojo
    document.getElementById('op' + r.correcta).classList.add('bien');
    if (r.acierto) {
        puntos++;
        document.getElementById('puntos').textContent = puntos;
    } else {
        document.getElementById('op' + numero).classList.add('mal');
    }

    // Esperar un poquito y pasar a la siguiente
    setTimeout(() => {
        if (!terminado) cargarPregunta();
    }, 700);
}

function terminar() {
    terminado = true;
    pantallaJuego.hidden = true;
    pantallaFinal.hidden = false;
    document.getElementById('puntaje-final').textContent = puntos;
    ayuda.textContent = "▲ Jugar de nuevo (Q)     ↩ Elegir continente (S)";
}

// Reloj: baja de a 1 segundo
const reloj = setInterval(() => {
    tiempo--;
    document.getElementById('tiempo').textContent = tiempo;
    if (tiempo <= 0) {
        clearInterval(reloj);
        terminar();
    }
}, 1000);

// Botones del joystick (o las teclas Q W A S)
alEntrada((evento) => {
    if (terminado) {
        if (evento === "arriba_izquierda") window.location.reload();
        if (evento === "abajo_derecha")    window.location = "/jugar";
        return;
    }
    if (!bloqueado && evento in BOTONES) {
        responder(BOTONES[evento]);
    }
});

cargarPregunta();
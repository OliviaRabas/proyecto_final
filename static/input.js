// static/input.js

// Teclas para probar en la PC. Forman la misma cuadrícula 2x2 que el joystick:
//   Q  W
//   A  S
const TECLAS = {
    q: "arriba_izquierda",
    w: "arriba_derecha",
    a: "abajo_izquierda",
    s: "abajo_derecha"
};

// Qué hacer cuando llega un botón (cada página lo define a su manera)
let manejador = () => {};

function alEntrada(funcion) {
    manejador = funcion;
}

// Origen 1: el teclado
document.addEventListener('keydown', (e) => {
    const evento = TECLAS[e.key.toLowerCase()];
    if (evento) manejador(evento);
});

// Origen 2: el joystick (pregunta al servidor cada 0,1 segundos)
async function consultarJoystick() {
    try {
        const respuesta = await fetch('/api/input');
        const datos = await respuesta.json();
        datos.eventos.forEach(ev => manejador(ev));
    } catch (error) {
        console.error("No hay conexión con la Raspberry:", error);
    }
}
setInterval(consultarJoystick, 100);
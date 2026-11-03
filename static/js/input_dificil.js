// Qué hacer cuando llega una tecla (cada página lo define a su manera)
let manejador = () => {};

function alEntrada(funcion) {
    manejador = funcion;
}

// En el modo difícil las teclas especiales son: Enter, Esc y las flechas ▲ ▼
// (para moverse entre la barra de texto y el botón Volver).
// Las letras, Backspace y ◄ ► quedan libres para poder escribir.
const TECLAS = {
    ArrowUp: "arriba",
    ArrowDown: "abajo",
    Enter: "aceptar",
    Escape: "volver",
};

document.addEventListener("keydown", (e) => {
    const evento = TECLAS[e.key];
    if (!evento) return;
    e.preventDefault();
    if (e.repeat) return;
    manejador(evento);
});
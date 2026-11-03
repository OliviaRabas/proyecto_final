// Qué hacer cuando llega una tecla (cada página lo define a su manera)
let manejador = () => {};

function alEntrada(funcion) {
    manejador = funcion;
}

// Teclas -> eventos
const TECLAS = {
    ArrowUp: "arriba",
    ArrowDown: "abajo",
    ArrowLeft: "izquierda",
    ArrowRight: "derecha",
    Enter: "aceptar",
    Escape: "volver",
    Backspace: "volver",
    // Atajos directos del juego (esquinas): Q W / A S
    q: "directo0",
    w: "directo1",
    a: "directo2",
    s: "directo3",
};

document.addEventListener("keydown", (e) => {
    const evento = TECLAS[e.key] || TECLAS[e.key.toLowerCase()];
    if (!evento) return;
    e.preventDefault();                               // evita el scroll de las flechas
    if (e.repeat && (evento === "aceptar" || evento === "volver")) return;
    manejador(evento);
});
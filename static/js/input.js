// Qué hacer cuando llega un botón (cada página lo define a su manera)
let manejador = () => {};

function alEntrada(funcion) {
    manejador = funcion;
}

// El joystick (pregunta al servidor cada 0,1 segundos)
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
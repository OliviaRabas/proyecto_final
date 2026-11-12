// ---- Ajustes ----
// Ruta de respaldo de las banderas (normalmente el servidor ya manda la ruta correcta)
const rutaBandera = (codigo) => `/static/flags/${codigo}.svg`;
const DURACION = 60;        // segundos de la partida
const FEEDBACK_MS = 700;    // cuánto se muestra verde/rojo antes de pasar a la próxima

const continente = document.body.dataset.continente;

// ---- Elementos de la página ----
// Si falta alguno en jugar.html, el juego NO se rompe: se crea solo (o se ignora).
const porId = (id) => document.getElementById(id);

function faltante(id) {
    console.warn("Falta el elemento #" + id + " en jugar.html");
    return document.createElement("span");   // elemento suelto, no se ve en la página
}

function crear(tag, padre, id, texto = "") {
    const el = document.createElement(tag);
    if (id) el.id = id;
    el.textContent = texto;
    padre.appendChild(el);
    return el;
}

const principal = document.querySelector("main") || document.body;

// Imprescindibles (vienen en jugar.html)
const ops = [0, 1, 2, 3].map(i => porId("op" + i) || faltante("op" + i));
const imgBandera = porId("bandera") || faltante("bandera");
const elTiempo = porId("tiempo") || faltante("tiempo");
const elPuntos = porId("puntos") || faltante("puntos");
const pantallaJuego = porId("pantalla-juego") || faltante("pantalla-juego");

// Botón volver (arriba a la izquierda)
let btnVolver = porId("volver");
if (!btnVolver) {
    btnVolver = document.createElement("div");
    btnVolver.id = "volver";
    btnVolver.textContent = "← Volver";
    document.body.insertBefore(btnVolver, document.body.firstChild);
}

// Cartel de error / aviso
let elError = porId("error");
if (!elError) {
    elError = document.createElement("p");
    elError.id = "error";
    elError.hidden = true;
    const header = document.querySelector("header");
    if (header && header.parentNode) header.parentNode.insertBefore(elError, header.nextSibling);
    else document.body.insertBefore(elError, document.body.firstChild);
}

// Pantalla final
let pantallaFinal = porId("pantalla-final");
if (!pantallaFinal) {
    pantallaFinal = crear("section", principal, "pantalla-final");
    pantallaFinal.hidden = true;
}
const tituloFinal = porId("titulo-final") || pantallaFinal.querySelector("h2") || crear("h2", pantallaFinal, "titulo-final");
const detalleFinal = porId("detalle-final") || crear("p", pantallaFinal, "detalle-final");
let puntajeFinal = porId("puntaje-final");
let lineaPuntaje = porId("linea-puntaje");
if (!puntajeFinal) {
    lineaPuntaje = crear("p", pantallaFinal, "linea-puntaje", "Puntaje: ");
    puntajeFinal = crear("b", lineaPuntaje, "puntaje-final", "0");
} else if (!lineaPuntaje) {
    lineaPuntaje = puntajeFinal.parentElement || pantallaFinal;
}
const ayudaFinal = porId("ayuda-final") || crear("p", pantallaFinal, "ayuda-final");

// ---- Estado ----
let tiempo = DURACION, puntos = 0, seleccion = 0, bloqueado = true, terminado = false, reloj = null;
const SEGUNDOS_URGENTE = 10; // desde acá el reloj se pone ámbar y el borde de la pantalla late

// Marca el reloj (y la pantalla) como "urgente" en los últimos segundos
function marcarUrgencia(si) {
    document.body.classList.toggle("urgente", si);
    const caja = elTiempo.parentElement;
    if (caja) caja.classList.toggle("urgente", si);
}

// Reinicia una animación CSS para poder repetirla (bandera nueva, punto, sacudón)
function animar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
}

// Mostrar / ocultar con el atributo "hidden"
function mostrar(el, si) {
    el.hidden = !si;
}

function mostrarError(texto) {
    elError.textContent = texto;
    mostrar(elError, !!texto);
    if (texto) console.error(texto);
}

window.addEventListener("error", (ev) => mostrarError("Error en el juego: " + ev.message));
window.addEventListener("unhandledrejection", (ev) => mostrarError("Error en el juego: " + ev.reason));

function resaltar() {
    ops.forEach((op, i) => op.classList.toggle("seleccionada", i === seleccion));
    btnVolver.classList.toggle("seleccionada", seleccion === -1);
}

function irAContinentes() {
    clearInterval(reloj);
    window.location = "/jugar/facil";
}

// ---- Partida ----
async function iniciar() {
    clearInterval(reloj);
    terminado = false;
    bloqueado = true;
    puntos = 0;
    tiempo = DURACION;
    seleccion = 0;
    elPuntos.textContent = puntos;
    elTiempo.textContent = tiempo;
    marcarUrgencia(false);
    ops.forEach(op => { op.textContent = "..."; op.classList.remove("correcta", "incorrecta"); });
    mostrarError("");
    mostrar(pantallaFinal, false);
    mostrar(pantallaJuego, true);
    resaltar();

    const cargada = await siguientePregunta(true);   // true = ronda nueva (se mezclan las banderas)
    if (!cargada) return;
    reloj = setInterval(tick, 1000);                 // el tiempo arranca cuando aparece la 1ª bandera
}

function tick() {
    tiempo--;
    elTiempo.textContent = tiempo;
    marcarUrgencia(tiempo <= SEGUNDOS_URGENTE);
    if (tiempo <= 0) finalizar("tiempo");
}

// Devuelve true si se cargó una pregunta
async function siguientePregunta(nueva = false) {
    const url = `/api/pregunta/${continente}` + (nueva ? "?nueva=1" : "");
    let r, datos;

    try {
        r = await fetch(url);
    } catch (e) {
        finalizar("error", "No hay conexión con el servidor (" + e.message + ").");
        return false;
    }
    try {
        datos = await r.json();
    } catch (e) {
        finalizar("error", `El servidor respondió ${r.status} en ${url}. Reiniciá Flask con el app.py nuevo.`);
        return false;
    }
    if (terminado) return false;                       // el tiempo se acabó mientras cargaba
    if (!r.ok) {
        finalizar("error", datos.error || `El servidor respondió ${r.status}.`);
        return false;
    }
    if (datos.fin) {                                   // pasaron todas las banderas
        finalizar("banderas");
        return false;
    }

    mostrarError("");
    if (datos.restantes === undefined) {
        mostrarError("Aviso: Flask tiene un app.py viejo, por eso las banderas pueden repetirse. Reinicialo con el nuevo.");
    }
    imgBandera.src = datos.imagen || rutaBandera(datos.bandera);
    animar(imgBandera, "entra");
    datos.opciones.forEach((nombre, i) => {
        ops[i].textContent = nombre;
        ops[i].classList.remove("correcta", "incorrecta");
    });
    bloqueado = false;
    return true;
}

async function responder(i) {
    if (bloqueado || terminado) return;
    bloqueado = true;

    let datos;
    try {
        const r = await fetch("/api/responder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opcion: i })
        });
        datos = await r.json();
    } catch (e) {
        finalizar("error", "No se pudo enviar la respuesta (" + e.message + ").");
        return;
    }
    if (terminado) return;

    ops[i].classList.add(datos.acierto ? "correcta" : "incorrecta");
    if (!datos.acierto) ops[datos.correcta].classList.add("correcta");
    if (datos.acierto) {
        puntos++;
        elPuntos.textContent = puntos;
        animar(elPuntos.parentElement, "pop");
    }

    setTimeout(() => {
        if (!terminado) siguientePregunta();
    }, FEEDBACK_MS);
}

function finalizar(motivo, detalle = "") {
    if (terminado) return;
    terminado = true;
    bloqueado = true;
    clearInterval(reloj);
    marcarUrgencia(false);

    const titulos = {
        tiempo: "¡Se acabó el tiempo!",
        banderas: "¡Pasaron todas las banderas!",
        error: "Ups, hubo un problema con el juego"
    };
    const esError = motivo === "error";
    tituloFinal.textContent = titulos[motivo];
    detalleFinal.textContent = esError ? detalle : "";
    puntajeFinal.textContent = puntos;
    mostrar(lineaPuntaje, !esError);
    ayudaFinal.textContent = esError
        ? "⏎ Enter: reintentar  ·  Esc: volver"
        : "⏎ Enter: jugar de nuevo  ·  Esc: elegir continente";
    if (esError) console.error(detalle);

    mostrarError("");
    mostrar(pantallaJuego, false);
    mostrar(pantallaFinal, true);
    seleccion = 0;
    resaltar();
}

// ---- Teclado ----
alEntrada((evento) => {
    // Pantalla final: Enter = jugar de nuevo / reintentar, Esc = elegir continente
    if (terminado) {
        if (evento === "aceptar") iniciar();
        if (evento === "volver") irAContinentes();
        return;
    }

    if (evento === "volver") return irAContinentes();

    // Atajos Q W / A S (responden directo)
    if (evento.startsWith("directo")) return responder(Number(evento.slice(7)));

    // seleccion: -1 = botón volver, 0..3 = respuestas (grilla 2x2)
    if (seleccion === -1) {
        if (evento === "abajo")   seleccion = 0;
        if (evento === "aceptar") return irAContinentes();
    } else {
        const col = seleccion % 2;
        const fila = Math.floor(seleccion / 2);
        if (evento === "izquierda" && col === 1) seleccion -= 1;
        if (evento === "derecha"   && col === 0) seleccion += 1;
        if (evento === "abajo"     && fila === 0) seleccion += 2;
        if (evento === "arriba")   seleccion = fila === 1 ? seleccion - 2 : -1;
        if (evento === "aceptar")  responder(seleccion);
    }
    resaltar();
});

// Si la imagen no carga, avisamos pero el juego sigue andando
imgBandera.addEventListener("error", () => {
    mostrarError("No se encontró la imagen de la bandera (" + imgBandera.getAttribute("src") + ").");
});

btnVolver.addEventListener("click", irAContinentes);

iniciar(); 
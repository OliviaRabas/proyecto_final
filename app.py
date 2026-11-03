# app.py
import json
import os
import random
import unicodedata

from flask import Flask, jsonify, request, render_template, abort

app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0      # sin caché: siempre se cargan los archivos nuevos
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Carpeta donde está este archivo (así funciona aunque lo ejecutes desde otro lado)
BASE = os.path.dirname(os.path.abspath(__file__))

# Cargar la lista de países una sola vez, al arrancar
with open(os.path.join(BASE, "data", "paises.json"), encoding="utf-8") as f:
    PAISES = json.load(f)

# Buscar solas las imágenes de banderas dentro de la carpeta static
# (sirve cualquier subcarpeta y cualquier formato: png, jpg, svg, webp...)
STATIC = os.path.join(BASE, "static")
EXTENSIONES = (".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif")
IMAGENES = {}
for raiz, _, archivos in os.walk(STATIC):
    for archivo in archivos:
        nombre, ext = os.path.splitext(archivo)
        if ext.lower() in EXTENSIONES:
            ruta = os.path.relpath(os.path.join(raiz, archivo), STATIC).replace(os.sep, "/")
            IMAGENES.setdefault(nombre.lower(), "/static/" + ruta)


def imagen_de(pais):
    """URL de la imagen de la bandera de ese país (o None si no se encontró)."""
    codigo = os.path.splitext(str(pais["codigo"]))[0].lower()
    return IMAGENES.get(codigo) or IMAGENES.get(str(pais["nombre"]).lower())


_sin_imagen = [p["nombre"] for p in PAISES if not imagen_de(p)]
print(f"Banderas encontradas: {len(PAISES) - len(_sin_imagen)} de {len(PAISES)} países")
if _sin_imagen:
    print("SIN imagen:", ", ".join(_sin_imagen[:15]), "..." if len(_sin_imagen) > 15 else "")

CONTINENTES_VALIDOS = ["america", "europa", "asia", "africa", "oceania", "global"]

# Estado de la ronda actual (modo FÁCIL):
#  - correcta: índice (0-3) de la respuesta correcta de la pregunta actual
#  - continente: continente de la ronda
#  - cola: banderas que todavía NO salieron en esta ronda (ya mezcladas)
estado = {"correcta": None, "continente": None, "cola": []}

# Estado de la ronda actual (modo DIFÍCIL):
#  - respuesta: nombre del país correcto de la pregunta actual
estado_dificil = {"respuesta": None, "continente": None, "cola": []}


def paises_de(continente):
    if continente == "global":
        return PAISES
    return [p for p in PAISES if p["continente"] == continente]


def armar_ronda(continente):
    """Mezcla todas las banderas del continente: cada una sale una sola vez."""
    cola = list(paises_de(continente))
    random.shuffle(cola)
    estado["continente"] = continente
    estado["cola"] = cola
    estado["correcta"] = None


def armar_ronda_dificil(continente):
    cola = list(paises_de(continente))
    random.shuffle(cola)
    estado_dificil["continente"] = continente
    estado_dificil["cola"] = cola
    estado_dificil["respuesta"] = None


def _sin_tildes(texto):
    # Para ordenar alfabéticamente sin que las tildes molesten (Étiopía, Índia...)
    return "".join(c for c in unicodedata.normalize("NFD", texto.lower()) if not unicodedata.combining(c))


def _normalizar(texto):
    # Para comparar lo que escribe el usuario: sin tildes, sin mayúsculas, sin espacios de más
    return " ".join(_sin_tildes(str(texto)).split())


# ---------- PÁGINAS ----------

@app.route("/")
def index():
    return render_template("index.html")


# NUEVO: pantalla para elegir la dificultad
@app.route("/jugar")
def elegir_dificultad():
    return render_template("dificultad.html")


# Modo fácil: la pantalla de continentes de siempre (antes estaba en /jugar)
@app.route("/jugar/facil")
def elegir_continente():
    return render_template("continentes.html")


# NUEVO: modo difícil
@app.route("/jugar/dificil")
def elegir_continente_dificil():
    return render_template("continentes_dificil.html")


@app.route("/jugar/dificil/<continente>")
def jugar_dificil(continente):
    if continente not in CONTINENTES_VALIDOS:
        abort(404)
    return render_template("jugar_dificil.html", continente=continente)


@app.route("/jugar/<continente>")
def jugar(continente):
    if continente not in CONTINENTES_VALIDOS:
        abort(404)
    return render_template("jugar.html", continente=continente)


# Orden y nombres de los continentes en la pantalla de estudiar
CONTINENTES_ESTUDIAR = [
    ("america", "🌎", "América"),
    ("europa", "🏰", "Europa"),
    ("asia", "🏯", "Asia"),
    ("africa", "🦁", "África"),
    ("oceania", "🦘", "Oceanía"),
]


@app.route("/estudiar")
def estudiar():
    continentes = []
    for clave, emoji, nombre in CONTINENTES_ESTUDIAR:
        paises = sorted(paises_de(clave), key=lambda p: _sin_tildes(p["nombre"]))
        continentes.append({
            "id": clave,
            "emoji": emoji,
            "nombre": nombre,
            "paises": [
                {"nombre": p["nombre"], "imagen": imagen_de(p) or f"/static/flags/{p['codigo']}.svg"}
                for p in paises
            ],
        })
    return render_template("estudiar.html", continentes=continentes)


@app.route("/reglas")
def reglas():
    return render_template("reglas.html")


# ---------- API MODO FÁCIL (la usa JavaScript) ----------

@app.route("/api/iniciar/<continente>")
def iniciar_ronda(continente):
    # Arranca una ronda nueva: se mezclan todas las banderas del continente
    if continente not in CONTINENTES_VALIDOS:
        abort(404)
    if len(paises_de(continente)) < 4:
        return jsonify({"error": "Faltan países en este continente"}), 400
    armar_ronda(continente)
    return jsonify({"total": len(estado["cola"])})


@app.route("/api/pregunta/<continente>")
def nueva_pregunta(continente):
    if continente not in CONTINENTES_VALIDOS:
        abort(404)

    pool = paises_de(continente)
    if len(pool) < 4:
        return jsonify({"error": "Faltan países en este continente"}), 400

    # Ronda nueva si el juego lo pide (?nueva=1), o si no hay ronda armada / es de otro continente
    if request.args.get("nueva") or estado["continente"] != continente:
        armar_ronda(continente)

    # Ya salieron todas las banderas -> se terminó el juego
    if not estado["cola"]:
        return jsonify({"fin": True})

    # Sacamos la próxima bandera de la cola (así nunca se repite en la ronda)
    pais = estado["cola"].pop()

    # 3 opciones incorrectas al azar + la correcta, todo mezclado
    otros = [p for p in pool if p["codigo"] != pais["codigo"]]
    opciones = random.sample(otros, 3) + [pais]
    random.shuffle(opciones)
    correcta = next(i for i, p in enumerate(opciones) if p["codigo"] == pais["codigo"])
    estado["correcta"] = correcta

    return jsonify({
        "bandera": pais["codigo"],
        "imagen": imagen_de(pais),
        "opciones": [p["nombre"] for p in opciones],
        "restantes": len(estado["cola"]),
    })


@app.route("/api/responder", methods=["POST"])
def responder():
    elegida = request.get_json()["opcion"]
    return jsonify({
        "acierto": elegida == estado["correcta"],
        "correcta": estado["correcta"]
    })


# ---------- API MODO DIFÍCIL (NUEVO) ----------

@app.route("/api/dificil/pregunta/<continente>")
def pregunta_dificil(continente):
    if continente not in CONTINENTES_VALIDOS:
        abort(404)
    if not paises_de(continente):
        return jsonify({"error": "Faltan países en este continente"}), 400

    # Ronda nueva si el juego lo pide (?nueva=1), o si es de otro continente
    if request.args.get("nueva") or estado_dificil["continente"] != continente:
        armar_ronda_dificil(continente)

    if not estado_dificil["cola"]:
        return jsonify({"fin": True})

    pais = estado_dificil["cola"].pop()
    estado_dificil["respuesta"] = pais["nombre"]

    # No se mandan opciones: el usuario tiene que escribir el nombre
    return jsonify({
        "bandera": pais["codigo"],
        "imagen": imagen_de(pais),
        "restantes": len(estado_dificil["cola"]),
    })


@app.route("/api/dificil/responder", methods=["POST"])
def responder_dificil():
    correcta = estado_dificil["respuesta"]
    if correcta is None:
        return jsonify({"error": "No hay una pregunta activa"}), 400
    texto = (request.get_json(silent=True) or {}).get("texto", "")
    return jsonify({
        "acierto": _normalizar(texto) == _normalizar(correcta),
        "correcta": correcta
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False, port=5000)
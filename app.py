# app.py
import json
import os
import random

from flask import Flask, jsonify, request, render_template, abort
import hardware

app = Flask(__name__)
hardware.iniciar()

# Carpeta donde está este archivo (así funciona aunque lo ejecutes desde otro lado)
BASE = os.path.dirname(os.path.abspath(__file__))

# Cargar la lista de países una sola vez, al arrancar
with open(os.path.join(BASE, "data", "paises.json"), encoding="utf-8") as f:
    PAISES = json.load(f)

CONTINENTES_VALIDOS = ["america", "europa", "asia", "africa", "oceania", "global"]

# Acá se guarda cuál es la respuesta correcta de la pregunta actual
estado = {"correcta": None}


# ---------- PÁGINAS ----------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/jugar")
def elegir_continente():
    # Pantalla para elegir entre los 5 continentes y Global
    return render_template("continentes.html")


@app.route("/jugar/<continente>")
def jugar(continente):
    # El juego en sí, con el continente elegido
    if continente not in CONTINENTES_VALIDOS:
        abort(404)
    return render_template("jugar.html", continente=continente)


@app.route("/estudiar")
def estudiar():
    return render_template("estudiar.html")


@app.route("/reglas")
def reglas():
    return render_template("reglas.html")


# ---------- API (la usa JavaScript) ----------

@app.route("/api/input")
def api_input():
    return jsonify({"eventos": hardware.obtener_eventos()})


@app.route("/api/pregunta/<continente>")
def nueva_pregunta(continente):
    # Filtrar los países del continente elegido ("global" = todos)
    if continente == "global":
        pool = PAISES
    else:
        pool = [p for p in PAISES if p["continente"] == continente]

    if len(pool) < 4:
        return jsonify({"error": "Faltan países en este continente"}), 400

    # Elegir 4 al azar, y uno de ellos es el correcto
    opciones = random.sample(pool, 4)
    correcta = random.randint(0, 3)
    estado["correcta"] = correcta

    return jsonify({
        "bandera": opciones[correcta]["codigo"],
        "opciones": [p["nombre"] for p in opciones]
    })


@app.route("/api/responder", methods=["POST"])
def responder():
    elegida = request.get_json()["opcion"]
    return jsonify({
        "acierto": elegida == estado["correcta"],
        "correcta": estado["correcta"]
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False, port=5000)
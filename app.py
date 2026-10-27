# app.py (Código del Servidor)
from flask import Flask, jsonify, request ,render_template 
import hardware
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")
@app.route("/jugar")
def jugar():
    return render_template("jugar.html")
@app.route("/estudiar")
def estudiar():
    return render_template("estudiar.html")
@app.route("/reglas")
def reglas():
    
    return render_template("reglas.html")
pp = Flask(__name__)
hardware.iniciar()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/input')
def api_input():
    return jsonify({"eventos": hardware.obtener_eventos()})


if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=False, port=5000)

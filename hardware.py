# hardware.py
import threading
import time
from queue import Queue, Empty

try:
    import RPi.GPIO as GPIO
    EN_RASPBERRY = True
except ImportError:
    EN_RASPBERRY = False

PINES = {
    17: "arriba_izquierda",
    18: "arriba_derecha",
    27: "abajo_izquierda",
    22: "abajo_derecha",
}

cola = Queue()
_iniciado = False


def _vigilar():
    anterior = {pin: 1 for pin in PINES}      # 1 = suelto
    ultimo_toque = {pin: 0 for pin in PINES}

    while True:
        ahora = time.time()
        for pin, nombre in PINES.items():
            actual = GPIO.input(pin)
            if anterior[pin] == 1 and actual == 0:
                if ahora - ultimo_toque[pin] > 0.2:
                    cola.put(nombre)
                    ultimo_toque[pin] = ahora
            anterior[pin] = actual
        time.sleep(0.02)


def iniciar():
    global _iniciado
    if not EN_RASPBERRY:
        print("ERROR: no se pudo cargar RPi.GPIO, el joystick no va a funcionar")
        return
    if _iniciado:
        return
    _iniciado = True

    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    for pin in PINES:
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    threading.Thread(target=_vigilar, daemon=True).start()
    print("Joystick listo, vigilando los pines:", list(PINES.keys()))


def obtener_eventos():
    eventos = []
    while True:
        try:
            eventos.append(cola.get_nowait())
        except Empty:
            return eventos
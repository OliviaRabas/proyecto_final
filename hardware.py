# hardware.py
from queue import Queue, Empty

# Intenta usar la Raspberry. Si estás en tu PC, no existe y no pasa nada.
try:
    import RPi.GPIO as GPIO
    EN_RASPBERRY = True
except ImportError:
    EN_RASPBERRY = False

# Qué pin corresponde a qué botón (los números son de ejemplo)
PINES = {
    17:  "arriba_izquierda",
    18:  "arriba_derecha",
    27: "abajo_izquierda",
    22: "abajo_derecha",
}

# La "libreta" donde se anotan los botones apretados
cola = Queue()

def _al_presionar(pin):
    # Se ejecuta sola cuando alguien aprieta un botón
    cola.put(PINES[pin])

def iniciar():
    if not EN_RASPBERRY:
        print("No es una Raspberry: se van a usar las teclas del teclado")
        return
    GPIO.setmode(GPIO.BCM)
    for pin in PINES:
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.add_event_detect(pin, GPIO.FALLING,
                              callback=_al_presionar, bouncetime=200)

def obtener_eventos():
    # Entrega todo lo anotado en la libreta y la deja vacía
    eventos = []
    while True:
        try:
            eventos.append(cola.get_nowait())
        except Empty:
            return eventos
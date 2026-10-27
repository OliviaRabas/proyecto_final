# descargar_banderas.py
import json
import os
import urllib.request

# Carpeta donde se van a guardar las banderas
CARPETA = os.path.join("static", "flags")
os.makedirs(CARPETA, exist_ok=True)

# Leer la lista de países
with open(os.path.join("data", "paises.json"), encoding="utf-8") as f:
    paises = json.load(f)

fallaron = []

for i, p in enumerate(paises, start=1):
    codigo = p["codigo"]
    destino = os.path.join(CARPETA, codigo + ".svg")

    # Si la bandera ya está, no la baja de nuevo
    if os.path.exists(destino):
        continue

    url = "https://flagcdn.com/" + codigo + ".svg"
    try:
        pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(pedido, timeout=15) as r:
            contenido = r.read()
        with open(destino, "wb") as f:
            f.write(contenido)
        print(f"[{i}/{len(paises)}] OK  {p['nombre']} ({codigo}.svg)")
    except Exception as e:
        print(f"[{i}/{len(paises)}] ERROR  {p['nombre']} ({codigo}): {e}")
        fallaron.append(p["nombre"])

print()
if fallaron:
    print("No se pudieron bajar:", ", ".join(fallaron))
    print("Volvé a ejecutar el script para reintentar solo esas.")
else:
    print("¡Listo! Todas las banderas están en", CARPETA)
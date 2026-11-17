<div align="center">

# 🚩 Guess the Flag

### Aprendé geografía jugando, casi sin darte cuenta

Descubrí las banderas, los países y la población de los 5 continentes
con juegos rápidos, un modo estudio y un desafío para expertos.

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-000000?logo=flask&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

![Preview](./docs/capturas/inicio.png)

</div>

---

## 📌 Sobre el proyecto

**Guess the Flag** es un juego web para aprender las banderas del mundo.
Incluye los 10 países más conocidos de cada continente (50 en total), con su bandera y su cantidad de habitantes.

Nació como un simple "adiviná la bandera" y fue creciendo hasta tener varios modos de juego, un modo estudio y una interfaz pensada para jugar tanto con **teclado en la PC** como con **el dedo en el celular**.

## ✨ Características

- 🎮 **4 formas de jugar o estudiar:** Adivinar banderas (fácil y difícil), Higher or Lower y Estudiar.
- 🌍 **5 continentes + modo Global**, con 50 países.
- ⌨️ **Se maneja entero con el teclado** (flechas, Enter y Esc), y también con mouse o touch.
- 📱 **Diseño responsive:** se adapta a celulares y tablets.
- 🏳️ **Sin repetir:** las banderas salen en orden aleatorio y no se repiten dentro de una partida.
- 🎨 **Estética de mapa antiguo**, con una versión clara (fácil) y una oscura (difícil).

## 🕹️ Modos de juego

| Modo | Cómo se juega |
|---|---|
| 🙂 **Adivinar banderas: Fácil** | Ves una bandera y elegís entre 4 opciones. |
| 🔥 **Adivinar banderas: Difícil** | Ves una bandera y escribís el nombre del país, contra reloj (40 s por continente, 100 s en Global). |
| 📈 **Higher or Lower** | Dos banderas: ¿el país de la derecha tiene **más** o **menos** habitantes que el de la izquierda? Cada acierto suma un punto. |
| 📖 **Estudiar** | Todas las banderas por continente. Tocá una tarjeta para ver sus habitantes, o **ordená los 50 países por población**. |

## ⌨️ Controles

| Tecla | Acción |
|---|---|
| ▲ ▼ ◀ ▶ | Moverse por los menús y elegir opciones |
| Enter | Aceptar |
| Esc | Volver |
| Q W A S | Elegir respuesta en el modo fácil (solo PC) |

## 📸 Capturas de pantalla

| Menú principal | Modo fácil | Modo difícil |
|:---:|:---:|:---:|
| ![Menú](./docs/capturas/inicio.png) | ![Fácil](./docs/capturas/facil.png) | ![Difícil](./docs/capturas/dificil.png) |

| Higher or Lower | Estudiar | En el celular |
|:---:|:---:|:---:|
| ![HL](./docs/capturas/higher-lower.png) | ![Estudiar](./docs/capturas/estudiar.png) | ![Celu](./docs/capturas/celu.png) |

## 🛠️ Tecnologías

- **Backend:** Python 3 y Flask (con plantillas Jinja2).
- **Frontend:** HTML5, CSS3 y JavaScript puro, sin frameworks.
- **Datos:** archivo `paises.json` (nombre, continente, código y población).
- **Banderas:** SVG descargados de [flagcdn.com](https://flagcdn.com).

## 🚀 Instalación

### Requisitos previos

- Python 3.8 o superior
- Git

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd guess-the-flag
```

### 2. Instalar Flask

```bash
pip install flask
```

### 3. Descargar las banderas

```bash
python descargar_banderas.py
```

Las guarda en `static/flags/`. Si alguna falla, volvé a ejecutarlo y reintenta solo esas.

### 4. Ejecutar el proyecto

```bash
python app.py
```

Abrí el navegador en **http://localhost:5000**

## 📂 Estructura del proyecto

```text
guess-the-flag/
├── app.py                    # Servidor Flask: rutas y lógica del juego
├── descargar_banderas.py     # Descarga las banderas SVG
├── data/
│   └── paises.json           # Países, continentes y población
├── templates/                # Páginas HTML (Jinja2)
│   ├── index.html
│   ├── modo.html
│   ├── dificultad.html
│   ├── continentes.html
│   ├── continentes_dificil.html
│   ├── jugar.html
│   ├── jugar_dificil.html
│   ├── higher_lower.html
│   ├── estudiar.html
│   └── reglas.html
├── static/
│   ├── css/                  # Un archivo de estilos por pantalla
│   ├── js/                   # Lógica de cada pantalla + input.js (teclado)
│   └── flags/                # Banderas SVG
├── docs/
│   └── capturas/             # Imágenes para este README
└── README.md
```

## 🧗 Cómo fue evolucionando el proyecto

> Este proyecto no nació completo: fue creciendo de a una idea por vez.
> Acá está el recorrido, de principio a fin.

<details>
<summary><b>🧱 dia 1:plantemos el proyecto y su organizacion  </b> 

&nbsp;

- Armé el menú de inicio con tres opciones: **Estudiar**, **Jugar** y **Reglas**.
- Definí la lista de 50 países en `paises.json` (10 por continente).
- Creé `descargar_banderas.py` para bajar las banderas automáticamente.
- Fijé el estilo visual: pergamino sobre madera, como un mapa antiguo.

👉 *Captura: `docs/capturas/inicio.png`*

</details>

<details>
<summary><b>🙂 Etapa 2: Modo fácil</b> 👉 (fecha)</summary>

&nbsp;

- Pantalla de elegir continente y pantalla de juego con 4 opciones.
- El servidor mezcla las banderas y las saca de una cola, así **no se repiten** en una partida.
- Respuestas con teclas Q, W, A, S, además del mouse.

</details>

<details>
<summary><b>🔥 Etapa 3: Modo difícil</b> 👉 (fecha)</summary>

&nbsp;

- Nueva pantalla de **dificultad** antes de elegir continente.
- En difícil no hay opciones: hay que **escribir** el nombre del país.
- Se comparan las respuestas sin tildes ni mayúsculas, para no castigar errores de formato.
- Agregué un reloj (40 s por continente, 100 s en Global).
- Diseño propio, oscuro y rojizo, con efecto de luz de vela.

</details>

<details>
<summary><b>🧭 Etapa 4: Navegación con teclado en toda la app</b> 👉 (fecha)</summary>

&nbsp;

- **Problema:** en la pantalla de continentes solo se podía ir "uno al lado del otro".
- **Solución:** moví la selección en 2D (▲ ▼ por columna, ◀ ▶ por fila). Lee la cantidad de columnas del CSS, así no hay que tocar el JS si la grilla cambia.

</details>

<details>
<summary><b>📈 Etapa 5: Nuevo modo, Higher or Lower</b> 👉 (fecha)</summary>

&nbsp;

- Agregué la pantalla **Modo de juego** entre "Jugar" y la dificultad.
- Sumé la **población** de cada país a los datos.
- Mecánica: dos banderas, y hay que decidir si el de la derecha tiene más o menos habitantes. Cada acierto suma un punto.
- **Bugs que resolví en el camino:**
  - La ruta `/modo` daba 404 porque el servidor seguía corriendo con el código viejo.
  - Los datos no llegaban al JavaScript: se solucionó pasándolos como JSON desde Flask con `|tojson`.
  - Las banderas no cargaban: ahora usa la imagen local y, si falta, la de flagcdn.
  - Las teclas no respondían: se escuchan directamente desde el navegador, además de `input.js`.
  - Las tarjetas se superponían: se rehízo el layout para que nada se achique ni se pise.

</details>

<details>
<summary><b>📖 Etapa 6: Estudiar con población</b> 👉 (fecha)</summary>

&nbsp;

- Al **tocar una tarjeta** aparecen los habitantes, sin que desaparezca la bandera.
- Nueva opción **"Ordenar por habitantes"**: muestra los 50 países de más a menos poblado, con su puesto.
- Esa opción también se elige con ◀ ▶ y Enter, para que todo se maneje con teclado.

</details>

<details>
<summary><b>📱 Etapa 7: Adaptación a celulares</b> 👉 (fecha)</summary>

&nbsp;

- **Problema:** en el celular la bandera se veía descentrada y caída, y los botones amontonados.
- **Causa:** al ocultar el footer, el contenido se iba al fondo de la pantalla.
- **Solución:**
  - El contenido se apila desde arriba y el pergamino se puede scrollear.
  - Las respuestas pasan a una columna.
  - Se separó el botón "Volver" del título.
  - Se ocultan las letras de teclado en pantallas táctiles.
- Todo dentro de `@media`, así la versión de PC no cambió.

👉 *Captura: `docs/capturas/celu.png`*

</details>

## 🗺️ Roadmap

- [x] Menú principal, modo fácil y modo difícil
- [x] Higher or Lower
- [x] Modo Estudiar con población y ranking
- [x] Diseño responsive para celulares
- [ ] Más países por continente
- [ ] Guardar el récord de forma permanente
- [ ] Modo multijugador
- [ ] Traducción a otros idiomas

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si encontrás un error o tenés una idea,
abrí un **Issue** o mandá un **Pull Request**.

## 👨‍💻 Autor

Desarrollado por **TU NOMBRE**.

- GitHub: [@tuusuario](https://github.com/tuusuario)
- LinkedIn: [Tu perfil](https://linkedin.com/in/tuperfil)

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

<div align="center">

**Hecho con ❤️ y muchas banderas** 🚩

</div>

# Taller DOM + API con Node.js y Express

Actividad del tercer corte de **Desarrollo de Aplicaciones Web I**. En un mismo repositorio están:

1. **To Do List** y **Contact List**, hechas con HTML, CSS y JavaScript puro (manipulación del DOM).
2. Una **API REST con Node.js y Express** que usa los métodos **GET, POST, PUT y DELETE** para las tareas y los contactos.
3. La **integración** entre las dos: las páginas usan `fetch` para hablar con la API.

**Autor:** Juan David Tello Yesquén — API con Express, To Do List y Contact List conectadas a la API

## Estructura

```
practica-dom/
├── index.html              → página de inicio con enlaces a las dos apps
├── todo-list/
│   ├── index.html
│   ├── css/styles.css
│   └── js/script.js        → DOM + fetch a /api/tareas
├── contact-list/
│   ├── index.html
│   ├── css/styles.css
│   └── js/script.js        → DOM + fetch a /api/contactos
└── api/
    ├── package.json
    └── src/server.js       → servidor Express (rutas de la API)
```

## Cómo ejecutar la API

Requisito: tener **Node.js** instalado (`node -v`).

```bash
cd api
npm install      # instala Express (solo la primera vez)
npm run dev      # inicia con nodemon (se reinicia al guardar cambios)
# o también:
npm start
```

Con el servidor encendido se abre en el navegador:

- http://localhost:3000/ → página de inicio
- http://localhost:3000/todo-list/ → To Do List conectada a la API
- http://localhost:3000/contact-list/ → Contact List conectada a la API
- http://localhost:3000/api/tareas → ver las tareas en JSON

## Endpoints de la API

### Tareas — `{ id, titulo, completada }`

| Método | Ruta | Qué hace | Respuesta |
| --- | --- | --- | --- |
| GET | `/api/tareas` | Lista todas las tareas | 200 |
| GET | `/api/tareas/:id` | Una tarea por id | 200 / 404 |
| POST | `/api/tareas` | Crea una tarea (`titulo` obligatorio) | 201 / 400 |
| PUT | `/api/tareas/:id` | Actualiza `titulo` y/o `completada` | 200 / 404 |
| DELETE | `/api/tareas/:id` | Elimina una tarea | 204 / 404 |

### Contactos — `{ id, nombre, apellido, telefono, ciudad, direccion, genero }`

| Método | Ruta | Qué hace | Respuesta |
| --- | --- | --- | --- |
| GET | `/api/contactos` | Lista todos los contactos | 200 |
| GET | `/api/contactos/:id` | Un contacto por id | 200 / 404 |
| POST | `/api/contactos` | Crea un contacto (todos los campos obligatorios) | 201 / 400 |
| PUT | `/api/contactos/:id` | Reemplaza los datos del contacto | 200 / 400 / 404 |
| DELETE | `/api/contactos/:id` | Elimina un contacto | 204 / 404 |

### Probar con HTTPie / Postman

```bash
http GET :3000/api/tareas
http POST :3000/api/tareas titulo="Estudiar Express"
http PUT :3000/api/tareas/1 completada:=true
http DELETE :3000/api/tareas/1

http POST :3000/api/contactos nombre=Ana apellido=Ruiz telefono=3001234567 ciudad=Cali direccion="Cra 1 #2-3" genero=Female
```

> Los datos se guardan **en memoria** (en un arreglo). Si se apaga el servidor, vuelven los datos iniciales.

## Cómo se conectan las páginas con la API

Cada página tiene una función `peticion()` que usa `fetch` con `async/await`:

```js
async function peticion(metodo, url, datos) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } }
  if (datos) opciones.body = JSON.stringify(datos)

  const respuesta = await fetch(url, opciones)
  if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`)
  return respuesta.status === 204 ? null : respuesta.json()
}
```

```
 Navegador (DOM)                     Servidor (Express)
 ───────────────                     ──────────────────
 clic en "Agregar"  ── POST /api/tareas ──►  tareas.push(nueva)
 pinta la tarea     ◄── 201 + JSON ───────   res.status(201).json(nueva)
```

**Modo sin conexión:** si la API está apagada (por ejemplo en GitHub Pages), el `fetch` falla, el `catch` lo detecta y la página sigue funcionando con `localStorage`. Arriba aparece un aviso:

- 🟢 *Conectado a la API (Node.js + Express)*
- 🟡 *API apagada: guardando en el navegador (localStorage)*

## Conceptos aplicados

| Concepto | Dónde se usa |
| --- | --- |
| `getElementById`, `querySelector` | Capturar el formulario, la lista y la tabla |
| `createElement`, `appendChild`, `textContent` | Crear cada tarea y cada fila de la tabla de forma segura |
| `addEventListener` + `preventDefault` | Formularios sin recargar la página |
| Delegación de eventos | Un solo listener en la lista/tabla maneja todos los botones |
| `fetch` + `async/await` + `try/catch` | Llamar a la API y manejar errores |
| `JSON.stringify` / `JSON.parse` | Enviar datos a la API y guardar en `localStorage` |
| `express.json()` | Leer el cuerpo (`req.body`) de POST y PUT |
| `req.params.id` | Saber qué tarea o contacto editar o eliminar |
| Códigos de estado (200, 201, 204, 400, 404) | Responder correctamente según el resultado |
| CORS | Permitir que una página en otro origen llame a la API |

## Aprendizajes

- **Qué es una API REST:** el frontend no guarda los datos, se los pide a un servidor. Cada acción del CRUD corresponde a un método HTTP: crear = POST, leer = GET, actualizar = PUT, eliminar = DELETE.
- **Express** permite crear un servidor con pocas líneas: `app.get()`, `app.post()`, `app.put()`, `app.delete()` y `app.listen()`.
- **`express.json()`** es necesario; sin él `req.body` llega como `undefined`.
- **Los parámetros de la URL** (`/api/tareas/:id`) llegan como texto, por eso hay que convertirlos con `Number()` antes de compararlos con el id.
- **Los códigos de estado importan:** 201 cuando se crea algo, 204 cuando se elimina (sin cuerpo), 400 si faltan datos y 404 si no existe.
- **CORS:** al abrir la página desde otro origen (por ejemplo Live Server en el puerto 5500), el navegador bloquea la petición si el servidor no envía el encabezado `Access-Control-Allow-Origin`.
- **`fetch` es asíncrono:** hay que usar `await` y envolverlo en `try/catch`, porque si el servidor está apagado la promesa falla.
- **Datos en memoria vs. persistencia:** los arreglos del servidor se reinician al apagarlo; para guardarlos de verdad haría falta una base de datos.
- Se corrigió un detalle del ejemplo de clase: el contador de pendientes ahora se calcula como `total − completadas`.

## Uso de IA

Usé **Claude (Anthropic)** como asistente durante el taller:

- **Para qué se usó:** explicar paso a paso cómo funcionan Express, `fetch` y los métodos HTTP; proponer la estructura de carpetas; ayudar a escribir y revisar el código del servidor y de la integración; detectar errores (por ejemplo, el contador de pendientes y el manejo de CORS) y redactar este README.
- **Qué hice yo:** seguir el README del docente, ejecutar el servidor, probar cada endpoint con HTTPie/navegador, probar las páginas con la API encendida y apagada, y revisar que el código fuera entendible y que pudiera explicarlo.
- **Lo que aprendí de usarla:** la IA ayuda a avanzar rápido, pero hay que verificar lo que propone ejecutándolo; varias respuestas se ajustaron después de probarlas. La usé como apoyo para entender, no como reemplazo del aprendizaje.

## Flujo de trabajo con Git

Cada parte se trabajó en su propia rama y se unió a `main` con un **pull request**:

```
main
├── feature/todo-list     → To Do List
├── feature/contact-list  → Contact List
└── feature/api           → API con Express + integración con fetch
```

## GitHub Pages

Las páginas están publicadas en GitHub Pages. Allí funcionan en **modo localStorage**, porque GitHub Pages solo sirve archivos estáticos y no puede ejecutar el servidor de Node.js. Para usar la API hay que clonar el repositorio y ejecutar `npm run dev` en la carpeta `api`.

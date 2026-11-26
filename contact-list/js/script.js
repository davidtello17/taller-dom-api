// ===== Configuración =====
// Dirección de la API (servidor Express corriendo en el computador)
const API_URL = 'http://localhost:3000/api/contactos'
// Respaldo: si la API no está encendida, se guarda en el navegador
const STORAGE_KEY = 'contactos'

// ===== Elementos del DOM =====
const form = document.getElementById('contact-form')
const submitButton = document.getElementById('submit-button')
const cancelButton = document.getElementById('cancel-button')
const tableBody = document.getElementById('contacts-body')
const emptyMessage = document.getElementById('contacts-empty')
const contactsCount = document.getElementById('contacts-count')
const statusMessage = document.getElementById('api-status')

// Relación entre el id del campo en el HTML y la propiedad del contacto
const campos = {
  name: 'nombre',
  lastname: 'apellido',
  phone: 'telefono',
  city: 'ciudad',
  address: 'direccion'
}

// Arreglo de contactos: { id, nombre, apellido, telefono, ciudad, direccion, genero }
let contactos = []
// true = usamos la API | false = usamos localStorage
let usarApi = false
// null = el formulario CREA | un id = el formulario EDITA ese contacto
let idEditando = null

// ===== Peticiones a la API con fetch =====
async function peticion(metodo, url, datos) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } }
  if (datos) opciones.body = JSON.stringify(datos)

  const respuesta = await fetch(url, opciones)
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}))
    throw new Error(error.error || `Error ${respuesta.status}`)
  }
  // DELETE responde 204 (sin contenido)
  return respuesta.status === 204 ? null : respuesta.json()
}

// ===== localStorage (modo sin conexión) =====
function leerLocal() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    return []
  }
}

function guardarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contactos))
}

function mostrarEstado(mensaje, tipo) {
  statusMessage.textContent = mensaje
  statusMessage.className = `contacts__status contacts__status--${tipo}`
}

// ===== Leer y llenar el formulario =====
function leerFormulario() {
  const datos = {}
  Object.entries(campos).forEach(([idCampo, propiedad]) => {
    datos[propiedad] = document.getElementById(idCampo).value.trim()
  })
  const genero = form.querySelector('input[name="gender"]:checked')
  datos.genero = genero ? genero.value : ''
  return datos
}

function llenarFormulario(contacto) {
  Object.entries(campos).forEach(([idCampo, propiedad]) => {
    document.getElementById(idCampo).value = contacto[propiedad]
  })
  const genero = form.querySelector(`input[name="gender"][value="${contacto.genero}"]`)
  if (genero) genero.checked = true
}

// ===== CRUD: crear, leer, actualizar y eliminar =====
async function cargarContactos() {
  try {
    contactos = await peticion('GET', API_URL)
    usarApi = true
    mostrarEstado('Conectado a la API (Node.js + Express)', 'online')
  } catch (error) {
    contactos = leerLocal()
    usarApi = false
    mostrarEstado('API apagada: guardando en el navegador (localStorage)', 'offline')
  }
  renderContactos()
}

async function crearContacto(datos) {
  if (usarApi) {
    const nuevo = await peticion('POST', API_URL, datos)
    contactos.push(nuevo)
  } else {
    contactos.push({ id: Date.now(), ...datos })
    guardarLocal()
  }
  renderContactos()
}

async function actualizarContacto(id, datos) {
  if (usarApi) {
    const actualizado = await peticion('PUT', `${API_URL}/${id}`, datos)
    contactos = contactos.map((c) => (c.id === id ? actualizado : c))
  } else {
    contactos = contactos.map((c) => (c.id === id ? { id, ...datos } : c))
    guardarLocal()
  }
  renderContactos()
}

async function eliminarContacto(id) {
  if (usarApi) {
    await peticion('DELETE', `${API_URL}/${id}`)
  }
  contactos = contactos.filter((c) => c.id !== id)
  if (!usarApi) guardarLocal()
  renderContactos()
}

// Si la API falla en medio de una acción, se avisa sin romper la página
async function ejecutar(accion) {
  try {
    await accion()
    return true
  } catch (error) {
    mostrarEstado(`No se pudo completar la acción: ${error.message}`, 'error')
    return false
  }
}

// ===== Modo edición =====
function empezarEdicion(id) {
  const contacto = contactos.find((c) => c.id === id)
  llenarFormulario(contacto)
  idEditando = id
  submitButton.textContent = 'UPDATE'
  cancelButton.hidden = false
  form.scrollIntoView({ behavior: 'smooth' })
  document.getElementById('name').focus()
}

function terminarEdicion() {
  idEditando = null
  form.reset()
  submitButton.textContent = 'ADD'
  cancelButton.hidden = true
}

// ===== Pintar la tabla =====
function crearCelda(texto) {
  const td = document.createElement('td')
  td.textContent = texto
  return td
}

function crearFila(contacto) {
  const tr = document.createElement('tr')
  tr.dataset.id = contacto.id

  tr.append(
    crearCelda(`${contacto.nombre} ${contacto.apellido}`),
    crearCelda(contacto.telefono),
    crearCelda(contacto.ciudad),
    crearCelda(contacto.direccion),
    crearCelda(contacto.genero)
  )

  const acciones = document.createElement('td')
  acciones.innerHTML = `
    <button class="contacts__row-button contacts__row-button--edit" data-action="edit" aria-label="Editar contacto">
      <i class="fa-solid fa-pen"></i>
    </button>
    <button class="contacts__row-button contacts__row-button--delete" data-action="delete" aria-label="Eliminar contacto">
      <i class="fa-regular fa-trash-can"></i>
    </button>
  `
  tr.appendChild(acciones)
  return tr
}

function renderContactos() {
  tableBody.innerHTML = ''
  contactos.forEach((contacto) => tableBody.appendChild(crearFila(contacto)))
  contactsCount.textContent = contactos.length
  emptyMessage.hidden = contactos.length > 0
}

// ===== Eventos =====
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const datos = leerFormulario()

  const salioBien = idEditando === null
    ? await ejecutar(() => crearContacto(datos))
    : await ejecutar(() => actualizarContacto(idEditando, datos))

  if (salioBien) terminarEdicion()
})

cancelButton.addEventListener('click', terminarEdicion)

// Delegación de eventos: un solo listener en la tabla para todos los botones
tableBody.addEventListener('click', (event) => {
  const boton = event.target.closest('button')
  if (!boton) return

  const id = Number(boton.closest('tr').dataset.id)

  if (boton.dataset.action === 'edit') {
    empezarEdicion(id)
  }

  if (boton.dataset.action === 'delete') {
    const contacto = contactos.find((c) => c.id === id)
    if (confirm(`¿Eliminar a ${contacto.nombre} ${contacto.apellido}?`)) {
      ejecutar(() => eliminarContacto(id))
      if (idEditando === id) terminarEdicion()
    }
  }
})

cargarContactos()

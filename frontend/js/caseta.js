let idPrestamoActual = null; // Almacena el ID del préstamo que se va a devolver
const API_URL = "https://sistema-proyectores-itsz.onrender.com";

// ==========================================
// CONTROL DE CARGA INICIAL Y NAVEGACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Validar inicio de sesión mediante almacenamiento local
    const idUsuario = localStorage.getItem("id_usuario");
    if (!idUsuario) {
        alert("Debes iniciar sesión primero.");
        window.location.href = "index.html";
        return;
    }

    // 2. Cargar registros activos en la interfaz de usuario
    cargarPrestamosActivos();

    // 3. Manejo de cierre de sesión seguro
    document.getElementById("btn-salir").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
});

// Consulta asíncrona para renderizar la tabla principal
async function cargarPrestamosActivos() {
    const tbody = document.querySelector("#tabla-activos tbody");
    tbody.innerHTML = "<tr><td colspan='5'>Cargando datos...</td></tr>";

    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos/activos`);
        if (respuesta.ok) {
            const prestamos = await respuesta.json();
            tbody.innerHTML = ""; 

            if (prestamos.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5'>No hay proyectores prestados en este momento.</td></tr>";
                return;
            }

            prestamos.forEach(prestamo => {
                const fila = `
                    <tr>
                        <td>#${prestamo.id_prestamo}</td>
                        <td>${prestamo.hora_salida}</td>
                        <td>${prestamo.docente.nombre_completo}</td>
                        <td>${prestamo.proyector.descripcion} (ID: ${prestamo.proyector.id_proyector})</td>
                        <td>
                            <button style="background:#ffc107; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:4px;" 
                                    onclick="recibirProyector(${prestamo.id_prestamo})">
                                Recibir
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        }
    } catch (error) {
        console.error("Error al cargar la tabla:", error);
        tbody.innerHTML = "<tr><td colspan='5' style='color:red;'>Error de conexión con el servidor.</td></tr>";
    }
}

// Disparador del flujo de devolución
function recibirProyector(id) {
    idPrestamoActual = id;
    document.getElementById("span-id-prestamo-dev").innerText = id;
    document.getElementById("modal-devolucion").style.display = "block";
    redimensionarCanvasDev(); 
}

// ==========================================
// CONTROL DE COMPORTAMIENTO DE MODALES
// ==========================================
const modalPrestamo = document.getElementById("modal-prestamo");
const modalFirma = document.getElementById("modal-firma");
const modalDevolucion = document.getElementById("modal-devolucion");

document.getElementById("btn-nuevo-prestamo").addEventListener("click", async () => {
    await cargarSelects(); 
    modalPrestamo.style.display = "block";
});

document.getElementById("cerrar-modal-prestamo").onclick = () => modalPrestamo.style.display = "none";
document.getElementById("cerrar-modal-firma").onclick = () => modalFirma.style.display = "none";
document.getElementById("cerrar-modal-devolucion").onclick = () => modalDevolucion.style.display = "none";

document.getElementById("btn-siguiente-firma").addEventListener("click", () => {
    if (!document.getElementById("select-docente").value || !document.getElementById("select-proyector").value) {
        alert("Por favor selecciona un docente y un proyector.");
        return;
    }
    modalPrestamo.style.display = "none";
    modalFirma.style.display = "block";
    redimensionarCanvas(); 
});

async function cargarSelects() {
    const selectDocente = document.getElementById("select-docente");
    const selectProyector = document.getElementById("select-proyector");
    
    selectDocente.innerHTML = '<option value="">Seleccione un docente...</option>';
    selectProyector.innerHTML = '<option value="">Seleccione proyector...</option>';

    try {
        const resDocentes = await fetch(`${API_URL}/api/docentes`);
        const docentes = await resDocentes.json();
        docentes.forEach(d => {
            selectDocente.innerHTML += `<option value="${d.id_docente}">${d.nombre_completo}</option>`;
        });

        const resProyectores = await fetch(`${API_URL}/api/proyectores/disponibles`);
        const proyectores = await resProyectores.json();
        proyectores.forEach(p => {
            selectProyector.innerHTML += `<option value="${p.id_proyector}">${p.descripcion} (ID: ${p.id_proyector})</option>`;
        });
    } catch (error) {
        console.error("Error al cargar catálogos:", error);
    }
}


// ==========================================
// LIENZO DIGITAL 1: FIRMA DE SALIDA
// ==========================================
const canvas = document.getElementById('lienzo-firma');
const ctx = canvas.getContext('2d');
let dibujando = false;

ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.strokeStyle = '#000';

function redimensionarCanvas() {
    // Retraso de 50ms para que el modal se renderice antes de tomar medidas
    setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 200;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    }, 50);
}

// Función universal para mouse o celular
function obtenerPosicion(e, elemento) {
    const rect = elemento.getBoundingClientRect();
    const clienteX = e.touches ? e.touches[0].clientX : e.clientX;
    const clienteY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clienteX - rect.left, y: clienteY - rect.top };
}

// Eventos para Computadora
canvas.addEventListener('mousedown', (e) => { dibujando = true; ctx.beginPath(); const pos = obtenerPosicion(e, canvas); ctx.moveTo(pos.x, pos.y); });
canvas.addEventListener('mouseup', () => { dibujando = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', (e) => { if (!dibujando) return; const pos = obtenerPosicion(e, canvas); ctx.lineTo(pos.x, pos.y); ctx.stroke(); });

// Eventos para Celular
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); dibujando = true; ctx.beginPath(); const pos = obtenerPosicion(e, canvas); ctx.moveTo(pos.x, pos.y); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); dibujando = false; ctx.beginPath(); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!dibujando) return; const pos = obtenerPosicion(e, canvas); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, { passive: false });

document.getElementById('btn-limpiar-firma').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


// ==========================================
// LIENZO DIGITAL 2: FIRMA DE DEVOLUCIÓN
// ==========================================
const canvasDev = document.getElementById('lienzo-firma-dev');
const ctxDev = canvasDev.getContext('2d');
let dibujandoDev = false;

ctxDev.lineWidth = 3;
ctxDev.lineCap = 'round';
ctxDev.strokeStyle = '#000';

function redimensionarCanvasDev() {
    setTimeout(() => {
        const rect = canvasDev.getBoundingClientRect();
        canvasDev.width = rect.width || 400;
        canvasDev.height = rect.height || 200;
        ctxDev.lineWidth = 3;
        ctxDev.lineCap = 'round';
        ctxDev.strokeStyle = '#000';
    }, 50);
}

// Eventos para Computadora
canvasDev.addEventListener('mousedown', (e) => { dibujandoDev = true; ctxDev.beginPath(); const pos = obtenerPosicion(e, canvasDev); ctxDev.moveTo(pos.x, pos.y); });
canvasDev.addEventListener('mouseup', () => { dibujandoDev = false; ctxDev.beginPath(); });
canvasDev.addEventListener('mousemove', (e) => { if (!dibujandoDev) return; const pos = obtenerPosicion(e, canvasDev); ctxDev.lineTo(pos.x, pos.y); ctxDev.stroke(); });

// Eventos para Celular
canvasDev.addEventListener('touchstart', (e) => { e.preventDefault(); dibujandoDev = true; ctxDev.beginPath(); const pos = obtenerPosicion(e, canvasDev); ctxDev.moveTo(pos.x, pos.y); }, { passive: false });
canvasDev.addEventListener('touchend', (e) => { e.preventDefault(); dibujandoDev = false; ctxDev.beginPath(); }, { passive: false });
canvasDev.addEventListener('touchmove', (e) => { e.preventDefault(); if (!dibujandoDev) return; const pos = obtenerPosicion(e, canvasDev); ctxDev.lineTo(pos.x, pos.y); ctxDev.stroke(); }, { passive: false });

document.getElementById('btn-limpiar-firma-dev').addEventListener('click', () => {
    ctxDev.clearRect(0, 0, canvasDev.width, canvasDev.height);
});


// ==========================================
// COMUNICACIÓN ASÍNCRONA HTTP (POST / PUT)
// ==========================================

// Registrar nuevo préstamo (POST)
document.getElementById('btn-guardar-prestamo').addEventListener('click', async (e) => {
    e.preventDefault(); // Previene que la página se recargue si está dentro de un form

    const firmaBase64 = canvas.toDataURL("image/png");
    
    // Bajamos el límite a 1500 caracteres para aceptar firmas pequeñas o un simple punto
    if (firmaBase64.length < 1500) { 
        alert("El docente debe firmar en el recuadro.");
        return;
    }

    const cargaUtil = {
        id_docente: parseInt(document.getElementById("select-docente").value),
        id_proyector: document.getElementById("select-proyector").value,
        incluye_cable: document.getElementById("check-cable").checked,
        observaciones: document.getElementById("observaciones").value,
        firma_salida: firmaBase64,
        registrado_por: parseInt(localStorage.getItem("id_usuario"))
    };

    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cargaUtil)
        });

        if (respuesta.ok) {
            alert("¡Préstamo registrado con éxito!");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById("observaciones").value = "";
            document.getElementById("check-cable").checked = false;
            modalFirma.style.display = "none";
            cargarPrestamosActivos(); 
        } else {
            const err = await respuesta.json();
            alert("Error del servidor: " + err.detail);
        }
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error de conexión al registrar la salida.");
    }
});

// Confirmar devolución de equipo (PUT)
document.getElementById('btn-confirmar-devolucion').addEventListener('click', async (e) => {
    e.preventDefault();

    const firmaBase64 = canvasDev.toDataURL("image/png");

    if (firmaBase64.length < 1500) {
        alert("El docente debe firmar la entrega del proyector.");
        return;
    }

    const cargaUtil = {
        firma_entrega: firmaBase64,
        observaciones: document.getElementById("observaciones-dev").value
    };

    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos/${idPrestamoActual}/devolucion`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cargaUtil)
        });

        if (respuesta.ok) {
            alert("¡Proyector devuelto y liberado con éxito en el inventario!");
            ctxDev.clearRect(0, 0, canvasDev.width, canvasDev.height);
            document.getElementById("observaciones-dev").value = "";
            modalDevolucion.style.display = "none";
            cargarPrestamosActivos(); 
        } else {
            const err = await respuesta.json();
            alert("Error del servidor: " + err.detail);
        }
    } catch (error) {
        console.error("Error al devolver:", error);
        alert("Error de conexión al registrar la devolución.");
    }
});
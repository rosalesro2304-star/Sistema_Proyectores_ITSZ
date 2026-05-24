let idPrestamoActual = null;
let idAEditar = null; // NUEVA VARIABLE GLOBAL PARA EDICIÓN
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

    // 2. Lógica del Widget de Perfil
    const username = localStorage.getItem("username") || "Usuario";
    const rol = localStorage.getItem("rol") || "Vigilante";

    const displayUser = document.getElementById("display-username");
    const displayRol = document.getElementById("display-rol");
    if(displayUser) displayUser.innerText = username;
    if(displayRol) displayRol.innerText = rol;

    const modalPerfil = document.getElementById("modal-perfil");
    
    document.getElementById("btn-abrir-perfil")?.addEventListener("click", () => {
        document.getElementById("modal-username-grande").innerText = username;
        document.getElementById("modal-rol-grande").innerText = "Rol: " + rol;
        modalPerfil.style.display = "block";
    });

    document.getElementById("cerrar-modal-perfil")?.addEventListener("click", () => {
        modalPerfil.style.display = "none";
    });

    // 3. Manejo de cierre de sesión desde el modal
    document.getElementById("btn-cerrar-sesion-modal")?.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });

    // 4. Cargar registros activos en la interfaz de usuario
    cargarPrestamosActivos();
});

// Consulta asíncrona para renderizar la tabla principal
async function cargarPrestamosActivos() {
    const tbody = document.querySelector("#tabla-activos tbody");
    tbody.innerHTML = "<tr><td colspan='7'>Cargando datos...</td></tr>";

    // Función interna para convertir la hora al formato "hh:mm AM/PM"
    function formatearHoraAmPm(horaBackend) {
        if (!horaBackend) return "--:--";
        
        // Si el backend envía fecha completa (ej. "2026-05-24T14:30:00")
        const fecha = new Date(horaBackend);
        if (!isNaN(fecha.getTime())) {
            return fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        
        // Si el backend solo envía la hora en texto (ej. "14:30:00")
        const partes = horaBackend.split(':');
        if (partes.length >= 2) {
            let h = parseInt(partes[0], 10);
            const m = partes[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12; // Convierte 0 a 12 y las 13 a 1
            const hStr = h < 10 ? '0' + h : h; // Añade un 0 inicial si es necesario
            return `${hStr}:${m} ${ampm}`;
        }
        return horaBackend;
    }

    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos/activos`);
        if (respuesta.ok) {
            const prestamos = await respuesta.json();
            tbody.innerHTML = ""; 

            if (prestamos.length === 0) {
                tbody.innerHTML = "<tr><td colspan='7'>No hay proyectores prestados en este momento.</td></tr>";
                return;
            }

            prestamos.forEach(prestamo => {
                // Aplicamos el formato a la hora antes de crear la fila
                const horaLimpia = formatearHoraAmPm(prestamo.hora_salida);

                // NUEVO: Lógica de Palomita y Tacha para HDMI
                const cableBadge = prestamo.incluye_cable 
                    ? '<span style="font-size:20px;" title="Se llevó cable HDMI">✅</span>' 
                    : '<span style="font-size:20px;" title="No lleva cable">❌</span>';
                
                // NUEVO: Botón para ver la firma si existe
                const btnFirma = prestamo.firma_salida 
                    ? `<button onclick="verFirma('${prestamo.firma_salida}')" style="background:#17a2b8; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:12px;">👁️ Ver Firma</button>` 
                    : 'Sin firma';

                // Escapar comillas en observaciones para evitar errores de JS
                const obsSegura = prestamo.observaciones ? prestamo.observaciones.replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';

                const fila = `
                    <tr>
                        <td>#${prestamo.id_prestamo}</td>
                        <td>${horaLimpia}</td>
                        <td>${prestamo.docente.nombre_completo}</td>
                        <td>${prestamo.proyector.descripcion} (ID: ${prestamo.proyector.id_proyector})</td>
                        <td style="text-align:center;">${cableBadge}</td>
                        <td style="text-align:center;">${btnFirma}</td>
                        <td style="display:flex; gap:5px; justify-content:center;">
                            <button style="background:#007bff; color:white; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:4px;" 
                                    onclick="abrirEditar(${prestamo.id_prestamo}, ${prestamo.incluye_cable}, '${obsSegura}')">
                                ✏️ Editar
                            </button>
                            <button style="background:#ffc107; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:4px;" 
                                    onclick="recibirProyector(${prestamo.id_prestamo})">
                                📥 Recibir
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        }
    } catch (error) {
        console.error("Error al cargar la tabla:", error);
        tbody.innerHTML = "<tr><td colspan='7' style='color:red;'>Error de conexión con el servidor.</td></tr>";
    }
}


// ==========================================
// NUEVAS FUNCIONES GLOBALES (VER FIRMA Y EDITAR)
// ==========================================

// Mostrar modal de firma
const modalVerFirma = document.getElementById("modal-ver-firma");
document.getElementById("cerrar-modal-ver-firma").onclick = () => modalVerFirma.style.display = "none";

window.verFirma = function(firmaBase64) {
    document.getElementById("img-firma-mostrar").src = firmaBase64;
    modalVerFirma.style.display = "block";
};

// Mostrar modal de edición
const modalEditar = document.getElementById("modal-editar-prestamo");
document.getElementById("cerrar-modal-editar").onclick = () => modalEditar.style.display = "none";

window.abrirEditar = function(id, tieneCable, observaciones) {
    idAEditar = id;
    document.getElementById("edit-id-prestamo").innerText = id;
    document.getElementById("edit-check-cable").checked = tieneCable;
    document.getElementById("edit-observaciones").value = observaciones;
    modalEditar.style.display = "block";
};

// Guardar edición vía PUT
document.getElementById("btn-guardar-edicion").addEventListener("click", async () => {
    const dataAEditar = {
        incluye_cable: document.getElementById("edit-check-cable").checked,
        observaciones: document.getElementById("edit-observaciones").value
    };

    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos/${idAEditar}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataAEditar)
        });

        if (respuesta.ok) {
            alert("¡Registro actualizado exitosamente!");
            modalEditar.style.display = "none";
            cargarPrestamosActivos();
        } else {
            const err = await respuesta.json();
            alert("Error al editar (Verifica tu backend): " + (err.detail || ""));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Falló la conexión. Revisa que el backend permita PUT en /api/prestamos/{id}.");
    }
});


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
    setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 200;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    }, 50);
}

function obtenerPosicion(e, elemento) {
    const rect = elemento.getBoundingClientRect();
    const clienteX = e.touches ? e.touches[0].clientX : e.clientX;
    const clienteY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clienteX - rect.left, y: clienteY - rect.top };
}

canvas.addEventListener('mousedown', (e) => { dibujando = true; ctx.beginPath(); const pos = obtenerPosicion(e, canvas); ctx.moveTo(pos.x, pos.y); });
canvas.addEventListener('mouseup', () => { dibujando = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', (e) => { if (!dibujando) return; const pos = obtenerPosicion(e, canvas); ctx.lineTo(pos.x, pos.y); ctx.stroke(); });

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

canvasDev.addEventListener('mousedown', (e) => { dibujandoDev = true; ctxDev.beginPath(); const pos = obtenerPosicion(e, canvasDev); ctxDev.moveTo(pos.x, pos.y); });
canvasDev.addEventListener('mouseup', () => { dibujandoDev = false; ctxDev.beginPath(); });
canvasDev.addEventListener('mousemove', (e) => { if (!dibujandoDev) return; const pos = obtenerPosicion(e, canvasDev); ctxDev.lineTo(pos.x, pos.y); ctxDev.stroke(); });

canvasDev.addEventListener('touchstart', (e) => { e.preventDefault(); dibujandoDev = true; ctxDev.beginPath(); const pos = obtenerPosicion(e, canvasDev); ctxDev.moveTo(pos.x, pos.y); }, { passive: false });
canvasDev.addEventListener('touchend', (e) => { e.preventDefault(); dibujandoDev = false; ctxDev.beginPath(); }, { passive: false });
canvasDev.addEventListener('touchmove', (e) => { e.preventDefault(); if (!dibujandoDev) return; const pos = obtenerPosicion(e, canvasDev); ctxDev.lineTo(pos.x, pos.y); ctxDev.stroke(); }, { passive: false });

document.getElementById('btn-limpiar-firma-dev').addEventListener('click', () => {
    ctxDev.clearRect(0, 0, canvasDev.width, canvasDev.height);
});


// ==========================================
// COMUNICACIÓN ASÍNCRONA HTTP (POST / PUT)
// ==========================================

document.getElementById('btn-guardar-prestamo').addEventListener('click', async (e) => {
    e.preventDefault(); 

    const firmaBase64 = canvas.toDataURL("image/png");
    
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
let idPrestamoActual = null;
let idAEditar = null; 
const API_URL = "https://sistema-proyectores-itsz.onrender.com";
let datosHistorialGlobal = [];

// ==========================================
// CONTROL DE CARGA INICIAL Y NAVEGACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {

    const idUsuario = localStorage.getItem("id_usuario");
    if (!idUsuario) {
        alert("Debes iniciar sesión primero.");
        window.location.href = "index.html";
        return;
    }

 
    const username = localStorage.getItem("username") || "Usuario";
    const rol = localStorage.getItem("rol") || "Vigilante";

    const displayUser = document.getElementById("display-username");
    const displayRol = document.getElementById("display-rol");
    if(displayUser) displayUser.innerText = username;
    if(displayRol) displayRol.innerText = rol;

    // Control del modal de perfil
    const modalPerfil = document.getElementById("modal-perfil");
    document.getElementById("btn-abrir-perfil")?.addEventListener("click", () => {
        document.getElementById("modal-username-grande").innerText = username;
        document.getElementById("modal-rol-grande").innerText = "Rol: " + rol;
        modalPerfil.style.display = "block";
    });
 
    document.getElementById("cerrar-modal-perfil")?.addEventListener("click", () => {
        modalPerfil.style.display = "none";
    });

 
    document.getElementById("btn-cerrar-sesion-modal")?.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });

    // Control del modal de historial
    const modalHistorial = document.getElementById("modal-historial");
    document.getElementById("btn-ver-historial")?.addEventListener("click", () => {
        modalHistorial.style.display = "block";
        cargarHistorial();
    });
    document.getElementById("cerrar-modal-historial")?.addEventListener("click", () => {
        modalHistorial.style.display = "none";
    });

    // Cambios en el selector de ordenamiento del historial
    document.getElementById("orden-historial")?.addEventListener("change", renderizarHistorial);

    cargarPrestamosActivos();
});

// ==========================================
// RENDERIZAR TABLA PRINCIPAL (ACTIVOS)
// ==========================================
async function cargarPrestamosActivos() {
    const tbody = document.querySelector("#tabla-activos tbody");
    tbody.innerHTML = "<tr><td colspan='7'>Cargando datos...</td></tr>";


    function formatearHoraAmPm(horaBackend) {
        if (!horaBackend) return "--:--";

        const fecha = new Date(horaBackend);
        if (!isNaN(fecha.getTime())) {
            return fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        const partes = horaBackend.split(':');
        if (partes.length >= 2) {
            let h = parseInt(partes[0], 10);
            const m = partes[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            const hStr = h < 10 ? '0' + h : h;
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

                const horaLimpia = formatearHoraAmPm(prestamo.hora_salida);
 
                const cableBadge = prestamo.incluye_cable 
                    ? '<span style="font-size:20px;" title="Se llevó cable HDMI">✅</span>' 
                    : '<span style="font-size:20px;" title="No lleva cable">❌</span>';
                

                    const btnFirma = prestamo.firma_salida 
                    ? `<button onclick="verFirma('${prestamo.firma_salida}')" style="background:#17a2b8; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">👁️ Ver Firma</button>` 
                    : 'Sin firma';


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
// FUNCIONES GLOBALES INTERACTIVAS (MODALES SECUNDARIOS)
// ==========================================

// Control Modal Ver Firma
window.verFirma = function(firmaBase64) {
    document.getElementById("img-firma-mostrar").src = firmaBase64;
    document.getElementById("modal-ver-firma").style.display = "block";
};
document.getElementById("cerrar-modal-ver-firma").onclick = () => {
    document.getElementById("modal-ver-firma").style.display = "none";
};

// Control Modal Ver Observaciones
window.verObservacion = function(texto, titulo) {
    document.getElementById("titulo-modal-obs").innerText = titulo;
    document.getElementById("texto-modal-obs").innerText = texto;
    document.getElementById("modal-ver-obs").style.display = "block";
};
document.getElementById("cerrar-modal-ver-obs").onclick = () => {
    document.getElementById("modal-ver-obs").style.display = "none";
};

// Control Modal Editar
window.abrirEditar = function(id, tieneCable, observaciones) {
    idAEditar = id;
    document.getElementById("edit-id-prestamo").innerText = id;
    document.getElementById("edit-check-cable").checked = tieneCable;
    document.getElementById("edit-observaciones").value = observaciones;
    document.getElementById("modal-editar-prestamo").style.display = "block";
};
document.getElementById("cerrar-modal-editar").onclick = () => {
    document.getElementById("modal-editar-prestamo").style.display = "none";
};


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
            document.getElementById("modal-editar-prestamo").style.display = "none";
            cargarPrestamosActivos();
        } else {
            const err = await respuesta.json();
            alert("Error al editar (Verifica tu backend): " + (err.detail || ""));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Falló la conexión.");
    }
});

// ==========================================
// CONSULTA Y CONSTRUCCIÓN DEL HISTORIAL
// ==========================================
async function cargarHistorial() {
    const tbody = document.querySelector("#tabla-historial tbody");
    tbody.innerHTML = "<tr><td colspan='11'>Cargando historial desde el servidor...</td></tr>";
    
    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos/historial`);
        if (respuesta.ok) {
            datosHistorialGlobal = await respuesta.json();
            renderizarHistorial(); 
        } else {
            tbody.innerHTML = "<tr><td colspan='11' style='color:red;'>Error al obtener historial.</td></tr>";
        }
    } catch (error) {
        console.error("Error historial:", error);
        tbody.innerHTML = "<tr><td colspan='11' style='color:red;'>Error de conexión con el backend.</td></tr>";
    }
}

function renderizarHistorial() {
    const tbody = document.querySelector("#tabla-historial tbody");
    tbody.innerHTML = "";
    
    const orden = document.getElementById("orden-historial").value;
    let datosOrdenados = [...datosHistorialGlobal];
    
    datosOrdenados.sort((a, b) => {
        const fechaHoraA = new Date(`${a.fecha_prestamo}T${a.hora_salida}`);
        const fechaHoraB = new Date(`${b.fecha_prestamo}T${b.hora_salida}`);
        return orden === "desc" ? fechaHoraB - fechaHoraA : fechaHoraA - fechaHoraB;
    });

    if (datosOrdenados.length === 0) {
        tbody.innerHTML = "<tr><td colspan='11'>No hay registros en el historial.</td></tr>";
        return;
    }

    const hoyDate = new Date();
    const hoyStr = hoyDate.getFullYear() + "-" + String(hoyDate.getMonth() + 1).padStart(2, '0') + "-" + String(hoyDate.getDate()).padStart(2, '0');

    const formatHora = (h) => {
        if (!h) return "--:--";
        const [horas, minutos] = h.split(':');
        let hr = parseInt(horas);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12 || 12;
        return `${hr < 10 ? '0'+hr : hr}:${minutos} ${ampm}`;
    };

    datosOrdenados.forEach(p => {
        const horaSalidaLimpia = formatHora(p.hora_salida);
        const horaEntregaLimpia = p.hora_entrega ? formatHora(p.hora_entrega) : '---';
        
        const displayFecha = p.fecha_prestamo === hoyStr 
            ? '<strong style="color:#007bff;">Hoy</strong>' 
            : p.fecha_prestamo;
        
        const badgeEstado = p.estado_prestamo === "Devuelto" 
            ? '<span style="background:#d4edda; color:#155724; padding:3px 8px; border-radius:10px; font-size:12px; font-weight:bold;">Devuelto</span>'
            : '<span style="background:#fff3cd; color:#856404; padding:3px 8px; border-radius:10px; font-size:12px; font-weight:bold;">En Uso</span>';

        const badgeCable = p.incluye_cable 
            ? '<span style="font-size:16px;">✅</span>' 
            : '<span style="font-size:16px;">❌</span>';

        let obsSalida = "Ninguna observación registrada.";
        let obsEntrada = "Sin observaciones en la entrega.";

        if (p.observaciones) {
            if (p.observaciones.includes(" | Devuelto con: ")) {
                const partes = p.observaciones.split(" | Devuelto con: ");
                obsSalida = partes[0] || "Ninguna observación registrada.";
                obsEntrada = partes[1] || "Sin observaciones en la entrega.";
            } else {
                obsSalida = p.observaciones;
            }
        }

        const obsSalidaSegura = obsSalida.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const obsEntradaSegura = obsEntrada.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        const btnObsSalida = `<button onclick="verObservacion('${obsSalidaSegura}', 'Observaciones de Salida')" style="background:#6c757d; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">📄 Ver</button>`;
        
        const btnObsEntrada = p.estado_prestamo === "Devuelto"
            ? `<button onclick="verObservacion('${obsEntradaSegura}', 'Observaciones de Entrada')" style="background:#6c757d; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">📄 Ver</button>`
            : `<span style="color:#bbb; font-style:italic; font-size:11px;">Pendiente</span>`;

        let botonesFirmas = '';
        if (p.firma_salida) {
            botonesFirmas += `<button onclick="verFirma('${p.firma_salida}')" style="background:#17a2b8; color:white; border:none; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:11px; margin-right:3px; font-weight:bold;">Salida</button>`;
        }
        if (p.firma_entrega) {
            botonesFirmas += `<button onclick="verFirma('${p.firma_entrega}')" style="background:#28a745; color:white; border:none; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Entrada</button>`;
        }
        if (!p.firma_salida && !p.firma_entrega) {
            botonesFirmas = '<span style="color: #bbb; font-size:11px;">Sin firmas</span>';
        }

        const fila = `
            <tr>
                <td>#${p.id_prestamo}</td>
                <td>${displayFecha}</td>
                <td>${horaSalidaLimpia}</td>
                <td>${horaEntregaLimpia}</td>
                <td>${p.docente.nombre_completo}</td>
                <td>${p.proyector.descripcion}</td>
                <td style="text-align:center;">${badgeCable}</td>
                <td style="text-align:center;">${btnObsSalida}</td>
                <td style="text-align:center;">${btnObsEntrada}</td>
                <td style="text-align:center; white-space: nowrap;">${botonesFirmas}</td>
                <td style="text-align:center;">${badgeEstado}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// ==========================================
// FLUJO ORIGINAL DE MODALES Y CANVAS
// ==========================================
function recibirProyector(id) {
    idPrestamoActual = id;
    document.getElementById("span-id-prestamo-dev").innerText = id;
    document.getElementById("modal-devolucion").style.display = "block";
    redimensionarCanvasDev(); 
}


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

// LIENZOS DIGITALES
const canvas = document.getElementById('lienzo-firma');
const ctx = canvas.getContext('2d');
let dibujando = false;
ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';

function redimensionarCanvas() {
    setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 400; canvas.height = rect.height || 200;
        ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
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

document.getElementById('btn-limpiar-firma').addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));




const canvasDev = document.getElementById('lienzo-firma-dev');
const ctxDev = canvasDev.getContext('2d');
let dibujandoDev = false;
ctxDev.lineWidth = 3; ctxDev.lineCap = 'round'; ctxDev.strokeStyle = '#000';

function redimensionarCanvasDev() {
    setTimeout(() => {
        const rect = canvasDev.getBoundingClientRect();
        canvasDev.width = rect.width || 400; canvasDev.height = rect.height || 200;
        ctxDev.lineWidth = 3; ctxDev.lineCap = 'round'; ctxDev.strokeStyle = '#000';
    }, 50);
}

canvasDev.addEventListener('mousedown', (e) => { dibujandoDev = true; ctxDev.beginPath(); const pos = obtenerPosicion(e, canvasDev); ctxDev.moveTo(pos.x, pos.y); });
canvasDev.addEventListener('mouseup', () => { dibujandoDev = false; ctxDev.beginPath(); });
canvasDev.addEventListener('mousemove', (e) => { if (!dibujandoDev) return; const pos = obtenerPosicion(e, canvasDev); ctxDev.lineTo(pos.x, pos.y); ctxDev.stroke(); });

canvasDev.addEventListener('touchstart', (e) => { e.preventDefault(); dibujandoDev = true; ctxDev.beginPath(); const pos = obtenerPosicion(e, canvasDev); ctxDev.moveTo(pos.x, pos.y); }, { passive: false });
canvasDev.addEventListener('touchend', (e) => { e.preventDefault(); dibujandoDev = false; ctxDev.beginPath(); }, { passive: false });
canvasDev.addEventListener('touchmove', (e) => { e.preventDefault(); if (!dibujandoDev) return; const pos = obtenerPosicion(e, canvasDev); ctxDev.lineTo(pos.x, pos.y); ctxDev.stroke(); }, { passive: false });

document.getElementById('btn-limpiar-firma-dev').addEventListener('click', () => ctxDev.clearRect(0, 0, canvasDev.width, canvasDev.height));

// PETICIONES HTTP REST
document.getElementById('btn-guardar-prestamo').addEventListener('click', async (e) => {
    e.preventDefault(); 


    const firmaBase64 = canvas.toDataURL("image/png");
    if (firmaBase64.length < 1500) { alert("El docente debe firmar en el recuadro."); return; }

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
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cargaUtil)
        });


        if (respuesta.ok) {
            alert("¡Préstamo registrado con éxito!");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById("observaciones").value = "";
            document.getElementById("check-cable").checked = false;
            modalFirma.style.display = "none";
            cargarPrestamosActivos(); 
        } else {
            const err = await respuesta.json(); alert("Error del servidor: " + err.detail);
        }
    } catch (error) { console.error("Error al registrar:", error); alert("Error de conexión al registrar la salida."); }
});

document.getElementById('btn-confirmar-devolucion').addEventListener('click', async (e) => {
    e.preventDefault();


    const firmaBase64 = canvasDev.toDataURL("image/png");
    if (firmaBase64.length < 1500) { alert("El docente debe firmar la entrega del proyector."); return; }

    const cargaUtil = { firma_entrega: firmaBase64, observaciones: document.getElementById("observaciones-dev").value };

    try {
        const respuesta = await fetch(`${API_URL}/api/prestamos/${idPrestamoActual}/devolucion`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cargaUtil)
        });


        if (respuesta.ok) {
            alert("¡Proyector devuelto y liberado con éxito en el inventario!");
            ctxDev.clearRect(0, 0, canvasDev.width, canvasDev.height);
            document.getElementById("observaciones-dev").value = "";
            modalDevolucion.style.display = "none";
            cargarPrestamosActivos(); 
        } else {
            const err = await respuesta.json(); alert("Error del servidor: " + err.detail);
        }
    } catch (error) { console.error("Error al devolver:", error); alert("Error de conexión al registrar la devolución."); }
});



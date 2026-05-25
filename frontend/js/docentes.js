const API_URL = "https://sistema-proyectores-itsz.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    // Seguridad
    const idUsuario = localStorage.getItem("id_usuario");
    const rol = localStorage.getItem("rol");

    if (!idUsuario || rol !== "Directivo") {
        alert("Acceso denegado.");
        window.location.href = "index.html";
        return;
    }

    // Configurar datos del Widget de Perfil
    const username = localStorage.getItem("username") || "Administrador";
    const displayUser = document.getElementById("display-username");
    const displayRol = document.getElementById("display-rol");
    if(displayUser) displayUser.innerText = username;
    if(displayRol) displayRol.innerText = rol;

    // Control de Modal de Perfil
    const modalPerfil = document.getElementById("modal-perfil");
    
    document.getElementById("btn-abrir-perfil")?.addEventListener("click", () => {
        document.getElementById("modal-username-grande").innerText = username;
        document.getElementById("modal-rol-grande").innerText = "Rol: " + rol;
        modalPerfil.style.display = "block";
    });

    document.getElementById("cerrar-modal-perfil")?.addEventListener("click", () => {
        modalPerfil.style.display = "none";
    });

    // Cierre de sesión seguro desde el modal
    document.getElementById("btn-cerrar-sesion-modal")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "index.html";
    });

    // Cargar la lista al iniciar
    cargarDocentes();
});

// GET: Cargar la lista en la tabla
async function cargarDocentes() {
    const tbody = document.querySelector("#tabla-docentes tbody");
    tbody.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>";

    try {
        const respuesta = await fetch(`${API_URL}/api/docentes`);
        if (respuesta.ok) {
            const docentes = await respuesta.json();
            tbody.innerHTML = "";

            if (docentes.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3'>No hay docentes registrados.</td></tr>";
                return;
            }

            docentes.forEach(docente => {
                tbody.innerHTML += `
                    <tr>
                        <td>${docente.id_docente}</td>
                        <td>${docente.nombre_completo}</td>
                        <td>
                            <button onclick="eliminarDocente(${docente.id_docente})" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                Dar de baja
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// POST: Agregar un maestro nuevo
document.getElementById("btn-guardar-docente").addEventListener("click", async () => {
    const nombre = document.getElementById("nombre-nuevo-docente").value.trim();
    if (!nombre) {
        alert("Escribe el nombre del docente.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/api/docentes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre_completo: nombre })
        });

        if (respuesta.ok) {
            document.getElementById("nombre-nuevo-docente").value = "";
            cargarDocentes(); // Recargar la tabla
        } else {
            alert("Error al guardar en el servidor.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// DELETE: Borrar un maestro (Borrado lógico)
async function eliminarDocente(id) {
    if (!confirm(`¿Estás seguro de que deseas dar de baja al docente con ID ${id}? (Se conservará en el historial)`)) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/api/docentes/${id}`, {
            method: "DELETE"
        });

        if (respuesta.ok) {
            cargarDocentes(); // Recargar la tabla tras borrar
        } else {
            const err = await respuesta.json();
            alert("Error: " + err.detail);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
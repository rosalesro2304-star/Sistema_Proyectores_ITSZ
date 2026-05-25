document.addEventListener("DOMContentLoaded", () => {
    // 1. Definimos la variable 'rol' correctamente para que exista en todo el bloque
    const rol = localStorage.getItem("rol");
    
    // 2. Validamos la seguridad
    if (rol !== "Directivo") {
        window.location.href = "index.html";
        return;
    }
    
    cargarProyectores();

    // 3. Configurar datos del Widget de Perfil
    const username = localStorage.getItem("username") || "Administrador";
    const displayUser = document.getElementById("display-username");
    const displayRol = document.getElementById("display-rol");
    
    if(displayUser) displayUser.innerText = username;
    if(displayRol) displayRol.innerText = rol; // Ahora sí sabe qué es 'rol'

    // 4. Control de Modal de Perfil
    const modalPerfil = document.getElementById("modal-perfil");
    
    document.getElementById("btn-abrir-perfil")?.addEventListener("click", () => {
        document.getElementById("modal-username-grande").innerText = username;
        document.getElementById("modal-rol-grande").innerText = "Rol: " + rol;
        modalPerfil.style.display = "block";
    });

    document.getElementById("cerrar-modal-perfil")?.addEventListener("click", () => {
        modalPerfil.style.display = "none";
    });

    // 5. Cierre de sesión seguro desde el modal
    document.getElementById("btn-cerrar-sesion-modal")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "index.html";
    });
});

async function cargarProyectores() {
    const tbody = document.querySelector("#tabla-proyectores tbody");
    tbody.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

    try {
        const respuesta = await fetch("https://sistema-proyectores-itsz.onrender.com/api/proyectores");
        
        if (respuesta.ok) {
            const proyectores = await respuesta.json();
            tbody.innerHTML = "";
            if (proyectores.length === 0) {
                tbody.innerHTML = "<tr><td colspan='4'>No hay proyectores en el inventario.</td></tr>";
                return;
            }

            proyectores.forEach(p => {
                // AQUÍ ESTÁ LA CORRECCIÓN: La lógica visual va ADENTRO del ciclo para evaluar cada proyector
                const badgeEstado = p.estado === "Disponible"
                    ? '<span style="background:#d4edda; color:#155724; padding:4px 8px; border-radius:10px; font-weight:bold; font-size:12px;">🟢 Disponible</span>'
                    : '<span style="background:#fff3cd; color:#856404; padding:4px 8px; border-radius:10px; font-weight:bold; font-size:12px;">🟡 En Uso</span>';

                tbody.innerHTML += `
                    <tr>
                        <td><strong>${p.id_proyector}</strong></td>
                        <td>${p.descripcion}</td>
                        <td style="text-align: center;">${badgeEstado}</td>
                        <td style="text-align: center;">
                            <button onclick="eliminarProyector('${p.id_proyector}')" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Dar de baja</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

document.getElementById("btn-guardar-proyector").addEventListener("click", async () => {
    const idProy = document.getElementById("id-nuevo-proyector").value.trim();
    const descProy = document.getElementById("desc-nuevo-proyector").value.trim();
    
    if (!idProy || !descProy) {
        alert("Completa ambos campos.");
        return;
    }

    try {
        const respuesta = await fetch("https://sistema-proyectores-itsz.onrender.com/api/proyectores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_proyector: idProy, descripcion: descProy })
        });

        if (respuesta.ok) {
            document.getElementById("id-nuevo-proyector").value = "";
            document.getElementById("desc-nuevo-proyector").value = "";
            cargarProyectores();
        } else {
            const err = await respuesta.json();
            alert("Error: " + err.detail);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

async function eliminarProyector(id) {
    if (!confirm(`¿Eliminar proyector ${id}?`)) return;
    try {
        const respuesta = await fetch(`https://sistema-proyectores-itsz.onrender.com/api/proyectores/${id}`, { method: "DELETE" });
        if (respuesta.ok) cargarProyectores();
    } catch (error) {
        console.error("Error:", error);
    }
}
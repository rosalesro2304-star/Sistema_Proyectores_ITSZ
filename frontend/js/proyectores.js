document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("rol") !== "Directivo") {
        window.location.href = "index.html";
        return;
    }
    cargarProyectores();

    document.getElementById("btn-salir-proy").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
});

async function cargarProyectores() {
    const tbody = document.querySelector("#tabla-proyectores tbody");
    tbody.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

    try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/proyectores/disponibles");
        if (respuesta.ok) {
            const proyectores = await respuesta.json();
            tbody.innerHTML = "";
            if (proyectores.length === 0) {
                tbody.innerHTML = "<tr><td colspan='4'>No hay proyectores en el inventario.</td></tr>";
                return;
            }
            proyectores.forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${p.id_proyector}</strong></td>
                        <td>${p.descripcion}</td>
                        <td><span style="background:#d4edda; color:#155724; padding:3px 8px; border-radius:10px; font-size:12px;">${p.estado}</span></td>
                        <td>
                            <button onclick="eliminarProyector('${p.id_proyector}')" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Dar de baja</button>
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
        const respuesta = await fetch("http://127.0.0.1:8000/api/proyectores", {
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
        const respuesta = await fetch(`http://127.0.0.1:8000/api/proyectores/${id}`, { method: "DELETE" });
        if (respuesta.ok) cargarProyectores();
    } catch (error) {
        console.error("Error:", error);
    }
}
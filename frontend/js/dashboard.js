document.addEventListener("DOMContentLoaded", () => {
    // 1. Capa de Seguridad: Validar sesión y privilegios de rol
    const idUsuario = localStorage.getItem("id_usuario");
    const rol = localStorage.getItem("rol");

    if (!idUsuario || rol !== "Directivo") {
        alert("Acceso denegado. Área restringida únicamente para personal directivo.");
        window.location.href = "index.html";
        return;
    }

    // 2. Disparar consultas analíticas al backend
    cargarRankingDocentes();
    cargarUsoProyectores();

    // 3. Manejo de Salida Segura
    document.getElementById("btn-salir-dash").addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "index.html";
    });
});

// Consumir el endpoint de agregación: Ranking de Maestros
async function cargarRankingDocentes() {
    const tbody = document.querySelector("#tabla-ranking-docentes tbody");
    tbody.innerHTML = "<tr><td colspan='2'>Procesando métricas...</td></tr>";

    try {
        const respuesta = await fetch("https://sistema-proyectores-itsz.onrender.com/api/reportes/ranking-docentes");
        if (respuesta.ok) {
            const datos = await respuesta.json();
            tbody.innerHTML = "";

            if (datos.length === 0) {
                tbody.innerHTML = "<tr><td colspan='2'>Sin registros de historial disponibles.</td></tr>";
                return;
            }

            datos.forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${row.nombre_completo}</strong></td>
                        <td><span style="color: #27ae60; font-weight: bold;">${row.total_prestamos} préstamos</span></td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = "<tr><td colspan='2' style='color:red;'>Error de comunicación con la API.</td></tr>";
    }
}

// Consumir el endpoint de agregación: Uso de Cañones
async function cargarUsoProyectores() {
    const tbody = document.querySelector("#tabla-uso-proyectores tbody");
    tbody.innerHTML = "<tr><td colspan='3'>Procesando métricas...</td></tr>";

    try {
        const respuesta = await fetch("https://sistema-proyectores-itsz.onrender.com/api/reportes/uso-proyectores");
        if (respuesta.ok) {
            const datos = await respuesta.json();
            tbody.innerHTML = "";

            if (datos.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3'>Sin registros de historial disponibles.</td></tr>";
                return;
            }

            datos.forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td><code>${row.id_proyector}</code></td>
                        <td>${row.descripcion}</td>
                        <td><span style="background: #e1f5fe; color: #0288d1; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 13px;">${row.total_usos} veces</span></td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = "<tr><td colspan='3' style='color:red;'>Error de comunicación con la API.</td></tr>";
    }
}
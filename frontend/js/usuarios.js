const API_URL = "https://sistema-proyectores-itsz.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    // Validar seguridad
    if (localStorage.getItem("rol") !== "Directivo") {
        window.location.href = "index.html";
        return;
    }

    // Cerrar sesión
    document.getElementById("btn-salir-usu").addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "index.html";
    });
});

// Guardar nuevo usuario
document.getElementById("btn-guardar-usuario").addEventListener("click", async (e) => {
    e.preventDefault(); // Detiene cualquier recarga automática de la página

    const user = document.getElementById("user-nuevo").value.trim();
    const pass = document.getElementById("pass-nuevo").value.trim();
    const rol = document.getElementById("rol-nuevo").value;
    
    if (!user || !pass) {
        alert("El usuario y la contraseña son obligatorios.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/api/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass, rol: rol })
        });

        if (respuesta.ok) {
            alert(`¡Usuario '${user}' creado con éxito! Ya puede iniciar sesión.`);
            document.getElementById("user-nuevo").value = "";
            document.getElementById("pass-nuevo").value = "";
            document.getElementById("rol-nuevo").value = "Vigilante"; // Resetea el select
        } else {
            // Extrae el error exacto de FastAPI (ej. "El usuario ya existe")
            const err = await respuesta.json();
            alert("Atención: " + (err.detail || "No se pudo crear el usuario."));
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de conexión. Asegúrate de que el servidor esté activo, el usuario ya existe.");
    }
});
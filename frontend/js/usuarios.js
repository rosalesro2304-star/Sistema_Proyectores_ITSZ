const API_URL = "https://sistema-proyectores-itsz.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    // Validar seguridad
    const rol = localStorage.getItem("rol");
    if (rol !== "Directivo") {
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
});

// Guardar nuevo usuario
document.getElementById("btn-guardar-usuario").addEventListener("click", async (e) => {
    e.preventDefault(); // Detiene cualquier recarga automática de la página

    const user = document.getElementById("user-nuevo").value.trim();
    const pass = document.getElementById("pass-nuevo").value.trim();
    const rolNuevo = document.getElementById("rol-nuevo").value;
    
    if (!user || !pass) {
        alert("El usuario y la contraseña son obligatorios.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/api/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass, rol: rolNuevo })
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
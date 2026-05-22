document.getElementById("formulario-login").addEventListener("submit", async function(event) {
    // Evita que la página se recargue al darle clic al botón
    event.preventDefault();

    const usuario = document.getElementById("username").value;
    const contrasena = document.getElementById("password").value;
    const mensajeError = document.getElementById("mensaje-error");

    try {
        // Hacemos la petición POST a tu servidor FastAPI
        const respuesta = await fetch("http://127.0.0.1:8000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: usuario,
                password: contrasena
            })
        });

        if (respuesta.ok) {
            const datos = await respuesta.json();
            
            // Guardamos el ID y el ROL del usuario en la memoria del navegador 
            // (Para usarlo en la pantalla de la caseta en el campo "registrado_por")
            localStorage.setItem("id_usuario", datos.id_usuario);
            localStorage.setItem("rol", datos.rol);

            // Ruteo según el Diagrama de Actividad
            if (datos.rol === "Directivo") {
                alert("Bienvenido Directivo. Redirigiendo al Dashboard...");
                window.location.href = "dashboard.html"; // Lo crearemos después
            } else {
                alert("Bienvenido Vigilante. Redirigiendo a la Caseta...");
                window.location.href = "caseta.html"; // Lo crearemos después
            }
        } else {
            // Código 401 (Acceso denegado) u otro error
            mensajeError.style.display = "block";
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert("El servidor está apagado o hay un problema de conexión.");
    }
});

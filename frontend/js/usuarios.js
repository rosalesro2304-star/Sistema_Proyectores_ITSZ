document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("rol") !== "Directivo") {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("btn-salir-usu").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
});

document.getElementById("btn-guardar-usuario").addEventListener("click", async () => {
    const user = document.getElementById("user-nuevo").value.trim();
    const pass = document.getElementById("pass-nuevo").value.trim();
    const rol = document.getElementById("rol-nuevo").value;
    
    if (!user || !pass) {
        alert("El usuario y la contraseña son obligatorios.");
        return;
    }

    try {
        const respuesta = await fetch("https://sistema-proyectores-itsz.onrender.com/api/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass, rol: rol })
        });

        if (respuesta.ok) {
            alert(`¡Usuario '${user}' creado con éxito! Ya puede iniciar sesión.`);
            document.getElementById("user-nuevo").value = "";
            document.getElementById("pass-nuevo").value = "";
        } else {
            const err = await respuesta.json();
            alert("Error: " + err.detail);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
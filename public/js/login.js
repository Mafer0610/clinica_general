document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3001/auth/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);

            alert("Inicio de sesión exitoso");

            if (data.role === "medico") {
                window.location.href = "../html/inicioMedico.html"; 
            } else if (data.role === "user") {
                window.location.href = "../html/inicioPaciente.html"; 
            } else {
                alert("Rol no reconocido, contacta al soporte.");
            }
        } else {
            alert(data.error || "Credenciales incorrectas, intenta nuevamente.");
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error al conectar con el servidor. Verifica que los servicios estén corriendo.");
    }
});
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const authServiceUrl = 'http://localhost:3001';
        
        const response = await fetch(`${authServiceUrl}/auth/login`, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (data.success) {
            // Guardar información del usuario en localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('userEmail', data.user.email); // NUEVO: Guardar email

            console.log('✅ Datos guardados en localStorage:');
            console.log('   - userId:', data.user.id);
            console.log('   - username:', data.user.username);
            console.log('   - email:', data.user.email);
            console.log('   - role:', data.role);

            alert("✅ Inicio de sesión exitoso");

            if (data.role === "medico") {
                window.location.href = "../html/inicioMedico.html"; 
            } else if (data.role === "user") {
                window.location.href = "../html/inicioPaciente.html"; 
            } else {
                alert("⚠️ Rol no reconocido, contacta al soporte.");
            }
        } else {
            alert(" " + (data.error || "Credenciales incorrectas"));
        }
    } catch (error) {
        console.error(" Error en login:", error);
        alert(" Error: " + error.message + "\n\nVerifica que el Auth Service esté corriendo en puerto 3001");
    }
});
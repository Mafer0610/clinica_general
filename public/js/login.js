document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const authServiceUrl = 'http://localhost:3001';
        
        console.log('📤 Enviando login a:', authServiceUrl);

        const response = await fetch(`${authServiceUrl}/auth/login`, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📥 Response data:', data);

        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);

            alert("✅ Inicio de sesión exitoso");

            if (data.role === "medico") {
                window.location.href = "../html/inicioMedico.html"; 
            } else if (data.role === "user") {
                window.location.href = "../html/inicioPaciente.html"; 
            } else {
                alert("⚠️ Rol no reconocido, contacta al soporte.");
            }
        } else {
            alert("❌ " + (data.error || "Credenciales incorrectas"));
        }
    } catch (error) {
        console.error("❌ Error en login:", error);
        alert("❌ Error: " + error.message + "\n\nVerifica que el Auth Service esté corriendo en puerto 3001");
    }
});
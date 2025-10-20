document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validaciones cliente
    if (password !== confirmPassword) {
        alert("❌ Las contraseñas no coinciden");
        return;
    }

    if (password.length < 6) {
        alert("❌ La contraseña debe tener al menos 6 caracteres");
        return;
    }

    if (username.length < 3) {
        alert("❌ El usuario debe tener al menos 3 caracteres");
        return;
    }

    try {
        // Determinar URL del auth service
        const authServiceUrl = 'http://localhost:3001';
        
        console.log('📤 Enviando registro a:', authServiceUrl);

        const response = await fetch(`${authServiceUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',  // Incluir cookies si es necesario
            body: JSON.stringify({ 
                username, 
                email,
                password,
                role: 'user'  // Default role
            })
        });

        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📥 Response data:', data);

        if (data.success || response.ok) {
            alert("✅ " + (data.message || "Usuario registrado correctamente"));
            // Limpiar formulario
            document.getElementById('register-form').reset();
            // Redirigir después de 1 segundo
            setTimeout(() => {
                window.location.href = "./index.html";
            }, 1000);
        } else {
            alert("❌ " + (data.error || "Error en el registro, intenta de nuevo."));
        }
    } catch (error) {
        console.error("❌ Error en registro:", error);
        alert("❌ Error: " + error.message + "\n\nVerifica que:\n1. El Auth Service está corriendo en puerto 3001\n2. MongoDB está conectado\n3. Hay conexión a internet");
    }
});
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                email,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message || "Usuario registrado correctamente");
            window.location.href = "../html/index.html";
        } else {
            alert(data.error || "Error en el registro, intenta de nuevo.");
        }
    } catch (error) {
        console.error("Error en registro:", error);
        alert("Error al conectar con el servidor. Verifica que los servicios estén corriendo.");
    }
});
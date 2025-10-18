  document.addEventListener("DOMContentLoaded", function () {
    const profileIcon = document.getElementById("profileIconPacientes");
    const modal = document.getElementById("modalPerfil");
    const closeBtn = modal.querySelector(".modal-close");

    // Mostrar el modal al hacer clic en el icono de perfil
    profileIcon.addEventListener("click", () => {
      modal.style.display = "block";
    });

    // Cerrar el modal al hacer clic en el botón de cerrar
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

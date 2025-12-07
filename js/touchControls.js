/**
 * TouchControls - Xestión de controis táctiles para móbil
 */

// Estado global dos controis táctiles
window.touchControls = {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false
};

document.addEventListener('DOMContentLoaded', () => {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');

    if (!btnLeft || !btnRight || !btnJump) return;

    // Helper para evitar comportamento por defecto
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Botón esquerda
    btnLeft.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        window.touchControls.left = true;
        btnLeft.classList.add('pressed');
    }, { passive: false });

    btnLeft.addEventListener('touchend', (e) => {
        preventDefaults(e);
        window.touchControls.left = false;
        btnLeft.classList.remove('pressed');
    }, { passive: false });

    // Botón dereita
    btnRight.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        window.touchControls.right = true;
        btnRight.classList.add('pressed');
    }, { passive: false });

    btnRight.addEventListener('touchend', (e) => {
        preventDefaults(e);
        window.touchControls.right = false;
        btnRight.classList.remove('pressed');
    }, { passive: false });

    // Botón salto
    btnJump.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        window.touchControls.jump = true;
        window.touchControls.jumpJustPressed = true;
        btnJump.classList.add('pressed');
    }, { passive: false });

    btnJump.addEventListener('touchend', (e) => {
        preventDefaults(e);
        window.touchControls.jump = false;
        btnJump.classList.remove('pressed');
    }, { passive: false });

    // Tamén soportar touchcancel
    [btnLeft, btnRight, btnJump].forEach(btn => {
        btn.addEventListener('touchcancel', () => {
            window.touchControls.left = false;
            window.touchControls.right = false;
            window.touchControls.jump = false;
            btn.classList.remove('pressed');
        });
    });
});

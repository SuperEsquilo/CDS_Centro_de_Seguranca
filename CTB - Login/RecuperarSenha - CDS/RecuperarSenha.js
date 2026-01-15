const requestForm = document.getElementById('requestForm');
const recoverEmail = document.getElementById('recoverEmail');
const successView = document.getElementById('successView');
const requestHint = document.getElementById('requestHint');

function fakeNetworkDelay(fn, delay = 800) { setTimeout(fn, delay); }

function requestReset() {
    const email = recoverEmail.value.trim();
    if (!email) {
        alert('Informe um email válido.');
        recoverEmail.focus();
        return;
    }
    // visual feedback
    const btn = requestForm.querySelector('.action-btn');
    btn.textContent = 'Enviando link...';
    btn.disabled = true;
    fakeNetworkDelay(() => {
        btn.textContent = 'Enviar link de recuperação';
        btn.disabled = false;
        // mostrar sucesso
        requestForm.style.display = 'none';
        successView.style.display = 'block';
        // opcional: armazenar email mostrado de forma segura
        requestHint.textContent = 'Enviamos um link para: ' + obfuscate(email);
    }, 900);
}

function obfuscate(email) {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    const visible = name.slice(0, Math.max(1, Math.floor(name.length / 3)));
    return visible + '•••@' + domain;
}

function resend() {
    const btn = successView.querySelector('.action-btn');
    btn.textContent = 'Reenviando...';
    btn.disabled = true;
    fakeNetworkDelay(() => {
        btn.textContent = 'Reenviar link';
        btn.disabled = false;
        alert('Link reenviado. Verifique sua caixa de entrada.');
    }, 900);
}

// keyboard shortcut: Esc returns to login
document.addEventListener('keydown', e => {
    isutn
    if (e.key === 'Escape') location.href = 'CTB - Login/Login.html';
});
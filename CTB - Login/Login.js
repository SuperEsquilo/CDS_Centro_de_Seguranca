// Toggle show/hide password
const pwd = document.getElementById('password');
const toggle = document.getElementById('togglePassword');
const eyeIcon = document.getElementById('eyeIcon');

toggle.addEventListener('click', () => {
    const showing = pwd.type === 'text';
    if (showing) {
        pwd.type = 'password';
        toggle.setAttribute('aria-pressed', 'false');
        toggle.title = 'Mostrar senha';
        // eye outline
        eyeIcon.innerHTML = '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.4"/>';
    } else {
        pwd.type = 'text';
        toggle.setAttribute('aria-pressed', 'true');
        toggle.title = 'Ocultar senha';
        // eye with slash (simple)
        eyeIcon.innerHTML = '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a18.69 18.69 0 0 1 4.31-5.71" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 1l22 22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
    }
});

// Substitua a função handleLogin existente por esta versão que valida,
// guarda o email no sessionStorage e redireciona para DashBoard.html
function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    // visual feedback (replace with real validation)
    if (!email || !password) {
        alert('Preencha email e senha.');
        return;
    }

    // Simular autenticação (substitua por sua API)
    document.querySelector('.btn').textContent = 'Entrando...';
    setTimeout(() => {
        document.querySelector('.btn').textContent = 'Entrar';
        // armazenar usuário para uso no dashboard
        sessionStorage.setItem('gsb_user', JSON.stringify({ email }));
        // redirecionar para o dashboard (abertura da página após login bem sucedido)
        window.location.href = 'Dashboard - CDS/DashBoard.html';
    }, 900);
}

document, querySelector('form').addEventListener('button', handleLogin);
sessionStorage.setItem('gsb_user', JSON.stringify({ email: '' }));
window.location.href = 'CriarContaSegBar.html'; 
// local storage simple mock registration (client-only) - unchanged logic
const form = document.getElementById('createAccountForm');
const pwd = document.getElementById('password');
const pwdBar = document.getElementById('pwdBar');
const avatarFile = document.getElementById('avatarFile');
const avatarPreview = document.getElementById('avatarPreview');
const tagsContainer = document.getElementById('tagsContainer');

// tags toggle (delegated)
tagsContainer.addEventListener('click', (e) => {
    const t = e.target.closest('.tag');
    if (!t) return;
    t.classList.toggle('active');
    t.setAttribute('aria-selected', t.classList.contains('active'));
});

// avatar preview
avatarFile.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) {
        avatarPreview.textContent = 'PNG';
        avatarPreview.style.backgroundImage = '';
        avatarPreview.innerHTML = 'PNG';
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        avatarPreview.innerHTML = ''; // clear text
        const img = document.createElement('img');
        img.src = reader.result;
        avatarPreview.appendChild(img);
    };
    reader.readAsDataURL(f);
});

// password strength (simple)
function strengthScore(s) {
    let score = 0;
    if (!s) return 0;
    if (s.length >= 8) score += 1;
    if (/[A-Z]/.test(s)) score += 1;
    if (/[0-9]/.test(s)) score += 1;
    if (/[^A-Za-z0-9]/.test(s)) score += 1;
    if (s.length >= 12) score += 1;
    return score;
}
pwd.addEventListener('input', () => {
    const sc = strengthScore(pwd.value);
    const pct = Math.min(100, sc * 20);
    pwdBar.style.width = pct + '%';
    if (pct <= 40) pwdBar.style.background = 'linear-gradient(90deg,#ef4444,#f97316)';
    else if (pct <= 80) pwdBar.style.background = 'linear-gradient(90deg,#f97316,#fbbf24)';
    else pwdBar.style.background = 'linear-gradient(90deg,#10b981,#60a5fa)';
});

// form submit
form.addEventListener('submit', e => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    if (!fullName || !email || !password || !confirmPassword) {
        alert('Preencha os campos obrigatórios.');
        return;
    }
    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }
    if (password.length < 8) {
        alert('Senha muito curta. Utilize ao menos 8 caracteres.');
        return;
    }
    if (!terms) {
        alert('Você deve aceitar os termos.');
        return;
    }

    // collect tags
    const tags = Array.from(tagsContainer.querySelectorAll('.tag.active')).map(t => t.dataset.val);

    // avatar data (base64) — optional
    const avatarImg = avatarPreview.querySelector('img');
    const avatar = avatarImg ? avatarImg.src : null;

    // store locally (demo)
    const users = JSON.parse(localStorage.getItem('gsb_users') || '[]');
    users.push({
        id: 'u' + Date.now(),
        fullName,
        email,
        role: document.getElementById('role').value,
        phone: document.getElementById('phone').value,
        organization: document.getElementById('organization').value,
        municipality: document.getElementById('municipality').value,
        tags,
        avatar
    });
    localStorage.setItem('gsb_users', JSON.stringify(users));

    // success feedback and redirect
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando...';
    setTimeout(() => {
        alert('Conta criada com sucesso. Você será redirecionado para a tela de login.');
        location.href = 'SegBar.html';
    }, 850);
});
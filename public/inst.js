document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const hash = link.getAttribute('href');
      if (hash.length > 1) {
        e.preventDefault();
        const target = document.getElementById(hash.slice(1));
        if (target) window.scroll({ top: target.offsetTop - 60, behavior: 'smooth' });
      }
    });
  });

  const burger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('nav.mobile-nav');
  burger?.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    if (modal.style.display === 'flex') modal.style.display = 'none';
  });

  document.querySelectorAll('#faq dt').forEach(dt => {
    const dd = dt.nextElementSibling;
    dt.style.cursor = 'pointer';
    if (dd) dd.style.display = 'none';
    dt.addEventListener('click', () => {
      if (!dd) return;
      dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
      dt.classList.toggle('active');
    });
  });

  const toTop = document.getElementById('to-top');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('visible', window.scrollY > 400);
    });
    toTop.addEventListener('click', () => {
      window.scroll({ top: 0, behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.news-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.news-item').classList.toggle('open');
    });
  });
});

const modal = document.getElementById('login-modal');
const closeBtn = document.querySelector('.close-btn');
const loginBtns = document.querySelectorAll('.login-btn');

loginBtns.forEach(btn =>
  btn.addEventListener('click', e => {
    e.preventDefault();
    modal.style.display = 'flex';
    document.querySelector('nav.mobile-nav').classList.remove('open');
  })
);

closeBtn?.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});

document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const loginRemember = document.getElementById('login-remember');
  const loginError = document.getElementById('login-error');
  loginError.textContent = '';
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!resp.ok) throw new Error();
    const data = await resp.json();
    if (data.success) {
      if (loginRemember.checked) localStorage.setItem('authToken', data.token);
      else sessionStorage.setItem('authToken', data.token);
      modal.style.display = 'none';
      window.location.href = '/dashboard';
    } else {
      loginError.textContent = data.message || 'Невірний логін або пароль';
    }
  } catch {
    loginError.textContent = 'Сталася помилка. Спробуйте пізніше.';
  }
});

const registerBtn = document.querySelector('.register-btn');
const registerModal = document.getElementById('register-modal');
const regCloseBtns = registerModal.querySelectorAll('.close-btn');

registerBtn.addEventListener('click', e => {
  e.preventDefault();
  registerModal.style.display = 'flex';
});
regCloseBtns.forEach(btn =>
  btn.addEventListener('click', () => registerModal.style.display = 'none')
);
window.addEventListener('click', e => {
  if (e.target === registerModal) registerModal.style.display = 'none';
});

document.getElementById('register-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const regError = document.getElementById('register-error');
  regError.textContent = '';
  const payload = {
    firstName: document.getElementById('reg-firstname').value.trim(),
    lastName: document.getElementById('reg-lastname').value.trim(),
    city: document.getElementById('reg-city').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value
  };
  try {
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data.success) {
      registerModal.style.display = 'none';
      alert('Реєстрація успішна! Ви автоматично увійдете.');
      window.location.href = '/dashboard';
    } else {
      regError.textContent = data.message || 'Помилка реєстрації';
    }
  } catch {
    document.getElementById('register-error').textContent = 'Сервер недоступний, спробуйте пізніше.';
  }
});

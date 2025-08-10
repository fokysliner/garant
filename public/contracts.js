// contracts.js — авто-прийняття угоди і редірект у кабінет
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const qs = new URLSearchParams(location.search);
  const dealId = qs.get('dealId');
  if (!dealId) return fail('Не вказано ID угоди.');

  const authCard  = document.getElementById('auth-card');
  const loginLink = document.getElementById('login-link');
  const errorCard = document.getElementById('error-card');
  const errorText = document.getElementById('error-text');

  // 1) авторизація
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) {
    if (loginLink) loginLink.href = `/login.html?returnUrl=${encodeURIComponent(location.href)}&auto=1`;
    if (authCard) authCard.style.display = 'block';
    location.replace(`/login.html?returnUrl=${encodeURIComponent(location.href)}&auto=1`);
    return;
  }

  // 2) тягнемо me та угоду
  let me = null, deal = null;
  try {
    const [meRes, dealRes] = await Promise.all([
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/deals/${encodeURIComponent(dealId)}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const meJson   = await meRes.json().catch(()=>null);
    const dealJson = await dealRes.json().catch(()=>null);

    me   = meJson?.user || meJson?.me || meJson || null;
    deal = dealJson?.deal || dealJson || null;

    if (!deal) return fail(dealJson?.message || 'Угоду не знайдено');
  } catch {
    return fail('Помилка з’єднання із сервером');
  }

  // 3) визначаємо айді: автор (owner/creatorId), партнер, я
  const meId      = (me?._id || me?.id || '').toString();
  const ownerId   = (deal?.owner?._id || deal?.owner || deal?.creatorId?._id || deal?.creatorId || '').toString();
  const partnerId = (deal?.partnerId?._id || deal?.partnerId || '').toString();
  const status    = (deal?.status || '').toLowerCase();

  // якщо я автор — нічого не приймаємо
  if (meId && ownerId && meId === ownerId) {
    return goDashboard();
  }

  // якщо вже є інший партнер — теж просто в кабінет
  if (partnerId && partnerId !== meId) {
    return goDashboard();
  }

  // статуси, коли можна приймати
  const canAccept = ['pending', 'waiting_partner', 'pending_partner', 'pending_accept'].includes(status);

  // вже прийнята мною — редірект з тостом
  if (!canAccept && partnerId === meId) {
    return goDashboardAccepted(dealId);
  }

  // 4) авто-accept
  try {
    const resp = await fetch(`/api/deals/${encodeURIComponent(deal._id || dealId)}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (resp.status === 409) return goDashboard(); // хтось інший вже прийняв

    let json = null;
    try { json = await resp.json(); } catch { /* без тіла — ок */ }

    if (resp.ok && (json?.success !== false)) {
      return goDashboardAccepted(dealId);
    }

    return fail(json?.message || 'Не вдалося прийняти угоду');
  } catch {
    return fail('Помилка з’єднання із сервером');
  }

  // helpers
  function goDashboard() {
    location.replace('/dashboard.html');
  }
  function goDashboardAccepted(id) {
    // параметр accepted покаже тост у dashboard.js
    location.replace(`/dashboard.html?accepted=${encodeURIComponent(id)}`);
  }
  function fail(text) {
    if (errorText) errorText.textContent = text;
    if (errorCard) errorCard.style.display = 'block';
    // щоб користувач не «зависав» на сторінці
    setTimeout(() => goDashboard(), 1200);
  }
}

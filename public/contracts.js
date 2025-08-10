document.addEventListener('DOMContentLoaded', init);

async function init() {
  const qs = new URLSearchParams(location.search);
  const dealId = qs.get('dealId');
  if (!dealId) return fail('Не вказано ID угоди.');

  const authCard  = document.getElementById('auth-card');
  const loginLink = document.getElementById('login-link');
  const errorCard = document.getElementById('error-card');
  const errorText = document.getElementById('error-text');

  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) {
    if (loginLink) loginLink.href = `/login.html?returnUrl=${encodeURIComponent(location.href)}&auto=1`;
    if (authCard) authCard.style.display = 'block';
    location.replace(`/login.html?returnUrl=${encodeURIComponent(location.href)}&auto=1`);
    return;
  }

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

  const meId = (me?._id || me?.id || '').toString();
  const creatorId = (deal?.creatorId?._id || deal?.creatorId || '').toString();
  const partnerId = (deal?.partnerId?._id || deal?.partnerId || '').toString();
  const status = (deal?.status || '').toLowerCase();

  if (meId && creatorId && meId === creatorId) {
    return goDashboard();
  }

  if (partnerId && partnerId !== meId) {
    return goDashboard();
  }

  const canAccept = ['pending', 'waiting_partner', 'pending_partner', 'pending_accept'].includes(status);

  if (!canAccept && partnerId === meId) {
    return goDashboardAccepted(dealId);
  }

  try {
    const resp = await fetch(`/api/deals/${encodeURIComponent(deal._id || dealId)}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (resp.status === 409) return goDashboard();

    let json = null;
    try { json = await resp.json(); } catch { /* no body */ }

    if (resp.ok && (json?.success !== false)) {
      return goDashboardAccepted(dealId);
    }

    return fail(json?.message || 'Не вдалося прийняти угоду');
  } catch {
    return fail('Помилка з’єднання із сервером');
  }

  function goDashboard() {
    location.replace('/dashboard.html');
  }
  function goDashboardAccepted(id) {
    location.replace(`/dashboard.html?accepted=${encodeURIComponent(id)}`);
  }
  function fail(text) {
    if (errorText) errorText.textContent = text;
    if (errorCard) errorCard.style.display = 'block';
    setTimeout(() => goDashboard(), 1200);
  }
}

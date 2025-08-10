document.addEventListener('DOMContentLoaded', init);

async function init() {
  const params = new URLSearchParams(window.location.search);
  const dealId = params.get('dealId');

  const dealCard   = document.getElementById('deal-card');
  const authCard   = document.getElementById('auth-card');
  const errorCard  = document.getElementById('error-card');
  const errorText  = document.getElementById('error-text');
  const actions    = document.getElementById('deal-actions');
  const acceptBtn  = document.getElementById('accept-deal-btn');
  const declineBtn = document.getElementById('decline-deal-btn');
  const msg        = document.getElementById('deal-action-result');

  if (!dealId) {
    showError('Не вказано ID угоди.');
    return;
  }

  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) {
    const loginLink = document.getElementById('login-link');
    loginLink.href = `/login.html?returnUrl=${encodeURIComponent(location.href)}`;
    authCard.style.display = 'block';
    return;
  }

  let me = null, deal = null, loadErr = null;

  try {
    const [meRes, dealRes] = await Promise.all([
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/deals/${encodeURIComponent(dealId)}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const meJson   = await meRes.json().catch(()=>null);
    const dealJson = await dealRes.json().catch(()=>null);

    me   = meJson?.user || meJson?.me || null;
    deal = dealJson?.deal || null;

    if (dealJson && dealJson.success === false) {
      loadErr = dealJson.message || 'Не вдалося завантажити угоду';
    }
  } catch (e) {
    loadErr = 'Помилка з’єднання із сервером';
  }

  if (!deal) {
    showError(loadErr || 'Угоду не знайдено!');
    return;
  }

  renderDeal(deal);

  const status = (deal.status || '').toLowerCase();
  const canAcceptStatuses = ['pending', 'waiting_partner', 'pending_partner', 'pending_accept'];
  const isCreator = me && deal.creatorId && eqIds(deal.creatorId, me.id || me._id);
  const alreadyHasPartner = !!deal.partnerId && (!me || !eqIds(deal.partnerId, me.id || me._id));

  if (!isCreator && canAcceptStatuses.includes(status) && !alreadyHasPartner) {
    actions.style.display = 'flex';
  } else {
    actions.style.display = 'none';
    msg.innerHTML = `<b>Статус:</b> ${renderStatus(deal.status)}`;
  }

  acceptBtn.addEventListener('click', async () => {
    setDisabled(true);
    msg.textContent = 'Підтверджуємо…';
    try {
      const resp = await fetch(`/api/deals/${encodeURIComponent(deal._id)}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await resp.json().catch(()=>null);
      if (!json || json.success === false) throw new Error(json?.message || 'Помилка прийняття');

      msg.style.color = 'green';
      msg.textContent = 'Угоду прийнято. Переходимо до кабінету…';
      setTimeout(()=> { location.href = `/dashboard.html?accepted=${encodeURIComponent(deal._id)}`; }, 700);
    } catch (e) {
      msg.style.color = '#c00';
      msg.textContent = e.message || 'Сталася помилка';
      setDisabled(false);
    }
  });

  declineBtn.addEventListener('click', async () => {
    setDisabled(true);
    msg.textContent = 'Відхиляємо…';
    try {
      const resp = await fetch(`/api/deals/${encodeURIComponent(deal._id)}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await resp.json().catch(()=>null);
      if (!json || json.success === false) throw new Error(json?.message || 'Помилка відхилення');

      msg.style.color = '#6b4eff';
      msg.textContent = 'Угоду відхилено. Переходимо до кабінету…';
      setTimeout(()=> { location.href = `/dashboard.html`; }, 700);
    } catch (e) {
      msg.style.color = '#c00';
      msg.textContent = e.message || 'Сталася помилка';
      setDisabled(false);
    }
  });

  function showError(text) {
    errorText.textContent = text;
    errorCard.style.display = 'block';
  }

  function renderDeal(d) {
    document.getElementById('deal-title').textContent       = d.title || 'Угода';
    document.getElementById('deal-amount').textContent      = formatAmount(d.amount);
    document.getElementById('deal-description').textContent = d.description || '—';
    document.getElementById('deal-deadline').textContent    = formatDate(d.deadline);
    document.getElementById('deal-status').textContent      = renderStatus(d.status);

    document.getElementById('deal-card').style.display = 'block';
  }

  function setDisabled(disabled) {
    acceptBtn.disabled = disabled;
    declineBtn.disabled = disabled;
  }

  function eqIds(a, b) {
    const ax = (a?._id || a || '').toString();
    const bx = (b?._id || b || '').toString();
    return ax && bx && ax === bx;
  }

  function formatAmount(v) {
    const n = Number(v || 0);
    return n.toFixed(2);
  }

  function formatDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('uk-UA');
  }

  function renderStatus(s) {
    switch ((s || '').toLowerCase()) {
      case 'pending':            return 'Очікує підтвердження адміністрації';
      case 'waiting_partner':
      case 'pending_partner':
      case 'pending_accept':     return 'Очікує підтвердження партнера';
      case 'accepted':           return 'Прийнято';
      case 'confirmed':          return 'Підтверджено';
      case 'completed':          return 'Завершено';
      case 'rejected':           return 'Відхилено';
      case 'canceled':           return 'Скасовано';
      default:                   return s || '—';
    }
  }
}

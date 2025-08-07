document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const dealId = params.get('dealId');

  // 1. Перевірка dealId у посиланні
  if (!dealId) {
    document.getElementById('deal-details').innerHTML = '<b style="color:red;">Угоду не знайдено!</b>';
    return;
  }

  // 2. Перевірка чи є токен (авторизація)
  let token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  // --- якщо токену немає, не редиректи відразу, а запропонувати увійти
  if (!token) {
    document.getElementById('deal-details').innerHTML = `
      <div style="text-align:center;">
        <b style="color:red;">Щоб підтвердити угоду, увійдіть в акаунт</b><br>
        <a href="/login.html?returnUrl=${encodeURIComponent(window.location.href)}" style="color:#673ee5;font-weight:600;display:inline-block;margin-top:12px;">Увійти</a>
      </div>
    `;
    return;
  }

  // 3. Отримуємо угоду з бекенду
  let deal;
  try {
    const res = await fetch(`/api/deals/${dealId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    deal = await res.json();
  } catch (err) {
    deal = null;
  }

  // 4. Відображаємо деталі або помилку
  if (!deal || !deal._id) {
    document.getElementById('deal-details').innerHTML = '<b style="color:red;">Угоду не знайдено!</b>';
    return;
  }

  // 5. Відмальовуємо деталі угоди
  document.getElementById('deal-title').textContent = deal.title;
  document.getElementById('deal-amount').textContent = (deal.amount ?? 0).toFixed(2);
  document.getElementById('deal-description').textContent = deal.description || '—';
  document.getElementById('deal-deadline').textContent = (new Date(deal.deadline)).toLocaleDateString('uk');

  // 6. Якщо угода вже не pending (наприклад, вже прийнята чи відхилена), приховати кнопки:
  if (deal.status !== 'pending' && deal.status !== 'waiting_partner') {
    document.getElementById('accept-deal-btn').style.display = 'none';
    document.getElementById('decline-deal-btn').style.display = 'none';
    document.getElementById('deal-action-result').innerHTML = `<b>Статус: </b> ${renderStatus(deal.status)}`;
  }

  // 7. Обробник "Прийняти"
  document.getElementById('accept-deal-btn').onclick = async () => {
    setButtonsDisabled(true);
    const resp = await fetch(`/api/deals/${dealId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).catch(() => null);

    if (resp && resp.success) {
      document.getElementById('deal-action-result').textContent = 'Ви прийняли угоду. Перейдіть у кабінет.';
      setTimeout(() => window.location.href = '/dashboard.html', 1400);
    } else {
      document.getElementById('deal-action-result').textContent = resp?.message || 'Сталася помилка';
      setButtonsDisabled(false);
    }
  };

  // 8. Обробник "Відхилити"
  document.getElementById('decline-deal-btn').onclick = async () => {
    setButtonsDisabled(true);
    const resp = await fetch(`/api/deals/${dealId}/decline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).catch(() => null);

    if (resp && resp.success) {
      document.getElementById('deal-action-result').textContent = 'Ви відхилили угоду.';
      setTimeout(() => window.location.href = '/dashboard.html', 1400);
    } else {
      document.getElementById('deal-action-result').textContent = resp?.message || 'Сталася помилка';
      setButtonsDisabled(false);
    }
  };

  // 9. Хелпер для статусу
  function renderStatus(s) {
    switch (s) {
      case 'pending': return 'Очікує підтвердження адміністрації';
      case 'accepted': return 'Прийнято';
      case 'rejected': return 'Відхилено';
      case 'confirmed': return 'Підтверджено';
      case 'completed': return 'Завершено';
      case 'canceled': return 'Скасовано';
      case 'waiting_partner': return 'Запитано партнера';
      default: return s;
    }
  }

  function setButtonsDisabled(disabled) {
    document.getElementById('accept-deal-btn').disabled = disabled;
    document.getElementById('decline-deal-btn').disabled = disabled;
  }
});

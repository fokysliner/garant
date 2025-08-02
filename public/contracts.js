document.addEventListener('DOMContentLoaded', () => {
  const dealId = window.location.pathname.split('/').pop();
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  // 1. Отримати угоду по ID
  fetch(`/api/deals/${dealId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(deal => {
      if (!deal || !deal._id) {
        document.getElementById('deal-details').innerHTML = '<b style="color:red;">Угоду не знайдено!</b>';
        return;
      }
      document.getElementById('deal-title').textContent = deal.title;
      document.getElementById('deal-amount').textContent = deal.amount;
      document.getElementById('deal-description').textContent = deal.description || '—';
      document.getElementById('deal-deadline').textContent = (new Date(deal.deadline)).toLocaleDateString('uk');
    });

  // 2. Прийняти
  document.getElementById('accept-deal-btn').onclick = () => {
    fetch(`/api/deals/${dealId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resp => {
        document.getElementById('deal-action-result').textContent =
          resp.success ? 'Ви прийняли угоду. Перейдіть у кабінет.' : (resp.message || 'Сталася помилка');
        if (resp.success) setTimeout(() => window.location.href = '/dashboard.html', 1500);
      });
  };

  // 3. Відхилити
  document.getElementById('decline-deal-btn').onclick = () => {
    fetch(`/api/deals/${dealId}/decline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resp => {
        document.getElementById('deal-action-result').textContent =
          resp.success ? 'Ви відхилили угоду.' : (resp.message || 'Сталася помилка');
        if (resp.success) setTimeout(() => window.location.href = '/dashboard.html', 1500);
      });
  };
});

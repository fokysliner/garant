document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const dealId = params.get('dealId');
  if (!dealId) {
    document.getElementById('deal-details').innerHTML = '<b style="color:red;">Угоду не знайдено!</b>';
    return;
  }

  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login.html?returnUrl=' + encodeURIComponent(window.location.href);
    return;
  }

  fetch(`/api/deals/${dealId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(resp => {
      // Якщо API повертає {deal: {...}}
      const deal = resp.deal || resp;
      if (!deal || !deal._id) {
        document.getElementById('deal-details').innerHTML = '<b style="color:red;">Угоду не знайдено!</b>';
        return;
      }
      document.getElementById('deal-title').textContent = deal.title;
      document.getElementById('deal-amount').textContent = deal.amount;
      document.getElementById('deal-description').textContent = deal.description || '—';
      document.getElementById('deal-deadline').textContent = (new Date(deal.deadline)).toLocaleDateString('uk');
    });

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

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('uk', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

let usersData = [];

fetch('/api/admin/users')
.then(res => {
  if (!res.ok) {
    console.error('Помилка HTTP:', res.status, res.statusText);
    throw new Error('Помилка завантаження користувачів');
  }
  return res.json();
})
.then(data => {
  usersData = data.users || [];
  renderUsers(usersData);
})
.catch(err => {
  console.error('Fetch error:', err);
  const tbody = document.querySelector('#users-table tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Не вдалося завантажити користувачів</td></tr>';
});

function renderUsers(users) {
  const tbody = document.querySelector('#users-table tbody');
  tbody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user._id}</td>
      <td>${user.firstName || ''} ${user.lastName || ''}</td>
      <td>${user.email}</td>
      <td>${user.role || 'user'}</td>
      <td>${formatDate(user.createdAt)}</td>
    `;
    tr.onclick = () => selectUser(user, tr);
    tbody.appendChild(tr);
  });
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Користувачів не знайдено</td></tr>';
  }
}

function selectUser(user, tr) {
  document.querySelectorAll('#users-table tr').forEach(r => r.classList.remove('selected'));
  tr.classList.add('selected');
  openUserModal(user);
}

function openUserModal(user) {
  const oldModal = document.querySelector('.modal-backdrop');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-content" style="min-width:350px;max-width:98vw;">
      <button class="modal-close" title="Закрити">&times;</button>
      <div style="display:flex;gap:8px;margin-bottom:18px;">
        <button class="btn-outline tab-btn active" data-tab="user">Користувач</button>
        <button class="btn-outline tab-btn" data-tab="deals">Угоди користувача</button>
      </div>
      <div id="user-tab" class="tab-content active"></div>
      <div id="deals-tab" class="tab-content" style="display:none;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.modal-close').onclick = () => modal.remove();

  document.getElementById('user-tab').innerHTML = `
    <form id="edit-user-form">
      <label class="form-label">Ім'я</label>
      <input type="text" id="edit-firstname" value="${user.firstName || ''}" />
      <label class="form-label">Прізвище</label>
      <input type="text" id="edit-lastname" value="${user.lastName || ''}" />
      <label class="form-label">Email</label>
      <input type="email" id="edit-email" value="${user.email}" />
      <label class="form-label">Роль</label>
      <input type="text" id="edit-role" value="${user.role || 'user'}" />
      <div style="margin-bottom: 12px;">
        <label class="form-label">Баланс</label>
        <span id="user-balance" style="font-weight:700; color:#6b32c4;">${typeof user.balance === "number" ? user.balance.toFixed(2) : "0.00"} UAH</span>
        <button type="button" class="btn-outline" id="edit-balance-btn" style="margin-left:12px;">Редагувати баланс</button>
      </div>
      <div id="balance-edit-row" style="margin-top:12px;display:none;">
        <input type="number" step="0.01" min="0" id="new-balance-input" placeholder="Введіть новий баланс" style="width:140px;"/>
        <button type="button" class="btn-primary" id="save-balance-btn">Зберегти баланс</button>
        <button type="button" class="btn-outline" id="cancel-balance-btn">Скасувати</button>
      </div>
      <div class="modal-actions">
        <button type="submit" class="btn-primary">Зберегти</button>
        <button type="button" class="btn-outline modal-close"></button>
      </div>
    </form>
  `;

  document.getElementById('edit-balance-btn').onclick = function() {
    document.getElementById('balance-edit-row').style.display = 'block';
    document.getElementById('new-balance-input').value = user.balance || 0;
  };

  document.getElementById('cancel-balance-btn').onclick = function() {
    document.getElementById('balance-edit-row').style.display = 'none';
  };

document.getElementById('save-balance-btn').onclick = function() {
  const val = parseFloat(document.getElementById('new-balance-input').value.replace(',', '.'));
  if (isNaN(val) || val < 0) {
    document.getElementById('new-balance-input').style.border = '1.5px solid #e24343';
    setTimeout(() => document.getElementById('new-balance-input').style.border = '', 1400);
    return;
  }
  fetch(`/api/admin/user/${user._id}/set-balance`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newBalance: val })
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.success) {
      user.balance = val;
      document.getElementById('user-balance').textContent = val.toFixed(2) + " UAH";
      document.getElementById('balance-edit-row').style.display = 'none';
    } else {
      alert('Помилка при збереженні балансу');
    }
  })
  .catch(() => {
    alert('Помилка при збереженні балансу');
  });
};

  document.getElementById('edit-user-form').onsubmit = function(e) {
    e.preventDefault();
    const data = {
      firstName: document.getElementById('edit-firstname').value.trim(),
      lastName: document.getElementById('edit-lastname').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      role: document.getElementById('edit-role').value.trim(),
    };
    fetch(`/api/admin/user/${user._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(resp => {
      modal.remove();
      Object.assign(user, data);
      renderUsers(usersData);
    })
    .catch(() => {
      alert('Помилка збереження');
    });
  };

  const dealsTab = document.getElementById('deals-tab');
  dealsTab.innerHTML = `<div style="color:#7b37e9; margin-top:24px;">Завантаження угод...</div>`;
fetch('/api/admin/deals')
    .then(r => r.json())
    .then(data => {
      const deals = data.deals || [];
      if (!deals.length) {
        dealsTab.innerHTML = `<div style="color:#aaa; margin-top:24px;">У користувача немає угод</div>`;
        return;
      }
      dealsTab.innerHTML = deals.map(deal => `
          <div class="deal-item-admin">
          <div style="font-weight:600; font-size:1.1rem; margin-bottom:6px;">${deal.title || 'Угода'}</div>
          <div><b>Статус:</b> 
            <select data-deal-id="${deal._id}" class="deal-status-select" style="margin-left:8px;">
              ${renderDealStatusOptions(deal.status)}
            </select>
            <button class="btn-outline save-status-btn" data-deal-id="${deal._id}" style="margin-left:10px; padding:3px 12px;">Зберегти</button>
          </div>
          <div><b>Сума:</b> ${deal.amount} UAH</div>
          <div><b>Комісія:</b> ${deal.fee} UAH (${deal.commissionPayer === 'me' ? 'Я' : deal.commissionPayer === 'partner' ? 'Партнер' : '50/50'})</div>
          <div><b>Тип:</b> ${deal.type === 'individual' ? 'Фізична особа' : 'Компанія'}</div>
          <div><b>Роль:</b> ${deal.role === 'buyer' ? 'Покупець' : 'Продавець'}</div>
          <div><b>Строк виконання:</b> ${formatDate(deal.deadline)}</div>
          <div><b>Опис:</b> <span style="color:#7b37e9">${deal.description || '—'}</span></div>
        </div>
      `).join('');
    });

  modal.addEventListener('click', function(e) {
    if (e.target.classList.contains('save-status-btn')) {
      const dealId = e.target.getAttribute('data-deal-id');
      const select = modal.querySelector(`select[data-deal-id="${dealId}"]`);
      const newStatus = select.value;
      fetch(`/api/admin/deal/${dealId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      .then(r => r.json())
      .then(resp => {
        alert('Статус змінено!');
        e.target.disabled = true;
        setTimeout(() => { e.target.disabled = false; }, 1200);
      })
      .catch(() => {
        alert('Не вдалося змінити статус');
      });
    }
  });

  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      modal.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
      if (btn.dataset.tab === 'user') document.getElementById('user-tab').style.display = '';
      else document.getElementById('deals-tab').style.display = '';
    }
  });
}


function renderDealStatusOptions(current) {
  const statuses = [
    { key: 'pending', label: 'Очікує підтвердження адміністрації' },
    { key: 'accepted', label: 'Прийнято' },
    { key: 'rejected', label: 'Відхилено' },
    { key: 'confirmed', label: 'Підтверджено' },
    { key: 'completed', label: 'Завершено' },
    { key: 'canceled', label: 'Скасовано' },
    { key: 'waiting_partner', label: 'Запитано партнера' },
  ];
  return statuses.map(s => `<option value="${s.key}"${s.key === current ? ' selected' : ''}>${s.label}</option>`).join('');
}

let currentUserId = null;

async function loadChatUsers() {
  const res = await fetch('/api/chat/all-users');
  const users = await res.json();
  const list = document.getElementById('admin-users-list');
  list.innerHTML = users.map(u => 
    `<div class="chat-user" data-id="${u._id}">
      <b>${u.userName || u._id}</b>
    </div>`
  ).join('');
  document.querySelectorAll('.chat-user').forEach(div => {
    div.onclick = () => {
      currentUserId = div.dataset.id;
      document.getElementById('admin-chat-header').innerText = div.innerText;
      document.getElementById('admin-chat-window').style.display = 'block';
      document.querySelectorAll('.chat-user').forEach(d => d.classList.remove('active'));
      div.classList.add('active');
      loadAdminChat(currentUserId);
    };
  });
}

async function loadAdminChat(userId) {
  const res = await fetch(`/api/chat/${userId}`);
  const messages = await res.json();
  const body = document.getElementById('admin-chat-body');
  body.innerHTML = messages.length
    ? messages.map(msg => 
        `<div class="${msg.isAdmin ? 'admin-message' : 'user-message'}">
          <b>${msg.isAdmin ? 'Ви' : (msg.userName || 'Користувач')}:</b> ${msg.message}
        </div>`
      ).join('')
    : '<div style="color:#aaa;text-align:center;margin:16px 0;">Немає повідомлень</div>';
  body.scrollTop = body.scrollHeight;
}

document.getElementById('admin-chat-form').onsubmit = async e => {
  e.preventDefault();
  const input = document.getElementById('admin-chat-input');
  const msg = input.value.trim();
  if (!msg || !currentUserId) return;
  await fetch('/api/chat', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId: currentUserId, userName: 'Адмін', message: msg, isAdmin: true })
  });
  input.value = '';
  loadAdminChat(currentUserId);
};

loadChatUsers();
setInterval(() => { if (currentUserId) loadAdminChat(currentUserId); }, 3000);

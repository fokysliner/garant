const API_BASE = 'https://grandgarant.online'; 

let token;

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) return window.location.href = '/index.html';


  const personBtn = document.getElementById('person-btn');
  const companyBtn = document.getElementById('company-btn');
  const amountInput = document.getElementById('topup-amount');
  const invoiceModal = document.getElementById('invoice-modal');

  let deals = [];


fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(user => {
    if (!user || !user.firstName) return;

    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;

    localStorage.setItem('userId', user._id); 
    console.log('USER ID set in localStorage:', user._id);
    localStorage.setItem('chatId', user._id);  
loadChatHistory();
setInterval(loadChatHistory, 3000);

    const balance = user.balance || 0;
    const locked = user.lockedBalance || 0; 
    document.getElementById('balance-available').innerHTML = `${balance.toFixed(2)} <span class="uah">UAH</span>`;
    document.getElementById('balance-locked').innerHTML = `${locked.toFixed(2)} <span class="uah">UAH</span>`;
  })
  .catch(error => {
    console.error('Error fetching user data:', error);
  });



  const createDealBtn = document.getElementById('create-deal-btn');
  if (createDealBtn) {
    createDealBtn.addEventListener('click', () => {
      window.location.href = 'create-deal.html';
    });
  }


  fetch('/api/deals', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(json => {
      if (!json.success || !json.deals || json.deals.length === 0) {
        renderDeals([]);
        return;
      }
      deals = json.deals;
      renderDeals(deals);
    })
    .catch(error => {
      console.error('Error fetching deals:', error);
      renderDeals([]);
    });


  function renderDeals(dealsArr) {
    const list = document.querySelector('#deals .deals-list');
    list.innerHTML = '';
    if (!dealsArr || dealsArr.length === 0) {
      list.innerHTML = '<div class="deals-empty">У вас ще немає угод за обраними критеріями</div>';
      return;
    }
    dealsArr.forEach(deal => {
      const el = document.createElement('div');
      el.className = 'deal-item';
      el.dataset.id = deal._id;
      el.innerHTML = `
        <div class="deal-header">
          <span class="deal-title">${deal.title}</span>
          <span class="deal-deadline">до ${new Date(deal.deadline).toLocaleDateString('uk')}</span>
          <span class="deal-status">${renderStatus(deal.status)}</span>
        </div>
        <div class="deal-body">
          <div>Сума: ${deal.amount.toFixed(2)} UAH</div>
          <div>Комісія: ${deal.fee.toFixed(2)} UAH (${deal.commissionPayer === 'me' ? 'Я' : deal.commissionPayer === 'partner' ? 'Партнер' : '50/50'})</div>
        </div>
      `;
      list.appendChild(el);
    });
  }


  document.querySelector('.deals-list').addEventListener('click', function(e) {
    const item = e.target.closest('.deal-item');
    if (!item) return;

    document.querySelectorAll('.deal-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const deal = deals.find(d => d._id === item.dataset.id);
    console.log('DEAL:', deal);
    if (!deal) return;

    document.getElementById('deal-modal-title').textContent = deal.title || "Деталі угоди";
    document.getElementById('deal-modal-body').innerHTML = `
      <b>Статус:</b> ${renderStatus(deal.status)}<br>
      <b>Сума:</b> ${deal.amount.toFixed(2)} UAH<br>
      <b>Комісія:</b> ${deal.fee.toFixed(2)} UAH (${deal.commissionPayer === 'partner' ? 'Партнер' : deal.commissionPayer === 'me' ? 'Я' : '50/50'})<br>
      <b>Тип:</b> ${deal.type === 'individual' ? 'Фізична особа' : 'Компанія'}<br>
      <b>Роль:</b> ${deal.role === 'buyer' ? 'Покупець' : 'Продавець'}<br>
      <b>Строк виконання:</b> ${new Date(deal.deadline).toLocaleDateString('uk')}<br>
      <b>Опис угоди:</b> <span style="color:#7b37e9; white-space:pre-line">${deal.description ? escapeHtml(deal.description) : '—'}</span>

    `;
    document.getElementById('deal-modal').style.display = 'block';
  });

  document.getElementById('deal-modal-close').onclick = () => {
    document.getElementById('deal-modal').style.display = 'none';
  };


  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab, .content').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'history') {
        loadHistory();
      }
      if (tab.dataset.tab === 'profile') {
        loadProfileData();
      }
    });
  });


  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.replace('index.html');
  });


  document.getElementById('history-date-from').value = new Date(Date.now() - 2592000000).toISOString().split('T')[0];
  document.getElementById('history-date-to').value = new Date().toISOString().split('T')[0];

  document.getElementById('history-show-btn').addEventListener('click', function() {
    loadHistory();
  });

  function loadHistory() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const account = document.getElementById('history-account').value;
    const currency = document.getElementById('history-currency').value;
    const dateFrom = document.getElementById('history-date-from').value;
    const dateTo = document.getElementById('history-date-to').value;

    const params = new URLSearchParams({
      account, currency, dateFrom, dateTo
    }).toString();

    fetch(`/api/history?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(json => {
        renderHistory(json.operations || []);
      })
      .catch(err => {
        renderHistory([]);
      });
  }

  function renderHistory(ops) {
    const list = document.querySelector('.history-list');
    if (!ops.length) {
      list.innerHTML = `<div class="history-empty" style="color:#8c5cff; text-align:center; margin: 24px 0 0 0;">Відсутні операції по критеріям пошуку</div>`;
      return;
    }
    let html = `<table class="history-table"><tr>
      <th>Дата</th><th>Тип</th><th>Сума</th><th>Валюта</th><th>Статус</th>
    </tr>`;
    ops.forEach(op => {
      html += `<tr>
        <td>${new Date(op.date).toLocaleDateString('uk')}</td>
        <td>${renderOpType(op.type)}</td>
        <td>${op.amount.toFixed(2)}</td>
        <td>${op.currency}</td>
        <td>${renderOpStatus(op.status)}</td>
      </tr>`;
    });
    html += `</table>`;
    list.innerHTML = html;
  }

  function renderOpType(type) {
    switch(type) {
      case 'in': return 'Поповнення';
      case 'out': return 'Вивід';
      case 'transfer': return 'Переказ';
      default: return type;
    }
  }
  function renderOpStatus(status) {
    switch(status) {
      case 'success': return 'Успішно';
      case 'pending': return 'В обробці';
      case 'failed': return 'Відхилено';
      default: return status;
    }
  }


  function loadProfileData() {
    fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(user => {
        document.getElementById('profile-name').textContent = `${user.firstName || '-'} ${user.lastName || ''}`;
        document.getElementById('profile-city').textContent = user.city || '-';
        document.getElementById('profile-phone').textContent = user.phone || '-';
        document.getElementById('profile-email').textContent = user.email || '-';
      })
      .catch(() => {
        document.getElementById('profile-name').textContent = 'Немає даних';
        document.getElementById('profile-city').textContent = '-';
        document.getElementById('profile-phone').textContent = '-';
        document.getElementById('profile-email').textContent = '-';
      });
  }


  let profileEditMode = false;

  document.getElementById('profile-edit-btn').addEventListener('click', function() {
    if (profileEditMode) return;
    profileEditMode = true;

    const name = document.getElementById('profile-name').textContent.trim().split(' ');
    const city = document.getElementById('profile-city').textContent.trim();
    const phone = document.getElementById('profile-phone').textContent.trim();
    const email = document.getElementById('profile-email').textContent.trim();

    document.getElementById('profile-card').innerHTML = `
      <form id="profile-edit-form" style="padding:30px 26px 18px 26px;">
        <input type="text" id="edit-firstname" placeholder="Ім'я" value="${name[0] || ''}" required style="width:100%;margin-bottom:10px;padding:8px;">
        <input type="text" id="edit-lastname" placeholder="Прізвище" value="${name[1] || ''}" required style="width:100%;margin-bottom:10px;padding:8px;">
        <input type="text" id="edit-city" placeholder="Місто" value="${city}" style="width:100%;margin-bottom:10px;padding:8px;">
        <input type="text" id="edit-phone" placeholder="Телефон" value="${phone}" style="width:100%;margin-bottom:10px;padding:8px;">
        <input type="email" id="edit-email" placeholder="Email" value="${email}" required style="width:100%;margin-bottom:20px;padding:8px;">
        <div style="display:flex;gap:14px;">
          <button type="submit" class="btn-primary" style="flex:1;">Зберегти</button>
          <button type="button" id="profile-cancel-btn" class="btn-outline" style="flex:1;">Скасувати</button>
        </div>
      </form>
    `;

    document.getElementById('profile-edit-form').onsubmit = function(e) {
      e.preventDefault();
      const data = {
        firstName: document.getElementById('edit-firstname').value.trim(),
        lastName:  document.getElementById('edit-lastname').value.trim(),
        city:      document.getElementById('edit-city').value.trim(),
        phone:     document.getElementById('edit-phone').value.trim(),
        email:     document.getElementById('edit-email').value.trim(),
      };
      fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      })
        .then(r => r.json())
        .then(json => {
          profileEditMode = false;
          loadProfileData();
        })
        .catch(() => {
          alert('Помилка при збереженні');
          profileEditMode = false;
          loadProfileData();
        });
    };

    document.getElementById('profile-cancel-btn').onclick = function() {
      profileEditMode = false;
      loadProfileData();
    };
  });

 
  document.getElementById('support-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const topic = document.getElementById('support-topic').value;
    const message = document.getElementById('support-message').value.trim();
    if (!topic || !message) return;

    fetch('/api/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ topic, message })
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          document.getElementById('support-success').textContent = 'Звернення надіслано!';
          document.getElementById('support-success').style.display = 'block';
          document.getElementById('support-form').reset();
          loadSupportList();
        }
      });
  });


  function loadSupportList() {
    fetch('/api/support', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(json => {
        const listDiv = document.getElementById('support-list');
        if (!json.list.length) {
          listDiv.innerHTML = '<div>Немає звернень.</div>';
          return;
        }
        listDiv.innerHTML = json.list.map(s =>
          `<div style="margin-bottom:10px; padding:10px; border:1px solid #eee; border-radius:6px;">
            <b>Тема:</b> ${s.topic}<br>
            <b>Текст:</b> ${s.message}<br>
            <small style="color: #888;">${new Date(s.createdAt).toLocaleString('uk')}</small>
          </div>`
        ).join('');
      });
  }


  document.getElementById('topup-btn').onclick = () => {
    document.getElementById('topup-modal').style.display = 'flex';
  };
  document.getElementById('topup-close').onclick = () => {
    document.getElementById('topup-modal').style.display = 'none';
  };
  personBtn.onclick = function() {
    personBtn.classList.add('active');
    companyBtn.classList.remove('active');
  };
  companyBtn.onclick = function() {
    companyBtn.classList.add('active');
    personBtn.classList.remove('active');
  };


  document.querySelectorAll('.topup-method .btn-primary').forEach(btn => {
    btn.onclick = function(e) {
      const method = this.getAttribute('data-type');
      if (personBtn.classList.contains('active')) {
        const amount = parseFloat(amountInput.value.replace(',', '.'));
        if (!amount || amount < 1) {
          amountInput.focus();
          amountInput.style.border = '1.5px solid #e24343';
          setTimeout(() => amountInput.style.border = '', 1500);
          e.preventDefault();
          return;
        }
        showInvoiceModal(method, amount);
      } else {
        showInvoiceModal(method, '—');
      }
    };
  });

  function showInvoiceModal(method, amount) {
    
    let html = '';
    if (method === 'bank') {
      html = `
        <div style="text-align:right;"><button onclick="window.print()" class="btn-primary" style="margin-bottom:8px;">Роздрукувати документ</button></div>
        <h2 style="margin: 12px 0 8px 0;">Рахунок на оплату</h2>
        <div style="color:#222; margin-bottom:10px;">
          до договору про надання послуг <b>#1001420</b> від 01.08.2025
        </div>
        <table style="margin-bottom:12px;">
          <tr>
            <td style="vertical-align:top; padding-right:32px;">
              <div style="margin-bottom:7px;"><b>Отримувач платежу:</b> ФОП "Керімов Ібрагім Шахін Огли "</div>
              <div>Код отримувача: 3872508737</div>
              <div>Рахунок одержувача у формі IBAN: UA093052990000026000036010807</div>
              <div>МФО: 305299</div>
              <div>Банк: АТ КБ "Приватбанк"</div>
            </td>
            <td style="vertical-align:top;">
              <div><b>Платник:</b> Антон Агап</div>
            </td>
          </tr>
        </table>
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
          <tr style="background:#f3effc;">
            <th style="border:1px solid #eee; padding:7px;">№</th>
            <th style="border:1px solid #eee; padding:7px;">Призначення платежу</th>
            <th style="border:1px solid #eee; padding:7px;">Валюта</th>
            <th style="border:1px solid #eee; padding:7px;">Сума</th>
          </tr>
          <tr>
            <td style="border:1px solid #eee; padding:7px;">1</td>
            <td style="border:1px solid #eee; padding:7px;">Оплата за послуги . Без ПДВ</td>
            <td style="border:1px solid #eee; padding:7px;">UAH</td>
            <td style="border:1px solid #eee; padding:7px;">${amount}</td>
          </tr>
        </table>
        <div style="color:#888; margin-top:10px;">
          <b>Важливо:</b> Обов'язково вкажіть в призначенні платежу "Оплата за послуги".
        </div>
      `;
    } else if (method === 'cash') {
      html = `
        <div style="text-align:right;"><button onclick="window.print()" class="btn-primary" style="margin-bottom:8px;">Роздрукувати квитанцію</button></div>
        <h2 style="margin: 12px 0 8px 0;">Квитанція на поповнення рахунку</h2>
        <div style="color:#222; margin-bottom:10px;">
          Ви можете оплатити рахунок готівкою в будь-якому відділенні банку.<br>
          Після оплати кошти будуть зараховані на ваш рахунок протягом 1-2 банківських днів.
        </div>
        <table style="margin-bottom:12px;">
          <tr>
            <td style="vertical-align:top; padding-right:32px;">
              <div style="margin-bottom:7px;"><b>Отримувач:</b>ФОП "Керімов Ібрагім Шахін Огли "</div>
              <div>Код отримувача: 3872508737</div>
              <div>Рахунок одержувача у формі IBAN: UA093052990000026000036010807</div>
              <div>МФО: 305299</div>
              <div>Банк: АТ КБ "Приватбанк"</div>
            </td>
          </tr>
        </table>
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
          <tr style="background:#f3effc;">
            <th style="border:1px solid #eee; padding:7px;">Призначення</th>
            <th style="border:1px solid #eee; padding:7px;">Сума (UAH)</th>
          </tr>
          <tr>
            <td style="border:1px solid #eee; padding:7px;">Поповнення рахунку ID1001420001</td>
            <td style="border:1px solid #eee; padding:7px;">${amount}</td>
          </tr>
        </table>
        <div style="color:#888; margin-top:10px;">
          <b>Важливо:</b> Збережіть квитанцію до зарахування коштів.
        </div>
      `;
    } else if (method === 'card') {
      html = `
        <div style="text-align:right;"><button onclick="window.print()" class="btn-primary" style="margin-bottom:8px;">Роздрукувати підтвердження</button></div>
        <h2 style="margin: 12px 0 8px 0;">Переказ з картки</h2>
        <div style="color:#222; margin-bottom:10px;">
          Здійсніть миттєву оплату з банківської картки (Visa, MasterCard).
         <div>  Картка для переказу коштів: 4444653284515524. </div>
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
          <tr style="background:#f3effc;">
            <th style="border:1px solid #eee; padding:7px;">Опис</th>
            <th style="border:1px solid #eee; padding:7px;">Сума (UAH)</th>
          </tr>
          <tr>
            <td style="border:1px solid #eee; padding:7px;">Поповнення особистого рахунку через картку</td>
            <td style="border:1px solid #eee; padding:7px;">${amount}</td>
          </tr>
        </table>
        <div style="color:#888; margin-top:10px;">
          <b>Комісія:</b> 2.7% буде додана до суми платежу.
        </div>
        <div style="margin-top:12px;">
          <button class="btn-primary" onclick="window.open('https://yourpaylink.com', '_blank')">Перейти до оплати</button>
        </div>
      `;
    } else {
      html = `<div>Невідомий спосіб поповнення.</div>`;
    }

    document.getElementById('invoice-content').innerHTML = html;
    invoiceModal.style.display = 'flex';
  }


  document.getElementById('invoice-close').onclick = function() {
    invoiceModal.style.display = 'none';
  };

}); 


function renderStatus(s) {
  switch (s) {
    case 'pending': return 'Очікує підтвердження адміністації';
    case 'accepted': return 'Прийнято';
    case 'rejected': return 'Відхилено';
    case 'confirmed': return 'Підтверджено';
    case 'completed': return 'Завершено';
    case 'canceled': return 'Скасовано';
    case 'waiting_partner': return 'Запитано партнера';
    default: return s;
  }
}


document.getElementById('withdraw-btn').onclick = () => {
  document.getElementById('withdraw-modal').style.display = 'flex';
};
document.getElementById('withdraw-close').onclick = () => {
  document.getElementById('withdraw-modal').style.display = 'none';
};


const withdrawPersonBtn = document.getElementById('withdraw-person-btn');
const withdrawCompanyBtn = document.getElementById('withdraw-company-btn');
const cardRow = document.getElementById('withdraw-card-row');
const companyRow = document.getElementById('withdraw-company-row');

withdrawPersonBtn.onclick = function() {
  this.classList.add('active');
  withdrawCompanyBtn.classList.remove('active');
  cardRow.style.display = '';
  companyRow.style.display = 'none';
};
withdrawCompanyBtn.onclick = function() {
  this.classList.add('active');
  withdrawPersonBtn.classList.remove('active');
  cardRow.style.display = 'none';
  companyRow.style.display = '';
};


document.getElementById('withdraw-confirm-btn').onclick = function() {
  const amount = parseFloat(document.getElementById('withdraw-amount').value.replace(',', '.'));
  let error = '';
  
  if (!amount || amount < 1) {
    error = 'Вкажіть суму для виводу (не менше 1 грн)';
    document.getElementById('withdraw-amount').style.border = '1.5px solid #e24343';
    setTimeout(() => document.getElementById('withdraw-amount').style.border = '', 1500);
  }

  if (withdrawPersonBtn.classList.contains('active')) {
    const card = document.getElementById('withdraw-card').value.trim();
    if (!card || card.length < 12) {
      error = 'Вкажіть коректний номер картки';
      document.getElementById('withdraw-card').style.border = '1.5px solid #e24343';
      setTimeout(() => document.getElementById('withdraw-card').style.border = '', 1500);
    }

  } else {
    const iban = document.getElementById('withdraw-iban').value.trim();
    const mfo = document.getElementById('withdraw-mfo').value.trim();
    if (!iban || iban.length < 10) {
      error = 'Вкажіть коректний IBAN';
      document.getElementById('withdraw-iban').style.border = '1.5px solid #e24343';
      setTimeout(() => document.getElementById('withdraw-iban').style.border = '', 1500);
    }
    if (!mfo) {
      error = 'Вкажіть МФО / SWIFT';
      document.getElementById('withdraw-mfo').style.border = '1.5px solid #e24343';
      setTimeout(() => document.getElementById('withdraw-mfo').style.border = '', 1500);
    }
  }

  if (error) {
    document.getElementById('withdraw-success').style.display = 'none';
    document.getElementById('withdraw-success').textContent = '';
    return;
  }


  document.getElementById('withdraw-success').textContent = 'Заявка на вивід створена!';
  document.getElementById('withdraw-success').style.display = 'block';
  setTimeout(() => {
    document.getElementById('withdraw-modal').style.display = 'none';
    document.getElementById('withdraw-success').style.display = 'none';
    document.getElementById('withdraw-amount').value = '';
    document.getElementById('withdraw-card').value = '';
    document.getElementById('withdraw-iban').value = '';
    document.getElementById('withdraw-mfo').value = '';
  }, 1700);
};

const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('deal-search');


filterBtns.forEach(btn => {
  btn.onclick = function() {
    filterBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    filterAndRenderDeals();
  }
});


searchInput.oninput = function() {
  filterAndRenderDeals();
};

function filterAndRenderDeals() {
  const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
  const searchTerm = searchInput.value.trim().toLowerCase();

  let filtered = deals;

if (activeFilter === 'active') {
  filtered = deals.filter(d =>
    d.status === 'pending' ||
    d.status === 'accepted' ||
    d.status === 'confirmed'
  );
} else if (activeFilter === 'completed') {
  filtered = deals.filter(d => d.status === 'completed' || d.status === 'canceled');
}


  if (searchTerm) {
    filtered = filtered.filter(d =>
      (d.title && d.title.toLowerCase().includes(searchTerm)) ||
      (d._id && d._id.toLowerCase().includes(searchTerm))
    );
  }

  renderDeals(filtered);
}
// --- Чат підтримки (коректна версія) ---

const supportChatBtn    = document.getElementById('support-chat-btn');
const supportChatWindow = document.getElementById('support-chat-window');
const supportChatClose  = document.getElementById('support-chat-close');
const supportChatForm   = document.getElementById('support-chat-form');
const supportChatInput  = document.getElementById('support-chat-input');
const supportChatBody   = document.getElementById('support-chat-body');

// Відкрити чат
supportChatBtn.onclick = () => {
  supportChatWindow.style.display = 'flex';
  setTimeout(() => supportChatInput.focus(), 300);
};
// Закрити чат
supportChatClose.onclick = () => {
  supportChatWindow.style.display = 'none';
};

// Надсилання повідомлення
supportChatForm.addEventListener('submit', async e => {
  e.preventDefault();
  const msg      = supportChatInput.value.trim();
  if (!msg) return;
  const userId   = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Клієнт';
  const chatId   = localStorage.getItem('chatId');
  if (!userId || !chatId) return alert('Не визначено userId або chatId.');

  await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ chatId, userId, userName, message: msg, isAdmin: false })
  });
  supportChatInput.value = '';
  loadChatHistory();
});

// Завантаження історії чату
async function loadChatHistory() {
  const chatId = localStorage.getItem('chatId');
  if (!chatId) return;
  const res = await fetch(`${API_BASE}/api/chat/${chatId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const messages = await res.json();
  supportChatBody.innerHTML = '';
  messages.forEach(m => {
    supportChatBody.innerHTML += `
      <div class="${m.isAdmin ? 'admin-message' : 'user-message'}">
        <b>${m.isAdmin ? 'Адміністратор' : (m.userName || 'Ви')}:</b> ${m.message}
      </div>`;
  });
}

// --- ЄДИНЕ МІСЦЕ, де треба ставити userName ---
fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(user => {
    if (!user || !user.firstName) return;

    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
    localStorage.setItem('userId', user._id);
    localStorage.setItem('userName', `${user.firstName} ${user.lastName}`); // Додаєш userName!
    localStorage.setItem('chatId', user._id);
    loadChatHistory();
    setInterval(loadChatHistory, 3000);
  });

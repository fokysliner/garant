function setStep(step) {
  const step1Block = document.querySelector('.step1-only');
  if (step1Block) step1Block.style.display = (step === 1) ? '' : 'none';
  document.getElementById('deal-form').style.display    = (step === 1) ? 'block' : 'none';
  document.getElementById('deal-success').style.display = (step === 2) ? 'block' : 'none';
  document.getElementById('deal-final').style.display   = (step === 3) ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  setStep(1);

  const titleInput = document.getElementById('deal-title');
  const countLabel = document.querySelector('.char-count');
  titleInput.addEventListener('input', () => {
    const left = 50 - titleInput.value.length;
    countLabel.textContent = `Залишилось ${left} символів`;
  });

  const amountInput = document.getElementById('deal-amount');
  const commLabel = document.querySelector('.commission');
  amountInput.addEventListener('input', () => {
    const amt = parseFloat(amountInput.value) || 0;
    const fee = (amt * 0.10).toFixed(2);
    commLabel.textContent = `Комісія становитиме ${fee} UAH`;
  });

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.parentNode;
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const cancelBtn = document.querySelector('.btn.cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  const nextBtn = document.querySelector('.btn.next');
  const form = document.getElementById('deal-form');
  if (nextBtn && form) {
    nextBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      
      const title = form.elements['title'].value.trim();
      const amount = parseFloat(form.elements['amount'].value);
      const deadline = form.elements['deadline'].value;

      const role = document.querySelector('.toggle-group .toggle-btn.active[data-target="buyer"]') ? "buyer" : "seller";
      const type = document.querySelector('.toggle-group .toggle-btn.active[data-target="individual"]') ? "individual" : "company";
      const commissionPayer = form.elements['commissionPayer'].value;

      let errors = [];
      if (!title) errors.push("Вкажіть назву угоди");
      if (!amount || amount <= 0) errors.push("Сума угоди має бути більшою за 0");
      if (!deadline) {
        errors.push("Вкажіть строк виконання");
      } else {
        const chosenDate = new Date(deadline);
        const now = new Date();
        now.setHours(0,0,0,0);
        if (chosenDate < now) {
          errors.push("Строк виконання не може бути в минулому");
        }
      }

      let errBlock = document.getElementById('deal-errors');
      if (!errBlock) {
        errBlock = document.createElement('div');
        errBlock.id = 'deal-errors';
        errBlock.style.color = 'red';
        form.prepend(errBlock);
      }
      if (errors.length > 0) {
        errBlock.innerHTML = errors.join('<br>');
        return;
      } else {
        errBlock.innerHTML = '';
      }

      const description = form.elements['description'].value.trim(); 
      const fee = parseFloat((amount * 0.10).toFixed(2));
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      try {
        const resp = await fetch('/api/deals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role, type, title, amount, fee, commissionPayer, deadline, description  })
        });
const json = await resp.json();
if (json.success && json.deal && json.deal._id) {
  setStep(2);
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === 1);
  });

  const linkInput = document.getElementById('deal-link');
  if (linkInput) {
    linkInput.value = `https://my.GrandGarant.com/contracts/${json.deal._id}`;
  }
}
else {
  errBlock.innerHTML = json.message || 'Помилка при створенні угоди';
}

      } catch (err) {
        errBlock.innerHTML = 'Помилка з’єднання із сервером';
      }
    });
  }

  const copyBtn = document.getElementById('copy-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      const link = document.getElementById('deal-link');
      link.select();
      document.execCommand('copy');
      this.textContent = 'Скопійовано!';
      setTimeout(() => this.textContent = 'Скопіювати', 1200);
    });
  }

  const backBtn = document.getElementById('back-to-deals');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }

  const sendBtn = document.getElementById('send-invite');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const email = document.getElementById('partner-email').value.trim();
      const link = document.getElementById('deal-link').value;
      if(email) {
        alert(`Інвайт на ${email} надіслано з посиланням: ${link}`);
      } else {
        alert('Введіть email партнера!');
      }
    });
  }
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'agree-deal-btn') {
    showStep3();
  }
});

function showStep3() {
  setStep(3);
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === 2);
  });

  document.getElementById('deal-form')?.style.setProperty('display', 'none');
  document.getElementById('deal-success')?.style.setProperty('display', 'none');
  document.getElementById('partner-block')?.style.setProperty('display', 'none');

  document.getElementById('deal-final').style.display = 'block';

  const role = document.querySelector('.toggle-group .toggle-btn.active[data-target="buyer"]') ? "Покупець" : "Продавець";
  const type = document.querySelectorAll('.toggle-group')[1].querySelector('.toggle-btn.active').textContent.trim();
  const title = document.getElementById('deal-title').value;
  const amount = document.getElementById('deal-amount').value;
  const fee = (parseFloat(amount) * 0.10).toFixed(2) + " UAH";
  const who = document.querySelector('input[name="commissionPayer"]:checked').parentNode.textContent.trim();
  const deadline = document.getElementById('deal-deadline').value;

  document.getElementById('deal-role').textContent = role;
  document.getElementById('deal-type').textContent = type;
  document.getElementById('deal-title-final').textContent = title;
  document.getElementById('deal-amount-final').textContent = amount + " UAH";
  document.getElementById('deal-fee-final').textContent = fee;
  document.getElementById('deal-who-final').textContent = who;
  document.getElementById('deal-deadline-final').textContent = deadline;

  document.getElementById('back-to-dashboard').onclick = () => {
    window.location.href = 'dashboard.html';
  };
}

const descField = document.getElementById('deal-description');
const descCount = document.getElementById('desc-remaining');
if (descField && descCount) {
  descField.addEventListener('input', function() {
    const max = descField.getAttribute('maxlength') || 600;
    descCount.textContent = max - descField.value.length;
  });
}

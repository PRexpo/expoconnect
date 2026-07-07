/* ═══════════════════════════════════════════════════
   app.js — ExpoConnect Shared Utilities
   ═══════════════════════════════════════════════════ */

/* ── TOAST ── */
function showToast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3400);
}

/* ── SCROLL REVEAL ── */
function initReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.rv').forEach(el => obs.observe(el));
}

/* ── NAV ACTIVE LINK ── */
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
  });
}

/* ── MOBILE NAV TOGGLE ── */
function initMobileNav() {
  const btn   = document.querySelector('.nav-mobile-btn');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.style.display === 'flex';
    links.style.cssText = open
      ? ''
      : 'display:flex;flex-direction:column;position:fixed;top:60px;left:0;right:0;background:rgba(3,2,10,.97);padding:20px 5%;border-bottom:1px solid var(--border);gap:16px;z-index:49;';
    btn.textContent = open ? '☰' : '✕';
  });
}

/* ── FORM: STEP WIZARD ── */
function initStepWizard() {
  const steps  = document.querySelectorAll('.step-panel');
  const dots   = document.querySelectorAll('.si-step');
  const lines  = document.querySelectorAll('.si-line');
  if (!steps.length) return;

  let current = 0;

  function goTo(n) {
    steps.forEach((s, i) => s.classList.toggle('active', i === n));
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === n);
      d.classList.toggle('done',   i < n);
    });
    lines.forEach((l, i) => l.classList.toggle('done', i < n));
    current = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Next buttons
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(current)) goTo(current + 1);
    });
  });

  // Back buttons
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => { if (current > 0) goTo(current - 1); });
  });

  goTo(0); // start at step 0
}

/* ── FORM: BASIC VALIDATION ── */
function validateStep(stepIndex) {
  const panel  = document.querySelector(`.step-panel[data-step="${stepIndex}"]`);
  if (!panel) return true;
  let valid = true;

  panel.querySelectorAll('[required]').forEach(field => {
    const fg = field.closest('.fg');
    const empty = field.value.trim() === '';
    if (fg) {
      fg.classList.toggle('has-error', empty);
      let errEl = fg.querySelector('.fg-error');
      if (!errEl && empty) {
        errEl = document.createElement('div');
        errEl.className = 'fg-error';
        errEl.textContent = 'This field is required';
        fg.appendChild(errEl);
      }
    }
    if (empty) valid = false;
  });

  if (!valid) showToast('Please fill all required fields', 'err');
  return valid;
}

function validateForm(formEl) {
  let valid = true;
  formEl.querySelectorAll('[required]').forEach(field => {
    const fg = field.closest('.fg');
    const empty = field.value.trim() === '';
    if (fg) fg.classList.toggle('has-error', empty);
    if (empty) valid = false;
  });
  if (!valid) showToast('Please fill all required fields', 'err');
  return valid;
}

/* ── FORM: SUBMIT STATE ── */
function setSubmitLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
  const txt = btn.querySelector('.btn-text');
  if (txt) txt.textContent = loading ? 'Submitting…' : btn.dataset.label || 'Submit';
}

/* ── FORM: SHOW SUCCESS ── */
function showFormSuccess(formEl, successEl, refId = null) {
  if (formEl)    formEl.style.display    = 'none';
  if (successEl) successEl.style.display = 'block';
  if (refId) {
    const refEl = successEl?.querySelector('.ref-id');
    if (refEl) refEl.textContent = 'Ref # ' + refId;
  }
}

/* ── TAGS INPUT ── */
function initTagsInput(wrapId, hiddenId) {
  const wrap   = document.getElementById(wrapId);
  const hidden = document.getElementById(hiddenId);
  if (!wrap || !hidden) return;

  const inp = wrap.querySelector('input');
  let tags  = [];

  function render() {
    wrap.querySelectorAll('.titem').forEach(el => el.remove());
    tags.forEach((tag, i) => {
      const el = document.createElement('div');
      el.className = 'titem';
      el.innerHTML = `${tag}<button type="button" data-i="${i}">×</button>`;
      wrap.insertBefore(el, inp);
    });
    hidden.value = tags.join(',');
  }

  inp.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && inp.value.trim()) {
      e.preventDefault();
      const val = inp.value.trim().replace(/,$/, '');
      if (val && !tags.includes(val)) tags.push(val);
      inp.value = '';
      render();
    }
    if (e.key === 'Backspace' && !inp.value && tags.length) {
      tags.pop(); render();
    }
  });

  wrap.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      tags.splice(parseInt(e.target.dataset.i), 1); render();
    }
    inp.focus();
  });
}

/* ── FILE DROP ZONE ── */
function initFileDrop(zoneId, inputId, labelId) {
  const zone  = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragging');
    if (e.dataTransfer.files.length) updateFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => {
    if (input.files.length) updateFile(input.files[0]);
  });

  function updateFile(file) {
    if (label) label.textContent = file.name;
    else zone.querySelector('p').innerHTML = `<strong>${file.name}</strong> selected`;
  }
}

/* ── POPULATE EXPO DROPDOWNS ── */
async function populateExpoSelect(selectId, placeholder = '— Select an expo —') {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;

  try {
    const expos = await Expos.getNames();
    if (!expos.length) {
      el.innerHTML = `<option value="">— No expos listed yet —</option>`;
      return;
    }
    expos.forEach(e => {
      const opt = document.createElement('option');
      opt.value       = e.id;
      opt.textContent = e.name + (e.status === 'past' ? ' (Past)' : '');
      el.appendChild(opt);
    });
  } catch {
    el.innerHTML = `<option value="">— Could not load expos —</option>`;
  }
}

/* ── GENERATE REF ID ── */
function genRefId(prefix = 'EC') {
  return prefix + '-' + Date.now().toString(36).toUpperCase().slice(-6);
}

/* ── ON DOM READY ── */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  setActiveNav();
  initMobileNav();

  // Auto-clear .has-error on input
  document.querySelectorAll('.fg input, .fg select, .fg textarea').forEach(f => {
    f.addEventListener('input', () => f.closest('.fg')?.classList.remove('has-error'));
  });
});

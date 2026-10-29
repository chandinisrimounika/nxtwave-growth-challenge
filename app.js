/* ======================================================
   NxtWave AI Workshop – Referral & Registration System
   app.js — Full Logic
   ====================================================== */

// ─── State (LocalStorage-backed) ───────────────────────────────────────────────
const STATE_KEY = 'nxtwave_workshop_v1';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || {
      registrations: [],
      currentUser: null
    };
  } catch {
    return { registrations: [], currentUser: null };
  }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let state = loadState();

// Seed with realistic-looking demo data if empty
if (state.registrations.length === 0) {
  seedDemoData();
}

// ─── Demo Seed Data ─────────────────────────────────────────────────────────────
function seedDemoData() {
  const demoStudents = [
    { name: 'Arjun Sharma', college: 'JNTU Hyderabad', branch: 'CSE-4', referrals: 18 },
    { name: 'Priya Reddy', college: 'Osmania University', branch: 'ECE-4', referrals: 14 },
    { name: 'Kiran Babu', college: 'VIT Vellore', branch: 'IT-4', referrals: 11 },
    { name: 'Sneha Patel', college: 'NIT Warangal', branch: 'CSE-4', referrals: 9 },
    { name: 'Rohit Mehta', college: 'BITS Hyderabad', branch: 'ECE-4', referrals: 7 },
    { name: 'Ananya Iyer', college: 'SRM Chennai', branch: 'CSE-4', referrals: 5 },
    { name: 'Vikram Singh', college: 'Amrita Coimbatore', branch: 'MECH-4', referrals: 4 },
    { name: 'Divya Nair', college: 'KL University', branch: 'CSE-4', referrals: 3 },
    { name: 'Sai Teja', college: 'Andhra University', branch: 'ECE-4', referrals: 2 },
    { name: 'Lakshmi Rao', college: 'GITAM University', branch: 'IT-4', referrals: 1 },
  ];

  const baseTime = Date.now() - 5 * 24 * 60 * 60 * 1000;
  let count = 0;

  demoStudents.forEach((student, i) => {
    const code = generateCode(student.name);
    // Main registration
    state.registrations.push({
      id: `demo_${i}`,
      name: student.name,
      email: `${student.name.toLowerCase().replace(' ', '.')}@college.edu.in`,
      phone: `98765${String(43210 + i).padStart(5, '0')}`,
      college: student.college,
      branch: student.branch,
      refCode: code,
      referredBy: null,
      timestamp: baseTime + i * 3600000,
      isDemo: true
    });
    count++;
    // Referred registrations
    for (let r = 0; r < student.referrals; r++) {
      state.registrations.push({
        id: `demo_ref_${i}_${r}`,
        name: `Student ${count}`,
        email: `student${count}@college.edu.in`,
        phone: `87654${String(32100 + count).padStart(5, '0')}`,
        college: student.college,
        branch: student.branch,
        refCode: generateCode(`Student ${count}`),
        referredBy: code,
        timestamp: baseTime + i * 3600000 + (r + 1) * 600000,
        isDemo: true
      });
      count++;
    }
  });

  saveState(state);
}

function generateCode(name) {
  const first = name.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
  const num = Math.floor(10 + Math.random() * 89);
  return `${first.slice(0, 6)}${num}`;
}

function generateUniqueCode(name) {
  let code;
  const existingCodes = state.registrations.map(r => r.refCode);
  do {
    code = generateCode(name);
  } while (existingCodes.includes(code));
  return code;
}

// ─── Computed Helpers ──────────────────────────────────────────────────────────
function getTotalRegistrations() {
  return state.registrations.length;
}

function getReferralCount(code) {
  return state.registrations.filter(r => r.referredBy === code).length;
}

function getLeaderboard() {
  const ambassadors = state.registrations.filter(r =>
    getReferralCount(r.refCode) > 0
  );
  const unique = [];
  const seen = new Set();
  for (const r of ambassadors) {
    if (!seen.has(r.refCode)) {
      seen.add(r.refCode);
      unique.push({
        name: r.name,
        college: r.college,
        refCode: r.refCode,
        referrals: getReferralCount(r.refCode)
      });
    }
  }
  return unique.sort((a, b) => b.referrals - a.referrals).slice(0, 10);
}

// ─── UI Counters ────────────────────────────────────────────────────────────────
const TOTAL_SEATS = 500;

function updateCounters() {
  const total = getTotalRegistrations();
  const filled = Math.min(total, TOTAL_SEATS);
  const remaining = TOTAL_SEATS - filled;
  const pct = Math.min((filled / TOTAL_SEATS) * 100, 100);

  // Hero stats
  animateNumber('reg-count', filled);
  document.getElementById('live-count').textContent = filled;

  // Urgency bar
  const fill = document.getElementById('urgency-fill');
  if (fill) fill.style.width = pct + '%';

  const urgencyText = document.getElementById('urgency-text');
  if (urgencyText) {
    if (remaining > 50) {
      urgencyText.innerHTML = `<span class="highlight">${remaining} seats</span> remaining — secure yours now`;
    } else if (remaining > 0) {
      urgencyText.innerHTML = `🔥 Only <span class="highlight">${remaining} seats left!</span> Register now!`;
    } else {
      urgencyText.innerHTML = `⚠️ All seats claimed! You're on the waitlist.`;
    }
  }
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  if (diff === 0) return;
  const steps = 40;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + diff * easeOut(step / steps));
    if (step >= steps) clearInterval(timer);
  }, 20);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ─── Leaderboard Render ─────────────────────────────────────────────────────────
const RANK_EMOJI = ['🥇', '🥈', '🥉'];
const RANK_CLASS = ['top-1', 'top-2', 'top-3'];

function renderLeaderboard() {
  const board = getLeaderboard();
  const body = document.getElementById('lb-body');
  if (!body) return;
  body.innerHTML = '';

  if (board.length === 0) {
    body.innerHTML = '<div class="lb-row" style="grid-template-columns:1fr;text-align:center;color:var(--c-text-muted);padding:24px;">No referrals yet. Be the first! 🚀</div>';
    return;
  }

  board.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row' + (i < 3 ? ` ${RANK_CLASS[i]}` : '');
    row.style.animationDelay = `${i * 0.05}s`;
    row.innerHTML = `
      <span class="lb-rank">${i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}</span>
      <span class="lb-name">${escapeHTML(entry.name)}</span>
      <span class="lb-college">${escapeHTML(entry.college)}</span>
      <span class="lb-refs">${entry.referrals} <span style="font-size:0.75rem;color:var(--c-text-muted)">refs</span></span>
    `;
    body.appendChild(row);
  });
}

// ─── FAQ ────────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is this workshop really free?', a: 'Yes! 100% free. No hidden fees, no credit card required. Just register with your details.' },
  { q: 'Do I need coding experience?', a: 'Nope! We start from zero. If you can use a browser, you can build an AI project in this workshop.' },
  { q: 'What will I actually build?', a: 'A working AI-powered web app using free APIs. You\'ll have a live URL to share with recruiters by the end.' },
  { q: 'How does the referral system work?', a: 'After registering, you get a unique referral code. Share it with friends. Each friend who registers with your code earns you a point on the leaderboard.' },
  { q: 'When is the workshop?', a: 'Saturday, 8 November 2025 at 6:00 PM IST. Duration: ~60–75 minutes.' },
  { q: 'Will I get a certificate?', a: 'Yes! All attendees who complete the workshop receive a verified NxtWave certificate of completion.' },
  { q: 'What if I miss it live?', a: 'We\'ll send a recording to all registered students. But live attendance gives you 1:1 Q&A access and direct feedback.' },
  { q: 'How many seats are available?', a: 'We have 500 seats for this cohort. Register early to guarantee your spot.' },
];

function renderFAQs() {
  const grid = document.getElementById('faq-grid');
  if (!grid) return;
  grid.innerHTML = '';
  FAQS.forEach((faq, i) => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <button class="faq-question" id="faq-q-${i}" onclick="toggleFAQ(${i})">
        <span>${faq.q}</span>
        <span class="faq-chevron">▼</span>
      </button>
      <div class="faq-answer" id="faq-a-${i}">
        <div class="faq-answer-inner">${faq.a}</div>
      </div>
    `;
    grid.appendChild(item);
  });
}

function toggleFAQ(index) {
  const item = document.getElementById(`faq-q-${index}`).closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ─── Form Validation & Submission ──────────────────────────────────────────────
function validateField(id, errorId, check, message) {
  const el = document.getElementById(id);
  const err = document.getElementById(errorId);
  const value = el ? el.value.trim() : '';
  if (!check(value)) {
    if (el) el.classList.add('error');
    if (err) err.textContent = message;
    return false;
  }
  if (el) el.classList.remove('error');
  if (err) err.textContent = '';
  return true;
}

function validateForm() {
  let valid = true;

  valid = validateField('name', 'name-error', v => v.length >= 2, 'Please enter your full name.') && valid;
  valid = validateField('email', 'email-error', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address.') && valid;
  valid = validateField('phone', 'phone-error', v => /^\d{10}$/.test(v), 'Enter a valid 10-digit WhatsApp number.') && valid;
  valid = validateField('college', 'college-error', v => v.length >= 3, 'Please enter your college name.') && valid;
  valid = validateField('branch', 'branch-error', v => v !== '', 'Please select your branch and year.') && valid;

  return valid;
}

document.getElementById('reg-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  // Check duplicate email/phone
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();
  const isDuplicate = state.registrations.some(r =>
    r.email.toLowerCase() === email || r.phone === phone
  );

  if (isDuplicate) {
    showToast('⚠️ You\'re already registered! Check your email for your referral code.');
    const existing = state.registrations.find(r => r.email.toLowerCase() === email);
    if (existing) showSuccess(existing);
    return;
  }

  // Validate referral code if provided
  const refCodeInput = document.getElementById('ref-code').value.trim().toUpperCase();
  if (refCodeInput && !state.registrations.find(r => r.refCode === refCodeInput)) {
    showToast('⚠️ Referral code not found. Continuing without it.');
  }

  // Simulate loading
  const btn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const loader = document.getElementById('btn-loader');
  btn.disabled = true;
  btnText.classList.add('hidden');
  loader.classList.remove('hidden');

  await delay(1400);

  const name = document.getElementById('name').value.trim();
  const newReg = {
    id: `user_${Date.now()}`,
    name,
    email,
    phone,
    college: document.getElementById('college').value.trim(),
    branch: document.getElementById('branch').value,
    refCode: generateUniqueCode(name),
    referredBy: refCodeInput || null,
    timestamp: Date.now(),
    isDemo: false
  };

  state.registrations.push(newReg);
  state.currentUser = newReg;
  saveState(state);

  // Update UI
  updateCounters();
  renderLeaderboard();
  updateAdmin();
  showSuccess(newReg);
  showToast('🎉 Registration successful! Welcome to the workshop!');
});

function showSuccess(reg) {
  document.getElementById('form-card').classList.add('hidden');
  const card = document.getElementById('success-card');
  card.classList.remove('hidden');
  document.getElementById('success-name').textContent = reg.name.split(' ')[0];
  document.getElementById('your-ref-code').textContent = reg.refCode;
  state.currentUser = reg;
}

// ─── Share Functions ─────────────────────────────────────────────────────────────
function shareOnWhatsApp() {
  const user = state.currentUser;
  if (!user) return;
  const link = `${window.location.href.split('?')[0]}?ref=${user.refCode}`;
  const msg = `🚀 Hey! I just registered for a FREE AI workshop by NxtWave.

*"Build Your First AI Project in 60 Minutes"*
📅 Saturday, 8 Nov 2025 · 6 PM IST

You'll actually build and deploy a real AI project — in just one hour. No coding background needed!

Use my referral code *${user.refCode}* while registering 👇
${link}

Seats are limited — grab yours before they fill up! ⚡`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function copyReferralLink() {
  const user = state.currentUser;
  if (!user) return;
  const link = `${window.location.href.split('?')[0]}?ref=${user.refCode}`;
  navigator.clipboard.writeText(link).then(() => {
    showToast('📋 Referral link copied! Share it with friends.');
  }).catch(() => {
    showToast('Link: ' + link);
  });
}

// Auto-fill referral code from URL param
(function () {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    const input = document.getElementById('ref-code');
    if (input) {
      input.value = ref.toUpperCase();
      input.style.borderColor = 'var(--c-accent)';
      showToast(`✅ Referral code "${ref.toUpperCase()}" applied!`);
    }
  }
})();

// ─── Admin Dashboard ────────────────────────────────────────────────────────────
function toggleAdmin() {
  const modal = document.getElementById('admin-modal');
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) {
    updateAdmin();
  }
}

function updateAdmin() {
  const total = getTotalRegistrations();
  const viaSeed = state.registrations.filter(r => r.referredBy).length;
  const organic = total - viaSeed;
  const pct = Math.min(Math.round((total / 500) * 100), 100);

  document.getElementById('admin-total').textContent = total;
  document.getElementById('admin-referral').textContent = viaSeed;
  document.getElementById('admin-organic').textContent = organic;
  document.getElementById('admin-progress-pct').textContent = pct + '%';
  document.getElementById('admin-progress-fill').style.width = pct + '%';

  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  const regs = [...state.registrations].reverse().slice(0, 20);
  tbody.innerHTML = regs.map(r => `
    <tr>
      <td>${escapeHTML(r.name)}</td>
      <td>${escapeHTML(r.college)}</td>
      <td>${r.branch.split('-')[0]}</td>
      <td><span class="ref-badge">${r.refCode}</span></td>
      <td>${r.referredBy ? `<span class="ref-badge">${r.referredBy}</span>` : '<span style="color:var(--c-text-muted)">Organic</span>'}</td>
      <td style="color:var(--c-text-muted);font-size:0.8rem;">${formatTime(r.timestamp)}</td>
    </tr>
  `).join('');
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function exportCSV() {
  const headers = ['Name', 'Email', 'Phone', 'College', 'Branch', 'RefCode', 'ReferredBy', 'Timestamp'];
  const rows = state.registrations.map(r => [
    r.name, r.email, r.phone, r.college, r.branch, r.refCode, r.referredBy || '', formatTime(r.timestamp)
  ]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nxtwave_registrations.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('📊 CSV exported successfully!');
}

function resetAll() {
  if (confirm('Reset all demo data? This cannot be undone.')) {
    localStorage.removeItem(STATE_KEY);
    state = { registrations: [], currentUser: null };
    saveState(state);
    location.reload();
  }
}

function loadDemoData() {
  localStorage.removeItem(STATE_KEY);
  state = { registrations: [], currentUser: null };
  seedDemoData();
  state = loadState();
  updateCounters();
  renderLeaderboard();
  updateAdmin();
  showToast('🎭 Demo data loaded!');
}

// ─── Toast ──────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Navbar Scroll ──────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 60) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// ─── Intersection Observer for Animations ───────────────────────────────────────
function observeElements() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.feature-card, .prize-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ─── Live Counter Simulation ────────────────────────────────────────────────────
// Simulate new registrations trickling in (for demo feel)
function startLiveSimulation() {
  const interval = 15000 + Math.random() * 20000; // 15-35 seconds
  setTimeout(() => {
    const fakeNames = ['Sai Kumar', 'Deepika R', 'Aman Gupta', 'Pooja M', 'Nikhil V', 'Riya S', 'Harsha K'];
    const fakeColleges = ['JNTU', 'NIT Warangal', 'VIT', 'SRM', 'Amrita', 'BITS', 'KL University'];
    const fakeBranches = ['CSE-4', 'ECE-4', 'IT-4'];
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const reg = {
      id: `live_${Date.now()}`,
      name,
      email: `${name.toLowerCase().replace(' ', '')}${Math.floor(Math.random()*999)}@college.edu.in`,
      phone: `97${Math.floor(10000000 + Math.random() * 89999999)}`,
      college: fakeColleges[Math.floor(Math.random() * fakeColleges.length)],
      branch: fakeBranches[Math.floor(Math.random() * fakeBranches.length)],
      refCode: generateUniqueCode(name),
      referredBy: state.registrations.length > 0
        ? state.registrations[Math.floor(Math.random() * Math.min(state.registrations.length, 10))].refCode
        : null,
      timestamp: Date.now(),
      isDemo: true
    };
    state.registrations.push(reg);
    saveState(state);
    updateCounters();
    renderLeaderboard();
    updateAdmin();
    showToast(`👋 ${name} just registered from ${reg.college}!`);
    startLiveSimulation(); // recurse
  }, interval);
}

// ─── Utilities ──────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function escapeHTML(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Boot ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderFAQs();
  renderLeaderboard();
  updateCounters();
  observeElements();
  startLiveSimulation();

  // If user was already registered (returning visitor), show their success state
  if (state.currentUser) {
    showSuccess(state.currentUser);
  }
});

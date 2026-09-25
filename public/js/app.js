const API = '';

let currentUser = null;
const isGuest = () => currentUser === null;

// ============================================================
// SCREEN FLOW
// ============================================================
const welcomeScreen = document.getElementById('welcome-screen');
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const guestBanner = document.getElementById('guest-banner');
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const headerSignupBtn = document.getElementById('header-signup-btn');

document.getElementById('start-guest-btn').addEventListener('click', () => { currentUser = null; enterApp(); });

// Welcome-screen shortcut cards ("Find your due date", "Watch baby grow",
// "Chat when you need", "Keep your photos") drop straight into the matching
// tab instead of always landing on Timeline. Don't force guest mode here —
// if someone came back to this screen while still logged in (via the logo),
// a card click shouldn't silently sign them out.
document.querySelectorAll('.wf[data-target]').forEach(card => {
  card.addEventListener('click', async () => {
    await enterApp();
    showView(card.dataset.target);
  });
});

// Clicking the header logo returns to the welcome screen without logging
// out or losing guest/account state, so the shortcut cards are reachable
// again from inside the app.
function goToWelcome() {
  appShell.classList.add('hidden');
  authScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
}
const brandHomeBtn = document.getElementById('brand-home-btn');
brandHomeBtn.addEventListener('click', goToWelcome);
brandHomeBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToWelcome(); }
});

document.getElementById('show-auth-btn').addEventListener('click', () => {
  welcomeScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
});
document.getElementById('back-to-welcome').addEventListener('click', () => {
  authScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
});
document.getElementById('skip-auth-btn').addEventListener('click', () => { currentUser = null; enterApp(); });
headerSignupBtn.addEventListener('click', () => {
  appShell.classList.add('hidden');
  authScreen.classList.remove('hidden');
});
document.getElementById('banner-signup-btn').addEventListener('click', () => {
  appShell.classList.add('hidden');
  authScreen.classList.remove('hidden');
});

logoutBtn.addEventListener('click', async () => {
  await fetch(`${API}/api/logout`, { method: 'POST' });
  location.reload();
});

async function enterApp() {
  welcomeScreen.classList.add('hidden');
  authScreen.classList.add('hidden');
  appShell.classList.remove('hidden');

  if (currentUser) {
    userEmailEl.textContent = currentUser.name ? `Hi, ${currentUser.name} 💛` : currentUser.email;
    logoutBtn.classList.remove('hidden');
    headerSignupBtn.classList.add('hidden');
    guestBanner.classList.add('hidden');
    document.getElementById('contacts-sub').textContent = 'Saved to your account, so they follow you to any device.';
    document.getElementById('gallery-sub').textContent = 'Saved to your account — scans, bump pics, all of it.';
  } else {
    userEmailEl.textContent = 'Guest';
    logoutBtn.classList.add('hidden');
    headerSignupBtn.classList.remove('hidden');
    guestBanner.classList.remove('hidden');
    document.getElementById('contacts-sub').textContent = 'Saved on this device. Sign up any time to keep them safe.';
    document.getElementById('gallery-sub').textContent = 'Saved on this device. Sign up any time to keep them safe.';
  }

  await Promise.all([loadPregnancyInfo(), loadContacts(), loadGallery()]);
}

// ============================================================
// AUTH FORMS
// ============================================================
const authToggleBtns = document.querySelectorAll('.auth-toggle-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');

authToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    authToggleBtns.forEach(b => b.classList.toggle('active', b === btn));
    authError.textContent = '';
    loginForm.classList.toggle('hidden', btn.dataset.mode !== 'login');
    signupForm.classList.toggle('hidden', btn.dataset.mode !== 'signup');
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    currentUser = data;
    await enterApp();
  } catch (err) { authError.textContent = err.message; }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  try {
    const res = await fetch(`${API}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('signup-name').value.trim(),
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign up failed');
    currentUser = data;
    await enterApp();
  } catch (err) { authError.textContent = err.message; }
});

(async function checkSession() {
  try {
    const res = await fetch(`${API}/api/me`);
    const data = await res.json();
    if (data.user) { currentUser = data.user; await enterApp(); }
  } catch {}
})();

// ============================================================
// NAVIGATION
// ============================================================
let navTabs = document.querySelectorAll('.nav-tab');
const views = document.querySelectorAll('.view');

const quickLaunchItems = document.querySelectorAll('.ql-item');

function showView(name) {
  navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
  quickLaunchItems.forEach(q => q.classList.toggle('active', q.dataset.view === name));
  views.forEach(v => v.classList.toggle('active', v.id === name));
}

navTabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
quickLaunchItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));

// ---- Hamburger dropdown (phone widths only — CSS keeps this button hidden
// on wider screens, so this code is harmless there too) ----
const menuToggle = document.getElementById('menu-toggle');
const navTabsEl = document.getElementById('nav-tabs');

function closeNavMenu() {
  navTabsEl.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = navTabsEl.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

// Close after picking a tab. Delegated on the container (not the individual
// buttons) so it still works after the back-nav code below replaces the
// buttons with clones.
navTabsEl.addEventListener('click', (e) => {
  if (e.target.closest('.nav-tab')) closeNavMenu();
});

// Close on outside tap/click
document.addEventListener('click', (e) => {
  if (navTabsEl.classList.contains('open') &&
      !navTabsEl.contains(e.target) && e.target !== menuToggle) {
    closeNavMenu();
  }
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeNavMenu();
});

// ============================================================
// DUE DATE + ADVANCED TIMELINE
// ============================================================
const methodBtns = document.querySelectorAll('.method-btn');
const methodPanels = document.querySelectorAll('.method-panel');
let activeMethod = 'lmp';

methodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeMethod = btn.dataset.method;
    methodBtns.forEach(b => b.classList.toggle('active', b === btn));
    methodPanels.forEach(p => p.classList.toggle('active', p.id === `method-${activeMethod}`));
  });
});

const calcBtn = document.getElementById('calc-btn');
const resultBox = document.getElementById('result-box');
const advancedTimeline = document.getElementById('advanced-timeline');
const dueDateValue = document.getElementById('due-date-value');
const currentWeekEl = document.getElementById('current-week');
const currentTrimesterEl = document.getElementById('current-trimester');
const daysToGoEl = document.getElementById('days-to-go');
const progressFill = document.getElementById('progress-fill');
const progressCaption = document.getElementById('progress-caption');
const seeGrowthBtn = document.getElementById('see-growth-btn');

let calculatedCurrentWeek = null;

// Approximate published averages. Real growth varies a lot between pregnancies,
// which is why these are always shown as estimates.
const growthBenchmarks = [
  { week: 8,  length: '1.6 cm', weight: '1 g' },
  { week: 12, length: '5.4 cm', weight: '14 g' },
  { week: 16, length: '11.6 cm', weight: '100 g' },
  { week: 20, length: '25.6 cm', weight: '300 g' },
  { week: 24, length: '30 cm', weight: '600 g' },
  { week: 28, length: '37.6 cm', weight: '1.0 kg' },
  { week: 32, length: '42.4 cm', weight: '1.7 kg' },
  { week: 36, length: '47.4 cm', weight: '2.6 kg' },
  { week: 40, length: '51.2 cm', weight: '3.5 kg' }
];

const milestones = [
  { week: 6,  text: 'Heartbeat often detectable on an early scan' },
  { week: 12, text: 'End of the first trimester — many people share their news' },
  { week: 16, text: 'Hearing develops; baby may respond to sound' },
  { week: 20, text: 'Anatomy scan usually happens around now' },
  { week: 24, text: 'Considered the point of viability by most guidelines' },
  { week: 28, text: 'Third trimester begins' },
  { week: 32, text: 'Rapid weight gain as baby prepares for birth' },
  { week: 37, text: 'Considered early term' },
  { week: 40, text: 'Estimated due date 🎉' }
];

function benchmarkFor(week) {
  let closest = growthBenchmarks[0];
  for (const b of growthBenchmarks) {
    if (week >= b.week) closest = b;
  }
  if (week < 8) return { length: 'too early to estimate', weight: 'too early to estimate' };
  return closest;
}

function computeDueDate() {
  let dueDate;

  if (activeMethod === 'lmp') {
    const lmpInput = document.getElementById('lmp-date').value;
    const cycleLength = parseInt(document.getElementById('cycle-length').value, 10) || 28;
    if (!lmpInput) { alert('Please enter the first day of your last period.'); return null; }
    dueDate = new Date(lmpInput);
    dueDate.setDate(dueDate.getDate() + 280 + (cycleLength - 28));
  } else {
    const scanInput = document.getElementById('scan-date').value;
    const scanWeeks = parseInt(document.getElementById('scan-weeks').value, 10);
    const scanDays = parseInt(document.getElementById('scan-days').value, 10) || 0;
    if (!scanInput || isNaN(scanWeeks)) { alert('Please fill in the scan date and gestational age.'); return null; }
    dueDate = new Date(scanInput);
    dueDate.setDate(dueDate.getDate() + (280 - ((scanWeeks * 7) + scanDays)));
  }

  return dueDate;
}

function displayDueDate(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.round((dueDate - today) / 86400000);
  const gestationalDays = 280 - daysUntilDue;
  const weekToday = Math.max(1, Math.min(42, Math.floor(gestationalDays / 7)));

  calculatedCurrentWeek = weekToday;

  let trimester = '1st';
  if (weekToday > 27) trimester = '3rd';
  else if (weekToday > 13) trimester = '2nd';

  dueDateValue.textContent = dueDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  currentWeekEl.textContent = `Week ${weekToday}`;
  currentTrimesterEl.textContent = trimester;
  daysToGoEl.textContent = daysUntilDue > 0 ? daysUntilDue : 'Soon! 🎉';

  resultBox.classList.remove('hidden');
  advancedTimeline.classList.remove('hidden');

  const pct = Math.max(0, Math.min(100, (gestationalDays / 280) * 100));
  setTimeout(() => { progressFill.style.width = `${pct}%`; }, 100);
  progressCaption.textContent = `${Math.round(pct)}% of the way there`;

  renderAdvancedTimeline(weekToday, daysUntilDue);
}

function renderAdvancedTimeline(week, daysUntilDue) {
  // Benchmarks
  const bm = benchmarkFor(week);
  document.getElementById('bm-length').textContent = bm.length;
  document.getElementById('bm-weight').textContent = bm.weight;

  // Trimester progress bars
  const tris = [
    { name: 'First trimester', short: 'Weeks 1–13',  start: 0,  end: 13, cls: 't1' },
    { name: 'Second trimester', short: 'Weeks 14–27', start: 13, end: 27, cls: 't2' },
    { name: 'Third trimester', short: 'Weeks 28–40', start: 27, end: 40, cls: 't3' }
  ];

  const triList = document.getElementById('tri-list');
  triList.innerHTML = '';

  tris.forEach(t => {
    const span = t.end - t.start;
    const done = Math.max(0, Math.min(span, week - t.start));
    const pct = Math.round((done / span) * 100);

    const row = document.createElement('div');
    row.className = 'tri-row';
    row.innerHTML = `
      <div class="tri-head">
        <span class="tri-name"></span>
        <span class="tri-pct">${pct}%</span>
      </div>
      <div class="tri-track"><div class="tri-fill ${t.cls}"></div></div>
    `;
    row.querySelector('.tri-name').textContent = `${t.name} · ${t.short}`;
    triList.appendChild(row);

    setTimeout(() => { row.querySelector('.tri-fill').style.width = `${pct}%`; }, 150);
  });

  // Milestone track
  const track = document.getElementById('milestone-track');
  track.innerHTML = '';

  milestones.forEach((m, i) => {
    const next = milestones[i + 1];
    const isDone = week > m.week;
    const isCurrent = week >= m.week && (!next || week < next.week);

    const item = document.createElement('div');
    item.className = 'ms-item' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '');
    item.innerHTML = `
      <div class="ms-dot"></div>
      <div class="ms-body">
        <div class="ms-week">Week ${m.week}</div>
        <div class="ms-text"></div>
      </div>
    `;
    item.querySelector('.ms-text').textContent = m.text;
    track.appendChild(item);
  });

  document.getElementById('cd-days').textContent = daysUntilDue > 0 ? daysUntilDue : '0';
}

calcBtn.addEventListener('click', async () => {
  const dueDate = computeDueDate();
  if (!dueDate) return;
  displayDueDate(dueDate);

  const payload = activeMethod === 'lmp'
    ? { method: 'lmp',
        lmpDate: document.getElementById('lmp-date').value,
        cycleLength: document.getElementById('cycle-length').value,
        dueDate: dueDate.toISOString() }
    : { method: 'scan',
        scanDate: document.getElementById('scan-date').value,
        scanWeeks: document.getElementById('scan-weeks').value,
        scanDays: document.getElementById('scan-days').value,
        dueDate: dueDate.toISOString() };

  await fetch(`${API}/api/pregnancy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
});

function applyPregnancyInfo(info) {
  if (!info) return;

  activeMethod = info.method || 'lmp';
  methodBtns.forEach(b => b.classList.toggle('active', b.dataset.method === activeMethod));
  methodPanels.forEach(p => p.classList.toggle('active', p.id === `method-${activeMethod}`));

  if (activeMethod === 'lmp') {
    if (info.lmpDate) document.getElementById('lmp-date').value = info.lmpDate;
    if (info.cycleLength) document.getElementById('cycle-length').value = info.cycleLength;
  } else {
    if (info.scanDate) document.getElementById('scan-date').value = info.scanDate;
    if (info.scanWeeks) document.getElementById('scan-weeks').value = info.scanWeeks;
    if (info.scanDays) document.getElementById('scan-days').value = info.scanDays;
  }

  if (info.dueDate) displayDueDate(new Date(info.dueDate));
}

async function loadPregnancyInfo() {
  try {
    const res = await fetch(`${API}/api/pregnancy`);
    const data = await res.json();
    applyPregnancyInfo(data.info);
  } catch {}
}

seeGrowthBtn.addEventListener('click', () => {
  if (calculatedCurrentWeek) {
    const month = Math.min(9, Math.max(1, Math.ceil(calculatedCurrentWeek / 4.33)));
    monthSlider.value = month;
    updateDevelopmentView(month);
  }
  showView('development');
});

// ============================================================
// GROWTH VIEW
// ============================================================
const developmentData = {
  1: { emoji: '🌱', size: 'about the size of a poppy seed', scale: 0.15,
       text: "Weeks 1–4: very early days — fertilization has just happened and the neural tube, which becomes the brain and spine, is starting to form." },
  2: { emoji: '🫐', size: 'about the size of a blueberry', scale: 0.25,
       text: "Weeks 5–8: a heartbeat can often be detected now, and tiny limb buds are appearing that will grow into arms and legs." },
  3: { emoji: '🍋', size: 'about the size of a lime', scale: 0.4,
       text: "Weeks 9–12: fingers and toes are forming, and by the end of this month most major organs have started to develop." },
  4: { emoji: '🥑', size: 'about the size of an avocado', scale: 0.55,
       text: "Weeks 13–16: hearing is developing, and the skeleton is beginning to harden from soft cartilage." },
  5: { emoji: '🍌', size: 'about the size of a banana', scale: 0.68,
       text: "Weeks 17–20: many people start to feel movement around now — often described as gentle flutters. Hair is starting to grow too." },
  6: { emoji: '🌽', size: 'about the size of an ear of corn', scale: 0.78,
       text: "Weeks 21–24: the lungs are developing further, and the skin — still thin and translucent — is starting to fill out." },
  7: { emoji: '🍆', size: 'about the size of an eggplant', scale: 0.87,
       text: "Weeks 25–28: eyes can open now, and the brain is growing rapidly. This is often the start of the third trimester." },
  8: { emoji: '🎃', size: 'about the size of a small squash', scale: 0.95,
       text: "Weeks 29–32: bones are fully formed (though still soft), and weight gain speeds up in preparation for birth." },
  9: { emoji: '🍉', size: 'about the size of a small watermelon', scale: 1.05,
       text: "Weeks 33–40: the lungs are maturing and your baby is likely settling into position, getting ready to meet you 💛" }
};

const monthSlider = document.getElementById('month-slider');
const sizeEmoji = document.getElementById('size-emoji');
const sizeText = document.getElementById('size-text');
const milestoneTextEl = document.getElementById('month-milestone');
const babyShape = document.getElementById('baby-shape');

function updateDevelopmentView(month) {
  const data = developmentData[month];
  sizeEmoji.textContent = data.emoji;
  sizeEmoji.style.animation = 'none';
  void sizeEmoji.offsetWidth;
  sizeEmoji.style.animation = '';
  sizeText.textContent = data.size;
  milestoneTextEl.textContent = data.text;
  babyShape.style.transform = `scale(${data.scale})`;
}

monthSlider.addEventListener('input', () => updateDevelopmentView(monthSlider.value));
updateDevelopmentView(1);

// ============================================================
// CHAT (with optional image attachment)
// ============================================================
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chipRow = document.getElementById('chip-row');
const attachBtn = document.getElementById('attach-btn');
const chatFileInput = document.getElementById('chat-file-input');
const attachPreview = document.getElementById('attach-preview');
const attachThumb = document.getElementById('attach-thumb');
const attachName = document.getElementById('attach-name');
const attachRemove = document.getElementById('attach-remove');

let chatHistory = [];
let pendingImage = null; // { file, dataUrl, base64, mediaType }

const chatReplies = {
  stress: [
    "Feeling overwhelmed sometimes is really normal during pregnancy. A few slow breaths — in for 4 counts, out for 6 — can help settle your nervous system 💛",
    "Stress happens to almost everyone during pregnancy. Gentle movement, like a short walk or stepping outside for fresh air, can help reset your mood.",
    "It might help to say what's on your mind out loud or write it down — sometimes it feels lighter once it's out of your head 🌸"
  ],
  eat: [
    "Small, balanced meals with protein, whole grains, and fruits or veggies tend to keep energy steadier than a few big meals.",
    "Staying hydrated matters as much as what you eat — keeping water nearby helps with both energy and nausea 💧",
    "For what's right for your specific stage, your doctor or a prenatal dietitian can tailor advice to you personally."
  ],
  nausea: [
    "Nausea is extremely common, especially early on. Eating small amounts often, rather than big meals, sometimes eases it.",
    "Some people find ginger tea or plain crackers before getting out of bed gentle on the stomach 🫖",
    "If nausea is severe or you can't keep fluids down, please reach out to your doctor — that's worth checking directly."
  ],
  cravings: [
    "Cravings are a normal part of pregnancy for lots of people. Enjoying them in moderation alongside balanced meals is usually just fine 🍓",
    "If a craving is for something that isn't food (like ice, chalk, or dirt), mention it to your doctor — worth flagging.",
    "Pairing a craving with something nourishing — fruit alongside something sweet — can help balance things out."
  ],
  sleep: [
    "Trouble sleeping is common, especially later on. A pillow between your knees or behind your back can make side-sleeping comfier 🛏️",
    "Winding down with something calm before bed — dim lights, no screens, a warm shower — helps your body settle.",
    "If sleep troubles are really affecting you, mention it at your next appointment — small adjustments often help."
  ],
  terms: [
    "Happy to help with terminology! Common ones: CRL (crown-rump length, a measurement used for dating), BPD (biparietal diameter, a head measurement), and EDD (estimated due date). Which one came up?",
    "Scan reports are full of abbreviations. Tell me which term you saw and I'll explain what it generally refers to — then your doctor can tell you what it means in your case 🌸"
  ],
  image: [
    "Thanks for sharing that 💛 I'm not able to read or interpret a scan — only your doctor or midwife can tell you what it shows for you. But I'd love to help you understand the terminology on it, or put together questions to bring to your appointment. What would help most?",
    "I can't interpret scans or reports — that's genuinely your care team's job, and getting it wrong could matter. What I can do is explain what a term means in general, or help you write down questions to ask. Want to try that?"
  ],
  default: [
    "Thank you for sharing that 💛 I can offer general tips on stress, food, nausea, cravings, or sleep — tap a button above or tell me more.",
    "I hear you. For anything urgent or worrying, please reach out to your doctor directly rather than waiting 🌸"
  ]
};

function addMessage(text, sender, imageUrl) {
  const msg = document.createElement('div');
  msg.className = `msg ${sender}`;
  if (imageUrl) {
    const img = document.createElement('img');
    img.className = 'msg-image';
    img.src = imageUrl;
    img.alt = 'Shared image';
    msg.appendChild(img);
  }
  if (text) {
    const span = document.createElement('span');
    span.textContent = text;
    msg.appendChild(span);
  }
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'msg bot typing';
  el.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return el;
}

function fallbackReply(topic) {
  const options = chatReplies[topic] || chatReplies.default;
  return options[Math.floor(Math.random() * options.length)];
}

function detectTopic(text) {
  const lower = (text || '').toLowerCase();
  if (/(stress|anxious|overwhelm|worried|panic)/.test(lower)) return 'stress';
  if (/(eat|food|diet|meal|nutrition)/.test(lower)) return 'eat';
  if (/(nausea|sick|vomit|throw up|morning sickness)/.test(lower)) return 'nausea';
  if (/(crav)/.test(lower)) return 'cravings';
  if (/(sleep|tired|insomnia|rest)/.test(lower)) return 'sleep';
  if (/(crl|bpd|edd|scan|report|term|mean|abbrevia)/.test(lower)) return 'terms';
  return 'default';
}

// ---- Attachment handling ----
attachBtn.addEventListener('click', () => chatFileInput.click());

chatFileInput.addEventListener('change', async () => {
  const file = chatFileInput.files[0];
  if (!file || !file.type.startsWith('image/')) return;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  pendingImage = {
    file,
    dataUrl,
    base64: dataUrl.split(',')[1],
    mediaType: file.type
  };

  attachThumb.src = dataUrl;
  attachName.textContent = file.name;
  attachPreview.classList.remove('hidden');
  chatFileInput.value = '';
});

attachRemove.addEventListener('click', () => {
  pendingImage = null;
  attachPreview.classList.add('hidden');
});

async function respondTo(userText, topicHint, image) {
  const typingEl = showTyping();

  try {
    const res = await fetch(`${API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        history: chatHistory,
        image: image ? { data: image.base64, mediaType: image.mediaType } : undefined
      })
    });
    const data = await res.json();
    typingEl.remove();

    if (data.reply) {
      addMessage(data.reply, 'bot');
      chatHistory.push({ role: 'user', content: userText || '[shared an image]' });
      chatHistory.push({ role: 'assistant', content: data.reply });
      if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);
    } else {
      const topic = image ? 'image' : (topicHint || detectTopic(userText));
      addMessage(fallbackReply(topic), 'bot');
    }
  } catch {
    typingEl.remove();
    const topic = image ? 'image' : (topicHint || detectTopic(userText));
    addMessage(fallbackReply(topic), 'bot');
  }
}

chipRow.addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  const topic = e.target.dataset.topic;
  const text = e.target.textContent;
  addMessage(text, 'user');
  respondTo(text, topic);
});

async function sendUserMessage() {
  const text = chatInput.value.trim();
  const image = pendingImage;
  if (!text && !image) return;

  addMessage(text, 'user', image ? image.dataUrl : null);
  chatInput.value = '';

  // Any image shared in chat is also saved to the gallery automatically
  if (image) {
    attachPreview.classList.add('hidden');
    pendingImage = null;
    uploadToGallery(image.file, 'Shared in chat').catch(() => {});
  }

  await respondTo(text, null, image);
}

chatSendBtn.addEventListener('click', sendUserMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendUserMessage(); });

addMessage("Hi! I'm here for gentle, general wellness tips — not medical advice. For anything concerning, please reach out to your doctor 💛 What's on your mind?", 'bot');

// ============================================================
// GALLERY
// ============================================================
const galleryDrop = document.getElementById('gallery-drop');
const galleryFileInput = document.getElementById('gallery-file-input');
const galleryGrid = document.getElementById('gallery-grid');
const galleryStatus = document.getElementById('gallery-status');

galleryDrop.addEventListener('click', () => galleryFileInput.click());
galleryDrop.addEventListener('dragover', e => { e.preventDefault(); galleryDrop.classList.add('dragover'); });
galleryDrop.addEventListener('dragleave', () => galleryDrop.classList.remove('dragover'));
galleryDrop.addEventListener('drop', e => {
  e.preventDefault();
  galleryDrop.classList.remove('dragover');
  handleGalleryFiles(e.dataTransfer.files);
});
galleryFileInput.addEventListener('change', () => {
  handleGalleryFiles(galleryFileInput.files);
  galleryFileInput.value = '';
});

async function handleGalleryFiles(fileList) {
  const images = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (images.length === 0) return;

  galleryStatus.textContent = `Uploading ${images.length} photo${images.length > 1 ? 's' : ''}...`;

  for (const file of images) {
    try {
      await uploadToGallery(file);
    } catch (err) {
      galleryStatus.textContent = err.message;
      return;
    }
  }

  galleryStatus.textContent = 'Saved 💛';
  setTimeout(() => { galleryStatus.textContent = ''; }, 2200);
  await loadGallery();
}

async function uploadToGallery(file, caption) {
  const formData = new FormData();
  formData.append('image', file);
  if (caption) formData.append('caption', caption);

  const res = await fetch(`${API}/api/gallery`, { method: 'POST', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }
  const data = await res.json();
  await loadGallery();
  return data.item;
}

async function loadGallery() {
  try {
    const res = await fetch(`${API}/api/gallery`);
    const data = await res.json();
    renderGallery(data.items || []);
  } catch {
    renderGallery([]);
  }
}

function renderGallery(items) {
  galleryGrid.innerHTML = '';

  if (items.length === 0) {
    galleryGrid.innerHTML = '<p class="empty-note" style="grid-column:1/-1">No photos yet — add your first one above 🌸</p>';
    return;
  }

  items.forEach(item => {
    const url = `${API}/api/gallery/file/${item.filename}`;
    const el = document.createElement('div');
    el.className = 'g-item';

    const img = document.createElement('img');
    img.src = url;
    img.alt = item.caption || item.originalName || 'Photo';
    img.loading = 'lazy';

    const date = document.createElement('span');
    date.className = 'g-date';
    date.textContent = new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const remove = document.createElement('button');
    remove.className = 'g-remove';
    remove.textContent = '✕';
    remove.title = 'Remove';
    remove.addEventListener('click', async (e) => {
      e.stopPropagation();
      await fetch(`${API}/api/gallery/${item.id}`, { method: 'DELETE' }).catch(() => {});
      await loadGallery();
    });

    el.appendChild(img);
    el.appendChild(date);
    el.appendChild(remove);
    el.addEventListener('click', () => openLightbox(url));
    galleryGrid.appendChild(el);
  });
}

// ---- Lightbox ----
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox(url) {
  lightboxImg.src = url;
  lightbox.classList.remove('hidden');
}

document.getElementById('lightbox-close').addEventListener('click', () => lightbox.classList.add('hidden'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.add('hidden'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.add('hidden'); });

// ============================================================
// EMERGENCY CONTACTS
// ============================================================
const contactList = document.getElementById('contact-list');
const addContactBtn = document.getElementById('add-contact-btn');

let contactsCache = [];

async function loadContacts() {
  try {
    const res = await fetch(`${API}/api/contacts`);
    const data = await res.json();
    contactsCache = data.contacts || [];
  } catch { contactsCache = []; }
  renderContacts();
}

async function persistContacts() {
  await fetch(`${API}/api/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts: contactsCache })
  }).catch(() => {});
}

function renderContacts() {
  contactList.innerHTML = '';

  if (contactsCache.length === 0) {
    contactList.innerHTML = '<p class="empty-note">No contacts yet — add your doctor, partner, or anyone you\'d want to reach quickly 🌸</p>';
    return;
  }

  contactsCache.forEach((c, index) => {
    const item = document.createElement('div');
    item.className = 'contact-item';
    const initial = (c.name || '').trim().charAt(0).toUpperCase() || '?';
    item.innerHTML = `
      <div class="contact-avatar">${initial}</div>
      <div class="contact-details">
        <div class="contact-name"></div>
        <div class="contact-relation"></div>
      </div>
      <a class="call-btn" href="tel:${encodeURIComponent(c.phone)}">Call</a>
      <button class="remove-btn" data-index="${index}" title="Remove">✕</button>
    `;
    item.querySelector('.contact-name').textContent = c.name;
    item.querySelector('.contact-relation').textContent = c.relation || '';
    contactList.appendChild(item);
  });
}

addContactBtn.addEventListener('click', async () => {
  const name = document.getElementById('contact-name').value.trim();
  const relation = document.getElementById('contact-relation').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();

  if (!name || !phone) { alert('Please add at least a name and phone number.'); return; }

  contactsCache.push({ name, relation, phone });
  renderContacts();
  await persistContacts();

  document.getElementById('contact-name').value = '';
  document.getElementById('contact-relation').value = '';
  document.getElementById('contact-phone').value = '';
});

contactList.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('remove-btn')) return;
  const index = parseInt(e.target.dataset.index, 10);
  contactsCache.splice(index, 1);
  renderContacts();
  await persistContacts();
});

// ============================================================
// v4: BACK NAVIGATION
// ============================================================
const backNav = document.getElementById('back-nav');
const viewStack = [];
let suppressStackPush = false;

// Wrap the existing showView so navigation history is tracked
const _showViewOriginal = showView;
showView = function (name) {
  const current = document.querySelector('.view.active');
  if (!suppressStackPush && current && current.id !== name) {
    viewStack.push(current.id);
    if (viewStack.length > 30) viewStack.shift();
  }
  _showViewOriginal(name);
  updateBackButton();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Re-bind nav tabs to the wrapped version
navTabs.forEach(tab => {
  const clone = tab.cloneNode(true);
  tab.parentNode.replaceChild(clone, tab);
  clone.addEventListener('click', () => showView(clone.dataset.view));
});

// The clones above are new nodes — the original `navTabs` list now points at
// detached elements, so showView() would toggle .active on nodes that are no
// longer in the page. Re-query so the highlight tracks the visible buttons.
navTabs = document.querySelectorAll('.nav-tab');

function updateBackButton() {
  backNav.disabled = viewStack.length === 0;
}

backNav.addEventListener('click', () => {
  if (viewStack.length === 0) return;
  const previous = viewStack.pop();
  suppressStackPush = true;
  _showViewOriginal(previous);
  suppressStackPush = false;
  updateBackButton();
  // keep the tab highlight in sync
  document.querySelectorAll('.nav-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.view === previous));
  document.querySelectorAll('.ql-item').forEach(q =>
    q.classList.toggle('active', q.dataset.view === previous));
});

updateBackButton();

// SOS icon jumps straight to emergency
document.getElementById('sos-icon').addEventListener('click', () => showView('emergency'));

// ============================================================
// v4: PUBLIC INSIGHTS
// ============================================================
const insightList = document.getElementById('insight-list');
const insightFilters = document.getElementById('insight-filters');
let activeInsightTag = 'All';

function renderInsightFilters() {
  const tags = ['All', ...new Set(INSIGHTS.map(i => i.tag))];
  insightFilters.innerHTML = '';
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'ifilter' + (tag === activeInsightTag ? ' active' : '');
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      activeInsightTag = tag;
      renderInsightFilters();
      renderInsights();
    });
    insightFilters.appendChild(btn);
  });
}

function renderInsights() {
  const items = activeInsightTag === 'All'
    ? INSIGHTS
    : INSIGHTS.filter(i => i.tag === activeInsightTag);

  insightList.innerHTML = '';

  items.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'insight-item';

    const head = document.createElement('button');
    head.className = 'insight-head';

    const tag = document.createElement('span');
    tag.className = 'insight-tag' + (item.tag === 'Important' ? ' important' : '');
    tag.textContent = item.tag;

    const titles = document.createElement('span');
    titles.className = 'insight-titles';
    const t = document.createElement('span');
    t.className = 'insight-title';
    t.textContent = item.title;
    const s = document.createElement('span');
    s.className = 'insight-summary';
    s.textContent = item.summary;
    titles.appendChild(t);
    titles.appendChild(s);

    const chev = document.createElement('span');
    chev.className = 'insight-chevron';
    chev.textContent = '▾';

    head.appendChild(tag);
    head.appendChild(titles);
    head.appendChild(chev);

    const body = document.createElement('div');
    body.className = 'insight-body';
    item.body.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      body.appendChild(p);
    });

    head.addEventListener('click', () => wrap.classList.toggle('open'));

    wrap.appendChild(head);
    wrap.appendChild(body);
    insightList.appendChild(wrap);
  });
}

renderInsightFilters();
renderInsights();

// ============================================================
// v4: COMMUNITY — group chat + shared gallery
// ============================================================
const groupChatWindow = document.getElementById('group-chat-window');
const groupChatInput = document.getElementById('group-chat-input');
const groupSendBtn = document.getElementById('group-send-btn');

let lastMessageTs = 0;
let myOwnerId = null;
let pollTimer = null;

document.querySelectorAll('.ctab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ctab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.cpanel').forEach(p =>
      p.classList.toggle('active', p.id === `cpanel-${tab.dataset.ctab}`));
    if (tab.dataset.ctab === 'wall') loadCommunityGallery();
  });
});

function renderGroupMessages(messages, append) {
  if (!append) groupChatWindow.innerHTML = '';

  const emptyEl = groupChatWindow.querySelector('.chat-empty');
  if (emptyEl && messages.length) emptyEl.remove();

  messages.forEach(m => {
    const wrap = document.createElement('div');
    const mine = m.ownerId === myOwnerId;
    wrap.className = 'gmsg' + (mine ? ' mine' : '');

    const author = document.createElement('div');
    author.className = 'gmsg-author';
    author.textContent = mine ? 'You' : m.author;

    const bubble = document.createElement('div');
    bubble.className = 'gmsg-bubble';
    const textSpan = document.createElement('span');
    textSpan.textContent = m.text;
    bubble.appendChild(textSpan);

    if (mine) {
      const del = document.createElement('button');
      del.className = 'gmsg-del';
      del.textContent = '✕';
      del.title = 'Delete';
      del.addEventListener('click', async () => {
        await fetch(`${API}/api/community/messages/${m.id}`, { method: 'DELETE' }).catch(() => {});
        wrap.remove();
      });
      bubble.appendChild(del);
    }

    const time = document.createElement('div');
    time.className = 'gmsg-time';
    time.textContent = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    wrap.appendChild(author);
    wrap.appendChild(bubble);
    wrap.appendChild(time);
    groupChatWindow.appendChild(wrap);
  });

  if (messages.length) groupChatWindow.scrollTop = groupChatWindow.scrollHeight;
}

async function pollMessages() {
  try {
    const res = await fetch(`${API}/api/community/messages?since=${lastMessageTs}`);
    const data = await res.json();
    myOwnerId = data.you;

    if (data.messages.length) {
      renderGroupMessages(data.messages, lastMessageTs > 0);
      lastMessageTs = Math.max(...data.messages.map(m => m.ts));
    } else if (lastMessageTs === 0 && !groupChatWindow.children.length) {
      groupChatWindow.innerHTML = '<p class="chat-empty">No messages yet — say hello 💛</p>';
      lastMessageTs = data.serverTime;
    }
  } catch {}
}

async function sendGroupMessage() {
  const text = groupChatInput.value.trim();
  if (!text) return;
  groupChatInput.value = '';

  try {
    await fetch(`${API}/api/community/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    await pollMessages();
  } catch {}
}

groupSendBtn.addEventListener('click', sendGroupMessage);
groupChatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendGroupMessage(); });

// Poll only while the community tab is visible, to avoid pointless traffic
function managePolling() {
  const communityVisible = document.getElementById('community').classList.contains('active');
  if (communityVisible && !pollTimer) {
    pollMessages();
    pollTimer = setInterval(pollMessages, 3000);
  } else if (!communityVisible && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

setInterval(managePolling, 800);

// ---- Shared gallery ----
const consentBox = document.getElementById('share-consent-box');
const communityDrop = document.getElementById('community-drop');
const communityFileInput = document.getElementById('community-file-input');
const communityGrid = document.getElementById('community-grid');
const communityStatus = document.getElementById('community-status');

consentBox.addEventListener('change', () => {
  communityDrop.classList.toggle('disabled', !consentBox.checked);
  communityDrop.querySelector('p').innerHTML = consentBox.checked
    ? '<strong>Share a photo</strong><br>click here or drag one in'
    : '<strong>Share a photo</strong><br>tick the box above first';
});

communityDrop.addEventListener('click', () => {
  if (consentBox.checked) communityFileInput.click();
});

communityDrop.addEventListener('dragover', e => {
  if (!consentBox.checked) return;
  e.preventDefault();
  communityDrop.classList.add('dragover');
});
communityDrop.addEventListener('dragleave', () => communityDrop.classList.remove('dragover'));
communityDrop.addEventListener('drop', e => {
  if (!consentBox.checked) return;
  e.preventDefault();
  communityDrop.classList.remove('dragover');
  uploadCommunityImages(e.dataTransfer.files);
});

communityFileInput.addEventListener('change', () => {
  uploadCommunityImages(communityFileInput.files);
  communityFileInput.value = '';
});

async function uploadCommunityImages(fileList) {
  const images = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (!images.length) return;

  communityStatus.textContent = 'Sharing...';

  for (const file of images) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API}/api/community/gallery`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
    } catch {
      communityStatus.textContent = 'Something went wrong sharing that photo.';
      return;
    }
  }

  communityStatus.textContent = 'Shared 💛';
  setTimeout(() => { communityStatus.textContent = ''; }, 2200);
  loadCommunityGallery();
}

async function loadCommunityGallery() {
  try {
    const res = await fetch(`${API}/api/community/gallery`);
    const data = await res.json();
    myOwnerId = data.you;
    renderCommunityGallery(data.items || []);
  } catch {
    renderCommunityGallery([]);
  }
}

function renderCommunityGallery(items) {
  communityGrid.innerHTML = '';

  if (!items.length) {
    communityGrid.innerHTML = '<p class="empty-note" style="grid-column:1/-1">Nothing shared yet 🌷</p>';
    return;
  }

  items.forEach(item => {
    const url = `${API}/api/community/file/${item.filename}`;
    const el = document.createElement('div');
    el.className = 'g-item';

    const img = document.createElement('img');
    img.src = url;
    img.alt = item.caption || 'Community photo';
    img.loading = 'lazy';

    const author = document.createElement('span');
    author.className = 'g-author';
    author.textContent = item.ownerId === myOwnerId ? 'You' : item.author;

    el.appendChild(img);
    el.appendChild(author);

    if (item.ownerId === myOwnerId) {
      const remove = document.createElement('button');
      remove.className = 'g-remove';
      remove.textContent = '✕';
      remove.title = 'Remove my post';
      remove.addEventListener('click', async (e) => {
        e.stopPropagation();
        await fetch(`${API}/api/community/gallery/${item.id}`, { method: 'DELETE' }).catch(() => {});
        loadCommunityGallery();
      });
      el.appendChild(remove);
    }

    el.addEventListener('click', () => openLightbox(url));
    communityGrid.appendChild(el);
  });
}

// ============================================================
// v4: EXPERTS
// ============================================================
// ⚙️ Set this to your real consultation number to enable the call button.
// Left empty on purpose — a button that dials a made-up number is worse
// than no button at all.
const EXPERT_PHONE = '';

const expertContent = {
  fertility: {
    heading: 'Fertility & general expert support',
    points: [
      'Questions about cycles, ovulation tracking, and timing',
      'What tests are usually offered and what they look at',
      'Early pregnancy questions and what to expect at first appointments',
      'When it is generally suggested to seek further investigation'
    ]
  },
  ivf: {
    heading: 'IVF support',
    points: [
      'Understanding the stages of a treatment cycle',
      'What happens around egg collection and transfer',
      'Questions to ask your clinic before starting',
      'Emotional support through the two-week wait and beyond'
    ]
  }
};

const expertBody = document.getElementById('expert-body');
const expertCallout = document.getElementById('expert-callout');

function renderExpertCategory(cat) {
  const data = expertContent[cat];
  expertBody.innerHTML = '';

  const h = document.createElement('h4');
  h.textContent = data.heading;
  const ul = document.createElement('ul');
  data.points.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    ul.appendChild(li);
  });

  expertBody.appendChild(h);
  expertBody.appendChild(ul);
}

document.querySelectorAll('.expert-cat').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.expert-cat').forEach(b => b.classList.toggle('active', b === btn));
    renderExpertCategory(btn.dataset.cat);
  });
});

renderExpertCategory('fertility');

document.getElementById('talk-expert-btn').addEventListener('click', () => {
  expertCallout.classList.remove('hidden');

  const phoneLink = document.getElementById('expert-phone-link');
  const note = document.getElementById('callout-note');

  if (EXPERT_PHONE) {
    phoneLink.textContent = EXPERT_PHONE;
    phoneLink.href = `tel:${EXPERT_PHONE}`;
    note.textContent = 'Our team will talk through your situation and point you to the right kind of support.';
  } else {
    phoneLink.textContent = 'Email us instead →';
    phoneLink.href = 'mailto:nemathmiyan78@gmail.com?subject=Expert%20consultation%20request';
  }

  expertCallout.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ============================================================
// v4: EMERGENCY — numbers + hospital finder
// ============================================================
// Official public emergency numbers. Users are asked to confirm these
// for their own area rather than trusting the app blindly.
const EMERGENCY_NUMBERS = {
  'India':          [{ label: 'Ambulance', n: '102' }, { label: 'Emergency (all services)', n: '112' }, { label: 'Medical emergency', n: '108' }],
  'United States':  [{ label: 'Emergency (all services)', n: '911' }],
  'United Kingdom': [{ label: 'Emergency (all services)', n: '999' }, { label: 'Non-emergency medical advice', n: '111' }],
  'Canada':         [{ label: 'Emergency (all services)', n: '911' }],
  'Australia':      [{ label: 'Emergency (all services)', n: '000' }],
  'European Union': [{ label: 'Emergency (all services)', n: '112' }],
  'UAE':            [{ label: 'Ambulance', n: '998' }, { label: 'Police', n: '999' }],
  'Singapore':      [{ label: 'Ambulance & Fire', n: '995' }],
  'New Zealand':    [{ label: 'Emergency (all services)', n: '111' }],
  'South Africa':   [{ label: 'Ambulance', n: '10177' }, { label: 'Emergency (mobile)', n: '112' }]
};

const countrySelect = document.getElementById('country-select');
const enGrid = document.getElementById('en-grid');

Object.keys(EMERGENCY_NUMBERS).forEach(country => {
  const opt = document.createElement('option');
  opt.value = country;
  opt.textContent = country;
  countrySelect.appendChild(opt);
});

const savedCountry = localStorage.getItem('bloom-country');
countrySelect.value = savedCountry && EMERGENCY_NUMBERS[savedCountry] ? savedCountry : 'India';

function renderEmergencyNumbers() {
  const list = EMERGENCY_NUMBERS[countrySelect.value] || [];
  enGrid.innerHTML = '';
  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'en-item';
    const label = document.createElement('span');
    label.className = 'en-label';
    label.textContent = item.label;
    const call = document.createElement('a');
    call.className = 'en-call';
    call.href = `tel:${item.n}`;
    call.textContent = item.n;
    row.appendChild(label);
    row.appendChild(call);
    enGrid.appendChild(row);
  });
}

countrySelect.addEventListener('change', () => {
  localStorage.setItem('bloom-country', countrySelect.value);
  renderEmergencyNumbers();
});

renderEmergencyNumbers();

// ---- Hospital finder via geolocation ----
const findBtn = document.getElementById('find-hospitals-btn');
const finderStatus = document.getElementById('finder-status');
const finderResults = document.getElementById('finder-results');

findBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    finderStatus.textContent = 'Your browser does not support location. You can search "hospital near me" in your maps app.';
    return;
  }

  finderStatus.textContent = 'Finding your location...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const ll = `${latitude},${longitude}`;

      // Links to live maps data — always current, unlike a hardcoded list
      document.getElementById('maps-hospitals').href =
        `https://www.google.com/maps/search/hospital+emergency/@${ll},14z`;
      document.getElementById('maps-maternity').href =
        `https://www.google.com/maps/search/maternity+hospital+obstetrics/@${ll},14z`;
      document.getElementById('maps-pharmacy').href =
        `https://www.google.com/maps/search/pharmacy+open+now/@${ll},14z`;

      document.getElementById('coords-note').textContent =
        `Based on your location (${latitude.toFixed(3)}, ${longitude.toFixed(3)}). Opens in maps with live numbers and directions.`;

      finderStatus.textContent = '';
      finderResults.classList.remove('hidden');
    },
    (err) => {
      const messages = {
        1: 'Location permission was denied. You can still search "hospital near me" in your maps app.',
        2: 'Could not determine your location right now. Try again, or search "hospital near me" in maps.',
        3: 'Location request timed out. Try again, or search "hospital near me" in maps.'
      };
      finderStatus.textContent = messages[err.code] || 'Could not get your location.';
    },
    { timeout: 10000, maximumAge: 60000 }
  );
});

// ---- Save own hospital ----
const myHospitalEl = document.getElementById('my-hospital');

function renderMyHospital() {
  const raw = localStorage.getItem('bloom-hospital');
  myHospitalEl.innerHTML = '';
  if (!raw) return;

  let h;
  try { h = JSON.parse(raw); } catch { return; }

  const box = document.createElement('div');
  box.className = 'my-hosp';

  const details = document.createElement('div');
  details.className = 'my-hosp-details';
  const name = document.createElement('div');
  name.className = 'my-hosp-name';
  name.textContent = h.name;
  const phone = document.createElement('div');
  phone.className = 'my-hosp-phone';
  phone.textContent = h.phone;
  details.appendChild(name);
  details.appendChild(phone);

  const call = document.createElement('a');
  call.className = 'en-call';
  call.href = `tel:${h.phone}`;
  call.textContent = 'Call';

  const remove = document.createElement('button');
  remove.className = 'remove-btn';
  remove.textContent = '✕';
  remove.addEventListener('click', () => {
    localStorage.removeItem('bloom-hospital');
    renderMyHospital();
  });

  box.appendChild(details);
  box.appendChild(call);
  box.appendChild(remove);
  myHospitalEl.appendChild(box);
}

document.getElementById('save-hosp-btn').addEventListener('click', () => {
  const name = document.getElementById('hosp-name').value.trim();
  const phone = document.getElementById('hosp-phone').value.trim();
  if (!name || !phone) { alert('Please add both the name and the phone number.'); return; }

  localStorage.setItem('bloom-hospital', JSON.stringify({ name, phone }));
  document.getElementById('hosp-name').value = '';
  document.getElementById('hosp-phone').value = '';
  renderMyHospital();
});

renderMyHospital();

// ============================================================
// v4: MONTHLY DIET + MEDICATION LOG
// ============================================================
const dietList = document.getElementById('diet-list');
const medsText = document.getElementById('meds-text');
const medsNote = document.getElementById('meds-note');
const guideMonthLabel = document.getElementById('guide-month-label');

function renderMonthlyGuide(month) {
  const guide = MONTHLY_GUIDE[month];
  if (!guide) return;

  guideMonthLabel.textContent = month;

  dietList.innerHTML = '';
  guide.diet.forEach(d => {
    const li = document.createElement('li');
    li.textContent = d;
    dietList.appendChild(li);
  });

  medsText.textContent = guide.meds;
  medsNote.textContent = '⚠️ ' + guide.note;
}

// Keep the guide in sync with the month slider
monthSlider.addEventListener('input', () => renderMonthlyGuide(monthSlider.value));
renderMonthlyGuide(1);

// ---- Medication log (personal record only) ----
const medList = document.getElementById('med-list');

function loadMeds() {
  try { return JSON.parse(localStorage.getItem('bloom-meds') || '[]'); }
  catch { return []; }
}

function renderMeds() {
  const meds = loadMeds();
  medList.innerHTML = '';

  if (!meds.length) {
    medList.innerHTML = '<p class="empty-note">Nothing logged yet.</p>';
    return;
  }

  meds.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'med-item';

    const details = document.createElement('div');
    details.className = 'med-details';
    const name = document.createElement('div');
    name.className = 'med-name';
    name.textContent = m.name;
    const dose = document.createElement('div');
    dose.className = 'med-dose';
    dose.textContent = m.dose || '—';
    details.appendChild(name);
    details.appendChild(dose);

    const remove = document.createElement('button');
    remove.className = 'remove-btn';
    remove.textContent = '✕';
    remove.addEventListener('click', () => {
      const list = loadMeds();
      list.splice(i, 1);
      localStorage.setItem('bloom-meds', JSON.stringify(list));
      renderMeds();
    });

    item.appendChild(details);
    item.appendChild(remove);
    medList.appendChild(item);
  });
}

document.getElementById('add-med-btn').addEventListener('click', () => {
  const name = document.getElementById('med-name').value.trim();
  const dose = document.getElementById('med-dose').value.trim();
  if (!name) { alert('Please add a name.'); return; }

  const meds = loadMeds();
  meds.push({ name, dose });
  localStorage.setItem('bloom-meds', JSON.stringify(meds));

  document.getElementById('med-name').value = '';
  document.getElementById('med-dose').value = '';
  renderMeds();
});

renderMeds();

// ============================================================
// v4: SYMPTOM CHECK-IN
// ------------------------------------------------------------
// Deliberately NOT a diagnostic tool. Red-flag answers skip all
// self-care suggestions and route straight to contacting a provider.
// ============================================================
const quizArea = document.getElementById('quiz-area');
const quizResult = document.getElementById('quiz-result');
const quizQuestionEl = document.getElementById('quiz-question');
const quizOptionsEl = document.getElementById('quiz-options');
const quizCountEl = document.getElementById('quiz-count');
const quizProgressFill = document.getElementById('quiz-progress-fill');

let quizIndex = 0;
let quizAnswers = {};

document.getElementById('start-quiz-btn').addEventListener('click', () => {
  quizIndex = 0;
  quizAnswers = {};
  quizResult.classList.add('hidden');
  quizResult.innerHTML = '';
  quizArea.classList.remove('hidden');
  renderQuizStep();
});

function renderQuizStep() {
  const q = SYMPTOM_QUESTIONS[quizIndex];
  if (!q) return finishQuiz();

  quizCountEl.textContent = `Question ${quizIndex + 1} of ${SYMPTOM_QUESTIONS.length}`;
  quizProgressFill.style.width = `${(quizIndex / SYMPTOM_QUESTIONS.length) * 100}%`;
  quizQuestionEl.textContent = q.q;

  quizOptionsEl.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      quizAnswers[q.id] = opt;
      quizIndex++;
      renderQuizStep();
    });
    quizOptionsEl.appendChild(btn);
  });
}

function finishQuiz() {
  quizArea.classList.add('hidden');
  quizProgressFill.style.width = '100%';

  const urgent = [];
  const soft = [];

  SYMPTOM_QUESTIONS.forEach(q => {
    const answer = quizAnswers[q.id];
    if (!answer) return;
    if (answer.urgent === true) urgent.push({ q: q.q, label: answer.label });
    else if (answer.urgent === 'soft') soft.push({ q: q.q, label: answer.label });
  });

  quizResult.innerHTML = '';
  quizResult.classList.remove('hidden');

  if (urgent.length) {
    renderUrgentResult(urgent);
  } else {
    renderCalmResult(soft);
  }

  // Save to the log for the history chart
  const month = parseInt(monthSlider.value, 10);
  const answerSummary = {};
  Object.keys(quizAnswers).forEach(k => { answerSummary[k] = quizAnswers[k].value; });

  fetch(`${API}/api/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: answerSummary, month, flagged: urgent.length > 0 })
  }).then(() => loadSymptomHistory()).catch(() => {});

  quizResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderUrgentResult(urgent) {
  const box = document.createElement('div');
  box.className = 'urgent-box';

  const title = document.createElement('p');
  title.className = 'urgent-title';
  title.textContent = 'Please contact your midwife or maternity unit now';

  const text = document.createElement('p');
  text.className = 'urgent-text';
  text.textContent = 'You mentioned something that care teams want to hear about straight away — at any hour, not at your next appointment. This is not about panicking; it is what they are there for, and they would much rather check and find everything fine.';

  const list = document.createElement('ul');
  list.className = 'urgent-list';
  urgent.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u.label;
    list.appendChild(li);
  });

  const actions = document.createElement('div');
  actions.className = 'urgent-actions';

  const saved = localStorage.getItem('bloom-hospital');
  if (saved) {
    try {
      const h = JSON.parse(saved);
      const call = document.createElement('a');
      call.className = 'urgent-btn';
      call.href = `tel:${h.phone}`;
      call.textContent = `📞 Call ${h.name}`;
      actions.appendChild(call);
    } catch {}
  }

  const goEmergency = document.createElement('button');
  goEmergency.className = 'urgent-btn outline';
  goEmergency.textContent = '🚨 Open emergency numbers';
  goEmergency.addEventListener('click', () => showView('emergency'));
  actions.appendChild(goEmergency);

  const note = document.createElement('p');
  note.className = 'urgent-text';
  note.style.marginTop = '12px';
  note.style.marginBottom = '0';
  note.textContent = 'Bloom is not able to assess symptoms and is not offering self-care suggestions here on purpose. Only your care team can tell you what this means for you.';

  box.appendChild(title);
  box.appendChild(text);
  box.appendChild(list);
  box.appendChild(actions);
  box.appendChild(note);
  quizResult.appendChild(box);
}

function renderCalmResult(soft) {
  const box = document.createElement('div');
  box.className = 'calm-box';

  const title = document.createElement('p');
  title.className = 'calm-title';
  title.textContent = 'Nothing here that needs an urgent call 💛';

  const text = document.createElement('p');
  text.className = 'calm-text';
  text.textContent = 'Based on what you shared, nothing flagged as needing immediate contact. That is not a medical all-clear — if something feels wrong to you, trust that and call your provider anyway.';

  box.appendChild(title);
  box.appendChild(text);
  quizResult.appendChild(box);

  // Comfort guidance for the non-urgent answers
  let any = false;
  Object.keys(quizAnswers).forEach(qid => {
    const key = `${qid}_${quizAnswers[qid].value}`;
    const guidance = SYMPTOM_GUIDANCE[key];
    if (!guidance) return;
    any = true;

    const block = document.createElement('div');
    block.className = 'guidance-block';

    const gTitle = document.createElement('p');
    gTitle.className = 'guidance-title';
    gTitle.textContent = guidance.title;

    const ul = document.createElement('ul');
    guidance.tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      ul.appendChild(li);
    });

    block.appendChild(gTitle);
    block.appendChild(ul);
    quizResult.appendChild(block);
  });

  if (soft.length) {
    const block = document.createElement('div');
    block.className = 'guidance-block';
    const gTitle = document.createElement('p');
    gTitle.className = 'guidance-title';
    gTitle.textContent = 'Worth mentioning to your provider';
    const p = document.createElement('p');
    p.style.fontSize = '13px';
    p.style.lineHeight = '1.6';
    p.style.margin = '0';
    p.textContent = 'Persistent low mood or anxiety in pregnancy is common, recognised, and treatable. Please do bring it up — you do not have to wait until it becomes severe.';
    block.appendChild(gTitle);
    block.appendChild(p);
    quizResult.appendChild(block);
  }

  if (!any && !soft.length) {
    const block = document.createElement('div');
    block.className = 'guidance-block';
    const p = document.createElement('p');
    p.style.fontSize = '13px';
    p.style.margin = '0';
    p.textContent = 'Sounds like a steady week. Keep doing what you are doing 🌸';
    block.appendChild(p);
    quizResult.appendChild(block);
  }
}

// ---- History chart ----
const symptomHistory = document.getElementById('symptom-history');
const historyChart = document.getElementById('history-chart');

async function loadSymptomHistory() {
  try {
    const res = await fetch(`${API}/api/symptoms`);
    const data = await res.json();
    renderSymptomHistory(data.entries || []);
  } catch {}
}

function renderSymptomHistory(entries) {
  if (!entries.length) {
    symptomHistory.classList.add('hidden');
    return;
  }

  symptomHistory.classList.remove('hidden');
  historyChart.innerHTML = '';

  // oldest on the left
  const ordered = entries.slice().reverse().slice(-14);

  ordered.forEach(entry => {
    // count how many answers were anything other than the "all fine" option
    const notable = Object.values(entry.answers).filter(v =>
      !['none', 'normal', 'na', 'fine', 'ok', 'mild'].includes(v)).length;

    const wrap = document.createElement('div');
    wrap.className = 'hbar-wrap';

    const bar = document.createElement('div');
    bar.className = 'hbar' + (entry.flagged ? ' flagged' : '');
    const height = Math.max(6, (notable / SYMPTOM_QUESTIONS.length) * 74);
    bar.style.height = `${height}px`;
    bar.title = `${notable} noted · ${new Date(entry.recordedAt).toLocaleDateString()}`;

    const label = document.createElement('span');
    label.className = 'hbar-label';
    label.textContent = entry.month ? `M${entry.month}` : '—';

    wrap.appendChild(bar);
    wrap.appendChild(label);
    historyChart.appendChild(wrap);
  });
}

loadSymptomHistory();

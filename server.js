const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bloom-dev-secret-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Everyone gets an owner id — a real user id when logged in, otherwise a
// per-browser guest id. This lets guests use the gallery without an account.
function ownerId(req) {
  if (req.session.userId) return req.session.userId;
  if (!req.session.guestId) {
    req.session.guestId = 'guest_' + crypto.randomBytes(10).toString('hex');
  }
  return req.session.guestId;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      cb(null, crypto.randomBytes(14).toString('hex') + path.extname(file.originalname).toLowerCase());
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ============================================================
// AUTH (optional — the app works fully without an account)
// ============================================================
app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.findUserByEmail(email)) return res.status(409).json({ error: 'An account with that email already exists.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.createUser({
    id: crypto.randomBytes(12).toString('hex'),
    email, passwordHash, name: name || ''
  });

  // Carry anything saved as a guest into the new account
  const previousGuestId = req.session.guestId;
  if (previousGuestId) {
    const guestGallery = db.getGallery(previousGuestId);
    guestGallery.slice().reverse().forEach(item => db.addGalleryItem(user.id, item));
  }

  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.findUserByEmail(email || '');
  if (!user) return res.status(401).json({ error: 'Incorrect email or password.' });

  const valid = await bcrypt.compare(password || '', user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Incorrect email or password.' });

  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.findUserById(req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// ============================================================
// PREGNANCY INFO
// ============================================================
app.get('/api/pregnancy', (req, res) => {
  res.json({ info: db.getPregnancyInfo(ownerId(req)) });
});

app.post('/api/pregnancy', (req, res) => {
  res.json({ info: db.savePregnancyInfo(ownerId(req), req.body) });
});

// ============================================================
// EMERGENCY CONTACTS
// ============================================================
app.get('/api/contacts', (req, res) => {
  res.json({ contacts: db.getContacts(ownerId(req)) });
});

app.post('/api/contacts', (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: 'contacts must be an array.' });
  res.json({ contacts: db.saveContacts(ownerId(req), contacts) });
});

// ============================================================
// GALLERY
// ============================================================
app.get('/api/gallery', (req, res) => {
  res.json({ items: db.getGallery(ownerId(req)) });
});

app.post('/api/gallery', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

  const item = {
    id: crypto.randomBytes(8).toString('hex'),
    filename: req.file.filename,
    originalName: req.file.originalname,
    caption: (req.body.caption || '').slice(0, 200),
    uploadedAt: new Date().toISOString()
  };

  db.addGalleryItem(ownerId(req), item);
  res.json({ item });
});

app.delete('/api/gallery/:id', (req, res) => {
  const removed = db.removeGalleryItem(ownerId(req), req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found.' });
  fs.unlink(path.join(UPLOAD_DIR, removed.filename), () => {});
  res.json({ ok: true });
});

// Serve uploaded images, but only to the person who owns them
app.get('/api/gallery/file/:filename', (req, res) => {
  const owner = ownerId(req);
  const owns = db.getGallery(owner).some(i => i.filename === req.params.filename);
  if (!owns) return res.status(403).json({ error: 'Not yours.' });

  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing.' });
  res.sendFile(filePath);
});

// ============================================================
// COMMUNITY: group chat + shared gallery
// ------------------------------------------------------------
// Open to everyone, including guests. Messages are kept in the JSON
// store with a rolling cap. Clients poll /api/community/messages with
// a "since" timestamp, which keeps this dependency-free.
// ============================================================
const MESSAGE_CAP = 300;

function displayNameFor(req) {
  if (req.session.userId) {
    const user = db.findUserById(req.session.userId);
    if (user) return user.name || user.email.split('@')[0];
  }
  return 'Guest ' + ownerId(req).slice(-4);
}

app.get('/api/community/messages', (req, res) => {
  const since = parseInt(req.query.since, 10) || 0;
  const all = db.getCommunityMessages();
  const fresh = since ? all.filter(m => m.ts > since) : all.slice(-60);
  res.json({ messages: fresh, serverTime: Date.now(), you: ownerId(req) });
});

app.post('/api/community/messages', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Message cannot be empty.' });
  if (text.length > 600) return res.status(400).json({ error: 'Message is too long.' });

  const message = {
    id: crypto.randomBytes(8).toString('hex'),
    author: displayNameFor(req),
    ownerId: ownerId(req),
    text,
    ts: Date.now()
  };

  db.addCommunityMessage(message, MESSAGE_CAP);
  res.json({ message });
});

app.delete('/api/community/messages/:id', (req, res) => {
  const ok = db.removeCommunityMessage(req.params.id, ownerId(req));
  if (!ok) return res.status(403).json({ error: 'You can only remove your own messages.' });
  res.json({ ok: true });
});

// Shared gallery — separate from the private one. Nothing is shared
// automatically; a user has to explicitly post an image here.
app.get('/api/community/gallery', (req, res) => {
  res.json({ items: db.getCommunityGallery(), you: ownerId(req) });
});

app.post('/api/community/gallery', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

  const item = {
    id: crypto.randomBytes(8).toString('hex'),
    filename: req.file.filename,
    caption: (req.body.caption || '').slice(0, 200),
    author: displayNameFor(req),
    ownerId: ownerId(req),
    uploadedAt: new Date().toISOString()
  };

  db.addCommunityGalleryItem(item, 120);
  res.json({ item });
});

app.delete('/api/community/gallery/:id', (req, res) => {
  const removed = db.removeCommunityGalleryItem(req.params.id, ownerId(req));
  if (!removed) return res.status(403).json({ error: 'You can only remove your own posts.' });
  fs.unlink(path.join(UPLOAD_DIR, removed.filename), () => {});
  res.json({ ok: true });
});

// Community images are public by design, so this route has no owner check
app.get('/api/community/file/:filename', (req, res) => {
  const exists = db.getCommunityGallery().some(i => i.filename === req.params.filename);
  if (!exists) return res.status(404).json({ error: 'Not found.' });
  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing.' });
  res.sendFile(filePath);
});

// ============================================================
// SYMPTOM LOG
// ============================================================
app.get('/api/symptoms', (req, res) => {
  res.json({ entries: db.getSymptomLog(ownerId(req)) });
});

app.post('/api/symptoms', (req, res) => {
  const { answers, month, flagged } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers required' });
  }
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    month: month || null,
    answers,
    flagged: Boolean(flagged),
    recordedAt: new Date().toISOString()
  };
  db.addSymptomEntry(ownerId(req), entry, 60);
  res.json({ entry });
});

// ============================================================
// CHAT
// ------------------------------------------------------------
// Calls a real AI model if an API key is set as an environment variable.
// The key lives here on the server and is never exposed to the browser.
//
//   ANTHROPIC_API_KEY=sk-ant-...   (uses Claude)
//   OPENAI_API_KEY=sk-...          (uses GPT)
//
// With no key set, this returns { fallback: true } and the frontend uses
// its built-in tips, so the app always works out of the box.
// ============================================================

const SYSTEM_PROMPT = `You are a warm, gentle wellness companion inside a pregnancy app called Bloom.

WHAT YOU DO
- Offer general comfort, wellness, and lifestyle information.
- Help users understand pregnancy terminology and what it generally means.
- Help users prepare good questions to ask their doctor or midwife.

HARD BOUNDARIES — these are not negotiable
- You are NOT a doctor. Never diagnose, never prescribe, never assess whether something is normal or abnormal for this specific person.
- Never say or imply that something is "fine", "normal", "healthy", or "nothing to worry about" in a medical sense.
- For anything involving symptoms, pain, bleeding, medication, reduced movement, or anything that sounds urgent, warmly and promptly direct the user to contact their doctor or midwife. Do not attempt to evaluate it yourself.

IF THE USER SHARES AN IMAGE (ultrasound, lab report, prescription, etc.)
- Do NOT interpret it medically. Do not state what you observe in a scan, do not estimate measurements, do not comment on whether anything looks healthy, well-formed, correctly positioned, or concerning. You are not reliable at this and a wrong answer could cause real harm.
- Instead: explain what the general TYPE of scan or report is for, define any terminology or abbreviations the user asks about in general terms, and help them write down clear questions to bring to their next appointment.
- Say plainly and kindly that reading their specific scan is their doctor's job, and that only their care team can tell them what it means for them.

TONE: kind, calm, encouraging, concise. 2-4 short sentences unless explaining terminology. Speak like a supportive friend, never like a clinical document.`;

app.post('/api/chat', async (req, res) => {
  const { message, history, image } = req.body;

  if (!message && !image) {
    return res.status(400).json({ error: 'A message or image is required.' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return res.json({ fallback: true, hadImage: Boolean(image) });
  }

  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
  const userText = message || 'I uploaded an image — can you help me understand what this kind of scan or report is, and what questions I should ask my doctor about it?';

  try {
    let reply;

    if (anthropicKey) {
      const content = [];
      if (image && image.data && image.mediaType) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: image.mediaType, data: image.data }
        });
      }
      content.push({ type: 'text', text: userText });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [...recentHistory, { role: 'user', content }]
        })
      });

      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json();
      reply = data.content.map(b => b.text || '').join('').trim();

    } else {
      const content = [{ type: 'text', text: userText }];
      if (image && image.data && image.mediaType) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:${image.mediaType};base64,${image.data}` }
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 600,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...recentHistory,
            { role: 'user', content }
          ]
        })
      });

      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json();
      reply = data.choices[0].message.content.trim();
    }

    if (!reply) return res.json({ fallback: true, hadImage: Boolean(image) });
    res.json({ reply });

  } catch (err) {
    console.error('AI chat error:', err.message);
    res.json({ fallback: true, hadImage: Boolean(image) });
  }
});

app.listen(PORT, () => {
  console.log(`Bloom server running at http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log('Note: no AI key set — chat uses built-in tips. See README to enable live AI.');
  }
});

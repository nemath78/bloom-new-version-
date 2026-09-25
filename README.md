# Bloom 🌸 — your pregnancy companion

Due date timeline, growth tracker, wellness chat, photo gallery, and emergency contacts.

## Run it

```
npm install
npm start
```
Open http://localhost:3000

## What's in this version

**Header** — the disclaimer banner is out of the header. "by nemath" sits under the
Bloom title, and your support email is in the top corner. The disclaimer text now
lives in the page footer (see note at the bottom of this file).

**Gallery tab** — upload photos by click or drag-and-drop. Any image you send in
chat is saved here automatically too. Click any photo to open it full size.
Images are stored server-side in `uploads/` and are only served to the person who
uploaded them.

**Chat with image upload** — tap 📎 to attach a scan or report. See the boundary
note below for what the AI will and won't do with it.

**Growth tab** — now includes your fetal development video, bundled at
`public/media/fetal-development.mp4`. To swap in a different clip, drop your file
in `public/media/` and update the `<source>` path in `index.html`. MP4 (H.264)
plays everywhere.

**Advanced timeline** — appears once you calculate a due date. Shows estimated
length and weight benchmarks for your week, per-trimester progress bars, a
milestone track (heartbeat, anatomy scan, viability, term), and a days-remaining
countdown.

## Enabling live AI chat

Without a key, chat uses built-in tips — works immediately, costs nothing.

To connect a real model, set a key as an environment variable. It must stay on the
server; if it's in browser code, anyone can read it and run up charges.

```
ANTHROPIC_API_KEY=sk-ant-your-key npm start     # uses Claude (vision-capable)
OPENAI_API_KEY=sk-your-key npm start            # uses GPT-4o (vision-capable)
```

Deploying: add the key under your host's **Environment Variables** settings, never
in a commit.

## About scan images — please read before changing this

The chat accepts image uploads and passes them to a vision model, but the system
prompt in `server.js` instructs the model **not to interpret scans or reports
medically**. It won't say what it sees, estimate measurements, or comment on
whether anything looks healthy or concerning. Instead it explains terminology in
general terms and helps the user prepare questions for their appointment.

This is deliberate. Vision models are unreliable at medical imaging and will give
a confident, fluent answer whether or not it's correct. In a pregnancy app, a
wrongly reassuring reply could lead someone to not call their doctor about
something that mattered. If you edit `SYSTEM_PROMPT`, please keep those
boundaries in place.

## The disclaimer

It moved from the header banner to the footer, so it's out of the way but still
present on every page. I'd suggest keeping it somewhere visible — for a pregnancy
app it protects your users and it protects you.

## Data storage

Accounts, pregnancy info, contacts, and gallery metadata live in `data/db.json`;
uploaded images live in `uploads/`. Simple to run anywhere, but on hosts with
non-persistent disk (like Render's free tier) both can be wiped on restart. All
storage logic is isolated in `db.js`, so moving to a real database later means
rewriting that one file. For images at scale you'd want object storage (S3,
Cloudflare R2) rather than local disk.

---

# v4 additions

## Public Insights tab
Seven expandable articles (trimester guides, movement, nutrition, mental health,
appointments) with tag filtering. Fully readable without an account. Content
lives in `public/js/content.js` — edit `INSIGHTS` to add your own.

## Community: group chat + shared gallery
Public chat open to everyone including guests. Messages poll every 3 seconds
while the tab is open, and stop polling when it isn't. You can delete your own
messages. Capped at 300 messages.

The shared gallery is **separate from your private gallery** and nothing crosses
over automatically. Posting requires ticking an explicit consent box first,
because ultrasound images routinely have the patient's name, date of birth and
hospital ID printed on them and those can't be un-shared once public.

**Before going live with real users**, you'll want moderation — a report button,
a blocklist, or approval before images appear. Public image posting without
moderation gets abused eventually. Happy to build that next.

## Experts tab
Two categories (Fertility & Expert, IVF) with a "Talk to an expert" button.

**Setup needed:** `EXPERT_PHONE` in `public/js/app.js` is deliberately empty. Set
it to your real consultation number. Until you do, the button offers email
instead of dialling — a call button that rings a made-up number is worse than no
button.

## Emergency tab + SOS icon
A 🚨 icon in the header jumps straight here from anywhere.

- **Emergency numbers** by country (10 countries, India default), one-tap dial.
- **Hospital finder** uses browser geolocation to open live maps searches for
  hospitals, maternity units, and open pharmacies. Coordinates never leave the
  device — they only build the link.
- **Your own hospital** — save your maternity unit's real number for one-tap
  access. In an emergency this is usually the most useful call.

I did not hardcode a hospital database. I have no live source for one, numbers
change, and a wrong number dialled in an emergency is a serious failure. Live
maps data is accurate; a baked-in list would rot.

## Growth tab: diet, medication log, symptom check-in
- **Monthly diet guidance** and supplement topics, synced to the month slider.
- **Medication log** — your own record to bring to appointments. Bloom never
  recommends medication; it only stores what you enter.
- **Symptom check-in** — 8 questions, with a month-wise history chart.

**How the check-in handles risk:** answers for bleeding, reduced fetal movement,
severe headache or vision changes, sudden facial swelling, and inability to keep
fluids down are marked as red flags. If any is selected, the result screen shows
**only** a prompt to contact the maternity unit — with a one-tap call button if
you've saved your hospital — and deliberately shows **no** self-care tips. These
are symptoms where comfort advice could delay care that matters. Non-urgent
answers get comfort guidance as normal.

If you edit `SYMPTOM_QUESTIONS` in `content.js`, keep the `urgent: true` flags on
those items.

## Header & navigation
- **Back button** (←) on the left, with full navigation history.
- **`contact us on:`** label added above the support email.
- **🚨 SOS icon** for instant emergency access.
- All nav tabs, cards, and icons are interactive.

## Styling
All existing CSS was preserved. v4 styles are appended at the end of
`style.css` and use only the existing palette variables, fonts and animations.

// A lightweight file-based "database". Keeps the project dependency-free so it
// runs anywhere. All storage logic lives here — swap these functions for real
// database calls later without touching the routes.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function emptyDB() {
  return {
    users: [],
    pregnancyInfo: {},
    contacts: {},
    gallery: {},
    communityMessages: [],
    communityGallery: [],
    symptomLog: {}
  };
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    return emptyDB();
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return { ...emptyDB(), ...db };
  } catch {
    return emptyDB();
  }
}

function writeDB(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---- Users ----
function findUserByEmail(email) {
  return readDB().users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return readDB().users.find(u => u.id === id);
}

function createUser({ id, email, passwordHash, name }) {
  const db = readDB();
  const user = { id, email, passwordHash, name, createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  return user;
}

// ---- Pregnancy info ----
function getPregnancyInfo(ownerId) {
  return readDB().pregnancyInfo[ownerId] || null;
}

function savePregnancyInfo(ownerId, info) {
  const db = readDB();
  db.pregnancyInfo[ownerId] = { ...info, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.pregnancyInfo[ownerId];
}

// ---- Emergency contacts ----
function getContacts(ownerId) {
  return readDB().contacts[ownerId] || [];
}

function saveContacts(ownerId, contacts) {
  const db = readDB();
  db.contacts[ownerId] = contacts;
  writeDB(db);
  return contacts;
}

// ---- Gallery ----
// Each entry: { id, filename, originalName, caption, uploadedAt }
function getGallery(ownerId) {
  return readDB().gallery[ownerId] || [];
}

function addGalleryItem(ownerId, item) {
  const db = readDB();
  db.gallery[ownerId] = db.gallery[ownerId] || [];
  db.gallery[ownerId].unshift(item); // newest first
  writeDB(db);
  return item;
}

function removeGalleryItem(ownerId, itemId) {
  const db = readDB();
  const list = db.gallery[ownerId] || [];
  const index = list.findIndex(i => i.id === itemId);
  if (index === -1) return null;
  const [removed] = list.splice(index, 1);
  db.gallery[ownerId] = list;
  writeDB(db);
  return removed;
}


// ---- Community chat ----
function getCommunityMessages() {
  return readDB().communityMessages || [];
}

function addCommunityMessage(message, cap) {
  const db = readDB();
  db.communityMessages = db.communityMessages || [];
  db.communityMessages.push(message);
  if (db.communityMessages.length > cap) {
    db.communityMessages = db.communityMessages.slice(-cap);
  }
  writeDB(db);
  return message;
}

function removeCommunityMessage(id, ownerId) {
  const db = readDB();
  const list = db.communityMessages || [];
  const index = list.findIndex(m => m.id === id && m.ownerId === ownerId);
  if (index === -1) return false;
  list.splice(index, 1);
  db.communityMessages = list;
  writeDB(db);
  return true;
}

// ---- Community gallery ----
function getCommunityGallery() {
  return readDB().communityGallery || [];
}

function addCommunityGalleryItem(item, cap) {
  const db = readDB();
  db.communityGallery = db.communityGallery || [];
  db.communityGallery.unshift(item);
  if (db.communityGallery.length > cap) {
    db.communityGallery = db.communityGallery.slice(0, cap);
  }
  writeDB(db);
  return item;
}

function removeCommunityGalleryItem(id, ownerId) {
  const db = readDB();
  const list = db.communityGallery || [];
  const index = list.findIndex(i => i.id === id && i.ownerId === ownerId);
  if (index === -1) return null;
  const [removed] = list.splice(index, 1);
  db.communityGallery = list;
  writeDB(db);
  return removed;
}

// ---- Symptom log ----
function getSymptomLog(ownerId) {
  return (readDB().symptomLog || {})[ownerId] || [];
}

function addSymptomEntry(ownerId, entry, cap) {
  const db = readDB();
  db.symptomLog = db.symptomLog || {};
  db.symptomLog[ownerId] = db.symptomLog[ownerId] || [];
  db.symptomLog[ownerId].unshift(entry);
  if (db.symptomLog[ownerId].length > cap) {
    db.symptomLog[ownerId] = db.symptomLog[ownerId].slice(0, cap);
  }
  writeDB(db);
  return entry;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getPregnancyInfo,
  savePregnancyInfo,
  getContacts,
  saveContacts,
  getGallery,
  addGalleryItem,
  removeGalleryItem,
  getCommunityMessages,
  addCommunityMessage,
  removeCommunityMessage,
  getCommunityGallery,
  addCommunityGalleryItem,
  removeCommunityGalleryItem,
  getSymptomLog,
  addSymptomEntry
};

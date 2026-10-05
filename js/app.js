// ============ IMPORTS ============
import { firebaseConfig } from './firebase-config.js';
import { cloudinaryConfig } from './cloudinary-config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============ INIT ============
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;

// ============ UI HELPERS ============
window.showToast = (msg, type = '') => {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast ' + type, 3000);
};

window.showLoader = (show) => {
  document.getElementById('loader').classList.toggle('hidden', !show);
};

window.toggleMenu = () => {
  document.getElementById('navMenu').classList.toggle('open');
};

// ============ NAVIGATION ============
window.navigate = (page) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('navMenu').classList.remove('open');

  if (page === 'dashboard' && currentUser) {
    loadMySubmissions();
    updateProfile();
  }
};

window.switchTab = (btn) => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
};

// ============ AUTH ============
window.loginWithGoogle = async () => {
  try {
    showLoader(true);
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error(err);
    showToast('Gagal login: ' + err.message, 'error');
  } finally {
    showLoader(false);
  }
};

window.logout = async () => {
  await signOut(auth);
  showToast('Berhasil keluar');
  navigate('home');
};

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  const loginBtn = document.getElementById('loginBtn');
  const userArea = document.getElementById('userArea');
  const navDash = document.getElementById('navDash');
  const submitGuest = document.getElementById('submitGuest');
  const submitForm = document.getElementById('submitForm');

  if (user) {
    loginBtn.classList.add('hidden');
    userArea.classList.remove('hidden');
    navDash.classList.remove('hidden');
    submitGuest?.classList.add('hidden');
    submitForm?.classList.remove('hidden');

    document.getElementById('userAvatar').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName);
    document.getElementById('userName').textContent = user.displayName?.split(' ')[0] || 'User';
  } else {
    loginBtn.classList.remove('hidden');
    userArea.classList.add('hidden');
    navDash.classList.add('hidden');
    submitGuest?.classList.remove('hidden');
    submitForm?.classList.add('hidden');
  }
});

// ============ UPLOAD TO CLOUDINARY ============
async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        document.getElementById('progressBar').style.width = pct + '%';
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload gagal: ' + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

// ============ SUBMIT HANDLER ============
window.handleSubmit = async (e) => {
  e.preventDefault();
  if (!currentUser) return showToast('Silakan login dulu', 'error');

  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const progress = document.getElementById('uploadProgress');
  const fileInput = document.getElementById('manuscriptInput');
  const file = fileInput.files[0];

  if (!file) return showToast('Pilih file naskah', 'error');
  if (file.size > 10 * 1024 * 1024) return showToast('File maksimal 10MB', 'error');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengunggah...';
    progress.classList.remove('hidden');

    // 1. Upload ke Cloudinary
    const uploadResult = await uploadToCloudinary(file);

    submitBtn.textContent = 'Menyimpan...';

    // 2. Simpan metadata ke Firestore
    await addDoc(collection(db, 'submissions'), {
      uid: currentUser.uid,
      authorName: currentUser.displayName,
      authorEmail: currentUser.email,
      authorPhoto: currentUser.photoURL,
      title: form.title.value.trim(),
      abstract: form.abstract.value.trim(),
      keywords: form.keywords.value.split(',').map(k => k.trim()).filter(Boolean),
      section: form.section.value,
      type: form.type.value,
      affiliation: form.affiliation.value.trim(),
      fileUrl: uploadResult.secure_url,
      fileName: file.name,
      fileSize: file.size,
      status: 'submitted',
      createdAt: serverTimestamp()
    });

    form.reset();
    progress.classList.add('hidden');
    document.getElementById('progressBar').style.width = '0%';
    showToast('✅ Naskah berhasil dikirim!', 'success');
    navigate('dashboard');

  } catch (err) {
    console.error(err);
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirim Naskah';
  }
};

// ============ LOAD SUBMISSIONS ============
async function loadMySubmissions() {
  const container = document.getElementById('mySubmissions');
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, 'submissions'),
      where('uid', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = '<div class="empty">Belum ada submisi. <a href="#" onclick="navigate(\'submit\');return false" style="color:var(--primary)">Submit sekarang</a></div>';
      return;
    }

    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    container.innerHTML = items.map(item => `
      <div class="article-item">
        <h4>${escapeHtml(item.title)}</h4>
        <div class="article-meta">
          <span class="status ${item.status}">${item.status}</span>
          <span>•</span>
          <span>${item.section}</span>
          <span>•</span>
          <span>${item.type}</span>
        </div>
        <p class="article-abstract">${escapeHtml(item.abstract)}</p>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="${item.fileUrl}" target="_blank" class="btn btn-outline" style="padding:6px 12px;font-size:12px">📄 Lihat Naskah</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty">Gagal memuat data</div>';
  }
}

// ============ LOAD ARCHIVES (PUBLISHED) ============
async function loadArchives() {
  const container = document.getElementById('archivesList');
  try {
    const q = query(
      collection(db, 'submissions'),
      where('status', '==', 'published')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = '<div class="empty">Belum ada artikel yang dipublikasikan</div>';
      return;
    }

    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    container.innerHTML = items.map(item => `
      <div class="article-item">
        <h4>${escapeHtml(item.title)}</h4>
        <div class="article-meta">
          <span>👤 ${escapeHtml(item.authorName || '-')}</span>
          <span>•</span>
          <span>${item.section}</span>
        </div>
        <p class="article-abstract">${escapeHtml(item.abstract)}</p>
        <div style="margin-top:12px">
          <a href="${item.fileUrl}" target="_blank" class="btn btn-primary" style="padding:6px 12px;font-size:12px">📥 Download PDF</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

// ============ PROFILE ============
function updateProfile() {
  if (!currentUser) return;
  document.getElementById('dashboardGreeting').textContent = `Selamat datang, ${currentUser.displayName || 'Penulis'}!`;
  document.getElementById('profileAvatar').src = currentUser.photoURL || '';
  document.getElementById('profileName').textContent = currentUser.displayName || '-';
  document.getElementById('profileEmail').textContent = currentUser.email || '-';
}

// ============ STATS ============
async function loadStats() {
  try {
    const snapshot = await getDocs(collection(db, 'submissions'));
    document.getElementById('statArticles').textContent = snapshot.size;
  } catch (err) {
    console.error(err);
  }
}

// ============ UTILS ============
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============ INIT APP ============
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('menuToggle').addEventListener('click', toggleMenu);
  loadStats();
  loadArchives();

  // Handle hash navigation
  const hash = window.location.hash.replace('#', '') || 'home';
  if (['home','archives','about','submit','dashboard'].includes(hash)) {
    navigate(hash);
  }
});

// Expose helper ke HTML
window.escapeHtml = escapeHtml;
# 🎓 Jurnal PERI Palopo — Frontend

Web app OJS-style untuk **Jurnal PERI Palopo** (Pembangunan, Riset dan Inovasi) — Bapperida Kota Palopo.

## ✨ Fitur MVP
- ✅ Landing page jurnal (hero, scope, stats, pengumuman)
- ✅ Arsip artikel (hanya yang berstatus `published`)
- ✅ Halaman Tentang + Panduan Penulis
- ✅ Login dengan Google (Firebase Auth)
- ✅ Formulir submisi artikel + upload ke Cloudinary
- ✅ Dashboard penulis (lihat submisi sendiri)
- ✅ Responsive (mobile-first, cocok dikembangkan dari HP)

## 🛠 Setup

### 1. Firebase
1. Buka https://console.firebase.google.com
2. Buat project baru → aktifkan **Authentication → Google**
3. Buat **Firestore Database** (mode production/test)
4. Salin config ke `js/firebase-config.js`

**Firestore Rules (Development):**
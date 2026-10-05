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


### 2. Cloudinary
1. Daftar gratis di https://cloudinary.com
2. Buka **Settings → Upload → Upload presets**
3. Buat preset baru: **Unsigned mode**
4. Salin `cloudName` & `uploadPreset` ke `js/cloudinary-config.js`

### 3. Deploy ke GitHub Pages
1. Push semua file ke repo GitHub
2. **Settings → Pages → Source: main / root**
3. Akses: `https://username.github.io/nama-repo/`

## 📁 Struktur


## 🚀 Roadmap Berikutnya
- [ ] Panel Editor (approve/reject/ubah status)
- [ ] Halaman detail artikel + DOI
- [ ] Komentar & diskusi
- [ ] Export metadata (OAI-PMH, Crossref XML)
- [ ] Multi-bahasa (ID/EN)
- [ ] Search & filter artikel

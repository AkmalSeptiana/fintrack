# 💹 FinTrack (Financial Tracker)

> *"Kelola Keuangan Pribadi dengan Cerdas & Rapi"*

Aplikasi Web **Single Page Application (SPA)** berbasis *Mobile-First Container View* untuk memantau, mengelola, dan menganalisis keuangan pribadi (Pemasukan, Pengeluaran, & Tabungan) secara mudah, cerdas, aman, dan interaktif.

![License](https://img.shields.io/badge/License-MIT-emerald.svg)
![App Name](https://img.shields.io/badge/App-FinTrack-emerald.svg)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20TailwindCSS%20%7C%20JavaScript%20%7C%20GAS-blue.svg)

---

## 🌟 Fitur Utama

- 📲 **Progressive Web App (PWA)**: Berjalan layaknya aplikasi bawaan (native app) di HP Android & iOS! Bisa di-install langsung ke Layar Utama (*Home Screen*) tanpa melalui Play Store / App Store.
- 📱 **Mobile-First Container Design**: Tampilan antarmuka *responsive* dengan gaya modern (*Glassmorphism*, gradien Emerald, dan animasi halus).
- 📊 **Visual Breakdown Chart**: Diagram Donut interaktif (*Chart.js*) untuk melihat distribusi pengeluaran per kategori.
- 🏆 **Ranking Pengeluaran Interaktif**: Baris progresif kategori pengeluaran terbanyak beserta opsi penyortiran (*Tertinggi/Terendah*).
- 📥 **Manajemen Transaksi Multi-Tipe**: Catat *Pemasukan*, *Pengeluaran*, dan *Tabungan* dengan format otomatis Rupiah (IDR).
- 🗓️ **Filter Pemilih Bulan**: Tinjau histori & analisis ringkasan keuangan berdasarkan bulan & tahun.
- ⚡ **Hybrid Mode (Cloud Sync & Offline Support)**:
  - **Cloud Mode**: Tersinkronisasi otomatis dengan **Google Spreadsheet** via Google Apps Script (GAS).
  - **Local Mode**: Berjalan 100% offline menggunakan *Service Worker* & *LocalStorage* browser jika tanpa API.
- ⚙️ **Kelola Master Kategori**: Tambah & hapus kategori kustom sesuai kebutuhan Anda.

---

## 📁 Struktur Direktori

```text
.
├── index.html            # Struktur HTML5 utama SPA
├── style.css             # Custom styling, animasi, & CSS tokens
├── app.js                # Logika aplikasi frontend, PWA handler, & API
├── manifest.json         # Konfigurasi PWA Web App Manifest
├── sw.js                 # Service Worker PWA (Offline caching)
├── icon.svg              # Ikon vektor aplikasi FinTrack
├── Code.gs               # Backend Script untuk Google Apps Script (GAS)
├── push-to-github.bat    # Skrip otomatis Git Push (Double-click di Windows)
├── .gitignore            # Berkas pengecualian Git
└── README.md             # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/AkmalSeptiana/fintrack.git
   cd fintrack
   ```

2. **Buka Aplikasi**:
   - Cukup buka berkas `index.html` langsung di browser Anda (atau gunakan ekstensi *Live Server* di VS Code).

---

## 🔗 Panduan Hubungkan ke Google Apps Script (Optional)

1. Buka [Google Sheets](https://sheets.google.com) dan buat Spreadsheet baru.
2. Buka menu **Ekstensi > Apps Script**.
3. Salin dan tempel seluruh isi berkas `Code.gs` ke editor Apps Script.
4. Klik **Deploy > Terapan Baru (New Deployment)**:
   - Pilih jenis: **Web App**.
   - Akses: **Siapa saja (Anyone)**.
5. Salin **Web App URL** yang didapatkan.
6. Buka aplikasi di browser, masuk ke menu **Akun**, tempel URL pada kolom **Koneksi Google Apps Script**, lalu klik **Simpan & Tes Koneksi API**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

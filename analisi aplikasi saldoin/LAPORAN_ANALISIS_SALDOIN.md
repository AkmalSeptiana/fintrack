# 📊 Laporan Analisis Komprehensif Aplikasi Saldoin (com.selo.rvsd)
> **Tanggal Analisis**: 28 September 2026  
> **Metode Observasi**: Direct ADB Screenshot Capture & Screen Recording (138 Tangkapan Layar)  
> **Tujuan**: Benchmark & Reverse Engineering untuk Pengembangan Penyempurnaan **Fintrack**

---

## 📌 Executive Summary

**Saldoin** adalah aplikasi pencatatan keuangan pribadi (*Personal Finance Manager*) Android yang menonjolkan pendekatan **UX Minimalis Modern**, **Otomasi Alokasi Tabungan**, dan **Integrasi AI via WhatsApp**. 

Berdasarkan analisis 138 screenshot dari alur navigasi lengkap, Saldoin berhasil menggabungkan fleksibilitas manajemen keuangan (multi-akun, anggaran bulanan, target tabungan) dengan fitur diferensiasi tinggi seperti **Auto-Split Tabungan Otomatis** dan **WhatsApp Bot (OCR Struk & Voice Note)**.

---

## 🏗️ Pembedahan Fitur & Struktur Modul Saldoin

### 1. 🏠 Dashboard & Navigasi Utama
* **Header**: Menyapa pengguna ("Selamat Malam"), menampilkan **Total Saldo** gabungan dari seluruh akun dengan indikator jumlah akun terhubung.
* **Summary Cards**:
  * Card **Pemasukan** (hijau mint soft)
  * Card **Pengeluaran** (merah muda soft)
* **Transaksi Terbaru**: Menampilkan 3-5 daftar transaksi terakhir lengkap dengan kategori, akun sumber, dan nominal.
* **Quick Action Buttons (Aksi Cepat)**:
  1. ➕ **Catat** (Input Transaksi)
  2. 🔄 **Transfer** (Pindah Saldo antar Akun/Bank)
  3. 💬 **WA Bot** (Catat via WhatsApp AI)
  4. 🔀 **Split / Rule** (Alokasi Tabungan Otomatis)
* **Bottom Navigation**: 4 Tab Utama (`Dashboard`, `Transaksi`, `Analisa`, `Akun`).

---

### 2. 💳 Manajemen Akun & Dompet (Multi-Account)
* **Tipe Akun**:
  * Tunai / Cash
  * Bank (BRI, BCA, Mandiri, dll)
  * E-Wallet (GoPay, OVO, ShopeePay, DANA)
* **Field Akun**:
  * Nama Akun
  * Saldo Awal / Current Balance
  * Kategori/Tipe Akun
  * Ikon & Warna Visual Custom

---

### 3. 🏷️ Kategori Transaksi (Custom & Presets)
* Membagi kategori ke dalam 2 tipe utama: **Pengeluaran** dan **Pemasukan**.
* Fitur custom icon & warna untuk pengelompokan visual yang intuitif (Makanan & Minuman, Belanja, Hiburan, Kesehatan, Transportasi, Dll).

---

### 4. 🎯 Target Tabungan (Savings Goals / "Nabung")
* Pengguna dapat membuat target tabungan tertentu (misal: "Rumah Ayam", "Beli Laptop", "Dana Darurat").
* **Elemen Visual**:
  * Total Terkumpul vs Target Nominal
  * Persentase Progress (%) & Progress Bar
  * Badge Sisa Hari (Countdown target)
  * Status Target: `Aktif` / `Tercapai`
  * Tab **Riwayat Setoran** untuk melacak riwayat akumulasi tabungan.

---

### 5. 🔀 Aturan Tabungan Otomatis (Auto-Split Allocation Rules)
* **Fitur Unggulan / Killer Feature**:
  * Pengguna membuat rule/aturan (misal: "Tabungan Otomatis Gaji").
  * **Trigger**: Mengatur *Min. Pemasukan* (misal: Rp 100.000).
  * **Action / Distribution**: Menentukan porsi persentase alokasi (misal: 40% masuk Target BRI, 60% masuk Target Tabungan).
  * Menampilkan visual meteran *Distribusi Alokasi (100/100%)*.

---

### 6. 📅 Transaksi Berulang (Recurring Transactions)
* Mengatur transaksi otomatis berkala (misal: langganan bulanan, sewa kos, tagihan listrik, cicilan).
* Mengurangi beban manual entry untuk pengeluaran/pemasukan rutin.

---

### 7. 🔁 Transfer Antar Akun
* Formulir transfer antar dompet/bank yang bersih:
  * Akun Asal (From)
  * Akun Tujuan (To)
  * Nominal Transfer
  * Biaya Admin (Opsional)
  * Catatan Tambahan

---

### 8. 📊 Analisis & Laporan Keuangan
* **Visualisasi Pie Chart & Bar Chart**:
  * Distribusi Pengeluaran per Kategori.
  * Perbandingan Trend Pemasukan vs Pengeluaran.
  * Rincian persentase setiap kategori pengeluaran.

---

### 9. 🤖 Integrasi WhatsApp AI Bot (BETA Feature)
* **Konsep**: Memudahkan pencatatan tanpa perlu membuka aplikasi utama.
* **3 Mode Pencatatan via WA**:
  1. **Teks NLP**: Kirim chat biasa (contoh: `"beli kopi 25rb"`) $\rightarrow$ Bot otomatis parsing nominal & kategori.
  2. **Foto Struk (OCR AI)**: Kirim foto struk belanja $\rightarrow$ AI membaca total belanja & tanggal secara otomatis.
  3. **Voice Note (Speech-to-Text AI)**: Kirim pesan suara $\rightarrow$ Dikonversi menjadi data transaksi.

---

### 10. 🔔 Pengaturan & Pengingat Harian (Daily Notification Reminder)
* Fitur penentuan jam pengingat harian (misal jam 21:00) untuk mendorong konsistensi pengguna mencatat pengeluaran sebelum tidur.

---

## ⚡ Matrix Perbandingan: Saldoin vs Fintrack (Gap Analysis)

| Fitur / Dimensi | Saldoin (Benchmark) | Fintrack (Saat Ini / Target) | Rekomendasi Penyempurnaan Fintrack |
| :--- | :--- | :--- | :--- |
| **UI/UX Design** | Light mode soft pastel, modern rounded cards, bersih | Perlu modernisasi UI | Gunakan **Dark/Glassmorphism Theme**, warna kontras tinggi, micro-animations |
| **Multi-Akun** | Ya (Tunai, Bank, E-Wallet) | Ya | Tambahkan visual card badge & filter transaksi per akun |
| **Target Tabungan** | Progress bar + countdown hari | Dasar | Tambahkan fitur milestone breakdown & visual goal celebratory animation |
| **Auto-Split Rules** | Rule porsi persentase alokasi tabungan | Belum ada | **Wajib Diimplementasikan**: Mesin aturan alokasi gaji otomatis |
| **WA Bot / AI Input** | Teks, OCR Struk, Voice Note | Belum ada | Integrasi Telegram/WA Bot atau Quick Voice Input langsung di App |
| **Analytics** | Chart kategori & perbandingan | Chart standar | Tambahkan **Financial Health Score** & Proyeksi Sisa Uang |
| **Keamanan** | PIN / Biometrik standar | Standar | Biometric Lock, Encrypted Local Database (SQLite / WatermelonDB) |

---

## 🚀 Blueprint Rekomendasi Penyempurnaan Fintrack

### Phase 1: Core UX/UI & Engine Upgrade
1. **Redesain UI Fintrack**:
   * Implementasikan sistem warna modern (Dark Mode Sleek + Neon Accent).
   * Gunakan Bottom Navigation Bar yang dinamis dengan Floating Action Button (FAB) di tengah.
2. **Mesin Auto-Split Allocation (Rule Engine)**:
   * Buat logika otomatis: Ketika ada transaksi pemasukan $\ge X$, jalankan pemotongan otomatis ke akun/target tabungan terpilih sesuai persentase porsi.

### Phase 2: Feature Parity & Superiority
1. **Multi-Currency & Admin Fee Transfer**:
   * Sediakan pencatatan biaya admin saat transfer antar akun secara transparan.
2. **Advanced Budgeting & Alert**:
   * Notifikasi otomatis saat pengeluaran kategori mendekati 80% dan 100% dari batas anggaran.
3. **Smart Voice & OCR Entry**:
   * Tambahkan fitur Speech-to-Text & Scan Struk langsung dari kamera HP menggunakan Google ML Kit / Web OCR.

---

## 📝 Kesimpulan
Saldoin memiliki arsitektur fitur yang sangat matang dan ramah pengguna. Keunggulan utamanya terletak pada **kemudahan alokasi tabungan otomatis** dan **fleksibilitas pencatatan cepat**. Dengan mengadopsi struktur ini ke dalam **Fintrack** disertai balutan UI modern premium dan AI analytics yang lebih mendalam, Fintrack akan tampil jauh lebih superior dan lengkap.

/**
 * ==============================================================================
 * APLIKASI PELAKAI KEUANGAN PRIBADI (PERSONAL FINANCE TRACKER)
 * Single Page Application Logic (app.js)
 * ==============================================================================
 */

// Global State Management
const state = {
  currentUser: JSON.parse(localStorage.getItem('app_user')) || null,
  apiUrl: localStorage.getItem('app_api_url') || '',
  paydayCutoff: parseInt(localStorage.getItem('app_payday_cutoff')) || 26, // Default 26 for payday cycle (26-25)
  selectedMonth: new Date(2026, 8, 1), // Default September 2026
  currentTab: 'home',
  inputType: 'pengeluaran',
  aktivitasSubTab: 'pengeluaran',
  categoryManagerType: 'pengeluaran',
  rankingSortAsc: false,
  expenseChart: null,
  data: {
    pemasukan: [],
    pengeluaran: [],
    tabungan: []
  },
  categories: {
    pengeluaran: ['Makanan & Minuman', 'Transportasi', 'Tagihan & Utilitas', 'Belanja Bulanan', 'Hiburan & Rekreasi', 'Kesehatan & Medis', 'Lainnya'],
    tabungan: ['Tabungan Darurat', 'Reksa Dana', 'Investasi Saham', 'Emas / Logam Mulia', 'Deposito', 'Lainnya'],
    pemasukan: ['Gaji', 'Bonus & Komisi', 'Hasil Penjualan', 'Freelance & Sampingan', 'Hadiah & Hibah', 'Lainnya']
  }
};

// Default Mock Data for Instant Offline Demo
const mockInitialData = {
  pemasukan: [
    { rowId: 2, jenis: 'Gaji', tanggal: '2026-09-01', nama: 'Gaji Bulanan PT Akmal Jaya', jumlah: 8500000, keterangan: 'Gaji pokok september' },
    { rowId: 3, jenis: 'Freelance & Sampingan', tanggal: '2026-09-12', nama: 'Project Website Client', jumlah: 2500000, keterangan: 'DP Project Web' }
  ],
  pengeluaran: [
    { rowId: 2, tanggal: '2026-09-02', nama: 'Belanja Bulanan Supermarket', kategori: 'Belanja Bulanan', jumlah: 1250000, keterangan: 'Bahan makanan bulanan' },
    { rowId: 3, tanggal: '2026-09-05', nama: 'Bayar Listrik & WiFi', kategori: 'Tagihan & Utilitas', jumlah: 650000, keterangan: 'PLN + IndiHome' },
    { rowId: 4, tanggal: '2026-09-10', nama: 'Makan Malam Nasi Goreng', kategori: 'Makanan & Minuman', jumlah: 45000, keterangan: 'Bersama kawan' },
    { rowId: 5, tanggal: '2026-09-15', nama: 'Isi Bensin Pertamax', kategori: 'Transportasi', jumlah: 200000, keterangan: 'Motor matic' },
    { rowId: 6, tanggal: '2026-09-18', nama: 'Nonton Bioskop & Snack', kategori: 'Hiburan & Rekreasi', jumlah: 175000, keterangan: 'Weekend film' }
  ],
  tabungan: [
    { rowId: 2, tanggal: '2026-09-03', nama: 'Beli Emas Antam 1 gr', kategori: 'Emas / Logam Mulia', jumlah: 1300000, keterangan: 'Investasi rutin' },
    { rowId: 3, tanggal: '2026-09-05', nama: 'Top Up Bibit Reksa Dana', kategori: 'Reksa Dana', jumlah: 1000000, keterangan: 'Pasar Uang' }
  ]
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Check local data fallback
  const cachedData = localStorage.getItem('app_cached_data');
  if (cachedData) {
    try {
      state.data = JSON.parse(cachedData);
    } catch (e) {
      state.data = mockInitialData;
    }
  } else {
    state.data = mockInitialData;
  }

  // Set payday cutoff select value
  const paydayCutoffSelect = document.getElementById('paydayCutoffSelect');
  if (paydayCutoffSelect) paydayCutoffSelect.value = state.paydayCutoff || 26;

  // Set today's date in input form default
  const today = new Date().toISOString().split('T')[0];
  const formDate = document.getElementById('formDate');
  if (formDate) formDate.value = today;

  // Set API URL in Akun tab input
  const apiUrlInput = document.getElementById('apiUrlInput');
  if (apiUrlInput) apiUrlInput.value = state.apiUrl;

  // Check User Authentication State
  if (!state.currentUser) {
    showAuthScreen();
  } else {
    hideAuthScreen();
    initApp();
  }
});

// ==========================================
// 1. AUTHENTICATION & SESSION LOGIC
// ==========================================

let authIsRegister = false;

function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
}

function hideAuthScreen() {
  document.getElementById('authScreen').classList.add('hidden');
}

function toggleAuthMode() {
  authIsRegister = !authIsRegister;
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const submitText = document.getElementById('authBtnText');
  const toggleQuestion = document.getElementById('authToggleQuestion');
  const toggleBtn = document.getElementById('authToggleBtn');
  const budgetGroup = document.getElementById('registerBudgetGroup');

  if (authIsRegister) {
    title.innerText = 'Daftar Akun Baru';
    subtitle.innerText = 'Buat profil pelacak keuangan Anda dalam hitungan detik';
    submitText.innerText = 'Daftar Akun';
    toggleQuestion.innerText = 'Sudah punya akun?';
    toggleBtn.innerText = 'Masuk (Login)';
    budgetGroup.classList.remove('hidden');
  } else {
    title.innerText = 'FinTrack';
    subtitle.innerText = 'Kelola Keuangan Pribadi dengan Cerdas & Rapi';
    submitText.innerText = 'Masuk Sekarang';
    toggleQuestion.innerText = 'Belum punya akun?';
    toggleBtn.innerText = 'Daftar Akun Baru';
    budgetGroup.classList.add('hidden');
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const pin = document.getElementById('authPin').value.trim();
  const budgetInput = document.getElementById('authMonthlyBudget').value;
  const monthlyBudget = unformatIDR(budgetInput) || 5000000;

  if (!username || !pin) {
    showToast('Username dan PIN harus diisi!', 'error');
    return;
  }

  showAuthSpinner(true);

  if (state.apiUrl) {
    try {
      const action = authIsRegister ? 'register' : 'login';
      const payload = { action, username, pin, monthlyBudget };
      
      const response = await fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      if (res.status === 'success') {
        state.currentUser = res.user || { username, monthlyBudget, userId: 'USR-LOCAL' };
        localStorage.setItem('app_user', JSON.stringify(state.currentUser));
        showToast(res.message || 'Berhasil masuk!', 'success');
        hideAuthScreen();
        initApp();
      } else {
        showToast(res.message || 'Gagal autentikasi', 'error');
      }
    } catch (err) {
      showToast('Koneksi API gagal, masuk dengan mode lokal', 'warning');
      loginLocal(username, monthlyBudget);
    } finally {
      showAuthSpinner(false);
    }
  } else {
    // Local Authentication fallback
    loginLocal(username, monthlyBudget);
    showAuthSpinner(false);
  }
}

function loginLocal(username, budget) {
  state.currentUser = {
    username: username,
    monthlyBudget: budget,
    userId: 'USR-' + Date.now()
  };
  localStorage.setItem('app_user', JSON.stringify(state.currentUser));
  showToast('Masuk dalam Mode Lokal!', 'success');
  hideAuthScreen();
  initApp();
}

function showAuthSpinner(show) {
  const btnText = document.getElementById('authBtnText');
  const spinner = document.getElementById('authBtnSpinner');
  if (show) {
    btnText.classList.add('opacity-50');
    spinner.classList.remove('hidden');
  } else {
    btnText.classList.remove('opacity-50');
    spinner.classList.add('hidden');
  }
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
    localStorage.removeItem('app_user');
    state.currentUser = null;
    showAuthScreen();
    showToast('Anda telah keluar', 'info');
  }
}

// ==========================================
// 2. CORE APP INIT & DATA FETCHING
// ==========================================

function initApp() {
  updateUserHeader();
  renderCategoryDropdown();
  renderCategoryChips();
  
  if (state.apiUrl) {
    fetchDataFromAPI();
  } else {
    updateApiStatusBadge(false, 'Local Mode');
    updateAllViews();
  }
}

function updateUserHeader() {
  if (!state.currentUser) return;
  const username = state.currentUser.username;
  document.getElementById('headerUsername').innerText = username;
  document.getElementById('userAvatarChar').innerText = username.charAt(0).toUpperCase();
  document.getElementById('profileAvatar').innerText = username.charAt(0).toUpperCase();
  document.getElementById('profileNameDisplay').innerText = username;
  
  const budgetInput = document.getElementById('budgetInput');
  if (budgetInput) budgetInput.value = formatIDR(state.currentUser.monthlyBudget);

  const paydayCutoffSelect = document.getElementById('paydayCutoffSelect');
  if (paydayCutoffSelect) paydayCutoffSelect.value = state.paydayCutoff || 26;
}

async function fetchDataFromAPI() {
  if (!state.apiUrl) return;

  updateApiStatusBadge(true, 'Syncing...');

  try {
    const response = await fetch(`${state.apiUrl}?action=fetchData&username=${encodeURIComponent(state.currentUser.username)}`);
    const res = await response.json();

    if (res.status === 'success') {
      if (res.data) {
        state.data = res.data;
        localStorage.setItem('app_cached_data', JSON.stringify(res.data));
      }
      if (res.categories) {
        if (res.categories.pengeluaran.length > 0) state.categories.pengeluaran = res.categories.pengeluaran;
        if (res.categories.tabungan.length > 0) state.categories.tabungan = res.categories.tabungan;
        if (res.categories.pemasukan.length > 0) state.categories.pemasukan = res.categories.pemasukan;
      }
      if (res.user && res.user.monthlyBudget) {
        state.currentUser.monthlyBudget = res.user.monthlyBudget;
        localStorage.setItem('app_user', JSON.stringify(state.currentUser));
      }
      
      updateApiStatusBadge(true, 'GAS Active');
      showToast('Data berhasil diperbarui dari Spreadsheet', 'success');
    } else {
      updateApiStatusBadge(false, 'API Error');
    }
  } catch (err) {
    updateApiStatusBadge(false, 'Offline / CORS');
  } finally {
    updateAllViews();
  }
}

function updateApiStatusBadge(online, text) {
  const dot = document.getElementById('apiStatusDot');
  const txt = document.getElementById('apiStatusText');
  const badge = document.getElementById('apiStatusBadge');

  if (online) {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
    if (txt) txt.innerText = text || 'GAS Active';
    if (badge) {
      badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700';
      badge.innerText = 'Terhubung';
    }
  } else {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
    if (txt) txt.innerText = text || 'Mode Lokal';
    if (badge) {
      badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700';
      badge.innerText = text || 'Mode Lokal';
    }
  }
}

// Save GAS API Web App URL in Akun Tab
async function saveApiUrl() {
  const url = document.getElementById('apiUrlInput').value.trim();
  state.apiUrl = url;
  localStorage.setItem('app_api_url', url);

  if (!url) {
    showToast('URL API dikosongkan. Menggunakan Mode Lokal.', 'info');
    updateApiStatusBadge(false, 'Mode Lokal');
    return;
  }

  showToast('Menghubungkan ke Google Apps Script...', 'info');
  await fetchDataFromAPI();
}

// Save Monthly Budget Target
async function saveMonthlyBudget() {
  const val = unformatIDR(document.getElementById('budgetInput').value);
  if (!val || val <= 0) {
    showToast('Nominal anggaran tidak valid!', 'error');
    return;
  }

  state.currentUser.monthlyBudget = val;
  localStorage.setItem('app_user', JSON.stringify(state.currentUser));

  if (state.apiUrl) {
    try {
      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'updateBudget',
          username: state.currentUser.username,
          monthlyBudget: val
        })
      });
    } catch (e) {}
  }

  showToast('Target Anggaran Bulanan berhasil disimpan!', 'success');
  updateAllViews();
}

// Save Payday Cut-off Cycle Setting
function savePaydayCutoff() {
  const val = parseInt(document.getElementById('paydayCutoffSelect').value) || 1;
  state.paydayCutoff = val;
  localStorage.setItem('app_payday_cutoff', val.toString());

  showToast(`Siklus gajian disimpan! (Cut-off Tanggal ${val})`, 'success');
  updateAllViews();
}

// Get Date Range for Current Selected Month & Payday Cut-off
function getSelectedPeriodRange() {
  const year = state.selectedMonth.getFullYear();
  const month = state.selectedMonth.getMonth(); // 0-indexed (0 = Jan, 8 = Sep, 9 = Oct)
  const cutoff = state.paydayCutoff || 1;

  if (cutoff === 1) {
    const startDate = new Date(year, month, 1, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    return { startDate, endDate, cutoff };
  } else {
    // Cut-off > 1 (e.g. 26: 26th of previous month to 25th of current selected month)
    const startDate = new Date(year, month - 1, cutoff, 0, 0, 0);
    const endDate = new Date(year, month, cutoff - 1, 23, 59, 59);
    return { startDate, endDate, cutoff };
  }
}

// Helper to check if item date string (YYYY-MM-DD) falls within date range
function isDateInPeriodRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
  return d >= startDate && d <= endDate;
}

// ==========================================
// 3. TAB NAVIGATION & MONTH FILTER
// ==========================================

function switchTab(tabName) {
  state.currentTab = tabName;

  const tabs = ['home', 'input', 'aktivitas', 'akun'];
  tabs.forEach(t => {
    const section = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
    const navBtn = document.getElementById('nav' + t.charAt(0).toUpperCase() + t.slice(1));

    if (t === tabName) {
      if (section) section.classList.remove('hidden');
      if (navBtn) navBtn.classList.add('active');
    } else {
      if (section) section.classList.add('hidden');
      if (navBtn) navBtn.classList.remove('active');
    }
  });

  updateAllViews();
}

function changeMonth(delta) {
  state.selectedMonth.setMonth(state.selectedMonth.getMonth() + delta);
  updateMonthDisplays();
  updateAllViews();
}

function updateMonthDisplays() {
  const options = { month: 'long', year: 'numeric' };
  const strMonth = state.selectedMonth.toLocaleDateString('id-ID', options);
  const cutoff = state.paydayCutoff || 1;
  const { startDate, endDate } = getSelectedPeriodRange();
  
  const currentMonthDisplay = document.getElementById('currentMonthDisplay');
  const homeBadge = document.getElementById('homeMonthBadge');
  const aktivitasBadge = document.getElementById('aktivitasMonthBadge');

  if (cutoff > 1) {
    const startStr = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    
    if (currentMonthDisplay) {
      currentMonthDisplay.innerHTML = `<i class="fa-regular fa-calendar text-emerald-400"></i> ${strMonth} <span class="text-xs font-normal opacity-80">(${startStr} - ${endStr})</span>`;
    }

    const shortBadgeStr = `${state.selectedMonth.toLocaleDateString('id-ID', { month: 'short' })} (${startStr} - ${endStr})`;
    if (homeBadge) homeBadge.innerText = shortBadgeStr;
    if (aktivitasBadge) aktivitasBadge.innerText = shortBadgeStr;
  } else {
    if (currentMonthDisplay) {
      currentMonthDisplay.innerHTML = `<i class="fa-regular fa-calendar text-emerald-400"></i> ${strMonth}`;
    }

    const shortMonth = state.selectedMonth.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    if (homeBadge) homeBadge.innerText = shortMonth;
    if (aktivitasBadge) aktivitasBadge.innerText = shortMonth;
  }
}

// ==========================================
// 4. UI RE-RENDERING & COMPUTATIONS
// ==========================================

function updateAllViews() {
  updateMonthDisplays();
  updateUserHeader();

  // Filter Data for Selected Period Range
  const { startDate, endDate } = getSelectedPeriodRange();

  const filteredPemasukan = (state.data.pemasukan || []).filter(item => {
    return isDateInPeriodRange(item.tanggal, startDate, endDate);
  });

  const filteredPengeluaran = (state.data.pengeluaran || []).filter(item => {
    return isDateInPeriodRange(item.tanggal, startDate, endDate);
  });

  const filteredTabungan = (state.data.tabungan || []).filter(item => {
    return isDateInPeriodRange(item.tanggal, startDate, endDate);
  });

  // Calculate Totals
  const totalIncome = filteredPemasukan.reduce((sum, i) => sum + i.jumlah, 0);
  const totalExpense = filteredPengeluaran.reduce((sum, i) => sum + i.jumlah, 0);
  const totalSavings = filteredTabungan.reduce((sum, i) => sum + i.jumlah, 0);

  const targetBudget = state.currentUser ? state.currentUser.monthlyBudget : 5000000;
  const remainingBudget = targetBudget - totalExpense;

  // Render Home Card Values
  document.getElementById('homeRemainingBudget').innerText = 'Rp ' + formatIDR(remainingBudget);
  document.getElementById('homeTargetBudget').innerText = 'Rp ' + formatIDR(targetBudget);
  document.getElementById('homeTotalIncome').innerText = 'Rp ' + formatIDR(totalIncome);
  document.getElementById('homeTotalExpense').innerText = 'Rp ' + formatIDR(totalExpense);
  document.getElementById('homeTotalSavings').innerText = 'Rp ' + formatIDR(totalSavings);

  // Render Chart & Ranking Widget
  renderExpenseChart(filteredPengeluaran);
  renderRankingWidget(filteredPengeluaran);

  // Render Aktivitas List
  renderAktivitasList(filteredPemasukan, filteredPengeluaran, filteredTabungan);
}

// Render Donut Chart with Chart.js
function renderExpenseChart(pengeluaranList) {
  const canvas = document.getElementById('expenseChart');
  if (!canvas) return;

  const categoryTotals = {};
  pengeluaranList.forEach(item => {
    const cat = item.kategori || 'Lainnya';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.jumlah;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const chartCenterText = document.getElementById('chartCenterText');
  const chartCenterTotal = document.getElementById('chartCenterTotal');
  const chartTotalCount = document.getElementById('chartTotalCount');

  if (labels.length === 0) {
    if (state.expenseChart) state.expenseChart.destroy();
    if (chartCenterText) chartCenterText.classList.add('hidden');
    if (chartTotalCount) chartTotalCount.innerText = '0 Kategori';
    return;
  }

  if (chartTotalCount) chartTotalCount.innerText = labels.length + ' Kategori';
  if (chartCenterText) chartCenterText.classList.remove('hidden');
  const totalSum = data.reduce((a, b) => a + b, 0);
  if (chartCenterTotal) chartCenterTotal.innerText = 'Rp ' + formatIDR(totalSum);

  const colors = [
    '#059669', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
    '#10B981', '#6366F1', '#EC4899', '#14B8A6', '#F97316'
  ];

  if (state.expenseChart) {
    state.expenseChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  state.expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              return ` ${context.label}: Rp ${formatIDR(val)}`;
            }
          }
        }
      }
    }
  });
}

// Render Category Ranking Progress Bars
function renderRankingWidget(pengeluaranList) {
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;

  const categoryTotals = {};
  let totalExpense = 0;

  pengeluaranList.forEach(item => {
    const cat = item.kategori || 'Lainnya';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.jumlah;
    totalExpense += item.jumlah;
  });

  let items = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    amount: categoryTotals[cat],
    percentage: totalExpense > 0 ? Math.round((categoryTotals[cat] / totalExpense) * 100) : 0
  }));

  if (items.length === 0) {
    rankingList.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-medium">Belum ada pengeluaran pada bulan ini</div>`;
    return;
  }

  // Sort logic
  if (state.rankingSortAsc) {
    items.sort((a, b) => a.amount - b.amount);
  } else {
    items.sort((a, b) => b.amount - a.amount);
  }

  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];

  let html = '';
  items.forEach((item, index) => {
    const color = colors[index % colors.length];
    html += `
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-700 flex items-center gap-1.5">
            <span class="text-[10px] text-slate-400">#${index + 1}</span> ${item.name}
          </span>
          <span class="font-bold text-slate-900">
            Rp ${formatIDR(item.amount)} <span class="text-[10px] text-slate-400 font-normal">(${item.percentage}%)</span>
          </span>
        </div>
        <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full ${color} progress-bar-fill rounded-full" style="width: ${item.percentage}%"></div>
        </div>
      </div>
    `;
  });

  rankingList.innerHTML = html;
}

function toggleRankingSort() {
  state.rankingSortAsc = !state.rankingSortAsc;
  const sortLabel = document.getElementById('sortLabel');
  if (sortLabel) {
    sortLabel.innerText = state.rankingSortAsc ? 'Terendah' : 'Tertinggi';
  }
  updateAllViews();
}

// ==========================================
// 5. INPUT TAB & FORM HANDLERS
// ==========================================

function setInputType(type) {
  state.inputType = type;
  document.getElementById('formType').value = type;

  const types = ['pemasukan', 'pengeluaran', 'tabungan'];
  types.forEach(t => {
    const btn = document.getElementById('btnType' + t.charAt(0).toUpperCase() + t.slice(1));
    if (t === type) {
      if (btn) btn.classList.add('active');
    } else {
      if (btn) btn.classList.remove('active');
    }
  });

  renderCategoryDropdown();
}

function renderCategoryDropdown() {
  const select = document.getElementById('formCategory');
  if (!select) return;

  const currentType = state.inputType;
  const list = state.categories[currentType] || [];

  select.innerHTML = list.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

async function handleSaveTransaction(e) {
  e.preventDefault();

  const type = document.getElementById('formType').value;
  const tanggal = document.getElementById('formDate').value;
  const nama = document.getElementById('formName').value.trim();
  const kategori = document.getElementById('formCategory').value;
  const jumlah = unformatIDR(document.getElementById('formAmount').value);
  const keterangan = document.getElementById('formNote').value.trim();

  if (!nama || !jumlah || jumlah <= 0) {
    showToast('Nama transaksi dan nominal harus diisi dengan benar!', 'error');
    return;
  }

  showSaveSpinner(true);

  const newTransaction = {
    rowId: Date.now(),
    jenis: type === 'pemasukan' ? kategori : 'Pemasukan',
    tanggal: tanggal,
    nama: nama,
    kategori: kategori,
    jumlah: jumlah,
    keterangan: keterangan
  };

  // Append to local state immediately
  state.data[type].unshift(newTransaction);
  localStorage.setItem('app_cached_data', JSON.stringify(state.data));

  // Sync to GAS Backend if API URL exists
  if (state.apiUrl) {
    try {
      await fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addTransaction',
          type: type,
          tanggal: tanggal,
          nama: nama,
          kategori: kategori,
          jumlah: jumlah,
          keterangan: keterangan
        })
      });
      showToast('Transaksi berhasil disimpan ke Spreadsheet!', 'success');
    } catch (err) {
      showToast('Tersimpan di Lokal (Gagal sync ke API)', 'warning');
    }
  } else {
    showToast('Transaksi berhasil disimpan (Mode Lokal)!', 'success');
  }

  showSaveSpinner(false);

  // Reset Form
  document.getElementById('formName').value = '';
  document.getElementById('formAmount').value = '';
  document.getElementById('formNote').value = '';

  // Switch to Home or Aktivitas View
  switchTab('home');
}

function showSaveSpinner(show) {
  const btnText = document.getElementById('saveBtnText');
  const spinner = document.getElementById('saveBtnSpinner');
  if (show) {
    btnText.classList.add('opacity-50');
    spinner.classList.remove('hidden');
  } else {
    btnText.classList.remove('opacity-50');
    spinner.classList.add('hidden');
  }
}

// ==========================================
// 6. AKTIVITAS TAB & HISTORY LIST
// ==========================================

function setAktivitasSubTab(subType) {
  state.aktivitasSubTab = subType;

  const subTabs = ['pemasukan', 'pengeluaran', 'tabungan'];
  subTabs.forEach(t => {
    const btn = document.getElementById('subTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (t === subType) {
      if (btn) btn.classList.add('active');
    } else {
      if (btn) btn.classList.remove('active');
    }
  });

  updateAllViews();
}

function renderAktivitasList(pemasukan, pengeluaran, tabungan) {
  const container = document.getElementById('aktivitasList');
  const totalLabel = document.getElementById('totalAktivitasLabel');
  const totalValue = document.getElementById('totalAktivitasValue');

  if (!container) return;

  const currentType = state.aktivitasSubTab;
  let targetList = [];
  let badgeColor = '';
  let iconClass = '';

  if (currentType === 'pemasukan') {
    targetList = pemasukan;
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    iconClass = 'fa-circle-arrow-down text-emerald-600';
    if (totalLabel) totalLabel.innerText = 'Total Pemasukan Bulan Ini:';
  } else if (currentType === 'pengeluaran') {
    targetList = pengeluaran;
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    iconClass = 'fa-circle-arrow-up text-rose-600';
    if (totalLabel) totalLabel.innerText = 'Total Pengeluaran Bulan Ini:';
  } else {
    targetList = tabungan;
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    iconClass = 'fa-piggy-bank text-blue-600';
    if (totalLabel) totalLabel.innerText = 'Total Tabungan Bulan Ini:';
  }

  const sumTotal = targetList.reduce((acc, item) => acc + item.jumlah, 0);
  if (totalValue) totalValue.innerText = 'Rp ' + formatIDR(sumTotal);

  if (targetList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-400 text-xs">
        <i class="fa-regular fa-folder-open text-3xl mb-2 block opacity-40"></i>
        Belum ada catatan ${currentType} untuk bulan ini
      </div>
    `;
    return;
  }

  // Sort transactions by date descending
  targetList.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  let html = '';
  targetList.forEach(item => {
    const categoryTag = item.kategori || item.jenis || 'Umum';
    html += `
      <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center justify-between transition">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl ${badgeColor} border flex items-center justify-center text-sm shadow-sm">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 line-clamp-1">${item.nama}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] text-slate-400">${item.tanggal}</span>
              <span class="text-[9px] font-semibold px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600">${categoryTag}</span>
            </div>
          </div>
        </div>

        <div class="text-right">
          <span class="text-xs font-bold text-slate-900 block">Rp ${formatIDR(item.jumlah)}</span>
          <button onclick="deleteTransactionItem('${currentType}', ${item.rowId})" class="text-[10px] text-rose-500 hover:underline mt-0.5 font-medium">
            <i class="fa-solid fa-trash-can"></i> Hapus
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

async function deleteTransactionItem(type, rowId) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

  // Remove locally
  state.data[type] = state.data[type].filter(item => item.rowId !== rowId);
  localStorage.setItem('app_cached_data', JSON.stringify(state.data));

  // Sync to API
  if (state.apiUrl) {
    try {
      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteTransaction',
          type: type,
          rowId: rowId
        })
      });
    } catch (e) {}
  }

  showToast('Transaksi dihapus!', 'info');
  updateAllViews();
}

// ==========================================
// 7. MASTER CATEGORY MANAGEMENT
// ==========================================

function setCategoryManagerType(catType) {
  state.categoryManagerType = catType;

  const catTypes = ['pengeluaran', 'tabungan', 'pemasukan'];
  catTypes.forEach(t => {
    const btn = document.getElementById('catType' + t.charAt(0).toUpperCase() + t.slice(1));
    if (t === catType) {
      if (btn) btn.classList.add('active');
    } else {
      if (btn) btn.classList.remove('active');
    }
  });

  renderCategoryChips();
}

function renderCategoryChips() {
  const container = document.getElementById('categoryChipsList');
  if (!container) return;

  const currentType = state.categoryManagerType;
  const list = state.categories[currentType] || [];

  if (list.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400">Belum ada kategori</span>`;
    return;
  }

  let html = '';
  list.forEach(cat => {
    html += `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
        ${cat}
        <button onclick="removeCategory('${cat}')" class="text-slate-400 hover:text-rose-500 font-bold ml-1">&times;</button>
      </span>
    `;
  });

  container.innerHTML = html;
}

async function addNewCategory() {
  const input = document.getElementById('newCategoryInput');
  const catName = input.value.trim();
  const currentType = state.categoryManagerType;

  if (!catName) {
    showToast('Nama kategori tidak boleh kosong!', 'error');
    return;
  }

  if (state.categories[currentType].includes(catName)) {
    showToast('Kategori sudah ada!', 'warning');
    return;
  }

  state.categories[currentType].push(catName);
  input.value = '';
  renderCategoryChips();
  renderCategoryDropdown();

  if (state.apiUrl) {
    try {
      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addCategory',
          categoryType: currentType,
          categoryName: catName
        })
      });
    } catch (e) {}
  }

  showToast('Kategori baru ditambahkan!', 'success');
}

async function removeCategory(catName) {
  const currentType = state.categoryManagerType;
  state.categories[currentType] = state.categories[currentType].filter(c => c !== catName);

  renderCategoryChips();
  renderCategoryDropdown();

  if (state.apiUrl) {
    try {
      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteCategory',
          categoryType: currentType,
          categoryName: catName
        })
      });
    } catch (e) {}
  }

  showToast('Kategori dihapus!', 'info');
}

// Change PIN Modal Handlers
function showChangePinModal() {
  document.getElementById('changePinModal').classList.remove('hidden');
}

function closeChangePinModal() {
  document.getElementById('changePinModal').classList.add('hidden');
}

async function submitChangePin() {
  const oldPin = document.getElementById('pinOld').value.trim();
  const newPin = document.getElementById('pinNew').value.trim();

  if (!oldPin || !newPin) {
    showToast('PIN Lama dan Baru harus diisi!', 'error');
    return;
  }

  if (state.apiUrl) {
    try {
      const res = await fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'changePin',
          username: state.currentUser.username,
          oldPin: oldPin,
          newPin: newPin
        })
      }).then(r => r.json());

      if (res.status === 'success') {
        showToast(res.message, 'success');
        closeChangePinModal();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Gagal mengubah PIN lewat API', 'error');
    }
  } else {
    showToast('PIN Berhasil Diperbarui (Mode Lokal)', 'success');
    closeChangePinModal();
  }
}

// ==========================================
// 8. FORMATTERS & UTILITIES
// ==========================================

function formatIDR(val) {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function unformatIDR(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^\d]/g, ''), 10) || 0;
}

function formatNumberInput(inputEl) {
  const rawValue = unformatIDR(inputEl.value);
  if (rawValue === 0) {
    inputEl.value = '';
  } else {
    inputEl.value = formatIDR(rawValue);
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  if (!toast) return;

  toastMsg.innerText = message;

  if (type === 'success') {
    toastIcon.className = 'fa-solid fa-circle-check text-emerald-400';
  } else if (type === 'error') {
    toastIcon.className = 'fa-solid fa-triangle-exclamation text-rose-400';
  } else if (type === 'warning') {
    toastIcon.className = 'fa-solid fa-circle-exclamation text-amber-400';
  } else {
    toastIcon.className = 'fa-solid fa-circle-info text-blue-400';
  }

  toast.classList.remove('opacity-0', 'pointer-events-none');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 3000);
}

// ==========================================
// 9. PROGRESSIVE WEB APP (PWA) LOGIC
// ==========================================

let deferredPWAInstallPrompt = null;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[PWA] ServiceWorker registered:', reg.scope))
      .catch((err) => console.log('[PWA] ServiceWorker registration failed:', err));
  });
}

// Listen for PWA Install Prompt Event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPWAInstallPrompt = e;
  
  const pwaBtn = document.getElementById('pwaInstallBtn');
  if (pwaBtn) {
    pwaBtn.classList.remove('opacity-50');
    pwaBtn.innerHTML = `<i class="fa-solid fa-download"></i> Install Aplikasi Sekarang`;
  }
});

// Install App Button Trigger
async function installPWAApp() {
  if (deferredPWAInstallPrompt) {
    deferredPWAInstallPrompt.prompt();
    const { outcome } = await deferredPWAInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('FinTrack berhasil dipasang di perangkat Anda!', 'success');
    }
    deferredPWAInstallPrompt = null;
  } else {
    // Instructions for Android / iOS manual installation
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('Untuk menginstall FinTrack di iPhone/iPad:\n1. Ketuk tombol Share (Bagikan) di Safari.\n2. Pilih "Add to Home Screen" (Tambah ke Utama).');
    } else {
      alert('Untuk menginstall FinTrack di Android/Desktop:\n1. Buka menu browser (titik 3 di kanan atas).\n2. Pilih "Install app" atau "Add to Home screen" (Tambahkan ke Layar Utama).');
    }
  }
}

// Detect when installed
window.addEventListener('appinstalled', () => {
  deferredPWAInstallPrompt = null;
  showToast('FinTrack telah terpasang!', 'success');
});


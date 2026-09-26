/**
 * ==============================================================================
 * APLIKASI PELAKAI KEUANGAN PRIBADI (PERSONAL FINANCE TRACKER)
 * Single Page Application Logic (app.js)
 * ==============================================================================
 */

// Default Category Budgets Allocation (Initial Fallback)
const defaultCategoryBudgets = {
  'Makanan & Minuman': 1500000,
  'Belanja Bulanan': 1500000,
  'Transportasi': 500000,
  'Tagihan & Utilitas': 800000,
  'Hiburan & Rekreasi': 400000,
  'Kesehatan & Medis': 300000,
  'Lainnya': 200000,
  'Tabungan Darurat': 1000000,
  'Reksa Dana': 1000000,
  'Emas / Logam Mulia': 1300000,
  'Investasi Saham': 500000
};

// Global State Management
const state = {
  currentUser: JSON.parse(localStorage.getItem('app_user')) || null,
  apiUrl: localStorage.getItem('app_api_url') || '',
  paydayCutoff: parseInt(localStorage.getItem('app_payday_cutoff')) || 26, // Default 26 for payday cycle (26-25)
  categoryBudgets: JSON.parse(localStorage.getItem('app_category_budgets')) || defaultCategoryBudgets,
  wallets: JSON.parse(localStorage.getItem('app_wallets')) || [
    'Tunai (Cash)',
    'Bank BCA',
    'Bank Mandiri',
    'E-Wallet (GoPay/OVO/DANA)',
    'Lainnya'
  ],
  cashflowFilter: 'all', // 'all', 'pengeluaran', 'tabungan'
  budgetAllocType: 'pengeluaran', // 'pengeluaran', 'tabungan'
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
    { rowId: 2, jenis: 'Gaji', tanggal: '2026-09-01', nama: 'Gaji Bulanan PT Akmal Jaya', jumlah: 8500000, keterangan: 'Gaji pokok september', wallet: 'Bank BCA' },
    { rowId: 3, jenis: 'Freelance & Sampingan', tanggal: '2026-09-12', nama: 'Project Website Client', jumlah: 2500000, keterangan: 'DP Project Web', wallet: 'Bank Mandiri' }
  ],
  pengeluaran: [
    { rowId: 2, tanggal: '2026-09-02', nama: 'Belanja Bulanan Supermarket', kategori: 'Belanja Bulanan', jumlah: 1250000, keterangan: 'Bahan makanan bulanan', wallet: 'Bank BCA' },
    { rowId: 3, tanggal: '2026-09-05', nama: 'Bayar Listrik & WiFi', kategori: 'Tagihan & Utilitas', jumlah: 650000, keterangan: 'PLN + IndiHome', wallet: 'Bank Mandiri' },
    { rowId: 4, tanggal: '2026-09-10', nama: 'Makan Malam Nasi Goreng', kategori: 'Makanan & Minuman', jumlah: 45000, keterangan: 'Bersama kawan', wallet: 'Tunai (Cash)' },
    { rowId: 5, tanggal: '2026-09-15', nama: 'Isi Bensin Pertamax', kategori: 'Transportasi', jumlah: 200000, keterangan: 'Motor matic', wallet: 'Tunai (Cash)' },
    { rowId: 6, tanggal: '2026-09-18', nama: 'Nonton Bioskop & Snack', kategori: 'Hiburan & Rekreasi', jumlah: 175000, keterangan: 'Weekend film', wallet: 'E-Wallet (GoPay/OVO/DANA)' }
  ],
  tabungan: [
    { rowId: 2, tanggal: '2026-09-03', nama: 'Beli Emas Antam 1 gr', kategori: 'Emas / Logam Mulia', jumlah: 1300000, keterangan: 'Investasi rutin', walletSource: 'Bank BCA', walletDestination: 'Emas / Logam Mulia' },
    { rowId: 3, tanggal: '2026-09-05', nama: 'Top Up Bibit Reksa Dana', kategori: 'Reksa Dana', jumlah: 1000000, keterangan: 'Pasar Uang', walletSource: 'Bank Mandiri', walletDestination: 'Reksa Dana' }
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

  if (authIsRegister) {
    title.innerText = 'Daftar Akun Baru';
    subtitle.innerText = 'Buat profil pelacak keuangan Anda dalam hitungan detik';
    submitText.innerText = 'Daftar Akun';
    toggleQuestion.innerText = 'Sudah punya akun?';
    toggleBtn.innerText = 'Masuk (Login)';
  } else {
    title.innerText = 'FinTrack';
    subtitle.innerText = 'Kelola Keuangan Pribadi dengan Cerdas & Rapi';
    submitText.innerText = 'Masuk Sekarang';
    toggleQuestion.innerText = 'Belum punya akun?';
    toggleBtn.innerText = 'Daftar Akun Baru';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const pin = document.getElementById('authPin').value.trim();

  if (!username || !pin) {
    showToast('Username dan PIN harus diisi!', 'error');
    return;
  }

  showAuthSpinner(true);

  if (state.apiUrl) {
    try {
      const action = authIsRegister ? 'register' : 'login';
      const payload = { action, username, pin };
      
      const response = await fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      if (res.status === 'success') {
        state.currentUser = res.user || { username, userId: 'USR-LOCAL' };
        localStorage.setItem('app_user', JSON.stringify(state.currentUser));
        showToast(res.message || 'Berhasil masuk!', 'success');
        hideAuthScreen();
        initApp();
      } else {
        showToast(res.message || 'Gagal autentikasi', 'error');
      }
    } catch (err) {
      showToast('Koneksi API gagal, masuk dengan mode lokal', 'warning');
      loginLocal(username);
    } finally {
      showAuthSpinner(false);
    }
  } else {
    // Local Authentication fallback
    loginLocal(username);
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



// Save Payday Cut-off Cycle Setting
function savePaydayCutoff() {
  const val = parseInt(document.getElementById('paydayCutoffSelect').value) || 1;
  state.paydayCutoff = val;
  localStorage.setItem('app_payday_cutoff', val.toString());

  if (state.apiUrl && state.currentUser) {
    try {
      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveSettings',
          username: state.currentUser.username,
          paydayCutoff: val
        })
      });
    } catch (e) {}
  }

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

// Calculate Total Sum of Category Budgets for specified or current sub-tab type
function getTotalCategoryBudgetSum(type) {
  const currentType = type || state.budgetAllocType || 'pengeluaran';
  const catList = state.categories[currentType] || [];
  let total = 0;
  catList.forEach(cat => {
    total += parseFloat(state.categoryBudgets[cat]) || 0;
  });
  return total;
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

  // Formula: Sisa Anggaran Bulanan = Pemasukan Bulanan - Pengeluaran Bulanan - Tabungan Bulanan
  const remainingBudget = totalIncome - totalExpense - totalSavings;

  // Target Anggaran = Total Pemasukan bulan tersebut
  const targetBudget = totalIncome;

  // Render Home Card Values
  const homeRemainingBudget = document.getElementById('homeRemainingBudget');
  if (homeRemainingBudget) {
    if (remainingBudget < 0) {
      homeRemainingBudget.className = 'text-3xl font-black tracking-tight text-rose-200';
      homeRemainingBudget.innerText = '-Rp ' + formatIDR(Math.abs(remainingBudget));
    } else {
      homeRemainingBudget.className = 'text-3xl font-black tracking-tight text-white';
      homeRemainingBudget.innerText = 'Rp ' + formatIDR(remainingBudget);
    }
  }

  const homeTargetBudget = document.getElementById('homeTargetBudget');
  if (homeTargetBudget) {
    homeTargetBudget.innerText = 'Rp ' + formatIDR(targetBudget);
  }

  document.getElementById('homeTotalIncome').innerText = 'Rp ' + formatIDR(totalIncome);
  document.getElementById('homeTotalExpense').innerText = 'Rp ' + formatIDR(totalExpense);
  document.getElementById('homeTotalSavings').innerText = 'Rp ' + formatIDR(totalSavings);

  // Render Home Wallet Balances Grid
  renderHomeWalletGrid();

  // Render Cashflow & Budgeting Sub Kategori Table
  renderCashflowTable(filteredPengeluaran, filteredTabungan);

  // Render Category Budget Inputs in Setting (Tab Akun)
  renderCategoryBudgetInputs();

  // Render Wallet Dropdowns & Wallet Chips
  renderWalletDropdowns();
  renderWalletChips();

  // Render Aktivitas List
  renderAktivitasList(filteredPemasukan, filteredPengeluaran, filteredTabungan);
}

// ==========================================
// 5. CASHFLOW TABLE & CATEGORY BUDGETING LOGIC
// ==========================================

function setCashflowFilter(filterType) {
  state.cashflowFilter = filterType;
  
  const btnAll = document.getElementById('cashflowFilterAll');
  const btnExp = document.getElementById('cashflowFilterPengeluaran');
  const btnSav = document.getElementById('cashflowFilterTabungan');

  if (btnAll) btnAll.className = filterType === 'all' ? 'px-2 py-1 text-[10px] font-bold rounded-lg text-emerald-700 bg-white shadow-xs' : 'px-2 py-1 text-[10px] font-bold rounded-lg text-slate-500 hover:text-slate-700';
  if (btnExp) btnExp.className = filterType === 'pengeluaran' ? 'px-2 py-1 text-[10px] font-bold rounded-lg text-emerald-700 bg-white shadow-xs' : 'px-2 py-1 text-[10px] font-bold rounded-lg text-slate-500 hover:text-slate-700';
  if (btnSav) btnSav.className = filterType === 'tabungan' ? 'px-2 py-1 text-[10px] font-bold rounded-lg text-emerald-700 bg-white shadow-xs' : 'px-2 py-1 text-[10px] font-bold rounded-lg text-slate-500 hover:text-slate-700';

  updateAllViews();
}

function renderCashflowTable(pengeluaranList, tabunganList) {
  const tbody = document.getElementById('cashflowTableBody');
  const tfoot = document.getElementById('cashflowTableFooter');
  if (!tbody) return;

  // Build category list based on filter
  let catList = [];
  if (state.cashflowFilter === 'pengeluaran') {
    catList = (state.categories.pengeluaran || []).map(cat => ({ name: cat, type: 'pengeluaran' }));
  } else if (state.cashflowFilter === 'tabungan') {
    catList = (state.categories.tabungan || []).map(cat => ({ name: cat, type: 'tabungan' }));
  } else {
    // 'all'
    const expList = (state.categories.pengeluaran || []).map(cat => ({ name: cat, type: 'pengeluaran' }));
    const savList = (state.categories.tabungan || []).map(cat => ({ name: cat, type: 'tabungan' }));
    catList = [...expList, ...savList];
  }

  // Calculate actuals
  const actualTotals = {};
  pengeluaranList.forEach(i => {
    const cat = i.kategori || 'Lainnya';
    actualTotals[cat] = (actualTotals[cat] || 0) + i.jumlah;
  });
  tabunganList.forEach(i => {
    const cat = i.kategori || 'Umum';
    actualTotals[cat] = (actualTotals[cat] || 0) + i.jumlah;
  });

  let totalBudget = 0;
  let totalAktual = 0;
  let rowsHtml = '';

  catList.forEach(item => {
    const name = item.name;
    const budget = parseFloat(state.categoryBudgets[name]) || 0;
    const aktual = actualTotals[name] || 0;
    const sisa = budget - aktual;

    totalBudget += budget;
    totalAktual += aktual;

    let percentageStr = '0,00%';
    let isOver = false;

    if (budget > 0) {
      const pct = (aktual / budget) * 100;
      percentageStr = pct.toFixed(2).replace('.', ',') + '%';
      if (pct > 100) isOver = true;
    } else if (aktual > 0) {
      percentageStr = '100,00%';
      isOver = true;
    }

    // Format Sisa Budget
    let sisaStr = '';
    let sisaClass = 'text-emerald-700 font-bold';
    let rowClass = 'hover:bg-slate-50/80 transition';

    if (sisa < 0) {
      sisaStr = `-Rp ${formatIDR(Math.abs(sisa))}`;
      sisaClass = 'text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded';
      rowClass = 'bg-rose-50/30 hover:bg-rose-50/60 transition';
    } else {
      sisaStr = `Rp ${formatIDR(sisa)}`;
    }

    const pctBadgeClass = isOver 
      ? 'bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full text-[10px]' 
      : 'bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]';

    const typeTag = item.type === 'tabungan' ? '<span class="text-[9px] text-blue-500 font-semibold ml-1">(Tabungan)</span>' : '';

    rowsHtml += `
      <tr class="${rowClass}">
        <td class="py-2.5 px-3 font-semibold text-slate-800">
          ${name} ${typeTag}
        </td>
        <td class="py-2.5 px-3 text-right text-slate-600">Rp ${formatIDR(budget)}</td>
        <td class="py-2.5 px-3 text-right font-bold text-slate-900">Rp ${formatIDR(aktual)}</td>
        <td class="py-2.5 px-3 text-right ${sisaClass}">${sisaStr}</td>
        <td class="py-2.5 px-3 text-right">
          <span class="${pctBadgeClass}">${percentageStr}</span>
        </td>
      </tr>
    `;
  });

  if (catList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Belum ada kategori diset</td></tr>`;
    if (tfoot) tfoot.innerHTML = '';
    return;
  }

  tbody.innerHTML = rowsHtml;

  // Render Footer Row
  const totalSisa = totalBudget - totalAktual;
  let totalPctStr = '0,00%';
  if (totalBudget > 0) {
    totalPctStr = ((totalAktual / totalBudget) * 100).toFixed(2).replace('.', ',') + '%';
  }

  let totalSisaStr = totalSisa < 0 ? `-Rp ${formatIDR(Math.abs(totalSisa))}` : `Rp ${formatIDR(totalSisa)}`;
  let totalSisaClass = totalSisa < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold';

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td class="py-3 px-3 uppercase tracking-wider text-[11px] font-extrabold">TOTAL</td>
        <td class="py-3 px-3 text-right text-slate-700">Rp ${formatIDR(totalBudget)}</td>
        <td class="py-3 px-3 text-right text-slate-900 font-extrabold">Rp ${formatIDR(totalAktual)}</td>
        <td class="py-3 px-3 text-right ${totalSisaClass}">${totalSisaStr}</td>
        <td class="py-3 px-3 text-right">
          <span class="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold">${totalPctStr}</span>
        </td>
      </tr>
    `;
  }
}

// Category Budget Allocation Functions (Tab Akun / Setting)
function setBudgetAllocationType(type) {
  state.budgetAllocType = type;
  
  const btnExp = document.getElementById('budgetAllocTypePengeluaran');
  const btnSav = document.getElementById('budgetAllocTypeTabungan');

  if (btnExp) btnExp.className = type === 'pengeluaran' ? 'tab-btn active py-1.5 text-[11px] font-semibold rounded-lg' : 'tab-btn py-1.5 text-[11px] font-semibold rounded-lg';
  if (btnSav) btnSav.className = type === 'tabungan' ? 'tab-btn active py-1.5 text-[11px] font-semibold rounded-lg' : 'tab-btn py-1.5 text-[11px] font-semibold rounded-lg';

  renderCategoryBudgetInputs();
}

function updateCategoryBudgetLiveTotal() {
  const container = document.getElementById('categoryBudgetInputsList');
  const badge = document.getElementById('totalBudgetAllocationBadge');
  if (!container || !badge) return;

  let liveTotal = 0;
  const inputs = container.querySelectorAll('input[data-cat]');
  inputs.forEach(input => {
    const catName = input.getAttribute('data-cat');
    const val = unformatIDR(input.value);
    state.categoryBudgets[catName] = val;
    liveTotal += val;
  });

  badge.innerText = `Total: Rp ${formatIDR(liveTotal)}`;
}

function renderCategoryBudgetInputs() {
  const container = document.getElementById('categoryBudgetInputsList');
  const badge = document.getElementById('totalBudgetAllocationBadge');
  if (!container) return;

  const currentType = state.budgetAllocType || 'pengeluaran';
  const catList = state.categories[currentType] || [];

  let html = '';
  catList.forEach((cat, idx) => {
    const val = state.categoryBudgets[cat] || 0;
    const formattedVal = val > 0 ? formatIDR(val) : '';

    html += `
      <div class="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
        <span class="text-xs font-semibold text-slate-700 flex-1 truncate">${cat}</span>
        <div class="relative w-36">
          <span class="absolute left-2.5 top-1.5 text-slate-400 font-bold text-[11px]">Rp</span>
          <input type="text" id="catBudget_${idx}" data-cat="${cat}" value="${formattedVal}" inputmode="numeric" oninput="formatNumberInput(this); updateCategoryBudgetLiveTotal();" placeholder="0" class="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update total badge for current sub-tab
  const totalSum = getTotalCategoryBudgetSum(currentType);
  if (badge) badge.innerText = `Total: Rp ${formatIDR(totalSum)}`;
}

function saveAllCategoryBudgets() {
  const container = document.getElementById('categoryBudgetInputsList');
  if (!container) return;

  const inputs = container.querySelectorAll('input[data-cat]');
  inputs.forEach(input => {
    const catName = input.getAttribute('data-cat');
    const val = unformatIDR(input.value);
    state.categoryBudgets[catName] = val;
  });

  localStorage.setItem('app_category_budgets', JSON.stringify(state.categoryBudgets));

  if (state.apiUrl && state.currentUser) {
    try {
      fetch(state.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveSettings',
          username: state.currentUser.username,
          categoryBudgets: state.categoryBudgets
        })
      });
    } catch (e) {}
  }

  showToast('Alokasi dana per kategori berhasil disimpan!', 'success');
  updateAllViews();
}

// ==========================================
// 6. WALLET & SALDO MANAGEMENT LOGIC
// ==========================================

function getWalletBalances() {
  const balances = {};
  (state.wallets || []).forEach(w => {
    balances[w] = 0;
  });

  (state.data.pemasukan || []).forEach(i => {
    const w = i.wallet || state.wallets[0] || 'Tunai (Cash)';
    if (balances[w] === undefined) balances[w] = 0;
    balances[w] += (i.jumlah || 0);
  });

  (state.data.pengeluaran || []).forEach(i => {
    const w = i.wallet || state.wallets[0] || 'Tunai (Cash)';
    if (balances[w] === undefined) balances[w] = 0;
    balances[w] -= (i.jumlah || 0);
  });

  (state.data.tabungan || []).forEach(i => {
    const wSrc = i.walletSource || i.wallet || state.wallets[0] || 'Tunai (Cash)';
    const wDst = i.walletDestination || i.kategori || '';

    if (balances[wSrc] === undefined) balances[wSrc] = 0;
    balances[wSrc] -= (i.jumlah || 0);

    if (wDst && state.wallets.includes(wDst)) {
      if (balances[wDst] === undefined) balances[wDst] = 0;
      balances[wDst] += (i.jumlah || 0);
    }
  });

  return balances;
}

function renderHomeWalletGrid() {
  const grid = document.getElementById('homeWalletGrid');
  const badgeTotal = document.getElementById('homeTotalWalletBalance');
  if (!grid) return;

  const balances = getWalletBalances();
  const walletList = state.wallets || [];
  let totalKas = 0;
  let html = '';

  walletList.forEach(w => {
    const bal = balances[w] || 0;
    totalKas += bal;

    let iconClass = 'fa-wallet text-emerald-500';
    const lower = w.toLowerCase();
    if (lower.includes('tunai') || lower.includes('cash')) iconClass = 'fa-money-bill-wave text-emerald-500';
    else if (lower.includes('bank') || lower.includes('bca') || lower.includes('mandiri')) iconClass = 'fa-building-columns text-blue-500';
    else if (lower.includes('wallet') || lower.includes('gopay') || lower.includes('ovo') || lower.includes('dana')) iconClass = 'fa-mobile-retro text-purple-500';

    let balClass = 'text-xs font-bold text-slate-900';
    let balStr = 'Rp ' + formatIDR(bal);
    if (bal < 0) {
      balClass = 'text-xs font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded';
      balStr = '-Rp ' + formatIDR(Math.abs(bal));
    }

    html += `
      <div class="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-1 hover:bg-slate-100/80 transition">
        <div class="flex items-center gap-1.5">
          <i class="fa-solid ${iconClass} text-xs"></i>
          <span class="text-[11px] font-bold text-slate-700 truncate">${w}</span>
        </div>
        <div class="${balClass}">
          ${balStr}
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  if (badgeTotal) badgeTotal.innerText = `Total Kas: Rp ${formatIDR(totalKas)}`;
}

function renderWalletDropdowns() {
  const selectWallet = document.getElementById('formWallet');
  const selectSource = document.getElementById('formWalletSource');
  const selectDest = document.getElementById('formWalletDest');

  const walletOptions = (state.wallets || []).map(w => `<option value="${w}">${w}</option>`).join('');

  if (selectWallet) selectWallet.innerHTML = walletOptions;
  if (selectSource) selectSource.innerHTML = walletOptions;

  if (selectDest) {
    const savCats = (state.categories.tabungan || []).map(c => `<option value="${c}">🎯 ${c}</option>`).join('');
    const wallOpts = (state.wallets || []).map(w => `<option value="${w}">💳 ${w}</option>`).join('');
    selectDest.innerHTML = `<optgroup label="Wadah Kategori Tabungan">${savCats}</optgroup><optgroup label="Rekening / Dompet Tujuan">${wallOpts}</optgroup>`;
  }
}

function renderWalletChips() {
  const container = document.getElementById('walletChipsList');
  if (!container) return;

  const list = state.wallets || [];
  let html = '';

  list.forEach(w => {
    html += `
      <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200">
        <span>💳 ${w}</span>
        <button onclick="deleteWallet('${w}')" class="text-slate-400 hover:text-rose-500 text-xs ml-1 transition">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function addNewWallet() {
  const input = document.getElementById('newWalletInput');
  if (!input) return;

  const val = input.value.trim();
  if (!val) {
    showToast('Nama rekening / dompet tidak boleh kosong!', 'error');
    return;
  }

  if (state.wallets.includes(val)) {
    showToast('Nama dompet sudah ada!', 'warning');
    return;
  }

  state.wallets.push(val);
  localStorage.setItem('app_wallets', JSON.stringify(state.wallets));

  input.value = '';
  showToast(`Dompet "${val}" berhasil ditambahkan!`, 'success');
  updateAllViews();
}

function deleteWallet(name) {
  if (state.wallets.length <= 1) {
    showToast('Minimal harus ada 1 dompet aktif!', 'warning');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus dompet "${name}"?`)) {
    state.wallets = state.wallets.filter(w => w !== name);
    localStorage.setItem('app_wallets', JSON.stringify(state.wallets));
    showToast(`Dompet "${name}" dihapus`, 'info');
    updateAllViews();
  }
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

  const walletSingleGroup = document.getElementById('walletSingleGroup');
  const walletSavingsGroup = document.getElementById('walletSavingsGroup');
  const formWalletLabel = document.getElementById('formWalletLabel');
  const formNameInput = document.getElementById('formName');

  if (formNameInput) {
    if (type === 'pemasukan') formNameInput.placeholder = 'Contoh: Gaji Pokok / Bonus Client';
    else if (type === 'pengeluaran') formNameInput.placeholder = 'Contoh: Makan Siang / Belanja Bulanan';
    else if (type === 'tabungan') formNameInput.placeholder = 'Contoh: Top Up Emas / Bibit Reksa Dana';
  }

  if (type === 'tabungan') {
    if (walletSingleGroup) walletSingleGroup.classList.add('hidden');
    if (walletSavingsGroup) walletSavingsGroup.classList.remove('hidden');
  } else {
    if (walletSingleGroup) walletSingleGroup.classList.remove('hidden');
    if (walletSavingsGroup) walletSavingsGroup.classList.add('hidden');

    if (formWalletLabel) {
      if (type === 'pemasukan') {
        formWalletLabel.innerHTML = '<i class="fa-solid fa-wallet text-emerald-600"></i> 📥 Simpan Ke Saldo / Rekening';
      } else {
        formWalletLabel.innerHTML = '<i class="fa-solid fa-wallet text-emerald-600"></i> 📤 Diambil Dari Saldo / Rekening';
      }
    }
  }

  renderCategoryDropdown();
  renderWalletDropdowns();
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

  const formWallet = document.getElementById('formWallet') ? document.getElementById('formWallet').value : (state.wallets[0] || 'Tunai (Cash)');
  const formWalletSource = document.getElementById('formWalletSource') ? document.getElementById('formWalletSource').value : (state.wallets[0] || 'Tunai (Cash)');
  const formWalletDest = document.getElementById('formWalletDest') ? document.getElementById('formWalletDest').value : kategori;

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
    keterangan: keterangan,
    wallet: type === 'tabungan' ? formWalletSource : formWallet,
    walletSource: type === 'tabungan' ? formWalletSource : formWallet,
    walletDestination: type === 'tabungan' ? formWalletDest : (type === 'pemasukan' ? formWallet : '')
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
          keterangan: keterangan,
          wallet: type === 'tabungan' ? formWalletSource : formWallet,
          walletSource: type === 'tabungan' ? formWalletSource : formWallet,
          walletDestination: type === 'tabungan' ? formWalletDest : (type === 'pemasukan' ? formWallet : '')
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
    let walletBadge = '';

    if (item.walletSource && item.walletDestination) {
      walletBadge = `<span class="text-[9px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">💳 ${item.walletSource} ➔ ${item.walletDestination}</span>`;
    } else if (item.wallet) {
      const icon = currentType === 'pemasukan' ? '📥' : '📤';
      walletBadge = `<span class="text-[9px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">${icon} ${item.wallet}</span>`;
    }

    html += `
      <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex items-center justify-between transition">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl ${badgeColor} border flex items-center justify-center text-sm shadow-sm">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 line-clamp-1">${item.nama}</h4>
            <div class="flex items-center flex-wrap gap-1.5 mt-0.5">
              <span class="text-[10px] text-slate-400">${item.tanggal}</span>
              <span class="text-[9px] font-semibold px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600">${categoryTag}</span>
              ${walletBadge}
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


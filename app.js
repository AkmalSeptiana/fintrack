/**
 * ==============================================================================
 * APLIKASI SALDOIN FINTRACK PRO
 * Single Page Application Logic - 100% Saldoin Exact Replica
 * ==============================================================================
 */

// Global State Management
const state = {
  currentUser: JSON.parse(localStorage.getItem('app_user')) || { username: 'Akmal', userId: 'USR-AKMAL' },
  apiUrl: localStorage.getItem('app_api_url') || '',
  paydayCutoff: parseInt(localStorage.getItem('app_payday_cutoff')) || 26,
  activeTab: 'dashboard',
  txSubTab: 'history', // 'history' | 'accounts'
  analyticsSubTab: 'goals', // 'goals' | 'charts' | 'rules'
  txTypeFilter: 'all',
  txFormType: 'pemasukan',
  isBalanceHidden: localStorage.getItem('app_balance_hidden') === 'true',
  expenseChart: null,
  
  // Accounts / Dompet Master Data
  accounts: JSON.parse(localStorage.getItem('app_accounts')) || [
    { id: 'ACC-1', namaAkun: 'Kas Tunai', tipe: 'Tunai', saldoAwal: 500000, warnaIkon: '#0D9488', icon: 'fa-wallet' },
    { id: 'ACC-2', namaAkun: 'Bank BCA', tipe: 'Bank', saldoAwal: 1410000, warnaIkon: '#0284C7', icon: 'fa-building-columns' },
    { id: 'ACC-3', namaAkun: 'Bank BRI', tipe: 'Bank', saldoAwal: 1000000, warnaIkon: '#0369A1', icon: 'fa-credit-card' },
    { id: 'ACC-4', namaAkun: 'GoPay', tipe: 'E-Wallet', saldoAwal: 350000, warnaIkon: '#00897B', icon: 'fa-mobile-screen-button' }
  ],

  // Savings Goals / Target Tabungan
  goals: JSON.parse(localStorage.getItem('app_goals')) || [
    { id: 'GOAL-1', namaTarget: 'Dana Darurat 6 Bulan', nominalTarget: 15000000, terkumpul: 6500000, tenggatWaktu: '2026-12-31', status: 'Aktif', dompetTujuan: 'Bank BCA' },
    { id: 'GOAL-2', namaTarget: 'Beli Laptop / Gadget', nominalTarget: 12000000, terkumpul: 4800000, tenggatWaktu: '2027-06-30', status: 'Aktif', dompetTujuan: 'Bank BRI' }
  ],

  // Auto-Split Rules Engine
  rules: JSON.parse(localStorage.getItem('app_rules')) || [
    {
      id: 'RULE-1',
      namaAturan: 'Alokasi Tabungan Gaji Bulanan',
      minPemasukan: 3000000,
      targetAlokasi: [
        { targetId: 'GOAL-1', targetName: 'Dana Darurat 6 Bulan', percentage: 30 },
        { targetId: 'GOAL-2', targetName: 'Beli Laptop / Gadget', percentage: 20 }
      ],
      statusAktif: 'Aktif'
    }
  ],

  // Transactions Database
  data: JSON.parse(localStorage.getItem('app_transactions')) || {
    pemasukan: [
      { rowId: 2, jenis: 'Gaji', tanggal: '2026-09-01', nama: 'Gaji Bulanan PT Akmal Jaya', jumlah: 8500000, wallet: 'Bank BCA', keterangan: 'Gaji Pokok September' }
    ],
    pengeluaran: [
      { rowId: 2, tanggal: '2026-09-02', nama: 'Belanja Bulanan Supermarket', kategori: 'Belanja Bulanan', jumlah: 1250000, wallet: 'Bank BCA', keterangan: 'Bahan makanan' },
      { rowId: 3, tanggal: '2026-09-05', nama: 'Tagihan PLN & IndiHome', kategori: 'Tagihan & Utilitas', jumlah: 650000, wallet: 'Bank BRI', keterangan: 'Listrik + WiFi' }
    ],
    tabungan: [
      { rowId: 2, tanggal: '2026-09-01', nama: 'Auto-Split: Dana Darurat 6 Bulan', kategori: 'Tabungan Otomatis', jumlah: 2550000, walletSource: 'Bank BCA', walletDestination: 'Bank BCA', keterangan: 'Alokasi Otomatis Gaji' }
    ],
    transfer: [
      { rowId: 2, tanggal: '2026-09-28', walletSource: 'Bank BRI', walletDestination: 'Kas Tunai', jumlah: 100000, biayaAdmin: 0, catatan: 'Tarik tunai' }
    ]
  },

  // Categories
  categories: JSON.parse(localStorage.getItem('app_categories')) || {
    pengeluaran: ['Makanan & Minuman', 'Transportasi', 'Tagihan & Utilitas', 'Belanja Bulanan', 'Hiburan & Rekreasi', 'Kesehatan & Medis', 'Lainnya'],
    tabungan: ['Tabungan Darurat', 'Reksa Dana', 'Investasi Saham', 'Emas / Logam Mulia', 'Deposito', 'Lainnya'],
    pemasukan: ['Gaji', 'Bonus & Komisi', 'Hasil Penjualan', 'Freelance & Sampingan', 'Hadiah & Hibah', 'Lainnya']
  }
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupModalBackdrops();

  if (!state.currentUser) {
    showAuthScreen();
  } else {
    hideAuthScreen();
    initApp();
  }
});

function setupModalBackdrops() {
  const modals = document.querySelectorAll('.modal-wrapper');
  modals.forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) {
        m.classList.add('hidden');
      }
    });
  });
}

function showAuthScreen() {
  const el = document.getElementById('authScreen');
  if (el) el.classList.remove('hidden');
}

function hideAuthScreen() {
  const el = document.getElementById('authScreen');
  if (el) el.classList.add('hidden');
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const pin = document.getElementById('authPin').value.trim();

  if (!username || !pin) {
    alert('Mohon isi Username dan PIN secara lengkap.');
    return;
  }

  state.currentUser = { username: username, userId: 'USR-' + Date.now() };
  localStorage.setItem('app_user', JSON.stringify(state.currentUser));
  
  hideAuthScreen();
  initApp();
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    localStorage.removeItem('app_user');
    state.currentUser = null;
    showAuthScreen();
  }
}

function initApp() {
  const user = state.currentUser ? state.currentUser.username : 'Akmal';
  const greetEl = document.getElementById('userGreeting');
  const setValName = document.getElementById('settingsUserName');

  if (greetEl) greetEl.innerText = `${getGreetingTime()}`;
  if (setValName) setValName.innerText = user;

  const todayStr = new Date().toISOString().split('T')[0];
  const txMonthFilter = document.getElementById('txMonthFilter');
  if (txMonthFilter && !txMonthFilter.value) txMonthFilter.value = todayStr.substring(0, 7);

  const txDateInput = document.getElementById('txDateInput');
  if (txDateInput && !txDateInput.value) txDateInput.value = todayStr;

  const gasApiUrlInput = document.getElementById('gasApiUrlInput');
  if (gasApiUrlInput) gasApiUrlInput.value = state.apiUrl;

  if (state.apiUrl) {
    syncDataWithApi();
  } else {
    renderAll();
  }
}

function getGreetingTime() {
  const hr = new Date().getHours();
  if (hr >= 4 && hr < 11) return 'Selamat pagi';
  if (hr >= 11 && hr < 15) return 'Selamat siang';
  if (hr >= 15 && hr < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function saveLocalCache() {
  localStorage.setItem('app_accounts', JSON.stringify(state.accounts));
  localStorage.setItem('app_goals', JSON.stringify(state.goals));
  localStorage.setItem('app_rules', JSON.stringify(state.rules));
  localStorage.setItem('app_transactions', JSON.stringify(state.data));
  localStorage.setItem('app_categories', JSON.stringify(state.categories));
  localStorage.setItem('app_user', JSON.stringify(state.currentUser));
  localStorage.setItem('app_balance_hidden', state.isBalanceHidden ? 'true' : 'false');
}

function renderAll() {
  saveLocalCache();
  renderDashboard();
  renderTransactions();
  renderAccounts();
  renderGoals();
  renderRules();
  renderAnalyticsCharts();
  renderSettingsCategories();
}

// ==========================================
// 1. DASHBOARD RENDERER & LOGIC (EXACT SALDOIN)
// ==========================================

function renderDashboard() {
  // 1. Calculate Account Balances
  const accountBalances = calculateAccountBalances();
  let totalBalance = 0;
  Object.values(accountBalances).forEach(b => totalBalance += b);

  const totalBalEl = document.getElementById('totalBalanceDisplay');
  if (totalBalEl) {
    totalBalEl.innerText = state.isBalanceHidden ? 'Rp ••••••••' : formatRupiah(totalBalance);
  }

  const eyeIcon = document.getElementById('balanceEyeIcon');
  if (eyeIcon) {
    eyeIcon.className = state.isBalanceHidden ? 'fa-solid fa-eye-slash text-white/80' : 'fa-solid fa-eye text-white/80';
  }

  const badgeEl = document.getElementById('totalAccountsBadge');
  if (badgeEl) {
    badgeEl.innerText = `${state.accounts.length} akun`;
  }

  // 2. Income & Expense for Current Selected Month
  const selectedYM = (document.getElementById('txMonthFilter')?.value) || new Date().toISOString().substring(0, 7);
  
  let monthlyIncome = 0;
  (state.data.pemasukan || []).forEach(inTx => {
    if ((inTx.tanggal || '').substring(0, 7) === selectedYM) {
      monthlyIncome += (parseFloat(inTx.jumlah) || 0);
    }
  });

  let monthlyExpense = 0;
  (state.data.pengeluaran || []).forEach(outTx => {
    if ((outTx.tanggal || '').substring(0, 7) === selectedYM) {
      monthlyExpense += (parseFloat(outTx.jumlah) || 0);
    }
  });

  const dashIncEl = document.getElementById('dashIncomeDisplay');
  const dashExpEl = document.getElementById('dashExpenseDisplay');
  if (dashIncEl) dashIncEl.innerText = formatRupiahShort(monthlyIncome);
  if (dashExpEl) dashExpEl.innerText = formatRupiahShort(monthlyExpense);

  // 3. Render Recent Transactions (Exact Saldoin Row Style)
  const recentListEl = document.getElementById('dashRecentTxList');
  if (recentListEl) {
    const allRecent = getAllUnifiedTransactions().slice(0, 5);
    recentListEl.innerHTML = '';
    if (allRecent.length === 0) {
      recentListEl.innerHTML = `<div class="p-5 text-xs text-slate-400 text-center">Belum ada transaksi. Ketuk "Catat" di bawah buat mulai.</div>`;
    } else {
      allRecent.forEach(tx => {
        recentListEl.appendChild(createSaldoinTransactionRowElement(tx));
      });
    }
  }
}

function formatRupiahShort(amount) {
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} jt`.replace('.0', '');
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
}

function toggleBalanceVisibility() {
  state.isBalanceHidden = !state.isBalanceHidden;
  renderDashboard();
}

function calculateAccountBalances() {
  const balances = {};
  
  state.accounts.forEach(acc => {
    balances[acc.namaAkun] = parseFloat(acc.saldoAwal) || 0;
  });

  (state.data.pemasukan || []).forEach(inTx => {
    const w = inTx.wallet || inTx.walletDestination || 'Kas Tunai';
    if (balances[w] !== undefined) balances[w] += (parseFloat(inTx.jumlah) || 0);
  });

  (state.data.pengeluaran || []).forEach(outTx => {
    const w = outTx.wallet || outTx.walletSource || 'Kas Tunai';
    if (balances[w] !== undefined) balances[w] -= (parseFloat(outTx.jumlah) || 0);
  });

  (state.data.tabungan || []).forEach(savTx => {
    const wSrc = savTx.walletSource || 'Kas Tunai';
    if (balances[wSrc] !== undefined) balances[wSrc] -= (parseFloat(savTx.jumlah) || 0);
  });

  (state.data.transfer || []).forEach(trfTx => {
    const wSrc = trfTx.walletSource;
    const wDst = trfTx.walletDestination;
    const amt = parseFloat(trfTx.jumlah) || 0;
    const fee = parseFloat(trfTx.biayaAdmin) || 0;

    if (balances[wSrc] !== undefined) balances[wSrc] -= (amt + fee);
    if (balances[wDst] !== undefined) balances[wDst] += amt;
  });

  return balances;
}

function getAllUnifiedTransactions() {
  const list = [];
  
  (state.data.pemasukan || []).forEach(item => {
    list.push({ ...item, type: 'pemasukan', displayCategory: item.jenis || 'Pemasukan' });
  });

  (state.data.pengeluaran || []).forEach(item => {
    list.push({ ...item, type: 'pengeluaran', displayCategory: item.kategori || 'Pengeluaran' });
  });

  (state.data.tabungan || []).forEach(item => {
    list.push({ ...item, type: 'tabungan', displayCategory: item.kategori || 'Tabungan' });
  });

  (state.data.transfer || []).forEach(item => {
    list.push({
      ...item,
      type: 'transfer',
      nama: `Transfer ke akun lain`,
      displayCategory: 'Transfer'
    });
  });

  list.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
  return list;
}

function createSaldoinTransactionRowElement(tx) {
  const row = document.createElement('div');
  row.className = 'py-3 flex items-center justify-between hover:bg-slate-50/80 transition cursor-pointer';

  let iconBg = 'bg-slate-100 text-slate-600';
  let iconName = 'fa-arrow-right-arrow-left';
  let prefix = '-';
  let titleText = tx.nama || tx.displayCategory;
  let subtitleText = `via ${tx.wallet || tx.walletSource || 'TUNAI'}`;

  if (tx.type === 'pemasukan') {
    iconBg = 'bg-emerald-100 text-emerald-600';
    iconName = 'fa-arrow-down';
    prefix = '+';
  } else if (tx.type === 'pengeluaran') {
    iconBg = 'bg-rose-100 text-rose-600';
    iconName = 'fa-arrow-up';
    prefix = '-';
  } else if (tx.type === 'transfer') {
    iconBg = 'bg-slate-100 text-slate-600';
    iconName = 'fa-arrow-right-arrow-left';
    prefix = '-';
    titleText = `Transfer ke akun lain · Hari ini`;
    subtitleText = `via ${tx.walletSource || 'BRI'}`;
  }

  row.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center text-sm font-black flex-shrink-0">
        <i class="fa-solid ${iconName}"></i>
      </div>
      <div>
        <div class="text-xs font-extrabold text-slate-800 line-clamp-1">${titleText}</div>
        <div class="text-[11px] text-slate-400 font-medium">${subtitleText}</div>
      </div>
    </div>
    <div class="text-right">
      <div class="text-xs font-black text-slate-800">${prefix}${formatRupiah(tx.jumlah || 0)}</div>
      <button onclick="deleteTransaction('${tx.type}', ${tx.rowId})" class="text-[10px] text-slate-400 hover:text-rose-500 font-bold">Hapus</button>
    </div>
  `;

  return row;
}

// ==========================================
// 2. TRANSACTIONS TAB & SUB-TABS
// ==========================================

function renderTransactions() {
  filterAndRenderTransactions();
}

function filterAndRenderTransactions() {
  const monthYM = (document.getElementById('txMonthFilter')?.value) || '';
  const searchQuery = (document.getElementById('txSearchInput')?.value || '').toLowerCase();
  
  const container = document.getElementById('fullTxList');
  if (!container) return;

  const all = getAllUnifiedTransactions();
  let filtered = all;

  if (monthYM) {
    filtered = filtered.filter(tx => (tx.tanggal || '').substring(0, 7) === monthYM);
  }

  if (state.txTypeFilter !== 'all') {
    filtered = filtered.filter(tx => tx.type === state.txTypeFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(tx => 
      (tx.nama || '').toLowerCase().includes(searchQuery) ||
      (tx.displayCategory || '').toLowerCase().includes(searchQuery) ||
      (tx.keterangan || '').toLowerCase().includes(searchQuery)
    );
  }

  let totalExp = 0;
  filtered.forEach(tx => {
    if (tx.type === 'pengeluaran') totalExp += parseFloat(tx.jumlah) || 0;
  });
  const monthlyExpTotalEl = document.getElementById('txMonthlyExpenseTotal');
  if (monthlyExpTotalEl) monthlyExpTotalEl.innerText = formatRupiah(totalExp);

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-6 text-xs text-slate-400 text-center">Tidak ada transaksi ditemukan.</div>`;
  } else {
    filtered.forEach(tx => {
      container.appendChild(createSaldoinTransactionRowElement(tx));
    });
  }
}

function setTxTypeFilter(type, btnElement) {
  state.txTypeFilter = type;
  const btns = document.querySelectorAll('#txTypeFilterContainer .tab-btn');
  btns.forEach(b => {
    b.classList.remove('active');
    b.classList.add('bg-white', 'text-slate-600');
  });

  if (btnElement) {
    btnElement.classList.add('active');
    btnElement.classList.remove('bg-white', 'text-slate-600');
  }
  filterAndRenderTransactions();
}

function renderAccounts() {
  const container = document.getElementById('accountsListContainer');
  if (!container) return;

  const balances = calculateAccountBalances();
  container.innerHTML = '';

  state.accounts.forEach(acc => {
    const bal = balances[acc.namaAkun] !== undefined ? balances[acc.namaAkun] : (acc.saldoAwal || 0);
    const div = document.createElement('div');
    div.className = 'p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold" style="background-color: ${acc.warnaIkon || '#0D9488'}">
          <i class="fa-solid ${acc.icon || 'fa-wallet'}"></i>
        </div>
        <div>
          <div class="text-xs font-extrabold text-slate-800">${acc.namaAkun}</div>
          <div class="text-[11px] text-slate-400 font-medium">${acc.tipe} • Saldo Awal: ${formatRupiah(acc.saldoAwal || 0)}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs font-black text-slate-800">${state.isBalanceHidden ? '••••••' : formatRupiah(bal)}</div>
        <div class="flex gap-2 justify-end mt-1">
          <button onclick="editAccount('${acc.id}')" class="text-[10px] text-slate-400 hover:text-slate-800 font-bold transition">Edit</button>
          <button onclick="deleteAccount('${acc.id}')" class="text-[10px] text-slate-400 hover:text-rose-500 font-bold transition">Hapus</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// ==========================================
// 3. TARGET TABUNGAN (GOALS) & RULES ENGINE
// ==========================================

function setAnalyticsSubTab(tab) {
  state.analyticsSubTab = tab;
  const secG = document.getElementById('sectionAnGoals');
  const secC = document.getElementById('sectionAnCharts');
  const secR = document.getElementById('sectionAnRules');

  const btnG = document.getElementById('btnSubAnGoals');
  const btnC = document.getElementById('btnSubAnCharts');
  const btnR = document.getElementById('btnSubAnRules');

  [secG, secC, secR].forEach(s => s?.classList.add('hidden'));
  [btnG, btnC, btnR].forEach(b => {
    if (b) b.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition';
  });

  if (tab === 'goals') {
    secG?.classList.remove('hidden');
    if (btnG) btnG.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 shadow-md transition';
  } else if (tab === 'charts') {
    secC?.classList.remove('hidden');
    if (btnC) btnC.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 shadow-md transition';
    renderAnalyticsCharts();
  } else if (tab === 'rules') {
    secR?.classList.remove('hidden');
    if (btnR) btnR.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 shadow-md transition';
  }
}

function renderGoals() {
  const container = document.getElementById('fullGoalsContainer');
  if (!container) return;

  container.innerHTML = '';
  if (state.goals.length === 0) {
    container.innerHTML = `<div class="p-6 bg-white border border-slate-100 rounded-3xl text-xs text-slate-400 text-center">Belum ada target tabungan yang dibuat.</div>`;
    return;
  }

  state.goals.forEach(g => {
    const pct = Math.min(100, Math.round(((g.terkumpul || 0) / (g.nominalTarget || 1)) * 100));
    const sisaHari = calculateDaysRemaining(g.tenggatWaktu);
    
    const div = document.createElement('div');
    div.className = 'p-4 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-sm';
    div.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-black text-slate-800 flex items-center gap-2">
            ${g.namaTarget}
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${pct >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}">
              ${pct >= 100 ? 'Tercapai! 🎉' : 'Aktif'}
            </span>
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5 font-medium">Penampung: <b>${g.dompetTujuan || 'Bank BCA'}</b> • Deadline: <b>${g.tenggatWaktu}</b> (${sisaHari})</div>
        </div>
        <div class="text-right">
          <div class="text-base font-black text-amber-500">${pct}%</div>
        </div>
      </div>

      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div class="bg-amber-500 h-full progress-bar-fill" style="width: ${pct}%"></div>
      </div>

      <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <span class="text-slate-500 font-medium">Terkumpul: <b class="text-slate-800">${formatRupiah(g.terkumpul || 0)}</b></span>
        <span class="text-slate-500 font-medium">Target: <b class="text-slate-800">${formatRupiah(g.nominalTarget || 0)}</b></span>
      </div>

      <div class="flex gap-2 justify-end pt-1">
        <button onclick="openDepositGoalModal('${g.id}')" class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold rounded-full transition">
          + Setor Manual
        </button>
        <button onclick="editGoal('${g.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full transition">
          Edit
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

function calculateDaysRemaining(deadlineStr) {
  if (!deadlineStr) return 'Tanpa batas';
  const target = new Date(deadlineStr);
  const now = new Date();
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Tenggat Lewat';
  if (diffDays === 0) return 'Hari ini';
  return `${diffDays} hari lagi`;
}

function renderRules() {
  const container = document.getElementById('rulesListContainer');
  if (!container) return;

  container.innerHTML = '';
  if (state.rules.length === 0) {
    container.innerHTML = `<div class="p-6 bg-white border border-slate-100 rounded-3xl text-xs text-slate-400 text-center">Belum ada aturan alokasi otomatis. Klik + Aturan Baru.</div>`;
    return;
  }

  state.rules.forEach(r => {
    let totalPct = 0;
    (r.targetAlokasi || []).forEach(t => totalPct += (t.percentage || 0));

    const div = document.createElement('div');
    div.className = 'p-4 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-sm';
    
    let allocListHtml = (r.targetAlokasi || []).map(t => `
      <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
        <span class="text-slate-700 font-semibold">${t.targetName}</span>
        <span class="text-teal-600 font-bold">${t.percentage}%</span>
      </div>
    `).join('');

    div.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-black text-slate-800 flex items-center gap-2">
            ${r.namaAturan}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-700">
              ${r.statusAktif || 'Aktif'}
            </span>
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5 font-medium">Trigger: Pemasukan $\\ge$ <b>${formatRupiah(r.minPemasukan || 0)}</b></div>
        </div>
        <button onclick="deleteRule('${r.id}')" class="text-xs text-slate-400 hover:text-rose-500 font-bold transition">Hapus</button>
      </div>

      <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
        <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">Distribusi Alokasi Tabungan (${totalPct}%)</div>
        ${allocListHtml}
      </div>
    `;
    container.appendChild(div);
  });
}

// ==========================================
// 4. ANALYTICS & CHART.JS RENDERER
// ==========================================

function renderAnalyticsCharts() {
  const selectedYM = (document.getElementById('txMonthFilter')?.value) || new Date().toISOString().substring(0, 7);
  
  const categoryTotals = {};
  let totalExpMonth = 0;

  (state.data.pengeluaran || []).forEach(outTx => {
    if ((outTx.tanggal || '').substring(0, 7) === selectedYM) {
      const cat = outTx.kategori || 'Lainnya';
      const amt = parseFloat(outTx.jumlah) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      totalExpMonth += amt;
    }
  });

  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (ctx) {
    if (state.expenseChart) state.expenseChart.destroy();

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    const bgColors = ['#0D9488', '#0284C7', '#8B5CF6', '#F43F5E', '#F59E0B', '#06B6D4', '#64748B'];

    if (labels.length === 0) {
      state.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Belum Ada Data'],
          datasets: [{ data: [1], backgroundColor: ['#E2E8F0'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    } else {
      state.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 2, borderColor: '#FFFFFF' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#64748B', font: { size: 10, family: 'Plus Jakarta Sans' } } }
          }
        }
      });
    }
  }

  const rankingContainer = document.getElementById('categoryRankingContainer');
  if (rankingContainer) {
    rankingContainer.innerHTML = '';
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0) {
      rankingContainer.innerHTML = `<div class="text-xs text-slate-400 text-center py-2">Belum ada pengeluaran di bulan ini.</div>`;
    } else {
      sortedCats.forEach(([cat, amt]) => {
        const pct = totalExpMonth > 0 ? Math.round((amt / totalExpMonth) * 100) : 0;
        const row = document.createElement('div');
        row.className = 'space-y-1';
        row.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800">${cat}</span>
            <span class="text-slate-500 font-semibold">${formatRupiah(amt)} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-teal-600 h-full rounded-full" style="width: ${pct}%"></div>
          </div>
        `;
        rankingContainer.appendChild(row);
      });
    }
  }
}

// ==========================================
// 5. TRANSACTION MODAL & AUTO-SPLIT EXECUTION
// ==========================================

function openTransactionModal(defaultType = 'pemasukan') {
  setTxTypeForm(defaultType);
  populateWalletSelectOptions();
  populateCategorySelectOptions();
  
  const inputAmt = document.getElementById('txAmountInput');
  const inputName = document.getElementById('txNameInput');
  const inputNote = document.getElementById('txNoteInput');
  
  if (inputAmt) inputAmt.value = '';
  if (inputName) inputName.value = '';
  if (inputNote) inputNote.value = '';

  const m = document.getElementById('modalTransaction');
  if (m) m.classList.remove('hidden');
}

function setTxTypeForm(type) {
  state.txFormType = type;
  const btnIn = document.getElementById('btnFormIn');
  const btnOut = document.getElementById('btnFormOut');
  const btnSav = document.getElementById('btnFormSav');

  [btnIn, btnOut, btnSav].forEach(b => {
    if (b) b.className = 'py-2 rounded-xl text-slate-500 hover:text-slate-800 font-bold transition';
  });

  if (type === 'pemasukan' && btnIn) btnIn.className = 'py-2 rounded-xl bg-teal-600 text-white shadow-md font-black transition';
  if (type === 'pengeluaran' && btnOut) btnOut.className = 'py-2 rounded-xl bg-rose-500 text-white shadow-md font-black transition';
  if (type === 'tabungan' && btnSav) btnSav.className = 'py-2 rounded-xl bg-amber-500 text-white shadow-md font-black transition';

  populateCategorySelectOptions();
  previewAutoSplitTrigger();
}

function populateWalletSelectOptions() {
  const sel = document.getElementById('txWalletSelect');
  if (!sel) return;
  sel.innerHTML = '';
  state.accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.namaAkun;
    opt.innerText = `${acc.namaAkun} (${acc.tipe})`;
    sel.appendChild(opt);
  });
}

function populateCategorySelectOptions() {
  const sel = document.getElementById('txCategorySelect');
  if (!sel) return;
  sel.innerHTML = '';
  
  const cats = state.categories[state.txFormType] || ['Lainnya'];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = c;
    sel.appendChild(opt);
  });
}

function previewAutoSplitTrigger() {
  const amount = parseFloat(document.getElementById('txAmountInput')?.value) || 0;
  const banner = document.getElementById('autoSplitPreviewBanner');
  const text = document.getElementById('autoSplitPreviewText');

  if (state.txFormType !== 'pemasukan' || amount <= 0) {
    if (banner) banner.classList.add('hidden');
    return;
  }

  const activeRule = state.rules.find(r => (r.statusAktif || 'Aktif') === 'Aktif' && amount >= (r.minPemasukan || 0));
  if (activeRule) {
    if (banner) banner.classList.remove('hidden');
    let summaryText = `Aturan "${activeRule.namaAturan}" akan memotong secara otomatis: `;
    (activeRule.targetAlokasi || []).forEach(t => {
      const splitVal = Math.round(amount * (t.percentage / 100));
      summaryText += `\n• ${t.targetName}: ${t.percentage}% (${formatRupiah(splitVal)})`;
    });
    if (text) text.innerText = summaryText;
  } else {
    if (banner) banner.classList.add('hidden');
  }
}

function handleTransactionSubmit(e) {
  e.preventDefault();
  
  const amount = parseFloat(document.getElementById('txAmountInput').value) || 0;
  const name = document.getElementById('txNameInput').value.trim();
  const category = document.getElementById('txCategorySelect').value;
  const wallet = document.getElementById('txWalletSelect').value;
  const date = document.getElementById('txDateInput').value;
  const note = document.getElementById('txNoteInput').value;

  if (amount <= 0 || !name) {
    alert('Mohon isi nominal dan nama transaksi secara valid.');
    return;
  }

  const newTx = {
    rowId: Date.now(),
    tanggal: date,
    nama: name,
    kategori: category,
    jenis: category,
    jumlah: amount,
    wallet: wallet,
    walletSource: wallet,
    walletDestination: wallet,
    keterangan: note
  };

  if (state.txFormType === 'pemasukan') {
    state.data.pemasukan.push(newTx);
    
    // Auto-Split Engine Trigger
    const activeRule = state.rules.find(r => (r.statusAktif || 'Aktif') === 'Aktif' && amount >= (r.minPemasukan || 0));
    if (activeRule) {
      (activeRule.targetAlokasi || []).forEach(t => {
        const splitVal = Math.round(amount * (t.percentage / 100));
        if (splitVal > 0) {
          state.data.tabungan.push({
            rowId: Date.now() + Math.floor(Math.random() * 1000),
            tanggal: date,
            nama: `Auto-Split: ${t.targetName}`,
            kategori: 'Tabungan Otomatis',
            jumlah: splitVal,
            walletSource: wallet,
            walletDestination: wallet,
            keterangan: `Alokasi Otomatis dari ${name}`
          });

          const targetGoal = state.goals.find(g => g.id === t.targetId || g.namaTarget === t.targetName);
          if (targetGoal) {
            targetGoal.terkumpul = (targetGoal.terkumpul || 0) + splitVal;
          }
        }
      });
      alert(`✨ Transaksi Pemasukan Disimpan & ${activeRule.targetAlokasi.length} Alokasi Tabungan Otomatis berhasil dieksekusi!`);
    } else {
      alert('Transaksi Pemasukan berhasil disimpan!');
    }

  } else if (state.txFormType === 'pengeluaran') {
    state.data.pengeluaran.push(newTx);
    alert('Transaksi Pengeluaran berhasil disimpan!');
  } else if (state.txFormType === 'tabungan') {
    state.data.tabungan.push(newTx);
    alert('Setoran Tabungan berhasil disimpan!');
  }

  closeModal('modalTransaction');
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('addTransaction', {
      type: state.txFormType,
      tanggal: date,
      nama: name,
      kategori: category,
      jumlah: amount,
      wallet: wallet,
      keterangan: note
    });
  }
}

function deleteTransaction(type, rowId) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

  const targetId = parseInt(rowId);
  if (type === 'pemasukan') {
    state.data.pemasukan = state.data.pemasukan.filter(item => parseInt(item.rowId) !== targetId);
  } else if (type === 'pengeluaran') {
    state.data.pengeluaran = state.data.pengeluaran.filter(item => parseInt(item.rowId) !== targetId);
  } else if (type === 'tabungan') {
    state.data.tabungan = state.data.tabungan.filter(item => parseInt(item.rowId) !== targetId);
  } else if (type === 'transfer') {
    state.data.transfer = state.data.transfer.filter(item => parseInt(item.rowId) !== targetId);
  }

  renderAll();

  if (state.apiUrl) {
    sendPostRequest('deleteTransaction', { type: type, rowId: rowId });
  }
}

// ==========================================
// 6. TRANSFER & GOAL & RULE HANDLERS
// ==========================================

function openTransferModal() {
  const selSrc = document.getElementById('trfSourceSelect');
  const selDst = document.getElementById('trfDestSelect');

  if (selSrc && selDst) {
    selSrc.innerHTML = '';
    selDst.innerHTML = '';
    state.accounts.forEach(acc => {
      selSrc.appendChild(new Option(`${acc.namaAkun} (${acc.tipe})`, acc.namaAkun));
      selDst.appendChild(new Option(`${acc.namaAkun} (${acc.tipe})`, acc.namaAkun));
    });
    if (selDst.options.length > 1) selDst.selectedIndex = 1;
  }

  const amtInput = document.getElementById('trfAmountInput');
  if (amtInput) amtInput.value = '';

  const m = document.getElementById('modalTransfer');
  if (m) m.classList.remove('hidden');
}

function handleTransferSubmit(e) {
  e.preventDefault();
  
  const src = document.getElementById('trfSourceSelect').value;
  const dst = document.getElementById('trfDestSelect').value;
  const amt = parseFloat(document.getElementById('trfAmountInput').value) || 0;
  const fee = parseFloat(document.getElementById('trfFeeInput').value) || 0;
  const note = document.getElementById('trfNoteInput').value;

  if (src === dst) {
    alert('Dompet asal dan dompet tujuan tidak boleh sama.');
    return;
  }

  if (amt <= 0) {
    alert('Nominal transfer harus lebih dari 0.');
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  state.data.transfer.push({
    rowId: Date.now(),
    tanggal: todayStr,
    walletSource: src,
    walletDestination: dst,
    jumlah: amt,
    biayaAdmin: fee,
    catatan: note
  });

  if (fee > 0) {
    state.data.pengeluaran.push({
      rowId: Date.now() + 1,
      tanggal: todayStr,
      nama: `Biaya Admin Transfer ${src} ➔ ${dst}`,
      kategori: 'Tagihan & Utilitas',
      jumlah: fee,
      walletSource: src,
      keterangan: note
    });
  }

  alert('Transfer antar dompet berhasil dicatat!');
  closeModal('modalTransfer');
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('addTransfer', {
      tanggal: todayStr,
      walletSource: src,
      walletDestination: dst,
      jumlah: amt,
      biayaAdmin: fee,
      catatan: note
    });
  }
}

// Goal Handlers
function openGoalModal() {
  document.getElementById('goalIdInput').value = '';
  document.getElementById('goalNameInput').value = '';
  document.getElementById('goalTargetAmountInput').value = '';
  document.getElementById('goalCollectedInput').value = '0';
  document.getElementById('goalDeadlineInput').value = '';

  const sel = document.getElementById('goalWalletSelect');
  if (sel) {
    sel.innerHTML = '';
    state.accounts.forEach(acc => sel.appendChild(new Option(acc.namaAkun, acc.namaAkun)));
  }

  const m = document.getElementById('modalGoal');
  if (m) m.classList.remove('hidden');
}

function editGoal(goalId) {
  const g = state.goals.find(item => item.id === goalId);
  if (!g) return;

  document.getElementById('goalIdInput').value = g.id;
  document.getElementById('goalNameInput').value = g.namaTarget;
  document.getElementById('goalTargetAmountInput').value = g.nominalTarget;
  document.getElementById('goalCollectedInput').value = g.terkumpul || 0;
  document.getElementById('goalDeadlineInput').value = g.tenggatWaktu;

  const sel = document.getElementById('goalWalletSelect');
  if (sel) {
    sel.innerHTML = '';
    state.accounts.forEach(acc => {
      const opt = new Option(acc.namaAkun, acc.namaAkun);
      if (acc.namaAkun === g.dompetTujuan) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  const m = document.getElementById('modalGoal');
  if (m) m.classList.remove('hidden');
}

function handleGoalSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('goalIdInput').value || ('GOAL-' + Date.now());
  const name = document.getElementById('goalNameInput').value.trim();
  const targetAmt = parseFloat(document.getElementById('goalTargetAmountInput').value) || 0;
  const collected = parseFloat(document.getElementById('goalCollectedInput').value) || 0;
  const deadline = document.getElementById('goalDeadlineInput').value;
  const wallet = document.getElementById('goalWalletSelect').value;

  const existingIdx = state.goals.findIndex(g => g.id === id);
  const goalObj = {
    id: id,
    namaTarget: name,
    nominalTarget: targetAmt,
    terkumpul: collected,
    tenggatWaktu: deadline,
    status: collected >= targetAmt ? 'Tercapai' : 'Aktif',
    dompetTujuan: wallet
  };

  if (existingIdx >= 0) {
    state.goals[existingIdx] = goalObj;
  } else {
    state.goals.push(goalObj);
  }

  closeModal('modalGoal');
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('saveGoal', goalObj);
  }
}

function openDepositGoalModal(goalId) {
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  const depositAmtStr = prompt(`Setor Tabungan Manual ke "${goal.namaTarget}":\nMasukkan Nominal Setoran (Rp):`, "100000");
  if (!depositAmtStr) return;

  const depositAmt = parseFloat(depositAmtStr) || 0;
  if (depositAmt <= 0) return;

  goal.terkumpul = (goal.terkumpul || 0) + depositAmt;
  if (goal.terkumpul >= goal.nominalTarget) goal.status = 'Tercapai';

  state.data.tabungan.push({
    rowId: Date.now(),
    tanggal: new Date().toISOString().split('T')[0],
    nama: `Setoran: ${goal.namaTarget}`,
    kategori: 'Tabungan Manual',
    jumlah: depositAmt,
    walletSource: 'Kas Tunai',
    walletDestination: goal.dompetTujuan || 'Bank BCA',
    keterangan: 'Setoran Manual'
  });

  alert(`Setoran ${formatRupiah(depositAmt)} ke "${goal.namaTarget}" berhasil dicatat!`);
  renderAll();
}

// Rule Handlers
function openRuleModal() {
  document.getElementById('ruleIdInput').value = '';
  document.getElementById('ruleNameInput').value = '';
  document.getElementById('ruleMinIncomeInput').value = '3000000';
  
  const container = document.getElementById('ruleAllocationsContainer');
  if (container) {
    container.innerHTML = '';
    addRuleAllocationRow();
  }

  const m = document.getElementById('modalRule');
  if (m) m.classList.remove('hidden');
}

function addRuleAllocationRow() {
  const container = document.getElementById('ruleAllocationsContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'flex gap-2 items-center rule-alloc-row';
  
  let optionsHtml = state.goals.map(g => `<option value="${g.id}">${g.namaTarget}</option>`).join('');

  row.innerHTML = `
    <select class="rule-target-select flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
      ${optionsHtml || '<option value="GOAL-1">Dana Darurat</option>'}
    </select>
    <input type="number" min="1" max="100" value="20" placeholder="%" class="rule-pct-input w-16 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-600">
    <span class="text-xs font-bold text-slate-500">%</span>
    <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-rose-500 text-xs px-2"><i class="fa-solid fa-trash"></i></button>
  `;

  container.appendChild(row);
}

function handleRuleSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('ruleIdInput').value || ('RULE-' + Date.now());
  const name = document.getElementById('ruleNameInput').value.trim();
  const minInc = parseFloat(document.getElementById('ruleMinIncomeInput').value) || 0;

  const rows = document.querySelectorAll('.rule-alloc-row');
  const targetAlokasi = [];

  rows.forEach(r => {
    const goalId = r.querySelector('.rule-target-select').value;
    const pct = parseFloat(r.querySelector('.rule-pct-input').value) || 0;
    const goalObj = state.goals.find(g => g.id === goalId);
    
    if (pct > 0) {
      targetAlokasi.push({
        targetId: goalId,
        targetName: goalObj ? goalObj.namaTarget : 'Target Tabungan',
        percentage: pct
      });
    }
  });

  const ruleObj = {
    id: id,
    namaAturan: name,
    minPemasukan: minInc,
    targetAlokasi: targetAlokasi,
    statusAktif: 'Aktif'
  };

  const idx = state.rules.findIndex(r => r.id === id);
  if (idx >= 0) state.rules[idx] = ruleObj;
  else state.rules.push(ruleObj);

  closeModal('modalRule');
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('saveRule', ruleObj);
  }
}

function deleteRule(id) {
  if (!confirm('Hapus aturan alokasi ini?')) return;
  state.rules = state.rules.filter(r => r.id !== id);
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('deleteRule', { id: id });
  }
}

// Account Handlers
function openAccountModal() {
  document.getElementById('accIdInput').value = '';
  document.getElementById('accNameInput').value = '';
  document.getElementById('accBalanceInput').value = '0';
  document.getElementById('accColorInput').value = '#0D9488';

  const m = document.getElementById('modalAccount');
  if (m) m.classList.remove('hidden');
}

function editAccount(accId) {
  const acc = state.accounts.find(a => a.id === accId);
  if (!acc) return;

  document.getElementById('accIdInput').value = acc.id;
  document.getElementById('accNameInput').value = acc.namaAkun;
  document.getElementById('accTypeSelect').value = acc.tipe;
  document.getElementById('accBalanceInput').value = acc.saldoAwal || 0;
  document.getElementById('accColorInput').value = acc.warnaIkon || '#0D9488';

  const m = document.getElementById('modalAccount');
  if (m) m.classList.remove('hidden');
}

function handleAccountSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('accIdInput').value || ('ACC-' + Date.now());
  const name = document.getElementById('accNameInput').value.trim();
  const type = document.getElementById('accTypeSelect').value;
  const balance = parseFloat(document.getElementById('accBalanceInput').value) || 0;
  const color = document.getElementById('accColorInput').value;

  const accObj = {
    id: id,
    namaAkun: name,
    tipe: type,
    saldoAwal: balance,
    warnaIkon: color,
    icon: type === 'Tunai' ? 'fa-wallet' : (type === 'Bank' ? 'fa-building-columns' : 'fa-mobile-screen-button')
  };

  const idx = state.accounts.findIndex(a => a.id === id);
  if (idx >= 0) state.accounts[idx] = accObj;
  else state.accounts.push(accObj);

  closeModal('modalAccount');
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('saveAccount', accObj);
  }
}

function deleteAccount(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus akun dompet ini?')) return;
  state.accounts = state.accounts.filter(a => a.id !== id);
  renderAll();

  if (state.apiUrl) {
    sendPostRequest('deleteAccount', { id: id });
  }
}

// ==========================================
// 7. WEB VOICE INPUT (SPEECH RECOGNITION)
// ==========================================

function openVoiceModal() {
  const m = document.getElementById('modalVoice');
  if (m) m.classList.remove('hidden');

  startSpeechRecognition();
}

function triggerVoiceInputForAmount() {
  startSpeechRecognition(true);
}

function startSpeechRecognition(amountOnly = false) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Fitur Pengenal Suara (Speech Recognition) tidak didukung browser ini. Silakan gunakan Google Chrome / Edge.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;

  const resultEl = document.getElementById('voiceResultText');
  if (resultEl) resultEl.innerText = 'Mendengarkan suara Anda...';

  recognition.start();

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    if (resultEl) resultEl.innerText = `"${transcript}"`;

    parseVoiceInputSentence(transcript);
  };

  recognition.onerror = (e) => {
    if (resultEl) resultEl.innerText = `Gagal mengenali suara: ${e.error}`;
  };
}

function parseVoiceInputSentence(text) {
  const clean = text.toLowerCase();
  
  let numMatch = clean.match(/(\d[\d\.\,]*)/);
  let amount = 0;
  
  if (numMatch) {
    amount = parseInt(numMatch[0].replace(/\D/g, ''));
  }
  
  if (clean.includes('ribu') || clean.includes('rb')) {
    if (amount < 1000) amount = amount * 1000;
  }
  if (clean.includes('juta') || clean.includes('jt')) {
    if (amount < 1000000) amount = amount * 1000000;
  }

  let type = 'pengeluaran';
  if (clean.includes('gaji') || clean.includes('pemasukan') || clean.includes('terima') || clean.includes('dapat')) {
    type = 'pemasukan';
  }

  closeModal('modalVoice');
  openTransactionModal(type);
  
  if (amount > 0) {
    const inputAmt = document.getElementById('txAmountInput');
    if (inputAmt) {
      inputAmt.value = amount;
      previewAutoSplitTrigger();
    }
  }

  const inputName = document.getElementById('txNameInput');
  if (inputName) inputName.value = text;
}

// ==========================================
// 8. NAVIGATION, MODAL UTILS & API SYNC
// ==========================================

function switchTab(tabName) {
  state.activeTab = tabName;
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => c.classList.add('hidden'));

  const activeContent = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (activeContent) activeContent.classList.remove('hidden');

  const navItems = document.querySelectorAll('.saldoin-nav-item');
  navItems.forEach(n => n.classList.remove('active'));

  const activeNav = document.getElementById(`nav${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (activeNav) activeNav.classList.add('active');

  renderAll();
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('hidden');
}

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number || 0);
}

async function syncDataWithApi() {
  if (!state.apiUrl) return;

  const syncIcon = document.getElementById('syncIcon');
  if (syncIcon) syncIcon.classList.add('fa-spin');

  try {
    const res = await fetch(`${state.apiUrl}?action=fetchData&username=${encodeURIComponent(state.currentUser ? state.currentUser.username : '')}`);
    const json = await res.json();

    if (json.status === 'success') {
      if (json.accounts && json.accounts.length > 0) state.accounts = json.accounts;
      if (json.goals && json.goals.length > 0) state.goals = json.goals;
      if (json.rules && json.rules.length > 0) state.rules = json.rules;
      if (json.data) state.data = json.data;
    }
  } catch (err) {
    console.error('API Sync Error:', err);
  } finally {
    if (syncIcon) syncIcon.classList.remove('fa-spin');
    renderAll();
  }
}

async function sendPostRequest(action, payload) {
  if (!state.apiUrl) return;

  try {
    await fetch(state.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, username: state.currentUser ? state.currentUser.username : '', ...payload })
    });
  } catch (err) {
    console.error(`Post Error (${action}):`, err);
  }
}

function saveGasSettings() {
  const url = document.getElementById('gasApiUrlInput').value.trim();
  state.apiUrl = url;
  localStorage.setItem('app_api_url', url);
  alert('Web App URL Google Apps Script berhasil disimpan!');
  syncDataWithApi();
}

function testApiConnection() {
  if (!state.apiUrl) {
    alert('Silakan masukkan Web App URL API terlebih dahulu.');
    return;
  }
  fetch(`${state.apiUrl}?action=ping`)
    .then(r => r.json())
    .then(j => alert(j.message || 'Koneksi Berhasil!'))
    .catch(e => alert('Koneksi Gagal: ' + e.toString()));
}

function renderSettingsCategories() {
  const container = document.getElementById('settingsCategoriesList');
  if (!container) return;

  container.innerHTML = '';
  const cats = state.categories.pengeluaran || [];
  cats.forEach(c => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none';
    div.innerHTML = `
      <span class="text-slate-700 font-semibold">${c}</span>
      <button onclick="deleteCategoryItem('${c}')" class="text-slate-400 hover:text-rose-500 font-bold transition"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
  });
}

function openCategoryModal() {
  const name = prompt('Masukkan Nama Kategori Pengeluaran Baru:');
  if (!name) return;
  state.categories.pengeluaran.push(name.trim());
  renderAll();
}

function deleteCategoryItem(catName) {
  if (!confirm(`Hapus kategori "${catName}"?`)) return;
  state.categories.pengeluaran = state.categories.pengeluaran.filter(c => c !== catName);
  renderAll();
}

/**
 * ==============================================================================
 * APLIKASI PELACAK KEUANGAN PRIBADI (FINTRACK v2.0)
 * Single Page Application Logic - Saldoin Feature Parity + Premium Dark Aesthetic
 * ==============================================================================
 */

// Default State Initialization
const state = {
  currentUser: JSON.parse(localStorage.getItem('app_user')) || { username: 'Akmal', userId: 'USR-DEFAULT' },
  apiUrl: localStorage.getItem('app_api_url') || '',
  paydayCutoff: parseInt(localStorage.getItem('app_payday_cutoff')) || 26,
  categoryBudgets: JSON.parse(localStorage.getItem('app_category_budgets')) || {},
  activeTab: 'dashboard',
  txSubTab: 'history', // 'history' | 'accounts'
  analyticsSubTab: 'goals', // 'goals' | 'charts' | 'rules'
  txTypeFilter: 'all',
  txFormType: 'pemasukan',
  isBalanceHidden: false,
  expenseChart: null,
  
  // Entities
  accounts: JSON.parse(localStorage.getItem('app_accounts')) || [
    { id: 'ACC-1', namaAkun: 'Kas Tunai', tipe: 'Tunai', saldoAwal: 500000, warnaIkon: '#10B981', icon: 'fa-wallet' },
    { id: 'ACC-2', namaAkun: 'Bank BCA', tipe: 'Bank', saldoAwal: 4500000, warnaIkon: '#3B82F6', icon: 'fa-building-columns' },
    { id: 'ACC-3', namaAkun: 'Bank BRI', tipe: 'Bank', saldoAwal: 2000000, warnaIkon: '#0284C7', icon: 'fa-credit-card' },
    { id: 'ACC-4', namaAkun: 'GoPay', tipe: 'E-Wallet', saldoAwal: 350000, warnaIkon: '#06B6D4', icon: 'fa-mobile-screen-button' },
    { id: 'ACC-5', namaAkun: 'DANA', tipe: 'E-Wallet', saldoAwal: 150000, warnaIkon: '#3B82F6', icon: 'fa-coins' }
  ],
  goals: JSON.parse(localStorage.getItem('app_goals')) || [
    { id: 'GOAL-1', namaTarget: 'Dana Darurat 6 Bulan', nominalTarget: 15000000, terkumpul: 6500000, tenggatWaktu: '2026-12-31', status: 'Aktif', dompetTujuan: 'Bank BCA' },
    { id: 'GOAL-2', namaTarget: 'Beli Laptop / Gadget', nominalTarget: 12000000, terkumpul: 4800000, tenggatWaktu: '2027-06-30', status: 'Aktif', dompetTujuan: 'Bank BRI' }
  ],
  rules: JSON.parse(localStorage.getItem('app_rules')) || [
    {
      id: 'RULE-1',
      namaAturan: 'Alokasi Tabungan Gaji',
      minPemasukan: 3000000,
      targetAlokasi: [
        { targetId: 'GOAL-1', targetName: 'Dana Darurat 6 Bulan', percentage: 30 },
        { targetId: 'GOAL-2', targetName: 'Beli Laptop / Gadget', percentage: 20 }
      ],
      statusAktif: 'Aktif'
    }
  ],
  data: JSON.parse(localStorage.getItem('app_transactions')) || {
    pemasukan: [
      { rowId: 2, jenis: 'Gaji', tanggal: '2026-09-01', nama: 'Gaji Bulanan PT Akmal Jaya', jumlah: 8500000, wallet: 'Bank BCA', keterangan: 'Gaji Pokok September' }
    ],
    pengeluaran: [
      { rowId: 2, tanggal: '2026-09-02', nama: 'Belanja Bulanan Supermarket', kategori: 'Belanja Bulanan', jumlah: 1250000, wallet: 'Bank BCA', keterangan: 'Bahan pokok' },
      { rowId: 3, tanggal: '2026-09-05', nama: 'Tagihan PLN & IndiHome', kategori: 'Tagihan & Utilitas', jumlah: 650000, wallet: 'Bank BRI', keterangan: 'Utilitas' },
      { rowId: 4, tanggal: '2026-09-10', nama: 'Makan Malam Resto', kategori: 'Makanan & Minuman', jumlah: 85000, wallet: 'Kas Tunai', keterangan: 'Makan bersama' },
      { rowId: 5, tanggal: '2026-09-15', nama: 'Isi Bensin Motor', kategori: 'Transportasi', jumlah: 150000, wallet: 'GoPay', keterangan: 'Pertamax' }
    ],
    tabungan: [
      { rowId: 2, tanggal: '2026-09-01', nama: 'Auto-Split: Dana Darurat 6 Bulan', kategori: 'Tabungan Otomatis', jumlah: 2550000, walletSource: 'Bank BCA', walletDestination: 'Bank BCA', keterangan: 'Alokasi Otomatis Gaji' }
    ],
    transfer: [
      { rowId: 2, tanggal: '2026-09-03', walletSource: 'Bank BCA', walletDestination: 'GoPay', jumlah: 500000, biayaAdmin: 1000, catatan: 'Topup saldo GoPay' }
    ]
  },
  categories: JSON.parse(localStorage.getItem('app_categories')) || {
    pengeluaran: ['Makanan & Minuman', 'Transportasi', 'Tagihan & Utilitas', 'Belanja Bulanan', 'Hiburan & Rekreasi', 'Kesehatan & Medis', 'Lainnya'],
    tabungan: ['Tabungan Darurat', 'Reksa Dana', 'Investasi Saham', 'Emas / Logam Mulia', 'Deposito', 'Lainnya'],
    pemasukan: ['Gaji', 'Bonus & Komisi', 'Hasil Penjualan', 'Freelance & Sampingan', 'Hadiah & Hibah', 'Lainnya']
  }
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!state.currentUser) {
    showAuthScreen();
  } else {
    hideAuthScreen();
    initApp();
  }
});

function showAuthScreen() {
  const el = document.getElementById('authScreen');
  if (el) el.classList.remove('hidden');
}

function hideAuthScreen() {
  const el = document.getElementById('authScreen');
  if (el) el.classList.add('hidden');
}

function initApp() {
  // Set user greeting
  const user = state.currentUser ? state.currentUser.username : 'User';
  document.getElementById('currentUserName').innerText = user;
  document.getElementById('userGreeting').innerText = getGreetingTime();
  document.getElementById('settingsUserName').innerText = user;

  // Set default month in filters & forms
  const todayStr = new Date().toISOString().split('T')[0];
  const txMonthFilter = document.getElementById('txMonthFilter');
  if (txMonthFilter) txMonthFilter.value = todayStr.substring(0, 7);

  const txDateInput = document.getElementById('txDateInput');
  if (txDateInput) txDateInput.value = todayStr;

  const gasApiUrlInput = document.getElementById('gasApiUrlInput');
  if (gasApiUrlInput) gasApiUrlInput.value = state.apiUrl;

  // Try fetching latest data from cloud if API URL configured
  if (state.apiUrl) {
    syncDataWithApi();
  } else {
    renderAll();
  }
}

function getGreetingTime() {
  const hr = new Date().getHours();
  if (hr >= 4 && hr < 11) return 'Selamat Pagi,';
  if (hr >= 11 && hr < 15) return 'Selamat Siang,';
  if (hr >= 15 && hr < 18) return 'Selamat Sore,';
  return 'Selamat Malam,';
}

// Save LocalStorage Cache Helper
function saveLocalCache() {
  localStorage.setItem('app_accounts', JSON.stringify(state.accounts));
  localStorage.setItem('app_goals', JSON.stringify(state.goals));
  localStorage.setItem('app_rules', JSON.stringify(state.rules));
  localStorage.setItem('app_transactions', JSON.stringify(state.data));
  localStorage.setItem('app_categories', JSON.stringify(state.categories));
  localStorage.setItem('app_user', JSON.stringify(state.currentUser));
}

// Render Master Component
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
// 1. DASHBOARD RENDERER & LOGIC
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

  const badgeEl = document.getElementById('totalAccountsBadge');
  if (badgeEl) {
    badgeEl.innerText = `${state.accounts.length} Dompet Aktif`;
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

  document.getElementById('dashIncomeDisplay').innerText = formatRupiah(monthlyIncome);
  document.getElementById('dashExpenseDisplay').innerText = formatRupiah(monthlyExpense);

  // 3. Render Horizontal Carousel Accounts
  const carContainer = document.getElementById('dashAccountCarousel');
  if (carContainer) {
    carContainer.innerHTML = '';
    state.accounts.forEach(acc => {
      const bal = accountBalances[acc.namaAkun] !== undefined ? accountBalances[acc.namaAkun] : (acc.saldoAwal || 0);
      const card = document.createElement('div');
      card.className = 'min-w-[140px] p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 flex-shrink-0';
      card.innerHTML = `
        <div class="flex items-center justify-between text-xs">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${acc.warnaIkon || '#10B981'}"></span>
          <span class="text-[10px] font-bold text-slate-500 uppercase">${acc.tipe}</span>
        </div>
        <div class="text-xs font-bold text-slate-300 truncate">${acc.namaAkun}</div>
        <div class="text-sm font-black text-white">${state.isBalanceHidden ? '••••••' : formatRupiah(bal)}</div>
      `;
      carContainer.appendChild(card);
    });
  }

  // 4. Render Target Tabungan Highlights
  const goalDashContainer = document.getElementById('dashGoalsContainer');
  if (goalDashContainer) {
    goalDashContainer.innerHTML = '';
    if (state.goals.length === 0) {
      goalDashContainer.innerHTML = `<div class="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-500 text-center">Belum ada target tabungan.</div>`;
    } else {
      state.goals.slice(0, 2).forEach(g => {
        const pct = Math.min(100, Math.round(((g.terkumpul || 0) / (g.nominalTarget || 1)) * 100));
        const item = document.createElement('div');
        item.className = 'p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2';
        item.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-white">${g.namaTarget}</span>
            <span class="text-emerald-400 font-extrabold">${pct}%</span>
          </div>
          <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full progress-bar-fill" style="width: ${pct}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Terkumpul: <b>${formatRupiah(g.terkumpul || 0)}</b></span>
            <span>Target: <b>${formatRupiah(g.nominalTarget || 0)}</b></span>
          </div>
        `;
        goalDashContainer.appendChild(item);
      });
    }
  }

  // 5. Render Recent Transactions (Top 5)
  const recentListEl = document.getElementById('dashRecentTxList');
  if (recentListEl) {
    const allRecent = getAllUnifiedTransactions().slice(0, 5);
    recentListEl.innerHTML = '';
    if (allRecent.length === 0) {
      recentListEl.innerHTML = `<div class="p-4 text-xs text-slate-500 text-center">Belum ada transaksi dicatat.</div>`;
    } else {
      allRecent.forEach(tx => {
        recentListEl.appendChild(createTransactionRowElement(tx));
      });
    }
  }
}

function toggleBalanceVisibility() {
  state.isBalanceHidden = !state.isBalanceHidden;
  const icon = document.getElementById('balanceEyeIcon');
  if (icon) {
    icon.className = state.isBalanceHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }
  renderDashboard();
}

// Calculate Wallet Balance Dynamics
function calculateAccountBalances() {
  const balances = {};
  
  // Inisialisasi saldo awal
  state.accounts.forEach(acc => {
    balances[acc.namaAkun] = parseFloat(acc.saldoAwal) || 0;
  });

  // Pemasukan menambah saldo dompet
  (state.data.pemasukan || []).forEach(inTx => {
    const w = inTx.wallet || inTx.walletDestination || 'Kas Tunai';
    if (balances[w] !== undefined) {
      balances[w] += parseFloat(inTx.jumlah) || 0;
    }
  });

  // Pengeluaran mengurangi saldo dompet
  (state.data.pengeluaran || []).forEach(outTx => {
    const w = outTx.wallet || outTx.walletSource || 'Kas Tunai';
    if (balances[w] !== undefined) {
      balances[w] -= parseFloat(outTx.jumlah) || 0;
    }
  });

  // Tabungan mengurangi dompet asal
  (state.data.tabungan || []).forEach(savTx => {
    const wSrc = savTx.walletSource || 'Kas Tunai';
    if (balances[wSrc] !== undefined) {
      balances[wSrc] -= parseFloat(savTx.jumlah) || 0;
    }
  });

  // Transfer antar dompet
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

// Get Unified Array of Transactions Sorted by Date Descending
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
      nama: `Transfer: ${item.walletSource} ➔ ${item.walletDestination}`,
      displayCategory: 'Transfer'
    });
  });

  list.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
  return list;
}

function createTransactionRowElement(tx) {
  const row = document.createElement('div');
  row.className = 'p-3 flex items-center justify-between hover:bg-slate-800/50 transition';

  let iconClass = 'fa-arrow-up-right text-rose-400 bg-rose-500/10';
  let prefix = '- ';
  let amountClass = 'text-rose-400';

  if (tx.type === 'pemasukan') {
    iconClass = 'fa-arrow-down-left text-emerald-400 bg-emerald-500/10';
    prefix = '+ ';
    amountClass = 'text-emerald-400';
  } else if (tx.type === 'tabungan') {
    iconClass = 'fa-piggy-bank text-purple-400 bg-purple-500/10';
    prefix = '- ';
    amountClass = 'text-purple-400';
  } else if (tx.type === 'transfer') {
    iconClass = 'fa-arrow-right-arrow-left text-blue-400 bg-blue-500/10';
    prefix = '';
    amountClass = 'text-blue-400';
  }

  row.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm ${iconClass}">
        <i class="fa-solid ${iconClass.split(' ')[0]}"></i>
      </div>
      <div>
        <div class="text-xs font-bold text-white line-clamp-1">${tx.nama || tx.displayCategory}</div>
        <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
          <span>${tx.tanggal}</span>
          <span>•</span>
          <span class="text-slate-500 font-medium">${tx.wallet || tx.walletSource || ''}</span>
        </div>
      </div>
    </div>
    <div class="text-right">
      <div class="text-xs font-black ${amountClass}">${prefix}${formatRupiah(tx.jumlah || 0)}</div>
      <button onclick="deleteTransaction('${tx.type}', ${tx.rowId})" class="text-[10px] text-slate-600 hover:text-rose-400 font-bold mt-0.5">Hapus</button>
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

  // Calculate Monthly Expense Total
  let totalExp = 0;
  filtered.forEach(tx => {
    if (tx.type === 'pengeluaran') totalExp += parseFloat(tx.jumlah) || 0;
  });
  const monthlyExpTotalEl = document.getElementById('txMonthlyExpenseTotal');
  if (monthlyExpTotalEl) monthlyExpTotalEl.innerText = formatRupiah(totalExp);

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-6 text-xs text-slate-500 text-center">Tidak ada transaksi ditemukan.</div>`;
  } else {
    filtered.forEach(tx => {
      container.appendChild(createTransactionRowElement(tx));
    });
  }
}

function setTxTypeFilter(type) {
  state.txTypeFilter = type;
  const btns = document.querySelectorAll('#txTypeFilterContainer .tab-btn');
  btns.forEach(b => {
    b.classList.remove('active');
    b.classList.add('bg-slate-900', 'text-slate-400');
  });
  event.target.classList.add('active');
  event.target.classList.remove('bg-slate-900', 'text-slate-400');
  filterAndRenderTransactions();
}

function setTxSubTab(tab) {
  state.txSubTab = tab;
  const secHist = document.getElementById('sectionTxHistory');
  const secAcc = document.getElementById('sectionTxAccounts');
  const btnHist = document.getElementById('btnSubTxHistory');
  const btnAcc = document.getElementById('btnSubTxAccounts');

  if (tab === 'history') {
    secHist.classList.remove('hidden');
    secAcc.classList.add('hidden');
    btnHist.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 shadow-md transition';
    btnAcc.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition';
  } else {
    secHist.classList.add('hidden');
    secAcc.classList.remove('hidden');
    btnAcc.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 shadow-md transition';
    btnHist.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition';
  }
}

// Render Accounts Manager List
function renderAccounts() {
  const container = document.getElementById('accountsListContainer');
  if (!container) return;

  const balances = calculateAccountBalances();
  container.innerHTML = '';

  state.accounts.forEach(acc => {
    const bal = balances[acc.namaAkun] !== undefined ? balances[acc.namaAkun] : (acc.saldoAwal || 0);
    const div = document.createElement('div');
    div.className = 'p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style="background-color: ${acc.warnaIkon || '#10B981'}">
          <i class="fa-solid ${acc.icon || 'fa-wallet'}"></i>
        </div>
        <div>
          <div class="text-xs font-extrabold text-white">${acc.namaAkun}</div>
          <div class="text-[11px] text-slate-400 font-medium">${acc.tipe} • Saldo Awal: ${formatRupiah(acc.saldoAwal || 0)}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs font-black text-emerald-400">${formatRupiah(bal)}</div>
        <div class="flex gap-2 justify-end mt-1">
          <button onclick="editAccount('${acc.id}')" class="text-[10px] text-slate-400 hover:text-white font-bold">Edit</button>
          <button onclick="deleteAccount('${acc.id}')" class="text-[10px] text-slate-600 hover:text-rose-400 font-bold">Hapus</button>
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
    if (b) b.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition';
  });

  if (tab === 'goals') {
    secG?.classList.remove('hidden');
    if (btnG) btnG.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 shadow-md transition';
  } else if (tab === 'charts') {
    secC?.classList.remove('hidden');
    if (btnC) btnC.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 shadow-md transition';
    renderAnalyticsCharts();
  } else if (tab === 'rules') {
    secR?.classList.remove('hidden');
    if (btnR) btnR.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-white bg-purple-500 shadow-md transition';
  }
}

function renderGoals() {
  const container = document.getElementById('fullGoalsContainer');
  if (!container) return;

  container.innerHTML = '';
  if (state.goals.length === 0) {
    container.innerHTML = `<div class="p-6 text-xs text-slate-500 text-center">Belum ada target tabungan yang dibuat.</div>`;
    return;
  }

  state.goals.forEach(g => {
    const pct = Math.min(100, Math.round(((g.terkumpul || 0) / (g.nominalTarget || 1)) * 100));
    const sisaHari = calculateDaysRemaining(g.tenggatWaktu);
    
    const div = document.createElement('div');
    div.className = 'p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3';
    div.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-black text-white flex items-center gap-2">
            ${g.namaTarget}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${pct >= 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}">
              ${pct >= 100 ? 'Tercapai! 🎉' : 'Aktif'}
            </span>
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">Penampung: <b>${g.dompetTujuan || 'Bank BCA'}</b> • Deadline: <b>${g.tenggatWaktu}</b> (${sisaHari})</div>
        </div>
        <div class="text-right">
          <div class="text-base font-black text-emerald-400">${pct}%</div>
        </div>
      </div>

      <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full progress-bar-fill" style="width: ${pct}%"></div>
      </div>

      <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
        <span class="text-slate-400">Terkumpul: <b class="text-white">${formatRupiah(g.terkumpul || 0)}</b></span>
        <span class="text-slate-400">Target: <b class="text-white">${formatRupiah(g.nominalTarget || 0)}</b></span>
      </div>

      <div class="flex gap-2 justify-end pt-1">
        <button onclick="openDepositGoalModal('${g.id}')" class="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
          + Setor Manual
        </button>
        <button onclick="editGoal('${g.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
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

// Render Auto-Split Rules Manager List
function renderRules() {
  const container = document.getElementById('rulesListContainer');
  if (!container) return;

  container.innerHTML = '';
  if (state.rules.length === 0) {
    container.innerHTML = `<div class="p-6 text-xs text-slate-500 text-center">Belum ada aturan alokasi otomatis.</div>`;
    return;
  }

  state.rules.forEach(r => {
    let totalPct = 0;
    (r.targetAlokasi || []).forEach(t => totalPct += (t.percentage || 0));

    const div = document.createElement('div');
    div.className = 'p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3';
    
    let allocListHtml = (r.targetAlokasi || []).map(t => `
      <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-none">
        <span class="text-slate-300 font-semibold">${t.targetName}</span>
        <span class="text-purple-400 font-bold">${t.percentage}%</span>
      </div>
    `).join('');

    div.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-black text-white flex items-center gap-2">
            ${r.namaAturan}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              ${r.statusAktif || 'Aktif'}
            </span>
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">Trigger: Pemasukan $\\ge$ <b>${formatRupiah(r.minPemasukan || 0)}</b></div>
        </div>
        <button onclick="deleteRule('${r.id}')" class="text-xs text-slate-600 hover:text-rose-400 font-bold">Hapus</button>
      </div>

      <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
        <div class="text-[10px] font-bold text-slate-500 uppercase mb-1">Distribusi Alokasi Tabungan (${totalPct}%)</div>
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
  
  // Aggregate expenses per category
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

  // Render Donut Chart
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (ctx) {
    if (state.expenseChart) state.expenseChart.destroy();

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    const bgColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#F59E0B', '#06B6D4', '#64748B'];

    if (labels.length === 0) {
      state.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Belum Ada Data'],
          datasets: [{ data: [1], backgroundColor: ['#334155'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    } else {
      state.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 2, borderColor: '#0F172A' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 10, family: 'Plus Jakarta Sans' } } }
          }
        }
      });
    }
  }

  // Render Category Ranking Progress Rows
  const rankingContainer = document.getElementById('categoryRankingContainer');
  if (rankingContainer) {
    rankingContainer.innerHTML = '';
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0) {
      rankingContainer.innerHTML = `<div class="text-xs text-slate-500 text-center py-2">Belum ada pengeluaran di bulan ini.</div>`;
    } else {
      sortedCats.forEach(([cat, amt]) => {
        const pct = totalExpMonth > 0 ? Math.round((amt / totalExpMonth) * 100) : 0;
        const row = document.createElement('div');
        row.className = 'space-y-1';
        row.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-white">${cat}</span>
            <span class="text-slate-400 font-semibold">${formatRupiah(amt)} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div class="bg-emerald-500 h-full rounded-full" style="width: ${pct}%"></div>
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
  
  const m = document.getElementById('modalTransaction');
  if (m) m.classList.remove('hidden');
}

function setTxTypeForm(type) {
  state.txFormType = type;
  const btnIn = document.getElementById('btnFormIn');
  const btnOut = document.getElementById('btnFormOut');
  const btnSav = document.getElementById('btnFormSav');

  [btnIn, btnOut, btnSav].forEach(b => {
    if (b) b.className = 'py-2 rounded-lg text-slate-400 hover:text-white';
  });

  if (type === 'pemasukan' && btnIn) btnIn.className = 'py-2 rounded-lg bg-emerald-500 text-slate-950 shadow font-extrabold';
  if (type === 'pengeluaran' && btnOut) btnOut.className = 'py-2 rounded-lg bg-rose-500 text-white shadow font-extrabold';
  if (type === 'tabungan' && btnSav) btnSav.className = 'py-2 rounded-lg bg-purple-500 text-white shadow font-extrabold';

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

  // Find matching active rules
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
          // Add automated savings entry
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

          // Update goal collected balance
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

  // Send to backend if online
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

  if (type === 'pemasukan') {
    state.data.pemasukan = state.data.pemasukan.filter(item => item.rowId !== rowId);
  } else if (type === 'pengeluaran') {
    state.data.pengeluaran = state.data.pengeluaran.filter(item => item.rowId !== rowId);
  } else if (type === 'tabungan') {
    state.data.tabungan = state.data.tabungan.filter(item => item.rowId !== rowId);
  } else if (type === 'transfer') {
    state.data.transfer = state.data.transfer.filter(item => item.rowId !== rowId);
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

  alert('Transfer berhasil dicatat!');
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
    <select class="rule-target-select flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white">
      ${optionsHtml || '<option value="GOAL-1">Dana Darurat</option>'}
    </select>
    <input type="number" min="1" max="100" value="20" placeholder="%" class="rule-pct-input w-16 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-purple-400">
    <span class="text-xs font-bold text-slate-500">%</span>
    <button type="button" onclick="this.parentElement.remove()" class="text-slate-600 hover:text-rose-400 text-xs px-1"><i class="fa-solid fa-trash"></i></button>
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
  document.getElementById('accColorInput').value = '#10B981';

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
  if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;
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
    alert('Fitur Pengenal Suara (Speech Recognition) tidak didukung browser ini. Silakan gunakan Chrome/Edge.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;

  const resultEl = document.getElementById('voiceResultText');
  if (resultEl) resultEl.innerText = 'Silakan bicara sekarang...';

  recognition.start();

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    if (resultEl) resultEl.innerText = `"${transcript}"`;

    parseVoiceInputSentence(transcript);
  };

  recognition.onerror = (e) => {
    if (resultEl) resultEl.innerText = `Error: ${e.error}`;
  };
}

function parseVoiceInputSentence(text) {
  const clean = text.toLowerCase();
  
  // Extract Number (Nominal)
  let numMatch = clean.match(/(\d[\d\.\,]*)/);
  let amount = 0;
  
  if (numMatch) {
    amount = parseInt(numMatch[0].replace(/\D/g, ''));
  }
  
  // Check keywords for thousands (ribu/juta)
  if (clean.includes('ribu') || clean.includes('rb')) {
    if (amount < 1000) amount = amount * 1000;
  }
  if (clean.includes('juta') || clean.includes('jt')) {
    if (amount < 1000000) amount = amount * 1000000;
  }

  // Detect Type
  let type = 'pengeluaran';
  if (clean.includes('gaji') || clean.includes('pemasukan') || clean.includes('terima') || clean.includes('dapat')) {
    type = 'pemasukan';
  }

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

  const navItems = document.querySelectorAll('.nav-item');
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

// API Cloud Sync Helper
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
      
      const statusText = document.getElementById('syncStatusText');
      if (statusText) statusText.innerText = 'Tersinkron';
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
    div.className = 'flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-none';
    div.innerHTML = `
      <span class="text-slate-300 font-semibold">${c}</span>
      <button onclick="deleteCategoryItem('${c}')" class="text-slate-600 hover:text-rose-400 font-bold"><i class="fa-solid fa-trash"></i></button>
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

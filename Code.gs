/**
 * ==============================================================================
 * APLIKASI PELACAK KEUANGAN PRIBADI (FINTRACK v2.0)
 * Backend Google Apps Script (GAS) API - Multi-Akun & Auto-Split Tabungan Engine
 * ==============================================================================
 * Database Structure (Google Spreadsheet Sheets):
 * 1. Pemasukan       : [ Jenis, Tanggal, Nama, Jumlah, Dompet, Keterangan ]
 * 2. Pengeluaran     : [ Tanggal, Nama, Kategori, Jumlah, Dompet, Keterangan ]
 * 3. Tabungan        : [ Tanggal, Nama, Kategori, Jumlah, Dompet Asal, Dompet Tujuan, Keterangan ]
 * 4. Transfer        : [ Tanggal, Dompet Asal, Dompet Tujuan, Jumlah, Biaya Admin, Catatan ]
 * 5. Akun            : [ ID, Nama Akun, Tipe, Saldo Awal, Warna Ikon, Icon ]
 * 6. TargetTabungan  : [ ID, Nama Target, Nominal Target, Terkumpul, Tenggat Waktu, Status, Dompet Tujuan ]
 * 7. AutoSplitRules  : [ ID, Nama Aturan, Min Pemasukan, Target Alokasi JSON, Status Aktif ]
 * 8. Kategori        : [ Kategori Pengeluaran, Kategori Tabungan, Pemasukan, Dompet ]
 * 9. Users           : [ UserID, Username, PasswordHash/PIN, CreatedAt ]
 * 10. Settings       : [ Username, Key, Value ]
 * ==============================================================================
 */

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Inisialisasi Sheet & Header jika belum ada
 */
function setupSheets() {
  const ss = getSpreadsheet();
  
  const sheetDefinitions = [
    {
      name: 'Pemasukan',
      headers: ['Jenis', 'Tanggal', 'Nama', 'Jumlah', 'Dompet', 'Keterangan']
    },
    {
      name: 'Pengeluaran',
      headers: ['Tanggal', 'Nama', 'Kategori', 'Jumlah', 'Dompet', 'Keterangan']
    },
    {
      name: 'Tabungan',
      headers: ['Tanggal', 'Nama', 'Kategori', 'Jumlah', 'Dompet Asal', 'Dompet Tujuan', 'Keterangan']
    },
    {
      name: 'Transfer',
      headers: ['Tanggal', 'Dompet Asal', 'Dompet Tujuan', 'Jumlah', 'Biaya Admin', 'Catatan']
    },
    {
      name: 'Akun',
      headers: ['ID', 'Nama Akun', 'Tipe', 'Saldo Awal', 'Warna Ikon', 'Icon'],
      initialData: [
        ['ACC-1', 'Kas Tunai', 'Tunai', 0, '#10B981', 'fa-wallet'],
        ['ACC-2', 'Bank BCA', 'Bank', 0, '#3B82F6', 'fa-building-columns'],
        ['ACC-3', 'Bank BRI', 'Bank', 0, '#0284C7', 'fa-credit-card'],
        ['ACC-4', 'GoPay', 'E-Wallet', 0, '#06B6D4', 'fa-mobile-screen-button'],
        ['ACC-5', 'DANA', 'E-Wallet', 0, '#3B82F6', 'fa-coins']
      ]
    },
    {
      name: 'TargetTabungan',
      headers: ['ID', 'Nama Target', 'Nominal Target', 'Terkumpul', 'Tenggat Waktu', 'Status', 'Dompet Tujuan'],
      initialData: [
        ['GOAL-1', 'Dana Darurat', 10000000, 0, '2026-12-31', 'Aktif', 'Bank BCA'],
        ['GOAL-2', 'Beli Laptop / Gadget', 15000000, 0, '2027-06-30', 'Aktif', 'Bank Mandiri']
      ]
    },
    {
      name: 'AutoSplitRules',
      headers: ['ID', 'Nama Aturan', 'Min Pemasukan', 'Target Alokasi JSON', 'Status Aktif'],
      initialData: [
        [
          'RULE-1',
          'Alokasi Gaji Bulanan',
          3000000,
          JSON.stringify([
            { targetId: 'GOAL-1', targetName: 'Dana Darurat', percentage: 30 },
            { targetId: 'GOAL-2', targetName: 'Beli Laptop / Gadget', percentage: 20 }
          ]),
          'Aktif'
        ]
      ]
    },
    {
      name: 'Kategori',
      headers: ['Kategori Pengeluaran', 'Kategori Tabungan', 'Pemasukan', 'Dompet'],
      initialData: [
        ['Makanan & Minuman', 'Tabungan Darurat', 'Gaji', 'Kas Tunai'],
        ['Transportasi', 'Reksa Dana', 'Bonus & Komisi', 'Bank BCA'],
        ['Tagihan & Utilitas', 'Investasi Saham', 'Hasil Penjualan', 'Bank BRI'],
        ['Belanja Bulanan', 'Emas / Logam Mulia', 'Freelance & Sampingan', 'GoPay'],
        ['Hiburan & Rekreasi', 'Tabungan Hobi / Liburan', 'Hadiah & Hibah', 'DANA'],
        ['Kesehatan & Medis', 'Deposito', 'Lainnya', '']
      ]
    },
    {
      name: 'Users',
      headers: ['UserID', 'Username', 'PasswordHash/PIN', 'CreatedAt']
    },
    {
      name: 'Settings',
      headers: ['Username', 'Key', 'Value']
    }
  ];

  sheetDefinitions.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    
    // Jika sheet kosong, isi header
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length).setFontWeight('bold').setBackground('#E2E8F0');
      
      // Isi data awal jika ada
      if (def.initialData && def.initialData.length > 0) {
        def.initialData.forEach(row => sheet.appendRow(row));
      }
    }
  });
}

/**
 * Format Response JSON untuk API CORS
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle GET Requests
 */
function doGet(e) {
  setupSheets();
  const action = e.parameter ? e.parameter.action : null;
  
  if (action === 'ping') {
    return createJsonResponse({ status: 'success', message: 'API FinTrack v2.0 Google Apps Script siap digunakan!', timestamp: new Date() });
  }

  if (action === 'fetchData') {
    return handleFetchData(e.parameter.username || '');
  }
  
  return createJsonResponse({
    status: 'success',
    message: 'Backend API FinTrack v2.0 Berjalan Aktif',
    availableEndpoints: ['ping', 'fetchData (via GET)', 'POST actions: login, register, fetchData, addTransaction, deleteTransaction, addTransfer, saveAccount, saveGoal, saveRule, deleteCategory, saveSettings']
  });
}

/**
 * Handle POST Requests (Main API Gateway)
 */
function doPost(e) {
  setupSheets();
  
  let payload = {};
  try {
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }
  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'Format JSON payload tidak valid: ' + err.toString() });
  }

  const action = payload.action;

  switch (action) {
    case 'register':
      return handleRegister(payload);
    case 'login':
      return handleLogin(payload);
    case 'fetchData':
      return handleFetchData(payload.username);
    case 'addTransaction':
      return handleAddTransaction(payload);
    case 'deleteTransaction':
      return handleDeleteTransaction(payload);
    case 'addTransfer':
      return handleAddTransfer(payload);
    case 'saveAccount':
      return handleSaveAccount(payload);
    case 'deleteAccount':
      return handleDeleteAccount(payload);
    case 'saveGoal':
      return handleSaveGoal(payload);
    case 'saveRule':
      return handleSaveRule(payload);
    case 'deleteRule':
      return handleDeleteRule(payload);
    case 'changePin':
      return handleChangePin(payload);
    case 'addCategory':
      return handleAddCategory(payload);
    case 'deleteCategory':
      return handleDeleteCategory(payload);
    case 'saveSettings':
      return handleSaveSettings(payload);
    default:
      return createJsonResponse({ status: 'error', message: 'Aksi (' + action + ') tidak ditemukan' });
  }
}

// ==========================================
// API HANDLER IMPLEMENTATIONS
// ==========================================

/**
 * Registrasi User Baru
 */
function handleRegister(payload) {
  const username = (payload.username || '').trim();
  const pin = (payload.pin || '').toString().trim();

  if (!username || !pin) {
    return createJsonResponse({ status: 'error', message: 'Username dan PIN harus diisi' });
  }

  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('Users');
  const data = userSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === username.toLowerCase()) {
      return createJsonResponse({ status: 'error', message: 'Username sudah terdaftar. Silakan login.' });
    }
  }

  const userId = 'USR-' + Date.now();
  const createdAt = new Date().toISOString();

  userSheet.appendRow([userId, username, pin, createdAt]);

  return createJsonResponse({
    status: 'success',
    message: 'Registrasi berhasil!',
    user: {
      userId: userId,
      username: username
    }
  });
}

/**
 * Login User
 */
function handleLogin(payload) {
  const username = (payload.username || '').trim();
  const pin = (payload.pin || '').toString().trim();

  if (!username || !pin) {
    return createJsonResponse({ status: 'error', message: 'Username dan PIN harus diisi' });
  }

  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('Users');
  const data = userSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowUser = (data[i][1] || '').toString().trim();
    const rowPin = (data[i][2] || '').toString().trim();

    if (rowUser.toLowerCase() === username.toLowerCase()) {
      if (rowPin === pin) {
        return createJsonResponse({
          status: 'success',
          message: 'Login berhasil!',
          user: {
            userId: data[i][0],
            username: data[i][1]
          }
        });
      } else {
        return createJsonResponse({ status: 'error', message: 'PIN / Password salah' });
      }
    }
  }

  return createJsonResponse({ status: 'error', message: 'Username tidak ditemukan' });
}

/**
 * Fetch All Data (Multi-Akun, Target Tabungan, Auto-Split Rules, Transaksi)
 */
function handleFetchData(username) {
  const ss = getSpreadsheet();
  
  // 1. Fetch Pemasukan
  const inSheet = ss.getSheetByName('Pemasukan');
  const inData = inSheet ? inSheet.getDataRange().getValues() : [];
  const pemasukanList = [];
  for (let i = 1; i < inData.length; i++) {
    if (inData[i][0] || inData[i][1] || inData[i][2]) {
      pemasukanList.push({
        rowId: i + 1,
        jenis: inData[i][0] || 'Pemasukan',
        tanggal: formatDateStr(inData[i][1]),
        nama: inData[i][2] || '',
        jumlah: parseFloat(inData[i][3]) || 0,
        wallet: inData[i][4] || 'Kas Tunai',
        walletDestination: inData[i][4] || 'Kas Tunai',
        keterangan: inData[i][5] || ''
      });
    }
  }

  // 2. Fetch Pengeluaran
  const outSheet = ss.getSheetByName('Pengeluaran');
  const outData = outSheet ? outSheet.getDataRange().getValues() : [];
  const pengeluaranList = [];
  for (let i = 1; i < outData.length; i++) {
    if (outData[i][0] || outData[i][1]) {
      pengeluaranList.push({
        rowId: i + 1,
        tanggal: formatDateStr(outData[i][0]),
        nama: outData[i][1] || '',
        kategori: outData[i][2] || 'Lainnya',
        jumlah: parseFloat(outData[i][3]) || 0,
        wallet: outData[i][4] || 'Kas Tunai',
        walletSource: outData[i][4] || 'Kas Tunai',
        keterangan: outData[i][5] || ''
      });
    }
  }

  // 3. Fetch Tabungan / Setoran
  const savSheet = ss.getSheetByName('Tabungan');
  const savData = savSheet ? savSheet.getDataRange().getValues() : [];
  const tabunganList = [];
  for (let i = 1; i < savData.length; i++) {
    if (savData[i][0] || savData[i][1]) {
      tabunganList.push({
        rowId: i + 1,
        tanggal: formatDateStr(savData[i][0]),
        nama: savData[i][1] || '',
        kategori: savData[i][2] || 'Umum',
        jumlah: parseFloat(savData[i][3]) || 0,
        walletSource: savData[i][4] || 'Kas Tunai',
        walletDestination: savData[i][5] || 'Bank BCA',
        wallet: savData[i][4] || 'Kas Tunai',
        keterangan: savData[i][6] || ''
      });
    }
  }

  // 4. Fetch Transfer
  const trfSheet = ss.getSheetByName('Transfer');
  const trfData = trfSheet ? trfSheet.getDataRange().getValues() : [];
  const transferList = [];
  for (let i = 1; i < trfData.length; i++) {
    if (trfData[i][0] || trfData[i][1]) {
      transferList.push({
        rowId: i + 1,
        tanggal: formatDateStr(trfData[i][0]),
        walletSource: trfData[i][1] || 'Kas Tunai',
        walletDestination: trfData[i][2] || 'Bank BCA',
        jumlah: parseFloat(trfData[i][3]) || 0,
        biayaAdmin: parseFloat(trfData[i][4]) || 0,
        catatan: trfData[i][5] || ''
      });
    }
  }

  // 5. Fetch Akun (Wallets)
  const accSheet = ss.getSheetByName('Akun');
  const accData = accSheet ? accSheet.getDataRange().getValues() : [];
  const accounts = [];
  for (let i = 1; i < accData.length; i++) {
    if (accData[i][0] || accData[i][1]) {
      accounts.push({
        id: accData[i][0] || ('ACC-' + i),
        namaAkun: accData[i][1] || 'Kas Tunai',
        tipe: accData[i][2] || 'Tunai',
        saldoAwal: parseFloat(accData[i][3]) || 0,
        warnaIkon: accData[i][4] || '#10B981',
        icon: accData[i][5] || 'fa-wallet'
      });
    }
  }

  // 6. Fetch Target Tabungan (Goals)
  const goalSheet = ss.getSheetByName('TargetTabungan');
  const goalData = goalSheet ? goalSheet.getDataRange().getValues() : [];
  const goals = [];
  for (let i = 1; i < goalData.length; i++) {
    if (goalData[i][0] || goalData[i][1]) {
      goals.push({
        id: goalData[i][0] || ('GOAL-' + i),
        namaTarget: goalData[i][1] || 'Target',
        nominalTarget: parseFloat(goalData[i][2]) || 0,
        terkumpul: parseFloat(goalData[i][3]) || 0,
        tenggatWaktu: formatDateStr(goalData[i][4]),
        status: goalData[i][5] || 'Aktif',
        dompetTujuan: goalData[i][6] || 'Bank BCA'
      });
    }
  }

  // 7. Fetch Auto-Split Rules
  const ruleSheet = ss.getSheetByName('AutoSplitRules');
  const ruleData = ruleSheet ? ruleSheet.getDataRange().getValues() : [];
  const rules = [];
  for (let i = 1; i < ruleData.length; i++) {
    if (ruleData[i][0] || ruleData[i][1]) {
      let targetAlokasi = [];
      try {
        targetAlokasi = JSON.parse(ruleData[i][3]);
      } catch (e) {}

      rules.push({
        id: ruleData[i][0] || ('RULE-' + i),
        namaAturan: ruleData[i][1] || 'Aturan Alokasi',
        minPemasukan: parseFloat(ruleData[i][2]) || 0,
        targetAlokasi: targetAlokasi,
        statusAktif: ruleData[i][4] || 'Aktif'
      });
    }
  }

  // 8. Fetch Kategori & Dompet Master
  const catSheet = ss.getSheetByName('Kategori');
  const catData = catSheet ? catSheet.getDataRange().getValues() : [];
  const kategoriPengeluaran = [];
  const kategoriTabungan = [];
  const kategoriPemasukan = [];
  const masterWallets = [];

  for (let i = 1; i < catData.length; i++) {
    if (catData[i][0]) kategoriPengeluaran.push(catData[i][0].toString().trim());
    if (catData[i][1]) kategoriTabungan.push(catData[i][1].toString().trim());
    if (catData[i][2]) kategoriPemasukan.push(catData[i][2].toString().trim());
    if (catData[i][3]) masterWallets.push(catData[i][3].toString().trim());
  }

  // Fetch Settings
  let paydayCutoff = 26;
  let categoryBudgets = {};
  const setSheet = ss.getSheetByName('Settings');
  if (setSheet && username) {
    const sData = setSheet.getDataRange().getValues();
    for (let i = 1; i < sData.length; i++) {
      if (sData[i][0] && sData[i][0].toString().toLowerCase() === username.toLowerCase()) {
        const key = sData[i][1];
        const val = sData[i][2];
        if (key === 'paydayCutoff') paydayCutoff = parseInt(val) || 26;
        if (key === 'categoryBudgets') {
          try { categoryBudgets = JSON.parse(val); } catch (e) {}
        }
      }
    }
  }

  return createJsonResponse({
    status: 'success',
    user: { username: username },
    paydayCutoff: paydayCutoff,
    categoryBudgets: categoryBudgets,
    accounts: accounts,
    goals: goals,
    rules: rules,
    categories: {
      pengeluaran: [...new Set(kategoriPengeluaran)],
      tabungan: [...new Set(kategoriTabungan)],
      pemasukan: [...new Set(kategoriPemasukan)]
    },
    data: {
      pemasukan: pemasukanList,
      pengeluaran: pengeluaranList,
      tabungan: tabunganList,
      transfer: transferList
    }
  });
}

/**
 * Tambah Transaksi Baru (Plus Auto-Split Trigger jika Pemasukan)
 */
function handleAddTransaction(payload) {
  const type = payload.type; // 'pemasukan', 'pengeluaran', 'tabungan'
  const tanggal = payload.tanggal || formatDateStr(new Date());
  const nama = payload.nama || '';
  const kategori = payload.kategori || '';
  const jumlah = parseFloat(payload.jumlah) || 0;
  const keterangan = payload.keterangan || '';
  const wallet = payload.wallet || payload.walletSource || 'Kas Tunai';
  const walletSource = payload.walletSource || wallet;
  const walletDestination = payload.walletDestination || 'Bank BCA';

  if (!type || !nama || jumlah <= 0) {
    return createJsonResponse({ status: 'error', message: 'Tipe, nama transaksi, dan nominal harus diisi' });
  }

  const ss = getSpreadsheet();
  let executedRules = [];

  if (type === 'pemasukan') {
    const sheet = ss.getSheetByName('Pemasukan');
    const jenis = kategori || 'Pemasukan';
    sheet.appendRow([jenis, tanggal, nama, jumlah, walletDestination || wallet, keterangan]);

    // Check Auto-Split Rules Engine
    const ruleSheet = ss.getSheetByName('AutoSplitRules');
    if (ruleSheet) {
      const rData = ruleSheet.getDataRange().getValues();
      const goalSheet = ss.getSheetByName('TargetTabungan');
      const savSheet = ss.getSheetByName('Tabungan');

      for (let i = 1; i < rData.length; i++) {
        const isAktif = (rData[i][4] || '').toString() === 'Aktif';
        const minVal = parseFloat(rData[i][2]) || 0;
        
        if (isAktif && jumlah >= minVal) {
          let targets = [];
          try { targets = JSON.parse(rData[i][3]); } catch (e) {}

          targets.forEach(t => {
            const splitAmount = Math.round(jumlah * ((t.percentage || 0) / 100));
            if (splitAmount > 0) {
              // Catat sebagai tabungan otomatis
              savSheet.appendRow([
                tanggal,
                'Auto-Split: ' + t.targetName,
                'Tabungan Otomatis',
                splitAmount,
                walletDestination || wallet,
                'Target Tabungan',
                'Alokasi Otomatis dari ' + nama
              ]);

              // Update Terkumpul di TargetTabungan
              if (goalSheet) {
                const gData = goalSheet.getDataRange().getValues();
                for (let g = 1; g < gData.length; g++) {
                  if (gData[g][0] === t.targetId || gData[g][1] === t.targetName) {
                    const currTerkumpul = parseFloat(gData[g][3]) || 0;
                    goalSheet.getRange(g + 1, 4).setValue(currTerkumpul + splitAmount);
                    break;
                  }
                }
              }

              executedRules.push({ targetName: t.targetName, amount: splitAmount, percentage: t.percentage });
            }
          });
        }
      }
    }

  } else if (type === 'pengeluaran') {
    const sheet = ss.getSheetByName('Pengeluaran');
    sheet.appendRow([tanggal, nama, kategori || 'Lainnya', jumlah, walletSource || wallet, keterangan]);
  } else if (type === 'tabungan') {
    const sheet = ss.getSheetByName('Tabungan');
    sheet.appendRow([tanggal, nama, kategori || 'Umum', jumlah, walletSource, walletDestination, keterangan]);

    // Update Terkumpul di TargetTabungan jika cocok dengan nama/kategori
    const goalSheet = ss.getSheetByName('TargetTabungan');
    if (goalSheet) {
      const gData = goalSheet.getDataRange().getValues();
      for (let g = 1; g < gData.length; g++) {
        if (gData[g][1] === nama || gData[g][1] === kategori) {
          const currTerkumpul = parseFloat(gData[g][3]) || 0;
          goalSheet.getRange(g + 1, 4).setValue(currTerkumpul + jumlah);
          break;
        }
      }
    }
  } else {
    return createJsonResponse({ status: 'error', message: 'Tipe transaksi tidak valid' });
  }

  let msg = 'Transaksi berhasil disimpan!';
  if (executedRules.length > 0) {
    msg += ` ✨ Aturan Auto-Split Berhasil Di-eksekusi (${executedRules.length} Alokasi Tabungan Otomatis dibuat).`;
  }

  return createJsonResponse({ status: 'success', message: msg, executedRules: executedRules });
}

/**
 * Tambah Transfer Antar Akun
 */
function handleAddTransfer(payload) {
  const tanggal = payload.tanggal || formatDateStr(new Date());
  const walletSource = payload.walletSource;
  const walletDestination = payload.walletDestination;
  const jumlah = parseFloat(payload.jumlah) || 0;
  const biayaAdmin = parseFloat(payload.biayaAdmin) || 0;
  const catatan = payload.catatan || '';

  if (!walletSource || !walletDestination || jumlah <= 0) {
    return createJsonResponse({ status: 'error', message: 'Dompet asal, dompet tujuan, dan nominal transfer harus diisi' });
  }

  if (walletSource === walletDestination) {
    return createJsonResponse({ status: 'error', message: 'Dompet asal dan tujuan tidak boleh sama' });
  }

  const ss = getSpreadsheet();
  const trfSheet = ss.getSheetByName('Transfer');
  trfSheet.appendRow([tanggal, walletSource, walletDestination, jumlah, biayaAdmin, catatan]);

  // Jika ada biaya admin, catat juga sebagai pengeluaran
  if (biayaAdmin > 0) {
    const outSheet = ss.getSheetByName('Pengeluaran');
    outSheet.appendRow([tanggal, 'Biaya Admin Transfer: ' + walletSource + ' ➔ ' + walletDestination, 'Tagihan & Utilitas', biayaAdmin, walletSource, catatan]);
  }

  return createJsonResponse({ status: 'success', message: 'Transfer berhasil dicatat!' });
}

/**
 * Simpan / Edit Akun
 */
function handleSaveAccount(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Akun');
  const id = payload.id || ('ACC-' + Date.now());
  const namaAkun = (payload.namaAkun || '').trim();
  const tipe = payload.tipe || 'Tunai';
  const saldoAwal = parseFloat(payload.saldoAwal) || 0;
  const warnaIkon = payload.warnaIkon || '#10B981';
  const icon = payload.icon || 'fa-wallet';

  if (!namaAkun) {
    return createJsonResponse({ status: 'error', message: 'Nama akun harus diisi' });
  }

  const data = sheet.getDataRange().getValues();
  let foundRow = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id || data[i][1].toString().toLowerCase() === namaAkun.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 2, 1, 5).setValues([[namaAkun, tipe, saldoAwal, warnaIkon, icon]]);
  } else {
    sheet.appendRow([id, namaAkun, tipe, saldoAwal, warnaIkon, icon]);
  }

  return createJsonResponse({ status: 'success', message: 'Akun dompet berhasil disimpan!' });
}

/**
 * Hapus Akun Dompet
 */
function handleDeleteAccount(payload) {
  const id = payload.id;
  if (!id) return createJsonResponse({ status: 'error', message: 'ID Akun diperlukan' });

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Akun');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ status: 'success', message: 'Akun berhasil dihapus!' });
    }
  }
  return createJsonResponse({ status: 'error', message: 'Akun tidak ditemukan' });
}

/**
 * Simpan / Edit Target Tabungan
 */
function handleSaveGoal(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('TargetTabungan');
  const id = payload.id || ('GOAL-' + Date.now());
  const namaTarget = (payload.namaTarget || '').trim();
  const nominalTarget = parseFloat(payload.nominalTarget) || 0;
  const terkumpul = parseFloat(payload.terkumpul) || 0;
  const tenggatWaktu = payload.tenggatWaktu || '';
  const status = payload.status || 'Aktif';
  const dompetTujuan = payload.dompetTujuan || 'Bank BCA';

  if (!namaTarget || nominalTarget <= 0) {
    return createJsonResponse({ status: 'error', message: 'Nama target dan nominal target harus diisi' });
  }

  const data = sheet.getDataRange().getValues();
  let foundRow = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id || data[i][1].toString().toLowerCase() === namaTarget.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 2, 1, 6).setValues([[namaTarget, nominalTarget, terkumpul, tenggatWaktu, status, dompetTujuan]]);
  } else {
    sheet.appendRow([id, namaTarget, nominalTarget, terkumpul, tenggatWaktu, status, dompetTujuan]);
  }

  return createJsonResponse({ status: 'success', message: 'Target tabungan berhasil disimpan!' });
}

/**
 * Simpan / Edit Auto-Split Rule
 */
function handleSaveRule(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('AutoSplitRules');
  const id = payload.id || ('RULE-' + Date.now());
  const namaAturan = (payload.namaAturan || '').trim();
  const minPemasukan = parseFloat(payload.minPemasukan) || 0;
  const targetAlokasi = typeof payload.targetAlokasi === 'string' ? payload.targetAlokasi : JSON.stringify(payload.targetAlokasi || []);
  const statusAktif = payload.statusAktif || 'Aktif';

  if (!namaAturan) {
    return createJsonResponse({ status: 'error', message: 'Nama aturan harus diisi' });
  }

  const data = sheet.getDataRange().getValues();
  let foundRow = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 2, 1, 4).setValues([[namaAturan, minPemasukan, targetAlokasi, statusAktif]]);
  } else {
    sheet.appendRow([id, namaAturan, minPemasukan, targetAlokasi, statusAktif]);
  }

  return createJsonResponse({ status: 'success', message: 'Aturan Auto-Split berhasil disimpan!' });
}

/**
 * Hapus Auto-Split Rule
 */
function handleDeleteRule(payload) {
  const id = payload.id;
  if (!id) return createJsonResponse({ status: 'error', message: 'ID Rule diperlukan' });

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('AutoSplitRules');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ status: 'success', message: 'Aturan alokasi berhasil dihapus!' });
    }
  }
  return createJsonResponse({ status: 'error', message: 'Aturan tidak ditemukan' });
}

/**
 * Hapus Transaksi
 */
function handleDeleteTransaction(payload) {
  const type = payload.type;
  const rowId = parseInt(payload.rowId);

  if (!type || !rowId) {
    return createJsonResponse({ status: 'error', message: 'Tipe transaksi dan ID baris diperlukan' });
  }

  const ss = getSpreadsheet();
  let sheetName = '';
  if (type === 'pemasukan') sheetName = 'Pemasukan';
  else if (type === 'pengeluaran') sheetName = 'Pengeluaran';
  else if (type === 'tabungan') sheetName = 'Tabungan';
  else if (type === 'transfer') sheetName = 'Transfer';

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan' });
  }

  if (rowId > 1 && rowId <= sheet.getLastRow()) {
    sheet.deleteRow(rowId);
    return createJsonResponse({ status: 'success', message: 'Transaksi berhasil dihapus!' });
  } else {
    return createJsonResponse({ status: 'error', message: 'Baris transaksi tidak valid' });
  }
}

/**
 * Ubah PIN User
 */
function handleChangePin(payload) {
  const username = payload.username;
  const oldPin = (payload.oldPin || '').toString().trim();
  const newPin = (payload.newPin || '').toString().trim();

  if (!username || !oldPin || !newPin) {
    return createJsonResponse({ status: 'error', message: 'Username, PIN Lama, dan PIN Baru harus diisi' });
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === username.toLowerCase()) {
      if (data[i][2].toString().trim() === oldPin) {
        sheet.getRange(i + 1, 3).setValue(newPin);
        return createJsonResponse({ status: 'success', message: 'PIN berhasil diperbarui!' });
      } else {
        return createJsonResponse({ status: 'error', message: 'PIN Lama salah' });
      }
    }
  }

  return createJsonResponse({ status: 'error', message: 'User tidak ditemukan' });
}

/**
 * Tambah Kategori
 */
function handleAddCategory(payload) {
  const catType = payload.categoryType;
  const categoryName = (payload.categoryName || '').trim();

  if (!catType || !categoryName) {
    return createJsonResponse({ status: 'error', message: 'Tipe kategori dan Nama Kategori harus diisi' });
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Kategori');
  let colIndex = 1;
  if (catType === 'tabungan') colIndex = 2;
  if (catType === 'pemasukan') colIndex = 3;
  if (catType === 'dompet') colIndex = 4;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex - 1] && data[i][colIndex - 1].toString().toLowerCase() === categoryName.toLowerCase()) {
      return createJsonResponse({ status: 'error', message: 'Item sudah ada' });
    }
  }

  let targetRow = 0;
  for (let i = 1; i < data.length; i++) {
    if (!data[i][colIndex - 1] || data[i][colIndex - 1].toString().trim() === '') {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, colIndex).setValue(categoryName);
  } else {
    const newRow = ['', '', '', ''];
    newRow[colIndex - 1] = categoryName;
    sheet.appendRow(newRow);
  }

  return createJsonResponse({ status: 'success', message: 'Master data berhasil ditambahkan!' });
}

/**
 * Hapus Kategori
 */
function handleDeleteCategory(payload) {
  const catType = payload.categoryType;
  const categoryName = (payload.categoryName || '').trim();

  if (!catType || !categoryName) {
    return createJsonResponse({ status: 'error', message: 'Tipe dan nama item harus diisi' });
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Kategori');
  let colIndex = 1;
  if (catType === 'tabungan') colIndex = 2;
  if (catType === 'pemasukan') colIndex = 3;
  if (catType === 'dompet') colIndex = 4;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex - 1] && data[i][colIndex - 1].toString().toLowerCase() === categoryName.toLowerCase()) {
      sheet.getRange(i + 1, colIndex).clearContent();
      return createJsonResponse({ status: 'success', message: 'Master data berhasil dihapus!' });
    }
  }

  return createJsonResponse({ status: 'error', message: 'Item tidak ditemukan' });
}

/**
 * Simpan User Settings
 */
function handleSaveSettings(payload) {
  const username = payload.username;
  if (!username) return createJsonResponse({ status: 'error', message: 'Username diperlukan' });

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  const data = sheet.getDataRange().getValues();

  const updateOrAppendSetting = (key, val) => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase() === username.toLowerCase() && data[i][1] === key) {
        sheet.getRange(i + 1, 3).setValue(val);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([username, key, val]);
    }
  };

  if (payload.paydayCutoff !== undefined) {
    updateOrAppendSetting('paydayCutoff', payload.paydayCutoff.toString());
  }

  if (payload.categoryBudgets !== undefined) {
    const valStr = typeof payload.categoryBudgets === 'string' ? payload.categoryBudgets : JSON.stringify(payload.categoryBudgets);
    updateOrAppendSetting('categoryBudgets', valStr);
  }

  return createJsonResponse({ status: 'success', message: 'Pengaturan berhasil disimpan!' });
}

// ==========================================
// HELPER UTILITIES
// ==========================================

function formatDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return val.toString().substring(0, 10);
}

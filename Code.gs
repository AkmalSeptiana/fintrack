/**
 * ==============================================================================
 * APLIKASI PELAKAT KEUANGAN PRIBADI (FINTRACK)
 * Backend Google Apps Script (GAS) API
 * ==============================================================================
 * Database Structure (Google Spreadsheet Sheets):
 * 1. Pemasukan   : [ Jenis, Tanggal, Nama, Jumlah, Dompet, Keterangan ]
 * 2. Pengeluaran : [ Tanggal, Nama, Kategori, Jumlah, Dompet, Keterangan ]
 * 3. Tabungan    : [ Tanggal, Nama, Kategori, Jumlah, Dompet Asal, Dompet Tujuan, Keterangan ]
 * 4. Kategori    : [ Kategori Pengeluaran, Kategori Tabungan, Pemasukan, Dompet ]
 * 5. Users       : [ UserID, Username, PasswordHash/PIN, CreatedAt ]
 * 6. Settings    : [ Username, Key, Value ]
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
      name: 'Kategori',
      headers: ['Kategori Pengeluaran', 'Kategori Tabungan', 'Pemasukan', 'Dompet'],
      initialData: [
        ['Makanan & Minuman', 'Tabungan Darurat', 'Gaji', 'Tunai'],
        ['Transportasi', 'Reksa Dana', 'Bonus & Komisi', 'Bank BCA'],
        ['Tagihan & Utilitas', 'Investasi Saham', 'Hasil Penjualan', 'Bank Mandiri'],
        ['Belanja Bulanan', 'Emas / Logam Mulia', 'Freelance & Sampingan', 'E-Wallet (GoPay/OVO/Dana)'],
        ['Hiburan & Rekreasi', 'Tabungan Hobi / Liburan', 'Hadiah & Hibah', 'Lainnya'],
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
      
      // Isi data awal jika ada (misal kategori & dompet)
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
 * Handle GET Requests (Healthcheck / Test / Direct Fetch)
 */
function doGet(e) {
  setupSheets();
  const action = e.parameter ? e.parameter.action : null;
  
  if (action === 'ping') {
    return createJsonResponse({ status: 'success', message: 'API FinTrack Google Apps Script siap digunakan!', timestamp: new Date() });
  }

  if (action === 'fetchData') {
    return handleFetchData(e.parameter.username || '');
  }
  
  return createJsonResponse({
    status: 'success',
    message: 'Backend API FinTrack Berjalan Aktif',
    availableEndpoints: ['ping', 'fetchData (via GET)', 'POST actions: login, register, fetchData, addTransaction, deleteTransaction, changePin, addCategory, deleteCategory, saveSettings']
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

  // Cek apakah username sudah dipakai
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
 * Fetch All Financial Data, Master Categories, Wallets & Settings
 */
function handleFetchData(username) {
  const ss = getSpreadsheet();
  
  // Fetch Pemasukan
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
        wallet: inData[i][4] || 'Tunai',
        walletDestination: inData[i][4] || 'Tunai',
        keterangan: inData[i][5] || inData[i][4] || ''
      });
    }
  }

  // Fetch Pengeluaran
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
        wallet: outData[i][4] || 'Tunai',
        walletSource: outData[i][4] || 'Tunai',
        keterangan: outData[i][5] || ''
      });
    }
  }

  // Fetch Tabungan
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
        walletSource: savData[i][4] || 'Tunai',
        walletDestination: savData[i][5] || 'Bank BCA',
        wallet: savData[i][4] || 'Tunai',
        keterangan: savData[i][6] || ''
      });
    }
  }

  // Fetch Kategori & Dompet Master
  const catSheet = ss.getSheetByName('Kategori');
  const catData = catSheet ? catSheet.getDataRange().getValues() : [];
  const kategoriPengeluaran = [];
  const kategoriTabungan = [];
  const kategoriPemasukan = [];
  const wallets = [];

  for (let i = 1; i < catData.length; i++) {
    if (catData[i][0]) kategoriPengeluaran.push(catData[i][0].toString().trim());
    if (catData[i][1]) kategoriTabungan.push(catData[i][1].toString().trim());
    if (catData[i][2]) kategoriPemasukan.push(catData[i][2].toString().trim());
    if (catData[i][3]) wallets.push(catData[i][3].toString().trim());
  }

  // Fetch User Settings (Payday Cutoff & Category Budgets)
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
          try {
            categoryBudgets = JSON.parse(val);
          } catch (e) {}
        }
      }
    }
  }

  return createJsonResponse({
    status: 'success',
    user: {
      username: username
    },
    paydayCutoff: paydayCutoff,
    categoryBudgets: categoryBudgets,
    wallets: wallets.length > 0 ? [...new Set(wallets)] : ['Tunai', 'Bank BCA', 'Bank Mandiri', 'E-Wallet'],
    categories: {
      pengeluaran: [...new Set(kategoriPengeluaran)],
      tabungan: [...new Set(kategoriTabungan)],
      pemasukan: [...new Set(kategoriPemasukan)]
    },
    data: {
      pemasukan: pemasukanList,
      pengeluaran: pengeluaranList,
      tabungan: tabunganList
    }
  });
}

/**
 * Tambah Transaksi Baru
 */
function handleAddTransaction(payload) {
  const type = payload.type; // 'pemasukan', 'pengeluaran', 'tabungan'
  const tanggal = payload.tanggal || formatDateStr(new Date());
  const nama = payload.nama || '';
  const kategori = payload.kategori || '';
  const jumlah = parseFloat(payload.jumlah) || 0;
  const keterangan = payload.keterangan || '';
  const wallet = payload.wallet || payload.walletSource || 'Tunai';
  const walletSource = payload.walletSource || wallet;
  const walletDestination = payload.walletDestination || 'Bank BCA';

  if (!type || !nama || jumlah <= 0) {
    return createJsonResponse({ status: 'error', message: 'Tipe, nama transaksi, dan nominal harus diisi' });
  }

  const ss = getSpreadsheet();

  if (type === 'pemasukan') {
    const sheet = ss.getSheetByName('Pemasukan');
    const jenis = kategori || 'Pemasukan';
    sheet.appendRow([jenis, tanggal, nama, jumlah, walletDestination || wallet, keterangan]);
  } else if (type === 'pengeluaran') {
    const sheet = ss.getSheetByName('Pengeluaran');
    sheet.appendRow([tanggal, nama, kategori || 'Lainnya', jumlah, walletSource || wallet, keterangan]);
  } else if (type === 'tabungan') {
    const sheet = ss.getSheetByName('Tabungan');
    sheet.appendRow([tanggal, nama, kategori || 'Umum', jumlah, walletSource, walletDestination, keterangan]);
  } else {
    return createJsonResponse({ status: 'error', message: 'Tipe transaksi tidak valid' });
  }

  return createJsonResponse({ status: 'success', message: 'Transaksi berhasil disimpan!' });
}

/**
 * Hapus Transaksi Berdasarkan Sheet & Row ID
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
 * Tambah Kategori / Dompet Baru ke Master Sheet
 */
function handleAddCategory(payload) {
  const catType = payload.categoryType; // 'pengeluaran', 'tabungan', 'pemasukan', 'dompet'
  const categoryName = (payload.categoryName || '').trim();

  if (!catType || !categoryName) {
    return createJsonResponse({ status: 'error', message: 'Tipe kategori dan Nama Kategori harus diisi' });
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Kategori');
  let colIndex = 1; // Default Pengeluaran
  if (catType === 'tabungan') colIndex = 2;
  if (catType === 'pemasukan') colIndex = 3;
  if (catType === 'dompet') colIndex = 4;

  const data = sheet.getDataRange().getValues();
  
  // Cek duplikasi
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex - 1] && data[i][colIndex - 1].toString().toLowerCase() === categoryName.toLowerCase()) {
      return createJsonResponse({ status: 'error', message: 'Item sudah ada' });
    }
  }

  // Temukan baris kosong pertama di kolom tersebut atau append
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
 * Hapus Kategori / Dompet dari Master Sheet
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
 * Simpan User Settings (Payday Cutoff & Category Budgets)
 */
function handleSaveSettings(payload) {
  const username = payload.username;
  if (!username) {
    return createJsonResponse({ status: 'error', message: 'Username diperlukan' });
  }

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

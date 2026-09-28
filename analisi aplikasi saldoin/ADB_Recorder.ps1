Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ============================================================
#  KONFIGURASI
# ============================================================
$global:AdbPath     = "D:\APLIKASI PRIBADI AKMAL\scrcpy-win64-v3.3.4\adb.exe"
$global:OutputDir   = "D:\APLIKASI PRIBADI AKMAL\analisi aplikasi saldoin\screenshots"
$global:Counter     = 0
$global:AutoRunning = $false
$global:AutoTimer   = $null

New-Item -ItemType Directory -Force -Path $global:OutputDir | Out-Null

# ============================================================
#  FUNGSI INTI
# ============================================================
function Capture-Screenshot {
    param([string]$Label = "")
    $global:Counter++
    $ts    = Get-Date -Format "HHmmss"
    $tag   = if ($Label) { "_$Label" } else { "" }
    $fname = "screen_{0:D3}_{1}{2}.png" -f $global:Counter, $ts, $tag
    $fpath = Join-Path $global:OutputDir $fname
    & $global:AdbPath shell screencap -p /sdcard/tmp_cap.png 2>$null
    & $global:AdbPath pull /sdcard/tmp_cap.png $fpath 2>$null
    return $fpath
}

function Load-Preview {
    param([string]$ImagePath)
    if (-not (Test-Path $ImagePath)) { return }
    try {
        if ($global:PictureBox.Image -ne $null) {
            $old = $global:PictureBox.Image
            $global:PictureBox.Image = $null
            $old.Dispose()
        }
        $bmp = [System.Drawing.Image]::FromFile($ImagePath)
        $global:PictureBox.Image    = $bmp
        $global:PictureBox.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::Zoom
    } catch {}
}

function Update-Status {
    param([string]$Msg, [string]$Color = "#00E676")
    $global:StatusLabel.Text      = $Msg
    $global:StatusLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml($Color)
}

function Update-Counter {
    $files = @(Get-ChildItem "$global:OutputDir\*.png" -ErrorAction SilentlyContinue)
    $global:CountLabel.Text = "Total: $($files.Count) screenshot tersimpan"
}

function Add-Log {
    param([string]$Msg)
    $time = Get-Date -Format "HH:mm:ss"
    $global:LogBox.AppendText("[$time] $Msg`r`n")
    $global:LogBox.ScrollToCaret()
}

function Do-Capture {
    param([string]$Label = "")
    $lbl  = if ($global:LabelInput.Text.Trim()) { $global:LabelInput.Text.Trim() } else { $Label }
    $path = Capture-Screenshot -Label $lbl
    if (Test-Path $path) {
        Load-Preview -ImagePath $path
        $fname = Split-Path $path -Leaf
        Add-Log "[OK] Tersimpan: $fname"
        Update-Status "Tersimpan: $fname"
        Update-Counter
    } else {
        Add-Log "[ERROR] Gagal capture -- pastikan HP terhubung via ADB"
        Update-Status "GAGAL! Cek koneksi ADB" -Color "#FF5252"
    }
}

function Toggle-Auto {
    if ($global:AutoRunning) {
        $global:AutoTimer.Stop()
        $global:AutoTimer.Dispose()
        $global:AutoRunning       = $false
        $global:BtnAuto.Text      = "[ Mulai Auto Record ]"
        $global:BtnAuto.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#00897B")
        Update-Status "Auto recording dihentikan" -Color "#FF5252"
        Add-Log "[STOP] Auto recording dihentikan"
    } else {
        $interval                  = [int]$global:IntervalInput.Value * 1000
        $global:AutoTimer          = New-Object System.Windows.Forms.Timer
        $global:AutoTimer.Interval = $interval
        $global:AutoTimer.Add_Tick({ Do-Capture -Label "auto" })
        $global:AutoTimer.Start()
        $global:AutoRunning       = $true
        $global:BtnAuto.Text      = "[ STOP Auto Record ]"
        $global:BtnAuto.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#C62828")
        Update-Status "AUTO AKTIF -- setiap $($global:IntervalInput.Value) detik" -Color "#FF6D00"
        Add-Log "[START] Auto recording -- interval $($global:IntervalInput.Value) detik"
    }
}

function Check-ADB {
    $result = & $global:AdbPath devices 2>&1
    $lines  = $result | Where-Object { $_ -match "device$" }
    if ($lines.Count -gt 0) {
        $dev = ($lines[0] -split "\s+")[0]
        Update-Status "HP Terhubung: $dev"
        Add-Log "[ADB] Device terhubung: $dev"
    } else {
        Update-Status "HP tidak terdeteksi!" -Color "#FF5252"
        Add-Log "[ADB] Tidak ada device -- hubungkan HP dan aktifkan USB Debugging"
    }
}

# ============================================================
#  WARNA & FONT
# ============================================================
$cBg      = [System.Drawing.ColorTranslator]::FromHtml("#0D1117")
$cPanel   = [System.Drawing.ColorTranslator]::FromHtml("#161B22")
$cCard    = [System.Drawing.ColorTranslator]::FromHtml("#1C2128")
$cAccent  = [System.Drawing.ColorTranslator]::FromHtml("#00E676")
$cAccent2 = [System.Drawing.ColorTranslator]::FromHtml("#00897B")
$cText    = [System.Drawing.ColorTranslator]::FromHtml("#E6EDF3")
$cMuted   = [System.Drawing.ColorTranslator]::FromHtml("#7D8590")
$cBorder  = [System.Drawing.ColorTranslator]::FromHtml("#30363D")
$cBlue    = [System.Drawing.ColorTranslator]::FromHtml("#1565C0")
$cPurple  = [System.Drawing.ColorTranslator]::FromHtml("#4A148C")
$cGray    = [System.Drawing.ColorTranslator]::FromHtml("#37474F")
$cRed     = [System.Drawing.ColorTranslator]::FromHtml("#C62828")

$fTitle = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$fLabel = New-Object System.Drawing.Font("Segoe UI",  9, [System.Drawing.FontStyle]::Regular)
$fBold  = New-Object System.Drawing.Font("Segoe UI",  9, [System.Drawing.FontStyle]::Bold)
$fBtn   = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$fMono  = New-Object System.Drawing.Font("Consolas",  8, [System.Drawing.FontStyle]::Regular)
$fSmall = New-Object System.Drawing.Font("Segoe UI",  8, [System.Drawing.FontStyle]::Regular)
$fSec   = New-Object System.Drawing.Font("Segoe UI",  8, [System.Drawing.FontStyle]::Bold)

# Helper: buat tombol
function mk-btn {
    param([string]$T, [int]$X, [int]$Y, [int]$W, [int]$H, $Bg)
    $b = New-Object System.Windows.Forms.Button
    $b.Text      = $T
    $b.Font      = $fBtn
    $b.ForeColor = [System.Drawing.Color]::White
    $b.BackColor = $Bg
    $b.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $b.FlatAppearance.BorderSize = 0
    $b.Location  = New-Object System.Drawing.Point($X, $Y)
    $b.Size      = New-Object System.Drawing.Size($W, $H)
    $b.Cursor    = [System.Windows.Forms.Cursors]::Hand
    return $b
}

# Helper: buat section label
function mk-sec {
    param([string]$T, [int]$Y, $Parent)
    $l = New-Object System.Windows.Forms.Label
    $l.Text      = $T
    $l.Font      = $fSec
    $l.ForeColor = $cMuted
    $l.Location  = New-Object System.Drawing.Point(14, $Y)
    $l.Size      = New-Object System.Drawing.Size(320, 16)
    $Parent.Controls.Add($l)
}

# ============================================================
#  FORM UTAMA
# ============================================================
$Form = New-Object System.Windows.Forms.Form
$Form.Text            = "ADB Screen Recorder -- Analisis Saldoin"
$Form.Size            = New-Object System.Drawing.Size(1100, 760)
$Form.StartPosition   = "CenterScreen"
$Form.BackColor       = $cBg
$Form.ForeColor       = $cText
$Form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
$Form.MaximizeBox     = $false
$Form.Font            = $fLabel

# ============================================================
#  HEADER
# ============================================================
$Hdr = New-Object System.Windows.Forms.Panel
$Hdr.Location  = New-Object System.Drawing.Point(0, 0)
$Hdr.Size      = New-Object System.Drawing.Size(1100, 70)
$Hdr.BackColor = $cPanel
$Form.Controls.Add($Hdr)

$lTitle = New-Object System.Windows.Forms.Label
$lTitle.Text      = "ADB Screen Recorder"
$lTitle.Font      = $fTitle
$lTitle.ForeColor = $cAccent
$lTitle.Location  = New-Object System.Drawing.Point(20, 8)
$lTitle.Size      = New-Object System.Drawing.Size(400, 34)
$Hdr.Controls.Add($lTitle)

$lSub = New-Object System.Windows.Forms.Label
$lSub.Text      = "Rekam analisis aplikasi Saldoin dari HP via ADB  |  F1=Screenshot  F2=Auto On/Off  F5=Cek ADB"
$lSub.Font      = $fSmall
$lSub.ForeColor = $cMuted
$lSub.Location  = New-Object System.Drawing.Point(22, 46)
$lSub.Size      = New-Object System.Drawing.Size(600, 16)
$Hdr.Controls.Add($lSub)

$global:StatusLabel = New-Object System.Windows.Forms.Label
$global:StatusLabel.Text      = "Memulai..."
$global:StatusLabel.Font      = $fBold
$global:StatusLabel.ForeColor = $cAccent
$global:StatusLabel.Location  = New-Object System.Drawing.Point(560, 16)
$global:StatusLabel.Size      = New-Object System.Drawing.Size(510, 24)
$global:StatusLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
$Hdr.Controls.Add($global:StatusLabel)

$global:CountLabel = New-Object System.Windows.Forms.Label
$global:CountLabel.Text      = "Total: 0 screenshot"
$global:CountLabel.Font      = $fSmall
$global:CountLabel.ForeColor = $cMuted
$global:CountLabel.Location  = New-Object System.Drawing.Point(560, 44)
$global:CountLabel.Size      = New-Object System.Drawing.Size(510, 16)
$global:CountLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
$Hdr.Controls.Add($global:CountLabel)

# ============================================================
#  LEFT PANEL
# ============================================================
$LP = New-Object System.Windows.Forms.Panel
$LP.Location  = New-Object System.Drawing.Point(10, 80)
$LP.Size      = New-Object System.Drawing.Size(350, 660)
$LP.BackColor = $cPanel
$Form.Controls.Add($LP)

# -- Label input --
mk-sec "LABEL SCREENSHOT (opsional)" 14 $LP

$global:LabelInput = New-Object System.Windows.Forms.TextBox
$global:LabelInput.Location      = New-Object System.Drawing.Point(14, 34)
$global:LabelInput.Size          = New-Object System.Drawing.Size(320, 28)
$global:LabelInput.BackColor     = $cCard
$global:LabelInput.ForeColor     = $cText
$global:LabelInput.BorderStyle   = [System.Windows.Forms.BorderStyle]::FixedSingle
$global:LabelInput.Font          = $fLabel
$global:LabelInput.PlaceholderText = "Contoh: dashboard, login, laporan..."
$LP.Controls.Add($global:LabelInput)

# -- Manual capture --
mk-sec "CAPTURE MANUAL" 74 $LP

$BtnCap = mk-btn "AMBIL SCREENSHOT SEKARANG  (F1)" 14 94 320 52 $cAccent2
$BtnCap.ForeColor = [System.Drawing.Color]::White
$BtnCap.Add_Click({ Do-Capture })
$LP.Controls.Add($BtnCap)

# -- Quick tag buttons --
mk-sec "QUICK TAG  (capture + beri label otomatis)" 158 $LP

$tags = @("login","onboarding","dashboard","transaksi","laporan","anggaran","wallet","profil","bot-wa","pro-plan","kategori","pengaturan")
$tx = 14; $ty = 178
foreach ($tag in $tags) {
    $b = New-Object System.Windows.Forms.Button
    $b.Text      = $tag
    $b.Font      = $fSmall
    $b.ForeColor = $cAccent
    $b.BackColor = $cCard
    $b.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $b.FlatAppearance.BorderColor = $cBorder
    $b.FlatAppearance.BorderSize  = 1
    $b.Size      = New-Object System.Drawing.Size(100, 26)
    $b.Location  = New-Object System.Drawing.Point($tx, $ty)
    $b.Cursor    = [System.Windows.Forms.Cursors]::Hand
    $b.Tag       = $tag
    $b.Add_Click({
        param($s, $e)
        $global:LabelInput.Text = $s.Tag
        Do-Capture -Label $s.Tag
        $global:LabelInput.Text = ""
    })
    $LP.Controls.Add($b)
    $tx += 108
    if ($tx -gt 222) { $tx = 14; $ty += 32 }
}
$ty += 44

# -- Auto record --
mk-sec "AUTO RECORD (capture berkala otomatis)" $ty $LP
$ty += 22

$lInt = New-Object System.Windows.Forms.Label
$lInt.Text      = "Interval (detik):"
$lInt.Font      = $fLabel
$lInt.ForeColor = $cText
$lInt.Location  = New-Object System.Drawing.Point(14, $ty)
$lInt.Size      = New-Object System.Drawing.Size(130, 24)
$LP.Controls.Add($lInt)

$global:IntervalInput = New-Object System.Windows.Forms.NumericUpDown
$global:IntervalInput.Location  = New-Object System.Drawing.Point(148, $ty)
$global:IntervalInput.Size      = New-Object System.Drawing.Size(70, 24)
$global:IntervalInput.Minimum   = 1
$global:IntervalInput.Maximum   = 60
$global:IntervalInput.Value     = 3
$global:IntervalInput.BackColor = $cCard
$global:IntervalInput.ForeColor = $cText
$LP.Controls.Add($global:IntervalInput)
$ty += 34

$global:BtnAuto = mk-btn "[ Mulai Auto Record ]  (F2)" 14 $ty 320 48 $cAccent2
$global:BtnAuto.Add_Click({ Toggle-Auto })
$LP.Controls.Add($global:BtnAuto)
$ty += 58

# -- Utilities --
mk-sec "UTILITAS" $ty $LP
$ty += 22

$B1 = mk-btn "Cek ADB (F5)" 14 $ty 154 40 $cBlue
$B1.Add_Click({ Check-ADB })
$LP.Controls.Add($B1)

$B2 = mk-btn "Buka Folder" 176 $ty 158 40 $cPurple
$B2.Add_Click({ Start-Process explorer.exe $global:OutputDir })
$LP.Controls.Add($B2)
$ty += 50

$B3 = mk-btn "Bersihkan Log" 14 $ty 154 36 $cGray
$B3.Add_Click({ $global:LogBox.Clear(); Add-Log "Log dibersihkan." })
$LP.Controls.Add($B3)

# Info box bawah
$InfoBox = New-Object System.Windows.Forms.Panel
$InfoBox.Location  = New-Object System.Drawing.Point(10, 610)
$InfoBox.Size      = New-Object System.Drawing.Size(330, 40)
$InfoBox.BackColor = $cCard
$LP.Controls.Add($InfoBox)

$InfoLbl = New-Object System.Windows.Forms.Label
$InfoLbl.Text      = "Hotkey: F1=Screenshot  |  F2=Auto On/Off  |  F5=Cek ADB"
$InfoLbl.Font      = $fSmall
$InfoLbl.ForeColor = $cMuted
$InfoLbl.Location  = New-Object System.Drawing.Point(8, 6)
$InfoLbl.Size      = New-Object System.Drawing.Size(314, 28)
$InfoLbl.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$InfoBox.Controls.Add($InfoLbl)

# ============================================================
#  RIGHT PANEL
# ============================================================
$RP = New-Object System.Windows.Forms.Panel
$RP.Location  = New-Object System.Drawing.Point(370, 80)
$RP.Size      = New-Object System.Drawing.Size(714, 660)
$RP.BackColor = $cPanel
$Form.Controls.Add($RP)

$lPrev = New-Object System.Windows.Forms.Label
$lPrev.Text      = "PREVIEW SCREENSHOT TERAKHIR"
$lPrev.Font      = $fSec
$lPrev.ForeColor = $cMuted
$lPrev.Location  = New-Object System.Drawing.Point(14, 10)
$lPrev.Size      = New-Object System.Drawing.Size(686, 16)
$RP.Controls.Add($lPrev)

$global:PictureBox = New-Object System.Windows.Forms.PictureBox
$global:PictureBox.Location    = New-Object System.Drawing.Point(14, 30)
$global:PictureBox.Size        = New-Object System.Drawing.Size(686, 400)
$global:PictureBox.BackColor   = $cCard
$global:PictureBox.SizeMode    = [System.Windows.Forms.PictureBoxSizeMode]::Zoom
$global:PictureBox.BorderStyle = [System.Windows.Forms.BorderStyle]::None
$RP.Controls.Add($global:PictureBox)

$lLog = New-Object System.Windows.Forms.Label
$lLog.Text      = "LOG AKTIVITAS"
$lLog.Font      = $fSec
$lLog.ForeColor = $cMuted
$lLog.Location  = New-Object System.Drawing.Point(14, 438)
$lLog.Size      = New-Object System.Drawing.Size(686, 16)
$RP.Controls.Add($lLog)

$global:LogBox = New-Object System.Windows.Forms.RichTextBox
$global:LogBox.Location    = New-Object System.Drawing.Point(14, 458)
$global:LogBox.Size        = New-Object System.Drawing.Size(686, 188)
$global:LogBox.BackColor   = $cCard
$global:LogBox.ForeColor   = $cAccent
$global:LogBox.Font        = $fMono
$global:LogBox.BorderStyle = [System.Windows.Forms.BorderStyle]::None
$global:LogBox.ReadOnly    = $true
$global:LogBox.ScrollBars  = [System.Windows.Forms.RichTextBoxScrollBars]::Vertical
$RP.Controls.Add($global:LogBox)

# ============================================================
#  KEYBOARD SHORTCUTS
# ============================================================
$Form.KeyPreview = $true
$Form.Add_KeyDown({
    param($s, $e)
    switch ($e.KeyCode) {
        "F1" { Do-Capture }
        "F2" { Toggle-Auto }
        "F5" { Check-ADB }
    }
})

# ============================================================
#  INIT
# ============================================================
$Form.Add_Shown({
    Check-ADB
    Update-Counter
    Add-Log "ADB Screen Recorder siap digunakan"
    Add-Log "Output folder: $global:OutputDir"
    Add-Log "Tips: pilih quick tag sebelum capture untuk label otomatis"
    $existing = Get-ChildItem "$global:OutputDir\*.png" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime | Select-Object -Last 1
    if ($existing) {
        Load-Preview -ImagePath $existing.FullName
        Add-Log "Preview terakhir dimuat: $($existing.Name)"
    }
})

$Form.Add_FormClosing({
    if ($global:AutoRunning -and $global:AutoTimer) {
        $global:AutoTimer.Stop()
        $global:AutoTimer.Dispose()
    }
})

# ============================================================
#  JALANKAN
# ============================================================
[System.Windows.Forms.Application]::Run($Form)

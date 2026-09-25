@echo off
title Push Project to GitHub - FinTrack
color 0A
cls

echo ============================================================
echo   FINTRACK (FINANCIAL TRACKER) - GITHUB PUSH SCRIPT
echo ============================================================
echo.

:: 1. Cek apakah Git terinstall
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git belum terinstall di komputer Anda!
    echo Silakan install Git terlebih dahulu dari https://git-scm.com/
    echo.
    pause
    exit /b
)

:: 2. Inisialisasi Git jika belum ada
if not exist ".git" (
    echo [1/5] Menginisialisasi Git repository lokal...
    git init
    echo.
) else (
    echo [1/5] Repository Git lokal sudah ada.
    echo.
)

:: 3. Atur Branch Utama ke 'main'
git branch -M main >nul 2>nul

:: 4. Cek remote origin
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo [2/5] Menghubungkan ke https://github.com/AkmalSeptiana/fintrack.git...
    git remote add origin https://github.com/AkmalSeptiana/fintrack.git
    echo [OK] Remote origin berhasil dikonfigurasi!
    echo.
) else (
    echo [2/5] Remote GitHub terhubung:
    git remote get-url origin
    echo.
)

:: 5. Git Add
echo [3/5] Menambahkan berkas ke Staging (git add .)...
git add .
echo [OK] Semua berkas berhasil ditambahkan.
echo.

:: 6. Git Commit
set /p COMMIT_MSG="Masukkan Pesan Commit [default: Release FinTrack App]: "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Release FinTrack App

echo.
echo [4/5] Membuat Commit: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"
echo.

:: 7. Git Push
echo [5/5] Mengunggah (Push) berkas ke GitHub...
echo.
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ============================================================
    echo   [BERHASIL] FinTrack sukses terunggah ke GitHub! 🎉
    echo   URL: https://github.com/AkmalSeptiana/fintrack
    echo ============================================================
) else (
    color 0E
    echo.
    echo ============================================================
    echo   [PERHATIAN] Push gagal atau membutuhkan login GitHub.
    echo   Jika belum login, silakan jalankan 'git push' di terminal.
    echo ============================================================
)

echo.
pause

@echo off
chcp 65001 >nul
title سهرة العائلة 🎮

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       🎮  سهرة العائلة  🎮              ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Node.js غير مثبت على هذا الجهاز!
    echo.
    echo  📥 قم بتحميله من: https://nodejs.org
    echo.
    pause
    exit /b
)

:: Kill any old server on port 8080
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Open firewall port silently (requires admin, ignores if fails)
netsh advfirewall firewall delete rule name="SahraFamily8080" >nul 2>&1
netsh advfirewall firewall add rule name="SahraFamily8080" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1

:: Wait a moment then start server
timeout /t 1 /nobreak >nul
start "" /B node "%~dp0server.js"
timeout /t 2 /nobreak >nul

:: Open browser automatically
echo  ✅ السيرفر يعمل!
echo.
start http://localhost:8080
echo  🌐 تم فتح المتصفح تلقائياً
echo.
echo  📱 الجوالات تمسح الـ QR Code على الشاشة
echo  ⚠️  يجب أن تكون جميع الأجهزة على نفس الـ WiFi
echo.
echo  ══════════════════════════════════════════
echo  لإيقاف السيرفر: اضغط Ctrl+C أو أغلق هذه النافذة
echo  ══════════════════════════════════════════
echo.

:: Keep window open and show server output
node "%~dp0server.js"
pause

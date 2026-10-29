@echo off
cd /d "%~dp0"
echo ====================================================
echo   DANG DAY CODE LEN GITHUB: Di-m-Gay
echo ====================================================
echo.
git branch -M main
git push -u origin main
echo.
echo ====================================================
if %errorlevel% equ 0 (
    echo   THANH CONG! DA DAY TOAN BO CODE LEN GITHUB!
    echo.
    echo   Bay gio hay vao link sau de bat GitHub Pages:
    echo   https://github.com/vuthedan168-oss/Di-m-Gay/settings/pages
    echo.
    echo   1. Muc "Source": chon Deploy from a branch
    echo   2. Muc "Branch": chon main va /(root), bam Save
    echo.
    echo   Link online 24/7 cua ban se la:
    echo   https://vuthedan168-oss.github.io/Di-m-Gay/
) else (
    echo   CHUA DAY DUOC LEN GITHUB!
    echo   Hay kiem tra lai ket noi hoac dang nhap GitHub tren trinh duyet.
)
echo ====================================================
echo.
pause

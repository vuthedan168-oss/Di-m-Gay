@echo off
chcp 65001 > nul
title Đẩy Trang Web Lên GitHub (Diễm Gay)
cd /d "%~dp0"

echo =======================================================
echo   HỆ THỐNG ĐẨY CODE LÊN GITHUB - DIỄM GAY
echo =======================================================
echo.
echo LƯU Ý TRƯỚC KHI TIẾP TỤC:
echo Bạn hãy mở trình duyệt và tạo một repository mới:
echo 👉 Vào: https://github.com/new
echo    + Tên Repository name: diem-gay
echo    + Chọn chế độ: Public
echo    + KHÔNG tích chọn "Add a README file"
echo    + Bấm nút màu xanh "Create repository"
echo.
echo =======================================================
echo Sau khi tạo xong repo trên GitHub, hãy bấm phím bất kỳ để đẩy code...
pause > nul
echo.
echo Đang đẩy mã nguồn lên GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo   🎉 ĐẨY LÊN GITHUB THÀNH CÔNG!
    echo =======================================================
    echo.
    echo BÂY GIỜ HÃY BẬT GITHUB PAGES ĐỂ LẤY LINK CHO BẠN BÈ:
    echo 1. Mở: https://github.com/vuthedan168-oss/diem-gay/settings/pages
    echo 2. Ở mục "Build and deployment" -> "Source", chọn: Deploy from a branch
    echo 3. Ở mục "Branch", chọn: main và /(root)
    echo 4. Bấm Save.
    echo.
    echo 👉 Sau 1-2 phút, đường link web online 24/7 của bạn sẽ là:
    echo    https://vuthedan168-oss.github.io/diem-gay/
    echo =======================================================
) else (
    echo.
    echo [Lỗi] Chưa đẩy được lên GitHub. 
    echo Hãy đảm bảo bạn đã tạo repo tên "diem-gay" trên GitHub và đăng nhập tài khoản.
)
echo.
pause

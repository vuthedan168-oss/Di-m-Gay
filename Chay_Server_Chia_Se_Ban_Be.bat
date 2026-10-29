@echo off
chcp 65001 > nul
title Diễm Gay - Máy Chủ Ôn Thi Cho Nhóm Bạn
cd /d "%~dp0"
echo =======================================================
echo   ĐANG KHỞI ĐỘNG HỆ THỐNG ÔN SOURCES - DIỄM GAY...
echo =======================================================
start "" "http://localhost:3000"
node server.js
pause


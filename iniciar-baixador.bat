@echo off
title Baixador de Torrent (Node.js)
color 0A
cd /d "%~dp0"
node torrent-downloader.js %*
pause

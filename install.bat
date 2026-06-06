@echo off
setlocal enabledelayedexpansion
title Remote Mouse Controller - Installation
cd /d "%~dp0"

echo ==================================================
echo    Remote Mouse Controller - Installation
echo ==================================================
echo.

REM ---------- 1. Verifier Python ----------
echo [1/4] Verification de Python...
set "PYCMD="
where python >nul 2>nul
if %errorlevel%==0 set "PYCMD=python"
if not defined PYCMD (
    where py >nul 2>nul
    if !errorlevel!==0 set "PYCMD=py"
)
if not defined PYCMD goto :no_python
%PYCMD% --version
echo.

REM ---------- 2. Verifier Node.js ----------
echo [2/4] Verification de Node.js...
where npm >nul 2>nul
if %errorlevel% neq 0 goto :no_node
call npm --version
echo.

REM ---------- 3. Dependances Python ----------
echo [3/4] Installation des dependances Python...
%PYCMD% -m pip install -r requirements.txt
if %errorlevel% neq 0 goto :pip_fail
echo.

REM ---------- 4. Client web (install + build) ----------
echo [4/4] Installation et compilation du client web...
pushd client
call npm install
if %errorlevel% neq 0 ( popd & goto :npm_fail )
call npm run build
if %errorlevel% neq 0 ( popd & goto :npm_fail )
popd
echo.

REM ---------- Configuration du mot de passe ----------
if exist "server\.env" goto :env_exists

echo --------------------------------------------------
echo    Configuration du mot de passe d'acces
echo --------------------------------------------------
echo (Le point d'exclamation n'est pas gere ici ;
echo  vous pourrez toujours editer server\.env ensuite.)
echo.
set "APPPWD="
set /p "APPPWD=Choisissez un mot de passe : "
if not defined APPPWD (
    echo APP_PASSWORD=change_me> "server\.env"
    echo [ATTENTION] Aucun mot de passe saisi. Valeur par defaut "change_me".
    echo             Modifiez server\.env avant utilisation.
) else (
    > "server\.env" echo APP_PASSWORD=!APPPWD!
    echo Mot de passe enregistre dans server\.env
)
goto :done

:env_exists
echo Configuration existante detectee ^(server\.env^) - conservee.

:done
echo.
echo --------------------------------------------------
echo    Application autonome (.exe)
echo --------------------------------------------------
echo Genere un RemoteMouse.exe autonome (sans Python requis)
echo dans le dossier parent. Build d'environ 1 a 2 minutes.
echo.
set "BUILDEXE="
set /p "BUILDEXE=Generer l'application autonome (un launcher en .exe) ? (O/N) : "
if /i "!BUILDEXE!"=="O" goto :build_exe
if /i "!BUILDEXE!"=="Y" goto :build_exe
goto :final

:build_exe
echo.
echo Installation de PyInstaller...
%PYCMD% -m pip install pyinstaller
if %errorlevel% neq 0 goto :pyinstaller_fail
echo.
echo Compilation de l'executable (patientez)...
%PYCMD% -m PyInstaller RemoteMouse.spec --noconfirm
if %errorlevel% neq 0 goto :exe_fail
echo.
move /Y "dist\RemoteMouse.exe" "..\RemoteMouse.exe" >nul
if exist "server\.env" copy /Y "server\.env" "..\.env" >nul
echo Application creee : "%~dp0..\RemoteMouse.exe"
echo (Le fichier .env contenant le mot de passe est place a cote.)
echo.

set "MKLINK="
set /p "MKLINK=Creer un raccourci sur le bureau ? (O/N) : "
if /i "!MKLINK!"=="O" goto :make_shortcut
if /i "!MKLINK!"=="Y" goto :make_shortcut
goto :final

:make_shortcut
powershell -NoProfile -Command "$d=[Environment]::GetFolderPath('Desktop'); $w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut((Join-Path $d 'Remote Mouse.lnk')); $s.TargetPath='%~dp0..\RemoteMouse.exe'; $s.WorkingDirectory='%~dp0..'; $s.IconLocation='%~dp0..\RemoteMouse.exe,0'; $s.Description='Remote Mouse Controller'; $s.Save()"
if %errorlevel% neq 0 (
    echo [ATTENTION] Le raccourci n'a pas pu etre cree automatiquement.
) else (
    echo Raccourci "Remote Mouse" cree sur le bureau.
)
goto :final

:final
echo.
echo ==================================================
echo    Installation terminee.
echo.
if exist "..\RemoteMouse.exe" (
    echo    Lancez l'application autonome :
    echo      - via le raccourci du bureau, ou
    echo      - en double-cliquant "%~dp0..\RemoteMouse.exe"
) else (
    echo    Double-cliquez sur start.vbs pour lancer.
)
echo ==================================================
echo.
pause
exit /b 0


REM ================= Gestion des erreurs =================

:no_python
echo.
echo [ERREUR] Python est introuvable.
echo Installez Python 3 depuis https://www.python.org/downloads/
echo en cochant "Add Python to PATH", puis relancez install.bat
echo.
pause
exit /b 1

:no_node
echo.
echo [ERREUR] Node.js / npm est introuvable.
echo Installez Node.js 20+ depuis https://nodejs.org/
echo puis relancez install.bat
echo.
pause
exit /b 1

:pip_fail
echo.
echo [ERREUR] Echec de l'installation des dependances Python.
echo Verifiez votre connexion internet et reessayez.
echo.
pause
exit /b 1

:npm_fail
echo.
echo [ERREUR] Echec de l'installation ou de la compilation du client web.
echo Verifiez que Node.js est correctement installe et reessayez.
echo.
pause
exit /b 1

:pyinstaller_fail
echo.
echo [ERREUR] Echec de l'installation de PyInstaller.
echo Verifiez votre connexion internet et reessayez.
echo.
pause
exit /b 1

:exe_fail
echo.
echo [ERREUR] Echec de la compilation de l'executable.
echo Consultez les messages ci-dessus pour le detail.
echo.
pause
exit /b 1

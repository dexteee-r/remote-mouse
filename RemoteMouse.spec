# -*- mode: python ; coding: utf-8 -*-
# Build : pyinstaller RemoteMouse.spec --noconfirm
# Produit dist/RemoteMouse.exe (autonome, sans Python requis sur le PC cible).

a = Analysis(
    ['launcher.pyw'],
    pathex=['server'],
    binaries=[],
    datas=[('client/dist', 'dist')],
    hiddenimports=['server', 'pystray._win32'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='RemoteMouse',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    icon='icon.ico',
)

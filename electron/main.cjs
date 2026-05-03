const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 380, // Updated height
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    show: false, // Start hidden
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const { Menu, MenuItem } = require('electron');
  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Edit',
    submenu: [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  }));
  Menu.setApplicationMenu(menu);

  const startUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  mainWindow.loadURL(startUrl);

  ipcMain.on('window-close', () => mainWindow.hide()); 
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-hide', () => {
    mainWindow.webContents.send('reset-app');
    mainWindow.hide();
  });
  ipcMain.on('window-quit', () => app.quit());
  ipcMain.on('copy-text', (event, text) => { clipboard.writeText(text); });
  ipcMain.on('set-window-size', (event, width, height) => {
    if (mainWindow) {
      mainWindow.setSize(width, height, true);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('CommandOrControl+Q', () => {
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
      mainWindow.webContents.send('reset-app');
      mainWindow.hide();
    } else {
      mainWindow.webContents.send('reset-app');
      
      if (process.platform === 'win32') {
        const psCommand = `
          $ErrorActionPreference = 'SilentlyContinue';
          Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms;
          $t = '';
          $e = [System.Windows.Automation.AutomationElement]::FocusedElement;
          if ($e) {
            try {
              $p = $e.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern);
              if ($p) {
                $s = $p.GetSelection();
                if ($s.Length -gt 0) { $t = $s[0].GetText(-1); }
              }
            } catch {}
          }
          if (!$t) {
            [System.Windows.Forms.Clipboard]::Clear();
            [System.Windows.Forms.SendKeys]::SendWait('^c');
            Start-Sleep -Milliseconds 400;
            $t = [System.Windows.Forms.Clipboard]::GetText();
          }
          if ($t) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $t; }
        `.replace(/\n/g, ' ').trim();
        
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, { encoding: 'utf8' }, (err, stdout) => {
          if (err) console.error("PowerShell execution error:", err);
          
          const text = stdout ? stdout.trim() : "";
          
          mainWindow.show();
          mainWindow.focus();
          
          if (text && text.length > 0) {
            mainWindow.webContents.send('grab-text', text);
          }
        });
      } else {
        const text = clipboard.readText();
        if (text) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('grab-text', text);
        }
      }
    }
  });

  globalShortcut.register('CommandOrControl+E', () => {
    if (!mainWindow) return;

    const psCommand = `
      $ErrorActionPreference = 'SilentlyContinue';
      Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms;
      $t = '';
      $e = [System.Windows.Automation.AutomationElement]::FocusedElement;
      if ($e) {
        try {
          $p = $e.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern);
          if ($p) {
            $s = $p.GetSelection();
            if ($s.Length -gt 0) { $t = $s[0].GetText(-1); }
          }
        } catch {}
      }
      if (!$t) {
        [System.Windows.Forms.Clipboard]::Clear();
        [System.Windows.Forms.SendKeys]::SendWait('^c');
        Start-Sleep -Milliseconds 400;
        $t = [System.Windows.Forms.Clipboard]::GetText();
      }
      if ($t) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $t; }
    `.replace(/\n/g, ' ').trim();
    
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, { encoding: 'utf8' }, (err, stdout) => {
      const text = stdout ? stdout.trim() : "";
      
      mainWindow.show();
      mainWindow.focus();
      
      if (text && text.length > 0) {
        mainWindow.webContents.send('grab-text', text);
        mainWindow.webContents.send('trigger-sexting');
      } else {
        mainWindow.webContents.send('trigger-sexting');
      }
    });
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

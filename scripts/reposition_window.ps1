Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WinList {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public static List<string> ListAll() {
        var list = new List<string>();
        EnumWindows((hWnd, lParam) => {
            var sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            string title = sb.ToString();
            if (!string.IsNullOrEmpty(title) && IsWindowVisible(hWnd)) {
                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);
                list.Add(pid + " | " + title);
            }
            return true;
        }, IntPtr.Zero);
        return list;
    }

    public static void RepositionWindow(uint targetPid) {
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            if (pid == targetPid) {
                // Move window to X=200, Y=100
                SetWindowPos(hWnd, IntPtr.Zero, 200, 100, 450, 900, 0x0040); // SWP_SHOWWINDOW = 0x0040
                ShowWindow(hWnd, 9); // SW_RESTORE
                SetForegroundWindow(hWnd);
            }
            return true;
        }, IntPtr.Zero);
    }
}
'@

$wins = [WinList]::ListAll()
Write-Output "Visible Windows on Desktop:"
$wins | ForEach-Object { Write-Output "  $_" }

$qemu = Get-Process -Name "qemu-system-*" -ErrorAction SilentlyContinue
if ($qemu) {
    [WinList]::RepositionWindow($qemu.Id)
}
$emu = Get-Process -Name "emulator" -ErrorAction SilentlyContinue
if ($emu) {
    [WinList]::RepositionWindow($emu.Id)
}

Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WinFinder {
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
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public static List<string> FindWindowsForPid(uint targetPid) {
        var results = new List<string>();
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            if (pid == targetPid) {
                var sb = new StringBuilder(256);
                GetWindowText(hWnd, sb, 256);
                bool vis = IsWindowVisible(hWnd);
                results.Add(hWnd.ToString() + "|" + sb.ToString() + "|" + vis.ToString());
                ShowWindow(hWnd, 9); // SW_RESTORE
                SetForegroundWindow(hWnd);
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
'@

$qemu = Get-Process -Name "qemu-system-*" -ErrorAction SilentlyContinue
if ($qemu) {
    $wins = [WinFinder]::FindWindowsForPid($qemu.Id)
    Write-Output "Windows for QEMU $($qemu.Id):"
    $wins | ForEach-Object { Write-Output "  $_" }
} else {
    Write-Output "QEMU not running"
}

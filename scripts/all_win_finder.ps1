Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class AllWinFinder {
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

    public static List<string> FindAllAndroidWindows() {
        var results = new List<string>();
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            var sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            string title = sb.ToString();
            if (title.IndexOf("Pixel", StringComparison.OrdinalIgnoreCase) >= 0 ||
                title.IndexOf("Android Emulator", StringComparison.OrdinalIgnoreCase) >= 0 ||
                title.IndexOf("Emulator", StringComparison.OrdinalIgnoreCase) >= 0 ||
                title.IndexOf("qemu", StringComparison.OrdinalIgnoreCase) >= 0) {
                bool vis = IsWindowVisible(hWnd);
                results.Add(pid.ToString() + "|" + hWnd.ToString() + "|" + title + "|" + vis.ToString());
                ShowWindow(hWnd, 9); // SW_RESTORE
                SetForegroundWindow(hWnd);
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
'@

$wins = [AllWinFinder]::FindAllAndroidWindows()
Write-Output "Found Windows:"
$wins | ForEach-Object { Write-Output "  $_" }

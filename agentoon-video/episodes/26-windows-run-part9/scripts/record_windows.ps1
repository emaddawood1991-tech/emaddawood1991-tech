# UNTESTED (written on Linux). Run in PowerShell on Windows 11. Needs ffmpeg on PATH. Records each Run command to recordings\NN.mp4.
# Does not change settings. Close each app yourself if it stays open. Hide private info first.
Add-Type @"
using System; using System.Runtime.InteropServices;
public class K { [DllImport("user32.dll")] public static extern void keybd_event(byte v, byte s, int f, int e); }
"@
Add-Type -AssemblyName System.Windows.Forms
New-Item -ItemType Directory -Force recordings | Out-Null
$cmds = @{ "41"="taskschd.msc"; "42"="shrpubw"; "43"="SystemPropertiesRemote"; "44"="ms-settings:signinoptions"; "45"="ms-settings:windowsupdate-history" }
foreach ($n in ($cmds.Keys | Sort-Object)) {
  $p = Start-Process ffmpeg -ArgumentList "-y -f gdigrab -framerate 30 -draw_mouse 1 -i desktop -c:v libx264 -preset veryfast -crf 16 -pix_fmt yuv420p recordings\$n.mp4" -PassThru -WindowStyle Hidden
  Start-Sleep 2
  [K]::keybd_event(0x5B,0,0,0); [K]::keybd_event(0x52,0,0,0); [K]::keybd_event(0x52,0,2,0); [K]::keybd_event(0x5B,0,2,0)  # Win+R
  Start-Sleep 1
  foreach ($c in $cmds[$n].ToCharArray()) { [System.Windows.Forms.SendKeys]::SendWait([string]$c -replace '([+^%~(){}\[\]])','{$1}'); Start-Sleep -Milliseconds 120 }
  Start-Sleep 1; [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
  Write-Host "[$n] $($cmds[$n]) running. Do the demo by hand (scope in MUST-RECORD.md), close the app, then press Enter here."; Read-Host | Out-Null
  [System.Windows.Forms.SendKeys]::SendWait("q"); Start-Sleep 1; if (!$p.HasExited) { Stop-Process $p.Id }
}

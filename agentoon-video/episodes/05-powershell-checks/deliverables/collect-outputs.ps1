<#
 Agentoon.ai - collects the REAL output of the three read-only checks for the video.
 It only READS. It does not change DNS, encryption, updates, or any setting.
 Run in Windows PowerShell or PowerShell 7 (open as Administrator so BitLocker can answer).
   .\collect-outputs.ps1            # raw output
   .\collect-outputs.ps1 -Mask      # hides the last IPv4 octet / shortens IPv6 (recommended if you do not want to show real addresses)
 Result: .\agentoon-outputs\{dns,bitlocker,hotfix}.txt  (send/upload these three files)
#>
param([switch]$Mask)
$ErrorActionPreference = 'Stop'
$dir = Join-Path $PSScriptRoot 'agentoon-outputs'; New-Item -ItemType Directory -Force $dir | Out-Null
function Save($name, [scriptblock]$cmd, [switch]$maskIps) {
  try { $t = (& $cmd | Format-Table -AutoSize | Out-String -Width 200).TrimEnd() }
  catch { $t = "ERROR: " + $_.Exception.Message }
  if ($maskIps -and $Mask) {
    $t = [regex]::Replace($t, '\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b', '$1.x')
    $t = [regex]::Replace($t, '\b([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{0,4}){2,7})\b', { param($m) ($m.Value.Split(':')[0..1] -join ':') + '::x' })
  }
  Set-Content -Path (Join-Path $dir "$name.txt") -Value $t -Encoding UTF8
  Write-Host "saved $name.txt"
}
Save 'dns'       { Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object InterfaceAlias,ServerAddresses } -maskIps
Save 'bitlocker' { Get-BitLockerVolume | Select-Object MountPoint,ProtectionStatus,VolumeStatus }
Save 'hotfix'    { Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10 HotFixID,Description,InstalledOn }
Write-Host "`nDone. Review the three files before sharing (remove anything you do not want public)."

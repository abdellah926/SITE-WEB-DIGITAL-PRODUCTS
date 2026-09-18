param(
  [string]$SourceDir = "C:\Users\abdou\Downloads",
  [string]$OutDir = "$PSScriptRoot\..\public\img\shop"
)
Add-Type -AssemblyName System.Drawing
$map = @(
  @{ Src = "BY SCYRUS 1.png"; Out = "by-cyrus-1" },
  @{ Src = "BY CYRUSE 2.jpg"; Out = "by-cyrus-2" },
  @{ Src = "BY CRYCUS 3.png"; Out = "by-cyrus-3" },
  @{ Src = "BY CYRUSE4.png";  Out = "by-cyrus-4" },
  @{ Src = "BY CYRUS5.png";   Out = "by-cyrus-5" },
  @{ Src = "CYRUS6.png";      Out = "by-cyrus-6" }
)
if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)
foreach ($m in $map) {
  $srcPath = Join-Path $SourceDir $m.Src
  if (-not (Test-Path -LiteralPath $srcPath)) { Write-Output "SKIP $($m.Src)"; continue }
  $img = [System.Drawing.Image]::FromFile($srcPath)
  $w = $img.Width; $h = $img.Height
  $target = 1400
  $scale = if ($w -gt $h) { $target / $w } else { $target / $h }
  if ($scale -gt 1) { $scale = 1 }
  $nw = [Math]::Max(1, [Math]::Round($w * $scale)); $nh = [Math]::Max(1, [Math]::Round($h * $scale))
  $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $nw, $nh)
  $out = Join-Path $OutDir ($m.Out + ".jpg")
  $bmp.Save($out, $enc, $ep)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  "$($m.Out): $($m.Src) -> $($nw)x$($nh) -> $((Get-Item -LiteralPath $out).Length) bytes"
}
Write-Output "DONE"
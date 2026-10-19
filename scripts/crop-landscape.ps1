Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\public\enterprise-journey-landscape.jpg"
$destPath = Join-Path $PSScriptRoot "..\public\journey-world-landscape.jpg"

$src = [System.Drawing.Bitmap]::new($srcPath)
$rect = [System.Drawing.Rectangle]::new(260, 0, 764, 576)
$dest = $src.Clone($rect, $src.PixelFormat)
$dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$src.Dispose()
$dest.Dispose()

Write-Host "Landscape cropped: 764x576 saved to journey-world-landscape.jpg"

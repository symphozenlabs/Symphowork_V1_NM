$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\Users\nares\.gemini\antigravity-ide\brain\b6fad419-776e-4706-93b5-c8c9a5e8157b"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir
}

$viewports = @(
    @{ Name = "desktop_1440px"; Width = 1440; Height = 950 },
    @{ Name = "laptop_1280px";  Width = 1280; Height = 850 },
    @{ Name = "tablet_768px";   Width = 768;  Height = 1024 },
    @{ Name = "mobile_390px";   Width = 390;  Height = 844 }
)

foreach ($vp in $viewports) {
    $outFile = Join-Path $outDir "$($vp.Name).png"
    Write-Host "Capturing $($vp.Name) ($($vp.Width)x$($vp.Height))..."
    Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--hide-scrollbars", "--window-size=$($vp.Width),$($vp.Height)", "--screenshot=`"$outFile`"", "http://localhost:3000" -Wait
    Start-Sleep -Milliseconds 500
}

Write-Host "All viewports captured successfully."

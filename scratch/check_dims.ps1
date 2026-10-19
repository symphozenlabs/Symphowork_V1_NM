Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\nares\.gemini\antigravity-ide\brain\b6fad419-776e-4706-93b5-c8c9a5e8157b"
Get-ChildItem -Path $dir -Filter "*px.png" | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Host "$($_.Name): $($img.Width) x $($img.Height)"
    $img.Dispose()
}

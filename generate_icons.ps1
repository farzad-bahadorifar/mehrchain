Add-Type -AssemblyName System.Drawing

$projectRoot = "d:\projects\mehrchain"
$meroPath = Join-Path $projectRoot "apps\mehrchain-frontend\public\assets\mero.png"

if (-not (Test-Path $meroPath)) {
    Write-Error "Mero image not found at $meroPath"
    exit 1
}

$meroImg = [System.Drawing.Image]::FromFile($meroPath)

function Create-BackgroundBitmap ([int]$width, [int]$height) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Rich, smooth dark teal to midnight navy gradient (diagonal)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $colorTop = [System.Drawing.ColorTranslator]::FromHtml("#0F5668")    # Lush Ocean Teal
    $colorBottom = [System.Drawing.ColorTranslator]::FromHtml("#061720") # Midnight Navy
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $colorTop, $colorBottom, 45.0)
    
    # Custom blend for buttery smooth gradient
    $cb = New-Object System.Drawing.Drawing2D.ColorBlend(3)
    $cb.Colors = @(
        [System.Drawing.ColorTranslator]::FromHtml("#116477"),
        [System.Drawing.ColorTranslator]::FromHtml("#0B3E4D"),
        [System.Drawing.ColorTranslator]::FromHtml("#05161F")
    )
    $cb.Positions = @(0.0, 0.5, 1.0)
    $brush.InterpolationColors = $cb

    $g.FillRectangle($brush, $rect)
    $brush.Dispose()

    # Soft ambient central warm glow matching Mero's glowing tummy
    $glowLayers = @(
        @{ RectScale = 0.85; Alpha = 15; Color = "#FDE68A" }, # Amber warmth
        @{ RectScale = 0.65; Alpha = 25; Color = "#2DD4BF" }, # Teal glow
        @{ RectScale = 0.45; Alpha = 35; Color = "#5EEAD4" }  # Inner brightness
    )

    foreach ($layer in $glowLayers) {
        $lw = [int]($width * $layer.RectScale)
        $lh = [int]($height * $layer.RectScale)
        $lx = [int](($width - $lw) / 2)
        $ly = [int](($height - $lh) / 2) + [int]($height * 0.02)
        $lRect = New-Object System.Drawing.Rectangle($lx, $ly, $lw, $lh)
        
        $baseC = [System.Drawing.ColorTranslator]::FromHtml($layer.Color)
        $gBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $lRect,
            [System.Drawing.Color]::FromArgb($layer.Alpha, $baseC.R, $baseC.G, $baseC.B),
            [System.Drawing.Color]::FromArgb(0, $baseC.R, $baseC.G, $baseC.B),
            90.0
        )
        $g.FillEllipse($gBrush, $lRect)
        $gBrush.Dispose()
    }

    $g.Dispose()
    return $bmp
}

function Create-ForegroundBitmap ([int]$size, [System.Drawing.Image]$mascot, [bool]$withShadow = $true) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 72% Safe-Area sizing to ensure it fills nicely and never gets cropped
    $targetH = [int]($size * 0.72)
    $aspect = $mascot.Width / $mascot.Height
    $targetW = [int]($targetH * $aspect)

    $x = [int](($size - $targetW) / 2)
    $y = [int](($size - $targetH) / 2)

    if ($withShadow) {
        # Multi-layered soft ambient drop shadow for a 3D levitation aesthetic
        $shadowLevels = @(
            @{ WScale = 0.78; HScale = 0.18; YOff = 0.88; Alpha = 35 },
            @{ WScale = 0.65; HScale = 0.13; YOff = 0.89; Alpha = 50 },
            @{ WScale = 0.48; HScale = 0.08; YOff = 0.90; Alpha = 70 }
        )
        foreach ($sl in $shadowLevels) {
            $sw = [int]($targetW * $sl.WScale)
            $sh = [int]($targetH * $sl.HScale)
            $sx = [int]($x + ($targetW - $sw) / 2)
            $sy = [int]($y + $targetH * $sl.YOff)
            $sRect = New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)
            $sBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($sl.Alpha, 0, 0, 0))
            $g.FillEllipse($sBrush, $sRect)
            $sBrush.Dispose()
        }
    }

    $destRect = New-Object System.Drawing.Rectangle($x, $y, $targetW, $targetH)
    $g.DrawImage($mascot, $destRect, 0, 0, $mascot.Width, $mascot.Height, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    return $bmp
}

function Create-CompositeIcon ([int]$size, [System.Drawing.Image]$mascot, [bool]$rounded = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($rounded) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $size, $size)
        $g.SetClip($path)
    }

    $bg = Create-BackgroundBitmap $size $size
    $g.DrawImage($bg, 0, 0, $size, $size)
    $bg.Dispose()

    $fg = Create-ForegroundBitmap $size $mascot $true
    $g.DrawImage($fg, 0, 0, $size, $size)
    $fg.Dispose()

    $g.Dispose()
    return $bmp
}

$assetsDir = Join-Path $projectRoot "assets"
if (-not (Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null }

Write-Host "Generating Master Assets..."
$masterIcon = Create-CompositeIcon 1024 $meroImg $false
$masterIcon.Save((Join-Path $assetsDir "icon-only.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$masterIcon.Save((Join-Path $assetsDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$masterIcon.Dispose()

$masterBg = Create-BackgroundBitmap 1024 1024
$masterBg.Save((Join-Path $assetsDir "icon-background.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$masterBg.Dispose()

$masterFg = Create-ForegroundBitmap 1024 $meroImg $true
$masterFg.Save((Join-Path $assetsDir "icon-foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$masterFg.Dispose()

Write-Host "Generating Android Mipmaps..."
$resDir = Join-Path $projectRoot "android\app\src\main\res"

$androidSizes = @(
    @{ Name = "mipmap-mdpi"; LegacySize = 48; FgSize = 108 },
    @{ Name = "mipmap-hdpi"; LegacySize = 72; FgSize = 162 },
    @{ Name = "mipmap-xhdpi"; LegacySize = 96; FgSize = 216 },
    @{ Name = "mipmap-xxhdpi"; LegacySize = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LegacySize = 192; FgSize = 432 }
)

foreach ($entry in $androidSizes) {
    $dir = Join-Path $resDir $entry.Name
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    $icon = Create-CompositeIcon $entry.LegacySize $meroImg $false
    $icon.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()

    $roundIcon = Create-CompositeIcon $entry.LegacySize $meroImg $true
    $roundIcon.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $roundIcon.Dispose()

    $fg = Create-ForegroundBitmap $entry.FgSize $meroImg $true
    $fg.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()
    
    Write-Host "Generated $($entry.Name)"
}

Write-Host "Generating Frontend PWA Icons..."
$pwaDir = Join-Path $projectRoot "apps\mehrchain-frontend\public\icons"
$pwaSizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($sz in $pwaSizes) {
    $pwaIcon = Create-CompositeIcon $sz $meroImg $false
    $pwaIcon.Save((Join-Path $pwaDir "icon-${sz}x${sz}.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $pwaIcon.Dispose()
    Write-Host "Generated PWA icon-${sz}x${sz}.png"
}

$favIcon = Create-CompositeIcon 64 $meroImg $false
$favIcon.Save((Join-Path $projectRoot "apps\mehrchain-frontend\public\favicon.ico"), [System.Drawing.Imaging.ImageFormat]::Icon)
$favIcon.Dispose()

$meroImg.Dispose()
Write-Host "SUCCESS: Master & Android icons refined perfectly!"

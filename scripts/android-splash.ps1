param([switch]$Verify)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$resources = Join-Path $root 'android/app/src/main/res'
$source = [Drawing.Bitmap]::FromFile((Join-Path $root 'apps/mehrchain-frontend/public/assets/mero.png'))
$theme = Get-Content (Join-Path $root 'apps/mehrchain-frontend/src/styles.css') -Raw
$background = [Drawing.ColorTranslator]::FromHtml([regex]::Match($theme, '--color-background:\s*(#[0-9a-f]{6})').Groups[1].Value)
$portrait = @{
    mdpi = @(320, 480, 1)
    hdpi = @(480, 800, 1.5)
    xhdpi = @(720, 1280, 2)
    xxhdpi = @(960, 1600, 3)
    xxxhdpi = @(1280, 1920, 4)
}
try {
    $bounds = [Drawing.Rectangle]::new(120, 196, 460, 382)
    foreach ($density in $portrait.Keys) {
        $width, $height, $scale = $portrait[$density]
        $variants = @(
            @{ Path = "drawable-port-$density/splash.png"; Width = $width; Height = $height },
            @{ Path = "drawable-land-$density/splash.png"; Width = $height; Height = $width }
        )
        if ($density -eq 'mdpi') {
            $variants += @{ Path = 'drawable/splash.png'; Width = $height; Height = $width }
        }
        foreach ($variant in $variants) {
            $path = Join-Path $resources $variant.Path
            $logoWidth = [int](104 * $scale)
            $logoHeight = [int]($logoWidth * $bounds.Height / $bounds.Width)
            $left = [int](($variant.Width - $logoWidth) / 2)
            $top = [int](($variant.Height - $logoHeight) / 2)
            $expected = [Drawing.Bitmap]::new($variant.Width, $variant.Height)
            try {
                $graphics = [Drawing.Graphics]::FromImage($expected)
                try {
                    $graphics.Clear($background)
                    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                    $destination = [Drawing.Rectangle]::new($left, $top, $logoWidth, $logoHeight)
                    $graphics.DrawImage($source, $destination, $bounds, [Drawing.GraphicsUnit]::Pixel)
                } finally { $graphics.Dispose() }
                $buffer = [IO.MemoryStream]::new()
                try {
                    $expected.Save($buffer, [Drawing.Imaging.ImageFormat]::Png)
                    $bytes = $buffer.ToArray()
                    if ($Verify) {
                        $actual = [IO.File]::ReadAllBytes($path)
                        if ([Convert]::ToBase64String($actual) -ne [Convert]::ToBase64String($bytes)) {
                            throw "Unexpected pixels or dimensions: $($variant.Path)"
                        }
                    } else { [IO.File]::WriteAllBytes($path, $bytes) }
                } finally { $buffer.Dispose() }
                Write-Output "$($variant.Path) $($variant.Width)x$($variant.Height); Mero ${logoWidth}x${logoHeight}"
            } finally { $expected.Dispose() }
        }
    }
} finally { $source.Dispose() }

# =========================================================================
# Family TV Games Server (PowerShell web server)
# =========================================================================

$port = 8080

# Get local IPv4 address
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" 
}

if ($ipAddresses.Count -eq 0) {
    Write-Host "Error: No Wi-Fi or Ethernet connection found." -ForegroundColor Red
    Exit
}

$localIP = $ipAddresses[0].IPAddress

# Start simple HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://$($localIP):$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Error: Failed to start server on port $port. Attempting port 8081..." -ForegroundColor Yellow
    $port = 8081
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Prefixes.Add("http://$($localIP):$port/")
    try {
        $listener.Start()
    } catch {
        Write-Host "Error: Failed to start server on port $port." -ForegroundColor Red
        Exit
    }
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Family TV Games Server started successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To play the game on your Smart TV or Phone:"
Write-Host "1. Connect your Smart TV or Phone to the SAME Wi-Fi network."
Write-Host "2. Open the web browser on the TV/Phone and go to:"
Write-Host ""
Write-Host "      http://$($localIP):$($port)/" -ForegroundColor Cyan -BackgroundColor Black
Write-Host ""
Write-Host "=========================================================="
Write-Host "Press [Ctrl + C] in this window to stop the server." -ForegroundColor Yellow

$buffer = New-Object Byte[] 64kb

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $filePath = Join-Path $PSScriptRoot $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 - Not Found</h1>")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Ignore disconnects
    }
}

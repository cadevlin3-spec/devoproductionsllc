# Local preview (Windows). Mirrors Cloudflare Pages: /services -> services.html, unknown -> 404.html
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8123/")
$listener.Start()
Write-Host "Serving $root at http://localhost:8123  (Ctrl+C to stop)"
$mime = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png"; ".svg"="image/svg+xml" }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrEmpty($rel)) { $rel = "index.html" }
  $path = Join-Path $root $rel
  if (-not (Test-Path $path -PathType Leaf) -and (Test-Path "$path.html" -PathType Leaf)) { $path = "$path.html" }
  if (-not (Test-Path $path -PathType Leaf)) { $path = Join-Path $root "404.html"; $ctx.Response.StatusCode = 404 }
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $ext = [System.IO.Path]::GetExtension($path).ToLower()
  if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}

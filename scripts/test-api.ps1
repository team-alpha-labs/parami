# Parami API smoke test (Postman 대체)
# 사용: .env.local 채우고 npm run dev 띄운 뒤 실행
#   pwsh scripts/test-api.ps1

$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = "test_$(Get-Random -Maximum 99999)@a.com"
$pwd = '1234'

function Step($name, $block) {
  Write-Host "`n=== $name ===" -ForegroundColor Cyan
  try {
    $r = & $block
    Write-Host "OK" -ForegroundColor Green
    if ($r) { $r | ConvertTo-Json -Depth 5 -Compress }
  } catch {
    $msg = $_.Exception.Message
    $body = ''
    if ($_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      if ($stream) { $body = (New-Object IO.StreamReader $stream).ReadToEnd() }
    }
    Write-Host "FAIL: $msg" -ForegroundColor Red
    if ($body) { Write-Host $body -ForegroundColor DarkRed }
  }
}

Step 'signup' { Invoke-RestMethod -Uri "$base/api/auth/signup" -Method POST -WebSession $session `
  -ContentType 'application/json' -Body (@{ email=$email; password=$pwd; name='테스트' } | ConvertTo-Json) }

Step 'login' { Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -WebSession $session `
  -ContentType 'application/json' -Body (@{ email=$email; password=$pwd } | ConvertTo-Json) }

Step 'me' { Invoke-RestMethod -Uri "$base/api/auth/me" -WebSession $session }

Step 'plans' { Invoke-RestMethod -Uri "$base/api/plans" -WebSession $session }

Step 'subscriptions/me (구독 전)' { Invoke-RestMethod -Uri "$base/api/subscriptions/me" -WebSession $session }

Step 'payments/me (결제 전)' { Invoke-RestMethod -Uri "$base/api/payments/me" -WebSession $session }

# payments/confirm은 토스 paymentKey 필요해서 skip
Write-Host "`n=== payments/confirm: 토스 위젯에서 받은 paymentKey 필요해 스킵 ===" -ForegroundColor Yellow

Step 'admin/users (일반유저는 403 기대)' { Invoke-RestMethod -Uri "$base/api/admin/users" -WebSession $session }

Step 'logout' { Invoke-RestMethod -Uri "$base/api/auth/logout" -Method POST -WebSession $session }

Step 'me (로그아웃 후 401 기대)' { Invoke-RestMethod -Uri "$base/api/auth/me" -WebSession $session }

Write-Host "`n완료. admin 라우트 검증: DB에서 UPDATE users SET role='admin' WHERE email='$email' 후 재로그인 후 다시 실행." -ForegroundColor Cyan

param(
    [string]$Pertanyaan = "Berapa harga daging ayam di pasar minggu kota metro?"
)

$body = @{ text = $Pertanyaan } | ConvertTo-Json
$response = Invoke-RestMethod -Method Post -Uri "https://api.sigerpangan.my.id/api/v1/chatbot/chat" -ContentType "application/json" -Body $body

Write-Host "=============================" -ForegroundColor Cyan
Write-Host "🤖 Pertanyaan : $Pertanyaan" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "Jawaban Bot   :`n" -ForegroundColor Green
Write-Host $response.response -ForegroundColor White

Write-Host "`n---[ DEBUGGER INTENT NLP ]---" -ForegroundColor DarkGray
$response.nlpContext | Format-List | Out-String | Write-Host -ForegroundColor DarkGray

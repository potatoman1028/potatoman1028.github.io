# POTATO'S LAB 개발 환경 초기화 스크립트
$nodePath = "C:\Program Files\nodejs\"
if ($env:Path -notlike "*$nodePath*") {
    $env:Path += ";$nodePath"
    Write-Host "✅ Node.js 경로가 현재 세션 PATH에 추가되었습니다." -ForegroundColor Green
}
Write-Host "🚀 준비 완료! 'npm run dev'를 실행해 보세요." -ForegroundColor Cyan

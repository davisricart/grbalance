Write-Host "Quick System Health Check..." -ForegroundColor Cyan

# Count Node processes
$nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "Node.js processes: $nodeCount" -ForegroundColor $(if ($nodeCount -gt 10) {"Red"} elseif ($nodeCount -gt 5) {"Yellow"} else {"Green"})

# Count dev server ports
$portCount = (netstat -an | Select-String ":51\d\d.*LISTENING" | Measure-Object).Count
Write-Host "Dev server ports: $portCount" -ForegroundColor $(if ($portCount -gt 3) {"Red"} elseif ($portCount -gt 1) {"Yellow"} else {"Green"})

# Health assessment
if ($nodeCount -gt 10 -or $portCount -gt 3) {
    Write-Host ""
    Write-Host "SYSTEM CLEANUP RECOMMENDED" -ForegroundColor Red
    Write-Host "Run: .\system-cleanup.ps1" -ForegroundColor Yellow
} elseif ($nodeCount -gt 5 -or $portCount -gt 1) {
    Write-Host ""
    Write-Host "System OK but monitor for performance" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "System health excellent - ready for development" -ForegroundColor Green
}

Write-Host ""
Write-Host "Current dev server: http://localhost:5177/" -ForegroundColor Cyan 
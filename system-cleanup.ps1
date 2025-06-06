Write-Host "🧹 GRBalance System Cleanup Starting..." -ForegroundColor Green

# Step 1: Check current Node processes
Write-Host "`n📊 Current Node.js processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes consuming memory" -ForegroundColor Red
    $nodeProcesses | Format-Table Id, ProcessName, @{Name="Memory(MB)"; Expression={[math]::Round($_.WorkingSet/1MB,2)}}
} else {
    Write-Host "✅ No Node.js processes found" -ForegroundColor Green
}

# Step 2: Check occupied ports
Write-Host "`n🔌 Checking development ports (5177-5191):" -ForegroundColor Yellow
$occupiedPorts = netstat -an | Select-String ":51\d\d.*LISTENING"
if ($occupiedPorts) {
    Write-Host "Found $($occupiedPorts.Count) occupied development ports:" -ForegroundColor Red
    $occupiedPorts | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "✅ No development ports occupied" -ForegroundColor Green
}

# Step 3: Kill Node processes if any exist
if ($nodeProcesses) {
    Write-Host "`n🚨 Killing all Node.js processes..." -ForegroundColor Red
    taskkill /F /IM node.exe 2>$null
    Write-Host "✅ All Node.js processes terminated" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "`n✅ No cleanup needed - system is clean" -ForegroundColor Green
}

# Step 4: Start fresh dev server
Write-Host "`n🚀 Starting fresh development server..." -ForegroundColor Green
Write-Host "Navigate to: http://localhost:5177/" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in the terminal to stop the server when done" -ForegroundColor Yellow

# Run the dev server
npm run dev 
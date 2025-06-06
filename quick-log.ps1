# Enhanced Session Logger for GRBalance (PowerShell Version)
# Usage: .\quick-log.ps1 -Action "update" -Description "Fixed bug XYZ"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "update", "complete", "error")]
    [string]$Action,
    
    [Parameter(Mandatory=$true)]
    [string]$Description,
    
    [Parameter(Mandatory=$false)]
    [string]$Context = ""
)

# Configuration
$LogFile = "SESSION_ENHANCED_LOG.md"
$TimeZone = "Eastern Standard Time"

# Get current timestamp
function Get-CurrentTimestamp {
    return (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss-05:00")
}

# Gather system state
function Get-SystemState {
    $timestamp = Get-CurrentTimestamp
    
    # Git status
    $gitBranch = try { git branch --show-current 2>$null } catch { "Unknown" }
    $gitStatus = try { git status --porcelain 2>$null } catch { "No git info" }
    $lastCommit = try { git log -1 --oneline 2>$null } catch { "No commits" }
    
    # File system
    $adminPageLines = try { (Get-Content "src\pages\AdminPage.tsx" | Measure-Object -Line).Lines } catch { "File not found" }
    $sampleDataCount = try { (Get-ChildItem "public\sample-data" | Measure-Object).Count } catch { 0 }
    
    # Node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
    
    # Port status
    $port5177 = try { Get-NetTCPConnection -LocalPort 5177 -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count } catch { 0 }
    $port5178 = try { Get-NetTCPConnection -LocalPort 5178 -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count } catch { 0 }
    
    return @{
        Timestamp = $timestamp
        Git = @{
            Branch = $gitBranch
            Status = $gitStatus
            LastCommit = $lastCommit
        }
        FileSystem = @{
            AdminPageLines = $adminPageLines
            SampleDataCount = $sampleDataCount
        }
        Environment = @{
            NodeProcesses = $nodeProcesses
            Port5177 = if ($port5177 -gt 0) { "OCCUPIED" } else { "FREE" }
            Port5178 = if ($port5178 -gt 0) { "OCCUPIED" } else { "FREE" }
        }
    }
}

# Create session entry
function New-SessionEntry {
    param($SessionNumber, $Action, $Description, $Context, $State)
    
    $statusEmoji = switch ($Action) {
        "start" { "🟢" }
        "complete" { "✅" }
        "error" { "🔴" }
        default { "🟡" }
    }
    
    $entry = @"

### Session #$($SessionNumber.ToString("00")) | $($State.Timestamp)
**Duration**: $(if ($Action -eq "complete") { "Completed" } else { "Active" })  
**Status**: $statusEmoji $($Action.ToUpper())  
**Trigger**: $Description  
**Context**: $(if ($Context) { $Context } else { "Continuing development work" })

**Detailed Technical State**:
``````
✅ Timestamp: $($State.Timestamp)
✅ Git Branch: $($State.Git.Branch)
✅ Git Status: $(if ($State.Git.Status) { $State.Git.Status } else { "Clean working directory" })
✅ Last Commit: $($State.Git.LastCommit)
✅ AdminPage.tsx: $($State.FileSystem.AdminPageLines) lines
✅ Sample Files: $($State.FileSystem.SampleDataCount) files in public/sample-data/
✅ Node Processes: $($State.Environment.NodeProcesses) running
✅ Port 5177: $($State.Environment.Port5177)
✅ Port 5178: $($State.Environment.Port5178)
``````

**Conversation Context**:
- Action: $Action
- Description: $Description
- Session State: $(switch ($Action) { 
    "start" { "Session initiated" }
    "complete" { "Session completed successfully" } 
    default { "Session in progress" }
})

**Recovery Instructions If Session Resets**:
``````bash
cd C:\Users\Davis\Documents\grbalance
npm run dev
# System should be in state: $(if ($Action -eq "complete") { "Ready for new work" } else { "Continue current task" })
# Last action: $Description
``````

---
"@
    
    return $entry
}

# Main execution
try {
    if (-not (Test-Path $LogFile)) {
        Write-Error "Error: $LogFile not found. Please ensure it exists."
        exit 1
    }
    
    # Read current log content
    $logContent = Get-Content $LogFile -Raw
    
    # Gather system state
    $systemState = Get-SystemState
    
    # Count existing sessions
    $sessionMatches = ([regex]"### Session #\d+").Matches($logContent)
    $nextSessionNumber = $sessionMatches.Count + 1
    
    # Create new session entry
    $newEntry = New-SessionEntry -SessionNumber $nextSessionNumber -Action $Action -Description $Description -Context $Context -State $systemState
    
    # Update current session status
    $currentStatusPattern = "(## 🎯 CURRENT SESSION STATUS\n)([\s\S]*?)(\n---)"
    $newStatus = @"
## 🎯 CURRENT SESSION STATUS
**Status**: $(if ($Action -eq "complete") { "✅ **COMPLETED**" } else { "🟢 **ACTIVE**" }) - $Description
**Timestamp**: $($systemState.Timestamp)
**Context**: $(if ($Context) { $Context } else { "Development session in progress" })
**Location**: $(if ($Action -eq "complete") { "Task completed successfully" } else { "Active development" })
**Next Action**: $(if ($Action -eq "complete") { "Ready for new tasks" } else { "Continue current work" })

---
"@
    
    $logContent = $logContent -replace $currentStatusPattern, $newStatus
    
    # Insert new session entry
    $sessionHistoryPattern = "## 📝 DETAILED SESSION HISTORY\n\n"
    $insertIndex = $logContent.IndexOf($sessionHistoryPattern) + $sessionHistoryPattern.Length
    $logContent = $logContent.Insert($insertIndex, $newEntry)
    
    # Write updated content
    Set-Content -Path $LogFile -Value $logContent -Encoding UTF8
    
    Write-Host "✅ Session log updated successfully!" -ForegroundColor Green
    Write-Host "📝 Action: $Action" -ForegroundColor Cyan
    Write-Host "📝 Description: $Description" -ForegroundColor Cyan
    Write-Host "📝 Timestamp: $($systemState.Timestamp)" -ForegroundColor Cyan
    Write-Host "📝 Session #$nextSessionNumber logged" -ForegroundColor Cyan
    
} catch {
    Write-Error "Failed to update session log: $($_.Exception.Message)"
    exit 1
} 
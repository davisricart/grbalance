@echo off
REM Quick deploy script - commits and pushes any changes

REM Start SSH agent and add key
for /f "tokens=*" %%i in ('ssh-agent -s') do set %%i
ssh-add C:\Users\davis\.ssh\grbalance_key > nul 2>&1

REM Add all changes
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% neq 0 (
    REM Commit with timestamp
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YYYY=%dt:~0,4%"
    set "MM=%dt:~4,2%"
    set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%"
    set "Min=%dt:~10,2%"
    set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%"

    git commit -m "Auto-deploy: %timestamp% - Generated with Claude Code"

    echo Deploying changes to https://grbalance.com...
    git push origin main

    if %errorlevel% equ 0 (
        echo.
        echo ✓ Deployment successful!
        echo   Changes will be live in 2-3 minutes at https://grbalance.com
    ) else (
        echo.
        echo ✗ Deployment failed!
    )
) else (
    echo No changes to deploy.
)
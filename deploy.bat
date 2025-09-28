@echo off
echo Starting deployment process...

REM Start SSH agent and add key
for /f "tokens=*" %%i in ('ssh-agent -s') do set %%i
ssh-add C:\Users\davis\.ssh\grbalance_key

REM Check git status
echo.
echo === Git Status ===
git status

REM Add any changes
echo.
echo === Adding changes ===
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% neq 0 (
    echo.
    set /p commit_msg="Enter commit message: "
    git commit -m "!commit_msg! - Generated with Claude Code"

    echo.
    echo === Pushing to GitHub ===
    git push origin main

    echo.
    echo === Deployment complete! ===
    echo Changes will be live at https://grbalance.com in 2-3 minutes
) else (
    echo.
    echo No changes to commit.
)

echo.
pause
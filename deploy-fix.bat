@echo off
echo Committing client portal fix...
git add src/pages/ClientPortalPage.tsx
git commit -m "Fix client portal authentication for active clients"
git push
echo Fix deployed!
pause
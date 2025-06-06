#!/bin/bash
# setup-and-fix.sh - Complete setup and troubleshooting script

echo "🚀 Setting up and fixing the workflow system"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from your project root."
    exit 1
fi

print_info "Step 1: Creating necessary directories"
mkdir -p public/claude-communication
mkdir -p logs
print_status "Directories created"

print_info "Step 2: Setting directory permissions"
chmod 755 public/claude-communication
chmod 755 logs
print_status "Permissions set"

print_info "Step 3: Installing dependencies"
npm install chokidar
print_status "Dependencies installed"

print_info "Step 4: Stopping existing PM2 processes"
pm2 stop all
pm2 delete all
print_status "PM2 processes stopped"

print_info "Step 5: Starting processes with PM2"
pm2 start ecosystem.config.js
print_status "PM2 processes started"

print_info "Step 6: Saving PM2 configuration"
pm2 save
print_status "PM2 configuration saved"

print_info "Step 7: Running diagnostic test"
node diagnostic-test.js

print_info "Step 8: Checking PM2 status"
pm2 status

print_info "Step 9: Showing recent logs"
echo
print_info "Backend logs:"
pm2 logs backend-server --lines 10 --nostream

echo
print_info "Watcher logs:"
pm2 logs file-watcher --lines 10 --nostream

echo
print_status "Setup complete!"
echo
print_info "Next steps:"
echo "1. Check PM2 status: pm2 status"
echo "2. Monitor logs: pm2 logs"
echo "3. Test your frontend at http://localhost:5178"
echo "4. Check backend at http://localhost:3001"
echo
print_info "If issues persist, check the enhanced logs above for details."
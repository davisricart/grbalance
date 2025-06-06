#!/bin/bash

# GRBalance Process Cleanup Script
# Safely terminates zombie Node.js processes and cleans up resources

echo "🧹 GRBalance Process Cleanup Starting..."

# Function to check and kill processes by port
cleanup_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "🔌 Killing process on port $port (PID: $pid)"
        kill -TERM $pid 2>/dev/null
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            echo "⚠️  Force killing process on port $port"
            kill -KILL $pid 2>/dev/null
        fi
        echo "✅ Port $port cleaned"
    fi
}

# Function to cleanup PM2 processes
cleanup_pm2() {
    echo "🔄 Checking PM2 processes..."
    if command -v pm2 &> /dev/null; then
        pm2 list | grep -q "online" && {
            echo "🛑 Stopping PM2 processes..."
            pm2 stop all
            pm2 delete all
            echo "✅ PM2 processes cleaned"
        } || echo "✅ No PM2 processes running"
    else
        echo "ℹ️  PM2 not found"
    fi
}

# Function to cleanup orphaned Node processes
cleanup_node_processes() {
    echo "🔍 Checking for zombie Node.js processes..."
    local node_pids=$(pgrep -f "node.*vite|node.*server\.cjs|node.*watcher" | head -20)
    if [ ! -z "$node_pids" ]; then
        echo "🚨 Found potential zombie processes:"
        echo "$node_pids" | xargs ps -p
        echo "🛑 Terminating processes..."
        echo "$node_pids" | xargs kill -TERM 2>/dev/null
        sleep 3
        # Force kill if still running
        echo "$node_pids" | xargs kill -KILL 2>/dev/null
        echo "✅ Node processes cleaned"
    else
        echo "✅ No zombie Node processes found"
    fi
}

# Function to cleanup log files
cleanup_logs() {
    echo "📄 Cleaning up large log files..."
    find . -name "*.log" -size +10M -exec sh -c 'echo "🗑️  Truncating large log: $1"; > "$1"' _ {} \;
    find ~/.pm2/logs -name "*.log" -size +10M 2>/dev/null -exec sh -c 'echo "🗑️  Truncating PM2 log: $1"; > "$1"' _ {} \; || true
    echo "✅ Log cleanup complete"
}

# Main cleanup sequence
echo "🚀 Starting comprehensive cleanup..."

# 1. Stop PM2 processes first
cleanup_pm2

# 2. Clean up specific ports
echo "🔌 Cleaning up development ports..."
for port in 3001 5177 5178 5179; do
    cleanup_port $port
done

# 3. Clean up zombie Node processes
cleanup_node_processes

# 4. Clean up log files
cleanup_logs

# 5. Final verification
echo "🔍 Final verification..."
active_node=$(pgrep -f "node" | wc -l)
active_ports=$(lsof -i :5177,:5178,:5179,:3001 2>/dev/null | wc -l)

echo "📊 Cleanup Summary:"
echo "   Node processes: $active_node"
echo "   Active dev ports: $active_ports"

if [ $active_node -gt 1 ] || [ $active_ports -gt 0 ]; then
    echo "⚠️  Some processes may still be running"
    echo "🔍 Active processes:"
    ps aux | grep -E "(node|npm|vite)" | grep -v grep | head -5
else
    echo "✅ System is clean and ready for development"
fi

echo ""
echo "🎯 To start fresh development:"
echo "   npm run dev"
echo ""
echo "🧹 Cleanup complete!"
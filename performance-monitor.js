/**
 * Performance Monitoring Script for GR Balance Testing
 * Include this in your test pages to monitor performance during testing
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
        this.startTime = performance.now();
        this.isMonitoring = false;
        
        this.init();
    }

    init() {
        // Initialize performance observers
        this.setupPerformanceObservers();
        
        // Track page load performance
        this.trackPageLoad();
        
        // Monitor memory usage
        this.monitorMemory();
        
        // Track user interactions
        this.trackUserInteractions();
        
        console.log('🔍 Performance Monitor initialized');
    }

    setupPerformanceObservers() {
        if ('PerformanceObserver' in window) {
            // Monitor navigation timing
            const navObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'navigation') {
                        this.metrics.navigation = {
                            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                            loadComplete: entry.loadEventEnd - entry.loadEventStart,
                            domInteractive: entry.domInteractive - entry.fetchStart,
                            firstPaint: entry.domContentLoadedEventEnd - entry.fetchStart
                        };
                    }
                });
            });
            
            try {
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navObserver);
            } catch (e) {
                console.warn('Navigation observer not supported');
            }

            // Monitor resource loading
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 1000) { // Log slow resources (>1s)
                        console.warn(`⚠️ Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (e) {
                console.warn('Resource observer not supported');
            }

            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
                    this.metrics.longTasks = this.metrics.longTasks || [];
                    this.metrics.longTasks.push({
                        duration: entry.duration,
                        startTime: entry.startTime,
                        timestamp: new Date().toISOString()
                    });
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longTaskObserver);
            } catch (e) {
                console.warn('Long task observer not supported');
            }
        }
    }

    trackPageLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.metrics.domContentLoaded = performance.now() - this.startTime;
                console.log(`📄 DOM Content Loaded: ${this.metrics.domContentLoaded.toFixed(2)}ms`);
            });
        }

        window.addEventListener('load', () => {
            this.metrics.pageLoad = performance.now() - this.startTime;
            console.log(`🏁 Page Load Complete: ${this.metrics.pageLoad.toFixed(2)}ms`);
        });
    }

    monitorMemory() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memory = {
                    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
                    timestamp: new Date().toISOString()
                };
                
                // Warn if memory usage is high
                const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                if (usagePercent > 80) {
                    console.warn(`🚨 High memory usage: ${usagePercent.toFixed(1)}% (${this.metrics.memory.used}MB)`);
                }
            }, 5000); // Check every 5 seconds
        }
    }

    trackUserInteractions() {
        const interactionTypes = ['click', 'input', 'change', 'submit'];
        
        interactionTypes.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                const startTime = performance.now();
                
                // Track time to next paint after interaction
                requestAnimationFrame(() => {
                    const interactionTime = performance.now() - startTime;
                    if (interactionTime > 100) { // Log slow interactions (>100ms)
                        console.warn(`⚠️ Slow ${eventType} interaction: ${interactionTime.toFixed(2)}ms`);
                    }
                });
            });
        });
    }

    // Manual timing methods for specific operations
    startTiming(label) {
        this.metrics[label] = { startTime: performance.now() };
        console.log(`⏱️ Started timing: ${label}`);
    }

    endTiming(label) {
        if (this.metrics[label] && this.metrics[label].startTime) {
            const duration = performance.now() - this.metrics[label].startTime;
            this.metrics[label].duration = duration;
            this.metrics[label].endTime = performance.now();
            
            console.log(`✅ ${label} completed in ${duration.toFixed(2)}ms`);
            
            // Warn if operation is slow
            if (duration > 5000) {
                console.warn(`🐌 Slow operation: ${label} took ${(duration/1000).toFixed(2)}s`);
            }
            
            return duration;
        }
        console.warn(`⚠️ No timing started for: ${label}`);
        return null;
    }

    // File upload specific tracking
    trackFileUpload(filename, fileSize) {
        const uploadId = `upload_${Date.now()}`;
        this.startTiming(uploadId);
        
        console.log(`📤 Tracking file upload: ${filename} (${(fileSize / 1024).toFixed(1)} KB)`);
        
        return {
            uploadId,
            complete: () => {
                const duration = this.endTiming(uploadId);
                const throughput = fileSize / (duration / 1000); // bytes per second
                console.log(`📊 Upload throughput: ${(throughput / 1024).toFixed(1)} KB/s`);
                return { duration, throughput };
            }
        };
    }

    // Processing operation tracking
    trackProcessing(operation, dataSize) {
        const processingId = `processing_${Date.now()}`;
        this.startTiming(processingId);
        
        console.log(`⚙️ Tracking processing: ${operation} (${dataSize} rows)`);
        
        return {
            processingId,
            complete: () => {
                const duration = this.endTiming(processingId);
                const throughput = dataSize / (duration / 1000); // rows per second
                console.log(`📊 Processing throughput: ${throughput.toFixed(1)} rows/s`);
                return { duration, throughput };
            }
        };
    }

    // Generate performance report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            sessionDuration: performance.now() - this.startTime,
            metrics: this.metrics,
            browser: {
                userAgent: navigator.userAgent,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                hardwareConcurrency: navigator.hardwareConcurrency
            },
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            }
        };

        console.log('📊 Performance Report:', report);
        
        // Display summary in console
        console.group('📈 Performance Summary');
        if (this.metrics.pageLoad) {
            console.log(`Page Load: ${this.metrics.pageLoad.toFixed(2)}ms`);
        }
        if (this.metrics.memory) {
            console.log(`Current Memory: ${this.metrics.memory.used}MB / ${this.metrics.memory.limit}MB`);
        }
        if (this.metrics.longTasks && this.metrics.longTasks.length > 0) {
            console.log(`Long Tasks: ${this.metrics.longTasks.length} detected`);
        }
        console.groupEnd();

        return report;
    }

    // Export data for external analysis
    exportData() {
        const data = this.generateReport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('💾 Performance data exported');
    }

    // Clear metrics
    clearMetrics() {
        this.metrics = {};
        this.startTime = performance.now();
        console.log('🧹 Performance metrics cleared');
    }

    // Cleanup observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        console.log('🧹 Performance monitor cleaned up');
    }
}

// Global performance monitor instance
window.performanceMonitor = new PerformanceMonitor();

// Add helpful testing methods to window for easy access
window.testHelpers = {
    // Test file upload performance
    testFileUpload: (file) => {
        return window.performanceMonitor.trackFileUpload(file.name, file.size);
    },
    
    // Test processing performance
    testProcessing: (operation, dataSize) => {
        return window.performanceMonitor.trackProcessing(operation, dataSize);
    },
    
    // Measure any operation
    measure: (label, fn) => {
        window.performanceMonitor.startTiming(label);
        const result = fn();
        window.performanceMonitor.endTiming(label);
        return result;
    },
    
    // Generate report
    report: () => {
        return window.performanceMonitor.generateReport();
    },
    
    // Export performance data
    export: () => {
        window.performanceMonitor.exportData();
    },
    
    // Memory stress test
    memoryStressTest: () => {
        console.log('🧪 Starting memory stress test...');
        const data = [];
        const interval = setInterval(() => {
            // Allocate some memory
            data.push(new Array(100000).fill(Math.random()));
            
            if (window.performance.memory) {
                const usagePercent = (window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit) * 100;
                console.log(`Memory usage: ${usagePercent.toFixed(1)}%`);
                
                if (usagePercent > 70) {
                    clearInterval(interval);
                    console.log('🛑 Memory stress test stopped at 70% usage');
                }
            }
        }, 100);
        
        // Stop after 10 seconds max
        setTimeout(() => {
            clearInterval(interval);
            console.log('⏰ Memory stress test timed out');
        }, 10000);
    }
};

console.log('🚀 Performance monitoring ready!');
console.log('💡 Use testHelpers.report() to see performance metrics');
console.log('💡 Use testHelpers.export() to download performance data');

// Automatically generate report when page is about to unload
window.addEventListener('beforeunload', () => {
    console.log('📊 Final performance report:');
    window.performanceMonitor.generateReport();
});
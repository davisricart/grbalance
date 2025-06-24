// Performance tracking system for monitoring optimization impact

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Prevent memory leaks
  
  track<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    
    return fn().then(
      (result) => {
        this.recordMetric(name, start, false, metadata);
        return result;
      },
      (error) => {
        this.recordMetric(name, start, true, { ...metadata, error: error.message });
        throw error;
      }
    );
  }
  
  trackSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = performance.now();
    
    try {
      const result = fn();
      this.recordMetric(name, start, false, metadata);
      return result;
    } catch (error) {
      this.recordMetric(name, start, true, { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
  
  private recordMetric(name: string, start: number, isError = false, metadata?: Record<string, any>) {
    const duration = performance.now() - start;
    
    const metric: PerformanceMetric = {
      name: `${name}${isError ? '_error' : ''}`,
      duration: Math.round(duration),
      timestamp: Date.now(),
      metadata
    };
    
    this.metrics.push(metric);
    
    // Prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Send to analytics (non-blocking)
    this.sendToAnalytics(metric);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const color = isError ? 'color: red' : duration > 1000 ? 'color: orange' : 'color: green';
      console.log(`%c⚡ ${name}: ${Math.round(duration)}ms`, color, metadata || '');
    }
  }
  
  private sendToAnalytics(metric: PerformanceMetric) {
    // Non-blocking analytics using requestIdleCallback
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        if (window.gtag) {
          window.gtag('event', 'performance', {
            event_category: 'performance_tracking',
            event_label: metric.name,
            value: metric.duration,
            custom_map: {
              timestamp: metric.timestamp,
              ...metric.metadata
            }
          });
        }
      });
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / relevantMetrics.length);
  }
  
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);
    
    // Calculate statistics for each metric
    Object.entries(grouped).forEach(([name, metrics]) => {
      const durations = metrics.map(m => m.duration);
      const total = durations.reduce((sum, d) => sum + d, 0);
      
      report[name] = {
        count: metrics.length,
        average: Math.round(total / metrics.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        total: Math.round(total)
      };
    });
    
    return report;
  }
  
  clearMetrics() {
    this.metrics = [];
  }
}

// Web Vitals tracking
class WebVitalsTracker {
  private vitalsMetrics: WebVitalsMetric[] = [];
  
  trackWebVitals() {
    // Dynamic import to avoid bundling if not needed
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      const sendToAnalytics = (metric: WebVitalsMetric) => {
        this.vitalsMetrics.push(metric);
        
        if (window.gtag) {
          window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.value),
            event_label: metric.id,
            non_interaction: true,
          });
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`%c🎯 ${metric.name}: ${Math.round(metric.value)}`, 'color: blue', metric);
        }
      };
      
      // Track all Core Web Vitals
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    }).catch(() => {
      // Gracefully handle if web-vitals isn't available
      console.warn('Web Vitals library not available');
    });
  }
  
  getWebVitals(): WebVitalsMetric[] {
    return [...this.vitalsMetrics];
  }
}

// Create singleton instances
export const performanceTracker = new PerformanceTracker();
export const webVitalsTracker = new WebVitalsTracker();

// Convenience functions for common tracking scenarios
export const trackedReadExcel = (file: File, options?: any) => 
  performanceTracker.track('excel_read', async () => {
    const { processExcelInWorker } = await import('./excelWorker');
    return processExcelInWorker(file, options);
  }, {
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type
  });

export const trackedApiCall = (endpoint: string, data?: any) =>
  performanceTracker.track('api_call', async () => {
    const response = await fetch(endpoint, {
      method: data ? 'POST' : 'GET',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined
    });
    return response.json();
  }, {
    endpoint,
    method: data ? 'POST' : 'GET',
    dataSize: data ? JSON.stringify(data).length : 0
  });

export const trackedPageLoad = (pageName: string) =>
  performanceTracker.trackSync('page_load', () => {
    // Track page load completion
    return pageName;
  }, {
    pageName,
    url: window.location.pathname
  });

// Initialize Web Vitals tracking when module loads
if (typeof window !== 'undefined') {
  // Delay initialization to avoid blocking
  setTimeout(() => {
    webVitalsTracker.trackWebVitals();
  }, 1000);
} 
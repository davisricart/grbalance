// Common TypeScript type definitions for GR Balance application

// File processing types
export interface FileData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface FileRow extends FileData {}

export interface ParsedFileData {
  filename: string;
  headers: string[];
  rows: FileRow[];
  summary: {
    totalRows: number;
    columns: number;
    sampleData: FileRow[];
  };
}

// Excel/CSV processing types
export interface ExcelWorkbookData {
  SheetNames: string[];
  Sheets: { [key: string]: unknown };
}

export interface CSVParseResult {
  data: FileRow[];
  errors: Array<{
    type: string;
    code: string;
    message: string;
    row: number;
  }>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

// Analysis and reconciliation types
export interface TransactionRow {
  date?: string | Date;
  amount?: number;
  fee?: number;
  cardBrand?: string;
  customer?: string;
  totalTransaction?: number;
  totalFee?: number;
  cashDiscount?: number;
  [key: string]: string | number | Date | undefined;
}

export interface ReconciliationResult extends FileRow {
  cardBrand?: string;
  totalTransaction?: number;
  totalFee?: number;
  cashDiscount?: number;
  discrepancy?: number;
}

export interface PaymentTrendDay {
  date: string;
  dayOfWeek: string;
  volume: number;
  timeRange: string;
  transactions?: number;
}

export interface CustomerMetrics {
  customer: string;
  avgTicket: number;
  frequency: number;
  totalSpent: number;
}

export interface CardBrandData {
  count: number;
  revenue: number;
  fees: number;
}

export interface CardBrandSummary {
  hubReport: number;
  salesReport: number;
  difference: number;
}

export interface EnhancedInsights {
  paymentTrends: {
    avgDailyVolume?: number;
    peakDay?: string;
    peakDayVolume?: number;
    lowestDayVolume?: number;
    peakHour?: number;
    peakHourTransactions?: number;
    topPeakDays?: PaymentTrendDay[];
    topLowestDays?: PaymentTrendDay[];
  };
  customerBehavior: {
    totalUniqueCustomers?: number;
    repeatCustomers?: number;
    retentionRate?: number;
    avgTransactionsPerCustomer?: number;
    avgRevenuePerCustomer?: number;
    totalCustomerRevenue?: number;
    highValueCustomers?: number;
  };
  operationalMetrics: {
    processingEfficiency?: number;
    avgProcessingFeeRate?: number;
    dataQualityScore?: number;
    reconciliationAccuracy?: number;
  };
  riskFactors: {
    largeDiscrepancies?: number;
    missingTransactions?: number;
    dataInconsistencies?: number;
    highRiskTransactions?: number;
  };
  businessIntelligence: {
    revenueGrowthPotential?: number;
    costSavingsFromAutomation?: number;
    timeValueOfReconciliation?: number;
    complianceScore?: number;
  };
}

export interface AnalysisResult {
  totalTransactions: number;
  totalRevenue: number;
  totalFees: number;
  discrepancies: number;
  matchedTransactions: number;
  matchPercentage: number;
  totalVariance: number;
  cardBrandTransactions: Record<string, CardBrandData>;
  cardBrandSummary: Record<string, CardBrandSummary>;
  bestReconciled: string;
  needsReview: string;
  enhancedInsights: EnhancedInsights;
}

// Component prop types
export interface VirtualTableData {
  [key: string]: string | number | boolean | null | undefined;
}

// Error handling types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  securityWarning?: string;
  data?: ArrayBuffer | string;
}

// Supabase user types
export interface UserDoc {
  id: string;
  email: string;
  businessName?: string;
  businessType?: string;
  subscriptionTier?: string;
  billingCycle?: string;
  comparisonsUsed: number;
  comparisonsLimit: number;
  status: string;
  createdAt: string;
  approvedAt?: string;
  lastActiveAt?: string;
}

export interface ScriptExecutionResult {
  result: ReconciliationResult[];
  success: boolean;
  error?: string;
  executionTime?: number;
}

export interface TestResult {
  success: boolean;
  detectedColumns: string[];
  sampleData: FileRow[];
  error?: string;
}

// File upload types
export interface FileUploadState {
  file: File | null;
  error: string;
  isUploading: boolean;
}

// Raw file data for analysis
export interface RawFileData {
  file1Data: (string | number)[][];
  file2Data: (string | number)[][];
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Deployment types
export interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  deploymentId?: string;
}

// Processing state types
export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  step: string;
  error?: string;
}
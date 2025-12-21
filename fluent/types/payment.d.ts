/**
 * Payment Collection Type Definitions
 * 
 * This file defines the TypeScript types for the new centralized payments collection.
 * The collection complements (does not replace) existing payment storage in students and billing collections.
 */

export type PaymentStatus = 
  | 'INITIATED'      // Payment created, user hasn't started Toss flow yet
  | 'PENDING'        // User redirected to Toss, waiting for completion
  | 'PROCESSING'     // Payment being processed by Toss
  | 'COMPLETED'      // Payment successful
  | 'FAILED'         // Payment failed
  | 'CANCELLED'      // User cancelled payment
  | 'REFUNDED'       // Payment refunded
  | 'PARTIALLY_REFUNDED' // Partial refund
  | 'EXPIRED';       // Payment expired

export type PaymentMethod = 
  | '카드'           // Card
  | '가상계좌'       // Virtual account
  | '계좌이체'       // Bank transfer
  | '휴대폰'         // Mobile
  | '간편결제'       // Easy payment
  | 'UNKNOWN';

export type PaymentSource = 'api' | 'webhook' | 'manual' | 'system';

export interface PaymentStatusHistoryEntry {
  status: PaymentStatus;
  timestamp: Date;
  source: PaymentSource;
  notes?: string;
}

export interface PaymentTossData {
  // Core Toss Payment fields
  orderId: string;                 // Order ID (should match payment.orderId)
  paymentKey?: string;             // Toss payment key (unique identifier from Toss)
  method?: string;                 // Payment method (e.g., "카드", "간편결제", "가상계좌")
  status?: string;                 // Toss status (e.g., "DONE", "CANCELED", "PARTIAL_CANCELED", "ABORTED", "EXPIRED")
  totalAmount?: number;            // Total payment amount
  balanceAmount?: number;          // Remaining balance after refunds
  approvedAt?: string;             // ISO date string when payment was approved
  requestedAt?: string;            // ISO date string when payment was requested
  lastTransactionKey?: string;     // Last transaction key from Toss
  
  // Receipt information (for admin/student receipt downloads)
  receipt?: {
    url?: string;                  // Receipt URL from Toss
    receiptKey?: string;           // Receipt key for downloading
  };
  
  // Refund information
  cancels?: Array<{                // Refund/cancel information
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
    transactionKey: string;
    receiptKey?: string;
  }>;
  
  // Failure information
  failure?: {
    code?: string;                 // Error code
    message?: string;              // Error message
  };
  
  // Additional Toss fields (capture everything for completeness)
  card?: {
    number?: string;               // Masked card number
    cardType?: string;             // Card type
    ownerType?: string;            // Owner type
    acquireStatus?: string;        // Acquire status
    receiptUrl?: string;           // Card receipt URL
  };
  virtualAccount?: {
    accountType?: string;
    accountNumber?: string;
    bankCode?: string;
    customerName?: string;
    dueDate?: string;
    refundStatus?: string;
    expired?: boolean;
    settlementStatus?: string;
  };
  transfer?: {
    bankCode?: string;
    settlementStatus?: string;
  };
  mobilePhone?: {
    customerMobilePhone?: string;
    settlementStatus?: string;
    receiptUrl?: string;
  };
  giftCertificate?: {
    approveNo?: string;
    settlementStatus?: string;
  };
  cashReceipt?: {
    type?: string;
    receiptKey?: string;
    issueNumber?: string;
    receiptUrl?: string;
  };
}

export interface PaymentError {
  message: string;
  code?: string;
  timestamp: Date;
  source: string;
}

export interface PaymentMetadata {
  source?: string;                // 'student/payment', 'teacher/payment', etc.
  ipAddress?: string;             // User's IP (optional, for security)
  userAgent?: string;             // Browser info (optional)
  referrer?: string;              // Where payment was initiated from
  [key: string]: any;            // Additional flexible fields
}

/**
 * Main Payment Document Interface
 * 
 * This represents a payment document in the MongoDB payments collection.
 * All fields are designed to track the complete lifecycle of a payment.
 */
export interface PaymentDocument {
  // Primary identifiers
  _id?: string;                    // MongoDB ObjectId
  orderId: string;                 // Unique UUID for this transaction (indexed)
  paymentKey?: string;             // Toss payment key (after confirmation)
  
  // User/Student information
  student_name: string;            // Student name (indexed)
  student_id?: string;             // Student ID/phone number if available
  user_type?: 'student' | 'teacher' | 'admin';
  
  // Payment details
  amount: number;                  // Payment amount in KRW (totalAmount from Toss)
  currency: string;                // Default: 'KRW'
  method?: PaymentMethod;         // Payment method from Toss (e.g., "카드", "간편결제")
  status: PaymentStatus;           // Current payment status (indexed)
  
  // Billing information
  yyyymm?: string;                 // Month in "YYYYMM" format (for billing grouping)
  description?: string;            // Payment description - what student paid for (e.g., "오프라인 1:1 수업 x3", "3개월 플랜")
  quantity?: number;               // Quantity if applicable (e.g., 3 for "x3")
  orderName?: string;              // Order name used in Toss (e.g., "David's English class fee")
  
  // Toss Payments data
  tossData?: PaymentTossData;
  
  // Timestamps
  createdAt: Date;                // When payment was initiated
  updatedAt: Date;                 // Last update time
  initiatedAt?: Date;             // When user clicked "Pay"
  pendingAt?: Date;               // When redirected to Toss
  completedAt?: Date;             // When payment completed
  failedAt?: Date;                // When payment failed
  cancelledAt?: Date;             // When payment cancelled
  refundedAt?: Date;               // When refunded
  
  // Status change history
  statusHistory: PaymentStatusHistoryEntry[];
  
  // Metadata
  metadata?: PaymentMetadata;
  
  // Error tracking
  errors?: PaymentError[];
  
  // Links to other collections
  linkedStudentId?: string;        // Reference to students._id if needed
  linkedBillingId?: string;       // Reference to billing._id if needed
}

/**
 * Input type for creating a new payment
 */
export interface CreatePaymentInput {
  orderId: string;
  student_name: string;
  student_id?: string;
  amount: number;
  yyyymm?: string;
  description?: string;            // What student is paying for (e.g., "오프라인 1:1 수업 x3", "3개월 플랜")
  quantity?: number;               // Quantity (e.g., 3 if description includes "x3")
  orderName?: string;              // Order name sent to Toss (e.g., "David's English class fee")
  metadata?: PaymentMetadata;
}

/**
 * Input type for updating payment status
 */
export interface UpdatePaymentStatusInput {
  status: PaymentStatus;
  paymentKey?: string;
  tossData?: PaymentTossData;
  source?: PaymentSource;
  notes?: string;
}

/**
 * Query options for retrieving payments
 */
export interface PaymentQueryOptions {
  limit?: number;
  skip?: number;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  student_name?: string;
}


export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionCategory = 'FUNDING' | 'TRANSFER' | 'WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Transaction {
  id: string;
  reference: string;
  wallet_id: string;
  counterpart_wallet_id: string | null;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  status: TransactionStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionRecord {
  id: string;
  reference: string;
  wallet_id: string;
  counterpart_wallet_id?: string | null;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
  status: TransactionStatus;
}

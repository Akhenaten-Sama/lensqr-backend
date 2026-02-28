export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWalletRecord {
  id: string;
  user_id: string;
}

export interface FundWalletDto {
  amount: number;
  reference: string;
  description?: string;
}

export interface TransferDto {
  recipient_email: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface WithdrawDto {
  amount: number;
  reference: string;
  description?: string;
}

export interface WalletState {
  address: string | null;
  balance: string;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export interface Transaction {
  id: string;
  type: "buy" | "redeem" | "transfer" | "receive";
  amount: number;
  status: "pending" | "completed" | "failed";
  txHash?: string;
  from?: string;
  to?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface BankDetails {
  accountNumber: string;
  ifsc: string;
  accountHolderName: string;
  bankName: string;
}

export interface RedeemRequest {
  id: string;
  wallet: string;
  amount: number;
  inrAmount: number;
  bankDetails: BankDetails;
  status: "pending" | "processing" | "completed" | "failed";
  burnTxHash?: string;
  payoutId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface UserProfile {
  wallet: string;
  totalMinted: number;
  totalRedeemed: number;
  totalTransferred: number;
  createdAt: string;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface TransferData {
  to: string;
  amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

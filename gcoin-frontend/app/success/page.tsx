"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Clock, Home, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

interface PaymentStatus {
  status: "completed" | "processing" | "pending" | "failed" | "not_found";
  txHash?: string;
  error?: string;
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gcoinAmount, setGcoinAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/payment/status/${orderId}`);
        
        if (res.data.status) {
          setPaymentStatus(res.data);
          
          // Extract amount from order ID if possible or from response
          const match = orderId.match(/gcoin_(\d+)/);
          if (match) {
            // Assuming the timestamp is in the order ID - we can't determine amount from it
            // The backend should return the amount in future versions
            setGcoinAmount(1); // placeholder - should come from backend
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch payment status:", err);
        setError(err.response?.data?.message || "Failed to check payment status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Poll for updates every 2 seconds for first 30 seconds
    const pollInterval = setInterval(fetchStatus, 2000);
    const timeout = setTimeout(() => clearInterval(pollInterval), 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [orderId]);

  const isSuccess = paymentStatus?.status === "completed";
  const isProcessing = paymentStatus?.status === "processing" || paymentStatus?.status === "pending";
  const isFailed = paymentStatus?.status === "failed";
  const notFound = paymentStatus?.status === "not_found";

  return (
    <div className="min-h-screen relative bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-gcoin-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass border-white/10 overflow-hidden">
          <CardHeader className="text-center pb-4">
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="flex justify-center mb-4"
                >
                  <Clock className="w-12 h-12 text-gcoin-500" />
                </motion.div>
                <CardTitle className="text-2xl">Processing Payment</CardTitle>
                <CardDescription>Checking your mint status...</CardDescription>
              </>
            ) : error ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </motion.div>
                <CardTitle className="text-2xl">Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </>
            ) : isSuccess ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <CardTitle className="text-2xl">
                  <span className="bg-gradient-to-r from-gcoin-400 to-gcoin-500 bg-clip-text text-transparent">
                    Mint Successful!
                  </span>
                </CardTitle>
                <CardDescription>Your GCoin has been minted</CardDescription>
              </>
            ) : isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="flex justify-center mb-4"
                >
                  <Zap className="w-12 h-12 text-blue-500" />
                </motion.div>
                <CardTitle className="text-2xl">Processing</CardTitle>
                <CardDescription>Your mint is being finalized...</CardDescription>
              </>
            ) : isFailed ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <AlertCircle className="w-12 h-12 text-orange-500" />
                </motion.div>
                <CardTitle className="text-2xl">Mint Failed</CardTitle>
                <CardDescription>There was an issue minting your GCoin</CardDescription>
              </>
            ) : notFound ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <AlertCircle className="w-12 h-12 text-yellow-500" />
                </motion.div>
                <CardTitle className="text-2xl">Order Not Found</CardTitle>
                <CardDescription>Payment record could not be found</CardDescription>
              </>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Badge */}
            {paymentStatus && !loading && (
              <div className="flex justify-center">
                <Badge
                  variant={
                    isSuccess
                      ? "success"
                      : isFailed
                      ? "destructive"
                      : isProcessing
                      ? "warning"
                      : "secondary"
                  }
                  className="text-sm px-3 py-1"
                >
                  {paymentStatus.status.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Success Details */}
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <div className="bg-gradient-to-r from-gcoin-500/10 to-emerald-500/10 border border-gcoin-500/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order ID</span>
                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-gcoin-400 font-mono">
                      {orderId?.slice(0, 12)}...
                    </code>
                  </div>

                  {paymentStatus.txHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transaction</span>
                      <a
                        href={`https://polygonscan.com/tx/${paymentStatus.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gcoin-400 hover:text-gcoin-300 font-mono flex items-center gap-1 transition-colors"
                      >
                        {paymentStatus.txHash.slice(0, 8)}...
                        <TrendingUp className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm font-medium">Amount Minted</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-gcoin-400 to-gcoin-500 bg-clip-text text-transparent">
                      {gcoinAmount || "1"} GCoin
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Failed Details */}
            {isFailed && paymentStatus.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <p className="text-sm text-red-200">{paymentStatus.error}</p>
              </motion.div>
            )}

            {/* Processing Status */}
            {isProcessing && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
              >
                <p className="text-sm text-blue-200">
                  Your payment is being processed. This usually takes 1-2 minutes. You can close this page safely.
                </p>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => router.push("/")}
                className="w-full gap-2 bg-gradient-to-r from-gcoin-500 to-gcoin-600 hover:from-gcoin-600 hover:to-gcoin-700"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </motion.div>

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground">
              {isSuccess
                ? "Check your wallet for the minted GCoin"
                : isProcessing
                ? "Transaction will be confirmed on-chain shortly"
                : "Please try your purchase again"}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

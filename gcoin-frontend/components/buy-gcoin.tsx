"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, IndianRupee, ArrowRight, CheckCircle, Loader2, Zap, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWalletContext } from "@/components/wallet-provider";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

export function BuyGCoin() {
  const { address, refreshBalance } = useWalletContext();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "success">("input");
  const [orderId, setOrderId] = useState("");
  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [backendError, setBackendError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;

  const createOrder = useCallback(async () => {
    if (!address || numAmount < 1) {
      toast.error("Enter a valid amount (min ₹1)");
      return;
    }

    setLoading(true);
    setBackendError(null);

    try {
      const res = await axios.post(`${API_URL}/payment/create-order`, {
        amount: numAmount,
        wallet: address,
        customer_details: {
          customer_id: address.slice(0, 20),
          customer_email: "user@gcoin.in",
          customer_phone: "9999999999",
        }
      }, {
        timeout: 15000,
      });

      if (res.data.success && res.data.data) {
        setOrderId(res.data.data.order_id);
        setPaymentSessionId(res.data.data.payment_session_id);
        setStep("confirm");
        toast.success("Order created! Proceed to payment.");
      }
    } catch (err: any) {
      console.error("Payment order error:", err);
      
      let errorMsg = "Failed to create order";
      
      if (err.code === "ECONNABORTED") {
        errorMsg = "Backend timeout — your server might be sleeping";
      } else if (err.response?.status === 404) {
        errorMsg = `Backend API not found at ${API_URL}/payment/create-order`;
      } else if (err.response?.status === 500) {
        errorMsg = "Backend server error — check your backend logs";
      } else if (!err.response) {
        errorMsg = `Cannot reach backend at ${API_URL}`;
      } else {
        errorMsg = err.response?.data?.error || err.message;
      }
      
      setBackendError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [address, numAmount]);

  const handlePayment = useCallback(async () => {
    if (!paymentSessionId || !address) {
      toast.error("Missing payment session ID");
      return;
    }

    setStep("processing");
    setLoading(true);

    try {
      // Check if Cashfree SDK is loaded from layout.tsx
      if (!(window as any).Cashfree) {
        toast.error("Cashfree SDK not loaded. Please refresh the page.");
        setStep("confirm");
        setLoading(false);
        return;
      }

      const Cashfree = (window as any).Cashfree;
      
      // IMPORTANT: Since you're on production Cashfree dashboard, use "production"
      // If your backend creates sandbox orders, use "sandbox"
      const env = process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox";
      
      console.log("Initializing Cashfree with mode:", env);
      const cashfree = Cashfree({ mode: env });

      console.log("Opening checkout with session ID:", paymentSessionId);
      
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal", // Opens as popup overlay (best UX)
        returnUrl: `${window.location.origin}/?order_id=${orderId}`,
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        console.log("Checkout result:", result);
        
        if (result.error) {
          toast.error(result.error.message || "Payment failed");
          setStep("confirm");
          setLoading(false);
          return;
        }
        
        if (result.paymentDetails) {
          // Payment completed successfully
          console.log("Payment completed:", result.paymentDetails);
          
          // Verify with backend
          try {
            const verifyRes = await axios.post(`${API_URL}/payment/verify-payment`, {
              order_id: orderId,
              wallet: address,
              amount: numAmount,
            }, { timeout: 15000 });

            if (verifyRes.data.success) {
              setStep("success");
              toast.success(`Successfully bought ${numAmount} GCoin!`);
              await refreshBalance();
              setTimeout(() => {
                setStep("input");
                setAmount("");
                setOrderId("");
                setPaymentSessionId("");
                setBackendError(null);
              }, 3000);
            }
          } catch (verifyErr: any) {
            console.log("Verification pending:", verifyErr);
            toast.info("Payment processing. Check your balance shortly.");
            setStep("confirm");
            setLoading(false);
          }
        } else if (result.redirect) {
          console.log("User redirected to payment page");
        }
      }).catch((err: any) => {
        console.error("Checkout error:", err);
        toast.error("Payment checkout failed: " + (err.message || "Unknown error"));
        setStep("confirm");
        setLoading(false);
      });

    } catch (err: any) {
      console.error("Payment initialization error:", err);
      toast.error(err.message || "Failed to initialize payment");
      setStep("confirm");
      setLoading(false);
    }
  }, [paymentSessionId, orderId, address, numAmount, refreshBalance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      id="buy"
    >
      <Card className="glass border-gcoin-500/20 card-hover overflow-hidden h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gcoin-400 to-gcoin-600" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gcoin-400 to-gcoin-600 flex items-center justify-center shadow-lg shadow-gcoin-500/20">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Buy GCoin</CardTitle>
                <CardDescription>Purchase with INR via Cashfree</CardDescription>
              </div>
            </div>
            <Badge variant="success" className="text-xs">1:1 INR</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {backendError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Backend Error</p>
                <p className="text-xs text-destructive/80 mt-0.5">{backendError}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  API URL: <code className="bg-black/20 px-1 rounded">{API_URL}</code>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setBackendError(null)}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount (INR)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setBackendError(null); }}
                      className="pl-10 h-12 text-lg font-semibold"
                      min={1}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>Secured by Cashfree Payments</span>
                  </div>
                </div>

                {numAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-xl bg-gcoin-500/5 border border-gcoin-500/10"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You will receive</span>
                      <span className="font-bold text-gcoin-400">{numAmount} GCoin</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Exchange rate</span>
                      <span className="font-medium">1 GCoin = ₹1</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Gas fee</span>
                      <span className="font-medium text-gcoin-400">~₹0 (Polygon)</span>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={createOrder}
                  disabled={loading || numAmount < 1}
                  className="w-full h-12 bg-gradient-to-r from-gcoin-500 to-gcoin-600 hover:from-gcoin-400 hover:to-gcoin-500 text-white font-semibold rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-gcoin-500/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-gcoin-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">Confirm Purchase</h3>
                  <p className="text-muted-foreground text-sm">You are about to buy {numAmount} GCoin for ₹{numAmount}</p>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">₹{numAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GCoin to receive</span>
                    <span className="font-semibold text-gcoin-400">{numAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Gateway</span>
                    <span className="font-medium">Cashfree</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => setStep("input")}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 h-11 bg-gradient-to-r from-gcoin-500 to-gcoin-600 hover:from-gcoin-400 hover:to-gcoin-500 text-white font-semibold rounded-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay Now"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 space-y-4"
              >
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-gcoin-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-gcoin-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Processing Payment</h3>
                <p className="text-sm text-muted-foreground">Opening Cashfree checkout...</p>
                <Progress value={60} className="w-full" />
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle className="w-16 h-16 text-gcoin-400 mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold gradient-text">Purchase Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  {numAmount} GCoin has been minted to your wallet
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
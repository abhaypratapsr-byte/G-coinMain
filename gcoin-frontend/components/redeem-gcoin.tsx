"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Banknote, CheckCircle, Loader2, AlertTriangle, Building2, User, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWalletContext } from "@/components/wallet-provider";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

export function RedeemGCoin() {
  const { address, balance } = useWalletContext();
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifsc: "",
    accountHolderName: "",
    bankName: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "success">("input");

  const numAmount = parseFloat(amount) || 0;
  const bal = parseFloat(balance) || 0;
  const hasEnough = numAmount >= 100 && numAmount <= bal;
  const isFormValid =
    bankDetails.accountNumber.length >= 9 &&
    bankDetails.ifsc.length >= 11 &&
    bankDetails.accountHolderName.length >= 3 &&
    bankDetails.bankName.length >= 2;

  const handleRedeem = useCallback(async () => {
    if (!address || !hasEnough || !isFormValid) {
      toast.error("Please fill all fields correctly. Minimum redeem: ₹100");
      return;
    }

    setStep("processing");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/redeem/request`, {
        wallet: address,
        amount: numAmount,
        bankDetails,
      });

      if (res.data.success) {
        setStep("success");
        toast.success("Redeem request submitted! Admin will process it shortly.");
        setTimeout(() => {
          setStep("input");
          setAmount("");
          setBankDetails({
            accountNumber: "",
            ifsc: "",
            accountHolderName: "",
            bankName: "",
          });
        }, 4000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Redeem request failed");
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  }, [address, hasEnough, isFormValid, numAmount, bankDetails]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.2 }}
      id="redeem"
    >
      <Card className="glass border-gold-500/20 card-hover overflow-hidden h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-gold-600" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Redeem</CardTitle>
                <CardDescription>Convert to INR in your bank</CardDescription>
              </div>
            </div>
            <Badge variant="warning" className="text-xs">Min ₹100</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Amount (GCoin)</Label>
                    <span className="text-xs text-muted-foreground">
                      Balance: {bal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Input
                    type="number"
                    placeholder="Min ₹100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 text-lg font-semibold"
                    min={100}
                    max={bal}
                  />
                  {numAmount > 0 && numAmount < 100 && (
                    <p className="text-xs text-gold-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Minimum redeem amount is ₹100
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium">Bank Details</Label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Account Holder Name"
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                      className="pl-10 h-10"
                    />
                  </div>

                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Bank Name"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="pl-10 h-10"
                    />
                  </div>

                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Account Number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      className="pl-10 h-10"
                      type="password"
                    />
                  </div>

                  <Input
                    placeholder="IFSC Code"
                    value={bankDetails.ifsc}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                    className="h-10 font-mono text-sm uppercase"
                  />
                </div>

                {numAmount >= 100 && isFormValid && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-xl bg-gold-500/5 border border-gold-500/10"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You will receive</span>
                      <span className="font-bold text-gold-400">₹{numAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Processing time</span>
                      <span className="font-medium">1-2 business days</span>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={() => setStep("confirm")}
                  disabled={!hasEnough || !isFormValid}
                  className="w-full h-12 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white font-semibold rounded-xl"
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Continue
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
                <div className="text-center py-2">
                  <h3 className="text-lg font-bold">Confirm Redeem</h3>
                  <p className="text-sm text-muted-foreground">Review your bank details</p>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Redeem Amount</span>
                    <span className="font-semibold">{numAmount} GCoin</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">INR Value</span>
                    <span className="font-semibold text-gold-400">₹{numAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Holder</span>
                    <span className="font-medium">{bankDetails.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IFSC</span>
                    <span className="font-mono text-xs">{bankDetails.ifsc}</span>
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
                    onClick={handleRedeem}
                    disabled={loading}
                    className="flex-1 h-11 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white font-semibold rounded-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Request"}
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
                  <div className="absolute inset-0 border-4 border-gold-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Submitting Request</h3>
                <p className="text-sm text-muted-foreground">Please wait while we process your redeem request</p>
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
                  <CheckCircle className="w-16 h-16 text-gold-400 mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold text-gold-400">Request Submitted!</h3>
                <p className="text-sm text-muted-foreground">
                  Admin will process your redeem request within 1-2 business days
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

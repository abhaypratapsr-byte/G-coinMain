"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, Send, CheckCircle, Loader2, AlertTriangle, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWalletContext } from "@/components/wallet-provider";
import { toast } from "sonner";
import { ethers } from "ethers";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

export function TransferGCoin() {
  const { address, balance, contract, provider, refreshBalance } = useWalletContext();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "success">("input");

  const numAmount = parseFloat(amount) || 0;
  const bal = parseFloat(balance) || 0;
  const isValidAddress = ethers.isAddress(toAddress);
  const hasEnough = numAmount > 0 && numAmount <= bal;

  const handleTransfer = useCallback(async () => {
    if (!contract || !provider || !address || !isValidAddress || !hasEnough) {
      toast.error("Please check the recipient address and amount");
      return;
    }

    setStep("processing");
    setLoading(true);

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer) as any; // ← FIXED: cast to any
      const decimals = await (contract as any).decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await contractWithSigner.transfer(toAddress, amountWei);
      toast.info("Transaction submitted...");

      const receipt = await tx.wait();

      await axios.post(`${API_URL}/transfer/record`, {
        from: address,
        to: toAddress,
        amount: numAmount,
        txHash: receipt?.hash,
      });

      setStep("success");
      toast.success(`Successfully transferred ${numAmount} GCoin!`);
      await refreshBalance();

      setTimeout(() => {
        setStep("input");
        setToAddress("");
        setAmount("");
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Transfer failed");
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  }, [contract, provider, address, isValidAddress, hasEnough, amount, numAmount, toAddress, refreshBalance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1 }}
      id="transfer"
    >
      <Card className="glass border-blue-500/20 card-hover overflow-hidden h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Transfer</CardTitle>
                <CardDescription>Send GCoin to any wallet</CardDescription>
              </div>
            </div>
            <Badge variant="info" className="text-xs">P2P</Badge>
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
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Recipient Address</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="0x..."
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      className="pl-10 h-11 font-mono text-sm"
                    />
                  </div>
                  {toAddress && !isValidAddress && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Invalid address
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Amount</Label>
                    <span className="text-xs text-muted-foreground">
                      Balance: {bal.toLocaleString("en-IN", { maximumFractionDigits: 2 })} GCoin
                    </span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 text-lg font-semibold"
                    min={0.01}
                    max={bal}
                    step={0.01}
                  />
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setAmount(((bal * pct) / 100).toFixed(2))}
                        className="flex-1 py-1 text-xs rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {numAmount > 0 && isValidAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sending</span>
                      <span className="font-bold text-blue-400">{numAmount} GCoin</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">To</span>
                      <span className="font-mono text-xs">{toAddress.slice(0, 8)}...{toAddress.slice(-6)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Gas fee</span>
                      <span className="font-medium text-blue-400">~0.001 MATIC</span>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={() => setStep("confirm")}
                  disabled={!isValidAddress || !hasEnough}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
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
                  <h3 className="text-lg font-bold">Confirm Transfer</h3>
                  <p className="text-sm text-muted-foreground">Please review the details</p>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{numAmount} GCoin</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-mono text-xs">{toAddress.slice(0, 10)}...{toAddress.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-mono text-xs">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">Polygon Mainnet</span> {/* ← FIXED */}
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
                    onClick={handleTransfer}
                    disabled={loading}
                    className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Send"}
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
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Confirming Transaction</h3>
                <p className="text-sm text-muted-foreground">Waiting for blockchain confirmation...</p>
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
                  <CheckCircle className="w-16 h-16 text-blue-400 mx-auto" />
                </motion.div>
                <h3 className="text-xl font-bold text-blue-400">Transfer Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  {numAmount} GCoin sent successfully
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, ArrowRightLeft, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletContext } from "@/components/wallet-provider";
import { formatNumber } from "@/lib/utils";

export function BalanceCard() {
  const { address, balance, isConnected } = useWalletContext();

  if (!isConnected || !address) return null;

  const bal = parseFloat(balance) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 -mt-8 relative z-20"
    >
      <Card className="glass border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gcoin-500/5 via-transparent to-gcoin-600/5 pointer-events-none" />
        <CardContent className="p-6 sm:p-8 relative">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Main Balance */}
            <div className="sm:col-span-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gcoin-400 to-gcoin-600 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Your Balance</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold gradient-text">
                  {formatNumber(Math.floor(bal))}
                </span>
                <span className="text-lg font-semibold text-gcoin-400">
                  .{(bal % 1).toFixed(2).slice(2)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground mt-1">
                ≈ ₹{formatNumber(bal)} INR
              </span>
            </div>

            {/* Quick Stats */}
            <div className="sm:col-span-2 grid grid-cols-3 gap-4">
              {[
                {
                  icon: TrendingUp,
                  label: "Total Bought",
                  value: "₹0",
                  color: "text-gcoin-400",
                  bg: "bg-gcoin-500/10",
                },
                {
                  icon: TrendingDown,
                  label: "Total Redeemed",
                  value: "₹0",
                  color: "text-gold-400",
                  bg: "bg-gold-500/10",
                },
                {
                  icon: ArrowRightLeft,
                  label: "Total Transferred",
                  value: "₹0",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-lg font-bold text-foreground">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

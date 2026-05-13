"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ShoppingCart, ArrowRightLeft, TrendingDown, ExternalLink, ChevronDown, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletContext } from "@/components/wallet-provider";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDate, truncateAddress } from "@/lib/utils";
import type { Transaction } from "@/types";

const txTypeConfig = {
  buy: { icon: ShoppingCart, label: "Buy", color: "text-gcoin-400", bg: "bg-gcoin-500/10", border: "border-gcoin-500/20" },
  transfer: { icon: ArrowRightLeft, label: "Transfer", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  receive: { icon: ArrowRightLeft, label: "Receive", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  redeem: { icon: TrendingDown, label: "Redeem", color: "text-gold-400", bg: "bg-gold-500/10", border: "border-gold-500/20" },
};

const statusConfig = {
  pending: { variant: "warning" as const, label: "Pending" },
  completed: { variant: "success" as const, label: "Completed" },
  failed: { variant: "destructive" as const, label: "Failed" },
};

function TransactionItem({ tx, index }: { tx: Transaction; index: number }) {
  const config = txTypeConfig[tx.type] || txTypeConfig.buy;
  const status = statusConfig[tx.status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center shrink-0`}>
        <config.icon className={`w-5 h-5 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{config.label}</span>
          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{formatDate(tx.createdAt)}</span>
          {tx.txHash && (
            <>
              <span>·</span>
              <a
                href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 hover:text-gcoin-400 transition-colors"
              >
                {truncateAddress(tx.txHash, 4)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`font-bold text-sm ${
          tx.type === "buy" || tx.type === "receive" ? "text-gcoin-400" :
          tx.type === "redeem" || tx.type === "transfer" ? "text-gold-400" :
          "text-foreground"
        }`}>
          {tx.type === "buy" || tx.type === "receive" ? "+" : "-"}{tx.amount} GCoin
        </span>
        <div className="text-xs text-muted-foreground">
          {tx.type === "transfer" && tx.to ? `To: ${truncateAddress(tx.to)}` :
           tx.type === "receive" && tx.from ? `From: ${truncateAddress(tx.from)}` :
           "≈ ₹" + tx.amount}
        </div>
      </div>
    </motion.div>
  );
}

export function TransactionHistory() {
  const { address, isConnected } = useWalletContext();
  const { transactions, loading, fetchTransactions } = useTransactions();
  const [filter, setFilter] = useState<"all" | "buy" | "transfer" | "redeem">("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions(address);
    }
  }, [isConnected, address, fetchTransactions]);

  const filtered = transactions.filter((tx) =>
    filter === "all" ? true : tx.type === filter
  );

  const displayed = showAll ? filtered : filtered.slice(0, 5);

  return (
    <section id="history" className="py-16 relative">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border-white/10 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Transaction History</CardTitle>
                    <CardDescription>Your recent activity</CardDescription>
                  </div>
                </div>

                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
                  <TabsList className="bg-white/5 h-9">
                    <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                    <TabsTrigger value="buy" className="text-xs px-3">Buy</TabsTrigger>
                    <TabsTrigger value="transfer" className="text-xs px-3">Transfer</TabsTrigger>
                    <TabsTrigger value="redeem" className="text-xs px-3">Redeem</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-gcoin-500/30 border-t-gcoin-500 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No transactions yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {displayed.map((tx, i) => (
                      <TransactionItem key={tx.id} tx={tx} index={i} />
                    ))}
                  </AnimatePresence>

                  {filtered.length > 5 && (
                    <div className="pt-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showAll ? (
                          <>
                            Show Less <ChevronDown className="w-4 h-4 ml-1 rotate-180" />
                          </>
                        ) : (
                          <>
                            Show All {filtered.length} <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

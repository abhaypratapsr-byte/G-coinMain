"use client";

import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { BalanceCard } from "@/components/balance-card";
import { BuyGCoin } from "@/components/buy-gcoin";
import { TransferGCoin } from "@/components/transfer-gcoin";
import { RedeemGCoin } from "@/components/redeem-gcoin";
import { TransactionHistory } from "@/components/transaction-history";
import { AnimatedBackground } from "@/components/animated-background";
import { useWalletContext } from "@/components/wallet-provider";

export default function Home() {
  const { isConnected } = useWalletContext();

  return (
    <div className="relative">
      <AnimatedBackground />

      {/* Hero */}
      <HeroSection />

      {/* Balance Card (only when connected) */}
      {isConnected && <BalanceCard />}

      {/* Features */}
      <FeaturesSection />

      {/* Action Cards */}
      {isConnected && (
        <section className="py-16 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BuyGCoin />
              <TransferGCoin />
              <RedeemGCoin />
            </div>
          </div>
        </section>
      )}

      {/* Transaction History */}
      {isConnected && <TransactionHistory />}
    </div>
  );
}

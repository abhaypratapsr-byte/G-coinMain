"use client";

import { motion } from "framer-motion";
import { ArrowDown, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/components/wallet-provider";

export function HeroSection() {
  const { isConnected, connect, isConnecting } = useWalletContext();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 200 + i * 100,
              height: 200 + i * 100,
              left: `${15 + i * 12}%`,
              top: `${10 + i * 8}%`,
              background: `radial-gradient(circle, hsl(142 71% ${45 + i * 3}% / ${0.03 + i * 0.01}))`,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -20, 30, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gcoin-500/10 border border-gcoin-500/20 text-gcoin-400 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>1 GCoin = 1 INR — Always</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="text-foreground">India&apos;s</span>
          <br />
          <span className="gradient-text">Digital Currency</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Buy, transfer, and redeem GCoin with seamless INR integration.
          Built on Polygon for lightning-fast, low-cost transactions.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          {!isConnected ? (
            <Button
              onClick={connect}
              disabled={isConnecting}
              size="lg"
              className="btn-glow bg-gradient-to-r from-gcoin-500 to-gcoin-600 hover:from-gcoin-400 hover:to-gcoin-500 text-white border-0 rounded-full px-8 py-6 text-base font-semibold w-full sm:w-auto"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Connect Wallet
                </span>
              )}
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="btn-glow bg-gradient-to-r from-gcoin-500 to-gcoin-600 hover:from-gcoin-400 hover:to-gcoin-500 text-white border-0 rounded-full px-8 py-6 text-base font-semibold w-full sm:w-auto"
            >
              <a href="#buy">
                <Sparkles className="w-5 h-5 mr-2" />
                Buy GCoin
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 py-6 text-base font-semibold border-white/10 hover:bg-white/5 w-full sm:w-auto"
            asChild
          >
            <a href="#features">Learn More</a>
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {[
            { icon: Shield, label: "Fully Collateralized", value: "1:1 INR" },
            { icon: Zap, label: "Transaction Speed", value: "< 3s" },
            { icon: Globe, label: "Network", value: "Polygon" },
            { icon: Sparkles, label: "Gas Fees", value: "Near Zero" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm"
            >
              <stat.icon className="w-5 h-5 text-gcoin-400" />
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

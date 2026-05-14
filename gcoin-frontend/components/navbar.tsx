"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Menu, X, LogOut, Copy, Check, Coins, TrendingUp, ArrowRightLeft, History, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/components/wallet-provider";
import { truncateAddress, copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import LoginButton from "./login-button";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#buy", label: "Buy", icon: Coins },
  { href: "/#transfer", label: "Transfer", icon: ArrowRightLeft },
  { href: "/#redeem", label: "Redeem", icon: TrendingUp },
  { href: "/#history", label: "History", icon: History },
];

export function Navbar() {
  const { address, balance, isConnected, isConnecting, connect, disconnect } = useWalletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <nav className="glass rounded-2xl border border-white/10 px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-gcoin-400 to-gcoin-600 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                <Coins className="relative w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none tracking-tight">
                  <span className="gradient-text">G</span>
                  <span className="text-foreground">Coin</span>
                </span>
                <span className="text-[10px] text-muted-foreground leading-none tracking-wider uppercase">Stablecoin</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Wallet Section */}
            <div className="flex items-center gap-3">
              <LoginButton />
              {isConnected && address ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gcoin-500/10 border border-gcoin-500/20">
                    <Coins className="w-3.5 h-3.5 text-gcoin-400" />
                    <span className="text-sm font-semibold text-gcoin-400">
                      {parseFloat(balance).toLocaleString("en-IN", { maximumFractionDigits: 2 })} GCoin
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
                    >
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">{truncateAddress(address)}</span>
                      <span className="sm:hidden">{truncateAddress(address, 2)}</span>
                      {copied ? (
                        <Check className="w-3 h-3 text-gcoin-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={disconnect}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn-glow bg-gradient-to-r from-gcoin-500 to-gcoin-600 hover:from-gcoin-400 hover:to-gcoin-500 text-white border-0 rounded-full px-5 py-2 text-sm font-semibold"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </span>
                  )}
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}
                  {isConnected && (
                    <div className="flex items-center gap-2 px-3 py-2.5 sm:hidden">
                      <Coins className="w-4 h-4 text-gcoin-400" />
                      <span className="text-sm font-semibold text-gcoin-400">
                        {parseFloat(balance).toLocaleString("en-IN", { maximumFractionDigits: 2 })} GCoin
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  );
}

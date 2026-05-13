"use client";

import { Coins, Github, Twitter, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-gcoin-400 to-gcoin-600 rounded-lg">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">G</span>
                <span className="text-foreground">Coin</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              India&apos;s premier INR-backed stablecoin on Polygon. Secure, fast, and compliant digital payments.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2.5">
              {["Buy GCoin", "Transfer", "Redeem", "Transaction History"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Documentation", href: "#" },
                { label: "Smart Contract", href: "https://polygonscan.com" },
                { label: "API Reference", href: "#" },
                { label: "Status", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {item.label}
                    {item.href.startsWith("http") && <ExternalLink className="w-3 h-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Connect</h4>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Github, href: "#", label: "GitHub" },
                { icon: MessageCircle, href: "#", label: "Discord" },
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Built on Polygon Mainnet
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GCoin. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

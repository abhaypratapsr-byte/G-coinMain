"use client";

import { motion } from "framer-motion";
import { Coins, ArrowRightLeft, TrendingDown, Clock, ShieldCheck, Banknote, Receipt, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Coins,
    title: "Buy GCoin",
    description: "Purchase GCoin instantly using Razorpay. Your INR is securely held in reserve.",
    color: "from-gcoin-400 to-gcoin-600",
    bgColor: "bg-gcoin-500/10",
    borderColor: "border-gcoin-500/20",
  },
  {
    icon: ArrowRightLeft,
    title: "P2P Transfer",
    description: "Send GCoin to any wallet address instantly with near-zero gas fees on Polygon.",
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: TrendingDown,
    title: "Redeem to INR",
    description: "Convert GCoin back to INR directly to your bank account. Minimum ₹100.",
    color: "from-gold-400 to-gold-600",
    bgColor: "bg-gold-500/10",
    borderColor: "border-gold-500/20",
  },
  {
    icon: Clock,
    title: "Transaction History",
    description: "Track all your buys, transfers, and redeems in one beautiful dashboard.",
    color: "from-purple-400 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    description: "Your funds are protected with industry-standard encryption and smart contract audits.",
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: Banknote,
    title: "Razorpay Integration",
    description: "Seamless payment processing with India's leading payment gateway.",
    color: "from-rose-400 to-rose-600",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    icon: Receipt,
    title: "Transparent Reserves",
    description: "Every GCoin is backed 1:1 by INR reserves. Fully auditable on-chain.",
    color: "from-cyan-400 to-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "You control your keys. We never hold your private keys or seed phrases.",
    color: "from-amber-400 to-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete stablecoin platform designed for the Indian market with world-class features.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className={`group card-hover glass border ${feature.borderColor} h-full`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 bg-gradient-to-br ${feature.color} bg-clip-text`} style={{ color: 'transparent', filter: 'none' }} />
                    <div className={`absolute w-6 h-6 bg-gradient-to-br ${feature.color} opacity-20 rounded-lg`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

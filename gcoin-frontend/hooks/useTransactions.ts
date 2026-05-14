"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import type { Transaction, ApiResponse, UserProfile } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (wallet: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<any>(
        `${API_URL}/user/transactions/${wallet}`
      );
      if (res.data.success && res.data.transactions) {
        setTransactions(res.data.transactions);
      } else {
        setError("No transactions data received");
      }
    } catch (err: any) {
      console.error("Fetch transactions error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (wallet: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<any>(
        `${API_URL}/user/profile/${wallet}`
      );
      if (res.data.success && res.data.profile) {
        setProfile(res.data.profile);
      } else {
        setError("No profile data received");
      }
    } catch (err: any) {
      console.error("Fetch profile error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    profile,
    loading,
    error,
    fetchTransactions,
    fetchProfile,
  };
}

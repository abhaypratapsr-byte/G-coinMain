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
      const res = await axios.get<ApiResponse<Transaction[]>>(
        `${API_URL}/user/transactions/${wallet}`
      );
      if (res.data.success && res.data.data) {
        setTransactions(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (wallet: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ApiResponse<UserProfile>>(
        `${API_URL}/user/profile/${wallet}`
      );
      if (res.data.success && res.data.data) {
        setProfile(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch profile");
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

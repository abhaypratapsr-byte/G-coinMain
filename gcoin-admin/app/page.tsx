'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BarChart3, ArrowDownUp, Send, LogOut, Sun, Moon,
  CheckCircle, AlertCircle, Loader2, X, Shield, Users,
  TrendingUp, TrendingDown, RefreshCw, Eye, EyeOff,
  ChevronRight, Activity, Clock, Banknote, Search, Copy,
  Zap, Globe, Radio, XCircle, Hash, Flame,
  ArrowRight, ChevronDown, Filter
} from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

type Tab = 'dashboard' | 'redeems' | 'transfers' | 'users' | 'system';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'loading' | 'warning';
  message: string;
}

interface BankDetails {
  accountNumber: string;
  ifsc: string;
  accountHolderName: string;
  bankName: string;
}

interface RedeemRequest {
  _id: string;
  wallet: string;
  amount: number;
  inrAmount: number;
  bankDetails: BankDetails;
  status: string;
  createdAt?: string;
}

interface TransferRecord {
  _id?: string;
  from: string;
  to: string;
  amount: number;
  status: string;
  createdAt?: string;
}

interface UserRecord {
  _id: string;
  wallet: string;
  email?: string;
  totalMinted?: number;
  createdAt?: string;
  isBlacklisted?: boolean;
  isKYCVerified?: boolean;
}

interface Stats {
  totalUsers: number;
  totalMinted: number;
  totalRedeemed: number;
  totalPayments: number;
  pendingRedeems: number;
  totalTransfers: number;
}

interface ContractStatus {
  paused: boolean;
  maxSupply: string;
  totalSupply: string;
  minRedeem: string;
  kycRequired: boolean;
}

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap');

    :root {
      --bg:         #03050a;
      --bg2:        #06090f;
      --surface:    #0a0d16;
      --surface2:   #0f1320;
      --surface3:   #161b2b;
      --surface4:   #1c2235;
      --border:     rgba(255,255,255,0.05);
      --border2:    rgba(255,255,255,0.09);
      --border3:    rgba(255,255,255,0.15);
      --text:       #e8ecf8;
      --text2:      #6b7899;
      --text3:      #333d5a;
      --gold:       #e8a020;
      --gold2:      #f5bf5a;
      --gold-dim:   rgba(232,160,32,0.1);
      --gold-glow:  rgba(232,160,32,0.25);
      --teal:       #00c8a8;
      --teal2:      #3dffdc;
      --teal-dim:   rgba(0,200,168,0.1);
      --red:        #f0385a;
      --red-dim:    rgba(240,56,90,0.1);
      --blue:       #3d8fff;
      --blue-dim:   rgba(61,143,255,0.1);
      --purple:     #a374ff;
      --purple-dim: rgba(163,116,255,0.1);
      --font-ui:    'Manrope', sans-serif;
      --font-head:  'Syne', sans-serif;
      --font-mono:  'Fira Code', monospace;
      --r:          10px;
      --r2:         16px;
      --r3:         22px;
      --sidebar-w:  220px;
    }

    .light-mode {
      --bg:       #f0f3fb;
      --bg2:      #e8ecf6;
      --surface:  #ffffff;
      --surface2: #f5f7fd;
      --surface3: #eceef8;
      --surface4: #e4e7f4;
      --border:   rgba(0,0,0,0.05);
      --border2:  rgba(0,0,0,0.09);
      --border3:  rgba(0,0,0,0.14);
      --text:     #070a14;
      --text2:    #485070;
      --text3:    #9099b8;
      --gold-dim:   rgba(220,140,10,0.09);
      --gold-glow:  rgba(220,140,10,0.18);
      --teal-dim:   rgba(0,180,148,0.09);
      --red-dim:    rgba(220,40,70,0.08);
      --blue-dim:   rgba(40,120,240,0.08);
      --purple-dim: rgba(140,90,230,0.08);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-ui);
      -webkit-font-smoothing: antialiased;
      font-size: 14px;
      line-height: 1.5;
    }

    .root {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      display: flex;
      transition: background 0.3s, color 0.3s;
    }

    /* ── Ambient Background ── */
    .ambient {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      overflow: hidden;
    }
    .ambient-blob {
      position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.035;
    }
    .ambient-blob.b1 {
      width: 700px; height: 700px;
      background: var(--gold);
      top: -200px; right: -100px;
    }
    .ambient-blob.b2 {
      width: 500px; height: 500px;
      background: var(--teal);
      bottom: -100px; left: 100px;
    }
    .ambient-blob.b3 {
      width: 400px; height: 400px;
      background: var(--purple);
      top: 40%; left: 30%;
    }
    /* dot grid */
    .ambient::after {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 28px 28px;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--sidebar-w);
      min-height: 100vh;
      background: var(--surface);
      border-right: 1px solid var(--border2);
      display: flex;
      flex-direction: column;
      position: sticky; top: 0;
      height: 100vh;
      flex-shrink: 0;
      z-index: 100;
    }

    .sidebar-logo {
      padding: 24px 20px 20px;
      border-bottom: 1px solid var(--border);
    }
    .logo-icon {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, var(--gold) 0%, #b87010 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 24px var(--gold-glow);
      margin-bottom: 12px;
    }
    .logo-name {
      font-family: var(--font-head);
      font-size: 19px; font-weight: 800;
      color: var(--text); letter-spacing: 0.02em;
    }
    .logo-badge {
      display: inline-flex; align-items: center; gap: 5px;
      margin-top: 4px; padding: 2px 8px; border-radius: 20px;
      background: var(--gold-dim);
      border: 1px solid rgba(232,160,32,0.2);
      font-family: var(--font-mono); font-size: 9px; font-weight: 600;
      color: var(--gold); letter-spacing: 0.12em; text-transform: uppercase;
    }
    .live-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--teal);
      box-shadow: 0 0 6px var(--teal);
      animation: blink 2s ease infinite;
    }
    @keyframes blink {
      0%,100% { opacity:1; }
      50%      { opacity:0.35; }
    }

    /* ── Nav ── */
    .sidebar-nav {
      flex: 1; padding: 12px 10px; overflow-y: auto;
    }
    .nav-section-label {
      font-family: var(--font-mono);
      font-size: 8.5px; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--text3); padding: 0 10px;
      margin: 16px 0 6px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 10px;
      font-size: 13px; font-weight: 600; color: var(--text2);
      background: transparent; border: none; cursor: pointer;
      width: 100%; text-align: left;
      transition: all 0.17s; position: relative;
      margin-bottom: 2px;
    }
    .nav-item:hover { color: var(--text); background: var(--surface2); }
    .nav-item.active {
      color: var(--gold);
      background: var(--gold-dim);
      border: 1px solid rgba(232,160,32,0.15);
    }
    .nav-item.active::before {
      content: '';
      position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 2px; border-radius: 0 2px 2px 0;
      background: var(--gold);
    }
    .nav-badge {
      margin-left: auto;
      background: var(--red);
      color: #fff; font-family: var(--font-mono);
      font-size: 9px; font-weight: 700;
      padding: 1px 6px; border-radius: 10px;
      min-width: 18px; text-align: center;
    }

    /* ── Sidebar footer ── */
    .sidebar-footer {
      padding: 12px 10px 20px;
      border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 4px;
    }
    .sidebar-footer-btn {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 12px; border-radius: 9px;
      font-size: 13px; font-weight: 600;
      background: transparent; border: none; cursor: pointer;
      width: 100%; transition: all 0.17s;
    }
    .sfb-theme { color: var(--text2); }
    .sfb-theme:hover { color: var(--text); background: var(--surface2); }
    .sfb-logout { color: var(--red); }
    .sfb-logout:hover { background: var(--red-dim); }

    /* ── Main ── */
    .main-area {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column;
      position: relative; z-index: 1;
    }

    /* ── Topbar ── */
    .topbar {
      height: 56px;
      background: rgba(10,13,22,0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center;
      padding: 0 28px; gap: 14px;
      position: sticky; top: 0; z-index: 50;
    }
    .light-mode .topbar {
      background: rgba(255,255,255,0.85);
    }
    .topbar-title {
      font-family: var(--font-head);
      font-size: 17px; font-weight: 700;
      color: var(--text); letter-spacing: 0.01em;
    }
    .topbar-sub {
      font-size: 12px; color: var(--text2);
      font-family: var(--font-mono);
    }

    /* ── Cards ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: var(--r2);
      position: relative; overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      border-color: var(--border3);
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    }
    .card-glow {
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent 0%, var(--glow-color, var(--gold)) 50%, transparent 100%);
      opacity: 0.5;
    }

    /* ── Stat card ── */
    .stat-card {
      padding: 22px;
    }
    .stat-val {
      font-family: var(--font-head);
      font-size: 32px; font-weight: 800;
      color: var(--text); line-height: 1;
      margin: 12px 0 6px;
      letter-spacing: -0.01em;
    }
    .stat-label {
      font-family: var(--font-mono);
      font-size: 9px; font-weight: 600;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--text3);
    }
    .stat-sub {
      font-size: 11px; color: var(--text2); margin-top: 3px;
    }
    .stat-icon {
      width: 38px; height: 38px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border2);
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px 22px; border-radius: var(--r);
      background: linear-gradient(135deg, var(--gold) 0%, #c07010 100%);
      color: #06090f; font-family: var(--font-ui); font-weight: 700; font-size: 13px;
      border: none; cursor: pointer;
      box-shadow: 0 4px 18px var(--gold-glow);
      transition: all 0.2s; white-space: nowrap;
      letter-spacing: 0.02em;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px var(--gold-glow); }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .btn-success {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 11px 20px; border-radius: var(--r);
      background: linear-gradient(135deg, var(--teal) 0%, #008870 100%);
      color: #06090f; font-family: var(--font-ui); font-weight: 700; font-size: 13px;
      border: none; cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,200,168,0.2);
      transition: all 0.2s;
    }
    .btn-success:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,200,168,0.35); }
    .btn-success:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .btn-danger {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 11px 20px; border-radius: var(--r);
      background: linear-gradient(135deg, var(--red) 0%, #c02040 100%);
      color: white; font-family: var(--font-ui); font-weight: 700; font-size: 13px;
      border: none; cursor: pointer;
      box-shadow: 0 4px 18px rgba(240,56,90,0.22);
      transition: all 0.2s;
    }
    .btn-danger:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(240,56,90,0.38); }
    .btn-danger:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .btn-ghost {
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 9px 16px; border-radius: var(--r);
      background: var(--surface2); color: var(--text2);
      font-family: var(--font-ui); font-weight: 600; font-size: 12px;
      border: 1px solid var(--border2); cursor: pointer; transition: all 0.17s;
    }
    .btn-ghost:hover { color: var(--text); border-color: var(--border3); background: var(--surface3); }
    .btn-ghost:disabled { opacity: 0.38; cursor: not-allowed; }

    /* ── Input ── */
    .inp {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: var(--r);
      padding: 11px 14px;
      color: var(--text);
      font-family: var(--font-mono); font-size: 13px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .inp:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-dim); }
    .inp::placeholder { color: var(--text3); font-family: var(--font-ui); font-size: 12px; }

    /* ── Search ── */
    .search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: var(--r); padding: 8px 12px;
      transition: border-color 0.2s;
    }
    .search-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-dim); }
    .search-inp {
      background: transparent; border: none; outline: none;
      color: var(--text); font-size: 12px; width: 180px;
      font-family: var(--font-ui);
    }
    .search-inp::placeholder { color: var(--text3); }

    /* ── Pills ── */
    .pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 9px; border-radius: 20px;
      font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
      font-family: var(--font-mono); text-transform: uppercase;
    }
    .pill::before {
      content: ''; width: 5px; height: 5px; border-radius: 50%;
      background: currentColor; opacity: 0.8;
    }
    .pill-gold    { background: var(--gold-dim);   color: var(--gold);   border: 1px solid rgba(232,160,32,0.2); }
    .pill-teal    { background: var(--teal-dim);   color: var(--teal);   border: 1px solid rgba(0,200,168,0.2); }
    .pill-red     { background: var(--red-dim);    color: var(--red);    border: 1px solid rgba(240,56,90,0.2); }
    .pill-blue    { background: var(--blue-dim);   color: var(--blue);   border: 1px solid rgba(61,143,255,0.2); }
    .pill-muted   { background: var(--surface3);   color: var(--text2);  border: 1px solid var(--border2); }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-box {
      background: var(--surface);
      border: 1px solid var(--border3);
      border-radius: var(--r3);
      padding: 36px; width: 100%; max-width: 460px;
      animation: modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes modalPop {
      from { opacity:0; transform:scale(0.88) translateY(16px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }

    /* ── Login ── */
    .login-root {
      min-height: 100vh; width: 100%;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; background: var(--bg); position: relative;
    }
    .login-card {
      width: 100%; max-width: 420px;
      background: var(--surface);
      border: 1px solid var(--border3);
      border-radius: var(--r3);
      padding: 44px 40px;
      position: relative; z-index: 2;
      animation: modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    .login-card::before {
      content: '';
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 50%; height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }

    /* ── Toast ── */
    .toast-wrap {
      position: fixed; top: 14px; right: 14px; z-index: 9999;
      display: flex; flex-direction: column; gap: 7px;
      max-width: 320px; pointer-events: none;
    }
    .toast {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 11px 13px; border-radius: 12px;
      font-size: 12px; font-weight: 600;
      box-shadow: 0 8px 28px rgba(0,0,0,0.4);
      pointer-events: auto;
      animation: tslide 0.22s cubic-bezier(0.34,1.56,0.64,1);
      border: 1px solid rgba(255,255,255,0.08);
    }
    @keyframes tslide {
      from { opacity:0; transform:translateX(50px) scale(0.9); }
      to   { opacity:1; transform:translateX(0) scale(1); }
    }
    .toast-success { background: #0a2218; color: var(--teal); }
    .toast-error   { background: #200a10; color: var(--red); }
    .toast-loading { background: var(--surface3); color: var(--text); }
    .toast-warning { background: #1e1400; color: var(--gold); }

    /* ── Shimmer ── */
    .shimmer {
      background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
      background-size: 200% 100%;
      animation: shim 1.5s infinite; border-radius: 8px;
    }
    @keyframes shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Misc ── */
    .spin { animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .mono { font-family: var(--font-mono); }
    .divider { height: 1px; background: var(--border); }

    .copy-btn {
      opacity: 0; padding: 3px; border-radius: 5px;
      background: none; border: none; color: var(--text3);
      cursor: pointer; transition: all 0.15s; flex-shrink: 0;
    }
    .copy-btn:hover { background: var(--surface3); color: var(--gold); opacity: 1 !important; }
    .crow:hover .copy-btn { opacity: 0.7; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--surface4); border-radius: 4px; }

    /* ── Section header ── */
    .sec-eyebrow {
      font-family: var(--font-mono); font-size: 9px; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--text3);
    }
    .sec-h {
      font-family: var(--font-head); font-size: 24px; font-weight: 800;
      color: var(--text); letter-spacing: 0.01em; margin-top: 4px; line-height: 1.1;
    }
    .sec-sub { font-size: 12px; color: var(--text2); margin-top: 4px; }

    /* ── Redeem card ── */
    .redeem-card-inner { padding: 22px 22px 22px 26px; }
    .status-strip {
      position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
      border-radius: 16px 0 0 16px;
    }
    .bank-tile {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 9px; padding: 10px 13px;
    }
    .bank-label {
      font-family: var(--font-mono); font-size: 8.5px; font-weight: 600;
      letter-spacing: 0.15em; text-transform: uppercase; color: var(--text3); margin-bottom: 3px;
    }
    .bank-val {
      font-family: var(--font-mono); font-size: 12px; font-weight: 500; color: var(--text);
    }

    /* ── Table ── */
    .tbl { border-radius: var(--r2); overflow: hidden; border: 1px solid var(--border2); }
    .tbl-head {
      display: grid;
      background: var(--surface2);
      padding: 10px 18px;
      border-bottom: 1px solid var(--border);
    }
    .tbl-row {
      display: grid;
      padding: 13px 18px;
      border-bottom: 1px solid var(--border);
      transition: background 0.14s; cursor: default;
    }
    .tbl-row:last-child { border-bottom: none; }
    .tbl-row:hover { background: var(--surface2); }
    .tbl-lbl {
      font-family: var(--font-mono); font-size: 8.5px; font-weight: 600;
      letter-spacing: 0.15em; text-transform: uppercase; color: var(--text3);
    }

    /* ── Input label ── */
    .inp-label {
      font-family: var(--font-mono); font-size: 9px; font-weight: 600;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--text3); margin-bottom: 7px; display: block;
    }

    /* ── Page content ── */
    .page-content {
      flex: 1; padding: 28px; overflow-y: auto; position: relative; z-index: 1;
    }

    /* ── Fade in ── */
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .fade-up { animation: fadeUp 0.3s ease both; }

    /* ── Mint modal ref input ── */
    .ref-notice {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 11px 13px; border-radius: var(--r);
      background: var(--gold-dim); border: 1px solid rgba(232,160,32,0.2);
      margin-bottom: 18px;
    }
    .ref-notice-text { font-size: 11px; color: var(--gold); line-height: 1.55; }
  `}</style>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);
  const add = useCallback((type: Toast['type'], message: string, duration = 4200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    if (type !== 'loading') setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);
  return { toasts, add, remove };
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
          {t.type === 'error'   && <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
          {t.type === 'loading' && <Loader2 size={14} className="spin" style={{ flexShrink: 0, marginTop: 1 }} />}
          {t.type === 'warning' && <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span style={{ flex: 1, lineHeight: 1.45 }}>{t.message}</span>
          {t.type !== 'loading' && (
            <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.6, padding: 2, flexShrink: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  open, title, body, children, onConfirm, onCancel,
  confirmLabel = 'Confirm', danger = false, loading = false
}: {
  open: boolean; title: string; body: string;
  children?: React.ReactNode;
  onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: danger ? 'var(--red-dim)' : 'var(--teal-dim)',
            border: `1px solid ${danger ? 'rgba(240,56,90,0.2)' : 'rgba(0,200,168,0.2)'}`,
          }}>
            {danger ? <Flame size={20} color="var(--red)" /> : <CheckCircle size={20} color="var(--teal)" />}
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--text2)', fontSize: 12, lineHeight: 1.65, marginBottom: children ? 18 : 24 }}>{body}</p>
        {children}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className={danger ? 'btn-danger' : 'btn-success'}
            style={{ flex: 1 }} onClick={onConfirm} disabled={loading}
          >
            {loading ? <Loader2 size={14} className="spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
type AccentKey = 'gold' | 'teal' | 'purple' | 'red' | 'blue' | 'muted';
const ACCENT_COLORS: Record<AccentKey, { color: string; dim: string; glow: string }> = {
  gold:   { color: 'var(--gold)',   dim: 'var(--gold-dim)',   glow: 'var(--gold)' },
  teal:   { color: 'var(--teal)',   dim: 'var(--teal-dim)',   glow: 'var(--teal)' },
  purple: { color: 'var(--purple)', dim: 'var(--purple-dim)', glow: 'var(--purple)' },
  red:    { color: 'var(--red)',    dim: 'var(--red-dim)',    glow: 'var(--red)' },
  blue:   { color: 'var(--blue)',   dim: 'var(--blue-dim)',   glow: 'var(--blue)' },
  muted:  { color: 'var(--text2)',  dim: 'var(--surface3)',   glow: 'var(--text2)' },
};

function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: number | string | null | undefined;
  icon: React.ElementType; accent: AccentKey; sub?: string;
}) {
  const c = ACCENT_COLORS[accent];
  return (
    <div className="card stat-card fade-up">
      <div className="card-glow" style={{ '--glow-color': c.glow } as React.CSSProperties} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: c.dim, borderColor: `${c.color}25` }}>
          <Icon size={15} color={c.color} />
        </div>
      </div>
      <div className="stat-val">
        {value === null || value === undefined
          ? <div className="shimmer" style={{ width: 90, height: 32, marginTop: 12 }} />
          : value}
      </div>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardTab({ stats, loading, onRefresh }: {
  stats: Stats | null; loading: boolean; onRefresh: () => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="sec-eyebrow">Overview</p>
          <h2 className="sec-h">Platform Metrics</h2>
          <p className="sec-sub">Live GCoin ecosystem data · Polygon Mainnet</p>
        </div>
        <button className="btn-ghost" onClick={onRefresh}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Users"     value={stats?.totalUsers ?? null}  icon={Users}      accent="gold"   sub="Registered wallets" />
        <StatCard label="Total Minted"    value={stats ? `${stats.totalMinted.toLocaleString('en-IN')} GCN` : null} icon={TrendingUp}  accent="teal"   sub="All-time tokens issued" />
        <StatCard label="Total Redeemed"  value={stats ? `${stats.totalRedeemed.toLocaleString('en-IN')} GCN` : null} icon={TrendingDown} accent="purple" sub="Tokens burned" />
        <StatCard label="Payments"        value={stats?.totalPayments ?? null} icon={Banknote}   accent="blue"   sub="Successful transactions" />
        <StatCard label="Pending Redeems" value={stats?.pendingRedeems ?? null} icon={Clock}      accent="red"    sub="Awaiting admin action" />
        <StatCard label="P2P Transfers"   value={stats?.totalTransfers ?? null} icon={Activity}   accent="muted"  sub="On-chain transfers" />
      </div>

      {/* System status */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="card-glow" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 8 }}>
            <Radio size={14} color="var(--teal)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>System Status</span>
          </div>
          {[
            { label: 'Polygon Mainnet',   status: 'online',     color: 'var(--teal)' },
            { label: 'Smart Contract', status: 'active',     color: 'var(--teal)' },
            { label: 'Backend API',    status: 'running',    color: 'var(--blue)' },
            { label: 'MongoDB',        status: 'connected',  color: 'var(--teal)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 20, background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: 'var(--text2)' }}>{item.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: item.color }}>{item.status}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: 'var(--text3)' }}>
            Contract: 0xa088…943f
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Redeems Tab ──────────────────────────────────────────────────────────────
function RedeemsTab({ redeems, totalCount, loading, onComplete, onReject, refresh, search, setSearch, page, setPage, totalPages, copyToClipboard }: {
  redeems: RedeemRequest[]; totalCount: number; loading: boolean;
  onComplete: (id: string, paymentRef: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  refresh: () => Promise<void>;
  search: string; setSearch: (s: string) => void;
  page: number; setPage: (p: number) => void; totalPages: number;
  copyToClipboard: (t: string) => void;
}) {
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleComplete = async () => {
    if (!completeId || !paymentRef.trim()) return;
    setActionLoading(true);
    await onComplete(completeId, paymentRef.trim());
    setActionLoading(false);
    setCompleteId(null);
    setPaymentRef('');
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(true);
    await onReject(rejectId, rejectReason.trim() || 'Rejected by admin');
    setActionLoading(false);
    setRejectId(null);
    setRejectReason('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="sec-eyebrow">Requests</p>
          <h2 className="sec-h">Pending Redeems</h2>
          <p className="sec-sub">{totalCount} request{totalCount !== 1 ? 's' : ''} awaiting action</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-wrap">
            <Search size={13} color="var(--text3)" />
            <input className="search-inp" placeholder="Search wallet or account…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-ghost" onClick={refresh}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 190, borderRadius: 16 }} />)}
        </div>
      ) : redeems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <ArrowDownUp size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text3)', opacity: 0.4 }} />
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 5 }}>No Pending Redeems</p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>All caught up — no redeem requests need your action.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {redeems.map(r => {
              const stripColor = r.status === 'completed' ? 'var(--teal)' : r.status === 'failed' ? 'var(--red)' : 'var(--gold)';
              return (
                <div key={r._id} className="card redeem-card-inner">
                  <div className="card-glow" style={{ '--glow-color': stripColor } as React.CSSProperties} />
                  <div className="status-strip" style={{ background: stripColor }} />

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--gold-dim)', border: '1px solid rgba(232,160,32,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ArrowDownUp size={16} color="var(--gold)" />
                      </div>
                      <div>
                        <div className="crow" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>
                            {r.wallet?.slice(0, 12)}…{r.wallet?.slice(-8)}
                          </span>
                          <button className="copy-btn" onClick={() => copyToClipboard(r.wallet || '')} title="Copy wallet">
                            <Copy size={11} />
                          </button>
                        </div>
                      {/* @ts-ignore */}
                      <a href={r.burnTxHash ? `https://polygonscan.com/tx/${r.burnTxHash}` : '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <span className={`pill ${r.status === 'completed' ? 'pill-teal' : r.status === 'failed' ? 'pill-red' : 'pill-gold'}`}>
                          {r.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </a>
                        {r.createdAt && (
                          <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: 'var(--text3)' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                        {(r.amount ?? 0).toLocaleString('en-IN')}
                        <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, marginLeft: 4 }}>GCN</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal)', marginTop: 3 }}>
                        ₹{(r.inrAmount ?? r.amount ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Bank details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Account No.', value: r.bankDetails?.accountNumber },
                      { label: 'IFSC',        value: r.bankDetails?.ifsc },
                      { label: 'Holder',      value: r.bankDetails?.accountHolderName },
                      { label: 'Bank',        value: r.bankDetails?.bankName },
                    ].map(({ label, value }) => (
                      <div key={label} className="bank-tile">
                        <p className="bank-label">{label}</p>
                        <p className="bank-val">{value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {r.status === 'completed' ? (
                    <div style={{ padding: '11px 14px', background: 'var(--teal-dim)', border: '1px solid rgba(0,200,168,0.2)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle size={14} color="var(--teal)" />
                      <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 12 }}>Completed — Tokens burned & payout sent</span>
                    </div>
                  ) : r.status === 'failed' || r.status === 'rejected' ? (
                    <div style={{ padding: '11px 14px', background: 'var(--red-dim)', border: '1px solid rgba(240,56,90,0.2)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <XCircle size={14} color="var(--red)" />
                      <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12 }}>Rejected / Failed — No payout</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-success" style={{ flex: 1 }} onClick={() => setCompleteId(r._id)}>
                        <CheckCircle size={14} /> Complete & Payout
                      </button>
                      <button className="btn-danger" style={{ flex: 1 }} onClick={() => setRejectId(r._id)}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Prev
              </button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text2)', padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border2)' }}>
                {page} / {totalPages}
              </span>
              <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Complete Modal — requires payment reference */}
      <ConfirmModal
        open={!!completeId}
        title="Complete Redeem"
        body="Enter the UPI/NEFT transaction reference ID confirming that the INR payout was sent. Tokens will be burned on-chain after this."
        confirmLabel="Confirm & Burn Tokens"
        loading={actionLoading}
        onConfirm={handleComplete}
        onCancel={() => { setCompleteId(null); setPaymentRef(''); }}
      >
        <div>
          <div className="ref-notice">
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="ref-notice-text">Only mark complete AFTER you have sent the INR manually. This action is irreversible.</p>
          </div>
          <label className="inp-label">Payment Reference ID *</label>
          <input
            className="inp"
            placeholder="e.g. UTR12345678901234 or UPI Ref"
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            style={{ marginBottom: 20 }}
          />
        </div>
      </ConfirmModal>

      {/* Reject Modal */}
      <ConfirmModal
        open={!!rejectId}
        title="Reject Redeem?"
        body="The user's GCN tokens will NOT be burned. Provide a reason so the user knows why their request was rejected."
        confirmLabel="Reject Request"
        loading={actionLoading}
        danger
        onConfirm={handleReject}
        onCancel={() => { setRejectId(null); setRejectReason(''); }}
      >
        <div>
          <label className="inp-label" style={{ marginTop: 4 }}>Reason (optional)</label>
          <input
            className="inp"
            placeholder="e.g. Invalid bank details"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            style={{ marginBottom: 20 }}
          />
        </div>
      </ConfirmModal>
    </div>
  );
}

// ─── Transfers Tab ────────────────────────────────────────────────────────────
function TransfersTab({ transfers, totalCount, loading, search, setSearch, page, setPage, totalPages, copyToClipboard }: {
  transfers: TransferRecord[]; totalCount: number; loading: boolean;
  search: string; setSearch: (s: string) => void;
  page: number; setPage: (p: number) => void; totalPages: number;
  copyToClipboard: (t: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="sec-eyebrow">On-Chain</p>
          <h2 className="sec-h">P2P Transfers</h2>
          <p className="sec-sub">{totalCount} transfer{totalCount !== 1 ? 's' : ''} on Polygon Mainnet</p>
        </div>
        <div className="search-wrap">
          <Search size={13} color="var(--text3)" />
          <input className="search-inp" placeholder="Search wallet address…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 2 }} />)}
        </div>
      ) : transfers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Send size={38} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text3)', opacity: 0.35 }} />
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 5 }}>No Transfers Yet</p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>P2P transfers appear here as users send GCoin on-chain.</p>
        </div>
      ) : (
        <>
          <div className="tbl">
            <div className="tbl-head" style={{ gridTemplateColumns: '1fr 1fr 120px 100px' }}>
              {['From', 'To', 'Amount', 'Status'].map(h => (
                <div key={h} className="tbl-lbl" style={{ textAlign: h === 'Amount' || h === 'Status' ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>
            {transfers.map((t, idx) => (
              <div key={t._id || idx} className="crow tbl-row" style={{ gridTemplateColumns: '1fr 1fr 120px 100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{t.from?.slice(0, 13)}…</span>
                  <button className="copy-btn" onClick={() => copyToClipboard(t.from || '')}><Copy size={10} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{t.to?.slice(0, 13)}…</span>
                  <button className="copy-btn" onClick={() => copyToClipboard(t.to || '')}><Copy size={10} /></button>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t.amount}</span>
                  <span className="mono" style={{ fontSize: '9.5px', color: 'var(--text3)', marginLeft: 3 }}>GCN</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {/* @ts-ignore */}
                  <a href={`https://polygonscan.com/tx/${t.txHash}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <span className={`pill ${t.status === 'confirmed' ? 'pill-teal' : 'pill-gold'}`}>
                      {t.status?.toUpperCase()}
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Prev
              </button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text2)', padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border2)' }}>
                {page} / {totalPages}
              </span>
              <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── System Tab ───────────────────────────────────────────────────────────────
function SystemTab({ status, loading, onPause, onUnpause, onUpdateMaxSupply, onUpdateMinRedeem, onManualMint }: {
  status: ContractStatus | null; loading: boolean;
  onPause: () => Promise<void>;
  onUnpause: () => Promise<void>;
  onUpdateMaxSupply: (amount: number) => Promise<void>;
  onUpdateMinRedeem: (amount: number) => Promise<void>;
  onManualMint: (to: string, amount: number, reason: string) => Promise<void>;
}) {
  const [newMax, setNewMax] = useState('');
  const [newMin, setNewMin] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [mintAmt, setMintAmt] = useState('');
  const [mintReason, setMintReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleManualMint = async () => {
    if (!mintTo || !mintAmt) return;
    setActionLoading(true);
    await onManualMint(mintTo, Number(mintAmt), mintReason);
    setActionLoading(false);
    setMintTo(''); setMintAmt(''); setMintReason('');
  };

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="sec-eyebrow">Controls</p>
          <h2 className="sec-h">Contract Management</h2>
          <p className="sec-sub">Global configuration & emergency controls</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {/* Status Card */}
        <div className="card" style={{ padding: 24 }}>
          <div className="card-glow" style={{ '--glow-color': status?.paused ? 'var(--red)' : 'var(--teal)' } as any} />
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Operational Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: status?.paused ? 'var(--red)' : 'var(--teal)', boxShadow: `0 0 10px ${status?.paused ? 'var(--red)' : 'var(--teal)'}` }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{status?.paused ? 'CONTRACT PAUSED' : 'SYSTEM OPERATIONAL'}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
            {status?.paused
              ? 'All transfers, minting, and burning are currently disabled.'
              : 'The contract is live. All functions are available to users.'}
          </p>
          {status?.paused ? (
            <button className="btn-success" style={{ width: '100%' }} onClick={onUnpause} disabled={loading}>Resume Contract</button>
          ) : (
            <button className="btn-danger" style={{ width: '100%' }} onClick={onPause} disabled={loading}>Pause Contract</button>
          )}
        </div>

        {/* Limits Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Supply & Redeems</h3>
          <div style={{ marginBottom: 16 }}>
            <label className="inp-label">Max Supply Cap</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="inp" value={newMax} onChange={e => setNewMax(e.target.value)} placeholder={status?.maxSupply || '0'} />
              <button className="btn-ghost" onClick={() => onUpdateMaxSupply(Number(newMax))}>Update</button>
            </div>
          </div>
          <div>
            <label className="inp-label">Min Redeem Amount</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="inp" value={newMin} onChange={e => setNewMin(e.target.value)} placeholder={status?.minRedeem || '0'} />
              <button className="btn-ghost" onClick={() => onUpdateMinRedeem(Number(newMin))}>Update</button>
            </div>
          </div>
        </div>

        {/* Manual Mint Card */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Manual Minting (Admin Only)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label className="inp-label">Recipient Wallet</label>
              <input className="inp" placeholder="0x…" value={mintTo} onChange={e => setMintTo(e.target.value)} />
            </div>
            <div>
              <label className="inp-label">Amount (GCN)</label>
              <input className="inp" placeholder="0.00" value={mintAmt} onChange={e => setMintAmt(e.target.value)} />
            </div>
            <div>
              <label className="inp-label">Reason</label>
              <input className="inp" placeholder="Admin adjustment" value={mintReason} onChange={e => setMintReason(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleManualMint} disabled={actionLoading || !mintTo || !mintAmt}>
              {actionLoading ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
              Mint Tokens
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users, totalCount, loading, search, setSearch, page, setPage, totalPages, copyToClipboard, onBlacklist, onUnblacklist, onVerifyKYC, onRevokeKYC }: {
  users: UserRecord[]; totalCount: number; loading: boolean;
  search: string; setSearch: (s: string) => void;
  page: number; setPage: (p: number) => void; totalPages: number;
  copyToClipboard: (t: string) => void;
  onBlacklist: (wallet: string) => Promise<void>;
  onUnblacklist: (wallet: string) => Promise<void>;
  onVerifyKYC: (wallet: string) => Promise<void>;
  onRevokeKYC: (wallet: string) => Promise<void>;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="sec-eyebrow">Registry</p>
          <h2 className="sec-h">User Management</h2>
          <p className="sec-sub">{totalCount} registered wallet{totalCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="search-wrap">
          <Search size={13} color="var(--text3)" />
          <input className="search-inp" placeholder="Search wallet or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 2 }} />)}
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Users size={38} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text3)', opacity: 0.35 }} />
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 5 }}>No Users Found</p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Users appear here once they connect their wallet.</p>
        </div>
      ) : (
        <>
          <div className="tbl">
            <div className="tbl-head" style={{ gridTemplateColumns: '1fr 120px 100px 100px 180px' }}>
              {['Wallet', 'Minted', 'Status', 'KYC', 'Actions'].map(h => (
                <div key={h} className="tbl-lbl">{h}</div>
              ))}
            </div>
            {users.map(u => (
              <div key={u._id} className="crow tbl-row" style={{ gridTemplateColumns: '1fr 120px 100px 100px 180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{u.wallet?.slice(0, 10)}…{u.wallet?.slice(-4)}</span>
                  <button className="copy-btn" onClick={() => copyToClipboard(u.wallet || '')}><Copy size={10} /></button>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                    {(u.totalMinted ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="mono" style={{ fontSize: '9.5px', color: 'var(--text3)', marginLeft: 3 }}>GCN</span>
                </div>
                <div>
                  <span className={`pill ${u.isBlacklisted ? 'pill-red' : 'pill-teal'}`}>
                    {u.isBlacklisted ? 'BLACKLISTED' : 'ACTIVE'}
                  </span>
                </div>
                <div>
                  <span className={`pill ${u.isKYCVerified ? 'pill-blue' : 'pill-muted'}`}>
                    {u.isKYCVerified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {u.isBlacklisted ? (
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => onUnblacklist(u.wallet)}>Unblacklist</button>
                  ) : (
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--red)' }} onClick={() => onBlacklist(u.wallet)}>Blacklist</button>
                  )}
                  {u.isKYCVerified ? (
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => onRevokeKYC(u.wallet)}>Revoke KYC</button>
                  ) : (
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--blue)' }} onClick={() => onVerifyKYC(u.wallet)}>Verify KYC</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Prev
              </button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text2)', padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border2)' }}>
                {page} / {totalPages}
              </span>
              <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [dark, setDark]           = useState(true);
  const [isAuth, setIsAuth]       = useState(false);
  const [adminKey, setAdminKey]   = useState('');
  const [showKey, setShowKey]     = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [stats,     setStats]     = useState<Stats | null>(null);
  const [redeems,   setRedeems]   = useState<RedeemRequest[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [users,     setUsers]     = useState<UserRecord[]>([]);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [tabLoading,   setTabLoading]   = useState(false);
  const [showLogout,   setShowLogout]   = useState(false);

  const toast  = useToasts();
  const keyRef = useRef(adminKey);
  useEffect(() => { keyRef.current = adminKey; }, [adminKey]);

  // Restore session from sessionStorage (more secure than localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('gcoin_admin_key');
    if (saved) setAdminKey(saved);
  }, []);

  const ITEMS = 6;

  // Pagination + search states
  const [redeemPage,    setRedeemPage]    = useState(1);
  const [redeemSearch,  setRedeemSearch]  = useState('');
  const [transferPage,  setTransferPage]  = useState(1);
  const [transferSearch,setTransferSearch]= useState('');
  const [userPage,      setUserPage]      = useState(1);
  const [userSearch,    setUserSearch]    = useState('');

  // ── API ────────────────────────────────────────────────────────────────────
  const parseStats = (data: any): Stats => {
    const s = data?.data?.stats || data?.data || data?.stats || data || {};
    return {
      totalUsers:     s.totalUsers     ?? s.users        ?? 0,
      totalMinted:    s.totalMinted    ?? s.minted       ?? 0,
      totalRedeemed:  s.totalRedeemed  ?? s.redeemed     ?? 0,
      totalPayments:  s.totalPayments  ?? s.payments     ?? 0,
      pendingRedeems: s.pendingRedeems ?? s.pending      ?? 0,
      totalTransfers: s.totalTransfers ?? s.transfers    ?? 0,
    };
  };

  const fetchStats = useCallback(async (key?: string) => {
    const k = key || keyRef.current;
    if (!k) return;
    setStatsLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { 'x-admin-key': k },
      });
      setStats(parseStats(data));
    } catch (err: any) {
      toast.add('error', err.response?.data?.message || err.message || 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRedeems = useCallback(async () => {
    if (!keyRef.current) return;
    setTabLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/redeems`, {
        headers: { 'x-admin-key': keyRef.current },
      });
      setRedeems(data?.data?.redeems || data?.redeems || []);
      setRedeemPage(1);
    } catch (err: any) {
      toast.add('error', err.response?.data?.message || err.message || 'Failed to load redeems');
    } finally {
      setTabLoading(false);
    }
  }, []);

  const fetchContractStatus = useCallback(async () => {
    if (!keyRef.current) return;
    setTabLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/contract-status`, {
        headers: { 'x-admin-key': keyRef.current },
      });
      setContractStatus(data.status);
    } catch (err: any) {
      toast.add('error', 'Failed to load contract status');
    } finally {
      setTabLoading(false);
    }
  }, []);

  const pauseContract = async () => {
    const tid = toast.add('loading', 'Pausing contract…');
    try {
      await axios.post(`${API_URL}/api/admin/contract/pause`, {}, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'Contract paused');
      fetchContractStatus();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Pause failed');
    }
  };

  const unpauseContract = async () => {
    const tid = toast.add('loading', 'Unpausing contract…');
    try {
      await axios.post(`${API_URL}/api/admin/contract/unpause`, {}, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'Contract unpaused');
      fetchContractStatus();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Unpause failed');
    }
  };

  const updateMaxSupply = async (amount: number) => {
    const tid = toast.add('loading', 'Updating max supply…');
    try {
      await axios.post(`${API_URL}/api/admin/contract/max-supply`, { amount }, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'Max supply updated');
      fetchContractStatus();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Update failed');
    }
  };

  const updateMinRedeem = async (amount: number) => {
    const tid = toast.add('loading', 'Updating min redeem…');
    try {
      await axios.post(`${API_URL}/api/admin/contract/min-redeem`, { amount }, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'Min redeem updated');
      fetchContractStatus();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Update failed');
    }
  };

  const manualMint = async (to: string, amount: number, reason: string) => {
    const tid = toast.add('loading', 'Minting tokens…');
    try {
      await axios.post(`${API_URL}/api/admin/contract/mint`, { to, amount, reason }, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', `Minted ${amount} GCN to ${to}`);
      fetchStats();
      fetchContractStatus();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Mint failed');
    }
  };

  const blacklistUser = async (wallet: string) => {
    const tid = toast.add('loading', 'Blacklisting user…');
    try {
      await axios.post(`${API_URL}/api/admin/users/${wallet}/blacklist`, {}, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'User blacklisted');
      fetchUsers();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Blacklist failed');
    }
  };

  const unblacklistUser = async (wallet: string) => {
    const tid = toast.add('loading', 'Unblacklisting user…');
    try {
      await axios.post(`${API_URL}/api/admin/users/${wallet}/unblacklist`, {}, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'User unblacklisted');
      fetchUsers();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'Unblacklist failed');
    }
  };

  const verifyKYC = async (wallet: string) => {
    const tid = toast.add('loading', 'Verifying KYC…');
    try {
      await axios.post(`${API_URL}/api/admin/users/${wallet}/verify-kyc`, {}, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'KYC verified');
      fetchUsers();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'KYC verification failed');
    }
  };

  const revokeKYC = async (wallet: string) => {
    const tid = toast.add('loading', 'Revoking KYC…');
    try {
      await axios.post(`${API_URL}/api/admin/users/${wallet}/revoke-kyc`, {}, { headers: { 'x-admin-key': keyRef.current } });
      toast.remove(tid);
      toast.add('success', 'KYC revoked');
      fetchUsers();
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', 'KYC revocation failed');
    }
  };

  const fetchTransfers = useCallback(async () => {
    if (!keyRef.current) return;
    setTabLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/transfers`, {
        headers: { 'x-admin-key': keyRef.current },
      });
      setTransfers(data?.data?.transfers || data?.transfers || []);
      setTransferPage(1);
    } catch (err: any) {
      toast.add('error', err.response?.data?.message || err.message || 'Failed to load transfers');
    } finally {
      setTabLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!keyRef.current) return;
    setTabLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { 'x-admin-key': keyRef.current },
      });
      setUsers(data?.data?.users || data?.users || []);
      setUserPage(1);
    } catch (err: any) {
      // If endpoint doesn't exist yet, silently fail
      if (err.response?.status !== 404) {
        toast.add('error', err.response?.data?.message || err.message || 'Failed to load users');
      }
    } finally {
      setTabLoading(false);
    }
  }, []);

  const completeRedeem = useCallback(async (id: string, paymentRef: string) => {
    const k = keyRef.current;
    const tid = toast.add('loading', 'Burning tokens & recording payout…');
    try {
      await axios.post(
        `${API_URL}/api/admin/redeems/${id}/complete`,
        { id, paymentRef },
        { headers: { 'x-admin-key': k } }
      );
      toast.remove(tid);
      toast.add('success', '✅ Redeem completed — tokens burned & payout recorded');
      await Promise.all([fetchRedeems(), fetchStats()]);
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', err.response?.data?.message || err.message || 'Failed to complete redeem');
    }
  }, [fetchRedeems, fetchStats]);

  const rejectRedeem = useCallback(async (id: string, reason: string) => {
    const k = keyRef.current;
    const tid = toast.add('loading', 'Rejecting redeem request…');
    try {
      await axios.post(
        `${API_URL}/api/admin/redeems/${id}/reject`,
        { id, reason },
        { headers: { 'x-admin-key': k } }
      );
      toast.remove(tid);
      toast.add('success', 'Redeem request rejected');
      await Promise.all([fetchRedeems(), fetchStats()]);
    } catch (err: any) {
      toast.remove(tid);
      toast.add('error', err.response?.data?.message || err.message || 'Failed to reject redeem');
    }
  }, [fetchRedeems, fetchStats]);

  const handleLogin = async () => {
    const k = adminKey.trim();
    if (!k) { toast.add('error', 'Enter your admin key'); return; }
    setLoginLoading(true);
    const tid = toast.add('loading', 'Authenticating…');
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { 'x-admin-key': k },
      });
      toast.remove(tid);

      // ✅ Role check: backend should return role: "admin"
      if (data?.role && data.role !== 'admin') {
        toast.add('error', 'Not authorized as admin');
        setLoginLoading(false);
        return;
      }

      // Store in sessionStorage (cleared when tab closes) — safer than localStorage
      sessionStorage.setItem('gcoin_admin_key', k);
      setStats(parseStats(data));
      setIsAuth(true);
      toast.add('success', 'Access granted — welcome back');
    } catch (err: any) {
      toast.remove(tid);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.add('error', 'Invalid admin key — access denied');
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        toast.add('error', 'Cannot reach backend — check if server is running');
      } else {
        toast.add('error', err.response?.data?.message || err.message || 'Login failed');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Auto-refresh stats every 30s while on dashboard
  useEffect(() => {
    if (!isAuth) return;
    fetchStats();
    const interval = setInterval(() => {
      if (!document.hidden) fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuth]);

  // Fetch on tab switch
  useEffect(() => {
    if (!isAuth) return;
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'redeems')   fetchRedeems();
    if (activeTab === 'transfers') fetchTransfers();
    if (activeTab === 'users')     fetchUsers();
    if (activeTab === 'system')    fetchContractStatus();
  }, [activeTab, isAuth]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.add('success', 'Copied to clipboard');
  };

  // ── Filter + paginate ──────────────────────────────────────────────────────
  const filtR  = redeems.filter(r =>
    r.wallet?.toLowerCase().includes(redeemSearch.toLowerCase()) ||
    r.bankDetails?.accountNumber?.toLowerCase().includes(redeemSearch.toLowerCase())
  );
  const filtT  = transfers.filter(t =>
    t.from?.toLowerCase().includes(transferSearch.toLowerCase()) ||
    t.to?.toLowerCase().includes(transferSearch.toLowerCase())
  );
  const filtU  = users.filter(u =>
    u.wallet?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const pagR   = filtR.slice((redeemPage - 1) * ITEMS, redeemPage * ITEMS);
  const pagT   = filtT.slice((transferPage - 1) * ITEMS, transferPage * ITEMS);
  const pagU   = filtU.slice((userPage - 1) * ITEMS, userPage * ITEMS);
  const pagesR = Math.max(1, Math.ceil(filtR.length / ITEMS));
  const pagesT = Math.max(1, Math.ceil(filtT.length / ITEMS));
  const pagesU = Math.max(1, Math.ceil(filtU.length / ITEMS));

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'redeems',   label: 'Redeems',   icon: ArrowDownUp, badge: stats?.pendingRedeems },
    { key: 'transfers', label: 'Transfers',  icon: Send },
    { key: 'users',     label: 'Users',      icon: Users },
    { key: 'system',    label: 'System',     icon: Shield },
  ];

  const tabTitles: Record<Tab, { title: string; sub: string }> = {
    dashboard: { title: 'Dashboard', sub: 'Platform overview & metrics' },
    redeems:   { title: 'Redeems',   sub: 'Manage GCN redemption requests' },
    transfers: { title: 'Transfers', sub: 'On-chain P2P transfer history' },
    users:     { title: 'Users',     sub: 'Registered wallet registry' },
    system:    { title: 'System',    sub: 'Contract status & global controls' },
  };

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!isAuth) {
    return (
      <div className={dark ? 'root' : 'root light-mode'} style={{ display: 'block' }}>
        <GlobalStyles />
        <ToastContainer toasts={toast.toasts} remove={toast.remove} />
        <div className="ambient">
          <div className="ambient-blob b1" />
          <div className="ambient-blob b2" />
          <div className="ambient-blob b3" />
        </div>

        <div className="login-root">
          <div className="login-card">
            {/* Logo */}
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--gold) 0%, #9a6000 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 36px var(--gold-glow)',
              }}>
                <Shield size={28} color="#03050a" />
              </div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '0.03em' }}>GCoin Admin</h1>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 5 }}>Stablecoin Management Portal</p>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
                <Globe size={11} />
                Polygon Mainnet · 0xa088…943f
              </div>
            </div>

            {/* Key input */}
            <div style={{ marginBottom: 12 }}>
              <label className="inp-label">Admin Secret Key</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="inp"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your secret key…"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loginLoading && handleLogin()}
                  style={{ paddingRight: 44 }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? <Loader2 size={15} className="spin" /> : <Zap size={15} />}
              {loginLoading ? 'Authenticating…' : 'Access Dashboard'}
            </button>

            <button
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setDark(d => !d)}
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div className={dark ? 'root' : 'root light-mode'}>
      <GlobalStyles />
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />
      <div className="ambient">
        <div className="ambient-blob b1" />
        <div className="ambient-blob b2" />
        <div className="ambient-blob b3" />
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Shield size={20} color="#03050a" /></div>
          <div className="logo-name">GCoin</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div className="logo-badge">
              <div className="live-dot" />
              ADMIN
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`nav-item${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={15} />
              {tab.label}
              {!!tab.badge && tab.badge > 0 && (
                <span className="nav-badge">{tab.badge}</span>
              )}
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: 24 }}>Network</div>
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', margin: '0 0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 5px var(--teal)', animation: 'blink 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: 'var(--teal)', fontWeight: 600 }}>POLYGON MAINNET</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)', lineHeight: 1.5 }}>
              Chain ID: 137<br />
              Contract: 0xa088…943f
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-footer-btn sfb-theme"
            onClick={() => setDark(d => !d)}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            className="sidebar-footer-btn sfb-logout"
            onClick={() => setShowLogout(true)}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title">{tabTitles[activeTab].title}</div>
            <div className="topbar-sub">{tabTitles[activeTab].sub}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-ghost"
              onClick={() => {
                fetchStats();
                if (activeTab === 'redeems')   fetchRedeems();
                if (activeTab === 'transfers') fetchTransfers();
                if (activeTab === 'users')     fetchUsers();
              }}
              title="Refresh"
            >
              <RefreshCw size={13} className={(statsLoading || tabLoading) ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {activeTab === 'dashboard' && (
            <DashboardTab stats={stats} loading={statsLoading} onRefresh={fetchStats} />
          )}
          {activeTab === 'redeems' && (
            <RedeemsTab
              redeems={pagR}
              totalCount={filtR.length}
              loading={tabLoading}
              onComplete={completeRedeem}
              onReject={rejectRedeem}
              refresh={fetchRedeems}
              search={redeemSearch}
              setSearch={setRedeemSearch}
              page={redeemPage}
              setPage={setRedeemPage}
              totalPages={pagesR}
              copyToClipboard={copyToClipboard}
            />
          )}
          {activeTab === 'transfers' && (
            <TransfersTab
              transfers={pagT}
              totalCount={filtT.length}
              loading={tabLoading}
              search={transferSearch}
              setSearch={setTransferSearch}
              page={transferPage}
              setPage={setTransferPage}
              totalPages={pagesT}
              copyToClipboard={copyToClipboard}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab
              users={pagU}
              totalCount={filtU.length}
              loading={tabLoading}
              search={userSearch}
              setSearch={setUserSearch}
              page={userPage}
              setPage={setUserPage}
              totalPages={pagesU}
              copyToClipboard={copyToClipboard}
              onBlacklist={blacklistUser}
              onUnblacklist={unblacklistUser}
              onVerifyKYC={verifyKYC}
              onRevokeKYC={revokeKYC}
            />
          )}
          {activeTab === 'system' && (
            <SystemTab
              status={contractStatus}
              loading={tabLoading}
              onPause={pauseContract}
              onUnpause={unpauseContract}
              onUpdateMaxSupply={updateMaxSupply}
              onUpdateMinRedeem={updateMinRedeem}
              onManualMint={manualMint}
            />
          )}
        </main>
      </div>

      {/* Logout confirm */}
      <ConfirmModal
        open={showLogout}
        title="Log Out?"
        body="Your session key will be cleared. You'll need to re-enter your admin key to log back in."
        confirmLabel="Log Out"
        danger
        onConfirm={() => {
          sessionStorage.removeItem('gcoin_admin_key');
          setIsAuth(false);
          setAdminKey('');
          setStats(null);
          setShowLogout(false);
        }}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}

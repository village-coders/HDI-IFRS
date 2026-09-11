import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { api, isTokenExpired } from "./services/api.js";
import {
  LayoutDashboard, Bell, BookOpen, Users as UsersIcon, LogOut, ChevronDown,
  ChevronRight, Search, Plus, CheckCircle2, XCircle, Clock3, RotateCcw,
  Eye, EyeOff, Trash2, ShieldCheck, Wallet, Landmark, Building2, Lock, User as UserIcon,
  Menu as MenuIcon, X, FileEdit, FilePlus2, BadgeCheck, CircleDollarSign,
  PlusCircle, Calculator, ArrowRight, MessageSquare,
  ChevronLeft, ChevronRight as ChevronRightIcon, Building, MoreVertical,
  Shield, DollarSign, Activity, PanelLeftClose, PanelLeftOpen, FileText,
  TrendingUp, RefreshCw, Key, FileImage, Download, FolderOpen, CreditCard, Mail, Check, AlertCircle
} from "lucide-react";
import hdiLogo from "./hdi_logo.png";

/* ---------------------------------------------------------------- */
/* THEME & DESIGN SYSTEM                                             */
/* ---------------------------------------------------------------- */
const T = {
  greenPrimary: "#008751",   // HDI vibrant green
  greenHover:   "#007043",
  greenLight:   "#E6F4EA",
  greenGlow:    "#10B981",
  bgApp:        "#F8FAFC",
  bgSidebar:    "#FFFFFF",
  borderLight:  "#E2E8F0",
  textDark:     "#1E293B",   // Soft dark slate
  textMuted:    "#64748B",
  white:        "#FFFFFF",
};

const STATUS = {
  new:                   { label: "Review List",         color: "#2563EB", bg: "#EFF6FF" },
  reviewed:              { label: "Awaiting Approval",   color: "#4338CA", bg: "#EEF2FF" },
  verified:              { label: "Awaiting Approval",   color: "#4338CA", bg: "#EEF2FF" }, // backward compatible
  approved_for_payment:  { label: "Approved For Payment", color: "#0D9488", bg: "#CCFBF1" },
  paid:                  { label: "Paid",                 color: "#16A34A", bg: "#DCFCE7" },
  rejected:              { label: "Rejected",             color: "#DC2626", bg: "#FEE2E2" },
};

const fmtN = (n) => "₦" + (Number(n) || 0).toLocaleString();

export function getClaimDateTime(claim) {
  if (!claim) return { date: "N/A", time: "N/A", full: "N/A" };
  let dateStr = claim.date || "";
  let timeStr = claim.time || "";

  if (claim.createdAt) {
    const d = new Date(claim.createdAt);
    if (!isNaN(d.getTime())) {
      if (!dateStr) dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      if (!timeStr) timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    }
  }

  if (!timeStr && claim.history && claim.history.length > 0) {
    const firstHist = claim.history[0];
    if (firstHist && firstHist.timestamp) {
      const d = new Date(firstHist.timestamp);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      }
    }
  }

  if (!timeStr) timeStr = "10:00:00 AM";
  if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);

  return {
    date: dateStr,
    time: timeStr,
    full: `${dateStr} at ${timeStr}`
  };
}

/* ---------------------------------------------------------------- */
/* TOAST NOTIFICATION SYSTEM                                          */
/* ---------------------------------------------------------------- */
let _toastEmit = null;
export function useToast() {
  const [toasts, setToasts] = useState([]);
  _toastEmit = (msg, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  return { toasts, removeToast: (id) => setToasts(prev => prev.filter(t => t.id !== id)) };
}
function toast(msg, type = "error") {
  if (_toastEmit) _toastEmit(msg, type);
  else console.error(msg);
}

function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return createPortal(
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
      {toasts.map(t => {
        const isError   = t.type === "error";
        const isSuccess = t.type === "success";
        return (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 16px",
              background: isError ? "#fff1f2" : isSuccess ? "#f0fdf4" : "#fffbeb",
              border: `1.5px solid ${isError ? "#fecaca" : isSuccess ? "#bbf7d0" : "#fde68a"}`,
              borderRadius: "0.875rem",
              boxShadow: "0 8px 24px -4px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.08)",
              animation: "scaleIn 0.18s cubic-bezier(0.34,1.4,0.64,1)",
            }}
          >
            <span style={{ fontSize: 15, flexShrink: 0 }}>{isError ? "❌" : isSuccess ? "✅" : "⚠️"}</span>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: isError ? "#be123c" : isSuccess ? "#15803d" : "#92400e", lineHeight: 1.5, flex: 1 }}>{t.msg}</p>
            <button onClick={() => removeToast(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- */
/* FULL-SCREEN LOADING SKELETON                                       */
/* ---------------------------------------------------------------- */
function AppLoadingScreen() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col">
        <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
            <div className="h-2 w-20 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 rounded-xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar skeleton */}
        <div className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-2xs">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-2.5 w-64 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
            <div className="w-28 h-9 rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </div>
        {/* Body skeleton */}
        <div className="p-8 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="h-2.5 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
                </div>
                <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
                <div className="h-2 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Table card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-2.5 w-60 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-8 w-28 rounded-xl bg-slate-100 animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="h-10 flex-1 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-10 flex-1 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-10 flex-1 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* TABLE SKELETON ROWS                                                */
/* ---------------------------------------------------------------- */
function SkeletonRows({ cols = 6, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3.5 rounded-lg bg-slate-100 animate-pulse"
                style={{ width: j === 0 ? "90px" : j === cols - 1 ? "60px" : "100%", animationDelay: `${(i * cols + j) * 30}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- */
/* INITIAL SEED DATA                                                 */
/* ---------------------------------------------------------------- */
const CLAIMS_SEED = [
  {
    _id: "claim_1",
    id: "MDOS-10049281",
    claimant: "Account Officer",
    dept: "Accounts & Finance",
    title: "Office IT & Supplies",
    amount: 45000,
    date: "2026-08-20",
    status: "new",
    note: "Initial claim submission for Manager review.",
  },
  {
    _id: "claim_2",
    id: "MDOS-20491823",
    claimant: "Account Officer",
    dept: "Accounts & Finance",
    title: "Project Audit Logistics",
    amount: 120000,
    date: "2026-08-18",
    status: "reviewed",
    note: "Reviewed & approved by Operations Manager. Forwarded for Chairman Board payment authorization.",
  },
  {
    _id: "claim_4",
    id: "MDOS-48201938",
    claimant: "Account Officer",
    dept: "Accounts & Finance",
    title: "Office Consumables & Equipment",
    amount: 68000,
    date: "2026-08-12",
    status: "approved_for_payment",
    note: "Payment authorized by Chairman Board. Ready for Account Officer disbursement.",
  },
  {
    _id: "claim_5",
    id: "MDOS-59302910",
    claimant: "Account Officer",
    dept: "Accounts & Finance",
    title: "Field Operations & Fuel",
    amount: 35000,
    date: "2026-08-05",
    status: "paid",
    note: "Payment disbursed successfully by Account Officer.",
  },
  {
    _id: "claim_6",
    id: "MDOS-68492019",
    claimant: "Account Officer",
    dept: "Accounts & Finance",
    title: "Workshop Catering & Refreshments",
    amount: 28500,
    date: "2026-08-02",
    status: "rejected",
    note: "Missing itemized receipt breakdown for workshop catering.",
  },
];

const USERS_SEED = [
  {
    _id: "u_accountant",
    name: "Account Officer",
    username: "accountant",
    password: "Password123",
    email: "accountant@hdi.org",
    role: "account_officer",
    dept: "Accounts & Finance",
  },
  {
    _id: "u_manager",
    name: "Operations Manager",
    username: "manager",
    password: "Password123",
    email: "manager@hdi.org",
    role: "manager",
    dept: "Operations",
  },
  {
    _id: "u_chairman",
    name: "Chairman Board",
    username: "chairman",
    password: "Password123",
    email: "chairman@hdi.org",
    role: "chairman",
    dept: "Executive Office",
  },
  {
    _id: "u_admin",
    name: "Super Admin",
    username: "admin",
    password: "Password123",
    email: "admin@hdi.org",
    role: "admin",
    dept: "Administration",
  },
];

const NOTIFICATIONS_SEED = [
  {
    id: "notif_1",
    title: "New Claim Submitted",
    body: "Claim MDOS-10049281 submitted by Account Officer. Awaiting Manager review.",
    type: "claim",
    read: false,
    time: "10 mins ago",
  },
  {
    id: "notif_2",
    title: "Awaiting Chairman Authorization",
    body: "Claim MDOS-20491823 reviewed by Manager and awaits Board payment authorization.",
    type: "verified",
    read: false,
    time: "1 hour ago",
  },
  {
    id: "notif_3",
    title: "Payment Authorized",
    body: "Claim MDOS-48201938 authorized by Chairman for disbursement.",
    type: "paid",
    read: true,
    time: "Yesterday",
  },
];

/* ---------------------------------------------------------------- */
/* ROLE & MENU CONFIG                                                */
/* ---------------------------------------------------------------- */
const ROLES = [
  { id: "account_officer", label: "Account Officer", icon: Wallet },
  { id: "manager", label: "Manager", icon: ShieldCheck },
  { id: "chairman", label: "Chairman Board", icon: Building2 },
  { id: "admin", label: "Admin (Super Administrator)", icon: Shield },
];

const CLAIM_ITEMS = [
  { key: "manage-claim-sheet", label: "New Claim", icon: FileEdit },
  { key: "all-claims-list", label: "Manage Claim List", icon: LayoutDashboard },
  { key: "for-review", label: "Review List", icon: Clock3, status: "new" },
  { key: "reviews-list", label: "Awaiting Approval", icon: BadgeCheck, status: "reviewed" },
  { key: "approved-for-payment", label: "Approved For Payment", icon: CircleDollarSign, status: "approved_for_payment" },
  { key: "paid-list", label: "Paid List", icon: CheckCircle2, status: "paid" },
  { key: "rejected-claim-list", label: "Rejected Claim List", icon: XCircle, status: "rejected" },
];

const MENU_ACCESS = {
  account_officer: [
    "dashboard",
    "manage-claim-sheet",
    "all-claims-list",
    "approved-for-payment",
    "paid-list",
    "rejected-claim-list",
    "track-claim",
  ],
  manager: [
    "dashboard",
    "manage-claim-sheet",
    "all-claims-list",
    "for-review",
    "rejected-claim-list",
    "track-claim",
  ],
  chairman: [
    "dashboard",
    "reviews-list",
    "all-claims-list",
    "rejected-claim-list",
    "track-claim",
  ],
  admin: [
    "dashboard",
    "manage-claim-sheet",
    "all-claims-list",
    "for-review",
    "reviews-list",
    "approved-for-payment",
    "paid-list",
    "rejected-claim-list",
    "users",
    "track-claim",
  ],
};

const VIEW_TITLES = {
  dashboard: "Dashboard Overview",
  "manage-claim-sheet": "New Claim Application",
  "all-claims-list": "Manage Claim List",
  "for-review": "Review List",
  "pending-claim-list": "Review List",
  "reviews-list": "Awaiting Approval",
  "approved-for-payment": "Approved For Payment",
  "paid-list": "Paid List",
  "rejected-claim-list": "Rejected Claim List",
  users: "User Account Management",
  "track-claim": "Claim Processing Tracker",
};

/* ---------------------------------------------------------------- */
/* SMALL UI PRIMITIVES                                               */
/* ---------------------------------------------------------------- */
function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, color: "#475569", bg: "#F1F5F9" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border border-slate-200/60"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

function StatCard4({ label, value, icon: Icon, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
          style={{ backgroundColor: accent }}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
        <TrendingUp size={13} />
        <span>Manage & View →</span>
      </p>
    </div>
  );
}

function Pagination({ page, setPage, totalItems, pageSize = 10 }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-3 bg-slate-50/50 text-slate-600 text-xs font-medium">
      <p>
        Showing {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className="w-8 h-8 text-xs font-semibold rounded-lg border transition-colors"
            style={
              page === i + 1
                ? { backgroundColor: T.greenPrimary, color: T.white, borderColor: T.greenPrimary }
                : { borderColor: "#E2E8F0", color: "#334155", backgroundColor: "#FFFFFF" }
            }
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-emerald-50 border border-emerald-100">
        <Icon size={24} style={{ color: T.greenPrimary }} />
      </div>
      <p className="font-semibold text-slate-800 text-sm">{title}</p>
      <p className="text-xs text-slate-500 font-normal mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* NOTIFICATION PANEL                                                */
/* ---------------------------------------------------------------- */
function NotificationPanel({ notifications, onMarkAllRead, onClose }) {
  const [showAll, setShowAll] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const displayedNotifs = showAll ? notifications : notifications.slice(0, 5);

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs sm:hidden z-40" 
        onClick={onClose} 
      />

      <div className="fixed sm:absolute inset-x-4 top-16 sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-w-md mx-auto">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell size={15} style={{ color: T.greenPrimary }} />
            <span className="text-xs font-semibold text-slate-800">Notifications</span>
            {unread > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">{unread}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {displayedNotifs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 font-medium">No notifications</div>
          ) : (
            displayedNotifs.map((n) => (
              <div key={n.id} className={`flex gap-3 px-4 py-3 ${n.read ? "bg-white" : "bg-emerald-50/40"}`}>
                <div
                  className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: n.read ? "#CBD5E1" : T.greenPrimary }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs text-slate-800 ${!n.read ? "font-bold" : "font-medium"}`}>{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              {showAll ? "Show less" : `View all (${notifications.length})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* LOGIN PAGE                                                        */
/* ---------------------------------------------------------------- */
function LoginPage({ onLogin, usersList = USERS_SEED }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Allow log in via username or email
      const inputStr = username.trim();
      const userData = await api.login(inputStr, password.trim());
      onLogin(userData);
    } catch (err) {
      setError(err.message || "Invalid credentials or backend error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden p-8 animate-scale-in">
        
        {/* Round HDI Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 p-1.5 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center overflow-hidden">
            <img src={hdiLogo} alt="HDI Logo" className="w-full h-full object-contain rounded-full bg-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Internal Financial Record System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Username or Email</label>
            <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <div className="px-3.5 text-slate-400">
                <UserIcon size={17} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pr-4 py-2.5 text-xs text-slate-800 outline-none bg-transparent font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <div className="px-3.5 text-slate-400">
                <Lock size={17} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pr-4 py-2.5 text-xs text-slate-800 outline-none bg-transparent font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
              <XCircle size={15} className="text-rose-500 flex-shrink-0" />
              <p className="text-xs text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-6 rounded-xl font-semibold text-xs text-white shadow-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: T.greenPrimary }}
          >
            {isLoading ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Authenticating...</span></>
            ) : "Log In"}
          </button>
        </form>

        {/* Credentials Reference */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          {/* <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Key size={14} className="text-emerald-600" />
              <span>Credentials Reference</span>
            </span>
            <span>{showCredentials ? "▲" : "▼"}</span>
          </button> */}

          {showCredentials && (
            <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-[11px] font-mono text-slate-700 animate-fade-in">
              <div className="flex justify-between border-b border-slate-200/60 pb-1 font-sans font-semibold text-slate-800">
                <span>Role</span>
                <span>Username / Password</span>
              </div>
              {usersList.map((u) => (
                <div key={u.username} className="flex justify-between items-center py-0.5">
                  <span className="font-sans font-medium text-slate-700">{ROLES.find(r => r.id === u.role)?.label || u.role}:</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-semibold text-emerald-800">
                    {u.username} / {u.password}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* SIDEBAR                                                           */
/* ---------------------------------------------------------------- */
function Sidebar({ role, activeView, setActiveView, mobileOpen, setMobileOpen, claims = [], users = [], collapsed, setCollapsed, onLogout, currentUser }) {
  const access = MENU_ACCESS[role] || MENU_ACCESS.admin || [];
  const currentUserName = currentUser || "Super Admin";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "manage-claim-sheet", label: "New Claim", icon: FileEdit },
    { key: "all-claims-list", label: "Manage Claim List", icon: FileText },
    { key: "for-review", label: "Review List", icon: Clock3, status: "new" },
    { key: "reviews-list", label: "Awaiting Approval", icon: BadgeCheck, status: "reviewed" },
    { key: "approved-for-payment", label: "Approved For Payment", icon: CircleDollarSign, status: "approved_for_payment" },
    { key: "paid-list", label: "Paid List", icon: CheckCircle2, status: "paid" },
    { key: "rejected-claim-list", label: "Rejected Claim List", icon: XCircle, status: "rejected" },
    ...(role === "admin" ? [{ key: "users", label: "User Accounts", icon: UsersIcon }] : []),
  ];

  const visibleItems = navItems.filter((it) => access.includes(it.key) || (it.key === "dashboard"));

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 overflow-y-auto flex flex-col justify-between
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${sidebarWidth}
          bg-white border-r border-slate-200 text-slate-800 shadow-2xs flex-shrink-0`}
      >
        <div>
          {/* Round Logo Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs flex-shrink-0">
                <img src={hdiLogo} alt="HDI Logo" className="w-full h-full object-contain rounded-full bg-white" />
              </div>
              {!collapsed && (
                <div>
                  <h2 className="font-bold text-slate-800 text-sm leading-tight">HDI IFRS Portal</h2>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">{ROLES.find(r => r.id === role)?.label || "Financial System"}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="text-slate-400 hover:text-slate-700 hidden lg:block cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {visibleItems.map((it) => {
              const ItemIcon = it.icon;
              const active = activeView === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => { setActiveView(it.key); setMobileOpen(false); }}
                  title={collapsed ? it.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  style={active ? { backgroundColor: T.greenPrimary } : {}}
                >
                  <ItemIcon size={17} className={active ? "text-white" : "text-slate-500"} />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-200">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{currentUserName}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate capitalize">{ROLES.find(r => r.id === role)?.label || role}</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* TOPBAR                                                            */
/* ---------------------------------------------------------------- */
function Topbar({ role, viewTitle, setMobileOpen, notifications, onMarkAllRead, currentUser, onLogout, sidebarCollapsed, setSidebarCollapsed, isRefreshing, onRefresh }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-4">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 hidden lg:block cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 lg:hidden cursor-pointer"
        >
          <MenuIcon size={18} />
        </button>

        <div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-none">{viewTitle}</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time overview of claims, approvals, and processing operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border border-slate-100"
            title="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <NotificationPanel
              notifications={notifications}
              onMarkAllRead={onMarkAllRead}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-70"
          style={{ backgroundColor: T.greenPrimary }}
          title="Refresh data from server"
        >
          <RotateCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* DASHBOARD VIEW                                                    */
/* ---------------------------------------------------------------- */
function DashboardView({ role, claims, users, currentUser, loadingData, onNavigate, onTrackClaim, onTransition, onDelete }) {
  const [feedbackClaim, setFeedbackClaim] = useState(null);
  const [viewDetailsClaim, setViewDetailsClaim] = useState(null);
  const [markPaidClaim, setMarkPaidClaim] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");

  const counts = useMemo(() => {
    const c = {};
    Object.keys(STATUS).forEach((k) => (c[k] = claims.filter((x) => x.status === k).length));
    c.reviewedCombined = (c.reviewed || 0) + (c.verified || 0);
    c.total = claims.length;
    return c;
  }, [claims]);

  let cards = [];
  if (role === "account_officer") {
    cards = [
      { label: "Total Claims", value: counts.total, icon: FileText, accent: "#2563EB", targetView: "all-claims-list" },
      { label: "Approved For Payment", value: counts.approved_for_payment, icon: CircleDollarSign, accent: "#0D9488", targetView: "approved-for-payment" },
      { label: "Paid Claims", value: counts.paid, icon: CheckCircle2, accent: T.greenPrimary, targetView: "paid-list" },
      { label: "Rejected Claims", value: counts.rejected, icon: XCircle, accent: "#DC2626", targetView: "rejected-claim-list" },
    ];
  } else if (role === "manager") {
    cards = [
      { label: "Total Claims", value: counts.total, icon: FileText, accent: "#2563EB", targetView: "all-claims-list" },
      { label: "Review List", value: counts.new, icon: Clock3, accent: "#EAB308", targetView: "for-review" },
      { label: "Approved Claims", value: (counts.approved_for_payment || 0) + (counts.paid || 0), icon: CheckCircle2, accent: T.greenPrimary, targetView: "all-claims-list" },
      { label: "Rejected Claims", value: counts.rejected, icon: XCircle, accent: "#DC2626", targetView: "rejected-claim-list" },
    ];
  } else if (role === "chairman") {
    const pendingTotal = claims.filter((c) => c.status === "reviewed" || c.status === "verified").reduce((s, c) => s + (c.amount || 0), 0);
    cards = [
      { label: "Awaiting Approval", value: counts.reviewedCombined, icon: BadgeCheck, accent: "#4338CA", targetView: "reviews-list" },
      { label: "Pending Auth Value", value: fmtN(pendingTotal), icon: CircleDollarSign, accent: T.greenPrimary, targetView: "reviews-list" },
      { label: "Authorized For Payment", value: counts.approved_for_payment, icon: CircleDollarSign, accent: "#0D9488", targetView: "all-claims-list" },
      { label: "Rejected Claims", value: counts.rejected, icon: XCircle, accent: "#DC2626", targetView: "rejected-claim-list" },
    ];
  } else {
    // Admin
    cards = [
      { label: "Total Claims", value: counts.total, icon: FileText, accent: "#2563EB", targetView: "all-claims-list" },
      { label: "Review List", value: counts.new, icon: Clock3, accent: "#EAB308", targetView: "for-review" },
      { label: "Awaiting Approval", value: counts.reviewedCombined, icon: BadgeCheck, accent: "#4338CA", targetView: "reviews-list" },
      { label: "Approved For Payment", value: counts.approved_for_payment, icon: CircleDollarSign, accent: "#0D9488", targetView: "approved-for-payment" },
    ];
  }

  const recent = (
    role === "chairman"
      ? (claims.some(c => c.status === "reviewed" || c.status === "verified") 
          ? claims.filter((c) => c.status === "reviewed" || c.status === "verified") 
          : claims)
      : role === "manager"
        ? (claims.some(c => c.status === "new") 
            ? claims.filter((c) => c.status === "new") 
            : claims)
        : claims
  ).slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {cards.map((c) => (
          <StatCard4
            key={c.label}
            {...c}
            onClick={() => onNavigate(c.targetView)}
          />
        ))}
      </div>

      {/* Full Width Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {role === "chairman" ? "Claims Awaiting Approval" : role === "manager" ? "Claims in Review List" : "Recent Claim Activity"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Overview of active claims and processing status</p>
          </div>
          <button
            onClick={() => onNavigate(role === "chairman" ? "reviews-list" : role === "manager" ? "for-review" : "all-claims-list")}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            {role === "chairman" ? "View Awaiting Approval →" : role === "manager" ? "View Review List →" : "View All Claims →"}
          </button>
        </div>

        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <th className="text-left py-3 px-3">Claim ID</th>
                <th className="text-left py-3 px-3">Claimant</th>
                <th className="text-left py-3 px-3">Title / Description</th>
                <th className="text-left py-3 px-3">Amount</th>
                <th className="text-left py-3 px-3">Date</th>
                <th className="text-left py-3 px-3">Status</th>
                <th className="text-center py-3 px-3 min-w-[80px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <SkeletonRows cols={7} rows={5} />
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-medium">
                    No active claim activity found.
                  </td>
                </tr>
              ) : (
                recent.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors font-medium">
                    <td className="py-4 px-3 font-bold font-mono text-emerald-800 cursor-pointer whitespace-nowrap" onClick={() => onNavigate("all-claims-list")}>{c.id}</td>
                    <td className="py-4 px-3 font-semibold text-slate-800 whitespace-nowrap">{c.claimant}</td>
                    <td className="py-4 px-3 text-slate-600">{c.title}</td>
                    <td className="py-4 px-3 font-bold text-slate-800 whitespace-nowrap">{fmtN(c.amount)}</td>
                    <td className="py-4 px-3 text-slate-400 whitespace-nowrap">{c.date}</td>
                    <td className="py-4 px-3 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                     <td className="py-4 px-3 text-center whitespace-nowrap">
                      <DashboardClaimRowAction
                        claim={c}
                        role={role}
                        onNavigate={onNavigate}
                        onTrack={() => onTrackClaim(c)}
                        onTransition={onTransition}
                        onOpenReview={(claim) => {
                          setFeedbackClaim(claim);
                          setFeedbackText("");
                        }}
                        onDelete={onDelete}
                        onViewDetails={(claim) => setViewDetailsClaim(claim)}
                        onOpenMarkPaid={(claim) => setMarkPaidClaim(claim)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewClaimModal
        claim={feedbackClaim}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        onClose={() => { setFeedbackClaim(null); setFeedbackText(""); }}
        onTransition={onTransition}
        role={role}
      />
      <MarkAsPaidModal
        claim={markPaidClaim}
        onClose={() => setMarkPaidClaim(null)}
        onTransition={onTransition}
      />
      <ClaimDetailsModal
        claim={viewDetailsClaim}
        onClose={() => setViewDetailsClaim(null)}
        role={role}
        onTransition={onTransition}
        onDelete={onDelete}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* REVIEW CLAIM MODAL — Decision Modal (Manager & Chairman)         */
/* ---------------------------------------------------------------- */
function ReviewClaimModal({ claim, feedbackText, setFeedbackText, onClose, onTransition, role }) {
  if (!claim) return null;

  const isManagerReview = claim.status === "new" || role === "manager";
  const [errorMsg, setErrorMsg] = useState("");

  const handleReject = () => {
    if (!feedbackText.trim()) {
      setErrorMsg("Please provide a note/reason explaining why this claim was rejected.");
      return;
    }
    setErrorMsg("");
    const defaultNote = isManagerReview ? "Rejected by Operations Manager." : "Rejected by Chairman Board.";
    onTransition(claim.id, "rejected", feedbackText.trim() || defaultNote);
    onClose();
  };

  const handleApprove = () => {
    setErrorMsg("");
    if (isManagerReview) {
      const defaultNote = "Reviewed & approved by Operations Manager. Submitted for Chairman Board payment authorization.";
      onTransition(claim.id, "reviewed", feedbackText.trim() || defaultNote);
    } else {
      const defaultNote = "Payment authorized by Chairman Board. Proceed with Account Officer disbursement.";
      onTransition(claim.id, "approved_for_payment", feedbackText.trim() || defaultNote);
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[460px] my-4 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-left animate-scale-in"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <BadgeCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 leading-tight">
                {isManagerReview ? "Manager Claim Review" : "Payment Authorization"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {isManagerReview ? "Review claim and submit for Board authorization" : "Chairman Board final payment decision"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Claim info rows */}
        <div className="px-6 py-4 border-b border-slate-100 space-y-2">
          {[
            { label: "Claim ID",  value: claim.id, mono: true },
            { label: "Claimant", value: claim.claimant },
            { label: "Amount",   value: fmtN(claim.amount), bold: true, green: true },
            { label: "Title",    value: claim.title },
            { label: "Current Status", badge: true },
          ].map((r, i) => (
            <div key={i} className="flex items-baseline justify-between py-0.5 border-b border-dashed border-slate-100 last:border-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{r.label}:</span>
              {r.badge ? (
                <StatusBadge status={claim.status} />
              ) : (
                <span className={`text-xs font-semibold ${r.bold ? "text-base font-bold" : ""} ${r.green ? "text-emerald-700 font-mono font-bold" : "text-slate-800"}`}>
                  {r.value}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Remarks & Rejection Reason Input */}
        <div className="px-6 py-4 border-b border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Review Notes & Feedback <span className="text-rose-500 font-normal">* required for rejection</span>
            </label>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => { setFeedbackText(e.target.value); setErrorMsg(""); }}
            rows={3}
            placeholder={isManagerReview ? "Add manager approval notes or specific reason if rejecting..." : "Add board authorization notes or reason if rejecting..."}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-medium"
          />
          {errorMsg && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
              <XCircle size={13} /> {errorMsg}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <XCircle size={15} />
            Reject Claim
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: T.greenPrimary }}
          >
            <CheckCircle2 size={15} />
            {isManagerReview ? "Approve (Mark Reviewed)" : "Authorize Payment"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- */
/* MARK AS PAID MODAL — Account Officer / Admin Disbursement Modal   */
/* ---------------------------------------------------------------- */
function MarkAsPaidModal({ claim, onClose, onTransition }) {
  if (!claim) return null;

  const [feedbackText, setFeedbackText] = useState("");
  const [paymentDocs, setPaymentDocs] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fileToBase64 = (fileObj) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: fileObj.name,
          size: (fileObj.size / 1024).toFixed(1) + " KB",
          mimeType: fileObj.type || "",
          data: reader.result,
        });
      reader.onerror = () => reject(new Error(`Failed to read file: ${fileObj.name}`));
      reader.readAsDataURL(fileObj);
    });

  const addFiles = (files) => {
    const arr = Array.from(files);
    const valid = [];
    for (const f of arr) {
      if (f.size > 15 * 1024 * 1024) {
        setErrorMsg(`File "${f.name}" exceeds 15MB size limit.`);
        return;
      }
      valid.push(f);
    }
    setErrorMsg("");
    setPaymentDocs((prev) => [...prev, ...valid]);
  };

  const removeDoc = (idx) => {
    setPaymentDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmPaid = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const base64Docs = await Promise.all(paymentDocs.map((f) => fileToBase64(f)));
      const defaultNote = "Payment disbursed successfully by Account Officer.";
      if (onTransition) {
        await onTransition(claim.id, "paid", feedbackText.trim() || defaultNote, base64Docs);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to process documents or record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div
        className="w-full max-w-lg my-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 text-slate-800 border-b border-emerald-200/80 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-950 leading-tight">Confirm Payment & Disburse</h3>
              <p className="text-xs text-slate-500 font-medium">Record payment disbursement and attach receipts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Claim Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Claim ID:</span>
              <span className="font-mono font-bold text-emerald-800">{claim.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Claimant:</span>
              <span className="font-bold text-slate-800">{claim.claimant || claim.claimantName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Disbursement Amount:</span>
              <span className="font-mono font-black text-emerald-700 text-sm">{fmtN(claim.amount)}</span>
            </div>
            {claim.title && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Purpose / Title:</span>
                <span className="font-medium text-slate-700 truncate max-w-[240px]">{claim.title}</span>
              </div>
            )}
          </div>

          {/* Payment Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payment Remarks / Reference (Optional)
            </label>
            <input
              type="text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Transfer Ref: 202609-HDI-8492, Bank: Zenith..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
            />
          </div>

          {/* Multi-Document Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileImage size={14} className="text-emerald-600" />
                Attach Payment Receipt(s) & Documents
              </span>
              <span className="text-[11px] font-medium text-slate-400">Multiple files supported</span>
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
              }}
            />

            {/* Add Attachments Button Bar */}
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={15} className="text-emerald-700" />
                <span>Add Attachment(s)</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium">
                {paymentDocs.length === 0 ? "No files added yet" : `${paymentDocs.length} file${paymentDocs.length > 1 ? "s" : ""} selected`}
              </span>
            </div>

            {/* List of uploaded documents */}
            {paymentDocs.length > 0 && (
              <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                {paymentDocs.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <div className="flex items-center gap-2 truncate max-w-[280px]">
                      <FileText size={14} className="text-emerald-700 flex-shrink-0" />
                      <span className="text-slate-800 font-medium truncate">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDoc(i);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        title="Remove file"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle size={15} className="text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmPaid}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: T.greenPrimary }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Confirm Payment (Mark Paid)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- */
/* CLAIM DETAILS & TRACKING MODAL — comprehensive view of all form  */
/* fields, workflow pipeline tracker, and approval/rejection actions*/
/* ---------------------------------------------------------------- */
function ClaimDetailsModal({ claim, onClose, role, onTransition, onDelete }) {
  if (!claim) return null;

  const dt = getClaimDateTime(claim);
  const docs = claim.documents || [];
  const items = claim.items || [];
  const reasons = claim.reasons || [];

  const [feedbackText, setFeedbackText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentDocs, setPaymentDocs] = useState([]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const paymentFileInputRef = useRef(null);

  const fileToBase64 = (fileObj) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: fileObj.name,
          size: (fileObj.size / 1024).toFixed(1) + " KB",
          mimeType: fileObj.type || "",
          data: reader.result,
        });
      reader.onerror = () => reject(new Error(`Failed to read file: ${fileObj.name}`));
      reader.readAsDataURL(fileObj);
    });

  const addPaymentFiles = (files) => {
    const arr = Array.from(files);
    const valid = [];
    for (const f of arr) {
      if (f.size > 15 * 1024 * 1024) {
        setErrorMsg(`File "${f.name}" exceeds 15MB size limit.`);
        return;
      }
      valid.push(f);
    }
    setErrorMsg("");
    setPaymentDocs((prev) => [...prev, ...valid]);
  };

  const removePaymentDoc = (idx) => {
    setPaymentDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const isImage = (doc) => {
    const mime = doc.mimeType || "";
    const name = doc.name || "";
    return mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name);
  };

  const downloadDoc = (doc) => {
    const a = document.createElement("a");
    a.href = doc.data;
    a.download = doc.name || "document";
    a.click();
  };

  const isRejected = claim.status === "rejected";

  const steps = [
    {
      key: "submitted",
      label: "1. Claim Submitted (Review List)",
      sublabel: "Submitted by Claimant / Account Officer",
      icon: FilePlus2,
      color: T.greenPrimary,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      passedStatuses: ["new", "reviewed", "verified", "approved_for_payment", "paid", "rejected"],
      activeStatuses: [],
    },
    {
      key: "manager_review",
      label: "2. Manager Review & Approval",
      sublabel: "Operations Manager reviews and submits for Board approval",
      icon: ShieldCheck,
      color: "#4338CA",
      bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800",
      passedStatuses: ["reviewed", "verified", "approved_for_payment", "paid"],
      activeStatuses: ["new"],
    },
    {
      key: "chairman_authorization",
      label: "3. Chairman Board Payment Authorization",
      sublabel: "Chairman Board confirms and authorizes payment",
      icon: Building2,
      color: "#7C3AED",
      bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800",
      passedStatuses: ["approved_for_payment", "paid"],
      activeStatuses: ["reviewed", "verified"],
    },
    {
      key: "payment_disbursement",
      label: "4. Account Officer Payment Disbursement",
      sublabel: "Account Officer disburses and confirms payment",
      icon: CircleDollarSign,
      color: "#0D9488",
      bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800",
      passedStatuses: ["paid"],
      activeStatuses: ["approved_for_payment"],
    },
    {
      key: "paid_complete",
      label: "5. Claim Paid — Complete",
      sublabel: "Transaction finalized and completed",
      icon: CheckCircle2,
      color: T.greenPrimary,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      passedStatuses: [],
      activeStatuses: ["paid"],
    },
  ];

  // Action handlers
  const canManagerAction = claim.status === "new" && (role === "manager" || role === "admin");
  const canChairmanAction = (claim.status === "reviewed" || claim.status === "verified") && (role === "chairman" || role === "admin");
  const canAccountOfficerAction = claim.status === "approved_for_payment" && (role === "account_officer" || role === "admin");

  const handleReject = () => {
    if (!feedbackText.trim()) {
      setErrorMsg("Please enter a note or reason for rejecting this claim.");
      return;
    }
    setErrorMsg("");
    const defaultNote = role === "manager" ? "Claim rejected by Operations Manager." : "Claim rejected by Chairman Board.";
    if (onTransition) {
      onTransition(claim.id, "rejected", feedbackText.trim() || defaultNote);
    }
    onClose();
  };

  const handleManagerApprove = () => {
    setErrorMsg("");
    const defaultNote = "Claim reviewed and approved by Operations Manager. Submitted for Chairman Board authorization.";
    if (onTransition) {
      onTransition(claim.id, "reviewed", feedbackText.trim() || defaultNote);
    }
    onClose();
  };

  const handleChairmanAuthorize = () => {
    setErrorMsg("");
    const defaultNote = "Payment authorized by Chairman Board. Proceed with disbursement.";
    if (onTransition) {
      onTransition(claim.id, "approved_for_payment", feedbackText.trim() || defaultNote);
    }
    onClose();
  };

  const handleDisbursePayment = async () => {
    setIsSubmittingPayment(true);
    setErrorMsg("");
    try {
      const base64Docs = await Promise.all(paymentDocs.map((f) => fileToBase64(f)));
      const defaultNote = "Payment disbursed successfully by Account Officer.";
      if (onTransition) {
        await onTransition(claim.id, "paid", feedbackText.trim() || defaultNote, base64Docs);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to process payment documents.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Beneficiaries Schedule & Totals
  const beneficiariesList = useMemo(() => {
    if (claim.beneficiaries && Array.isArray(claim.beneficiaries) && claim.beneficiaries.length > 0) {
      return claim.beneficiaries;
    }
    if (items && Array.isArray(items) && items.length > 0) {
      return [
        {
          name: claim.claimant || claim.claimantName || "Beneficiary",
          purposes: items.map((it) => ({
            purpose: it.category || it.note || "General Expense",
            amount: it.total || (Number(it.card) || 0) + (Number(it.cash) || 0) + (Number(it.bank) || 0) || 0,
          })),
          total: claim.amount || items.reduce((s, it) => s + (Number(it.total) || 0), 0),
        }
      ];
    }
    return [
      {
        name: claim.claimant || claim.claimantName || "Beneficiary",
        purposes: [{ purpose: claim.title || "Official Expense", amount: claim.amount || 0 }],
        total: claim.amount || 0,
      }
    ];
  }, [claim, items]);

  const grandTotal = claim.amount !== undefined && claim.amount !== null
    ? claim.amount
    : beneficiariesList.reduce((sum, b) => {
        const pTot = b.total !== undefined ? b.total : (b.purposes || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return sum + pTot;
      }, 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-6xl my-4 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-left animate-scale-in flex flex-col"
        style={{ boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/80 flex-shrink-0 gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5">
              <FolderOpen size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 leading-tight">Claim Details & Tracking</h3>
                <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold whitespace-nowrap">{claim.id}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                <span className="font-bold text-slate-800">{claim.claimant || claim.claimantName}</span>
                <span className="text-slate-400"> · </span>
                <span>{dt.date}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:block"><StatusBadge status={claim.status} /></div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        {/* Status badge row on mobile */}
        <div className="sm:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <StatusBadge status={claim.status} />
          <span className="text-[10px] text-slate-400 font-medium">{dt.time}</span>
        </div>

        {/* MODAL BODY (SCROLLABLE — stacked on mobile, 2-col on desktop) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* LEFT COLUMN: Claim Details, Tables, Documents, Actions (7 of 12 cols on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Rejection Alert if rejected */}
              {isRejected && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                  <XCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-rose-900 uppercase tracking-wide">Claim Rejection Reason</h4>
                    <p className="text-xs font-semibold text-rose-800 mt-1 leading-relaxed whitespace-pre-wrap">
                      {claim.note || "No specific rejection reason note provided."}
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Applicant & Organization Info */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 sm:mb-4 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2">
                    <Building2 size={15} className="text-emerald-600" />
                    Applicant & Claim Overview
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3 sm:p-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Claimant</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{claim.claimant || claim.claimantName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date & Time</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{dt.date} <span className="font-mono text-indigo-600 text-[11px]">({dt.time})</span></p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Claim Title</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{claim.title || "General Expense Claim"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Claim Type</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{claim.claimType || "Staff Expense"}</p>
                  </div>
                </div>

                <div className="mt-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Claim Amount</span>
                    <p className="text-lg font-extrabold font-mono text-emerald-950 leading-tight">{fmtN(grandTotal)}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-white border border-emerald-200 rounded-xl text-emerald-800 shadow-2xs">
                    {beneficiariesList.length} {beneficiariesList.length === 1 ? "Beneficiary" : "Beneficiaries"}
                  </span>
                </div>
              </div>

              {/* Section 2: Beneficiary Expense Schedule */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2">
                    <Calculator size={15} className="text-emerald-600" />
                    Expense Schedule & Breakdown
                  </span>
                  <span className="text-[11px] font-bold font-mono text-emerald-800 whitespace-nowrap">Total: {fmtN(grandTotal)}</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3 text-center w-10">S/N</th>
                          <th className="py-2.5 px-3 text-left">Beneficiary</th>
                          <th className="py-2.5 px-3 text-left">Purposes</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Total (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {beneficiariesList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">No schedule rows recorded.</td>
                          </tr>
                        ) : (
                          beneficiariesList.map((b, bIdx) => {
                            const personTotal = b.total !== undefined ? b.total : (b.purposes || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
                            const purposes = (b.purposes && b.purposes.length > 0) ? b.purposes : [{ purpose: "Official Expense", amount: personTotal }];
                            return (
                              <tr key={bIdx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50/50 align-top">
                                  {bIdx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 align-top">
                                  <span className="text-xs">{b.name || "N/A"}</span>
                                </td>
                                <td colSpan={2} className="p-0 align-top border-x border-slate-100">
                                  <table className="w-full border-collapse">
                                    <tbody>
                                      {purposes.map((p, pIdx) => (
                                        <tr key={pIdx} className={pIdx < purposes.length - 1 ? "border-b border-slate-100" : ""}>
                                          <td className="py-2 px-3 text-slate-700 font-medium">{p.purpose || "Expense"}</td>
                                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-600 whitespace-nowrap">{fmtN(p.amount || 0)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/30 align-middle whitespace-nowrap">
                                  {fmtN(personTotal)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold border-t border-slate-200">
                          <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px] text-slate-600">
                            Grand Total (₦)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-900 text-xs bg-emerald-50 whitespace-nowrap">
                            {fmtN(grandTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 3: Attached Documents */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileImage size={15} className="text-blue-600" />
                  Attached Supporting Receipts & Documents ({docs.length})
                </h4>

                {docs.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <FileText size={18} className="text-slate-300" />
                    <span>No supporting documents or receipt files uploaded.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docs.map((doc, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs group">
                        {isImage(doc) ? (
                          <div className="relative h-28 bg-slate-100 overflow-hidden">
                            <img
                              src={doc.data}
                              alt={doc.name || `Document ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => downloadDoc(doc)}
                                className="bg-white text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-slate-50"
                              >
                                <Download size={13} /> Download
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-24 bg-blue-50/70">
                            <div className="text-center">
                              <FileText size={28} className="text-blue-400 mx-auto mb-1" />
                              <span className="text-[10px] font-bold text-blue-700 uppercase">{(doc.name || "").split(".").pop()}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-slate-100">
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-800 truncate">{doc.name || `Doc ${idx + 1}`}</p>
                            <p className="text-[10px] text-slate-400">{doc.size || ""}</p>
                          </div>
                          <button
                            onClick={() => downloadDoc(doc)}
                            title="Download Attachment"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks/Notes */}
              {claim.note && (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-600" />
                    Claim Notes & Remarks
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {claim.note}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Processing Timeline Flow (5 of 12 cols on desktop, full width on mobile) */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Processing Flow</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
                    Live Flow
                  </span>
                </div>

                {/* Vertical Process Timeline Flow */}
                <div className="space-y-0 relative pl-2">
                  {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isPassed = s.passedStatuses.includes(claim.status);
                    const isActive = !isRejected && s.activeStatuses.includes(claim.status);
                    const isLast = idx === steps.length - 1;

                    return (
                      <div key={s.key} className="relative flex items-start gap-4 pb-6 last:pb-1">
                        {/* Continuous connecting line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[17px] top-9 bottom-0 w-0.5 ${
                              isPassed ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                          />
                        )}

                        {/* Status node circle */}
                        <div
                          className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isPassed
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                              : isActive
                              ? "border-2 bg-white shadow-lg animate-pulse"
                              : "bg-slate-100 text-slate-300 border border-slate-200"
                          }`}
                          style={isActive ? { borderColor: s.color, color: s.color } : {}}
                        >
                          {isPassed ? (
                            <CheckCircle2 size={18} className="text-white stroke-[2.5]" />
                          ) : (
                            <Icon size={16} />
                          )}
                        </div>

                        {/* Step Details & Notes Card */}
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <h4
                              className={`text-xs font-bold leading-tight ${
                                isPassed
                                  ? "text-slate-900"
                                  : isActive
                                  ? "text-slate-900 font-extrabold"
                                  : "text-slate-400"
                              }`}
                            >
                              {s.label.replace(/^\d+\.\s*/, "")}
                            </h4>
                            {isPassed && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Completed
                              </span>
                            )}
                            {isActive && (
                              <span
                                className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                                style={{
                                  backgroundColor: `${s.color}15`,
                                  color: s.color,
                                  borderColor: `${s.color}40`,
                                }}
                              >
                                In Progress
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5">{s.sublabel}</p>

                          {/* Dynamic status note badge if active or relevant */}
                          {isActive && (
                            <div
                              className="mt-2 text-[11px] p-2.5 rounded-xl border font-medium"
                              style={{
                                backgroundColor: `${s.color}0c`,
                                borderColor: `${s.color}30`,
                                color: s.color,
                              }}
                            >
                              Awaiting action: {s.sublabel}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Audit History Log */}
                {claim.history && claim.history.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Clock3 size={13} className="text-slate-400" />
                      Activity Log & History
                    </p>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {claim.history.map((h, i) => {
                        const dateObj = h.timestamp ? new Date(h.timestamp) : null;
                        const datePart = dateObj && !isNaN(dateObj)
                          ? dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                          : "Today";
                        const timePart = dateObj && !isNaN(dateObj)
                          ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "";

                        return (
                          <div
                            key={i}
                            className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 text-xs text-left shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-bold text-slate-900 text-xs leading-snug">{h.action}</span>
                              <div className="flex items-center gap-1.5 text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg flex-shrink-0 shadow-2xs">
                                <Clock3 size={12} className="text-emerald-700" />
                                <span className="text-[11px] font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {datePart}{timePart ? ` · ${timePart}` : ""}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 font-medium">
                              By <span className="font-bold text-slate-900">{h.by}</span> ({h.role || "User"})
                            </p>
                            {h.note && (
                              <p className="text-xs text-slate-800 bg-white border border-slate-200/80 rounded-xl p-2 mt-2 font-medium leading-relaxed">
                                "{h.note}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER WITH ACTION BUTTONS BELOW */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/90 flex flex-col gap-3 flex-shrink-0">
          {/* Action form for Manager (New -> Reviewed or Reject) */}
          {canManagerAction && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Manager Review Notes & Feedback <span className="text-rose-500 font-normal">* required if rejecting</span>
                </label>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => { setFeedbackText(e.target.value); setErrorMsg(""); }}
                rows={2}
                placeholder="Enter manager review notes or reason for rejection..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-medium"
              />
              {errorMsg && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <XCircle size={13} /> {errorMsg}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <XCircle size={15} />
                  Reject Claim
                </button>
                <button
                  type="button"
                  onClick={handleManagerApprove}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: T.greenPrimary }}
                >
                  <CheckCircle2 size={15} />
                  Approve (Mark Reviewed)
                </button>
              </div>
            </div>
          )}

          {/* Action form for Chairman (Reviewed -> Approved For Payment or Reject) */}
          {canChairmanAction && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Chairman Board Authorization Decision <span className="text-rose-500 font-normal">* required if rejecting</span>
                </label>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => { setFeedbackText(e.target.value); setErrorMsg(""); }}
                rows={2}
                placeholder="Enter board authorization decision or rejection reason..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none font-medium"
              />
              {errorMsg && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <XCircle size={13} /> {errorMsg}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <XCircle size={15} />
                  Reject Claim
                </button>
                <button
                  type="button"
                  onClick={handleChairmanAuthorize}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CircleDollarSign size={15} />
                  Authorize Payment
                </button>
              </div>
            </div>
          )}

          {/* Action form for Account Officer (Approved For Payment -> Paid) */}
          {canAccountOfficerAction && (
            <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Disbursement Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Bank transfer reference number, disbursement date, transaction ID..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Multi-Document Attachment Uploader */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileImage size={13} className="text-emerald-600" />
                    Attach Payment Receipts & Supporting Documents
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">Multiple files supported</span>
                </label>

                {/* Hidden file input */}
                <input
                  ref={paymentFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) addPaymentFiles(e.target.files);
                  }}
                />

                {/* Add Attachments Button Bar */}
                <div className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => paymentFileInputRef.current && paymentFileInputRef.current.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus size={14} className="text-emerald-700" />
                    <span>Add Attachment(s)</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {paymentDocs.length === 0 ? "No files attached yet" : `${paymentDocs.length} file${paymentDocs.length > 1 ? "s" : ""} selected`}
                  </span>
                </div>

                {/* List of uploaded documents */}
                {paymentDocs.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {paymentDocs.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                        <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                          <FileText size={13} className="text-emerald-700 flex-shrink-0" />
                          <span className="text-slate-800 font-medium truncate text-[11px]">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePaymentDoc(i);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Remove file"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorMsg && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <XCircle size={12} /> {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDisbursePayment}
                  disabled={isSubmittingPayment}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Confirm Payment (Mark Paid)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Banners for finalized claims */}
          {claim.status === "paid" && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>This claim has been fully processed, disbursed, and marked as Paid.</span>
            </div>
          )}

          {/* Default Close / Delete row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Ref: <span className="font-mono text-slate-600">{claim.id}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {role === "admin" && onDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(claim.id); onClose(); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  Delete Claim
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- */
/* PORTAL DROPDOWN — renders in document.body, escapes overflow    */
/* ---------------------------------------------------------------- */
function PortalDropdown({ anchorRef, menuRef, open, onClose, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 220 });

  /* Reposition whenever open state changes or window moves */
  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const recalc = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropW = 220;
      let left = rect.right - dropW;
      if (left < 8) left = rect.left;
      const spaceBelow = window.innerHeight - rect.bottom;
      const approxH = 200;
      const top = spaceBelow < approxH ? rect.top - approxH - 4 : rect.bottom + 6;
      setPos({ top, left, width: dropW });
    };

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const insideAnchor = anchorRef.current && anchorRef.current.contains(e.target);
      const insideMenu   = menuRef.current   && menuRef.current.contains(e.target);
      if (!insideAnchor && !insideMenu) onClose();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999,
        background: "#fff", borderRadius: "1rem", border: "1px solid #e2e8f0",
        boxShadow: "0 20px 60px -10px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.10)",
        padding: "6px 0"
      }}
    >
      {children}
    </div>,
    document.body
  );
}

function DashboardClaimRowAction({ claim, role, onNavigate, onTrack, onTransition, onOpenReview, onOpenMarkPaid, onDelete, onViewDetails }) {
  const [open, setOpen] = useState(false);
  const btnRef  = useRef(null);
  const menuRef = useRef(null);
  const close   = useCallback(() => setOpen(false), []);

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
        title="Action Options"
      >
        <MoreVertical size={15} className="text-slate-600" />
      </button>

      <PortalDropdown anchorRef={btnRef} menuRef={menuRef} open={open} onClose={close}>
        {/* View Details — opens full details with tracking workflow and approval/rejection actions below */}
        <button
          onClick={() => { close(); onViewDetails && onViewDetails(claim); }}
          className="w-full text-left text-xs font-semibold px-4 py-2.5 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FolderOpen size={14} className="text-emerald-600" />
          View Details
        </button>

        {/* Admin only: Delete */}
        {role === "admin" && (
          <button
            onClick={() => { close(); onDelete && onDelete(claim.id); }}
            className="w-full text-left text-xs font-semibold px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
          >
            <Trash2 size={13} />
            Delete Claim
          </button>
        )}
      </PortalDropdown>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* CLAIM TRACKING VIEW                                              */
/* ---------------------------------------------------------------- */
function ClaimTrackingView({ claim, onBack }) {
  const isRejected = claim.status === "rejected";
  const dt = getClaimDateTime(claim);

  const steps = [
    {
      key: "submitted",
      label: "1. Claim Submitted (Review List)",
      sublabel: "Submitted by Claimant / Account Officer",
      icon: FilePlus2,
      color: T.greenPrimary,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      passedStatuses: ["new", "reviewed", "verified", "approved_for_payment", "paid", "rejected"],
      activeStatuses: [],
    },
    {
      key: "manager_review",
      label: "2. Manager Review & Approval",
      sublabel: "Operations Manager reviews and submits for Board approval",
      icon: ShieldCheck,
      color: "#4338CA",
      bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800",
      passedStatuses: ["reviewed", "verified", "approved_for_payment", "paid"],
      activeStatuses: ["new"],
    },
    {
      key: "chairman_authorization",
      label: "3. Chairman Board Payment Authorization",
      sublabel: "Chairman Board confirms and authorizes payment",
      icon: Building2,
      color: "#7C3AED",
      bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800",
      passedStatuses: ["approved_for_payment", "paid"],
      activeStatuses: ["reviewed", "verified"],
    },
    {
      key: "payment_disbursement",
      label: "4. Account Officer Payment Disbursement",
      sublabel: "Account Officer disburses and confirms payment",
      icon: CircleDollarSign,
      color: "#0D9488",
      bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800",
      passedStatuses: ["paid"],
      activeStatuses: ["approved_for_payment"],
    },
    {
      key: "paid_complete",
      label: "5. Claim Paid — Complete",
      sublabel: "Transaction finalized and completed",
      icon: CheckCircle2,
      color: T.greenPrimary,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      passedStatuses: [],
      activeStatuses: ["paid"],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 px-6 py-6 text-slate-800 flex items-center justify-between rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Activity size={16} className="text-emerald-600" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Claim Processing Tracker</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Tracking Claim</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {claim.id} · Claimant: <span className="font-semibold text-slate-700">{claim.claimant || claim.claimantName}</span> · Filed on <span className="font-semibold text-slate-700">{dt.date}</span> at <span className="font-semibold text-indigo-700">{dt.time}</span>
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition-all cursor-pointer border border-slate-200"
        >
          <ChevronLeft size={15} />
          Back to Dashboard
        </button>
      </div>

      {/* Rejection Alert Banner if Rejected */}
      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-2xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <XCircle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-sm text-rose-900">Claim Rejected</h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-200/60 text-rose-800">Requires Correction</span>
            </div>
            <p className="text-xs text-rose-800 mt-1.5 font-medium leading-relaxed">
              <span className="font-bold">Reason / Note:</span> {claim.note || "No specific feedback provided."}
            </p>
          </div>
        </div>
      )}

      {/* Claim Summary Information Card */}
      <div className="bg-white rounded-3xl border border-slate-200 px-6 py-5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Claim ID",      value: claim.id, mono: true, teal: true },
            { label: "Claimant Name", value: claim.claimant || claim.claimantName },
            { label: "Amount",        value: fmtN(claim.amount), large: true },
            { label: "Date of Claim", value: dt.date },
            { label: "Time of Claim", value: dt.time, mono: true },
            { label: "Current Status", badge: true },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{f.label}</p>
              {f.badge
                ? <StatusBadge status={claim.status} />
                : <p className={`font-semibold ${f.large ? "text-base font-bold" : "text-sm"} ${f.teal ? "text-emerald-700 font-mono" : "text-slate-800"}`}>{f.value}</p>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Process Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50">
          <Activity size={15} className="text-emerald-700" />
          <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Workflow Pipeline</p>
        </div>
        <div className="p-6 space-y-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isPassed = s.passedStatuses.includes(claim.status);
            const isActive = !isRejected && s.activeStatuses.includes(claim.status);
            const isFuture = !isPassed && !isActive;

            return (
              <div key={s.key} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      isPassed ? "border-emerald-500 bg-emerald-50"
                      : isActive ? "border-white shadow-lg"
                      : "border-slate-200 bg-slate-50"
                    }`}
                    style={isActive ? { borderColor: s.color, background: `${s.color}18` } : {}}
                  >
                    {isPassed
                      ? <CheckCircle2 size={18} className="text-emerald-600" />
                      : <Icon size={16} style={{ color: isActive ? s.color : "#CBD5E1" }} />
                    }
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-6 my-1 rounded-full ${isPassed ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </div>

                <div className="flex-1">
                  <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between transition-all ${
                    isPassed ? "bg-emerald-50/40 border-emerald-200"
                    : isActive ? `${s.bg} ${s.border} shadow-2xs`
                    : "bg-white border-slate-100"
                  }`}>
                    <div>
                      <p className={`font-semibold text-xs ${
                        isPassed ? "text-emerald-800" : isActive ? s.text : "text-slate-400"
                      }`}>{s.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.sublabel}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPassed && <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">✓ Completed</span>}
                      {isActive && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border animate-pulse" style={{ background: `${s.color}18`, color: s.color, borderColor: `${s.color}40` }}>● In Progress</span>}
                      {isFuture && <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200">Pending</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Timeline */}
      {claim.history && claim.history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50">
            <Clock3 size={15} className="text-emerald-700" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest"> Action History</p>
          </div>
          <div className="p-5 divide-y divide-slate-100">
            {claim.history.map((h, i) => {
              const dateObj = h.timestamp ? new Date(h.timestamp) : null;
              const datePart = dateObj && !isNaN(dateObj)
                ? dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "Today";
              const timePart = dateObj && !isNaN(dateObj)
                ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">{h.action}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      By <span className="font-bold text-slate-900">{h.by}</span> ({h.role || "User"})
                    </p>
                    {h.note && (
                      <p className="text-xs text-slate-800 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 mt-2 font-medium leading-relaxed">
                        "{h.note}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg flex-shrink-0 shadow-2xs">
                    <Clock3 size={13} className="text-emerald-700" />
                    <span className="text-[11px] font-mono font-bold text-slate-900 whitespace-nowrap">
                      {datePart}{timePart ? ` · ${timePart}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* REJECTION NOTE DETAIL MODAL                                       */
/* ---------------------------------------------------------------- */
function RejectionNoteModal({ claim, onClose }) {
  if (!claim) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[460px] my-4 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-left animate-scale-in"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-950 leading-tight">Reason for Rejection</h3>
              <p className="text-[11px] text-rose-600 font-medium font-mono">{claim.id} · {claim.claimant}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Claim Title & Amount</p>
            <p className="text-xs font-bold text-slate-800">{claim.title}</p>
            <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">{fmtN(claim.amount)} · Filed on {claim.date}</p>
          </div>

          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-1.5">
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Rejection Note / Feedback</p>
            <p className="text-xs text-rose-900 font-semibold leading-relaxed whitespace-pre-wrap">
              {claim.note || "No specific rejection reason note was provided."}
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close Note
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------------------------------------------------------- */
/* CLAIM LIST VIEWS                                                  */
/* ---------------------------------------------------------------- */
function ClaimListView({ view, role, claims, onTransition, onDelete, currentUser, onTrackClaim, loadingData }) {
  const item = CLAIM_ITEMS.find((i) => i.key === view) || CLAIM_ITEMS[1];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [feedbackClaim, setFeedbackClaim] = useState(null);
  const [markPaidClaim, setMarkPaidClaim] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedRejectionClaim, setSelectedRejectionClaim] = useState(null);
  const [viewDetailsClaim, setViewDetailsClaim] = useState(null);

  let filtered = [];
  if (view === "all-claims-list") {
    filtered = claims;
  } else if (view === "for-review" || view === "pending-claim-list") {
    filtered = claims.filter((c) => c.status === "new");
  } else if (view === "reviews-list") {
    filtered = claims.filter((c) => c.status === "reviewed" || c.status === "verified");
  } else if (view === "approved-for-payment") {
    filtered = claims.filter((c) => c.status === "approved_for_payment");
  } else if (view === "paid-list") {
    filtered = claims.filter((c) => c.status === "paid");
  } else if (view === "rejected-claim-list") {
    filtered = claims.filter((c) => c.status === "rejected");
  } else if (item.status) {
    filtered = claims.filter((c) => c.status === item.status);
  } else {
    filtered = claims;
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) => c.claimant.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  }

  const pageSize = 10;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const isRejectedView = view === "rejected-claim-list";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{item.label}</h2>
          <p className="text-xs text-slate-400 font-medium">{filtered.length} total claims sitting in this status</p>
        </div>
        <div className="flex items-center rounded-2xl border border-slate-200 px-3.5 py-2 bg-white w-full sm:w-64 shadow-2xs">
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search claimant, ID..."
            className="ml-2 text-xs outline-none w-full bg-white text-slate-800 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loadingData ? (
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="text-left px-5 py-3.5">Claim ID</th>
                  <th className="text-left px-5 py-3.5">Claimant</th>
                  <th className="text-left px-5 py-3.5">Title</th>
                  <th className="text-left px-5 py-3.5">Amount</th>
                  <th className="text-left px-5 py-3.5">Date</th>
                  {isRejectedView && <th className="text-center px-5 py-3.5">Note</th>}
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-center px-5 py-3.5 min-w-[80px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <SkeletonRows cols={isRejectedView ? 8 : 7} rows={6} />
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={item.icon} title="Nothing here yet" subtitle={`No claims sit in ${item.label.toLowerCase()}.`} />
        ) : (
          <>
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="text-left px-5 py-3.5">Claim ID</th>
                    <th className="text-left px-5 py-3.5">Claimant</th>
                    <th className="text-left px-5 py-3.5">Title</th>
                    <th className="text-left px-5 py-3.5">Amount</th>
                    <th className="text-left px-5 py-3.5">Date</th>
                    {isRejectedView && <th className="text-center px-5 py-3.5">Note</th>}
                    <th className="text-left px-5 py-3.5">Status</th>
                    <th className="text-center px-5 py-3.5 min-w-[80px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="px-5 py-3.5 font-bold text-emerald-800 font-mono whitespace-nowrap">{c.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{c.claimant}</td>
                      <td className="px-5 py-3.5 text-slate-700">{c.title}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">{fmtN(c.amount)}</td>
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{c.date}</td>
                      {isRejectedView && (
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedRejectionClaim(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                            title="Click to view reason for rejection"
                          >
                            <MessageSquare size={13} />
                            <span>Note</span>
                          </button>
                        </td>
                      )}
                      <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <DashboardClaimRowAction
                          claim={c}
                          role={role}
                          onTrack={() => onTrackClaim(c)}
                          onTransition={onTransition}
                          onOpenReview={(claim) => {
                            setFeedbackClaim(claim);
                            setFeedbackText("");
                          }}
                          onOpenMarkPaid={(claim) => setMarkPaidClaim(claim)}
                          onDelete={onDelete}
                          onViewDetails={(claim) => setViewDetailsClaim(claim)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} setPage={setPage} totalItems={filtered.length} pageSize={pageSize} />
          </>
        )}
      </div>

      <ReviewClaimModal
        claim={feedbackClaim}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        onClose={() => { setFeedbackClaim(null); setFeedbackText(""); }}
        onTransition={onTransition}
        role={role}
      />

      <MarkAsPaidModal
        claim={markPaidClaim}
        onClose={() => setMarkPaidClaim(null)}
        onTransition={onTransition}
      />

      <RejectionNoteModal
        claim={selectedRejectionClaim}
        onClose={() => setSelectedRejectionClaim(null)}
      />

      <ClaimDetailsModal
        claim={viewDetailsClaim}
        onClose={() => setViewDetailsClaim(null)}
        role={role}
        onTransition={onTransition}
        onDelete={onDelete}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* NEW CLAIM SCHEDULE FORM (SIMPLE BENEFICIARY EXPENSE SCHEDULE)     */
function ManageClaimSheet({ onSubmitClaim, currentUser, users = [], onClose }) {
  const claimantName = useMemo(() => {
    return (typeof currentUser === "string" ? currentUser : currentUser?.name) || "User";
  }, [currentUser]);

  const userDept = useMemo(() => {
    return (typeof currentUser === "object" ? currentUser?.dept : null) || "Operations";
  }, [currentUser]);

  const claimDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [claimNote, setClaimNote] = useState("");
  const [claimRefNo] = useState(() => "HDI-" + Math.floor(100000 + Math.random() * 900000));

  // Schedule rows matching the screenshot: S/N, Names, Purposes, Amount, Totals (₦)
  const [beneficiaries, setBeneficiaries] = useState([
    {
      id: 1,
      name: "",
      purposes: [
        { id: 101, purpose: "", amount: "" }
      ]
    }
  ]);

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Beneficiary management
  const addBeneficiary = () => {
    setBeneficiaries((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        purposes: [{ id: Date.now() + 1, purpose: "", amount: "" }]
      }
    ]);
  };

  const removeBeneficiary = (bId) => {
    if (beneficiaries.length <= 1) return;
    setBeneficiaries((prev) => prev.filter((b) => b.id !== bId));
  };

  const updateBeneficiaryName = (bId, name) => {
    setBeneficiaries((prev) =>
      prev.map((b) => (b.id === bId ? { ...b, name } : b))
    );
    // Clear error when user starts typing
    setFieldErrors((prev) => { const e = { ...prev }; delete e[`ben_name_${bId}`]; return e; });
  };

  // Purpose item management for a person
  const addPurpose = (bId) => {
    setBeneficiaries((prev) =>
      prev.map((b) =>
        b.id === bId
          ? { ...b, purposes: [...b.purposes, { id: Date.now(), purpose: "", amount: "" }] }
          : b
      )
    );
  };

  const removePurpose = (bId, pId) => {
    setBeneficiaries((prev) =>
      prev.map((b) => {
        if (b.id !== bId) return b;
        if (b.purposes.length <= 1) return b;
        return { ...b, purposes: b.purposes.filter((p) => p.id !== pId) };
      })
    );
  };

  const updatePurpose = (bId, pId, field, val) => {
    setBeneficiaries((prev) =>
      prev.map((b) => {
        if (b.id !== bId) return b;
        return {
          ...b,
          purposes: b.purposes.map((p) =>
            p.id === pId ? { ...p, [field]: val } : p
          )
        };
      })
    );
    // Clear error when user starts typing
    setFieldErrors((prev) => { const e = { ...prev }; delete e[`pur_${field}_${bId}_${pId}`]; return e; });
  };

  // Grand total calculation
  const grandTotal = beneficiaries.reduce((acc, b) => {
    const personTotal = b.purposes.reduce((pAcc, p) => pAcc + (parseFloat(p.amount) || 0), 0);
    return acc + personTotal;
  }, 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    // --- Per-field validation ---
    const errors = {};

    beneficiaries.forEach((b) => {
      if (!b.name.trim()) {
        errors[`ben_name_${b.id}`] = "Beneficiary name is required.";
      }
      b.purposes.forEach((p) => {
        if (!p.purpose.trim()) {
          errors[`pur_purpose_${b.id}_${p.id}`] = "Purpose description is required.";
        }
        if (!p.amount || parseFloat(p.amount) <= 0) {
          errors[`pur_amount_${b.id}_${p.id}`] = "Enter a valid amount greater than ₦0.";
        }
      });
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fill in all required beneficiary schedule fields before submitting.");
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const cleanBeneficiaries = beneficiaries.map((b) => {
        const cleanPurposes = b.purposes.map((p) => ({
          purpose: p.purpose.trim() || "Official Expense",
          amount: parseFloat(p.amount) || 0
        }));
        const bTotal = cleanPurposes.reduce((sum, p) => sum + p.amount, 0);
        return {
          name: b.name.trim(),
          purposes: cleanPurposes,
          total: bTotal
        };
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      const firstPurpose = cleanBeneficiaries[0]?.purposes[0]?.purpose || "Expense Schedule";
      const title = cleanBeneficiaries.length > 1
        ? `${firstPurpose} (${cleanBeneficiaries.length} Beneficiaries)`
        : firstPurpose;

      const newClaim = {
        id: claimRefNo,
        claimId: claimRefNo,
        claimant: claimantName,
        claimantName: claimantName,
        title,
        amount: grandTotal,
        date: claimDate,
        time: timeStr,
        dept: userDept,
        companyName: "Halal And Haram Distinction Development Initiative (HDI)",
        beneficiaries: cleanBeneficiaries,
        // Backward compatible items
        items: cleanBeneficiaries.flatMap((b) =>
          b.purposes.map((p) => ({
            category: p.purpose || "Expense",
            type: "In Budget",
            payMode: "bank",
            card: 0,
            cash: 0,
            bank: p.amount,
            vat: 0,
            total: p.amount,
            note: `Beneficiary: ${b.name}`
          }))
        ),
        status: "new",
        note: claimNote.trim() || "New claim schedule submitted for review.",
        documents: [],
        createdAt: now.toISOString(),
      };

      await onSubmitClaim(newClaim);
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[92vh] animate-scale-in">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 text-slate-800 border-b border-emerald-200/80 px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/10 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                Claim Schedule
              </span>
              <span className="text-xs font-mono font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                {claimRefNo}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-emerald-950">New Claim Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the schedule of names, purposes, and amounts.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-8 space-y-6 overflow-y-auto flex-1">

          {/* Top Info Strip: Claimant & Date locked / unchangeable, Department removed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <UserIcon size={13} className="text-emerald-600" />
                Claimant / Submitter
              </label>
              <div className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-default select-none">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                    {claimantName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-800 truncate">{claimantName}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Clock3 size={13} className="text-emerald-600" />
                Claim Date
              </label>
              <div className="w-full text-xs font-bold font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center cursor-default select-none">
                <span>{claimDate}</span>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Calculator size={15} className="text-emerald-600" />
                Schedule of Payments & Expenses
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {beneficiaries.length} {beneficiaries.length === 1 ? "Person" : "Persons"}
              </span>
            </div>

            {/* Responsive Table Container with Touch Scrolling */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-2 text-center w-10 border-r border-slate-800">S/N</th>
                      <th className="py-3 px-3 text-left border-r border-slate-800 w-36 sm:w-44">Names</th>
                      <th className="py-3 px-4 text-left border-r border-slate-800">Purposes</th>
                      <th className="py-3 px-3 text-right border-r border-slate-800 w-28 sm:w-32">Amount (₦)</th>
                      <th className="py-3 px-3 text-right w-28 sm:w-32">Totals (₦)</th>
                      <th className="py-3 px-2 text-center w-9"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {beneficiaries.map((b, bIdx) => {
                      const personTotal = b.purposes.reduce((pAcc, p) => pAcc + (parseFloat(p.amount) || 0), 0);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* S/N */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-slate-500 bg-slate-50/70 align-top border-r border-slate-200">
                            {bIdx + 1}
                          </td>
                          {/* Names (Shorter column) */}
                          <td className="py-3 px-2.5 align-top border-r border-slate-200 w-36 sm:w-44">
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => updateBeneficiaryName(b.id, e.target.value)}
                              placeholder="e.g. Dr Sakirdeen"
                              className={`w-full text-xs font-bold text-slate-900 bg-white border rounded-xl px-2.5 py-2 outline-none focus:border-emerald-500 placeholder:text-slate-300 placeholder:font-normal transition-colors ${
                                fieldErrors[`ben_name_${b.id}`] ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                              }`}
                            />
                            {fieldErrors[`ben_name_${b.id}`] && (
                              <p className="text-rose-600 text-[10px] font-semibold mt-1 flex items-center gap-1">
                                <XCircle size={10} /> {fieldErrors[`ben_name_${b.id}`]}
                              </p>
                            )}
                          </td>
                          {/* Purposes and Amounts (Purposes is bigger/spacious, Amount is shorter) */}
                          <td colSpan={2} className="p-0 align-top border-r border-slate-200">
                            <table className="w-full border-collapse">
                              <tbody>
                                {b.purposes.map((p, pIdx) => (
                                  <tr key={p.id} className={pIdx < b.purposes.length - 1 ? "border-b border-slate-200" : ""}>
                                    {/* Purpose (Bigger width) */}
                                    <td className="py-2 px-3 border-r border-slate-200">
                                      <input
                                        type="text"
                                        value={p.purpose}
                                        onChange={(e) => updatePurpose(b.id, p.id, "purpose", e.target.value)}
                                        placeholder="e.g. Training Allowance or Audit Reimbursement..."
                                        className={`w-full text-xs font-medium text-slate-800 bg-white border rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 placeholder:text-slate-300 transition-colors ${
                                          fieldErrors[`pur_purpose_${b.id}_${p.id}`] ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                                        }`}
                                      />
                                      {fieldErrors[`pur_purpose_${b.id}_${p.id}`] && (
                                        <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                                          <XCircle size={10} /> {fieldErrors[`pur_purpose_${b.id}_${p.id}`]}
                                        </p>
                                      )}
                                    </td>
                                    {/* Amount (Shorter column) */}
                                    <td className="py-2 px-2.5 w-28 sm:w-32">
                                      <div className="flex items-center gap-1">
                                        <div className="relative flex-1">
                                          <span className="absolute left-2 top-1.5 text-slate-400 font-semibold text-xs">₦</span>
                                          <input
                                            type="number"
                                            value={p.amount}
                                            onChange={(e) => updatePurpose(b.id, p.id, "amount", e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full pl-5 pr-2 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white border rounded-xl outline-none focus:border-emerald-500 text-right placeholder:text-slate-300 transition-colors ${
                                              fieldErrors[`pur_amount_${b.id}_${p.id}`] ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                                            }`}
                                          />
                                          {fieldErrors[`pur_amount_${b.id}_${p.id}`] && (
                                            <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                                              <XCircle size={10} /> {fieldErrors[`pur_amount_${b.id}_${p.id}`]}
                                            </p>
                                          )}
                                        </div>
                                        {b.purposes.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removePurpose(b.id, p.id)}
                                            className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                            title="Remove purpose line"
                                          >
                                            <X size={13} />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="p-2 bg-slate-50/50 border-t border-slate-100 flex justify-start">
                              <button
                                type="button"
                                onClick={() => addPurpose(b.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                                <span>Add Purpose for this Person</span>
                              </button>
                            </div>
                          </td>
                          {/* Totals (Small column) */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/40 align-middle whitespace-nowrap w-28 sm:w-32">
                            {fmtN(personTotal)}
                          </td>
                          {/* Action (Delete Person) */}
                          <td className="py-3 px-2 text-center align-middle w-9">
                            {beneficiaries.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBeneficiary(b.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Remove this person"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600">
                        Totals (₦)
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-950 text-xs sm:text-sm bg-emerald-50 border-l border-slate-300 whitespace-nowrap w-28 sm:w-32">
                        {fmtN(grandTotal)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={addBeneficiary}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={15} />
                <span>Add Another Person (Beneficiary)</span>
              </button>
              <span className="text-[11px] text-slate-400 font-medium sm:hidden flex items-center gap-1">
                <ArrowRight size={12} /> Scroll table horizontally on small screens
              </span>
            </div>
          </div>

          {/* Notes (Full width - attached document removed from New Claim form) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-emerald-600" />
              Claim Notes & Justification (Optional)
            </label>
            <textarea
              rows={3}
              value={claimNote}
              onChange={(e) => setClaimNote(e.target.value)}
              placeholder="Provide any additional explanation or justification for this claim schedule..."
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 resize-none font-medium placeholder:text-slate-300"
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 sm:px-8 flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Claim:</span>
            <span className="text-lg font-mono font-extrabold text-emerald-800">{fmtN(grandTotal)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: T.greenPrimary }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Submitting Claim...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Claim Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* USERS VIEW                                                        */
/* ---------------------------------------------------------------- */
function UsersView({ users, onAddUser, onUpdateUser, onDeleteUser, role, loadingData }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", username: "", role: "account_officer", password: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", username: "", role: "account_officer", password: "" });
  const [showEditPassword, setShowEditPassword] = useState(false);

  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs text-center">
        <ShieldCheck size={48} className="text-amber-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Restricted Account Access</h3>
        <p className="text-xs text-slate-500 max-w-md mt-1 font-medium">
          Only the primary system Administrator account is authorized to manage user accounts and security credentials.
        </p>
      </div>
    );
  }

  const submitAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.email || !form.role || !form.password) return;
    onAddUser(form);
    setForm({ name: "", email: "", username: "", role: "account_officer", password: "" });
    setShowForm(false);
  };

  const startEdit = (u) => {
    setEditingUser(u);
    // Never pre-fill password — user must explicitly type a new one to change it
    setEditForm({ _id: u._id, name: u.name, email: u.email, username: u.username, role: u.role, password: "" });
    setShowEditPassword(false);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email) return;
    // Only include password in the payload if the user actually typed a new one
    const payload = { _id: editingUser._id, username: editingUser.username, name: editForm.name, email: editForm.email, role: editForm.role };
    if (editForm.password && editForm.password.trim().length > 0) {
      payload.password = editForm.password.trim();
    }
    onUpdateUser(payload);
    setEditingUser(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">User Account Management</h2>
          <p className="text-xs text-slate-400 font-medium">Add and manage Chairman and Admin accounts.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs cursor-pointer"
          style={{ backgroundColor: T.greenPrimary }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitAdd} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 animate-scale-in">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Add New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none font-medium focus:border-emerald-600" placeholder="e.g. Samuel Ekong" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Username</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none font-medium focus:border-emerald-600" placeholder="e.g. sekong" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none font-medium focus:border-emerald-600" placeholder="email@hdi.org" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="text" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none font-medium focus:border-emerald-600" placeholder="Set password" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assign Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white text-slate-800 font-medium focus:border-emerald-600">
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs" style={{ backgroundColor: T.greenPrimary }}>Create Account</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="text-left px-5 py-3.5">Name</th>
                <th className="text-left px-5 py-3.5">Username</th>
                <th className="text-left px-5 py-3.5">Password</th>
                <th className="text-left px-5 py-3.5">Email</th>
                <th className="text-left px-5 py-3.5">Role</th>
                <th className="text-center px-5 py-3.5 w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <SkeletonRows cols={6} rows={4} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-medium">No users found.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleInfo = ROLES.find((r) => r.id === u.role);
                  return (
                    <tr key={u._id || u.username} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-5 py-3.5 font-mono text-emerald-800 font-bold">{u.username}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 tracking-widest">••••••••</td>
                      <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {roleInfo?.label || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEdit(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <FileEdit size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteUser(u.username)}
                            className="p-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal — rendered via portal so backdrop is always correct */}
      {editingUser && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null); }}
        >
          <form
            onSubmit={submitEdit}
            style={{ animation: "scaleIn 0.15s cubic-bezier(0.34,1.4,0.64,1)" }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <UserIcon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 leading-tight">Edit Account</h3>
                  <p className="text-[11px] text-slate-400 font-medium font-mono">{editingUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none bg-slate-50 focus:bg-white transition-colors"
                  style={{ focusBorderColor: T.greenPrimary }}
                  onFocus={(e) => { e.target.style.borderColor = T.greenPrimary; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@hdi.org"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none bg-slate-50"
                  onFocus={(e) => { e.target.style.borderColor = T.greenPrimary; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                  <span className="ml-1.5 text-slate-400 font-normal">— leave blank to keep current</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Enter new password to change"
                    className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium text-slate-800 outline-none bg-slate-50 font-mono"
                    onFocus={(e) => { e.target.style.borderColor = T.greenPrimary; e.target.style.background = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((v) => !v)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    tabIndex={-1}
                    title={showEditPassword ? "Hide password" : "Show password"}
                  >
                    {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {editForm.password && editForm.password.length > 0 && editForm.password.length < 6 && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                    <span>⚠</span> Password must be at least 6 characters
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none bg-slate-50"
                  onFocus={(e) => { e.target.style.borderColor = T.greenPrimary; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                >
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editForm.password.length > 0 && editForm.password.length < 6}
                className="px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: T.greenPrimary }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* MAIN APP COMPONENT                                                */
/* ---------------------------------------------------------------- */
export default function IFRSPreview() {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hdi_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_SEED);
  const [trackingClaim, setTrackingClaim] = useState(null);
  // initialLoad = true only on first fetch after login (shows skeleton screen)
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { toasts, removeToast } = useToast();

  const fetchBackendData = async (isManualRefresh = false) => {
    if (!loggedInUser) return;
    if (isManualRefresh) setIsRefreshing(true);
    else setLoadingData(true);
    try {
      const fetchedClaims = await api.getClaims();
      const mapped = fetchedClaims.map((c) => ({
        ...c,
        id: c.claimId || c.id,
        claimant: c.claimantName || c.claimant,
      }));
      setClaims(mapped);
      try {
        localStorage.setItem("hdi_cached_claims", JSON.stringify(mapped));
      } catch {}

      try {
        const fetchedUsers = await api.getUsers();
        setUsers(fetchedUsers.map(u => ({
          ...u,
          username: u.username || (u.email ? u.email.split("@")[0] : "")
        })));
      } catch (userErr) {
        console.warn("Could not fetch users list:", userErr);
      }
      if (isManualRefresh) toast("Data refreshed successfully.", "success");
    } catch (err) {
      console.error("Error loading data from backend:", err);
      try {
        const cached = localStorage.getItem("hdi_cached_claims");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setClaims(parsed);
          }
        }
      } catch {}
      toast("Failed to load live data: " + (err.message || "Network error.") + " (Using cached data if available)", "error");
    } finally {
      setLoadingData(false);
      setIsRefreshing(false);
      setInitialLoad(false);
    }
  };

  // Periodic token expiration & 401 broadcast handler
  useEffect(() => {
    const handleAuthExpired = () => {
      if (loggedInUser) {
        setLoggedInUser(null);
        toast("Your session has expired. You have been automatically logged out.", "error");
      }
    };

    window.addEventListener("hdi:auth-expired", handleAuthFailureLogout);

    // Periodic check every 10 seconds for token expiration
    const interval = setInterval(() => {
      const token = localStorage.getItem("hdi_token");
      if (token && isTokenExpired(token)) {
        api.logout();
      }
    }, 10000);

    return () => {
      window.removeEventListener("hdi:auth-expired", handleAuthFailureLogout);
      clearInterval(interval);
    };
  }, [loggedInUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-logout when user stays idle for more than 15 minutes
  useEffect(() => {
    if (!loggedInUser) return;

    const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
    let idleTimer;
    let lastActivity = Date.now();

    const triggerAutoLogout = () => {
      api.logout();
      setLoggedInUser(null);
      toast("You have been automatically logged out due to inactivity.", "warning");
    };

    const resetIdleTimer = () => {
      lastActivity = Date.now();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(triggerAutoLogout, IDLE_LIMIT_MS);
    };

    // When returning to tab, check elapsed time
    const handleVisibility = () => {
      if (!document.hidden) {
        if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
          triggerAutoLogout();
        } else {
          resetIdleTimer();
        }
      }
    };

    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);

    // Initialize timer
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loggedInUser]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAuthFailureLogout() {
    setLoggedInUser(null);
    toast("Your session has expired. Please log in again.", "error");
  }

  useEffect(() => {
    if (loggedInUser) {
      const token = localStorage.getItem("hdi_token");
      if (token && isTokenExpired(token)) {
        api.logout();
        return;
      }
      localStorage.setItem("hdi_user", JSON.stringify(loggedInUser));
      setInitialLoad(true);
      fetchBackendData(false);
    } else {
      api.logout();
      setClaims([]);
      setUsers([]);
      setInitialLoad(true);
    }
  }, [loggedInUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const role = loggedInUser?.role || "admin";
  const currentUser = loggedInUser?.name || loggedInUser?.username || "Super Admin";

  const access = MENU_ACCESS[role] || MENU_ACCESS.admin || ["dashboard"];
  const view = access.includes(activeView) ? activeView : "dashboard";

  const handleTransition = async (id, newStatus, note, documents = []) => {
    try {
      const updated = await api.updateClaimStatus(id, newStatus, note, documents);
      setClaims((prev) =>
        prev.map((c) => (c.id === id || c.claimId === id || c._id === id
          ? { ...updated, id: updated.claimId, claimant: updated.claimantName }
          : c))
      );
      toast("Claim status updated successfully.", "success");
    } catch (err) {
      toast("Error updating claim: " + err.message, "error");
    }
  };

  const handleDeleteClaim = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this claim? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await api.deleteClaim(id);
      setClaims((prev) => prev.filter((c) => c.id !== id && c.claimId !== id && c._id !== id));
      toast("Claim deleted successfully.", "success");
    } catch (err) {
      toast("Error deleting claim: " + err.message, "error");
    }
  };

  const handleSubmitClaim = async (newClaimData) => {
    try {
      const created = await api.createClaim(newClaimData);
      setClaims((prev) => [{ ...created, id: created.claimId, claimant: created.claimantName }, ...prev]);
      toast("Claim submitted successfully.", "success");
    } catch (err) {
      toast("Error submitting claim: " + err.message, "error");
    }
  };

  const handleAddUser = async (u) => {
    try {
      const created = await api.createUser(u);
      setUsers((prev) => [{ ...created, username: created.email.split("@")[0] }, ...prev]);
      toast("User account created successfully.", "success");
    } catch (err) {
      toast("Error adding user: " + err.message, "error");
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const updated = await api.updateUser(updatedUser._id, updatedUser);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...updated, username: updated.email.split("@")[0] } : u)));
      toast("User account updated successfully.", "success");
    } catch (err) {
      toast("Error updating user: " + err.message, "error");
    }
  };

  const handleDeleteUser = async (userIdOrUsername) => {
    try {
      const targetUser = users.find(u => u._id === userIdOrUsername || u.username === userIdOrUsername);
      if (targetUser) {
        await api.deleteUser(targetUser._id);
        setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
        toast("User account removed.", "success");
      }
    } catch (err) {
      toast("Error deleting user: " + err.message, "error");
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!loggedInUser) {
    return <LoginPage onLogin={(user) => { setLoggedInUser(user); setActiveView("dashboard"); }} usersList={users.length > 0 ? users : USERS_SEED} />;
  }

  // Show full skeleton screen on initial data load after login
  if (initialLoad && loadingData) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Sidebar
        role={role}
        activeView={view}
        setActiveView={(v) => { setActiveView(v); setMobileOpen(false); }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        claims={claims}
        users={users}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={() => { setLoggedInUser(null); setActiveView("dashboard"); }}
        currentUser={currentUser}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <Topbar
          role={role}
          viewTitle={VIEW_TITLES[view] || "Dashboard Overview"}
          setMobileOpen={setMobileOpen}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          currentUser={currentUser}
          onLogout={() => { setLoggedInUser(null); setActiveView("dashboard"); }}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchBackendData(true)}
        />

        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {(view === "dashboard" || view === "manage-claim-sheet") && (
            <DashboardView
              role={role}
              claims={claims}
              users={users}
              currentUser={currentUser}
              loadingData={loadingData}
              onNavigate={(targetView) => {
                const target = access.includes(targetView) ? targetView : "all-claims-list";
                setActiveView(target);
              }}
              onTrackClaim={(claim) => {
                setTrackingClaim(claim);
                setActiveView("track-claim");
              }}
              onTransition={handleTransition}
              onDelete={handleDeleteClaim}
            />
          )}
          {view === "manage-claim-sheet" && (
            <ManageClaimSheet
              onSubmitClaim={handleSubmitClaim}
              currentUser={currentUser}
              users={users}
              onClose={() => setActiveView("dashboard")}
            />
          )}
          {["for-review", "pending-claim-list", "reviews-list", "approved-for-payment", "paid-list", "rejected-claim-list", "all-claims-list"].includes(view) && (
            <ClaimListView
              view={view}
              role={role}
              claims={claims}
              onTransition={handleTransition}
              onDelete={handleDeleteClaim}
              currentUser={currentUser}
              loadingData={loadingData}
              onTrackClaim={(claim) => {
                setTrackingClaim(claim);
                setActiveView("track-claim");
              }}
            />
          )}
          {view === "track-claim" && trackingClaim && (
            <ClaimTrackingView
              claim={trackingClaim}
              onBack={() => setActiveView("dashboard")}
            />
          )}
          {view === "track-claim" && !trackingClaim && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
              <Activity size={48} className="mb-4 text-slate-300" />
              <p className="font-semibold">No claim selected for tracking.</p>
              <button onClick={() => setActiveView("dashboard")} className="mt-4 px-5 py-2 rounded-xl text-white text-xs font-semibold" style={{ backgroundColor: T.greenPrimary }}>Back to Dashboard</button>
            </div>
          )}
          {view === "users" && (
            <UsersView
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              role={role}
              loadingData={loadingData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

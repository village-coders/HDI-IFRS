import React, { useState, useMemo, useRef, useEffect } from "react";
import { api } from "./services/api.js";
import {
  LayoutDashboard, Bell, BookOpen, Users as UsersIcon, LogOut, ChevronDown,
  ChevronRight, Search, Plus, CheckCircle2, XCircle, Clock3, RotateCcw,
  Eye, Trash2, ShieldCheck, Wallet, Landmark, Building2, Lock, User as UserIcon,
  Menu as MenuIcon, X, FileEdit, FilePlus2, BadgeCheck, CircleDollarSign,
  PlusCircle, Calculator, ArrowRight, MessageSquare,
  ChevronLeft, ChevronRight as ChevronRightIcon, Building, MoreVertical,
  Shield, DollarSign, Activity, PanelLeftClose, PanelLeftOpen, FileText,
  TrendingUp, RefreshCw, Key
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
  new:                   { label: "New",                   color: "#2563EB", bg: "#EFF6FF" },
  pending:               { label: "Pending",                color: "#D97706", bg: "#FEF3C7" },
  verified:              { label: "Under Review",           color: "#4338CA", bg: "#EEF2FF" },
  further_approval:      { label: "Board Review",           color: "#7C3AED", bg: "#F5F3FF" },
  approved_for_payment:  { label: "Approved For Payment",   color: "#0D9488", bg: "#CCFBF1" },
  paid:                  { label: "Paid",                   color: "#16A34A", bg: "#DCFCE7" },
  rejected:              { label: "Rejected",                color: "#DC2626", bg: "#FEE2E2" },
};

const fmtN = (n) => "₦" + (Number(n) || 0).toLocaleString();

/* ---------------------------------------------------------------- */
/* INITIAL SEED DATA                                                 */
/* ---------------------------------------------------------------- */
const CLAIMS_SEED = [
  {
    _id: "claim_1",
    id: "MDOS-10049281",
    claimant: "Ibrahim Musa",
    dept: "Operations",
    title: "Official Duty Expense",
    amount: 45000,
    date: "2026-08-20",
    status: "new",
    note: "Initial claim submission for transit and logistics.",
  },
  {
    _id: "claim_2",
    id: "MDOS-20491823",
    claimant: "Chidinma Okoro",
    dept: "Finance & Accounts",
    title: "Audit & Supervision",
    amount: 120000,
    date: "2026-08-18",
    status: "verified",
    note: "Verified by FO. Forwarded for Chairman review.",
  },
  {
    _id: "claim_3",
    id: "MDOS-39281048",
    claimant: "Samuel Ekong",
    dept: "Audit",
    title: "Overseas Travel & Hotel",
    amount: 285000,
    date: "2026-08-15",
    status: "further_approval",
    note: "Submitted to Chairman & Board for high-value review.",
  },
  {
    _id: "claim_4",
    id: "MDOS-48201938",
    claimant: "Funmi Adisa",
    dept: "Admin",
    title: "Office Consumables & Supplies",
    amount: 68000,
    date: "2026-08-12",
    status: "approved_for_payment",
    note: "Verified by Chairman. Sent to Accountant for disbursement.",
  },
  {
    _id: "claim_5",
    id: "MDOS-59302910",
    claimant: "Ibrahim Musa",
    dept: "Operations",
    title: "Taxi Fare & Sundry",
    amount: 35000,
    date: "2026-08-05",
    status: "paid",
    note: "Payment completed successfully.",
  },
];

const USERS_SEED = [
  {
    _id: "u_admin",
    name: "Admin Super Admin",
    username: "admin",
    password: "admin123",
    email: "admin@hdiportal.com",
    role: "admin",
  },
  {
    _id: "u_chairman",
    name: "Chairman Board",
    username: "chairman",
    password: "chairman123",
    email: "chairman@hdiportal.com",
    role: "chairman",
  },
  {
    _id: "u_fofficer",
    name: "Chidinma Okoro (FO)",
    username: "fofficer",
    password: "fofficer123",
    email: "chidinma@hdiportal.com",
    role: "financial_officer",
  },
  {
    _id: "u_accountant",
    name: "Samuel Ekong (Accountant)",
    username: "accountant",
    password: "accountant123",
    email: "samuel@hdiportal.com",
    role: "accountant",
  },
  {
    _id: "u_user",
    name: "Ibrahim Musa (User)",
    username: "imusa",
    password: "user123",
    email: "ibrahim@hdiportal.com",
    role: "user",
  },
];

const NOTIFICATIONS_SEED = [
  {
    id: "notif_1",
    title: "New Claim Submitted",
    body: "Claim MDOS-10049281 submitted by Ibrahim Musa.",
    type: "claim",
    read: false,
    time: "10 mins ago",
  },
  {
    id: "notif_2",
    title: "Awaiting Chairman Review",
    body: "Claim MDOS-20491823 has been verified and requires Board review.",
    type: "verified",
    read: false,
    time: "1 hour ago",
  },
  {
    id: "notif_3",
    title: "Payment Approved",
    body: "Claim MDOS-48201938 was approved by Chairman for payment.",
    type: "paid",
    read: true,
    time: "Yesterday",
  },
];

/* ---------------------------------------------------------------- */
/* ROLE & MENU CONFIG                                                */
/* ---------------------------------------------------------------- */
const ROLES = [
  { id: "admin", label: "Admin Super Admin", icon: ShieldCheck },
  { id: "chairman", label: "Chairman Board", icon: Building2 },
  { id: "financial_officer", label: "Financial Officer", icon: Wallet },
  { id: "accountant", label: "Accountant", icon: Calculator },
  { id: "user", label: "User", icon: UserIcon },
];

const CLAIM_ITEMS = [
  { key: "manage-claim-sheet", label: "New Claim", icon: FileEdit },
  { key: "all-claims-list", label: "Manage Claim List", icon: LayoutDashboard },
  { key: "new-claim-list", label: "New Claim List", icon: FilePlus2, status: "new" },
  { key: "reviews-list", label: "Reviews", icon: BadgeCheck, status: "verified" },
  { key: "further-approval", label: "Further Approval", icon: Building, status: "further_approval" },
  { key: "approved-for-payment", label: "Approved For Payment", icon: CircleDollarSign, status: "approved_for_payment" },
  { key: "paid-list", label: "Paid List", icon: CheckCircle2, status: "paid" },
  { key: "pending-claim-list", label: "Pending Claim List", icon: Clock3, status: "pending" },
  { key: "rejected-claim-list", label: "Rejected Claim List", icon: XCircle, status: "rejected" },
];

const MENU_ACCESS = {
  user: ["dashboard", "manage-claim-sheet", "all-claims-list", "pending-claim-list", "rejected-claim-list", "track-claim"],
  financial_officer: ["dashboard", "manage-claim-sheet", "all-claims-list", "new-claim-list", "pending-claim-list", "rejected-claim-list", "track-claim"],
  // Further Approval removed ONLY from Chairman dashboard/sidebar access (Chairman uses Reviews)
  chairman: ["dashboard", "reviews-list", "all-claims-list", "track-claim"],
  accountant: ["dashboard", "manage-claim-sheet", "all-claims-list", "approved-for-payment", "paid-list", "track-claim"],
  // Admin retains full access including Further Approval
  admin: ["dashboard", "manage-claim-sheet", "all-claims-list", "new-claim-list", "reviews-list", "further-approval", "approved-for-payment", "paid-list", "pending-claim-list", "rejected-claim-list", "users", "track-claim"],
};

const VIEW_TITLES = {
  dashboard: "Dashboard Overview",
  "manage-claim-sheet": "New Claim Application",
  "all-claims-list": "Manage Claim List",
  "new-claim-list": "New Claim List",
  "reviews-list": "Reviews",
  "further-approval": "Further Approval",
  "approved-for-payment": "Approved For Payment",
  "paid-list": "Paid List",
  "pending-claim-list": "Pending Claim List",
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
      // Allow log in via email or seeded username
      const inputStr = username.trim();
      const email = inputStr.includes("@") ? inputStr : `${inputStr}@hdi.org`;
      
      const userData = await api.login(email, password.trim());
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">Username</label>
            <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <div className="px-3.5 text-slate-400">
                <UserIcon size={17} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
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
function Sidebar({ role, activeView, setActiveView, mobileOpen, setMobileOpen, claims = [], users = [], collapsed, setCollapsed, onLogout }) {
  const access = MENU_ACCESS[role] || MENU_ACCESS.user || [];
  const currentUserObj = users.find((u) => u.role === role);
  const currentUserName = currentUserObj ? currentUserObj.name : "Admin Super Admin";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "manage-claim-sheet", label: "New Claim", icon: FileEdit },
    { key: "all-claims-list", label: "Manage Claim List", icon: FileText },
    { key: "new-claim-list", label: "New Claim List", icon: FilePlus2, status: "new" },
    { key: "reviews-list", label: "Reviews", icon: BadgeCheck, status: "verified" },
    { key: "further-approval", label: "Further Approval", icon: Building, status: "further_approval" },
    { key: "approved-for-payment", label: "Approved For Payment", icon: CircleDollarSign, status: "approved_for_payment" },
    { key: "paid-list", label: "Paid List", icon: CheckCircle2, status: "paid" },
    { key: "pending-claim-list", label: "Pending Claim List", icon: Clock3, status: "pending" },
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
                  <h2 className="font-bold text-slate-800 text-sm leading-tight">Admin Dashboard</h2>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Internal Financial System</p>
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
function Topbar({ role, viewTitle, setMobileOpen, notifications, onMarkAllRead, currentUser, onLogout, sidebarCollapsed, setSidebarCollapsed }) {
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
            Real-time overview of claims, reviews, and processing operations
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
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          style={{ backgroundColor: T.greenPrimary }}
        >
          <RotateCcw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* DASHBOARD VIEW                                                    */
/* ---------------------------------------------------------------- */
function DashboardView({ role, claims, users, currentUser, onNavigate, onTrackClaim, onTransition, onDelete }) {
  const [feedbackClaim, setFeedbackClaim] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [sendBackTarget, setSendBackTarget] = useState("accountant");

  const counts = useMemo(() => {
    const c = {};
    Object.keys(STATUS).forEach((k) => (c[k] = claims.filter((x) => x.status === k).length));
    c.total = claims.length;
    c.mine = claims.filter((x) => x.claimant === currentUser).length;
    return c;
  }, [claims, currentUser]);

  let cards = [];
  if (role === "user") {
    cards = [
      { label: "My Claims", value: counts.mine, icon: FileEdit, accent: "#2563EB", targetView: "all-claims-list" },
      { label: "Pending Feedback", value: claims.filter((c) => c.claimant === currentUser && c.status === "pending").length, icon: Clock3, accent: "#D97706", targetView: "pending-claim-list" },
      { label: "Rejected Claims", value: claims.filter((c) => c.claimant === currentUser && c.status === "rejected").length, icon: XCircle, accent: "#DC2626", targetView: "rejected-claim-list" },
      { label: "Paid To Date", value: claims.filter((c) => c.claimant === currentUser && c.status === "paid").length, icon: CheckCircle2, accent: T.greenPrimary, targetView: "all-claims-list" },
    ];
  } else if (role === "financial_officer") {
    cards = [
      { label: "New Claims", value: counts.new, icon: FilePlus2, accent: "#2563EB", targetView: "new-claim-list" },
      { label: "Pending Feedback", value: counts.pending, icon: Clock3, accent: "#D97706", targetView: "pending-claim-list" },
      { label: "Under Review", value: counts.verified, icon: BadgeCheck, accent: "#4338CA", targetView: "all-claims-list" },
      { label: "Rejected Claims", value: counts.rejected, icon: XCircle, accent: "#DC2626", targetView: "rejected-claim-list" },
    ];
  } else if (role === "accountant") {
    cards = [
      { label: "Approved For Payment", value: counts.approved_for_payment, icon: CircleDollarSign, accent: "#0D9488", targetView: "approved-for-payment" },
      { label: "Paid Claims", value: counts.paid, icon: CheckCircle2, accent: T.greenPrimary, targetView: "paid-list" },
      { label: "Total Paid Value", value: fmtN(claims.filter((c) => c.status === "paid").reduce((s, c) => s + (c.amount || 0), 0)), icon: Wallet, accent: "#047857", targetView: "paid-list" },
      { label: "Pending Processing", value: counts.pending, icon: Clock3, accent: "#D97706", targetView: "all-claims-list" },
    ];
  } else if (role === "chairman") {
    // Chairman Dashboard: Further Approval removed here; uses Reviews
    cards = [
      { label: "In Review (Chairman)", value: counts.verified, icon: BadgeCheck, accent: "#4338CA", targetView: "reviews-list" },
      { label: "Review Total Value", value: fmtN(claims.filter((c) => c.status === "verified").reduce((s, c) => s + (c.amount || 0), 0)), icon: CircleDollarSign, accent: T.greenPrimary, targetView: "reviews-list" },
      { label: "Approved For Payment", value: counts.approved_for_payment, icon: CircleDollarSign, accent: "#0D9488", targetView: "all-claims-list" },
      { label: "Total Claims", value: counts.total, icon: FileEdit, accent: "#2563EB", targetView: "all-claims-list" },
    ];
  } else if (role === "admin") {
    // Admin Dashboard: Retains Further Approval card and full controls
    cards = [
      { label: "Total Claims", value: counts.total, icon: FileEdit, accent: "#2563EB", targetView: "all-claims-list" },
      { label: "New Claims", value: counts.new, icon: FilePlus2, accent: "#0D9488", targetView: "new-claim-list" },
      { label: "In Review (Chairman)", value: counts.verified, icon: BadgeCheck, accent: "#4338CA", targetView: "reviews-list" },
      { label: "Further Approval", value: counts.further_approval, icon: Building, accent: "#7C3AED", targetView: "further-approval" },
    ];
  }

  const recent = (
    role === "user"
      ? claims.filter((c) => c.claimant === currentUser)
      : role === "chairman"
      ? claims.filter((c) => c.status === "verified")
      : claims
  ).slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <StatCard4
            key={c.label}
            {...c}
            onClick={() => onNavigate(c.targetView)}
          />
        ))}
      </div>

      {/* Full Width Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Recent Claim Activity</h3>
            <p className="text-xs text-slate-400 font-medium">Overview of active claims and processing status</p>
          </div>
          <button
            onClick={() => onNavigate("all-claims-list")}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            View All Claims →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
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
              {recent.map((c) => (
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
                      onOpenFeedback={(claim, targetRole) => {
                        setFeedbackClaim(claim);
                        setSendBackTarget(targetRole || "accountant");
                        setFeedbackText("");
                      }}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chairman Send Back / Feedback Modal */}
      {feedbackClaim && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">
                {sendBackTarget === "accountant" ? "Verify & Send to Accountant" : "Send Feedback / Return Claim"}
              </h3>
              <button onClick={() => setFeedbackClaim(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Claim <span className="font-bold font-mono text-slate-800">{feedbackClaim.id}</span> ({feedbackClaim.claimant})
            </p>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                {sendBackTarget === "accountant"
                  ? "Instructions / Notes for Accountant:"
                  : "Feedback / Rejection Reason:"}
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder={
                  sendBackTarget === "accountant"
                    ? "e.g. Verified by Chairman Board. Proceed with disbursement."
                    : "e.g. Please clarify mileage breakdown before re-submission."
                }
                className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none font-medium focus:border-emerald-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setFeedbackClaim(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (sendBackTarget === "accountant") {
                    onTransition(feedbackClaim.id, "approved_for_payment", feedbackText);
                  } else {
                    onTransition(feedbackClaim.id, "pending", feedbackText);
                  }
                  setFeedbackClaim(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: T.greenPrimary }}
              >
                Submit & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* RELATIVE DROPDOWN ACTION MENU POSITIONED INSIDE TABLE BOUNDS DIRECTLY UNDER BUTTON */
function DashboardClaimRowAction({ claim, role, onNavigate, onTrack, onTransition, onOpenFeedback, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const currentStatus = claim.status;

  return (
    <div className="relative inline-block text-right" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
        title="Action Options"
      >
        <MoreVertical size={15} className="text-slate-600" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1.5 text-left animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Always Available: Track Processing */}
          <button
            onClick={() => { setOpen(false); onTrack(); }}
            className="w-full text-left text-xs font-semibold px-4 py-2.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Activity size={14} />
            Track Processing
          </button>

          {/* Financial Officer Actions */}
          {currentStatus === "new" && (role === "financial_officer" || role === "admin") && (
            <>
              <button onClick={() => { setOpen(false); onTransition(claim.id, "verified"); }} className="w-full text-left text-xs font-medium px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer">Verify & Move to Review</button>
              <button onClick={() => { setOpen(false); onOpenFeedback(claim, "user"); }} className="w-full text-left text-xs font-medium px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer">Send Feedback</button>
              <button onClick={() => { setOpen(false); onTransition(claim.id, "rejected"); }} className="w-full text-left text-xs font-semibold px-4 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer">Reject</button>
            </>
          )}

          {/* Chairman Board / Admin Review Actions */}
          {(currentStatus === "verified" || currentStatus === "further_approval") && (role === "chairman" || role === "admin") && (
            <>
              <button onClick={() => { setOpen(false); onOpenFeedback(claim, "accountant"); }} className="w-full text-left text-xs font-medium px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer">Verify & Send to Accountant</button>
              {role === "admin" && (
                <button onClick={() => { setOpen(false); onTransition(claim.id, "further_approval"); }} className="w-full text-left text-xs font-medium px-4 py-2 hover:bg-purple-50 text-purple-700 flex items-center gap-2 cursor-pointer">Escalate to Board</button>
              )}
              <button onClick={() => { setOpen(false); onOpenFeedback(claim, "financial_officer"); }} className="w-full text-left text-xs font-medium px-4 py-2 hover:bg-amber-50 text-amber-700 flex items-center gap-2 cursor-pointer">Send Back to Fin. Officer</button>
              <button onClick={() => { setOpen(false); onTransition(claim.id, "rejected"); }} className="w-full text-left text-xs font-semibold px-4 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer">Reject</button>
            </>
          )}

          {/* Accountant Actions */}
          {currentStatus === "approved_for_payment" && (role === "accountant" || role === "admin") && (
            <button onClick={() => { setOpen(false); onTransition(claim.id, "paid"); }} className="w-full text-left text-xs font-semibold px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer">Mark as Paid</button>
          )}

          {/* User Resubmit Actions */}
          {currentStatus === "pending" && role === "user" && (
            <button onClick={() => { setOpen(false); onTransition(claim.id, "new"); }} className="w-full text-left text-xs font-semibold px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer">Resubmit Claim</button>
          )}

          {/* DELETE PRIVILEGE RESTRICTED STRICTLY TO ADMIN ONLY */}
          {role === "admin" && (
            <button onClick={() => { setOpen(false); onDelete(claim.id); }} className="w-full text-left text-xs font-semibold px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100 cursor-pointer">
              <Trash2 size={13} />
              Delete Claim
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* CLAIM TRACKING VIEW                                              */
/* ---------------------------------------------------------------- */
function ClaimTrackingView({ claim, onBack }) {
  const steps = [
    {
      key: "submitted",
      label: "Claim Submitted",
      icon: FilePlus2,
      color: T.greenPrimary,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      passedStatuses: ["new","pending","verified","further_approval","approved_for_payment","paid","rejected"],
      activeStatuses: [],
    },
    {
      key: "fo_review",
      label: "Financial Officer Review",
      icon: BadgeCheck,
      color: "#4338CA",
      bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800",
      passedStatuses: ["verified","further_approval","approved_for_payment","paid"],
      activeStatuses: ["new","pending"],
    },
    {
      key: "chairman_review",
      label: "Chairman Board Review",
      icon: Building2,
      color: "#7C3AED",
      bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800",
      passedStatuses: ["approved_for_payment","paid"],
      activeStatuses: ["verified", "further_approval"],
    },
    {
      key: "payment",
      label: "Accountant Payment Processing",
      icon: CircleDollarSign,
      color: "#0D9488",
      bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800",
      passedStatuses: ["paid"],
      activeStatuses: ["approved_for_payment"],
    },
    {
      key: "paid_complete",
      label: "Claim Paid — Complete",
      icon: CheckCircle2,
      color: T.greenPrimary,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      passedStatuses: [],
      activeStatuses: ["paid"],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200/90 px-6 py-6 text-slate-800 flex items-center justify-between rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Activity size={16} className="text-emerald-600" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Claim Processing Tracker</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Tracking Claim</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{claim.id} · {claim.claimant}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition-all cursor-pointer border border-slate-200"
        >
          <ChevronLeft size={15} />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 px-6 py-5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Claim ID",   value: claim.id,        mono: true,  teal: true },
            { label: "Claimant",   value: claim.claimant },
            { label: "Amount",     value: fmtN(claim.amount), large: true },
            { label: "Department", value: claim.dept },
            { label: "Date Filed", value: claim.date },
            { label: "Status",     badge: true },
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50">
          <Activity size={15} className="text-emerald-700" />
          <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Process Steps</p>
        </div>
        <div className="p-6 space-y-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isPassed = s.passedStatuses.includes(claim.status);
            const isActive = s.activeStatuses.includes(claim.status);
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
                    <p className={`font-semibold text-sm ${
                      isPassed ? "text-emerald-800" : isActive ? s.text : "text-slate-400"
                    }`}>{s.label}</p>

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
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* CLAIM LIST VIEWS                                                  */
/* ---------------------------------------------------------------- */
function ClaimListView({ view, role, claims, onTransition, onDelete, currentUser, onTrackClaim }) {
  const item = CLAIM_ITEMS.find((i) => i.key === view) || CLAIM_ITEMS[1];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [feedbackClaim, setFeedbackClaim] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [sendBackTarget, setSendBackTarget] = useState("accountant");

  let filtered = view === "all-claims-list"
    ? claims
    : item.status
      ? claims.filter((c) => c.status === item.status)
      : claims;

  if (role === "user") {
    filtered = filtered.filter((c) => c.claimant === currentUser);
  } else if (role === "chairman") {
    if (view === "reviews-list") {
      filtered = filtered.filter((c) => c.status === "verified");
    }
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) => c.claimant.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  }

  const pageSize = 10;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const submitFeedback = () => {
    if (sendBackTarget === "accountant") {
      onTransition(feedbackClaim.id, "approved_for_payment", feedbackText);
    } else {
      onTransition(feedbackClaim.id, "pending", feedbackText);
    }
    setFeedbackClaim(null);
    setFeedbackText("");
  };

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
        {filtered.length === 0 ? (
          <EmptyState icon={item.icon} title="Nothing here yet" subtitle={`No claims sit in ${item.label.toLowerCase()}.`} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="text-left px-5 py-3.5">Claim ID</th>
                    <th className="text-left px-5 py-3.5">Claimant</th>
                    <th className="text-left px-5 py-3.5">Title</th>
                    <th className="text-left px-5 py-3.5">Amount</th>
                    <th className="text-left px-5 py-3.5">Date</th>
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
                      <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <DashboardClaimRowAction
                          claim={c}
                          role={role}
                          onTrack={() => onTrackClaim(c)}
                          onTransition={onTransition}
                          onOpenFeedback={(claim, target) => {
                            setFeedbackClaim(claim);
                            setSendBackTarget(target || "accountant");
                          }}
                          onDelete={onDelete}
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

      {feedbackClaim && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 animate-scale-in space-y-4">
            <h3 className="font-bold text-sm text-slate-800">
              {sendBackTarget === "accountant" ? "Verify & Send to Accountant" : "Send Feedback"}
            </h3>
            <p className="text-xs text-slate-500">To {feedbackClaim.claimant} regarding {feedbackClaim.id}.</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              placeholder="e.g. Verified by Chairman Board..."
              className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none font-medium focus:border-emerald-600"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setFeedbackClaim(null)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600">Cancel</button>
              <button onClick={submitFeedback} className="px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs" style={{ backgroundColor: T.greenPrimary }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* 4-STEP CLAIM APPLICATION WIZARD FORM                              */
/* ---------------------------------------------------------------- */
const WIZARD_STEPS = [
  { id: 1, title: "Claimant & Details", subtitle: "Basic claimant identification" },
  { id: 2, title: "Claim Reasons", subtitle: "Business justification" },
  { id: 3, title: "Expense Itemization", subtitle: "Breakdown & calculations" },
  { id: 4, title: "Attachments & Review", subtitle: "Documents & final submission" },
];

function ManageClaimSheet({ onSubmitClaim, currentUser, onClose }) {
  const [step, setStep] = useState(1);
  const [claimantName, setClaimantName] = useState(currentUser || "Ibrahim Musa");
  const [claimRefNo, setClaimRefNo] = useState("MDOS-" + Math.floor(10000000000000 + Math.random() * 90000000000000));
  const [claimType, setClaimType] = useState("Staff Expense");
  const [companyName, setCompanyName] = useState("Halal And Haram Distinction Development Initiative (HDI)");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));

  const [reasons, setReasons] = useState([
    { id: 1, option: "Official Duty Expense", chg: false }
  ]);

  const [items, setItems] = useState([
    { id: 1, type: "In Budget", category: "Taxi Fare", note: "", currency: "NGN", payMode: "cash", card: 0, cash: 15000, bank: 0, vat: 0, total: 15000 }
  ]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const [activeNoteModalItem, setActiveNoteModalItem] = useState(null);
  const [noteModalText, setNoteModalText] = useState("");

  const CATEGORY_OPTIONS = [
    "Underground Ticket", "National Rail Ticket", "Taxi Fare", "Car Hire (inc, fuel)", "Car Millage", "Car Parking", "Fuel", "Air Fare", "Hotel Accommodation", "Lunch/Dinner", "Sundry", "Office Consumables", "Standards & Export Cert", "DHL To Dubai x2 ()", "Cash Advancement", "Other Deductions", "Telephone Expenses", "Audit Fee (External)", "Gym Allowance", "Currency exchange charges", "Charity", "HFF expense", "Rent & Rates", "Service Charges", "Office Expense", "Meeting fee", "Office Cleaning", "Remuneration Payments", "Scholars Fee", "Honorarium payments", "Postage", "Stationary exp", "Computer Repair", "Computer/IT Expense"
  ];

  const TYPE_OPTIONS = ["None", "In Budget", "Not In Budget", "Not Applicable"];

  const addReasonRow = () => { setReasons([...reasons, { id: Date.now(), option: "", chg: false }]); };
  const removeReasonRow = (id) => { if (reasons.length > 1) setReasons(reasons.filter((r) => r.id !== id)); };
  const updateReason = (id, field, value) => { setReasons(reasons.map((r) => (r.id === id ? { ...r, [field]: value } : r))); };

  const addItemRow = () => {
    setItems([...items, { id: Date.now(), type: "In Budget", category: "", note: "", currency: "NGN", payMode: "cash", card: 0, cash: 0, bank: 0, vat: 0, total: 0 }]);
  };
  const removeItemRow = (id) => { if (items.length > 1) setItems(items.filter((item) => item.id !== id)); };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "card" && parseFloat(value) > 0) { updated.cash = 0; updated.payMode = "card"; }
          else if (field === "cash" && parseFloat(value) > 0) { updated.card = 0; updated.payMode = "cash"; }
          const card = parseFloat(updated.card) || 0;
          const cash = parseFloat(updated.cash) || 0;
          const vat = parseFloat(updated.vat) || 0;
          updated.total = card + cash + vat;
          return updated;
        }
        return item;
      })
    );
  };

  const openNoteModal = (item) => { setActiveNoteModalItem(item); setNoteModalText(item.note || ""); };
  const saveNoteModal = () => {
    if (activeNoteModalItem) updateItem(activeNoteModalItem.id, "note", noteModalText);
    setActiveNoteModalItem(null); setNoteModalText("");
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) addFiles(Array.from(e.dataTransfer.files)); };
  const handleFileInput = (e) => { if (e.target.files && e.target.files[0]) addFiles(Array.from(e.target.files)); };
  const addFiles = (newFilesList) => { setUploadedFiles((prev) => [...prev, ...newFilesList.map((f) => ({ id: Date.now() + Math.random(), file: f, name: f.name, size: (f.size / 1024).toFixed(1) + " KB" }))]); };
  const removeFile = (id) => { setUploadedFiles((prev) => prev.filter((f) => f.id !== id)); };

  const CURRENCY_SYMBOLS = { NGN: "₦", GBP: "£", USD: "$", EUR: "€" };
  const fmtCurrency = (val, symbol = "₦") => `${symbol}${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const primaryCurrency = items[0]?.currency || "NGN";
  const activeSymbol = CURRENCY_SYMBOLS[primaryCurrency] || "₦";

  const subtotalCard = items.reduce((sum, item) => sum + (parseFloat(item.card) || 0), 0);
  const subtotalCash = items.reduce((sum, item) => sum + (parseFloat(item.cash) || 0), 0);
  const subtotalVat = items.reduce((sum, item) => sum + (parseFloat(item.vat) || 0), 0);
  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleNext = () => {
    if (step === 1) { if (!claimantName.trim()) { alert("Please enter claimant name."); return; } }
    else if (step === 2) { if (reasons.length === 0 || !reasons[0].option) { alert("Please select at least one claim reason option."); return; } }
    else if (step === 3) { const validItem = items.some((i) => i.category); if (!validItem) { alert("Please select a description option for at least one item."); return; } }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const submitForm = (e) => {
    if (e) e.preventDefault();
    const primaryItem = items.find((i) => i.category) || items[0];
    const claimTitle = primaryItem.category ? `${primaryItem.category} Claim` : "General Expense Claim";

    onSubmitClaim({
      id: claimRefNo,
      claimant: claimantName || currentUser,
      title: claimTitle,
      amount: grandTotal,
      date: claimDate || new Date().toISOString().slice(0, 10),
      dept: "Operations",
      status: "new",
      note: "Claim submitted by user.",
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-scale-in">
        <div className="bg-slate-900 text-white px-6 py-5 sm:px-8 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                Claim Application 
              </span>
              <span className="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                {claimRefNo}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Submit New Claim</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-3.5 flex-shrink-0">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
            {WIZARD_STEPS.map((s) => {
              const isCurrent = step === s.id;
              const isPassed = step > s.id;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => { if (isPassed) setStep(s.id); }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isCurrent
                      ? "bg-white border border-emerald-500 shadow-2xs text-slate-900"
                      : isPassed
                      ? "text-emerald-700 hover:bg-white/60 cursor-pointer"
                      : "text-slate-400 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                      isCurrent
                        ? "text-white shadow-2xs"
                        : isPassed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                    style={isCurrent ? { backgroundColor: T.greenPrimary } : {}}
                  >
                    {isPassed ? <CheckCircle2 size={15} /> : s.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className={`text-xs font-semibold truncate ${isCurrent ? "text-slate-900 font-bold" : "text-slate-600"}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{s.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/30 space-y-6">
          {submitted && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs flex items-center gap-3 animate-scale-in">
              <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-xs" style={{ backgroundColor: T.greenPrimary }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-sm font-bold">Claim Submitted Successfully!</p>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Reference: <span className="font-mono font-bold">{claimRefNo}</span>. Total logged: <span className="font-bold">{fmtN(grandTotal)}</span>.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Claimant & Organization Details</h3>
                  <p className="text-xs text-slate-500 font-normal">Basic claimant identification and routing.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Claimant Name</label>
                  <input
                    type="text"
                    required
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Claim Type</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Audit">Audit</option>
                    <option value="Supervision">Supervision</option>
                    <option value="Staff Expense">Staff Expense</option>
                    <option value="Payment Request Form">Payment Request Form</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Filing Date</label>
                  <input
                    type="date"
                    required
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Halal And Haram Distinction Development Initiative (HDI)"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Line Manager Name"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Contact E-Mail</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@hdi.org"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Claim Reasons & Options</h3>
                    <p className="text-xs text-slate-500 font-normal">Specify business justification options.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addReasonRow}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus size={15} /> Add Reason
                </button>
              </div>

              <div className="space-y-3">
                {reasons.map((r) => (
                  <div key={r.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex-1">
                      <select
                        value={r.option}
                        onChange={(e) => updateReason(r.id, "option", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 bg-white"
                      >
                        <option value="">....Select Option....</option>
                        <option value="Official Duty Expense">Official Duty Expense</option>
                        <option value="Overseas Travel">Overseas Travel</option>
                        <option value="Training">Training</option>
                        <option value="Event">Event</option>
                        <option value="Seminar/Conference">Seminar/Conference</option>
                        <option value="Office Expense">Office Expense</option>
                        <option value="Meeting">Meeting</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={r.chg}
                        onChange={(e) => updateReason(r.id, "chg", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">Chargeable (Chg)</span>
                    </label>

                    {reasons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReasonRow(r.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center justify-center cursor-pointer"
                        title="Remove Reason"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Expense Itemization Breakdown</h3>
                    <p className="text-xs text-slate-500 font-normal">Add each individual expenditure line item.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                  style={{ backgroundColor: T.greenPrimary }}
                >
                  <Plus size={16} /> Add Expense Item
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white font-semibold" style={{ backgroundColor: T.greenPrimary }}>
                      <th className="text-left px-4 py-3.5 min-w-[120px] whitespace-nowrap">Type</th>
                      <th className="text-left px-4 py-3.5 min-w-[150px] whitespace-nowrap">Description</th>
                      <th className="text-left px-3 py-3.5 w-24 whitespace-nowrap">Currency</th>
                      <th className="text-right px-3 py-3.5 w-28 whitespace-nowrap">Credit Card</th>
                      <th className="text-right px-3 py-3.5 w-28 whitespace-nowrap">Cash</th>
                      <th className="text-right px-3 py-3.5 w-24 whitespace-nowrap">VAT</th>
                      <th className="text-right px-4 py-3.5 w-28 whitespace-nowrap">Total</th>
                      <th className="text-center px-3 py-3.5 w-32 whitespace-nowrap">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <select
                            value={item.type}
                            onChange={(e) => updateItem(item.id, "type", e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 outline-none bg-white focus:border-emerald-600 shadow-2xs"
                          >
                            {TYPE_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(item.id, "category", e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none bg-white focus:border-emerald-600"
                          >
                            <option value="">....Select Description....</option>
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.currency}
                            onChange={(e) => updateItem(item.id, "currency", e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs font-medium text-slate-800 outline-none bg-white focus:border-emerald-600"
                          >
                            <option value="NGN">NGN (₦)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.card || ""}
                            onChange={(e) => updateItem(item.id, "card", e.target.value)}
                            placeholder="0.00"
                            className="w-full border rounded-xl px-3 py-2 text-xs font-medium text-right outline-none border-slate-200"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.cash || ""}
                            onChange={(e) => updateItem(item.id, "cash", e.target.value)}
                            placeholder="0.00"
                            className="w-full border rounded-xl px-3 py-2 text-xs font-medium text-right outline-none border-slate-200"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.vat || ""}
                            onChange={(e) => updateItem(item.id, "vat", e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-right outline-none"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800 text-xs">
                          {fmtCurrency(item.total, CURRENCY_SYMBOLS[item.currency] || "₦")}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openNoteModal(item)}
                              className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                                item.note ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                              }`}
                            >
                              <MessageSquare size={12} />
                              <span className="hidden sm:inline">{item.note ? "Noted" : "Note"}</span>
                            </button>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(item.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-800 text-xs">
                      <td colSpan={3} className="px-4 py-3.5 text-right uppercase tracking-wider text-slate-600">
                        Grand Subtotals ({activeSymbol}):
                      </td>
                      <td className="px-3 py-3.5 text-right">{fmtCurrency(subtotalCard, activeSymbol)}</td>
                      <td className="px-3 py-3.5 text-right">{fmtCurrency(subtotalCash, activeSymbol)}</td>
                      <td className="px-3 py-3.5 text-right">{fmtCurrency(subtotalVat, activeSymbol)}</td>
                      <td className="px-4 py-3.5 text-right text-emerald-800 text-sm font-bold">{fmtCurrency(grandTotal, activeSymbol)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Add Attachments & Supporting Documents</h3>
                      <p className="text-xs text-slate-500 font-normal">Attach receipts, invoices, or supporting files.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 px-3 py-1 bg-slate-100 rounded-full">
                      {uploadedFiles.length} files attached
                    </span>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus size={15} /> Add Attachment
                    </button>
                  </div>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3
                    ${dragActive ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]" : "border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300"}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center shadow-inner">
                    <PlusCircle size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="text-emerald-700 hover:underline">Click to browse</span> or drag and drop files here
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Supports JPG, PNG, PDF up to 10MB
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {uploadedFiles.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                            {item.name.split('.').pop().slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{item.size}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-sm tracking-tight text-emerald-300">Claim Application Summary</h4>
                  <span className="text-xs font-mono font-semibold bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                    {claimRefNo}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400">Claimant</p>
                    <p className="font-semibold text-white mt-0.5">{claimantName || currentUser}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Claim Type</p>
                    <p className="font-semibold text-white mt-0.5">{claimType || "Standard"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Filing Date</p>
                    <p className="font-semibold text-white mt-0.5">{claimDate}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Grand Total Amount</p>
                    <p className="font-bold text-emerald-400 text-sm mt-0.5">{fmtCurrency(grandTotal, activeSymbol)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeNoteModalItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <MessageSquare size={18} />
                  <h3 className="font-bold text-sm text-slate-800">Add Item Note / Other Info</h3>
                </div>
                <button type="button" onClick={() => setActiveNoteModalItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
              </div>
              <p className="text-xs text-slate-500">Provide details for <span className="font-bold text-slate-700">{activeNoteModalItem.category || "this expense line"}</span>.</p>
              <textarea rows={4} value={noteModalText} onChange={(e) => setNoteModalText(e.target.value)} placeholder="Enter explanatory notes..." className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 shadow-2xs" />
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setActiveNoteModalItem(null)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600">Cancel</button>
                <button type="button" onClick={saveNoteModal} className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs" style={{ backgroundColor: T.greenPrimary }}>Save Note</button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Step {step} of 4
            </span>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                style={{ backgroundColor: T.greenPrimary }}
              >
                <span>Next</span>
                <ChevronRightIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitForm}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                style={{ backgroundColor: T.greenPrimary }}
              >
                <CheckCircle2 size={16} />
                <span>Submit Claim Application</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* USERS VIEW                                                        */
/* ---------------------------------------------------------------- */
function UsersView({ users, onAddUser, onUpdateUser, onDeleteUser, role }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", username: "", role: "user", password: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", username: "", role: "user", password: "" });

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
    setForm({ name: "", email: "", username: "", role: "user", password: "" });
    setShowForm(false);
  };

  const startEdit = (u) => {
    setEditingUser(u);
    setEditForm({ _id: u._id, name: u.name, email: u.email, username: u.username, role: u.role, password: u.password });
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editForm.name) return;
    onUpdateUser({ ...editForm, _id: editingUser._id, username: editingUser.username });
    setEditingUser(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">User Account Management</h2>
          <p className="text-xs text-slate-400 font-medium">Manage organization accounts, credentials and system roles.</p>
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
              <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none font-medium focus:border-emerald-600" placeholder="email@hdiportal.com" />
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
              {users.map((u) => {
                const roleInfo = ROLES.find((r) => r.id === u.role);
                return (
                  <tr key={u.username} className="hover:bg-slate-50 transition-colors font-medium">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-800 font-bold">{u.username}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{u.password || "••••••••"}</td>
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <form onSubmit={submitEdit} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">Edit Account ({editingUser.username})</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                <input required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} type="email" className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <input value={editForm.password || ""} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} type="text" className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-emerald-600 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none bg-white focus:border-emerald-600">
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold text-white shadow-xs" style={{ backgroundColor: T.greenPrimary }}>Save Changes</button>
            </div>
          </form>
        </div>
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
  const [loadingData, setLoadingData] = useState(false);

  const fetchBackendData = async () => {
    if (!loggedInUser) return;
    setLoadingData(true);
    try {
      const fetchedClaims = await api.getClaims();
      setClaims(fetchedClaims.map(c => ({
        ...c,
        id: c.claimId || c.id,
        claimant: c.claimantName || c.claimant
      })));

      if (loggedInUser.role === "admin" || loggedInUser.role === "financial_officer") {
        const fetchedUsers = await api.getUsers();
        setUsers(fetchedUsers.map(u => ({
          ...u,
          username: u.email.split("@")[0]
        })));
      }
    } catch (err) {
      console.error("Error loading data from backend:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem("hdi_user", JSON.stringify(loggedInUser));
      fetchBackendData();
    } else {
      api.logout();
      setClaims([]);
      setUsers([]);
    }
  }, [loggedInUser]);

  const role = loggedInUser?.role || "user";
  const currentUser = loggedInUser?.name || loggedInUser?.username || "";

  const access = MENU_ACCESS[role] || MENU_ACCESS.user || ["dashboard"];
  const view = access.includes(activeView) ? activeView : "dashboard";

  const handleTransition = async (id, newStatus, note) => {
    try {
      const updated = await api.updateClaimStatus(id, newStatus, note);
      setClaims((prev) =>
        prev.map((c) => (c.id === id || c.claimId === id || c._id === id ? { ...updated, id: updated.claimId, claimant: updated.claimantName } : c))
      );
    } catch (err) {
      alert("Error updating claim status: " + err.message);
    }
  };

  const handleDeleteClaim = async (id) => {
    try {
      await api.deleteClaim(id);
      setClaims((prev) => prev.filter((c) => c.id !== id && c.claimId !== id && c._id !== id));
    } catch (err) {
      alert("Error deleting claim: " + err.message);
    }
  };

  const handleSubmitClaim = async (newClaimData) => {
    try {
      const created = await api.createClaim(newClaimData);
      setClaims((prev) => [{ ...created, id: created.claimId, claimant: created.claimantName }, ...prev]);
    } catch (err) {
      alert("Error submitting claim: " + err.message);
    }
  };

  const handleAddUser = async (u) => {
    try {
      const created = await api.createUser(u);
      setUsers((prev) => [{ ...created, username: created.email.split("@")[0] }, ...prev]);
    } catch (err) {
      alert("Error adding user: " + err.message);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const updated = await api.updateUser(updatedUser._id, updatedUser);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...updated, username: updated.email.split("@")[0] } : u)));
    } catch (err) {
      alert("Error updating user: " + err.message);
    }
  };

  const handleDeleteUser = async (userIdOrUsername) => {
    try {
      const targetUser = users.find(u => u._id === userIdOrUsername || u.username === userIdOrUsername);
      if (targetUser) {
        await api.deleteUser(targetUser._id);
        setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      }
    } catch (err) {
      alert("Error deleting user: " + err.message);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!loggedInUser) {
    return <LoginPage onLogin={(user) => { setLoggedInUser(user); setActiveView("dashboard"); }} usersList={users.length > 0 ? users : USERS_SEED} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800">
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
        />

        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {(view === "dashboard" || view === "manage-claim-sheet") && (
            <DashboardView
              role={role}
              claims={claims}
              users={users}
              currentUser={currentUser}
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
              onClose={() => setActiveView("dashboard")}
            />
          )}
          {["new-claim-list", "reviews-list", "further-approval", "approved-for-payment", "paid-list", "pending-claim-list", "rejected-claim-list", "all-claims-list"].includes(view) && (
            <ClaimListView
              view={view}
              role={role}
              claims={claims}
              onTransition={handleTransition}
              onDelete={handleDeleteClaim}
              currentUser={currentUser}
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
            />
          )}
        </main>
      </div>
    </div>
  );
}

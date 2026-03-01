"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3,
    Wallet,
    TrendingUp,
    Download,
    FileText,
    Copy,
    Info,
    Calendar,
    Check,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DateRangePicker from "@/components/reports/DateRangePicker";
import IncomeExpenseReport from "@/components/reports/IncomeExpenseReport";
import AccountBalanceReport from "@/components/reports/AccountBalanceReport";
import SpendingTrendsReport from "@/components/reports/SpendingTrendsReport";
import { exportReportToPDF, exportReportToExcel } from "@/lib/utils/export";

type ReportType = "income-expense" | "account-balance" | "spending-trends";

export default function ReportsPage() {
    const [activeReport, setActiveReport] =
        useState<ReportType>("income-expense");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [copied, setCopied] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const handleDateRangeChange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
    };

    const reports = [
        {
            id: "income-expense" as ReportType,
            name: "Income & Expenses",
            description: "Cash flow analysis",
            icon: BarChart3,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            requiresDateRange: true,
        },
        {
            id: "account-balance" as ReportType,
            name: "Account Balances",
            description: "Net worth snapshot",
            icon: Wallet,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            requiresDateRange: false,
        },
        {
            id: "spending-trends" as ReportType,
            name: "Spending Trends",
            description: "Category breakdowns",
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            requiresDateRange: false,
        },
    ];

    const activeReportConfig = reports.find((r) => r.id === activeReport);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = () => {
        if (reportData) {
            exportReportToPDF(activeReport, reportData, { startDate, endDate });
        }
    };

    const handleExportExcel = () => {
        if (reportData) {
            exportReportToExcel(activeReport, reportData);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Analytics
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Deep dive into your financial health.
                        </p>
                    </div>
                </div>

                {/* Report Selector Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reports.map((report) => {
                        const isActive = activeReport === report.id;
                        const Icon = report.icon;

                        return (
                            <button
                                key={report.id}
                                onClick={() => setActiveReport(report.id)}
                                className={`
                  relative p-5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden
                  ${
                      isActive
                          ? `bg-slate-900 border-indigo-500/50 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]`
                          : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  }
                `}
                            >
                                {/* Active Indicator Glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                                )}

                                <div className="relative flex items-center gap-4">
                                    <div
                                        className={`p-3 rounded-xl ${isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-400 group-hover:text-slate-300"}`}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3
                                            className={`font-semibold ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}
                                        >
                                            {report.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Filters Section (Conditionally Rendered) */}
                <AnimatePresence mode="wait">
                    {activeReportConfig?.requiresDateRange && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <Calendar className="w-4 h-4" />
                                    <span>Date Range:</span>
                                </div>
                                <div className="flex-1 w-full sm:w-auto">
                                    {/* Wrapping the imported DateRangePicker to ensure it fits theme if possible, 
                       otherwise relying on global CSS or passing props if supported */}
                                    <DateRangePicker
                                        onDateRangeChange={
                                            handleDateRangeChange
                                        }
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Report Viewport */}
                <motion.div
                    key={activeReport}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden"
                >
                    {/* Decorative background blur inside the report card */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

                    {activeReport === "income-expense" && (
                        <IncomeExpenseReport
                            startDate={startDate}
                            endDate={endDate}
                            onDataLoaded={setReportData}
                        />
                    )}

                    {activeReport === "account-balance" && (
                        <AccountBalanceReport onDataLoaded={setReportData} />
                    )}

                    {activeReport === "spending-trends" && (
                        <SpendingTrendsReport onDataLoaded={setReportData} />
                    )}
                </motion.div>

                {/* Footer Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Export Tools */}
                    <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Export Data
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleExportExcel}
                                disabled={!reportData}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FileText className="w-4 h-4" />
                                Export Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={!reportData}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors text-sm font-medium"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                {copied ? "Copied!" : "Copy to Clipboard"}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">
                            * Exports include all data currently visible in the
                            selected report timeframe.
                        </p>
                    </div>

                    {/* Tips Card */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/50 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-semibold text-white">
                                Pro Tips
                            </h3>
                        </div>
                        <ul className="space-y-3">
                            {[
                                "Compare month-to-month to spot inflation.",
                                "Review subscription costs quarterly.",
                                "Track 'Needs' vs 'Wants' in trends.",
                            ].map((tip, i) => (
                                <li
                                    key={i}
                                    className="flex gap-3 text-sm text-slate-300"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

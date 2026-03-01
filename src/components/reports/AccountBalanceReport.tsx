"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Wallet,
    Briefcase,
    Landmark,
    Banknote,
    PieChart,
    Loader2,
    AlertCircle,
    CreditCard,
    Building2,
    CalendarClock,
} from "lucide-react";
import { useReports } from "@/hooks/useReports";

interface AccountBalanceReportProps {
    onDataLoaded?: (data: any) => void;
}

export default function AccountBalanceReport({
    onDataLoaded,
}: AccountBalanceReportProps) {
    const { generateAccountBalanceReport, isLoading, error } = useReports();
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        const data = await generateAccountBalanceReport();
        setReportData(data);
        if (onDataLoaded && data) {
            onDataLoaded(data);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // Helper for consistent iconography and colors
    const getAccountStyle = (type: string) => {
        switch (type) {
            case "SAVINGS":
                return {
                    icon: Wallet,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    bar: "bg-emerald-500",
                };
            case "SALARY":
                return {
                    icon: Briefcase,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                    bar: "bg-blue-500",
                };
            case "CURRENT":
                return {
                    icon: CreditCard,
                    color: "text-indigo-400",
                    bg: "bg-indigo-500/10",
                    border: "border-indigo-500/20",
                    bar: "bg-indigo-500",
                };
            case "CASH":
                return {
                    icon: Banknote,
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    bar: "bg-amber-500",
                };
            default:
                return {
                    icon: Landmark,
                    color: "text-slate-400",
                    bg: "bg-slate-500/10",
                    border: "border-slate-500/20",
                    bar: "bg-slate-500",
                };
        }
    };

    const getAccountTypeLabel = (type: string) => {
        switch (type) {
            case "SAVINGS":
                return "Savings Account";
            case "SALARY":
                return "Salary Account";
            case "CURRENT":
                return "Checking / Current";
            case "CASH":
                return "Physical Cash";
            default:
                return "Other";
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p>Calculating net worth...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center text-center">
                <div className="p-3 bg-red-500/20 rounded-full mb-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                    Report Failed
                </h3>
                <p className="text-red-200 mt-1">{error}</p>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                    <Landmark className="w-8 h-8 opacity-50" />
                </div>
                <p>No account data available.</p>
            </div>
        );
    }

    const { summary, accounts, distribution } = reportData;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Balance */}
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Wallet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Total Net Worth
                        </p>
                        <p className="text-2xl font-bold text-white mt-0.5">
                            {formatCurrency(summary.totalBalance)}
                        </p>
                    </div>
                </div>

                {/* Total Accounts */}
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Active Accounts
                        </p>
                        <p className="text-2xl font-bold text-white mt-0.5">
                            {summary.accountCount}
                        </p>
                    </div>
                </div>

                {/* Diversity */}
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <PieChart className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Asset Classes
                        </p>
                        <p className="text-2xl font-bold text-white mt-0.5">
                            {Object.keys(summary.balancesByType).length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Distribution (Takes 1 column on large screens) */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-base font-semibold text-white mb-6">
                        Asset Distribution
                    </h3>
                    <div className="space-y-5">
                        {distribution.map((item: any) => {
                            const style = getAccountStyle(item.type);
                            const Icon = style.icon;

                            return (
                                <div key={item.type}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-1.5 rounded-lg ${style.bg} ${style.border}`}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 ${style.color}`}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">
                                                    {getAccountTypeLabel(
                                                        item.type,
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {item.percentage.toFixed(1)}
                                                    %
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-white">
                                            {formatCurrency(item.balance)}
                                        </p>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${Math.min(item.percentage, 100)}%`,
                                            }}
                                            transition={{
                                                duration: 1,
                                                ease: "easeOut",
                                            }}
                                            className={`h-full rounded-full ${style.bar}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Account Details Table (Takes 2 columns on large screens) */}
                <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="font-semibold text-white">
                            Account Details
                        </h3>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Account Name</th>
                                    <th className="px-6 py-4">Institution</th>
                                    <th className="px-6 py-4">Balance</th>
                                    <th className="px-6 py-4">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {accounts.map((account: any) => {
                                    const style = getAccountStyle(account.type);
                                    const Icon = style.icon;

                                    return (
                                        <tr
                                            key={account.id}
                                            className="group hover:bg-slate-900/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`p-2 rounded-lg ${style.bg} ${style.border}`}
                                                    >
                                                        <Icon
                                                            className={`w-4 h-4 ${style.color}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-200">
                                                            {account.name}
                                                        </div>
                                                        {account.accountNumber && (
                                                            <div className="text-xs text-slate-500 font-mono">
                                                                ••••{" "}
                                                                {
                                                                    account.accountNumber
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {account.bank || (
                                                    <span className="text-slate-600 italic">
                                                        N/A
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-semibold">
                                                    {formatCurrency(
                                                        account.currentBalance,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {account.transactions &&
                                                account.transactions.length >
                                                    0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <CalendarClock className="w-3.5 h-3.5" />
                                                        <span className="text-xs">
                                                            {new Date(
                                                                account
                                                                    .transactions[0]
                                                                    .date,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600">
                                                        No recent activity
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

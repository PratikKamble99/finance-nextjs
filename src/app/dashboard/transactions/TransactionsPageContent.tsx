"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    Download,
    X,
    Check,
    Calendar,
    CreditCard,
    Smartphone,
    Landmark,
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRightLeft,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Tag,
    Store,
    Wallet,
    Edit3,
    Trash2,
    MoreHorizontal,
    Copy,
    FileText,
    TrendingUp,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSimpleTransactionForm } from "@/hooks/useSimpleTransactionForm";
import { useTransactionList } from "@/hooks/useTransactionList";
import {
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from "@/lib/actions/transaction-actions";
import { exportToPDF, exportToExcel } from "@/lib/utils/export";

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK";

export default function TransactionsPageContent() {
    const searchParams = useSearchParams();
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
        type: "" as "" | TransactionType,
        categoryId: "",
        accountId: "",
        paymentMode: "" as "" | PaymentMode,
        dateFrom: "",
        dateTo: "",
        searchQuery: "",
    });

    // Auto-open logic
    useEffect(() => {
        if (searchParams.get("action") === "add") {
            setShowForm(true);
        }
    }, [searchParams]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown) {
                const target = event.target as HTMLElement;
                // Don't close if clicking inside the dropdown or on the dropdown button
                if (
                    !target.closest(".dropdown-menu") &&
                    !target.closest(".dropdown-button")
                ) {
                    setShowDropdown(null);
                }
                if (!target.closest(".export-dropdown")) {
                    setShowExportDropdown(false);
                }
            } else if (showExportDropdown) {
                const target = event.target as HTMLElement;
                if (!target.closest(".export-dropdown")) {
                    setShowExportDropdown(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const {
        accounts,
        categories,
        isLoadingAccounts,
        isLoadingCategories,
        error: formError,
        loadCategories,
    } = useSimpleTransactionForm();

    const {
        transactions,
        isLoading: isLoadingTransactions,
        error: transactionError,
        totalCount,
        currentPage,
        totalPages,
        loadTransactions,
    } = useTransactionList();

    const [formData, setFormData] = useState({
        type: "EXPENSE" as TransactionType,
        amount: "",
        currency: "USD",
        date: new Date().toISOString().split("T")[0],
        description: "",
        categoryId: "",
        accountId: "",
        paymentMode: "CARD" as PaymentMode,
        merchant: "",
        tags: [] as string[],
        isRecurring: false,
    });

    // Reset form when editing transaction changes
    useEffect(() => {
        if (editingTransaction) {
            setFormData({
                type: editingTransaction.type,
                amount: editingTransaction.amount.toString(),
                currency: editingTransaction.currency,
                date: new Date(editingTransaction.date)
                    .toISOString()
                    .split("T")[0],
                description: editingTransaction.description || "",
                categoryId: editingTransaction.categoryId || "",
                accountId: editingTransaction.accountId || "",
                paymentMode: editingTransaction.paymentMode || "CARD",
                merchant: editingTransaction.merchant || "",
                tags:
                    editingTransaction.tags?.map(
                        (t: any) => t.tag?.name || t.name || t,
                    ) || [],
                isRecurring: editingTransaction.isRecurring || false,
            });
        } else {
            setFormData({
                type: "EXPENSE",
                amount: "",
                currency: "USD",
                date: new Date().toISOString().split("T")[0],
                description: "",
                categoryId: "",
                accountId: "",
                paymentMode: "CARD",
                merchant: "",
                tags: [],
                isRecurring: false,
            });
        }
    }, [editingTransaction]);

    useEffect(() => {
        if (formData.type !== "TRANSFER") {
            loadCategories(formData.type);
        }
    }, [formData.type, loadCategories]);

    // UI Helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getPaymentModeIcon = (mode?: string) => {
        switch (mode) {
            case "CASH":
                return <Banknote className="w-4 h-4" />;
            case "CARD":
                return <CreditCard className="w-4 h-4" />;
            case "UPI":
                return <Smartphone className="w-4 h-4" />;
            case "BANK":
                return <Landmark className="w-4 h-4" />;
            default:
                return <CreditCard className="w-4 h-4" />;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || !formData.description) {
            setSubmitMessage({
                type: "error",
                text: "Please fill in amount and description",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitMessage(null);

            const formDataToSubmit = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === "tags")
                    formDataToSubmit.append(key, JSON.stringify(value));
                else if (key === "date")
                    formDataToSubmit.append(
                        key,
                        new Date(value as string).toISOString(),
                    );
                else formDataToSubmit.append(key, String(value));
            });

            let result;
            if (editingTransaction) {
                result = await updateTransaction(
                    editingTransaction.id,
                    formDataToSubmit,
                );
            } else {
                result = await createTransaction(formDataToSubmit);
            }

            if (result.success) {
                setSubmitMessage({
                    type: "success",
                    text: editingTransaction
                        ? "Transaction updated successfully!"
                        : "Transaction created successfully!",
                });
                setFormData({
                    type: "EXPENSE",
                    amount: "",
                    currency: "USD",
                    date: new Date().toISOString().split("T")[0],
                    description: "",
                    categoryId: "",
                    accountId: "",
                    paymentMode: "CARD",
                    merchant: "",
                    tags: [],
                    isRecurring: false,
                });
                setEditingTransaction(null);
                loadTransactions(currentPage);
                setTimeout(() => {
                    setShowForm(false);
                    setSubmitMessage(null);
                }, 1500);
            } else {
                setSubmitMessage({
                    type: "error",
                    text: result.error || "Failed to save transaction",
                });
            }
        } catch (error) {
            console.error("Error submitting:", error);
            setSubmitMessage({
                type: "error",
                text: "Failed to save transaction.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (transaction: any) => {
        if (showForm) {
            setShowForm(false);
            setTimeout(() => {
                setEditingTransaction(transaction);
                setShowForm(true);
                setShowDropdown(null);
                setSubmitMessage(null);
            }, 50);
        } else {
            setEditingTransaction(transaction);
            setShowForm(true);
            setShowDropdown(null);
            setSubmitMessage(null);
        }
    };

    const handleDelete = async (transactionId: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) {
            return;
        }

        try {
            const result = await deleteTransaction(transactionId);
            if (result.success) {
                setSubmitMessage({
                    type: "success",
                    text: "Transaction deleted successfully!",
                });
                loadTransactions(currentPage);
                setTimeout(() => setSubmitMessage(null), 3000);
            } else {
                setSubmitMessage({
                    type: "error",
                    text: result.error || "Failed to delete transaction",
                });
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            setSubmitMessage({
                type: "error",
                text: "Failed to delete transaction.",
            });
        }
        setShowDropdown(null);
    };

    const handleRepeat = (transaction: any) => {
        // Ensure we're in "Add" mode, not editing
        setEditingTransaction(null);

        // Slight delay to ensure form resets before pre-filling
        setTimeout(() => {
            setFormData({
                type: transaction.type,
                amount: transaction.amount.toString(),
                currency: transaction.currency,
                // Set date to today for the repeated transaction
                date: new Date().toISOString().split("T")[0],
                description: transaction.description || "",
                categoryId: transaction.categoryId || "",
                accountId: transaction.accountId || "",
                paymentMode: transaction.paymentMode || "CARD",
                merchant: transaction.merchant || "",
                // Clone tags (extracting just the name/tag)
                tags:
                    transaction.tags?.map(
                        (t: any) => t.tag?.name || t.name || t,
                    ) || [],
                isRecurring: transaction.isRecurring || false,
            });

            setShowForm(true);
            setShowDropdown(null);
            setSubmitMessage(null);
        }, 50);
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
        setShowForm(false);
        setSubmitMessage(null);
    };

    // Filter transactions based on filter state
    const filteredTransactions = transactions.filter((t) => {
        // Type filter
        if (filters.type && t.type !== filters.type) return false;

        // Category filter
        if (filters.categoryId && t.category?.name) {
            // Find the category name from the categories list
            const selectedCategory = categories.find(
                (c) => c.id === filters.categoryId,
            );
            if (selectedCategory && t.category.name !== selectedCategory.name)
                return false;
        }

        // Account filter
        if (filters.accountId && t.account?.name) {
            // Find the account name from the accounts list
            const selectedAccount = accounts.find(
                (a) => a.id === filters.accountId,
            );
            if (selectedAccount && t.account.name !== selectedAccount.name)
                return false;
        }

        // Payment mode filter
        if (filters.paymentMode && t.paymentMode !== filters.paymentMode)
            return false;

        // Date from filter
        if (filters.dateFrom && new Date(t.date) < new Date(filters.dateFrom))
            return false;

        // Date to filter
        if (filters.dateTo && new Date(t.date) > new Date(filters.dateTo))
            return false;

        // Search query filter (description or merchant)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesDescription = t.description
                ?.toLowerCase()
                .includes(query);
            const matchesMerchant = t.merchant?.toLowerCase().includes(query);
            if (!matchesDescription && !matchesMerchant) return false;
        }

        return true;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 justify-between sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Transactions
                        </h1>
                        <p className="text-sm text-slate-400">
                            Monitor your cash flow and expenses.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`hidden sm:flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm ${
                                showFilters
                                    ? "text-white bg-indigo-600 border-indigo-600"
                                    : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>

                        <div className="relative export-dropdown">
                            <button
                                onClick={() =>
                                    setShowExportDropdown(!showExportDropdown)
                                }
                                className="hidden gap-2 items-center px-3 py-2 text-sm rounded-lg border transition-colors sm:flex bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>

                            <AnimatePresence>
                                {showExportDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="overflow-hidden absolute right-0 z-50 mt-2 w-40 rounded-xl border shadow-xl bg-slate-900 border-slate-800"
                                    >
                                        <button
                                            onClick={() => {
                                                exportToPDF(
                                                    filteredTransactions,
                                                );
                                                setShowExportDropdown(false);
                                            }}
                                            className="flex gap-3 items-center px-4 py-3 w-full text-sm transition-colors text-slate-300 hover:bg-slate-800 hover:text-white"
                                        >
                                            <FileText className="w-4 h-4 text-red-400" />
                                            Export to PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportToExcel(
                                                    filteredTransactions,
                                                );
                                                setShowExportDropdown(false);
                                            }}
                                            className="flex gap-3 items-center px-4 py-3 w-full text-sm border-t transition-colors text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800/50"
                                        >
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            Export to Excel
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={() => {
                                console.log(showForm);
                                if (showForm) {
                                    // Close the form
                                    setShowForm(false);
                                    setEditingTransaction(null);
                                    setSubmitMessage(null);
                                } else {
                                    // Open form in add mode
                                    setEditingTransaction(null);
                                    setShowForm(true);
                                    setSubmitMessage(null);
                                }
                            }}
                            className="flex gap-2 items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-lg transition-all hover:bg-indigo-500 shadow-indigo-500/20"
                        >
                            {showForm ? (
                                <X className="w-4 h-4" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {showForm ? "Close" : "New Entry"}
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <AnimatePresence>
                    {submitMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`p-4 rounded-xl border flex items-center gap-3 ${
                                submitMessage.type === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                        >
                            {submitMessage.type === "success" ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <X className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">
                                {submitMessage.text}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 rounded-2xl border backdrop-blur-sm bg-slate-900/50 border-slate-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="flex gap-2 items-center text-lg font-semibold text-white">
                                        <Filter className="w-5 h-5 text-indigo-400" />
                                        Filter Transactions
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setFilters({
                                                type: "",
                                                categoryId: "",
                                                accountId: "",
                                                paymentMode: "",
                                                dateFrom: "",
                                                dateTo: "",
                                                searchQuery: "",
                                            });
                                        }}
                                        className="text-sm transition-colors text-slate-400 hover:text-white"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {/* Search */}
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            Search
                                        </label>
                                        <div className="relative">
                                            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                <Search className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                value={filters.searchQuery}
                                                onChange={(e) =>
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        searchQuery:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                                placeholder="Search by description or merchant..."
                                            />
                                        </div>
                                    </div>

                                    {/* Transaction Type */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            Type
                                        </label>
                                        <select
                                            value={filters.type}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    type: e.target.value as
                                                        | ""
                                                        | TransactionType,
                                                }))
                                            }
                                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                        >
                                            <option value="">All Types</option>
                                            <option value="INCOME">
                                                Income
                                            </option>
                                            <option value="EXPENSE">
                                                Expense
                                            </option>
                                            <option value="TRANSFER">
                                                Transfer
                                            </option>
                                        </select>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            Category
                                        </label>
                                        <select
                                            value={filters.categoryId}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    categoryId: e.target.value,
                                                }))
                                            }
                                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                        >
                                            <option value="">
                                                All Categories
                                            </option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Account */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            Account
                                        </label>
                                        <select
                                            value={filters.accountId}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    accountId: e.target.value,
                                                }))
                                            }
                                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                        >
                                            <option value="">
                                                All Accounts
                                            </option>
                                            {accounts.map((account) => (
                                                <option
                                                    key={account.id}
                                                    value={account.id}
                                                >
                                                    {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Payment Mode */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            Payment Mode
                                        </label>
                                        <select
                                            value={filters.paymentMode}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    paymentMode: e.target
                                                        .value as
                                                        | ""
                                                        | PaymentMode,
                                                }))
                                            }
                                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                        >
                                            <option value="">All Modes</option>
                                            <option value="CASH">Cash</option>
                                            <option value="CARD">Card</option>
                                            <option value="UPI">UPI</option>
                                            <option value="BANK">
                                                Bank Transfer
                                            </option>
                                        </select>
                                    </div>

                                    {/* Date From */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    dateFrom: e.target.value,
                                                }))
                                            }
                                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Date To */}
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 ml-1 mb-1.5 block">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    dateTo: e.target.value,
                                                }))
                                            }
                                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transaction Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 mb-8 rounded-2xl border backdrop-blur-sm bg-slate-900/50 border-slate-800">
                                <h3 className="flex gap-2 items-center mb-6 text-lg font-semibold text-white">
                                    {editingTransaction ? (
                                        <>
                                            <Edit3 className="w-5 h-5 text-indigo-400" />
                                            Edit Transaction
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5 text-indigo-400" />
                                            Add Transaction
                                        </>
                                    )}
                                </h3>

                                {editingTransaction && (
                                    <div className="p-3 mb-4 rounded-lg border bg-indigo-500/10 border-indigo-500/20">
                                        <p className="text-sm text-indigo-300">
                                            Editing:{" "}
                                            <span className="font-medium">
                                                {editingTransaction.description}
                                            </span>{" "}
                                            (
                                            {formatCurrency(
                                                editingTransaction.amount,
                                            )}
                                            )
                                        </p>
                                    </div>
                                )}

                                {isLoadingAccounts && (
                                    <div className="flex gap-2 items-center mb-4 text-sm text-indigo-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Syncing account data...
                                    </div>
                                )}

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    {/* Type Selector */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {(
                                            [
                                                "INCOME",
                                                "EXPENSE",
                                                "TRANSFER",
                                            ] as TransactionType[]
                                        ).map((type) => (
                                            <label
                                                key={type}
                                                className="relative cursor-pointer group"
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={type}
                                                    checked={
                                                        formData.type === type
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            type: e.target
                                                                .value as TransactionType,
                                                            categoryId: "",
                                                        }))
                                                    }
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`
                          flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                          ${
                              formData.type === type
                                  ? type === "INCOME"
                                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]"
                                      : type === "EXPENSE"
                                        ? "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]"
                                        : "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]"
                                  : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                          }
                        `}
                                                >
                                                    {type === "INCOME" && (
                                                        <ArrowUpRight className="mb-1 w-5 h-5" />
                                                    )}
                                                    {type === "EXPENSE" && (
                                                        <ArrowDownRight className="mb-1 w-5 h-5" />
                                                    )}
                                                    {type === "TRANSFER" && (
                                                        <ArrowRightLeft className="mb-1 w-5 h-5" />
                                                    )}
                                                    <span className="text-xs font-bold tracking-wider">
                                                        {type}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Inputs Grid */}
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        {/* Amount */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Amount
                                            </label>
                                            <div className="relative">
                                                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                    $
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.amount}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            amount: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    className="block w-full pl-7 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Date
                                            </label>
                                            <div className="relative">
                                                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            date: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        description:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                                placeholder="What was this for?"
                                                required
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Category
                                            </label>
                                            <div className="relative">
                                                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <select
                                                    value={formData.categoryId}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            categoryId:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    disabled={
                                                        isLoadingCategories
                                                    }
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                                >
                                                    <option
                                                        value=""
                                                        className="text-slate-500"
                                                    >
                                                        {isLoadingCategories
                                                            ? "Loading..."
                                                            : "Select Category"}
                                                    </option>
                                                    {categories.map(
                                                        (category) => (
                                                            <option
                                                                key={
                                                                    category.id
                                                                }
                                                                value={
                                                                    category.id
                                                                }
                                                            >
                                                                {category.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none text-slate-500">
                                                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Account */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Account
                                            </label>
                                            <div className="relative">
                                                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                    <Wallet className="w-4 h-4" />
                                                </div>
                                                <select
                                                    value={formData.accountId}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            accountId:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                                >
                                                    <option value="">
                                                        Select Account
                                                    </option>
                                                    {accounts.map((account) => (
                                                        <option
                                                            key={account.id}
                                                            value={account.id}
                                                        >
                                                            {account.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none text-slate-500">
                                                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Merchant (Optional) */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Merchant (Optional)
                                            </label>
                                            <div className="relative">
                                                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                    <Store className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.merchant}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            merchant:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                                    placeholder="e.g. Starbucks"
                                                />
                                            </div>
                                        </div>
                                        {/* Payment Mode */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-xs font-medium text-slate-400">
                                                Payment Mode
                                            </label>
                                            <div className="relative">
                                                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                                    {getPaymentModeIcon(
                                                        formData.paymentMode,
                                                    )}
                                                </div>
                                                <select
                                                    value={formData.paymentMode}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            paymentMode: e
                                                                .target
                                                                .value as PaymentMode,
                                                        }))
                                                    }
                                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                                                >
                                                    <option value="CASH">
                                                        Cash
                                                    </option>
                                                    <option value="CARD">
                                                        Card
                                                    </option>
                                                    <option value="UPI">
                                                        UPI / Digital
                                                    </option>
                                                    <option value="BANK">
                                                        Bank Transfer
                                                    </option>
                                                </select>
                                                <div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none text-slate-500">
                                                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 justify-end pt-6 border-t border-slate-800">
                                        <button
                                            type="button"
                                            onClick={
                                                editingTransaction
                                                    ? handleCancelEdit
                                                    : () => setShowForm(false)
                                            }
                                            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                isSubmitting ||
                                                isLoadingAccounts
                                            }
                                            className="flex gap-2 items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-lg transition-all hover:bg-indigo-500 shadow-indigo-500/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            {isSubmitting
                                                ? "Saving..."
                                                : editingTransaction
                                                  ? "Update Transaction"
                                                  : "Save Transaction"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transaction List Container */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm flex flex-col min-h-[500px]">
                    {/* List Header */}
                    <div className="flex justify-between items-center p-5 border-b border-slate-800">
                        <h3 className="font-semibold text-white">
                            Recent Activity
                        </h3>
                        <span className="px-2 py-1 text-xs rounded-md border text-slate-500 bg-slate-950 border-slate-800">
                            {filteredTransactions.length}{" "}
                            {filteredTransactions.length !== totalCount &&
                                `of ${totalCount}`}{" "}
                            Entries
                        </span>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 p-2">
                        {isLoadingTransactions ? (
                            <div className="flex flex-col gap-3 justify-center items-center h-64 text-slate-500">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <p>Loading records...</p>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="flex flex-col gap-4 justify-center items-center h-64 text-slate-500">
                                <div className="flex justify-center items-center w-16 h-16 rounded-full bg-slate-800/50">
                                    <Banknote className="w-8 h-8 opacity-50" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-slate-300">
                                        {transactions.length === 0
                                            ? "No transactions yet"
                                            : "No matching transactions"}
                                    </p>
                                    <p className="text-sm">
                                        {transactions.length === 0
                                            ? "Record your first income or expense above."
                                            : "Try adjusting your filters to see more results."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredTransactions.map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex justify-between items-center p-3 rounded-xl border border-transparent transition-all group hover:bg-slate-800/50 hover:border-slate-700/50"
                                    >
                                        <div className="flex flex-1 gap-4 items-center">
                                            {/* Icon */}
                                            <div
                                                className={`
                        w-10 h-10 rounded-full flex items-center justify-center border shrink-0
                        ${t.type === "INCOME" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
                        ${t.type === "EXPENSE" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : ""}
                        ${t.type === "TRANSFER" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : ""}
                      `}
                                            >
                                                {t.type === "INCOME" && (
                                                    <ArrowUpRight className="w-5 h-5" />
                                                )}
                                                {t.type === "EXPENSE" && (
                                                    <ArrowDownRight className="w-5 h-5" />
                                                )}
                                                {t.type === "TRANSFER" && (
                                                    <ArrowRightLeft className="w-5 h-5" />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex gap-2 items-center">
                                                    <p className="font-medium truncate text-slate-200">
                                                        {t.description}
                                                    </p>
                                                    {t.merchant && (
                                                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                                            {t.merchant}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    {t.category && (
                                                        <span>
                                                            {t.category.name}
                                                        </span>
                                                    )}
                                                    <span>•</span>
                                                    <span>
                                                        {formatDate(t.date)}
                                                    </span>
                                                    <span className="hidden sm:inline">
                                                        •
                                                    </span>
                                                    <span className="flex hidden gap-1 items-center sm:inline">
                                                        {getPaymentModeIcon(
                                                            t.paymentMode,
                                                        )}{" "}
                                                        {t.paymentMode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Amount and Actions */}
                                        <div className="flex gap-3 items-center">
                                            <div className="text-right">
                                                <span
                                                    className={`block font-semibold ${
                                                        t.type === "INCOME"
                                                            ? "text-emerald-400"
                                                            : t.type ===
                                                                "EXPENSE"
                                                              ? "text-slate-200"
                                                              : "text-blue-400"
                                                    }`}
                                                >
                                                    {t.type === "EXPENSE"
                                                        ? "-"
                                                        : "+"}
                                                    {formatCurrency(t.amount)}
                                                </span>
                                                {t.account && (
                                                    <span className="text-xs text-slate-500">
                                                        {t.account.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions Dropdown */}
                                            <div className="relative">
                                                <button
                                                    onClick={() =>
                                                        setShowDropdown(
                                                            showDropdown ===
                                                                t.id
                                                                ? null
                                                                : t.id,
                                                        )
                                                    }
                                                    className="p-1 rounded-lg opacity-0 transition-all dropdown-button group-hover:opacity-100 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>

                                                {showDropdown === t.id && (
                                                    <div className="dropdown-menu absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(t)
                                                            }
                                                            className="flex gap-2 items-center px-3 py-2 w-full text-sm rounded-t-lg transition-colors text-slate-300 hover:bg-slate-700 hover:text-white"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleRepeat(t)
                                                            }
                                                            className="flex gap-2 items-center px-3 py-2 w-full text-sm transition-colors text-slate-300 hover:bg-slate-700 hover:text-white"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                            Repeat
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    t.id,
                                                                )
                                                            }
                                                            className="flex gap-2 items-center px-3 py-2 w-full text-sm text-red-400 rounded-b-lg transition-colors hover:bg-red-500/10 hover:text-red-300"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-4 border-t border-slate-800">
                            <button
                                onClick={() =>
                                    loadTransactions(currentPage - 1)
                                }
                                disabled={
                                    currentPage <= 1 || isLoadingTransactions
                                }
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-sm transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Prev
                            </button>

                            <span className="text-sm text-slate-500">
                                Page{" "}
                                <span className="font-medium text-slate-200">
                                    {currentPage}
                                </span>{" "}
                                of {totalPages}
                            </span>

                            <button
                                onClick={() =>
                                    loadTransactions(currentPage + 1)
                                }
                                disabled={
                                    currentPage >= totalPages ||
                                    isLoadingTransactions
                                }
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-sm transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

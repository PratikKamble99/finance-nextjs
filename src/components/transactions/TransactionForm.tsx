"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
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
    Tag,
    Store,
    Wallet,
    Edit3,
} from "lucide-react";
import { useSimpleTransactionForm } from "@/hooks/useSimpleTransactionForm";
import { createTransaction, updateTransaction } from "@/lib/actions/transaction-actions";

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK";

interface TransactionFormProps {
    initialData?: any;
    onCancel?: () => void;
}

export default function TransactionForm({ initialData, onCancel }: TransactionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const { accounts, categories, isLoadingAccounts, isLoadingCategories, loadCategories } =
        useSimpleTransactionForm();

    const [formData, setFormData] = useState({
        type: (initialData?.type || "EXPENSE") as TransactionType,
        amount: initialData?.amount ? initialData.amount.toString() : "",
        currency: initialData?.currency || "USD",
        date: initialData?.date
            ? new Date(initialData.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        description: initialData?.description || "",
        categoryId: initialData?.categoryId || "",
        accountId: initialData?.accountId || "",
        paymentMode: (initialData?.paymentMode || "CARD") as PaymentMode,
        merchant: initialData?.merchant || "",
        tags: initialData?.tags?.map((t: any) => t.tag?.name || t.name || t) || ([] as string[]),
        isRecurring: initialData?.isRecurring || false,
    });

    useEffect(() => {
        if (formData.type !== "TRANSFER") {
            loadCategories(formData.type);
        }
    }, [formData.type, loadCategories]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
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
                if (key === "tags") formDataToSubmit.append(key, JSON.stringify(value));
                else if (key === "date")
                    formDataToSubmit.append(key, new Date(value as string).toISOString());
                else formDataToSubmit.append(key, String(value));
            });

            let result;
            if (initialData?.id) {
                result = await updateTransaction(initialData.id, formDataToSubmit);
            } else {
                result = await createTransaction(formDataToSubmit);
            }

            if (result.success) {
                setSubmitMessage({
                    type: "success",
                    text: initialData
                        ? "Transaction updated successfully!"
                        : "Transaction created successfully!",
                });
                router.push("/dashboard/transactions");
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

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.push("/dashboard/transactions");
        }
    };

    return (
        <div className="p-6 mb-8 rounded-2xl border backdrop-blur-sm bg-slate-900/50 border-slate-800">
            <h3 className="flex gap-2 items-center mb-6 text-lg font-semibold text-white">
                {initialData ? (
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

            {initialData && (
                <div className="p-3 mb-4 rounded-lg border bg-indigo-500/10 border-indigo-500/20">
                    <p className="text-sm text-indigo-300">
                        Editing: <span className="font-medium">{initialData.description}</span> (
                        {formatCurrency(initialData.amount)})
                    </p>
                </div>
            )}

            {submitMessage && (
                <div
                    className={`p-4 mb-4 rounded-xl border flex items-center gap-3 ${
                        submitMessage.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                >
                    <span className="text-sm font-medium">{submitMessage.text}</span>
                </div>
            )}

            {isLoadingAccounts && (
                <div className="flex gap-2 items-center mb-4 text-sm text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing account data...
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {(["INCOME", "EXPENSE", "TRANSFER"] as TransactionType[]).map((type) => (
                        <label key={type} className="relative cursor-pointer group">
                            <input
                                type="radio"
                                name="type"
                                value={type}
                                checked={formData.type === type}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: e.target.value as TransactionType,
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
                                {type === "INCOME" && <ArrowUpRight className="mb-1 w-5 h-5" />}
                                {type === "EXPENSE" && <ArrowDownRight className="mb-1 w-5 h-5" />}
                                {type === "TRANSFER" && <ArrowRightLeft className="mb-1 w-5 h-5" />}
                                <span className="text-xs font-bold tracking-wider">{type}</span>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-medium text-slate-400">Amount</label>
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
                                        amount: e.target.value,
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
                        <label className="ml-1 text-xs font-medium text-slate-400">Date</label>
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
                                        date: e.target.value,
                                    }))
                                }
                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="ml-1 text-xs font-medium text-slate-400">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            placeholder="What was this for?"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-medium text-slate-400">Category</label>
                        <div className="relative">
                            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                <Tag className="w-4 h-4" />
                            </div>
                            <select
                                value={formData.categoryId}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        categoryId: e.target.value,
                                    }))
                                }
                                disabled={isLoadingCategories}
                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                            >
                                <option value="" className="text-slate-500">
                                    {isLoadingCategories ? "Loading..." : "Select Category"}
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none text-slate-500">
                                <ChevronLeft className="w-4 h-4 -rotate-90" />
                            </div>
                        </div>
                    </div>

                    {/* Account */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-medium text-slate-400">Account</label>
                        <div className="relative">
                            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <select
                                value={formData.accountId}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountId: e.target.value,
                                    }))
                                }
                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                            >
                                <option value="">Select Account</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none text-slate-500">
                                <ChevronLeft className="w-4 h-4 -rotate-90" />
                            </div>
                        </div>
                    </div>

                    {/* Merchant */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-medium text-slate-400">Merchant (Optional)</label>
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
                                        merchant: e.target.value,
                                    }))
                                }
                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                placeholder="e.g. Starbucks"
                            />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-medium text-slate-400">Payment Mode</label>
                        <div className="relative">
                            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none text-slate-500">
                                {getPaymentModeIcon(formData.paymentMode)}
                            </div>
                            <select
                                value={formData.paymentMode}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        paymentMode: e.target.value as PaymentMode,
                                    }))
                                }
                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="UPI">UPI / Digital</option>
                                <option value="BANK">Bank Transfer</option>
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
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoadingAccounts}
                        className="flex gap-2 items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-lg transition-all hover:bg-indigo-500 shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        {isSubmitting ? "Saving..." : initialData ? "Update Transaction" : "Save Transaction"}
                    </button>
                </div>
            </form>
        </div>
    );
}
import TransactionForm from "@/components/transactions/TransactionForm";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata = {
    title: "Create Transaction | Personal Finance Tracker",
    description: "Add a new transaction to your account",
};

export default function CreateTransactionPage() {
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                        Create Transaction
                    </h1>
                    <p className="text-sm text-slate-400">
                        Record a new income, expense, or transfer.
                    </p>
                </div>
                
                <TransactionForm />
            </div>
        </DashboardLayout>
    );
}

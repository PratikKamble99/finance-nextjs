import { redirect } from "next/navigation";
import TransactionForm from "@/components/transactions/TransactionForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTransactionById } from "@/lib/services/transaction.service";

export const metadata = {
    title: "Edit Transaction | Personal Finance Tracker",
    description: "Edit an existing transaction in your account",
};

interface EditTransactionPageProps {
    params: {
        id: string;
    };
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
    const transactionId = params.id;
    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
        redirect("/dashboard/transactions");
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                        Edit Transaction
                    </h1>
                    <p className="text-sm text-slate-400">
                        Update the details for this transaction.
                    </p>
                </div>
                
                <TransactionForm initialData={transaction} />
            </div>
        </DashboardLayout>
    );
}

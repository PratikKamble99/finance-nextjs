import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface Transaction {
    id: string;
    date: string | Date;
    description: string;
    amount: number | string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    category?: { name: string } | null;
    account?: { name: string } | null;
    merchant?: string | null;
    paymentMode?: string | null;
}

const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(num);
};

const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const exportToPDF = (transactions: Transaction[]) => {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("Transactions Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Add Metadata
    const dateStr = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    doc.text(`Generated on: ${dateStr}`, 14, 30);
    doc.text(`Total Transactions: ${transactions.length}`, 14, 36);

    // Prepare table data
    const tableColumn = [
        "Date",
        "Description",
        "Category",
        "Account",
        "Type",
        "Amount",
    ];
    const tableRows: any[] = [];

    transactions.forEach((t) => {
        const transactionData = [
            formatDate(t.date),
            t.description + (t.merchant ? ` (${t.merchant})` : ""),
            t.category?.name || "-",
            t.account?.name || "-",
            t.type,
            formatCurrency(t.amount),
        ];
        tableRows.push(transactionData);
    });

    // Generate table
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            5: { halign: "right" }, // Align Amount to the right
        },
    });

    // Save PDF
    doc.save(`Transactions_Report_${new Date().getTime()}.pdf`);
};

export const exportToExcel = (transactions: Transaction[]) => {
    // Prepare flattened data for Excel
    const data = transactions.map((t) => ({
        Date: formatDate(t.date),
        Description: t.description,
        Merchant: t.merchant || "-",
        Category: t.category?.name || "-",
        Account: t.account?.name || "-",
        Type: t.type,
        PaymentMode: t.paymentMode || "-",
        Amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Adjust column widths
    const maxWidths = [
        { wch: 15 }, // Date
        { wch: 30 }, // Description
        { wch: 20 }, // Merchant
        { wch: 20 }, // Category
        { wch: 20 }, // Account
        { wch: 10 }, // Type
        { wch: 15 }, // PaymentMode
        { wch: 12 }, // Amount
    ];
    worksheet["!cols"] = maxWidths;

    // Save file
    XLSX.writeFile(workbook, `Transactions_Export_${new Date().getTime()}.xlsx`);
};

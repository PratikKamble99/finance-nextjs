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

/**
 * Export report data to PDF
 */
export const exportReportToPDF = (
    type: string,
    data: any,
    options: { startDate?: string; endDate?: string } = {},
) => {
    const doc = new jsPDF();
    const title = type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // Add Header
    doc.setFontSize(20);
    doc.setTextColor(63, 81, 181); // Indigo color
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 30);

    if (options.startDate && options.endDate) {
        doc.text(`Period: ${options.startDate} to ${options.endDate}`, 14, 35);
    }

    let finalY = 40;

    if (type === "income-expense") {
        const { summary, incomeByCategory, expensesByCategory, monthlyTrends } =
            data;

        // Summary Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Summary", 14, finalY + 10);

        (doc as any).autoTable({
            startY: finalY + 15,
            head: [["Metric", "Value"]],
            body: [
                ["Total Income", formatCurrency(summary.totalIncome)],
                ["Total Expenses", formatCurrency(summary.totalExpenses)],
                ["Net Cash Flow", formatCurrency(summary.netIncome)],
                ["Transaction Count", summary.transactionCount.toString()],
            ],
            theme: "striped",
            headStyles: { fillColor: [63, 81, 181] },
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;

        // Monthly Trends
        doc.text("Monthly Cash Flow", 14, finalY + 5);
        (doc as any).autoTable({
            startY: finalY + 10,
            head: [["Month", "Income", "Expenses", "Net"]],
            body: monthlyTrends.map((t: any) => [
                t.month,
                formatCurrency(t.income),
                formatCurrency(t.expenses),
                formatCurrency(t.net),
            ]),
            headStyles: { fillColor: [63, 81, 181] },
        });
    } else if (type === "account-balance") {
        const { summary, accounts } = data;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Account Balances", 14, finalY + 10);

        (doc as any).autoTable({
            startY: finalY + 15,
            head: [["Account Name", "Institution", "Type", "Balance"]],
            body: accounts.map((a: any) => [
                a.name,
                a.bank || "N/A",
                a.type,
                formatCurrency(a.currentBalance),
            ]),
            headStyles: { fillColor: [63, 81, 181] },
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text(
            `Total Net Worth: ${formatCurrency(summary.totalBalance)}`,
            14,
            finalY,
        );
    } else if (type === "spending-trends") {
        const { summary, topCategories, monthlyTrends } = data;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Spending Analysis", 14, finalY + 10);

        (doc as any).autoTable({
            startY: finalY + 15,
            head: [["Metric", "Value"]],
            body: [
                ["Total Spending", formatCurrency(summary.totalSpending)],
                ["Monthly Average", formatCurrency(summary.averageMonthly)],
                ["Transaction Count", summary.transactionCount.toString()],
            ],
            headStyles: { fillColor: [63, 81, 181] },
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text("Top Categories", 14, finalY + 5);
        (doc as any).autoTable({
            startY: finalY + 10,
            head: [["Category", "Amount"]],
            body: topCategories.map((c: any) => [
                c.category,
                formatCurrency(c.amount),
            ]),
            headStyles: { fillColor: [63, 81, 181] },
        });
    }

    doc.save(`${type}_report_${new Date().getTime()}.pdf`);
};

/**
 * Export report data to Excel
 */
export const exportReportToExcel = (type: string, data: any) => {
    const workbook = XLSX.utils.book_new();

    if (type === "income-expense") {
        const summaryData = [
            ["Metric", "Value"],
            ["Total Income", data.summary.totalIncome],
            ["Total Expenses", data.summary.totalExpenses],
            ["Net Cash Flow", data.summary.netIncome],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, wsSummary, "Summary");

        const trendsData = [
            ["Month", "Income", "Expenses", "Net"],
            ...data.monthlyTrends.map((t: any) => [
                t.month,
                t.income,
                t.expenses,
                t.net,
            ]),
        ];
        const wsTrends = XLSX.utils.aoa_to_sheet(trendsData);
        XLSX.utils.book_append_sheet(workbook, wsTrends, "Monthly Trends");
    } else if (type === "account-balance") {
        const accountsData = [
            ["Name", "Institution", "Type", "Balance"],
            ...data.accounts.map((a: any) => [
                a.name,
                a.bank,
                a.type,
                a.currentBalance,
            ]),
        ];
        const wsAccounts = XLSX.utils.aoa_to_sheet(accountsData);
        XLSX.utils.book_append_sheet(workbook, wsAccounts, "Accounts");
    } else if (type === "spending-trends") {
        const categoriesData = [
            ["Category", "Amount"],
            ...data.topCategories.map((c: any) => [c.category, c.amount]),
        ];
        const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(workbook, wsCategories, "Top Categories");
    }

    XLSX.writeFile(workbook, `${type}_report_${new Date().getTime()}.xlsx`);
};

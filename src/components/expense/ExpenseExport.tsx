import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Table, Check } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExpenseExportProps {
  onClose: () => void;
}

export const ExpenseExport = ({ onClose }: ExpenseExportProps) => {
  const { expenses, categories, getTotalExpenses } = useExpense();
  const { toast } = useToast();
  const [exportType, setExportType] = useState<'csv' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<'all' | 'monthly' | 'weekly'>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const filterExpensesByRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        return expenses;
    }
    
    return expenses.filter(exp => new Date(exp.date) >= startDate);
  };

  const generateCSV = () => {
    const filteredExpenses = filterExpensesByRange();
    
    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const rows = filteredExpenses.map(exp => {
      const category = categories.find(c => c.id === exp.categoryId);
      return [
        format(new Date(exp.date), 'yyyy-MM-dd'),
        category?.name || 'Unknown',
        exp.description,
        exp.amount.toFixed(2),
      ];
    });

    // Add summary
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    rows.push([]);
    rows.push(['Total', '', '', total.toFixed(2)]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generatePDFContent = () => {
    const filteredExpenses = filterExpensesByRange();
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Create a printable HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { font-weight: bold; background-color: #f0f0f0; }
          .amount { text-align: right; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Expense Report</h1>
          <p>Generated: ${format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        
        <div class="summary">
          <strong>Period:</strong> ${dateRange === 'all' ? 'All Time' : dateRange === 'monthly' ? 'This Month' : 'This Week'}<br>
          <strong>Total Expenses:</strong> $${total.toFixed(2)}<br>
          <strong>Number of Transactions:</strong> ${filteredExpenses.length}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredExpenses.map(exp => {
              const category = categories.find(c => c.id === exp.categoryId);
              return `
                <tr>
                  <td>${format(new Date(exp.date), 'MMM d, yyyy')}</td>
                  <td>${category?.icon || ''} ${category?.name || 'Unknown'}</td>
                  <td>${exp.description}</td>
                  <td class="amount">$${exp.amount.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total">
              <td colspan="3">Total</td>
              <td class="amount">$${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportType === 'csv') {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        const htmlContent = generatePDFContent();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }

      toast({
        title: 'Export successful',
        description: `Your expenses have been exported as ${exportType.toUpperCase()}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredExpenses = filterExpensesByRange();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Download className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Export Expenses</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Type */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType('csv')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  exportType === 'csv'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Table size={24} className={exportType === 'csv' ? 'text-primary' : 'text-muted-foreground'} />
                <span className="font-medium">CSV</span>
                <span className="text-xs text-muted-foreground">Spreadsheet</span>
              </button>
              <button
                onClick={() => setExportType('pdf')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  exportType === 'pdf'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileText size={24} className={exportType === 'pdf' ? 'text-primary' : 'text-muted-foreground'} />
                <span className="font-medium">PDF</span>
                <span className="text-xs text-muted-foreground">Printable</span>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
            <div className="flex gap-2">
              {(['weekly', 'monthly', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    dateRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range === 'weekly' ? 'This Week' : range === 'monthly' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Export Preview</p>
            <p className="font-semibold text-foreground">
              {filteredExpenses.length} transactions • ${filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} total
            </p>
          </div>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            className="w-full h-12" 
            disabled={isExporting || filteredExpenses.length === 0}
          >
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <Download size={18} className="mr-2" />
                Export as {exportType.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

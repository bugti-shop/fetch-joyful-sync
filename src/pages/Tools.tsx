import { useState, useEffect } from 'react';
import { Settings, Lightbulb, TrendingDown, History, Trash2, X, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ProPaywall } from '@/components/ProPaywall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SavingsInfoCards, DebtInfoCards } from '@/components/InfoCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalculationHistory {
  id: string;
  type: string;
  inputs: Record<string, string | number>;
  result: string;
  timestamp: string;
}

const HISTORY_KEY = 'jarify_calc_history';

const Tools = () => {
  const navigate = useNavigate();
  const { canUseFeature } = useSubscription();
  const [showProPaywall, setShowProPaywall] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  
  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (type: string, inputs: Record<string, string | number>, result: string) => {
    const newEntry: CalculationHistory = {
      id: Date.now().toString(),
      type,
      inputs,
      result,
      timestamp: new Date().toLocaleString(),
    };
    const updated = [newEntry, ...history].slice(0, 100); // Keep last 100
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = (type?: string) => {
    if (type) {
      const filtered = history.filter(h => h.type !== type);
      setHistory(filtered);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } else {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const getHistoryByType = (type: string) => history.filter(h => h.type === type);

  // Compound Interest Calculator
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [compoundResult, setCompoundResult] = useState<number | null>(null);

  // Loan EMI Calculator
  const [loanAmount, setLoanAmount] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
  const [emiResult, setEmiResult] = useState<number | null>(null);

  // Savings Goal Calculator
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [savingsResult, setSavingsResult] = useState<number | null>(null);

  // Mortgage Calculator
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [mortgageRate, setMortgageRate] = useState('');
  const [mortgageTerm, setMortgageTerm] = useState('');
  const [mortgageResult, setMortgageResult] = useState<{ monthly: number; total: number; interest: number } | null>(null);

  // Income Tax Calculator
  const [annualIncome, setAnnualIncome] = useState('');
  const [taxResult, setTaxResult] = useState<{ tax: number; effective: number } | null>(null);

  // Profit & Loss Calculator
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [profitLossResult, setProfitLossResult] = useState<{ amount: number; percentage: number; isProfit: boolean } | null>(null);

  // Discount Calculator
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountResult, setDiscountResult] = useState<{ savings: number; finalPrice: number } | null>(null);

  // Hourly Wage Calculator
  const [hourlyRate, setHourlyRate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [wageResult, setWageResult] = useState<{ weekly: number; monthly: number; yearly: number } | null>(null);

  // Inflation Calculator
  const [currentAmount, setCurrentAmount] = useState('');
  const [inflationRate, setInflationRate] = useState('');
  const [years, setYears] = useState('');
  const [inflationResult, setInflationResult] = useState<{ futureValue: number; purchasingPower: number } | null>(null);

  // Sales Tax Calculator
  const [itemPrice, setItemPrice] = useState('');
  const [salesTaxRate, setSalesTaxRate] = useState('');
  const [salesTaxResult, setSalesTaxResult] = useState<{ tax: number; total: number } | null>(null);

  // SIP Calculator
  const [sipAmount, setSipAmount] = useState('');
  const [sipRate, setSipRate] = useState('');
  const [sipYears, setSipYears] = useState('');
  const [sipResult, setSipResult] = useState<{ invested: number; returns: number; total: number } | null>(null);

  // ROI Calculator
  const [initialInvestment, setInitialInvestment] = useState('');
  const [finalValue, setFinalValue] = useState('');
  const [roiResult, setRoiResult] = useState<{ roi: number; gain: number } | null>(null);

  const calculateCompoundInterest = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);
    
    if (p && r && t) {
      const amount = p * Math.pow((1 + r), t);
      setCompoundResult(amount);
      saveToHistory('Compound Interest', { principal: p, rate: r * 100, time: t }, `Future Value: $${amount.toFixed(2)}`);
    }
  };

  const calculateEMI = () => {
    const p = parseFloat(loanAmount);
    const r = parseFloat(loanRate) / (12 * 100);
    const n = parseFloat(loanTenure) * 12;
    
    if (p && r && n) {
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setEmiResult(emi);
      saveToHistory('Loan EMI', { amount: p, rate: parseFloat(loanRate), tenure: parseFloat(loanTenure) }, `Monthly EMI: $${emi.toFixed(2)}`);
    }
  };

  const calculateSavingsTime = () => {
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentSavings);
    const monthly = parseFloat(monthlyContribution);
    
    if (target && monthly && current >= 0) {
      const remaining = target - current;
      const months = Math.ceil(remaining / monthly);
      setSavingsResult(months);
      saveToHistory('Savings Goal', { target, current, monthly }, `${months} months (${(months / 12).toFixed(1)} years)`);
    }
  };

  const calculateMortgage = () => {
    const p = parseFloat(mortgageAmount);
    const r = parseFloat(mortgageRate) / (12 * 100);
    const n = parseFloat(mortgageTerm) * 12;
    
    if (p && r && n) {
      const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const total = monthly * n;
      const interest = total - p;
      setMortgageResult({ monthly, total, interest });
      saveToHistory('Mortgage', { price: p, rate: parseFloat(mortgageRate), term: parseFloat(mortgageTerm) }, `Monthly: $${monthly.toFixed(2)}`);
    }
  };

  const calculateIncomeTax = () => {
    const income = parseFloat(annualIncome);
    if (income) {
      let tax = 0;
      if (income <= 11000) {
        tax = income * 0.10;
      } else if (income <= 44725) {
        tax = 1100 + (income - 11000) * 0.12;
      } else if (income <= 95375) {
        tax = 5147 + (income - 44725) * 0.22;
      } else if (income <= 182100) {
        tax = 16290 + (income - 95375) * 0.24;
      } else if (income <= 231250) {
        tax = 37104 + (income - 182100) * 0.32;
      } else {
        tax = 52832 + (income - 231250) * 0.35;
      }
      const effective = (tax / income) * 100;
      setTaxResult({ tax, effective });
      saveToHistory('Income Tax', { income }, `Tax: $${tax.toFixed(2)} (${effective.toFixed(2)}%)`);
    }
  };

  const calculateProfitLoss = () => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    if (cost && selling) {
      const amount = selling - cost;
      const percentage = (amount / cost) * 100;
      setProfitLossResult({ amount: Math.abs(amount), percentage: Math.abs(percentage), isProfit: amount >= 0 });
      saveToHistory('Profit & Loss', { cost, selling }, `${amount >= 0 ? 'Profit' : 'Loss'}: $${Math.abs(amount).toFixed(2)} (${Math.abs(percentage).toFixed(2)}%)`);
    }
  };

  const calculateDiscount = () => {
    const price = parseFloat(originalPrice);
    const discount = parseFloat(discountPercent);
    if (price && discount) {
      const savings = price * (discount / 100);
      const finalPrice = price - savings;
      setDiscountResult({ savings, finalPrice });
      saveToHistory('Discount', { price, discount }, `Save: $${savings.toFixed(2)}, Final: $${finalPrice.toFixed(2)}`);
    }
  };

  const calculateHourlyWage = () => {
    const rate = parseFloat(hourlyRate);
    const hours = parseFloat(hoursPerWeek);
    if (rate && hours) {
      const weekly = rate * hours;
      const monthly = weekly * 4.33;
      const yearly = weekly * 52;
      setWageResult({ weekly, monthly, yearly });
      saveToHistory('Hourly Wage', { rate, hours }, `Yearly: $${yearly.toFixed(2)}`);
    }
  };

  const calculateInflation = () => {
    const amount = parseFloat(currentAmount);
    const inflation = parseFloat(inflationRate) / 100;
    const y = parseFloat(years);
    if (amount && inflation && y) {
      const futureValue = amount * Math.pow(1 + inflation, y);
      const purchasingPower = amount / Math.pow(1 + inflation, y);
      setInflationResult({ futureValue, purchasingPower });
      saveToHistory('Inflation', { amount, rate: inflation * 100, years: y }, `Future Cost: $${futureValue.toFixed(2)}`);
    }
  };

  const calculateSalesTax = () => {
    const price = parseFloat(itemPrice);
    const taxRate = parseFloat(salesTaxRate) / 100;
    if (price && taxRate) {
      const tax = price * taxRate;
      const total = price + tax;
      setSalesTaxResult({ tax, total });
      saveToHistory('Sales Tax', { price, rate: taxRate * 100 }, `Tax: $${tax.toFixed(2)}, Total: $${total.toFixed(2)}`);
    }
  };

  const calculateSIP = () => {
    const p = parseFloat(sipAmount);
    const r = parseFloat(sipRate) / (12 * 100);
    const n = parseFloat(sipYears) * 12;
    if (p && r && n) {
      const total = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = p * n;
      const returns = total - invested;
      setSipResult({ invested, returns, total });
      saveToHistory('SIP', { monthly: p, rate: parseFloat(sipRate), years: parseFloat(sipYears) }, `Total: $${total.toFixed(2)}`);
    }
  };

  const calculateROI = () => {
    const initial = parseFloat(initialInvestment);
    const final = parseFloat(finalValue);
    if (initial && final) {
      const gain = final - initial;
      const roi = (gain / initial) * 100;
      setRoiResult({ roi, gain });
      saveToHistory('ROI', { initial, final }, `ROI: ${roi.toFixed(2)}%`);
    }
  };

  const HistoryButton = ({ type, color }: { type: string; color: string }) => {
    const typeHistory = getHistoryByType(type);
    if (typeHistory.length === 0) return null;
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <History className="w-4 h-4" />
            History ({typeHistory.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {type} History
              <Button variant="ghost" size="sm" onClick={() => clearHistory(type)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {typeHistory.map((entry) => (
                <div key={entry.id} className={`p-3 rounded-lg ${color} border border-border`}>
                  <p className="text-sm font-medium text-foreground">{entry.result}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.entries(entry.inputs).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{entry.timestamp}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  if (!canUseFeature('advancedCalculator')) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Financial Calculators</h1>
            <button onClick={() => navigate('/settings')} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Settings size={20} className="text-foreground" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Crown size={32} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Pro Feature</h2>
          <p className="text-muted-foreground mb-6">Financial Calculators are available with Jarify Pro. Upgrade to unlock all calculators.</p>
          <Button onClick={() => setShowProPaywall(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8">
            Upgrade to Pro
          </Button>
        </div>
        <ProPaywall isOpen={showProPaywall} onClose={() => setShowProPaywall(false)} featureName="Financial Calculators" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Financial Calculators</h1>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Settings size={20} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        
        {/* Compound Interest Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Compound Interest Calculator</h2>
            <HistoryButton type="Compound Interest" color="bg-green-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="principal">Principal Amount ($)</Label>
              <Input id="principal" type="number" placeholder="10000" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rate">Annual Interest Rate (%)</Label>
              <Input id="rate" type="number" placeholder="5" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">Time Period (Years)</Label>
              <Input id="time" type="number" placeholder="10" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <Button onClick={calculateCompoundInterest} className="w-full">Calculate</Button>
            {compoundResult !== null && (
              <div className="mt-4 p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Future Value:</p>
                <p className="text-2xl font-bold text-green-600">${compoundResult.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Interest Earned: ${(compoundResult - parseFloat(principal)).toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Loan EMI Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Loan EMI Calculator</h2>
            <HistoryButton type="Loan EMI" color="bg-black/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="loanAmount">Loan Amount ($)</Label>
              <Input id="loanAmount" type="number" placeholder="50000" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="loanRate">Annual Interest Rate (%)</Label>
              <Input id="loanRate" type="number" placeholder="8" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="loanTenure">Loan Tenure (Years)</Label>
              <Input id="loanTenure" type="number" placeholder="5" value={loanTenure} onChange={(e) => setLoanTenure(e.target.value)} />
            </div>
            <Button onClick={calculateEMI} className="w-full">Calculate EMI</Button>
            {emiResult !== null && (
              <div className="mt-4 p-4 bg-black/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Monthly EMI:</p>
                <p className="text-2xl font-bold text-foreground">${emiResult.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Payment: ${(emiResult * parseFloat(loanTenure) * 12).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Interest: ${(emiResult * parseFloat(loanTenure) * 12 - parseFloat(loanAmount)).toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Savings Goal Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Savings Goal Calculator</h2>
            <HistoryButton type="Savings Goal" color="bg-purple-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input id="targetAmount" type="number" placeholder="20000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="currentSavings">Current Savings ($)</Label>
              <Input id="currentSavings" type="number" placeholder="5000" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label>
              <Input id="monthlyContribution" type="number" placeholder="500" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
            </div>
            <Button onClick={calculateSavingsTime} className="w-full">Calculate Time</Button>
            {savingsResult !== null && (
              <div className="mt-4 p-4 bg-purple-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Time to Reach Goal:</p>
                <p className="text-2xl font-bold text-purple-600">{savingsResult} months</p>
                <p className="text-sm text-muted-foreground mt-1">({(savingsResult / 12).toFixed(1)} years)</p>
              </div>
            )}
          </div>
        </Card>

        {/* Mortgage Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Mortgage Calculator</h2>
            <HistoryButton type="Mortgage" color="bg-blue-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Home Price ($)</Label>
              <Input type="number" placeholder="300000" value={mortgageAmount} onChange={(e) => setMortgageAmount(e.target.value)} />
            </div>
            <div>
              <Label>Interest Rate (%)</Label>
              <Input type="number" placeholder="6.5" value={mortgageRate} onChange={(e) => setMortgageRate(e.target.value)} />
            </div>
            <div>
              <Label>Loan Term (Years)</Label>
              <Input type="number" placeholder="30" value={mortgageTerm} onChange={(e) => setMortgageTerm(e.target.value)} />
            </div>
            <Button onClick={calculateMortgage} className="w-full">Calculate</Button>
            {mortgageResult && (
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Monthly Payment:</p>
                <p className="text-2xl font-bold text-blue-600">${mortgageResult.monthly.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Payment: ${mortgageResult.total.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Interest: ${mortgageResult.interest.toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Income Tax Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Income Tax Calculator</h2>
            <HistoryButton type="Income Tax" color="bg-orange-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Annual Income ($)</Label>
              <Input type="number" placeholder="75000" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} />
            </div>
            <Button onClick={calculateIncomeTax} className="w-full">Calculate Tax</Button>
            {taxResult && (
              <div className="mt-4 p-4 bg-orange-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Estimated Tax:</p>
                <p className="text-2xl font-bold text-orange-600">${taxResult.tax.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Effective Tax Rate: {taxResult.effective.toFixed(2)}%</p>
              </div>
            )}
          </div>
        </Card>

        {/* Profit & Loss Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Profit & Loss Calculator</h2>
            <HistoryButton type="Profit & Loss" color="bg-green-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Cost Price ($)</Label>
              <Input type="number" placeholder="100" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
            <div>
              <Label>Selling Price ($)</Label>
              <Input type="number" placeholder="150" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
            </div>
            <Button onClick={calculateProfitLoss} className="w-full">Calculate</Button>
            {profitLossResult && (
              <div className={`mt-4 p-4 rounded-lg ${profitLossResult.isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className="text-sm text-muted-foreground">{profitLossResult.isProfit ? 'Profit' : 'Loss'}:</p>
                <p className={`text-2xl font-bold ${profitLossResult.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  ${profitLossResult.amount.toFixed(2)} ({profitLossResult.percentage.toFixed(2)}%)
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Discount Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Discount Calculator</h2>
            <HistoryButton type="Discount" color="bg-pink-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Original Price ($)</Label>
              <Input type="number" placeholder="200" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
            </div>
            <div>
              <Label>Discount (%)</Label>
              <Input type="number" placeholder="25" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
            </div>
            <Button onClick={calculateDiscount} className="w-full">Calculate</Button>
            {discountResult && (
              <div className="mt-4 p-4 bg-pink-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">You Save:</p>
                <p className="text-2xl font-bold text-pink-600">${discountResult.savings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Final Price: ${discountResult.finalPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Hourly Wage Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Hourly Wage Calculator</h2>
            <HistoryButton type="Hourly Wage" color="bg-teal-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Hourly Rate ($)</Label>
              <Input type="number" placeholder="25" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
            <div>
              <Label>Hours Per Week</Label>
              <Input type="number" placeholder="40" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
            </div>
            <Button onClick={calculateHourlyWage} className="w-full">Calculate</Button>
            {wageResult && (
              <div className="mt-4 p-4 bg-teal-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Weekly: <span className="font-bold text-teal-600">${wageResult.weekly.toFixed(2)}</span></p>
                <p className="text-sm text-muted-foreground">Monthly: <span className="font-bold text-teal-600">${wageResult.monthly.toFixed(2)}</span></p>
                <p className="text-sm text-muted-foreground">Yearly: <span className="font-bold text-teal-600">${wageResult.yearly.toFixed(2)}</span></p>
              </div>
            )}
          </div>
        </Card>

        {/* Inflation Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Inflation Calculator</h2>
            <HistoryButton type="Inflation" color="bg-amber-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Current Amount ($)</Label>
              <Input type="number" placeholder="1000" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>
            <div>
              <Label>Inflation Rate (%)</Label>
              <Input type="number" placeholder="3" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} />
            </div>
            <div>
              <Label>Years</Label>
              <Input type="number" placeholder="10" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
            <Button onClick={calculateInflation} className="w-full">Calculate</Button>
            {inflationResult && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Future Cost of Goods:</p>
                <p className="text-2xl font-bold text-amber-600">${inflationResult.futureValue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Today's Purchasing Power: ${inflationResult.purchasingPower.toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Sales Tax Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Sales Tax Calculator</h2>
            <HistoryButton type="Sales Tax" color="bg-indigo-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Item Price ($)</Label>
              <Input type="number" placeholder="100" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
            </div>
            <div>
              <Label>Tax Rate (%)</Label>
              <Input type="number" placeholder="8.25" value={salesTaxRate} onChange={(e) => setSalesTaxRate(e.target.value)} />
            </div>
            <Button onClick={calculateSalesTax} className="w-full">Calculate</Button>
            {salesTaxResult && (
              <div className="mt-4 p-4 bg-indigo-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Tax Amount:</p>
                <p className="text-2xl font-bold text-indigo-600">${salesTaxResult.tax.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total: ${salesTaxResult.total.toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* SIP Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">SIP Calculator</h2>
            <HistoryButton type="SIP" color="bg-cyan-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Monthly Investment ($)</Label>
              <Input type="number" placeholder="500" value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} />
            </div>
            <div>
              <Label>Expected Return Rate (%)</Label>
              <Input type="number" placeholder="12" value={sipRate} onChange={(e) => setSipRate(e.target.value)} />
            </div>
            <div>
              <Label>Investment Period (Years)</Label>
              <Input type="number" placeholder="10" value={sipYears} onChange={(e) => setSipYears(e.target.value)} />
            </div>
            <Button onClick={calculateSIP} className="w-full">Calculate</Button>
            {sipResult && (
              <div className="mt-4 p-4 bg-cyan-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Value:</p>
                <p className="text-2xl font-bold text-cyan-600">${sipResult.total.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Invested: ${sipResult.invested.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Returns: ${sipResult.returns.toFixed(2)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* ROI Calculator */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">ROI Calculator</h2>
            <HistoryButton type="ROI" color="bg-green-500/5" />
          </div>
          <div className="space-y-4">
            <div>
              <Label>Initial Investment ($)</Label>
              <Input type="number" placeholder="10000" value={initialInvestment} onChange={(e) => setInitialInvestment(e.target.value)} />
            </div>
            <div>
              <Label>Final Value ($)</Label>
              <Input type="number" placeholder="15000" value={finalValue} onChange={(e) => setFinalValue(e.target.value)} />
            </div>
            <Button onClick={calculateROI} className="w-full">Calculate ROI</Button>
            {roiResult && (
              <div className={`mt-4 p-4 rounded-lg ${roiResult.roi >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className="text-sm text-muted-foreground">Return on Investment:</p>
                <p className={`text-2xl font-bold ${roiResult.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roiResult.roi.toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {roiResult.gain >= 0 ? 'Gain' : 'Loss'}: ${Math.abs(roiResult.gain).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Financial Tips Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="text-yellow-500" />
            Financial Tips & Strategies
          </h2>
          <Tabs defaultValue="savings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="savings" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Savings Tips
              </TabsTrigger>
              <TabsTrigger value="debt" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Debt Payoff
              </TabsTrigger>
            </TabsList>
            <TabsContent value="savings">
              <SavingsInfoCards />
            </TabsContent>
            <TabsContent value="debt">
              <DebtInfoCards />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
};

export default Tools;
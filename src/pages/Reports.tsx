import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Target, PieChart, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import SavingsChart from '@/components/SavingsChart';
import { Card } from '@/components/ui/card';

interface Jar {
  id: number;
  name: string;
  target: number;
  saved: number;
  withdrawn: number;
  currency?: string;
  createdAt?: string;
  records?: TransactionRecord[];
  targetDate?: string;
}

interface TransactionRecord {
  id: number;
  type: 'saved' | 'withdrawn';
  amount: number;
  date: Date;
}

const Reports = () => {
  const navigate = useNavigate();
  const [jars, setJars] = useState<Jar[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    const loadedJars = storage.loadJars();
    setJars(loadedJars);
    const savedTheme = localStorage.getItem('app_theme') || 'light';
    setDarkMode(savedTheme !== 'light');
  }, []);

  const totalSaved = jars.reduce((sum, jar) => sum + jar.saved, 0);
  const totalTarget = jars.reduce((sum, jar) => sum + jar.target, 0);
  const totalWithdrawn = jars.reduce((sum, jar) => sum + jar.withdrawn, 0);
  const overallProgress = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : '0.0';
  const remainingAmount = totalTarget - totalSaved;

  // Calculate savings targets for different periods
  const calculateSavingsTargets = () => {
    const today = new Date();
    
    // Find nearest target date from all jars
    let nearestDate: Date | null = null;
    jars.forEach(jar => {
      if (jar.targetDate) {
        const jarTargetDate = new Date(jar.targetDate);
        if (!nearestDate || jarTargetDate < nearestDate) {
          nearestDate = jarTargetDate;
        }
      }
    });
    
    // Default to 365 days if no target date
    const daysRemaining = nearestDate 
      ? Math.max(1, Math.ceil((nearestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 365;
    
    return {
      daily: remainingAmount / daysRemaining,
      biWeekly: (remainingAmount / daysRemaining) * 14,
      weekly: (remainingAmount / daysRemaining) * 7,
      monthly: (remainingAmount / daysRemaining) * 30,
      yearly: (remainingAmount / daysRemaining) * 365,
      daysRemaining
    };
  };

  const savingsTargets = calculateSavingsTargets();

  const chartData = jars.map(jar => ({
    name: jar.name.length > 10 ? jar.name.substring(0, 10) + '...' : jar.name,
    saved: jar.saved,
    withdrawn: jar.withdrawn
  }));

  // Calculate statistics based on time range
  const getTimeRangeData = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    let periodSaved = 0;
    let periodWithdrawn = 0;

    jars.forEach(jar => {
      if (jar.records) {
        jar.records.forEach(record => {
          const recordDate = new Date(record.date);
          if (recordDate >= startDate) {
            if (record.type === 'saved') {
              periodSaved += record.amount;
            } else {
              periodWithdrawn += record.amount;
            }
          }
        });
      }
    });

    return { periodSaved, periodWithdrawn };
  };

  const { periodSaved, periodWithdrawn } = getTimeRangeData();
  const currency = jars.length > 0 ? jars[0].currency || '$' : '$';

  // Use semantic tokens from design system
  const bgColor = 'bg-background';
  const cardBg = 'bg-card';
  const textColor = 'text-foreground';
  const textSecondary = 'text-muted-foreground';

  return (
    <div className={`min-h-screen ${bgColor} pb-24`}>
      {/* Header */}
      <div className="sticky top-0 z-30 mb-4 bg-background/90 backdrop-blur-md border-b border-border shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-full hover:bg-accent transition-colors"
            >
              <ArrowLeft className={textColor} size={20} />
            </button>
            <h1 className={`text-xl sm:text-2xl font-bold ${textColor}`}>Reports & Analytics</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                timeRange === range
                  ? 'bg-[#000000] text-white'
                  : `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} hover:bg-[#000000]/10`
              }`}
            >
              {range === 'week' && 'Last Week'}
              {range === 'month' && 'Last Month'}
              {range === 'year' && 'Last Year'}
              {range === 'all' && 'All Time'}
            </button>
          ))}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className={`${cardBg} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className={`text-sm ${textSecondary}`}>Total Saved</span>
            </div>
            <p className={`text-lg font-bold text-green-600`}>
              {currency}{formatCurrency(totalSaved)}
            </p>
          </Card>

          <Card className={`${cardBg} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-purple-600" size={20} />
              <span className={`text-sm ${textSecondary}`}>Total Target</span>
            </div>
            <p className={`text-lg font-bold ${textColor}`}>
              {currency}{formatCurrency(totalTarget)}
            </p>
          </Card>

          <Card className={`${cardBg} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <span className={`text-sm ${textSecondary}`}>Total Withdrawn</span>
            </div>
            <p className={`text-lg font-bold text-red-600`}>
              {currency}{formatCurrency(totalWithdrawn)}
            </p>
          </Card>

          <Card className={`${cardBg} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="text-blue-600" size={20} />
              <span className={`text-sm ${textSecondary}`}>Progress</span>
            </div>
            <p className={`text-lg font-bold text-blue-600`}>{overallProgress}%</p>
          </Card>
        </div>

        {/* Period Statistics */}
        <Card className={`${cardBg} p-6 rounded-2xl shadow-lg mb-6`}>
          <h2 className={`text-xl font-bold ${textColor} mb-4`}>
            {timeRange === 'week' && 'Last 7 Days'}
            {timeRange === 'month' && 'Last 30 Days'}
            {timeRange === 'year' && 'Last 12 Months'}
            {timeRange === 'all' && 'All Time'} Activity
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-green-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-green-600" size={20} />
                <span className={`text-sm ${textSecondary}`}>Deposited</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {currency}{formatCurrency(periodSaved)}
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-red-50'} p-4 rounded-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-red-600" size={20} />
                <span className={`text-sm ${textSecondary}`}>Withdrawn</span>
              </div>
              <p className="text-lg font-bold text-red-600">
                {currency}{formatCurrency(periodWithdrawn)}
              </p>
            </div>
          </div>
        </Card>

        {/* Savings Calculation - How much to save */}
        {remainingAmount > 0 && (
          <Card className={`${cardBg} p-6 rounded-2xl shadow-lg mb-6`}>
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="text-primary" size={24} />
              <h2 className={`text-xl font-bold ${textColor}`}>Savings Plan to Reach Goals</h2>
            </div>
            <p className={`text-sm ${textSecondary} mb-4`}>
              You need to save {currency}{formatCurrency(remainingAmount)} to reach your goals
              {savingsTargets.daysRemaining < 365 && ` in ${savingsTargets.daysRemaining} days`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-muted'} p-4 rounded-xl`}>
                <p className={`text-xs ${textSecondary} mb-1`}>Daily</p>
                <p className="text-base font-bold text-black dark:text-white">
                  {currency}{formatCurrency(savingsTargets.daily)}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-purple-50'} p-4 rounded-xl`}>
                <p className={`text-xs ${textSecondary} mb-1`}>Weekly</p>
                <p className="text-base font-bold text-purple-600">
                  {currency}{formatCurrency(savingsTargets.weekly)}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-pink-50'} p-4 rounded-xl`}>
                <p className={`text-xs ${textSecondary} mb-1`}>Bi-Weekly</p>
                <p className="text-base font-bold text-pink-600">
                  {currency}{formatCurrency(savingsTargets.biWeekly)}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-indigo-50'} p-4 rounded-xl`}>
                <p className={`text-xs ${textSecondary} mb-1`}>Monthly</p>
                <p className="text-base font-bold text-indigo-600">
                  {currency}{formatCurrency(savingsTargets.monthly)}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-cyan-50'} p-4 rounded-xl`}>
                <p className={`text-xs ${textSecondary} mb-1`}>Yearly</p>
                <p className="text-base font-bold text-cyan-600">
                  {currency}{formatCurrency(savingsTargets.yearly)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Chart */}
        <Card className={`${cardBg} p-6 rounded-2xl shadow-lg mb-6`}>
          <h2 className={`text-xl font-bold ${textColor} mb-4`}>Savings Overview</h2>
          <SavingsChart data={chartData} darkMode={darkMode} />
        </Card>

        {/* Goals Breakdown */}
        <Card className={`${cardBg} p-6 rounded-2xl shadow-lg`}>
          <h2 className={`text-xl font-bold ${textColor} mb-4`}>Goals Breakdown</h2>
          <div className="space-y-3">
            {jars.map(jar => {
              const progress = jar.target > 0 ? ((jar.saved / jar.target) * 100).toFixed(1) : '0.0';
              return (
                <div key={jar.id} className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} p-4 rounded-xl`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold ${textColor}`}>{jar.name}</span>
                    <span className={`text-sm font-bold ${
                      parseFloat(progress) >= 75 ? 'text-green-600' :
                      parseFloat(progress) >= 50 ? 'text-blue-600' :
                      parseFloat(progress) >= 25 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-semibold">
                      {jar.currency || '$'}{formatCurrency(jar.saved)}
                    </span>
                    <span className={textSecondary}>
                      / {jar.currency || '$'}{formatCurrency(jar.target)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        parseFloat(progress) >= 75 ? 'bg-green-600' :
                        parseFloat(progress) >= 50 ? 'bg-black dark:bg-white' :
                        parseFloat(progress) >= 25 ? 'bg-orange-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(parseFloat(progress), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

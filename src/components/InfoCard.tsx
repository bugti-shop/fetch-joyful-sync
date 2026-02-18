import React from 'react';
import { motion } from 'framer-motion';

interface InfoCardProps {
  title: string;
  description: string;
  icon: string;
  color?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  description, 
  icon,
  color = 'bg-gradient-to-br from-blue-50 to-purple-50'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${color} rounded-2xl p-6 shadow-lg border border-gray-100`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const SavingsInfoCards: React.FC = () => {
  const savingsTips = [
    {
      icon: '💰',
      title: 'The 50/30/20 Rule',
      description: 'Allocate 50% of income to needs, 30% to wants, and 20% to savings. This balanced approach ensures you save consistently while enjoying life.',
      color: 'bg-gradient-to-br from-green-50 to-emerald-50'
    },
    {
      icon: '🎯',
      title: 'Set SMART Goals',
      description: 'Make your savings goals Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of "save more," try "save $500 in 3 months."',
      color: 'bg-gradient-to-br from-blue-50 to-cyan-50'
    },
    {
      icon: '🔄',
      title: 'Automate Your Savings',
      description: 'Set up automatic transfers to your savings account right after payday. You can\'t spend what you don\'t see!',
      color: 'bg-gradient-to-br from-purple-50 to-pink-50'
    },
    {
      icon: '📊',
      title: 'Track Every Dollar',
      description: 'Monitor your spending habits for a month. Small daily expenses like coffee or subscriptions add up to big savings opportunities.',
      color: 'bg-gradient-to-br from-orange-50 to-amber-50'
    },
    {
      icon: '🏦',
      title: 'Emergency Fund First',
      description: 'Build a safety net of 3-6 months of expenses before aggressive investing. This protects you from unexpected financial shocks.',
      color: 'bg-gradient-to-br from-red-50 to-rose-50'
    },
    {
      icon: '💡',
      title: 'The 24-Hour Rule',
      description: 'Wait 24 hours before making non-essential purchases. This simple delay often reveals wants versus actual needs.',
      color: 'bg-gradient-to-br from-yellow-50 to-amber-50'
    }
  ];

  return (
    <div className="space-y-4">
      {savingsTips.map((tip, index) => (
        <InfoCard key={index} {...tip} />
      ))}
    </div>
  );
};

export const DebtInfoCards: React.FC = () => {
  const debtTips = [
    {
      icon: '❄️',
      title: 'Snowball Method',
      description: 'Pay off smallest debts first while making minimum payments on others. Quick wins build momentum and motivation to tackle larger debts.',
      color: 'bg-gradient-to-br from-blue-50 to-indigo-50'
    },
    {
      icon: '⚡',
      title: 'Avalanche Method',
      description: 'Focus on highest interest rate debts first to minimize total interest paid. This saves the most money in the long run.',
      color: 'bg-gradient-to-br from-purple-50 to-violet-50'
    },
    {
      icon: '📞',
      title: 'Negotiate Lower Rates',
      description: 'Call your creditors and request lower interest rates. Many will reduce rates for customers with good payment history.',
      color: 'bg-gradient-to-br from-green-50 to-teal-50'
    },
    {
      icon: '💳',
      title: 'Stop Using Credit',
      description: 'While paying off debt, avoid adding new charges. Cut up cards if needed, but keep accounts open for credit score.',
      color: 'bg-gradient-to-br from-red-50 to-pink-50'
    },
    {
      icon: '💵',
      title: 'Find Extra Income',
      description: 'Use side hustles, freelancing, or selling unused items to generate extra payments. Every extra dollar accelerates debt freedom.',
      color: 'bg-gradient-to-br from-yellow-50 to-orange-50'
    },
    {
      icon: '📝',
      title: 'Budget With Purpose',
      description: 'Create a zero-based budget where every dollar has a job. Allocate maximum possible funds to debt payments without sacrificing essentials.',
      color: 'bg-gradient-to-br from-cyan-50 to-blue-50'
    },
    {
      icon: '🎉',
      title: 'Celebrate Milestones',
      description: 'Set small milestones and reward yourself modestly when you hit them. This keeps motivation high during the payoff journey.',
      color: 'bg-gradient-to-br from-pink-50 to-rose-50'
    }
  ];

  return (
    <div className="space-y-4">
      {debtTips.map((tip, index) => (
        <InfoCard key={index} {...tip} />
      ))}
    </div>
  );
};

import { formatCurrency } from '@/lib/utils';

// Emotional insights component for savings progress
interface EmotionalInsightsProps {
  totalSaved: number;
  totalTarget: number;
  jarsCount: number;
  darkMode: boolean;
  currency?: string;
}

const EmotionalInsights = ({ totalSaved, totalTarget, jarsCount, darkMode, currency = '$' }: EmotionalInsightsProps) => {
  const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  
  const getMotivationalMessage = () => {
    if (progress >= 100) {
      return {
        emoji: '🎉',
        title: 'Incredible Achievement!',
        message: 'You\'ve reached all your goals! You\'re a savings superstar!',
        color: 'from-green-500 to-emerald-600'
      };
    } else if (progress >= 75) {
      return {
        emoji: '🚀',
        title: 'Almost There!',
        message: 'You\'re so close! Keep going, success is just around the corner!',
        color: 'from-blue-500 to-indigo-600'
      };
    } else if (progress >= 50) {
      return {
        emoji: '💪',
        title: 'Halfway Hero!',
        message: 'You\'re doing great! You\'ve already saved half of your goal!',
        color: 'from-purple-500 to-pink-600'
      };
    } else if (progress >= 25) {
      return {
        emoji: '🌟',
        title: 'Great Start!',
        message: 'Every journey begins with a single step. Keep it up!',
        color: 'from-orange-500 to-red-600'
      };
    } else {
      return {
        emoji: '💫',
        title: 'Begin Your Journey!',
        message: 'The best time to start was yesterday. The next best time is now!',
        color: 'from-cyan-500 to-blue-600'
      };
    }
  };

  const insight = getMotivationalMessage();

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-3 sm:p-4 shadow-lg overflow-hidden relative`}>
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${insight.color} opacity-10 rounded-full blur-3xl`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <span className="text-4xl sm:text-5xl">{insight.emoji}</span>
          <div>
            <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {insight.title}
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 text-sm sm:text-base`}>
              {insight.message}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4">
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Progress</p>
            <p className={`text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r ${insight.color} bg-clip-text text-transparent`}>
              {progress.toFixed(0)}%
            </p>
          </div>
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-50 to-pink-50'} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Jars</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{jarsCount}</p>
          </div>
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-green-50 to-emerald-50'} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Saved</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{currency}{formatCurrency(totalSaved)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionalInsights;

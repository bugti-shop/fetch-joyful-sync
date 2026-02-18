import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, CalendarCheck, TrendingUp, Zap, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { hapticFeedback } from '@/lib/haptics';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalActiveDays: number;
  weeklyActivity: boolean[];
  milestones: number[];
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

const loadStreakData = (): StreakData => {
  const saved = localStorage.getItem('streak_data');
  if (saved) return JSON.parse(saved);
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    totalActiveDays: 0,
    weeklyActivity: [false, false, false, false, false, false, false],
    milestones: [],
  };
};

const saveStreakData = (data: StreakData) => {
  localStorage.setItem('streak_data', JSON.stringify(data));
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getDaysBetween = (d1: string, d2: string) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

const getWeekDayLabels = () => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay();
  // Reorder so today is last
  const shifted = [];
  for (let i = 0; i < 7; i++) {
    const idx = (today + i + 1) % 7;
    // Convert Sunday=0 to Monday-first
    const mondayIdx = idx === 0 ? 6 : idx - 1;
    shifted.push(days[mondayIdx]);
  }
  return shifted;
};

const Progress = () => {
  const [streak, setStreak] = useState<StreakData>(loadStreakData);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Check if user added money to any jar today
    const jars = storage.loadJars();
    const today = getTodayStr();
    
    let addedMoneyToday = false;
    jars.forEach((jar: any) => {
      if (jar.records) {
        jar.records.forEach((record: any) => {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          if (recordDate === today && record.type === 'saved') {
            addedMoneyToday = true;
          }
        });
      }
    });

    const data = loadStreakData();

    if (!addedMoneyToday) {
      // Check if streak is broken (missed yesterday with no deposit)
      if (data.lastActiveDate && getDaysBetween(data.lastActiveDate, today) > 1) {
        const broken = { ...data, currentStreak: 0 };
        // Keep weeklyActivity updated for missed days
        const daysMissed = Math.min(getDaysBetween(data.lastActiveDate, today), 7);
        const newWeekly = [...data.weeklyActivity];
        for (let i = 0; i < daysMissed; i++) {
          newWeekly.shift();
          newWeekly.push(false);
        }
        broken.weeklyActivity = newWeekly;
        saveStreakData(broken);
        setStreak(broken);
      } else {
        setStreak(data);
      }
      return;
    }

    if (data.lastActiveDate === today) {
      setStreak(data);
      return;
    }

    const daysSinceActive = data.lastActiveDate
      ? getDaysBetween(data.lastActiveDate, today)
      : -1;

    let newStreak = { ...data };

    if (daysSinceActive === 1) {
      newStreak.currentStreak += 1;
    } else if (daysSinceActive > 1) {
      newStreak.currentStreak = 1;
    } else {
      newStreak.currentStreak = 1;
    }

    newStreak.lastActiveDate = today;
    newStreak.totalActiveDays += 1;
    newStreak.longestStreak = Math.max(newStreak.longestStreak, newStreak.currentStreak);

    // Update weekly activity (shift left, add today as active)
    const newWeekly = [...newStreak.weeklyActivity.slice(1), true];
    // Fill gaps for missed days
    if (daysSinceActive > 1) {
      const missedDays = Math.min(daysSinceActive - 1, 6);
      for (let i = 6 - missedDays; i < 6; i++) {
        newWeekly[i] = false;
      }
      newWeekly[6] = true;
    }
    newStreak.weeklyActivity = newWeekly;

    // Check milestones
    const newMilestones = STREAK_MILESTONES.filter(
      m => newStreak.currentStreak >= m && !newStreak.milestones.includes(m)
    );
    if (newMilestones.length > 0) {
      newStreak.milestones = [...newStreak.milestones, ...newMilestones];
      setShowConfetti(true);
      hapticFeedback.heavy();
      setTimeout(() => setShowConfetti(false), 3000);
    }

    saveStreakData(newStreak);
    setStreak(newStreak);
  }, []);

  const nextMilestone = STREAK_MILESTONES.find(m => m > streak.currentStreak) || 365;
  const milestoneProgress = (streak.currentStreak / nextMilestone) * 100;
  const dayLabels = getWeekDayLabels();

  const getStreakEmoji = () => {
    if (streak.currentStreak >= 365) return '👑';
    if (streak.currentStreak >= 90) return '💎';
    if (streak.currentStreak >= 30) return '🏆';
    if (streak.currentStreak >= 7) return '🔥';
    if (streak.currentStreak >= 3) return '⭐';
    return '✨';
  };

  const getMotivationalText = () => {
    if (streak.currentStreak === 0) return "Start your journey today!";
    if (streak.currentStreak === 1) return "Great start! Come back tomorrow!";
    if (streak.currentStreak < 7) return "Building momentum! Keep going!";
    if (streak.currentStreak < 30) return "You're on fire! Amazing consistency!";
    if (streak.currentStreak < 90) return "Incredible discipline! You're unstoppable!";
    return "Legendary commitment! 🎉";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 mb-4 bg-background border-b border-border shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Progress</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-5">
        {/* Main Streak Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Current Streak</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{streak.currentStreak}</span>
                  <span className="text-xl font-medium text-white/80">
                    {streak.currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-white/70 text-sm mt-2">{getMotivationalText()}</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl"
              >
                {getStreakEmoji()}
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Weekly Activity */}
        <Card className="p-5 rounded-2xl bg-card shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="text-primary" size={20} />
            <h2 className="text-base font-bold text-foreground">This Week</h2>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {streak.weeklyActivity.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {active ? '✓' : ''}
                </motion.div>
                <span className="text-[10px] text-muted-foreground font-medium">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl bg-card shadow-lg text-center">
            <Flame className="mx-auto text-orange-500 mb-1.5" size={22} />
            <p className="text-2xl font-black text-foreground">{streak.longestStreak}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Best Streak</p>
          </Card>
          <Card className="p-4 rounded-xl bg-card shadow-lg text-center">
            <Star className="mx-auto text-yellow-500 mb-1.5" size={22} />
            <p className="text-2xl font-black text-foreground">{streak.totalActiveDays}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total Days</p>
          </Card>
          <Card className="p-4 rounded-xl bg-card shadow-lg text-center">
            <Trophy className="mx-auto text-purple-500 mb-1.5" size={22} />
            <p className="text-2xl font-black text-foreground">{streak.milestones.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Milestones</p>
          </Card>
        </div>

        {/* Next Milestone */}
        <Card className="p-5 rounded-2xl bg-card shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-500" size={20} />
              <h2 className="text-base font-bold text-foreground">Next Milestone</h2>
            </div>
            <span className="text-sm font-bold text-primary">{nextMilestone} days</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(milestoneProgress, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {nextMilestone - streak.currentStreak} more {nextMilestone - streak.currentStreak === 1 ? 'day' : 'days'} to go!
          </p>
        </Card>

        {/* Milestones */}
        <Card className="p-5 rounded-2xl bg-card shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-primary" size={20} />
            <h2 className="text-base font-bold text-foreground">Milestones</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {STREAK_MILESTONES.map((milestone) => {
              const achieved = streak.milestones.includes(milestone);
              return (
                <motion.div
                  key={milestone}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                    achieved
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-muted/50 opacity-50'
                  }`}
                >
                  <span className="text-xl mb-1">
                    {achieved ? '🏅' : '🔒'}
                  </span>
                  <span className={`text-xs font-bold ${achieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {milestone}d
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Progress;

import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { Unlock, Bell, Crown, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { GOOGLE_PLAY_PRODUCTS, handlePurchase, restorePurchases, PRICING, type PlanType } from '@/lib/billing';
import { setAdminUnlocked } from '@/components/AdminUnlock';
import { toast } from 'sonner';
import Welcome from '@/components/Welcome';
import ShowcaseImage from '@/components/ShowcaseImage';
import { DuolingoButton } from '@/components/ui/duolingo-button';
import { hasUsedFreeTrial, canEnrollInFreeTrial, markTrialUsed } from '@/lib/trialTracking';
import { hapticFeedback } from '@/lib/haptics';
import infoHome from '@/assets/info-home.png';
import infoNotes from '@/assets/info-notes.png';
import infoFolders from '@/assets/info-folders.png';
import infoJar from '@/assets/info-jar.png';
import infoTransactions from '@/assets/info-transactions.png';
import showcaseCashflow from '@/assets/showcase-cashflow.png';
import showcaseRecords from '@/assets/showcase-records.png';
import showcaseInsights from '@/assets/showcase-insights.png';
import showcaseHome from '@/assets/showcase-home.png';
import showcaseFolders from '@/assets/showcase-folders.png';
import showcaseJar from '@/assets/showcase-jar.png';
import showcaseInvestment from '@/assets/showcase-investment.png';
import showcaseNotes from '@/assets/showcase-notes.png';
import showcaseCalculator from '@/assets/showcase-calculator.png';
import showcaseCategory from '@/assets/showcase-category.png';
import showcaseCreateJar from '@/assets/showcase-create-jar.png';
import showcaseTransactions from '@/assets/showcase-transactions.png';
import showcaseJarDetail from '@/assets/showcase-jar-detail.png';
import showcaseDebtTracker from '@/assets/showcase-debt-tracker.png';
import showcaseTheme1 from '@/assets/showcase-theme-1.png';
import showcaseTheme2 from '@/assets/showcase-theme-2.png';
import showcaseTheme3 from '@/assets/showcase-theme-3.png';
import showcaseTheme4 from '@/assets/showcase-theme-4.png';
import showcaseReports1 from '@/assets/showcase-reports-1.png';
import showcaseReports2 from '@/assets/showcase-reports-2.png';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState('');
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [plan, setPlan] = useState<PlanType>('yearly');
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(1);
  const [selectedReport, setSelectedReport] = useState(1);
  const [canUseTrial, setCanUseTrial] = useState(true);
  
  // Admin unlock
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const ADMIN_SECRET = 'jarify2024admin';
  
  const handleAdminUnlock = () => {
    if (adminCode === ADMIN_SECRET) {
      setAdminUnlocked(true);
      toast.success('Admin Access Granted! All features unlocked.');
      setAdminCode('');
      onComplete();
    } else {
      toast.error('Invalid code');
    }
  };

  // Check if user can use free trial on mount
  useEffect(() => {
    setCanUseTrial(canEnrollInFreeTrial());
  }, []);

  // Preload all images for fast rendering
  useEffect(() => {
    const imagesToPreload = [
      showcaseCashflow, showcaseRecords, showcaseInsights,
      showcaseHome, showcaseFolders, showcaseJar,
      showcaseInvestment, showcaseNotes, showcaseCalculator, showcaseCategory,
      showcaseCreateJar, showcaseTransactions, showcaseJarDetail, showcaseDebtTracker,
      showcaseTheme1, showcaseTheme2, showcaseTheme3, showcaseTheme4,
      showcaseReports1, showcaseReports2,
      infoHome, infoNotes, infoFolders, infoJar, infoTransactions,
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tiktok_icon.svg/2048px-Tiktok_icon.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2880px-Google_2015_logo.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/YouTube_social_white_squircle_%282017%29.svg/2048px-YouTube_social_white_squircle_%282017%29.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Android_robot.svg/1745px-Android_robot.svg.png'
    ];
    let loadedCount = 0;
    const totalImages = imagesToPreload.length;
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      setImagesLoaded(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Social media sources
  const sources = [
    { name: 'TikTok', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tiktok_icon.svg/2048px-Tiktok_icon.svg.png' },
    { name: 'YouTube', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/YouTube_social_white_square_%282017%29.svg/1024px-YouTube_social_white_square_%282017%29.svg.png' },
    { name: 'Google', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png' },
    { name: 'Play Store', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_Play_2022_icon.svg/1856px-Google_Play_2022_icon.svg.png' },
    { name: 'Facebook', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/2048px-2023_Facebook_icon.svg.png' },
    { name: 'LinkedIn', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/2048px-LinkedIn_icon.svg.png' },
  ];

  // Total steps: 1-14 showcases, 15 theme selector, 16 reports selector, 17 social media, 18 confetti/progress
  const totalSteps = 18;

  useEffect(() => {
    if (step === 18) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setComplete(true);
              setTimeout(() => setShowPaywall(true), 2000);
            }, 500);
            return 100;
          }
          return prev + 1;
        });
      }, 80);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleContinue = () => {
    hapticFeedback.light();
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    hapticFeedback.light();
    if (step === 1) {
      setShowWelcome(true);
    } else {
      setStep(step - 1);
    }
  };

  // Show welcome screen first
  if (showWelcome) {
    return <Welcome onGetStarted={() => setShowWelcome(false)} />;
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-center mb-6">
            {canUseTrial ? 'Start your 3-day FREE trial to continue.' : 'Subscribe to continue using Jarify'}
          </h1>
          
          {/* Show warning if user has already used trial */}
          {!canUseTrial && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 mx-auto w-80 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Free trial already used</p>
                <p className="text-amber-600 text-xs mt-1">You've already used your free trial. Subscribe to continue enjoying all premium features.</p>
              </div>
            </div>
          )}
          
          {canUseTrial && (
            <div className="flex flex-col items-start mx-auto w-80 relative">
              <div className="absolute left-[10.5px] top-[20px] bottom-[20px] w-[11px] bg-black/20 rounded-b-full"></div>
              
              <div className="flex items-start gap-3 mb-6 relative">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white z-10 flex-shrink-0">
                  <Unlock size={16} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold">Today</p>
                  <p className="text-gray-500 text-sm">Unlock all app features like Calculating, Adding Notes, Unlimited Goals and more.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-6 relative">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white z-10 flex-shrink-0">
                  <Bell size={16} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold">In 2 Days - Reminder</p>
                  <p className="text-gray-500 text-sm">We'll send you a reminder before your trial ends.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 relative">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white z-10 flex-shrink-0">
                  <Crown size={16} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold">In 3 Days - Billing Starts</p>
                  <p className="text-gray-500 text-sm">You'll be charged after 3 days unless you cancel anytime before.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex gap-3 w-72">
              <button onClick={() => { hapticFeedback.light(); setPlan('monthly'); }} className={`border rounded-2xl py-2.5 px-4 flex-1 text-center ${plan === 'monthly' ? 'border-2 border-black bg-gray-50' : 'border-gray-200'}`}>
                <p className="font-semibold text-lg">Monthly</p>
                <p className="text-gray-600 text-base mt-1">{PRICING.monthly.displayPrice}</p>
              </button>

              <button onClick={() => { hapticFeedback.light(); setPlan('yearly'); }} className={`border rounded-2xl py-2.5 px-4 flex-1 text-center relative flex flex-col items-center justify-center ${plan === 'yearly' ? 'border-2 border-black' : 'border-gray-200'}`}>
                {canUseTrial && (
                  <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full absolute left-1/2 -translate-x-1/2 -top-2.5 whitespace-nowrap">
                    3 DAYS FREE
                  </span>
                )}
                <p className="font-semibold text-lg text-center">Yearly</p>
                <p className="text-gray-600 text-base mt-1">{PRICING.yearly.displayPrice}</p>
              </button>
            </div>

              {plan === 'yearly' && canUseTrial && (
                <p className="text-gray-500 text-sm mt-2 text-center w-72">
                  3 days free, then {PRICING.yearly.displayYearlyPrice} ({PRICING.yearly.displayPrice})
                </p>
              )}
              {plan === 'yearly' && !canUseTrial && (
                <p className="text-gray-500 text-sm mt-2 text-center w-72">
                  {PRICING.yearly.displayYearlyPrice} ({PRICING.yearly.displayPrice})
                </p>
              )}

              <DuolingoButton 
                variant="black"
                size="fullLg"
                className="w-72 whitespace-nowrap text-sm"
                onClick={async () => {
                  hapticFeedback.medium();
                  console.log(`Selected plan: ${plan}, Product ID: ${GOOGLE_PLAY_PRODUCTS[plan].productId}`);
                  try {
                    const useTrial = canUseTrial && plan === 'yearly';
                    const success = await handlePurchase(plan, useTrial);
                    if (success) {
                      if (useTrial) {
                        const trialEndDate = new Date();
                        trialEndDate.setDate(trialEndDate.getDate() + 3);
                        markTrialUsed(new Date(), trialEndDate);
                      }
                      onComplete();
                    }
                  } catch (error) {
                    toast.error('Purchase failed. Please try again.');
                  }
                }}
              >
                {canUseTrial && plan === 'yearly' ? 'Start My 3-Day Free Trial' : 'Subscribe Now'}
              </DuolingoButton>

            {plan === 'yearly' && (
              <div className="mt-6 bg-gray-50 rounded-xl p-4 w-80">
                <p className="text-sm font-semibold text-gray-900 mb-3 text-center">Compare & Save</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Monthly plan</span>
                    <span className="text-gray-900 line-through">${PRICING.monthly.yearlyEquivalent.toFixed(2)}/year</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Yearly plan</span>
                    <span className="text-gray-900">{PRICING.yearly.displayYearlyPrice}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-green-600">You save with yearly</span>
                      <span className="text-green-600">${PRICING.yearly.savings.toFixed(2)}/year</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={async () => {
                hapticFeedback.light();
                try {
                  const restored = await restorePurchases();
                  if (restored) {
                    toast.success('Subscription restored successfully!');
                    onComplete();
                  } else {
                    toast.info('No previous purchases found.');
                  }
                } catch (error) {
                  toast.error('Failed to restore purchases.');
                }
              }} 
              className="text-gray-500 text-sm underline mt-4"
            >
              Restore Purchases
            </button>
            
            <div className="mt-6 w-80">
              <p className="text-gray-400 text-xs text-center mb-2">Have an access code?</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showAdminCode ? 'text' : 'password'}
                    placeholder="Enter code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminUnlock()}
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminCode(!showAdminCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showAdminCode ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button 
                  onClick={handleAdminUnlock}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 relative overflow-y-auto">
      {complete && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} colors={['#FFFFFF', '#F8F8F8', '#F0F0F0', '#E8E8E8', '#E0E0E0']} />}

      <div>
        <div className="flex items-center gap-4">
          {step >= 1 && (
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <div className="flex-1">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-black" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Step 1: Track Every Dollar */}
        {step === 1 && (
          <ShowcaseImage
            src={showcaseCashflow}
            alt="Cash flow tracking"
            title="Track Every Dollar"
            subtitle="Control your cash flow."
          />
        )}

        {/* Step 2: Never Miss Anything */}
        {step === 2 && (
          <ShowcaseImage
            src={showcaseRecords}
            alt="Transaction records"
            title="Never Miss Anything"
            subtitle="Every transaction, always organized."
          />
        )}

        {/* Step 3: Understand Your Spending */}
        {step === 3 && (
          <ShowcaseImage
            src={showcaseInsights}
            alt="Spending insights"
            title="Understand Your Spending"
            subtitle="Beautiful insights, smarter decisions."
          />
        )}

        {/* Step 4: Your Financial Hub */}
        {step === 4 && (
          <ShowcaseImage
            src={showcaseHome}
            alt="Financial hub"
            title="Your Financial Hub"
            subtitle="Everything in one place."
          />
        )}

        {/* Step 5: Organize Your Dreams */}
        {step === 5 && (
          <ShowcaseImage
            src={showcaseFolders}
            alt="Organized goals"
            title="Organize Your Dreams"
            subtitle="Group goals, track progress."
          />
        )}

        {/* Step 6: Watch Goals Grow */}
        {step === 6 && (
          <ShowcaseImage
            src={showcaseJar}
            alt="Goal progress"
            title="Watch Goals Grow"
            subtitle="Visual progress, real motivation."
          />
        )}

        {/* Step 7: Plan Your Investments */}
        {step === 7 && (
          <ShowcaseImage
            src={showcaseInvestment}
            alt="Investment planning"
            title="Plan Your Investments"
            subtitle="Daily, weekly, monthly projections."
          />
        )}

        {/* Step 8: Capture Your Thoughts */}
        {step === 8 && (
          <ShowcaseImage
            src={showcaseNotes}
            alt="Sticky notes"
            title="Capture Your Thoughts"
            subtitle="Colorful notes, never forget."
          />
        )}

        {/* Step 9: Calculate Your Goals */}
        {step === 9 && (
          <ShowcaseImage
            src={showcaseCalculator}
            alt="Savings calculator"
            title="Calculate Your Goals"
            subtitle="Smart savings projections instantly."
          />
        )}

        {/* Step 10: Customize Your Way */}
        {step === 10 && (
          <ShowcaseImage
            src={showcaseCategory}
            alt="Custom categories"
            title="Customize Your Way"
            subtitle="Create categories that fit you."
          />
        )}

        {/* Step 11: Create Your Jar */}
        {step === 11 && (
          <ShowcaseImage
            src={showcaseCreateJar}
            alt="Create jar"
            title="Create Your Jar"
            subtitle="Savings or debt, your choice."
          />
        )}

        {/* Step 12: Track Every Movement */}
        {step === 12 && (
          <ShowcaseImage
            src={showcaseTransactions}
            alt="Transaction history"
            title="Track Every Movement"
            subtitle="Complete transaction history."
          />
        )}

        {/* Step 13: See Your Progress */}
        {step === 13 && (
          <ShowcaseImage
            src={showcaseJarDetail}
            alt="Jar detail view"
            title="See Your Progress"
            subtitle="Detailed jar view, full control."
          />
        )}

        {/* Step 14: Crush Your Debt */}
        {step === 14 && (
          <ShowcaseImage
            src={showcaseDebtTracker}
            alt="Debt tracker"
            title="Crush Your Debt"
            subtitle="Track payoffs, celebrate wins."
          />
        )}

        {/* Step 15: Choose Your Theme */}
        {step === 15 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-6 text-center flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Style</h1>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">Pick a theme that suits you.</p>
            
            {/* Theme Toggle Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1.5 mb-4">
              {[1, 2, 3, 4].map((themeNum) => (
                <button
                  key={themeNum}
                  onClick={() => setSelectedTheme(themeNum)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    selectedTheme === themeNum
                      ? 'bg-primary text-white shadow-lg scale-110'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {themeNum}
                </button>
              ))}
            </div>

            <motion.div
              key={selectedTheme}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100"
            >
              <img 
                src={
                  selectedTheme === 1 ? showcaseTheme1 :
                  selectedTheme === 2 ? showcaseTheme2 :
                  selectedTheme === 3 ? showcaseTheme3 :
                  showcaseTheme4
                } 
                alt={`Theme ${selectedTheme}`} 
                loading="eager" 
                decoding="async" 
                fetchPriority="high" 
                className="w-[320px] h-auto max-h-[420px] object-contain rounded-2xl" 
              />
            </motion.div>
          </motion.section>
        )}

        {/* Step 16: Reports & Analytics */}
        {step === 16 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-6 text-center flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Powerful Analytics</h1>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">Insights that drive your goals.</p>
            
            {/* Report Toggle Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1.5 mb-4">
              {[1, 2].map((reportNum) => (
                <button
                  key={reportNum}
                  onClick={() => setSelectedReport(reportNum)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    selectedReport === reportNum
                      ? 'bg-primary text-white shadow-lg scale-110'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {reportNum}
                </button>
              ))}
            </div>

            <motion.div
              key={selectedReport}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100"
            >
              <img 
                src={selectedReport === 1 ? showcaseReports1 : showcaseReports2} 
                alt={`Reports ${selectedReport}`} 
                loading="eager" 
                decoding="async" 
                fetchPriority="high" 
                className="w-[320px] h-auto max-h-[420px] object-contain rounded-2xl" 
              />
            </motion.div>
          </motion.section>
        )}

        {/* Step 17: How did you find us? */}
        {step === 17 && (
          <section className="mt-8">
            <h1 className="text-2xl font-semibold text-gray-900">How did you find us?</h1>
            <p className="text-gray-400 mt-2">Select a platform.</p>

            <div className="mt-6 space-y-4 pb-24">
              {sources.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSource(s.name)}
                  className={`flex items-center gap-3 rounded-2xl py-4 px-4 w-full transition border text-left ${source === s.name ? 'bg-black text-white border-black' : 'text-gray-800 border-gray-100'}`}
                  style={source !== s.name ? { backgroundColor: '#f9f8fd' } : {}}
                >
                  <img src={s.logo} alt={s.name} loading="eager" decoding="async" className="w-6 h-6" style={{ filter: 'none' }} />
                  <span className="text-base font-medium" style={{ color: source === s.name ? '#fff' : s.color }}>{s.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 18: Confetti/Progress */}
        {step === 18 && (
          <section className="mt-20 text-center">
            <h1 className="text-5xl font-bold mb-4">{progress}%</h1>
            <p className="text-lg font-semibold mb-4">We're setting Jars Goals for you</p>

            <div className="w-72 h-2 mx-auto rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                className="h-full bg-black"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="mt-8 rounded-2xl p-5 shadow-lg w-80 mx-auto" style={{ backgroundColor: '#f9f8fd' }}>
              <h2 className="font-semibold text-lg mb-2">Daily recommendation progress</h2>
              {["Goals", "Sticky Notes", "Folders", "Transaction Records", "Calculators"].map((item, i) => (
                <div key={i} className="py-2 text-left">
                  <div className="flex justify-between mb-1">
                    <span>{item}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-black"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {!complete && step < 18 && (
        <div className="fixed bottom-6 left-6 right-6">
          <div className="max-w-3xl mx-auto">
            <DuolingoButton 
              variant="black"
              size="full"
              onClick={handleContinue}
            >
              Continue
            </DuolingoButton>
          </div>
        </div>
      )}
    </div>
  );
}

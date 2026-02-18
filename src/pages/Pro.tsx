import { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Check, Sparkles, TrendingUp, Shield, Zap, Gift, Settings2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DuolingoButton } from '@/components/ui/duolingo-button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { setAdminUnlocked } from '@/components/AdminUnlock';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

// Admin secret code - change this to your own secret
const ADMIN_SECRET = 'jarify2024admin';

const Pro = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const { 
    tier, 
    isLoading, 
    isTrialActive,
    expirationDate,
    purchaseMonthly, 
    purchaseYearly, 
    restorePurchases, 
    showPaywall,
    showCustomerCenter,
    pricing 
  } = useSubscription();
  const isPremium = tier === 'premium';
  const { toast } = useToast();
  
  // Admin unlock
  const [secretCode, setSecretCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'light';
    setDarkMode(savedTheme !== 'light');
  }, []);

  const handleAdminUnlock = () => {
    if (secretCode === ADMIN_SECRET) {
      setAdminUnlocked(true);
      toast({
        title: 'Admin Access Granted ✓',
        description: 'All premium features unlocked!',
      });
      setSecretCode('');
      window.location.reload();
    } else {
      toast({
        title: 'Invalid Code',
        description: 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const features = [
    { icon: <Sparkles size={20} />, title: 'Unlimited Goals', description: 'Create as many savings goals as you need' },
    { icon: <TrendingUp size={20} />, title: 'Advanced Analytics', description: 'Deep insights into your saving habits' },
    { icon: <Shield size={20} />, title: 'Cloud Backup', description: 'Never lose your data with automatic backups' },
    { icon: <Zap size={20} />, title: 'Priority Support', description: 'Get help faster with premium support' },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 mb-6 bg-background/90 backdrop-blur-md border-b border-border shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full hover:bg-accent transition-colors"
            >
              <ArrowLeft className="text-foreground" size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Crown className="text-primary" size={28} />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Jarify Pro</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        {isPremium ? (
          <>
            <Card className="bg-card p-8 rounded-2xl shadow-lg text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Crown className="text-primary" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">You're a Pro Member!</h2>
              <p className="text-muted-foreground mb-4">Thank you for supporting Jarify</p>
              
              {isTrialActive && (
                <Badge variant="secondary" className="mb-4">
                  <Gift className="h-3 w-3 mr-1" />
                  Trial Active
                </Badge>
              )}
              
              {expirationDate && (
                <p className="text-sm text-muted-foreground mb-4">
                  {isTrialActive ? 'Trial ends' : 'Renews'}: {formatDate(expirationDate)}
                </p>
              )}
              
              {/* Manage Subscription Button */}
              <Button
                onClick={() => { hapticFeedback.light(); showCustomerCenter(); }}
                variant="outline"
                className="w-full mt-4"
                disabled={isLoading}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </Card>
          </>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Crown className="text-white" size={48} />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Unlock Premium Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Take your savings journey to the next level with Jarify Pro
              </p>
            </div>

            {/* RevenueCat Paywall Button */}
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 p-6 rounded-xl mb-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">Quick Subscribe</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View all plans and start your subscription
                </p>
                <Button
                  onClick={showPaywall}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white text-lg py-6 rounded-xl shadow-lg"
                >
                  {isLoading ? 'Loading...' : 'View Plans & Subscribe'}
                </Button>
              </div>
            </Card>

            {/* Free Trial Banner */}
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 p-4 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Gift className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Start with a Free Trial!</p>
                  <p className="text-sm text-muted-foreground">Try all premium features before you pay</p>
                </div>
              </div>
            </Card>

            {/* Pricing Cards - Side by Side */}
            <div className="grid grid-cols-2 gap-4 mb-4 px-2">
              {/* Monthly Plan */}
              <Card 
                className={cn(
                  "bg-card py-8 px-6 rounded-2xl cursor-pointer transition-all",
                  selectedPlan === 'monthly' 
                    ? "border-2 border-foreground shadow-lg" 
                    : "border border-border"
                )}
                onClick={() => { hapticFeedback.light(); setSelectedPlan('monthly'); }}
              >
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground mb-2">Monthly</p>
                  <p className="text-lg text-muted-foreground">{pricing.monthly.displayPrice}/mo</p>
                </div>
              </Card>

              {/* Yearly Plan */}
              <Card 
                className={cn(
                  "bg-card py-8 px-6 rounded-2xl cursor-pointer transition-all relative",
                  selectedPlan === 'yearly' 
                    ? "border-2 border-foreground shadow-lg" 
                    : "border border-border"
                )}
                onClick={() => { hapticFeedback.light(); setSelectedPlan('yearly'); }}
              >
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1 rounded-full">
                  3 DAYS FREE
                </Badge>
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground mb-2">Yearly</p>
                  <p className="text-lg text-muted-foreground">{pricing.yearly.displayPrice}/mo</p>
                </div>
              </Card>
            </div>

            {/* Pricing Info */}
            <p className="text-center text-muted-foreground text-sm mb-6">
              {selectedPlan === 'yearly' 
                ? `3 days free, then ${pricing.yearly.displayYearlyPrice} (${pricing.yearly.displayPrice}/mo)`
                : `Cancel anytime`
              }
            </p>

            {/* Main CTA Button - Duolingo Style */}
            <DuolingoButton
              onClick={selectedPlan === 'yearly' ? purchaseYearly : purchaseMonthly}
              disabled={isLoading}
              variant="black"
              size="fullLg"
              className="mb-8"
            >
              {isLoading ? 'Processing...' : 'Start My 3-Day Free Trial'}
            </DuolingoButton>

            {/* Restore Purchases */}
            <Button
              onClick={restorePurchases}
              disabled={isLoading}
              variant="ghost"
              className="w-full mb-8"
            >
              Restore Purchases
            </Button>
          </>
        )}

        {/* Features Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Premium Features</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits List */}
        <Card className="bg-card p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-4">What's Included</h3>
          <div className="space-y-3">
            {[
              'Unlimited savings goals',
              'Advanced charts and analytics',
              'Cloud sync across devices',
              'Custom categories and themes',
              'Priority customer support',
              'Export data to CSV',
              'Ad-free experience',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="text-white" size={16} />
                </div>
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Admin Unlock Section */}
        <Card className="bg-muted/30 border-dashed border-2 border-muted-foreground/20 p-4 rounded-xl mt-8">
          <p className="text-xs text-muted-foreground text-center mb-3">Have an access code?</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showCode ? 'text' : 'password'}
                placeholder="Enter code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminUnlock()}
                className="pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button onClick={() => { hapticFeedback.light(); handleAdminUnlock(); }} size="sm" variant="secondary">
              Apply
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Pro;

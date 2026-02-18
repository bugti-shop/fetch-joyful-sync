import { Crown, User, LogIn, LogOut, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useSync } from '@/contexts/SyncContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ProPaywall } from '@/components/ProPaywall';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const Profile = () => {
  const { tier } = useSubscription();
  const { user, isSignedIn, isLoading, signIn, signOut } = useGoogleAuth();
  const { isSyncing, lastSynced, syncNow, autoSyncEnabled, setAutoSyncEnabled } = useSync();
  const isPremium = tier === 'premium';
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-4 py-6 space-y-6">
        {/* User Avatar */}
        <div className="flex flex-col items-center gap-4">
          {isSignedIn && user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <User size={48} className="text-muted-foreground" />
            </div>
          )}
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              {isSignedIn && user ? user.name : 'Guest User'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignedIn && user ? user.email : 'Sign in to sync your data'}
            </p>
          </div>
        </div>

        {/* Google Sign In / Sign Out */}
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            {isSignedIn ? (
              <>
                <LogOut size={32} className="text-destructive" />
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-1">Signed in as {user?.givenName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={signOut}
                  disabled={isLoading}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <>
                <LogIn size={32} className="text-primary" />
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-1">Sign in with Google</h3>
                  <p className="text-sm text-muted-foreground">Sync your savings across devices</p>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={signIn}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Sync Card - Only show when signed in */}
        {isSignedIn && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cloud className="h-6 w-6 text-primary" />
                <h3 className="font-semibold text-foreground">Google Drive Sync</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {isSyncing ? 'Syncing...' : lastSynced ? 'Active' : 'Ready'}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Your jars, goals, expenses, incomes, and categories are synced to your Google Drive.
            </p>

            {lastSynced && (
              <p className="text-xs text-muted-foreground mb-3">
                Last synced: {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
              </p>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {autoSyncEnabled ? (
                  <Cloud className="h-4 w-4 text-primary" />
                ) : (
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">Auto Sync</span>
              </div>
              <Switch
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
              />
            </div>

            <Button
              onClick={syncNow}
              disabled={isSyncing}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </Card>
        )}

        {/* Subscription Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className={`h-6 w-6 ${isPremium ? 'text-teal-500' : 'text-muted-foreground'}`} />
              <h3 className="font-semibold text-foreground">Subscription</h3>
            </div>
            {isPremium ? (
              <Badge className="bg-teal-500 text-white border-0">Pro</Badge>
            ) : (
              <Badge variant="secondary">Free</Badge>
            )}
          </div>
          {isPremium ? (
            <p className="text-sm text-muted-foreground">You have access to all Pro features 🎉</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to Pro to unlock all features
              </p>
              <Button
                onClick={() => setShowPaywall(true)}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </>
          )}
        </Card>
      </div>

      <ProPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </div>
  );
};

export default Profile;

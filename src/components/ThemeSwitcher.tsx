import { Palette, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface Theme {
  id: string;
  name: string;
  preview: string;
  isPremium: boolean;
}

const themes: Theme[] = [
  { id: 'light', name: 'Light Mode', preview: 'bg-white', isPremium: false },
  { id: 'dark', name: 'Default Dark', preview: 'bg-gray-900', isPremium: false },
  { id: 'ocean', name: 'Ocean Blue', preview: 'bg-gradient-to-br from-blue-900 to-cyan-700', isPremium: true },
  { id: 'forest', name: 'Forest Green', preview: 'bg-gradient-to-br from-green-900 to-emerald-700', isPremium: true },
  { id: 'sunset', name: 'Sunset Orange', preview: 'bg-gradient-to-br from-orange-900 to-rose-700', isPremium: true },
  { id: 'rose', name: 'Rose Gold', preview: 'bg-gradient-to-br from-rose-900 to-pink-700', isPremium: true },
  { id: 'midnight', name: 'Midnight Purple', preview: 'bg-gradient-to-br from-purple-900 to-indigo-700', isPremium: true },
  { id: 'minimal', name: 'Minimal Gray', preview: 'bg-gradient-to-br from-gray-800 to-slate-700', isPremium: true },
  { id: 'nebula', name: 'Nebula', preview: 'bg-gradient-to-br from-purple-950 to-pink-800', isPremium: true },
  { id: 'obsidian', name: 'Obsidian', preview: 'bg-gradient-to-br from-slate-950 to-blue-950', isPremium: true },
  { id: 'graphite', name: 'Graphite', preview: 'bg-gradient-to-br from-slate-900 to-slate-700', isPremium: true },
  { id: 'onyx', name: 'Onyx', preview: 'bg-gradient-to-br from-black to-gray-900', isPremium: true },
  { id: 'charcoal', name: 'Charcoal', preview: 'bg-gradient-to-br from-stone-900 to-neutral-800', isPremium: true },
];

export const ThemeSwitcher = () => {
  const { tier, canUseFeature } = useSubscription();
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'light';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'midnight', 'minimal', 'nebula', 'obsidian', 'graphite', 'onyx', 'charcoal');
    root.classList.add(themeId);
  };

  const handleThemeSelect = (theme: Theme) => {
    if (theme.isPremium && !canUseFeature('dark_modes')) {
      return;
    }
    setCurrentTheme(theme.id);
    applyTheme(theme.id);
    localStorage.setItem('app_theme', theme.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Theme Selector</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred color theme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => {
            const isLocked = theme.isPremium && tier !== 'premium';
            const isActive = currentTheme === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                disabled={isLocked}
                className={cn(
                  'relative rounded-lg border-2 p-3 transition-all',
                  isActive
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border hover:border-primary/50',
                  isLocked && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn('h-16 rounded-md mb-2', theme.preview)} />
                <p className="text-sm font-medium text-center">{theme.name}</p>
                {theme.isPremium && (
                  <Badge
                    variant={isLocked ? 'secondary' : 'default'}
                    className="absolute top-2 right-2 text-xs"
                  >
                    {isLocked ? <Lock className="h-3 w-3" /> : 'Premium'}
                  </Badge>
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg border-2 border-primary flex items-center justify-center bg-primary/10">
                    <Badge variant="default">Active</Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

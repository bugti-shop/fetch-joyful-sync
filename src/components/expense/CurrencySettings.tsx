import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  currencies, 
  loadCurrencySettings, 
  saveCurrencySettings, 
  loadCustomRates, 
  saveCustomRates,
  CurrencySettings as CurrencySettingsType,
  getExchangeRate
} from '@/lib/currency';

interface CurrencySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencySettings = ({ isOpen, onClose }: CurrencySettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CurrencySettingsType>(loadCurrencySettings());
  const [customRates, setCustomRates] = useState<Record<string, number>>(loadCustomRates());
  const [showRatesEditor, setShowRatesEditor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadCurrencySettings());
      setCustomRates(loadCustomRates());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveCurrencySettings(settings);
    saveCustomRates(customRates);
    toast({ title: 'Settings saved', description: 'Currency preferences updated' });
    onClose();
  };

  const handleRateChange = (currencyCode: string, value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate) && rate > 0) {
      setCustomRates(prev => ({ ...prev, [currencyCode]: rate }));
    }
  };

  const resetRate = (currencyCode: string) => {
    setCustomRates(prev => {
      const updated = { ...prev };
      delete updated[currencyCode];
      return updated;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Globe size={20} />
                Currency Settings
              </h2>
              <div className="w-9" />
            </div>

            <div className="p-4 space-y-6">
              {/* Base Currency Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Base Currency</Label>
                <p className="text-sm text-muted-foreground">All transactions will be converted to this currency for totals</p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {currencies.slice(0, 15).map(curr => (
                    <button
                      key={curr.code}
                      onClick={() => setSettings(prev => ({ ...prev, baseCurrency: curr.code }))}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        settings.baseCurrency === curr.code
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <span className="text-lg font-bold">{curr.symbol}</span>
                      <span className="text-xs">{curr.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Original Currency Toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div>
                  <Label className="text-base font-semibold">Show Original Currency</Label>
                  <p className="text-sm text-muted-foreground">Display original amount alongside converted value</p>
                </div>
                <Switch
                  checked={settings.showOriginalCurrency}
                  onCheckedChange={checked => setSettings(prev => ({ ...prev, showOriginalCurrency: checked }))}
                />
              </div>

              {/* Custom Exchange Rates */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowRatesEditor(!showRatesEditor)}
                  className="flex items-center justify-between w-full p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw size={20} className="text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-semibold">Custom Exchange Rates</p>
                      <p className="text-sm text-muted-foreground">Override default conversion rates</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">{showRatesEditor ? '−' : '+'}</span>
                </button>

                <AnimatePresence>
                  {showRatesEditor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 max-h-48 overflow-y-auto p-2">
                        {currencies.slice(0, 10).map(curr => (
                          <div key={curr.code} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                            <span className="w-16 font-medium text-sm">{curr.code}</span>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder={String(getExchangeRate(curr.code, 'USD'))}
                              value={customRates[curr.code] || ''}
                              onChange={e => handleRateChange(curr.code, e.target.value)}
                              className="flex-1 h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">to USD</span>
                            {customRates[curr.code] && (
                              <button
                                onClick={() => resetRate(curr.code)}
                                className="p-1 text-muted-foreground hover:text-destructive"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} className="w-full h-12 text-lg font-semibold">
                <Check size={20} className="mr-2" />
                Save Settings
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

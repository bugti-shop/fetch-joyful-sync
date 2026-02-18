export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
];

// Approximate exchange rates to USD (updated periodically)
// In a production app, you'd fetch these from an API
const exchangeRatesToUSD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  CAD: 0.74,
  AUD: 0.65,
  CHF: 1.13,
  CNY: 0.14,
  INR: 0.012,
  MXN: 0.058,
  BRL: 0.20,
  KRW: 0.00076,
  SGD: 0.74,
  HKD: 0.13,
  SEK: 0.095,
  NOK: 0.092,
  DKK: 0.14,
  NZD: 0.60,
  ZAR: 0.055,
  RUB: 0.011,
  TRY: 0.031,
  PLN: 0.25,
  THB: 0.028,
  IDR: 0.000063,
  MYR: 0.22,
  PHP: 0.018,
  VND: 0.00004,
  AED: 0.27,
  SAR: 0.27,
  EGP: 0.020,
};

const CURRENCY_SETTINGS_KEY = 'jarify_currency_settings';
const CUSTOM_RATES_KEY = 'jarify_custom_rates';

export interface CurrencySettings {
  baseCurrency: string;
  showOriginalCurrency: boolean;
}

export const getDefaultCurrencySettings = (): CurrencySettings => ({
  baseCurrency: 'USD',
  showOriginalCurrency: true,
});

export const loadCurrencySettings = (): CurrencySettings => {
  const saved = localStorage.getItem(CURRENCY_SETTINGS_KEY);
  return saved ? JSON.parse(saved) : getDefaultCurrencySettings();
};

export const saveCurrencySettings = (settings: CurrencySettings): void => {
  localStorage.setItem(CURRENCY_SETTINGS_KEY, JSON.stringify(settings));
};

export const loadCustomRates = (): Record<string, number> => {
  const saved = localStorage.getItem(CUSTOM_RATES_KEY);
  return saved ? JSON.parse(saved) : {};
};

export const saveCustomRates = (rates: Record<string, number>): void => {
  localStorage.setItem(CUSTOM_RATES_KEY, JSON.stringify(rates));
};

export const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  const customRates = loadCustomRates();
  
  // Get rates to USD
  const fromRate = customRates[fromCurrency] ?? exchangeRatesToUSD[fromCurrency] ?? 1;
  const toRate = customRates[toCurrency] ?? exchangeRatesToUSD[toCurrency] ?? 1;
  
  // Convert through USD as base
  return fromRate / toRate;
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

export const formatCurrencyAmount = (amount: number, currencyCode: string): string => {
  const currency = currencies.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || '$';
  
  // Handle currencies without decimals
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];
  const decimals = noDecimalCurrencies.includes(currencyCode) ? 0 : 2;
  
  return `${symbol}${amount.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`;
};

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return currencies.find(c => c.code === code);
};

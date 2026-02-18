import { useMemo, useCallback } from 'react';
import { useExpense, ExpenseCategory, Expense, Income } from '@/contexts/ExpenseContext';

// Keyword mappings for smart category suggestions
const categoryKeywords: Record<string, string[]> = {
  // Food & Dining
  food: ['restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'meal', 'eat', 'dine', 'cafe', 'bistro', 'burger', 'pizza', 'sushi', 'chinese', 'indian', 'thai', 'mexican', 'italian', 'buffet', 'dhaba', 'hotel'],
  groceries: ['grocery', 'groceries', 'supermarket', 'mart', 'store', 'vegetables', 'fruits', 'milk', 'bread', 'eggs', 'chicken', 'meat', 'fish', 'rice', 'atta', 'dal', 'sabzi', 'kirana', 'provision'],
  coffee: ['coffee', 'starbucks', 'cafe', 'tea', 'chai', 'latte', 'cappuccino', 'espresso', 'smoothie', 'juice', 'shake', 'beverage', 'drink'],
  restaurant: ['mcdonald', 'kfc', 'domino', 'subway', 'wendy', 'taco', 'burger king', 'pizza hut', 'papa john', 'chipotle', 'nando', 'zomato', 'swiggy', 'foodpanda', 'deliveroo'],
  
  // Transport
  transport: ['uber', 'lyft', 'ola', 'grab', 'taxi', 'cab', 'bus', 'train', 'metro', 'subway', 'commute', 'ride', 'careem', 'bolt', 'rapido', 'auto'],
  fuel: ['petrol', 'diesel', 'gas', 'fuel', 'gasoline', 'shell', 'bp', 'exxon', 'chevron', 'hp', 'indian oil', 'bharat petroleum', 'cng', 'ev charge', 'charging'],
  parking: ['parking', 'valet', 'garage', 'lot'],
  
  // Housing
  rent: ['rent', 'rental', 'lease', 'tenant', 'landlord', 'apartment', 'flat'],
  mortgage: ['mortgage', 'home loan', 'emi', 'house payment'],
  utilities: ['utility', 'utilities', 'bill', 'electric', 'gas bill', 'water bill'],
  electricity: ['electricity', 'electric', 'power', 'bijli', 'wapda', 'k-electric'],
  water: ['water', 'water bill', 'pani'],
  internet: ['internet', 'wifi', 'broadband', 'fiber', 'ptcl', 'stormfiber', 'nayatel', 'att', 'verizon', 'comcast', 'spectrum'],
  phone: ['phone', 'mobile', 'cellular', 'sim', 'recharge', 'jazz', 'telenor', 'zong', 'ufone', 'airtel', 'jio', 'vodafone'],
  
  // Shopping
  shopping: ['amazon', 'ebay', 'walmart', 'target', 'daraz', 'alibaba', 'aliexpress', 'flipkart', 'shopping', 'mall', 'store', 'purchase', 'buy'],
  clothing: ['clothes', 'clothing', 'shirt', 'pants', 'dress', 'shoes', 'fashion', 'zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'puma', 'khaadi', 'gul ahmed', 'junaid jamshed'],
  electronics: ['electronic', 'laptop', 'phone', 'computer', 'tablet', 'ipad', 'iphone', 'samsung', 'headphone', 'speaker', 'tv', 'camera', 'gadget', 'apple store', 'best buy'],
  
  // Entertainment
  entertainment: ['movie', 'cinema', 'theater', 'concert', 'show', 'event', 'ticket', 'fun', 'amusement', 'theme park'],
  movies: ['netflix', 'hulu', 'disney', 'hbo', 'prime video', 'cinema', 'movie', 'film', 'theatre'],
  games: ['game', 'gaming', 'steam', 'playstation', 'xbox', 'nintendo', 'epic games', 'twitch', 'pubg', 'fortnite'],
  music: ['spotify', 'apple music', 'youtube music', 'soundcloud', 'tidal', 'pandora', 'music'],
  subscriptions: ['subscription', 'membership', 'premium', 'pro', 'monthly', 'annual', 'renewal'],
  
  // Health
  health: ['medicine', 'pharmacy', 'doctor', 'hospital', 'clinic', 'medical', 'health', 'prescription', 'tablet', 'capsule', 'syrup'],
  gym: ['gym', 'fitness', 'workout', 'exercise', 'yoga', 'pilates', 'crossfit', 'membership'],
  medical: ['hospital', 'doctor', 'dentist', 'checkup', 'lab', 'test', 'x-ray', 'scan', 'mri', 'blood test'],
  insurance: ['insurance', 'policy', 'premium', 'coverage', 'health plan'],
  
  // Education
  education: ['school', 'college', 'university', 'tuition', 'course', 'class', 'tutorial', 'education', 'learn', 'study'],
  books: ['book', 'kindle', 'audible', 'amazon books', 'textbook', 'novel', 'magazine', 'newspaper'],
  courses: ['udemy', 'coursera', 'skillshare', 'linkedin learning', 'masterclass', 'pluralsight', 'bootcamp'],
  
  // Other Expenses
  pets: ['pet', 'dog', 'cat', 'vet', 'veterinary', 'animal', 'pet food', 'petco', 'petsmart'],
  gifts: ['gift', 'present', 'birthday', 'anniversary', 'wedding', 'celebration'],
  travel: ['flight', 'airline', 'hotel', 'airbnb', 'booking', 'travel', 'trip', 'vacation', 'expedia', 'kayak', 'pia', 'emirates', 'qatar airways'],
  vacation: ['vacation', 'holiday', 'resort', 'beach', 'tour', 'cruise'],
  beauty: ['salon', 'spa', 'haircut', 'beauty', 'makeup', 'cosmetic', 'skincare', 'nail', 'massage', 'parlour', 'parlor'],
  laundry: ['laundry', 'dry clean', 'wash', 'iron', 'dhobi'],
  home: ['furniture', 'home', 'decor', 'ikea', 'home depot', 'lowes', 'garden', 'plant'],
  furniture: ['furniture', 'sofa', 'bed', 'table', 'chair', 'desk', 'cabinet', 'wardrobe'],
  maintenance: ['repair', 'fix', 'maintenance', 'plumber', 'electrician', 'handyman', 'mechanic', 'service'],
  charity: ['charity', 'donation', 'zakat', 'sadqa', 'sadaqah', 'tithe', 'give', 'help', 'ngo'],
  taxes: ['tax', 'income tax', 'gst', 'vat', 'sales tax', 'property tax'],
  misc: ['misc', 'other', 'miscellaneous', 'random'],
  
  // Income Categories
  salary: ['salary', 'wage', 'paycheck', 'pay', 'payroll', 'job', 'work income', 'tankhwa'],
  freelance: ['freelance', 'client', 'project', 'gig', 'contract', 'consulting', 'fiverr', 'upwork'],
  bonus: ['bonus', 'incentive', 'commission', 'reward', 'performance'],
  investment: ['dividend', 'interest', 'return', 'profit', 'gain', 'stock', 'crypto', 'bitcoin'],
  rental: ['rental income', 'tenant payment', 'lease income', 'property income'],
  dividends: ['dividend', 'stock dividend', 'share income'],
  refund: ['refund', 'return', 'cashback', 'reimburse', 'reimbursement'],
  other_income: ['income', 'received', 'earned', 'payment received'],
};

// Location-based category mappings
const locationCategoryMap: Record<string, string> = {
  // Restaurants & Food
  'restaurant': 'restaurant',
  'cafe': 'coffee',
  'coffee shop': 'coffee',
  'bakery': 'food',
  'fast food': 'food',
  'bar': 'entertainment',
  'pub': 'entertainment',
  
  // Shopping
  'supermarket': 'groceries',
  'grocery store': 'groceries',
  'shopping mall': 'shopping',
  'department store': 'shopping',
  'clothing store': 'clothing',
  'electronics store': 'electronics',
  'book store': 'books',
  
  // Transport
  'gas station': 'fuel',
  'petrol station': 'fuel',
  'parking': 'parking',
  'bus station': 'transport',
  'train station': 'transport',
  'airport': 'travel',
  
  // Health
  'hospital': 'medical',
  'pharmacy': 'health',
  'doctor': 'medical',
  'dentist': 'medical',
  'gym': 'gym',
  'spa': 'beauty',
  
  // Entertainment
  'movie theater': 'movies',
  'cinema': 'movies',
  'museum': 'entertainment',
  'park': 'entertainment',
  
  // Services
  'bank': 'misc',
  'atm': 'misc',
  'laundry': 'laundry',
  'salon': 'beauty',
  'school': 'education',
  'university': 'education',
};

interface SmartSuggestion {
  categoryId: string | null;
  suggestedAmount: number | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface LocationSuggestion {
  categoryId: string | null;
  placeName: string | null;
  placeType: string | null;
}

export const useSmartSuggestions = () => {
  const { expenses, incomes, categories } = useExpense();

  // Get all transactions combined
  const allTransactions = useMemo(() => {
    const expenseList = expenses.map(e => ({ ...e, type: 'expense' as const }));
    const incomeList = incomes.map(i => ({ ...i, type: 'income' as const }));
    return [...expenseList, ...incomeList];
  }, [expenses, incomes]);

  // Suggest category based on description/merchant
  const suggestCategory = useCallback((description: string, type: 'expense' | 'income' = 'expense'): string | null => {
    if (!description || description.trim().length < 2) return null;
    
    const lowerDesc = description.toLowerCase().trim();
    
    // Find matching category by keywords
    for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          // Verify this category exists
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            // Check if it matches the transaction type
            const isExpenseCategory = category.budget > 0;
            const isIncomeCategory = category.budget === 0;
            
            if ((type === 'expense' && isExpenseCategory) || (type === 'income' && isIncomeCategory)) {
              return categoryId;
            }
          }
        }
      }
    }
    
    return null;
  }, [categories]);

  // Suggest amount based on past transactions for similar merchant/description
  const suggestAmount = useCallback((description: string): number | null => {
    if (!description || description.trim().length < 3) return null;
    
    const lowerDesc = description.toLowerCase().trim();
    
    // Find past transactions with similar descriptions
    const similarTransactions = allTransactions.filter(t => {
      const txDesc = t.description?.toLowerCase() || '';
      // Match if description contains the search term or vice versa
      return txDesc.includes(lowerDesc) || lowerDesc.includes(txDesc);
    });

    if (similarTransactions.length === 0) return null;

    // Calculate average amount from similar transactions
    const amounts = similarTransactions.map(t => t.amount);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    
    // Round to 2 decimal places
    return Math.round(avgAmount * 100) / 100;
  }, [allTransactions]);

  // Get frequently used amounts for a category
  const getFrequentAmounts = useCallback((categoryId: string): number[] => {
    const categoryTransactions = allTransactions.filter(t => t.categoryId === categoryId);
    
    if (categoryTransactions.length === 0) return [];

    // Count occurrences of each amount
    const amountCounts: Record<number, number> = {};
    categoryTransactions.forEach(t => {
      const roundedAmount = Math.round(t.amount);
      amountCounts[roundedAmount] = (amountCounts[roundedAmount] || 0) + 1;
    });

    // Sort by frequency and return top 5
    return Object.entries(amountCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([amount]) => parseInt(amount));
  }, [allTransactions]);

  // Get full smart suggestion
  const getSmartSuggestion = useCallback((description: string, type: 'expense' | 'income' = 'expense'): SmartSuggestion => {
    const categoryId = suggestCategory(description, type);
    const suggestedAmount = suggestAmount(description);
    
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reason = '';

    if (categoryId && suggestedAmount) {
      confidence = 'high';
      reason = 'Based on your past spending patterns';
    } else if (categoryId) {
      confidence = 'medium';
      reason = 'Category suggested based on keywords';
    } else if (suggestedAmount) {
      confidence = 'medium';
      reason = 'Amount based on similar transactions';
    } else {
      reason = 'No suggestions available';
    }

    return { categoryId, suggestedAmount, confidence, reason };
  }, [suggestCategory, suggestAmount]);

  // Location-based suggestion
  const suggestFromLocation = useCallback(async (): Promise<LocationSuggestion> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ categoryId: null, placeName: null, placeType: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get place info
            const { latitude, longitude } = position.coords;
            
            // Use Nominatim (OpenStreetMap) for reverse geocoding (free, no API key needed)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'User-Agent': 'Jarify Expense Tracker' } }
            );
            
            if (!response.ok) {
              resolve({ categoryId: null, placeName: null, placeType: null });
              return;
            }

            const data = await response.json();
            const placeType = data.type || data.class || null;
            const placeName = data.name || data.display_name?.split(',')[0] || null;
            
            // Find matching category based on place type
            let categoryId: string | null = null;
            if (placeType) {
              for (const [locationType, catId] of Object.entries(locationCategoryMap)) {
                if (placeType.toLowerCase().includes(locationType) || 
                    (placeName && placeName.toLowerCase().includes(locationType))) {
                  categoryId = catId;
                  break;
                }
              }
            }

            resolve({ categoryId, placeName, placeType });
          } catch (error) {
            console.error('Location suggestion error:', error);
            resolve({ categoryId: null, placeName: null, placeType: null });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve({ categoryId: null, placeName: null, placeType: null });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // Parse voice input to extract transaction details
  const parseVoiceInput = useCallback((transcript: string): { 
    amount: number | null; 
    description: string; 
    categoryId: string | null;
    type: 'expense' | 'income';
  } => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Determine if it's income or expense
    let type: 'expense' | 'income' = 'expense';
    if (lowerTranscript.includes('received') || 
        lowerTranscript.includes('earned') || 
        lowerTranscript.includes('income') ||
        lowerTranscript.includes('salary') ||
        lowerTranscript.includes('got paid')) {
      type = 'income';
    }

    // Extract amount - look for numbers
    const amountMatch = transcript.match(/(\d+(?:[.,]\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

    // Extract description - remove amount and common words
    let description = transcript
      .replace(/(\d+(?:[.,]\d{1,2})?)/g, '')
      .replace(/spent|paid|bought|purchased|received|earned|got|for|on|at|the|a|an|rupees|rs|dollars|pkr|usd/gi, '')
      .trim();

    // Get category suggestion
    const categoryId = suggestCategory(description || transcript, type);

    return { amount, description, categoryId, type };
  }, [suggestCategory]);

  return {
    suggestCategory,
    suggestAmount,
    getFrequentAmounts,
    getSmartSuggestion,
    suggestFromLocation,
    parseVoiceInput,
  };
};

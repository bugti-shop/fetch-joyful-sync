import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Upload, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpense, ExpenseCategory } from '@/contexts/ExpenseContext';
import { useToast } from '@/hooks/use-toast';

const categoryIcons = [
  '🍔', '🍕', '🍜', '☕', '🥗', // Food
  '🚗', '🚌', '✈️', '🚲', '⛽', // Transport
  '🏠', '🏢', '🏨', '🏪', '🔧', // Home
  '💡', '💧', '📱', '📺', '🌐', // Utilities
  '🛒', '👕', '👟', '💄', '🎁', // Shopping
  '🎬', '🎮', '🎵', '📚', '🎨', // Entertainment
  '💊', '🏥', '🏋️', '🧘', '💉', // Health
  '📖', '🎓', '✏️', '💻', '🧪', // Education
  '📱', '🔔', '☁️', '🎧', '📺', // Subscriptions
  '📦', '🎯', '⭐', '💰', '🏷️', // Misc
  // Extended emojis
  '🏃', '🎭', '🎪', '🎢', '🎡', // Activities
  '🍺', '🍷', '🍸', '🧃', '🥤', // Drinks
  '🐱', '🐶', '🐠', '🐦', '🐰', // Pets
  '💅', '💇', '🧴', '🧼', '🧽', // Personal care
  '🔌', '🖥️', '📷', '🖨️', '🔋', // Electronics
  '🏦', '💳', '🏧', '💹', '📊', // Finance
];

const categoryColors = [
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(210, 85%, 55%)',  // Blue
  'hsl(280, 70%, 50%)',  // Purple
  'hsl(45, 90%, 50%)',   // Yellow
  'hsl(340, 80%, 55%)',  // Pink
  'hsl(160, 70%, 45%)',  // Teal
  'hsl(0, 85%, 55%)',    // Red
  'hsl(190, 80%, 45%)',  // Cyan
  'hsl(260, 75%, 60%)',  // Violet
  'hsl(120, 60%, 45%)',  // Green
];

interface CustomCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomCategoryManager = ({ isOpen, onClose }: CustomCategoryManagerProps) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useExpense();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📦',
    color: categoryColors[0],
    budget: '',
    customIcon: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast({ title: 'Error', description: 'Image must be under 500KB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (isEdit && editingCategory) {
        setEditingCategory(prev => prev ? { ...prev, customIcon: base64 } : null);
      } else {
        setNewCategory(prev => ({ ...prev, customIcon: base64, icon: '' }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCustomIcon = (isEdit: boolean = false) => {
    if (isEdit && editingCategory) {
      setEditingCategory(prev => prev ? { ...prev, customIcon: undefined } : null);
    } else {
      setNewCategory(prev => ({ ...prev, customIcon: '', icon: '📦' }));
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    addCategory({
      name: newCategory.name,
      icon: newCategory.customIcon ? '' : newCategory.icon,
      color: newCategory.color,
      budget: parseFloat(newCategory.budget) || 0,
      customIcon: newCategory.customIcon || undefined,
    });
    
    setNewCategory({ name: '', icon: '📦', color: categoryColors[0], budget: '', customIcon: '' });
    setShowAddModal(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    
    updateCategory(editingCategory.id, editingCategory);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Category Button */}
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full"
            variant="outline"
          >
            <Plus size={18} className="mr-2" />
            Add Custom Category
          </Button>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                {category.customIcon ? (
                    <img 
                      src={category.customIcon} 
                      alt={category.name}
                      className="w-10 h-10 rounded-lg object-cover"
                      style={{ backgroundColor: `${category.color}20` }}
                    />
                  ) : (
                    <span 
                      className="text-2xl p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Budget: ${category.budget.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Edit2 size={16} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add Category Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Add Category</h3>
                  <button onClick={() => setShowAddModal(false)}>
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Category Name</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Groceries"
                    />
                  </div>

                  <div>
                    <Label>Budget Amount</Label>
                    <Input
                      type="number"
                      value={newCategory.budget}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Icon</Label>
                    <Tabs defaultValue="emoji" className="mt-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="emoji">Emoji</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                      <TabsContent value="emoji" className="mt-2">
                        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                          {categoryIcons.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setNewCategory(prev => ({ ...prev, icon, customIcon: '' }))}
                              className={`p-2 rounded-lg text-xl transition-all ${
                                newCategory.icon === icon && !newCategory.customIcon
                                  ? 'bg-primary/20 ring-2 ring-primary'
                                  : 'hover:bg-secondary'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="custom" className="mt-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleImageUpload(e, false)}
                          accept="image/*"
                          className="hidden"
                        />
                        {newCategory.customIcon ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={newCategory.customIcon} 
                              alt="Custom icon" 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeCustomIcon(false)}
                            >
                              <X size={16} className="mr-1" /> Remove
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={16} className="mr-2" />
                            Upload Custom Icon
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Max 500KB, square recommended</p>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <Label>Color</Label>
                    <div className="grid grid-cols-10 gap-2 mt-2">
                      {categoryColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full transition-all ${
                            newCategory.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleAddCategory} className="w-full">
                    <Check size={18} className="mr-2" />
                    Add Category
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Category Modal */}
        <AnimatePresence>
          {editingCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingCategory(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Edit Category</h3>
                  <button onClick={() => setEditingCategory(null)}>
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Category Name</Label>
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>

                  <div>
                    <Label>Budget Amount</Label>
                    <Input
                      type="number"
                      value={editingCategory.budget}
                      onChange={(e) => setEditingCategory(prev => prev ? { ...prev, budget: parseFloat(e.target.value) || 0 } : null)}
                    />
                  </div>

                  <div>
                    <Label>Icon</Label>
                    <Tabs defaultValue={editingCategory.customIcon ? "custom" : "emoji"} className="mt-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="emoji">Emoji</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                      <TabsContent value="emoji" className="mt-2">
                        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                          {categoryIcons.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setEditingCategory(prev => prev ? { ...prev, icon, customIcon: undefined } : null)}
                              className={`p-2 rounded-lg text-xl transition-all ${
                                editingCategory.icon === icon && !editingCategory.customIcon
                                  ? 'bg-primary/20 ring-2 ring-primary'
                                  : 'hover:bg-secondary'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="custom" className="mt-2">
                        <input
                          type="file"
                          ref={editFileInputRef}
                          onChange={(e) => handleImageUpload(e, true)}
                          accept="image/*"
                          className="hidden"
                        />
                        {editingCategory.customIcon ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={editingCategory.customIcon} 
                              alt="Custom icon" 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeCustomIcon(true)}
                            >
                              <X size={16} className="mr-1" /> Remove
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => editFileInputRef.current?.click()}
                          >
                            <Upload size={16} className="mr-2" />
                            Upload Custom Icon
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Max 500KB, square recommended</p>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <Label>Color</Label>
                    <div className="grid grid-cols-10 gap-2 mt-2">
                      {categoryColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditingCategory(prev => prev ? { ...prev, color } : null)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            editingCategory.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleUpdateCategory} className="w-full">
                    <Check size={18} className="mr-2" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

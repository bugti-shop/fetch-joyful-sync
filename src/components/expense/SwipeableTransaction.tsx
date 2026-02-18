import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SwipeableTransactionProps {
  children: React.ReactNode;
  onDelete: () => void;
  id: string;
}

export const SwipeableTransaction = ({ children, onDelete, id }: SwipeableTransactionProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    if (diff < 0) {
      setCurrentX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentX < -80) {
      setIsDeleting(true);
      onDelete();
    }
    setCurrentX(0);
  };

  if (isDeleting) return null;

  const bgOpacity = Math.min(Math.abs(currentX) / 100, 1);
  const deleteOpacity = currentX < -50 ? 1 : 0;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end pr-4 rounded-xl"
        style={{ opacity: bgOpacity }}
      >
        <div
          style={{ opacity: deleteOpacity }}
          className="flex flex-col items-center gap-1"
        >
          <Trash2 size={20} className="text-white" />
          <span className="text-[10px] text-white font-medium">Delete</span>
        </div>
      </div>

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${currentX}px)` }}
        className="bg-card rounded-xl relative z-10"
      >
        {children}
      </div>
    </div>
  );
};
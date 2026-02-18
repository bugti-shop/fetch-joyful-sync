import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Pin } from 'lucide-react';
import JarVisualization from './JarVisualization';
import CircularJarVisualization from './CircularJarVisualization';
import { formatCurrency } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';

interface Jar {
  id: number;
  name: string;
  target: number;
  saved: number;
  streak: number;
  withdrawn: number;
  notes?: any[];
  records?: any[];
  currency?: string;
  categoryId?: number;
  targetDate?: string;
  createdAt?: string;
  jarType?: 'flask' | 'circular';
  imageUrl?: string;
  purposeType?: 'saving' | 'debt';
  isPinned?: boolean;
  order?: number;
}

interface SortableJarCardProps {
  jar: Jar;
  progress: number;
  darkMode: boolean;
  textColor: string;
  textSecondary: string;
  cardBg: string;
  onSelect: (jar: Jar) => void;
  onDelete: (jar: Jar) => void;
  onPin?: (jarId: number) => void;
}

export const SortableJarCard = ({
  jar,
  progress,
  darkMode,
  textColor,
  textSecondary,
  cardBg,
  onSelect,
  onDelete,
  onPin,
}: SortableJarCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: jar.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${cardBg} rounded-2xl p-3 sm:p-4 shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 relative group min-w-[200px] max-w-[200px] flex-shrink-0`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 rounded bg-gray-200/80 dark:bg-gray-700/80"
      >
        <GripVertical size={16} className="text-gray-600 dark:text-gray-300" />
      </div>

      {/* Pin Button */}
      {onPin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.light();
            onPin(jar.id);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-opacity z-10 ${
            jar.isPinned 
              ? 'bg-yellow-500 text-white opacity-100' 
              : 'bg-gray-500/80 text-white opacity-0 group-hover:opacity-100'
          } hover:bg-yellow-600`}
        >
          <Pin size={14} />
        </button>
      )}

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          hapticFeedback.medium();
          onDelete(jar);
        }}
        className="absolute top-2 right-10 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
      >
        <Trash2 size={14} />
      </button>

      {/* Card Content */}
      <div onClick={() => {
        hapticFeedback.light();
        onSelect(jar);
      }}>
        <h4 className={`text-sm sm:text-base font-bold ${textColor} mb-2`}>{jar.name}</h4>
        <div className="relative h-24 sm:h-32 mb-2 flex items-center justify-center">
          {jar.jarType === 'circular' ? (
            <CircularJarVisualization 
              progress={progress} 
              jarId={jar.id} 
              isLarge={false} 
              imageUrl={jar.imageUrl}
              isDebtJar={jar.purposeType === 'debt'}
            />
          ) : (
            <JarVisualization 
              progress={progress} 
              jarId={jar.id} 
              isLarge={false}
              isDebtJar={jar.purposeType === 'debt'}
            />
          )}
        </div>
        <div className="text-center mb-2">
          <div
            className={`text-base sm:text-lg font-bold ${(() => {
              // For debt jars, red for high debt, green for low
              if (jar.purposeType === 'debt') {
                return progress >= 75 ? 'text-red-600' : progress >= 50 ? 'text-orange-600' : progress >= 25 ? 'text-blue-600' : 'text-green-600';
              }
              // For saving jars, green for high savings, red for low
              return progress >= 75 ? 'text-green-600' : progress >= 50 ? 'text-blue-600' : progress >= 25 ? 'text-orange-600' : 'text-red-600';
            })()}`}
          >
            {progress}%
          </div>
        </div>
        <div className={`flex justify-between items-center text-xs`}>
          <span className={jar.purposeType === 'debt' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
            {jar.currency || '$'}{formatCurrency(jar.saved)}
          </span>
          <span className={jar.purposeType === 'debt' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            -{jar.currency || '$'}{formatCurrency(Math.abs(jar.saved - jar.target))}
          </span>
          <span className={textSecondary}>{jar.currency || '$'}{formatCurrency(jar.target)}</span>
        </div>
      </div>
    </div>
  );
};
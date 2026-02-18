import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface ReceiptViewerProps {
  receiptUrl: string;
  isOpen: boolean;
  onClose: () => void;
  description?: string;
}

export const ReceiptViewer = ({ receiptUrl, isOpen, onClose, description }: ReceiptViewerProps) => {
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = `receipt-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-white font-semibold">Receipt</h2>
              {description && (
                <p className="text-white/70 text-sm">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image Container */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <motion.img
              src={receiptUrl}
              alt="Receipt"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ transform: `scale(${zoom})` }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: zoom, opacity: 1 }}
              transition={{ duration: 0.2 }}
              draggable={false}
            />
          </div>

          {/* Controls */}
          <div 
            className="flex items-center justify-center gap-4 p-4 bg-black/50"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleZoomOut}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors ml-4"
            >
              <Download size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

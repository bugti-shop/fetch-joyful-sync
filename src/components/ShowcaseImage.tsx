import React from 'react';
import { motion } from 'framer-motion';

interface ShowcaseImageProps {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

export default function ShowcaseImage({ src, alt, title, subtitle }: ShowcaseImageProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mt-6 text-center flex flex-col items-center"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 text-sm mb-4 max-w-xs">{subtitle}</p>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-white rounded-2xl px-0 py-2 shadow-lg border border-gray-100"
      >
        <img 
          src={src} 
          alt={alt} 
          loading="eager" 
          decoding="async" 
          fetchPriority="high" 
          className="w-full max-w-[26rem] h-auto max-h-[26rem] object-contain rounded-xl" 
        />
      </motion.div>
    </motion.section>
  );
}

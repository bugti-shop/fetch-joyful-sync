interface JarVisualizationProps {
  progress: number;
  jarId: number;
  isLarge?: boolean;
  isDebtJar?: boolean;
}

const JarVisualization = ({ progress, jarId, isLarge = false, isDebtJar = false }: JarVisualizationProps) => {
  const viewBox = isLarge ? "0 0 280 340" : "0 0 280 300";
  const baseY = isLarge ? 320 : 280;
  const totalHeight = isLarge ? 275 : 235;
  const segment = totalHeight / 4;
  
  const redH = Math.min(progress, 25) / 25 * segment;
  const orangeH = Math.min(Math.max(progress - 25, 0), 25) / 25 * segment;
  const blueH = Math.min(Math.max(progress - 50, 0), 25) / 25 * segment;
  const greenH = Math.min(Math.max(progress - 75, 0), 25) / 25 * segment;

  const flaskPath = isLarge 
    ? "M 90 35 L 90 70 L 50 220 Q 45 250 45 270 Q 45 300 70 320 Q 95 332 140 332 Q 185 332 210 320 Q 235 300 235 270 Q 235 250 230 220 L 190 70 L 190 35 Q 190 28 185 28 L 95 28 Q 90 28 90 35 Z"
    : "M 90 30 L 90 60 L 50 200 Q 45 225 45 240 Q 45 265 70 280 Q 95 290 140 290 Q 185 290 210 280 Q 235 265 235 240 Q 235 225 230 200 L 190 60 L 190 30 Q 190 25 185 25 L 95 25 Q 90 25 90 30 Z";

  // For debt jars, show red at top (high debt) and green at bottom (paid off)
  // Since we paint from bottom to top, reverse the order
  const firstGradient = isDebtJar ? `g${jarId}` : `r${jarId}`;   // bottom segment
  const secondGradient = isDebtJar ? `b${jarId}` : `o${jarId}`;
  const thirdGradient = isDebtJar ? `o${jarId}` : `b${jarId}`;
  const fourthGradient = isDebtJar ? `r${jarId}` : `g${jarId}`;  // top segment

  return (
    <svg viewBox={viewBox} className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id={`r${jarId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`o${jarId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`b${jarId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`g${jarId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id={`c${jarId}`}>
          <path d={flaskPath} />
        </clipPath>
      </defs>
      
      <ellipse cx="140" cy={isLarge ? 335 : 295} rx="95" ry="10" fill="#000" opacity="0.15"/>
      
      <path d={flaskPath} fill="rgba(255, 255, 255, 0.4)" stroke="#a0aec0" strokeWidth="3"/>
      
      <g clipPath={`url(#c${jarId})`}>
        {redH > 0 && (
          <path d={`M 47 ${baseY} Q 47 ${baseY - 5} 51 ${baseY - 12} L 90 ${baseY - redH + 40} L 90 ${baseY - redH} Q 90 ${baseY - redH - 2} 93 ${baseY - redH - 3} L 187 ${baseY - redH - 3} Q 190 ${baseY - redH - 2} 190 ${baseY - redH} L 190 ${baseY - redH + 40} L 229 ${baseY - 12} Q 233 ${baseY - 5} 233 ${baseY} Q 233 ${baseY + 4} 210 ${baseY + 7} Q 185 ${baseY + 8} 140 ${baseY + 8} Q 95 ${baseY + 8} 70 ${baseY + 7} Q 47 ${baseY + 4} 47 ${baseY} Z`} fill={`url(#${firstGradient})`} />
        )}
        {orangeH > 0 && (
          <path d={`M 47 ${baseY - redH} L 90 ${baseY - redH - orangeH + 40} L 90 ${baseY - redH - orangeH} Q 90 ${baseY - redH - orangeH - 2} 93 ${baseY - redH - orangeH - 3} L 187 ${baseY - redH - orangeH - 3} Q 190 ${baseY - redH - orangeH - 2} 190 ${baseY - redH - orangeH} L 190 ${baseY - redH - orangeH + 40} L 233 ${baseY - redH} L 190 ${baseY - redH + 40} L 190 ${baseY - redH} L 90 ${baseY - redH} L 90 ${baseY - redH + 40} Z`} fill={`url(#${secondGradient})`} />
        )}
        {blueH > 0 && (
          <path d={`M 47 ${baseY - redH - orangeH} L 90 ${baseY - redH - orangeH - blueH + 40} L 90 ${baseY - redH - orangeH - blueH} Q 90 ${baseY - redH - orangeH - blueH - 2} 93 ${baseY - redH - orangeH - blueH - 3} L 187 ${baseY - redH - orangeH - blueH - 3} Q 190 ${baseY - redH - orangeH - blueH - 2} 190 ${baseY - redH - orangeH - blueH} L 190 ${baseY - redH - orangeH - blueH + 40} L 233 ${baseY - redH - orangeH} L 190 ${baseY - redH - orangeH + 40} L 190 ${baseY - redH - orangeH} L 90 ${baseY - redH - orangeH} L 90 ${baseY - redH - orangeH + 40} Z`} fill={`url(#${thirdGradient})`} />
        )}
        {greenH > 0 && (
          <path d={`M 47 ${baseY - redH - orangeH - blueH} L 90 ${baseY - redH - orangeH - blueH - greenH + 40} L 90 ${baseY - redH - orangeH - blueH - greenH} Q 90 ${baseY - redH - orangeH - blueH - greenH - 2} 93 ${baseY - redH - orangeH - blueH - greenH - 3} L 187 ${baseY - redH - orangeH - blueH - greenH - 3} Q 190 ${baseY - redH - orangeH - blueH - greenH - 2} 190 ${baseY - redH - orangeH - blueH - greenH} L 190 ${baseY - redH - orangeH - blueH - greenH + 40} L 233 ${baseY - redH - orangeH - blueH} L 190 ${baseY - redH - orangeH - blueH + 40} L 190 ${baseY - redH - orangeH - blueH} L 90 ${baseY - redH - orangeH - blueH} L 90 ${baseY - redH - orangeH - blueH + 40} Z`} fill={`url(#${fourthGradient})`} />
        )}
      </g>
      
      <path d="M 92 60 L 52 195 Q 48 218 48 233" stroke="#fff" strokeWidth="3" fill="none" opacity="0.25"/>
      
      <ellipse cx="140" cy={isLarge ? 28 : 25} rx="50" ry="8" fill="#cbd5e0" stroke="#a0aec0" strokeWidth="2"/>
      <ellipse cx="140" cy={isLarge ? 26 : 23} rx="48" ry="6" fill="#e2e8f0" opacity="0.7"/>
      <ellipse cx="140" cy={isLarge ? 26 : 23} rx="42" ry="4" fill="#fff" opacity="0.5"/>
    </svg>
  );
};

export default JarVisualization;

import React from 'react';
import './ChessLoader.css';

// SVG Path definitions traced from the Aditya Sports King Chess Piece
const PATHS = {
  outer: "M 72 142 L 47 142 L 47 141 L 46 141 L 46 135 L 47 135 L 47 133 L 49 132 L 49 124 L 50 124 L 50 122 L 51 122 L 52 120 L 54 120 L 54 115 L 55 115 L 56 113 L 58 113 L 58 111 L 59 111 L 59 108 L 60 108 L 60 106 L 61 106 L 61 103 L 62 103 L 63 95 L 64 95 L 65 79 L 64 79 L 64 78 L 58 78 L 58 77 L 57 77 L 57 75 L 56 75 L 56 72 L 57 72 L 57 70 L 59 69 L 59 65 L 61 64 L 61 59 L 60 59 L 60 57 L 59 57 L 59 55 L 58 55 L 58 53 L 57 53 L 57 51 L 56 51 L 56 49 L 55 49 L 55 43 L 56 43 L 56 41 L 57 41 L 57 40 L 60 40 L 60 39 L 64 39 L 64 38 L 65 38 L 65 35 L 66 35 L 66 34 L 67 34 L 68 32 L 69 32 L 69 29 L 63 29 L 63 28 L 61 27 L 61 18 L 62 18 L 62 16 L 64 16 L 64 15 L 69 15 L 69 8 L 70 8 L 70 7 L 80 7 L 80 8 L 81 8 L 81 15 L 86 15 L 86 16 L 88 16 L 88 17 L 89 17 L 89 27 L 88 27 L 87 29 L 81 29 L 81 32 L 83 32 L 83 33 L 84 33 L 84 35 L 85 35 L 86 39 L 91 39 L 91 40 L 92 40 L 92 41 L 94 41 L 94 43 L 95 43 L 95 49 L 94 49 L 94 51 L 93 51 L 93 53 L 92 53 L 92 55 L 91 55 L 91 57 L 90 57 L 90 60 L 89 60 L 89 64 L 91 65 L 91 69 L 92 69 L 92 70 L 94 71 L 94 76 L 93 76 L 92 78 L 86 78 L 86 79 L 85 79 L 85 87 L 86 87 L 86 94 L 87 94 L 87 99 L 88 99 L 88 102 L 89 102 L 90 108 L 91 108 L 92 112 L 93 112 L 93 113 L 94 113 L 95 115 L 96 115 L 96 120 L 98 120 L 98 121 L 99 121 L 99 123 L 101 124 L 101 132 L 102 132 L 102 133 L 103 133 L 103 135 L 104 135 L 104 141 L 103 141 L 103 142 Z",
  crown: "M 71 28 L 71 26 L 64 26 L 64 18 L 71 18 L 71 11 L 72 11 L 72 10 L 79 10 L 79 18 L 86 18 L 86 26 L 79 26 L 79 34 L 83 36 L 83 42 L 90 42 L 90 43 L 92 43 L 92 45 L 93 45 L 93 47 L 92 47 L 92 49 L 91 49 L 91 51 L 90 51 L 90 53 L 89 53 L 89 56 L 88 56 L 88 58 L 87 58 L 87 62 L 86 62 L 86 64 L 64 64 L 63 58 L 62 58 L 62 55 L 61 55 L 61 53 L 60 53 L 60 51 L 59 51 L 59 49 L 58 49 L 58 47 L 57 47 L 57 45 L 58 45 L 58 43 L 60 43 L 60 42 L 67 42 L 67 37 L 68 37 L 68 35 L 70 35 L 70 34 L 71 34 Z",
  collar: "M 88 68 L 88 69 L 87 69 L 87 71 L 90 71 L 90 72 L 92 73 L 91 75 L 59 75 L 59 74 L 58 74 L 58 73 L 59 73 L 60 71 L 63 71 L 63 69 L 62 69 L 62 66 L 88 66 L 88 67 L 89 67 L 89 68 Z",
  base: "M 67 85 L 67 78 L 83 78 L 83 91 L 84 91 L 84 97 L 85 97 L 85 101 L 86 101 L 86 104 L 87 104 L 87 107 L 88 107 L 88 110 L 89 110 L 90 114 L 91 114 L 91 115 L 93 116 L 93 121 L 94 121 L 94 122 L 96 122 L 96 123 L 98 124 L 98 126 L 99 126 L 99 129 L 98 129 L 98 131 L 97 131 L 97 134 L 100 134 L 100 135 L 101 135 L 101 139 L 49 139 L 49 135 L 50 135 L 50 134 L 53 134 L 53 131 L 52 131 L 52 129 L 51 129 L 51 126 L 52 126 L 52 124 L 53 124 L 54 122 L 56 122 L 56 121 L 57 121 L 57 116 L 58 116 L 58 115 L 60 114 L 60 112 L 61 112 L 61 110 L 62 110 L 63 104 L 64 104 L 64 101 L 65 101 L 65 97 L 66 97 Z"
};

// Compound frame path (outer boundary + cutout inner chambers using evenodd fill rule)
const FRAME_PATH = `${PATHS.outer} ${PATHS.crown} ${PATHS.collar} ${PATHS.base}`;

/**
 * ChessLoader - Custom Aditya University Sports King Loader
 *
 * @param {string|number} size - 'sm' (48px), 'md' (80px), 'lg' (120px), 'xl' (160px) or pixel number
 * @param {string} variant - 'morph' (Black & White Flip), 'liquid' (Rising Fill Wave), 'stagger' (Piece Lightup)
 * @param {string} text - Optional loading caption
 * @param {boolean} fullScreen - Render centered overlay with backdrop blur
 * @param {string} className - Additional CSS class
 */
export default function ChessLoader({
  size = 'md',
  variant = 'morph',
  text = 'Loading...',
  fullScreen = false,
  className = ''
}) {
  const sizeMap = {
    sm: 48,
    md: 80,
    lg: 120,
    xl: 160
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 80;
  const uniqueId = React.useId().replace(/:/g, '');

  const content = (
    <div
      className={`aditya-chess-loader-container ${variant} ${className}`}
      style={{ '--loader-size': `${pixelSize}px` }}
      role="status"
      aria-label={text || 'Loading'}
    >
      <div className="chess-svg-wrapper">
        <svg
          viewBox="40 5 70 140"
          className="chess-king-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Aditya University Colors Gradient for Outline */}
            <linearGradient id={`adityaGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d06c38" className="aditya-stop-1" />
              <stop offset="35%" stopColor="#BE9337" className="aditya-stop-2" />
              <stop offset="70%" stopColor="#0b5299" className="aditya-stop-3" />
              <stop offset="100%" stopColor="#0D233B" className="aditya-stop-4" />
            </linearGradient>

            {/* Glowing Accent Filter */}
            <filter id={`adityaGlow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#d06c38" floodOpacity="0.45" />
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#0b5299" floodOpacity="0.3" />
            </filter>

            {/* Liquid Fill Clip Path */}
            <clipPath id={`fillClip_${uniqueId}`}>
              <rect className="liquid-level-rect" x="30" y="5" width="90" height="140" />
            </clipPath>

            {/* Diagonal Shimmer Gradient */}
            <linearGradient id={`shimmerGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" stopOpacity="0" />
              <stop offset="40%" stopColor="#BE9337" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#d06c38" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Underlay Shadow / Pedestal Aura */}
          <ellipse cx="75" cy="144" rx="26" ry="3" className="chess-pedestal-shadow" />

          {/* INTERIOR CHAMBERS: Cross & Crown, Collar, Base */}
          <g className="chess-interior-group">
            <path
              d={PATHS.crown}
              className="chess-chamber chess-chamber-crown"
            />
            <path
              d={PATHS.collar}
              className="chess-chamber chess-chamber-collar"
            />
            <path
              d={PATHS.base}
              className="chess-chamber chess-chamber-base"
            />
          </g>

          {/* LIQUID WAVE OVERLAY (used in liquid variant) */}
          {variant === 'liquid' && (
            <g clipPath={`url(#fillClip_${uniqueId})`} className="chess-liquid-overlay">
              <path d={PATHS.crown} className="chess-liquid-fill" />
              <path d={PATHS.collar} className="chess-liquid-fill" />
              <path d={PATHS.base} className="chess-liquid-fill" />
            </g>
          )}

          {/* SHIMMER LIGHT SWEEP */}
          <g className="chess-shimmer-group">
            <path
              d={PATHS.outer}
              fill={`url(#shimmerGrad_${uniqueId})`}
              className="chess-shimmer-sweep"
            />
          </g>

          {/* ADITYA UNIVERSITY ANIMATED OUTLINE FRAME (Replaces the black lines) */}
          <path
            d={FRAME_PATH}
            fillRule="evenodd"
            fill={`url(#adityaGrad_${uniqueId})`}
            filter={`url(#adityaGlow_${uniqueId})`}
            className="chess-aditya-frame"
          />

          {/* ACCENT CONTOUR HIGHLIGHT LINE */}
          <path
            d={PATHS.outer}
            fill="none"
            stroke="url(#adityaGrad_accent)"
            strokeWidth="0.75"
            strokeDasharray="14 10"
            className="chess-contour-tracer"
          />
        </svg>
      </div>

      {/* Optional Animated Loading Label */}
      {text && (
        <div className="chess-loader-caption">
          <span className="caption-text">{text}</span>
          <span className="caption-dots">
            <span className="dot dot-1">.</span>
            <span className="dot dot-2">.</span>
            <span className="dot dot-3">.</span>
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return <div className="aditya-chess-loader-fullscreen-backdrop">{content}</div>;
  }

  return content;
}


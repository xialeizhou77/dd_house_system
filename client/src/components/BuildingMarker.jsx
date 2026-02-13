import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Get marker variant by remaining units
 * - plenty: >= 15 (翠绿玻璃)
 * - low: 1-14 (琥珀色)
 * - sold: 0 (灰色去饱和)
 */
function getMarkerVariant(remaining, total = 44) {
  if (remaining <= 0) return 'sold';
  const ratio = remaining / total;
  if (ratio >= 0.35) return 'plenty';  // ~15+ out of 44
  return 'low';
}

const variantStyles = {
  plenty: {
    dot: 'marker-dot--plenty',
    capsule: 'marker-capsule--plenty',
    tooltip: 'marker-tooltip--plenty',
    glass: 'rgba(52, 211, 153, 0.25)',
    border: 'rgba(52, 211, 153, 0.5)',
    glow: 'rgba(52, 211, 153, 0.4)',
  },
  low: {
    dot: 'marker-dot--low',
    capsule: 'marker-capsule--low',
    tooltip: 'marker-tooltip--low',
    glass: 'rgba(251, 191, 36, 0.25)',
    border: 'rgba(251, 191, 36, 0.5)',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  sold: {
    dot: 'marker-dot--sold',
    capsule: 'marker-capsule--sold',
    tooltip: 'marker-tooltip--sold',
    glass: 'rgba(148, 163, 184, 0.2)',
    border: 'rgba(148, 163, 184, 0.35)',
    glow: 'rgba(148, 163, 184, 0.2)',
  },
};

/**
 * HUD-style building marker for aerial map
 * Default: pulse dot or capsule with building number
 * Hover: expand to show details with elastic animation
 */
export function BuildingMarker({
  building,
  onClick,
  disabled = false,
  showStats = true,
  variant: forcedVariant,
}) {
  const [hovered, setHovered] = useState(false);
  const remaining = building.remaining ?? building.unselected ?? 44;
  const selected = building.selected ?? 0;
  const total = remaining + selected || 44;

  const variant = forcedVariant ?? getMarkerVariant(remaining, total);
  const styles = variantStyles[variant];

  const displayLabel = building.districtName === '西区'
    ? `西${building.label}`
    : `东${building.label}`;

  return (
    <motion.button
      type="button"
      className="building-marker"
      style={{
        left: building.left,
        top: building.top,
      }}
      onClick={() => !disabled && onClick?.(building)}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Pulse ring (default state) */}
      <motion.span
        className={`marker-dot ${styles.dot}`}
        animate={{
          scale: [1, 1.4, 1],
          opacity: variant === 'sold' ? [0.5, 0.5] : [0.6, 0.2, 0.6],
        }}
        transition={{
          duration: variant === 'sold' ? 0 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Core dot */}
      <span className={`marker-dot-core ${styles.dot}`} />
      {/* Capsule label - always visible */}
      <motion.span
        className={`marker-capsule ${styles.capsule}`}
        initial={false}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        {displayLabel}
      </motion.span>

      {/* Expanded tooltip on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className={`marker-tooltip ${styles.tooltip}`}
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: 'spring',
                stiffness: 400,
                damping: 25,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 2,
              transition: { duration: 0.15 },
            }}
          >
            <div className="marker-tooltip-header">
              {building.districtName}{building.buildingNum || building.label}号楼
            </div>
            {showStats && (
              <div className="marker-tooltip-stats">
                <span className="stat-remaining">剩余 {remaining} 套</span>
                <span className="stat-divider">·</span>
                <span className="stat-selected">已选 {selected} 套</span>
              </div>
            )}
            <div className="marker-tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Simplified pin for AnnotatePage (no stats, no click handler for selection)
 */
export function AnnotateMarker({ coord, variant = 'plenty' }) {
  const styles = variantStyles[variant];
  const displayLabel = coord.zone === 'West' ? `西${coord.label}` : `东${coord.label}`;

  return (
    <span
      className="building-marker building-marker--static"
      style={{ left: coord.left, top: coord.top }}
      title={coord.id}
    >
      <span className={`marker-dot-core ${styles.dot}`} />
      <span className={`marker-capsule ${styles.capsule}`}>{displayLabel}</span>
    </span>
  );
}

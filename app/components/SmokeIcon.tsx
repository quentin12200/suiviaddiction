import { useId } from 'react'

/**
 * Cigarette dessinée en SVG. `rainbow` : corps multicolore, utilisé pour les joints.
 */
export default function SmokeIcon({ rainbow = false, size = 64 }: { rainbow?: boolean; size?: number }) {
  const id = useId().replace(/:/g, '')
  const body = rainbow ? `url(#rainbow-${id})` : '#ffffff'
  return (
    <svg
      width={size}
      height={size / 4}
      viewBox="0 0 64 16"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {rainbow && (
        <defs>
          <linearGradient id={`rainbow-${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#e63946" />
            <stop offset="20%" stopColor="#f4a261" />
            <stop offset="40%" stopColor="#f6d84a" />
            <stop offset="60%" stopColor="#52b788" />
            <stop offset="80%" stopColor="#4895ef" />
            <stop offset="100%" stopColor="#8e5bd8" />
          </linearGradient>
        </defs>
      )}
      {/* Fumée */}
      <path
        d="M60 2 C62 -1, 58 -3, 61 -6"
        fill="none"
        stroke="var(--ink-faint, #8d9894)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Filtre */}
      <rect x="2" y="4" width="14" height="8" rx="1.5" fill="#d9a05b" />
      <circle cx="6" cy="7" r="0.8" fill="#b97f3d" />
      <circle cx="10" cy="9.5" r="0.8" fill="#b97f3d" />
      <circle cx="13" cy="6.5" r="0.8" fill="#b97f3d" />
      {/* Corps */}
      <rect x="16" y="4" width="40" height="8" fill={body} />
      {/* Braise */}
      <rect x="56" y="4" width="5" height="8" rx="1.5" fill="#c2412b" />
      <rect x="58.5" y="5.5" width="2" height="5" rx="1" fill="#f59e0b" />
      {/* Contour */}
      <rect x="2" y="4" width="59" height="8" rx="1.5" fill="none" stroke="var(--ink, #1e2a2c)" strokeWidth="1" />
    </svg>
  )
}

import React from 'react'

export type IconName = 
  | 'x' 
  | 'chevron-down' 
  | 'chevron-right'
  | 'coffee'
  | 'sun'
  | 'cloud-rain'
  | 'cloud-snow'
  | 'cloud-lightning'
  | 'cloud'
  | 'cloud-fog'

interface IconProps {
  name: IconName
  className?: string
  size?: number
  strokeWidth?: number
  ariaLabel?: string
  ariaHidden?: boolean
  style?: React.CSSProperties
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  className = '', 
  size = 20, 
  strokeWidth = 2,
  ariaLabel,
  ariaHidden = false,
  style
}) => {
  // Untitled UI style icon paths (24x24 viewBox)
  const iconPaths: Record<IconName, string> = {
    'x': 'M18 6L6 18M6 6l12 12',
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-right': 'M9 18l6-6-6-6',
    'coffee': 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
    'sun': 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    'cloud-rain': 'M19.5 12a4.5 4.5 0 0 0-1.905-3.546 3.75 3.75 0 0 0-4.977-4.977 4.5 4.5 0 0 0-8.618 0A3.75 3.75 0 0 0 2.25 8.454a4.5 4.5 0 0 0 0 7.046M15 15l-3 3m0 0l-3-3m3 3V9',
    'cloud-snow': 'M19.5 12a4.5 4.5 0 0 0-1.905-3.546 3.75 3.75 0 0 0-4.977-4.977 4.5 4.5 0 0 0-8.618 0A3.75 3.75 0 0 0 2.25 8.454a4.5 4.5 0 0 0 0 7.046M12 15v3m0 0v3m0-3h3m-3 0H9',
    'cloud-lightning': 'M19.5 12a4.5 4.5 0 0 0-1.905-3.546 3.75 3.75 0 0 0-4.977-4.977 4.5 4.5 0 0 0-8.618 0A3.75 3.75 0 0 0 2.25 8.454a4.5 4.5 0 0 0 0 7.046M13.5 10.5V12l3 3H10.5v-1.5l3-3h3z',
    'cloud': 'M19.5 12a4.5 4.5 0 0 0-1.905-3.546 3.75 3.75 0 0 0-4.977-4.977 4.5 4.5 0 0 0-8.618 0A3.75 3.75 0 0 0 2.25 8.454a4.5 4.5 0 0 0 0 7.046h15a4.5 4.5 0 0 0 0-9z',
    'cloud-fog': 'M19.5 12a4.5 4.5 0 0 0-1.905-3.546 3.75 3.75 0 0 0-4.977-4.977 4.5 4.5 0 0 0-8.618 0A3.75 3.75 0 0 0 2.25 8.454a4.5 4.5 0 0 0 0 7.046M4.5 18h15M4.5 21h15'
  }

  const path = iconPaths[name] || ''

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaHidden ? 'presentation' : 'img'}
      style={style}
    >
      <path d={path} />
    </svg>
  )
}

export default Icon


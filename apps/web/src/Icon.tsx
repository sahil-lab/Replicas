const paths = {
  alert:
    'M12 9v4M12 17h.01M10.3 4.2 2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  arrowDown: 'M12 4v16m-6.5-6.5L12 20l6.5-6.5',
  arrowUp: 'M12 20V4m-6.5 6.5L12 4l6.5 6.5',
  check: 'm5 12 4 4L19 6',
  copy: 'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1ZM16 5.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h.5',
  database:
    'M20 6c0 1.7-3.6 3-8 3S4 7.7 4 6s3.6-3 8-3 8 1.3 8 3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  gateway:
    'M5 13h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1ZM8 16h.01M12 16h.01M12 13V9.5M9.2 7.2a4 4 0 0 1 5.6 0M6.8 4.8a7.4 7.4 0 0 1 10.4 0',
  globe:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9s-1.2 6.5-3.5 9c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  layers: 'm12 3 9 4.5-9 4.5-9-4.5L12 3ZM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  lock: 'M7 11h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  minus: 'M7 12h10',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z',
  pause: 'M8.5 5v14M15.5 5v14',
  play: 'M8 5.5v13l10.5-6.5L8 5.5Z',
  pulse: 'M2.5 12h4l3-7.5 4.5 15 3-7.5h4.5',
  refresh:
    'M20 11a8 8 0 0 0-14.3-4.4L3.5 9M3.5 4v5h5M4 13a8 8 0 0 0 14.3 4.4l2.2-2.4M20.5 20v-5h-5',
  server:
    'M5 4h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM5 14h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1ZM8 7h.01M8 17h.01',
  shield:
    'm12 3 7.5 3v5.5c0 4.6-3.2 7.7-7.5 9.5-4.3-1.8-7.5-4.9-7.5-9.5V6L12 3Zm-3.2 9.2 2.3 2.3 4.3-4.6',
  sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  sun: 'M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}

// Bộ icon SVG dùng chung (stroke theo currentColor để dễ đổi màu)

const S = ({ children, size = 24, color = 'currentColor', sw = 2, fill = 'none', ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)

export const PulseIcon = (p) => <S {...p}><path d="M1 12h4l2-7 4 14 3-9 2 4h7" /></S>
export const RefreshIcon = (p) => <S {...p}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15" /></S>
export const ChevronRight = (p) => <S {...p}><path d="M9 18l6-6-6-6" /></S>
export const ArrowLeft = (p) => <S {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></S>
export const CheckIcon = (p) => <S {...p}><path d="M20 6L9 17l-5-5" /></S>
export const AlertTriangle = (p) => <S {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></S>
export const InfoCircle = (p) => <S {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></S>
export const HeartIcon = (p) => <S {...p}><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.85a5.5 5.5 0 0 0 0-7.78z" /></S>
export const DropletIcon = (p) => <S {...p}><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" /></S>
export const CalendarIcon = (p) => <S {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></S>
export const StethIcon = (p) => <S {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></S>
export const PhoneIcon = (p) => <S {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z" /></S>

// Shared light theme. Change brand and font here for every screen.
export const palette = {
  primary: '#181818',
  primaryHover: '#2e2e2e',
  onPrimary: '#ffffff',
  background: '#f4f4f6',
  surface: '#ffffff',
  text: '#2c2c2c',
  muted: '#707070',
  border: '#f7f7f8',
  borderStrong: '#eaeaea',
  secondary: '#e7e8ec',
  hover: '#f1f1f3',
  danger: '#c70036',
  dangerBackground: 'rgba(255,32,86,0.1)',
  error: '#e7000b',
  errorBackground: '#fef2f2',
  errorBorder: '#ffc9c9',
  success: '#007a55',
  successBackground: '#ecfdf5',
  warning: '#bb4d00',
  warningBackground: '#fffbeb',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

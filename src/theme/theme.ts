/**
 * MonoReceipt Formal Luxury Editorial Theme Tokens
 * Based on Concept 1: Luxury Editorial Logo & Palette
 */

import { Platform } from 'react-native';

export const Colors = {
  // Base Canvas & Surfaces
  bgKiosk: '#FBFBF9',        // Warm matte ivory background
  bgDark: '#121212',         // Deep obsidian background for camera/viewfinder
  surface: '#FFFFFF',        // Pure elevated card white
  surfaceWarm: '#F5F4EF',    // Slightly warmer inset surface
  
  // Ink Typography & Monochromes
  inkPrimary: '#1A1A1A',     // Deep obsidian charcoal text / buttons
  inkSecondary: '#6B6862',   // Muted editorial caption gray
  inkLight: '#A39F97',       // Very subtle helper text
  border: '#E8E6DF',         // Crisp paper-edge divider
  borderLight: '#F0EFEA',    // Faint separator line
  
  // Luxury Accents (Warm Champagne Gold & Brass)
  gold: '#C5A880',           // Warm champagne gold accent
  goldLight: '#F4EFE6',      // Subtle gold wash/highlight
  goldDark: '#9E7D53',       // Deep pressed brass
  goldBorder: '#D8C3A5',     // Elegant gold perimeter line
  
  // Thermal Paper & Receipt Presentation
  paperBg: '#FFFFFF',        // Crisp thermal paper white
  paperBorder: '#E0DDD5',    // Realistic cut-paper edge border
  paperShadow: 'rgba(26, 26, 26, 0.08)',
  
  // Status Indicators
  statusConnected: '#2E7D32',    // Deep jewel emerald
  statusScanning: '#C5A880',     // Warm amber pulse
  statusDisconnected: '#C62828', // Rich crimson
  
  // Overlay & Backdrop
  overlayDark: 'rgba(18, 18, 18, 0.75)',
  overlayFlash: '#FFFFFF',
} as const;

export const Typography = {
  // Cross-platform font families
  serif: Platform.select({
    android: 'serif',
    ios: 'Georgia',
    default: 'serif',
  }),
  sans: Platform.select({
    android: 'sans-serif',
    ios: 'System',
    default: 'sans-serif',
  }),
  sansMedium: Platform.select({
    android: 'sans-serif-medium',
    ios: 'System',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    android: 'monospace',
    ios: 'Courier',
    default: 'monospace',
  }),
  
  // Letter spacing presets for high-fashion editorial feel
  trackingTight: 0.5,
  trackingNormal: 1,
  trackingWide: 2,
  trackingExtraWide: 3.5,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardFloating: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors - Stitch Aether BIM / Stitch design tokens
        // Primary palette - Cyan
        primary: '#006486',
        'on-primary': '#ffffff',
        'primary-container': '#00d4ff',
        'on-primary-container': '#001f2a',
        'primary-fixed': '#00d4ff',
        'on-primary-fixed': '#003544',
        'primary-fixed-dim': '#0099cc',
        
        // Secondary palette - Coral/Orange
        secondary: '#9c4220',
        'on-secondary': '#ffffff',
        'secondary-container': '#ffdbd0',
        'on-secondary-container': '#390c00',
        
        // Tertiary palette - Amber/Yellow
        tertiary: '#6c4900',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#feb528',
        'on-tertiary-container': '#281900',
        
        // Error palette
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#410002',
        
        // Surface palette - Light theme - Aether BIM #f7f9fb
        background: '#f7f9fb',
        'on-background': '#191c1e',
        surface: '#f7f9fb',
        'on-surface': '#191c1e',
        'surface-dim': '#d8e0e6',
        'surface-bright': '#f7f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f6f9',
        'surface-container': '#eff2f5',
        'surface-container-high': '#e5eaef',
        'surface-container-highest': '#dbe2e8',
        
        // Surface variant
        'surface-variant': '#dbe2e8',
        'on-surface-variant': '#3f484d',
        'outline': '#6f797d',
        'outline-variant': '#bfc8cc',
        'inverse-surface': '#2f3336',
        'inverse-on-surface': '#f0f4f6',
        'inverse-primary': '#82d1f0',
        
        // Additional colors
        'surface-tint': '#006486',
        'scrim': '#000000',
        
        // Status colors
        success: '#146b3a',
        'on-success': '#ffffff',
        'success-container': '#bbf5c3',
        'on-success-container': '#042211',
      },
      fontFamily: {
        'headline': ['Syne', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'label': ['Space Grotesk', 'Space Mono', 'monospace']
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem'
      }
    }
  },
  plugins: []
}
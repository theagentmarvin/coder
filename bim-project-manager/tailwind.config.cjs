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
        'on-secondary-fixed-variant': '#832600',
        'secondary-fixed-dim': '#ffb59d',
        'primary-fixed': '#b4ebff',
        'surface-container-lowest': '#0a0e19',
        'surface-container-high': '#262a36',
        'primary-fixed-dim': '#3cd7ff',
        'primary': '#a8e8ff',
        'on-primary-container': '#00586b',
        'secondary-fixed': '#ffdbd0',
        'on-tertiary': '#432c00',
        'on-tertiary-container': '#6c4900',
        'tertiary-fixed-dim': '#ffba3d',
        'on-secondary-fixed': '#390c00',
        'on-error': '#690005',
        'on-surface-variant': '#bbc9cf',
        'secondary-container': '#b83900',
        'on-tertiary-fixed': '#281900',
        'tertiary-fixed': '#ffdeae',
        'surface-container': '#1b1f2b',
        'surface-container-low': '#171b27',
        'on-tertiary-fixed-variant': '#604100',
        'on-primary': '#003642',
        'tertiary': '#ffd9a1',
        'error-container': '#93000a',
        'background': '#0f131e',
        'surface-bright': '#353945',
        'primary-container': '#00d4ff',
        'inverse-surface': '#dfe2f2',
        'surface': '#0f131e',
        'surface-container-highest': '#313441',
        'inverse-primary': '#00677e',
        'outline-variant': '#3c494e',
        'inverse-on-surface': '#2c303c',
        'on-background': '#dfe2f2',
        'secondary': '#ffb59d',
        'on-primary-fixed': '#001f27',
        'on-secondary': '#5d1900',
        'on-error-container': '#ffdad6',
        'surface-tint': '#3cd7ff',
        'surface-variant': '#313441',
        'outline': '#859398',
        'on-surface': '#dfe2f2',
        'error': '#ffb4ab',
        'surface-dim': '#0f131e',
        'on-primary-fixed-variant': '#004e5f',
        'tertiary-container': '#feb528',
        'on-secondary-container': '#ffddd2'
      },
      fontFamily: {
        'headline': ['Syne', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'label': ['Space Mono', 'monospace']
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

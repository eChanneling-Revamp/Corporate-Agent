module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // Extra small devices (phones)
        'sm': '640px',    // Small devices (large phones)
        'md': '768px',    // Medium devices (tablets)
        'lg': '1024px',   // Large devices (laptops)
        'xl': '1280px',   // Extra large devices (desktops)
        '2xl': '1536px',  // 2X large devices (large desktops)
        '3xl': '1920px',  // 3X large devices (ultra-wide)
        // Device-specific breakpoints
        'mobile-sm': '320px',    // Small mobile
        'mobile-lg': '414px',    // Large mobile
        'tablet-sm': '768px',    // Small tablet
        'tablet-lg': '1024px',   // Large tablet
        'desktop-sm': '1280px',  // Small desktop
        'desktop-lg': '1600px',  // Large desktop
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
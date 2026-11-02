/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'mill-orange': '#F5A623',
        'mill-orange-light': '#FFF8EE',
        'mill-blue': '#2563eb',
        'mill-blue-light': '#EEF4FF',
        'mill-green': '#16a34a',
        'mill-green-light': '#EEFBF2',
        'mill-red': '#dc2626',
        'mill-red-light': '#fecaca',
        'mill-bg': '#F5F6FA',
        'mill-border': '#e5e7eb',
        'mill-text': '#111827',
        'mill-muted': '#6b7280',
        'mill-faint': '#9ca3af',
      },
    },
  },
  plugins: [],
};

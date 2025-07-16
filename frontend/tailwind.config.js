import forms from '@tailwindcss/forms';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-dark': '#202123',
        'chat-main': '#343541',
        'chat-input': '#40414f',
      }
    },
  },
  plugins: [
    forms,
  ],
}
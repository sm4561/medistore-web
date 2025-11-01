// js/theme-v2.js

// Find the button and the icons in the HTML
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// This function reads the saved setting and applies the correct theme and icon
const applyTheme = () => {
  // Check localStorage first, then check the user's computer setting
  const isDarkMode = 
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkMode) {
    // Apply dark mode visuals
    document.documentElement.classList.add('dark');
    // In dark mode, SHOW the moon icon and HIDE the sun icon
    if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
    if (themeToggleLightIcon) themeToggleLightIcon.classList.add('hidden');
  } else {
    // Apply light mode visuals
    document.documentElement.classList.remove('dark');
    // In light mode, SHOW the sun icon and HIDE the moon icon
    if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
    if (themeToggleDarkIcon) themeToggleDarkIcon.classList.add('hidden');
  }
};

// Listen for a click on the toggle button
themeToggleBtn?.addEventListener('click', () => {
  // Determine what the new theme should be
  const currentTheme = localStorage.getItem('theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Save the new theme preference
  localStorage.setItem('theme', newTheme);
  
  // Apply the new theme visuals
  applyTheme();
});

// Run the function as soon as the page loads to set the initial theme
applyTheme();
// MODIFIED: Imported 'sendPasswordResetEmail' for the new feature
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Initialize Firebase Auth
const auth = getAuth();

// MODIFIED: Get all necessary elements from the page
const welcomeNameElement = document.getElementById('welcome-name');
const welcomeEmailElement = document.getElementById('welcome-email');
const logoutButton = document.getElementById('logout-button');
const changePasswordLink = document.getElementById('change-password-link');
const initialsContainer = document.getElementById('profile-initials-container');

// --- NEW: A list of professional, Tailwind CSS background colors ---
const colorPalette = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

// --- NEW: Function to pick a consistent color based on a name ---
const getColorForName = (name) => {
  if (!name) {
    return 'bg-gray-500'; // Default color if no name is provided
  }
  // This is a simple "hash" function that turns the name into a number
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the number to pick a color from our palette
  const index = Math.abs(hash % colorPalette.length);
  return colorPalette[index];
};

const getInitials = (fullName) => {
  if (!fullName) {
    return "?";
  }
  const words = fullName.trim().split(' ');
  if (words.length > 1) {
    return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase();
  } else {
    return words[0][0].toUpperCase();
  }
};

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    const displayName = user.displayName;
    const email = user.email;

    if (displayName) {
      welcomeNameElement.textContent = `Welcome Back, ${displayName}!`;
    } else {
      welcomeNameElement.textContent = 'Welcome Back!';
    }
    
    welcomeEmailElement.textContent = email;

    // --- MODIFIED: Now we generate initials AND set a dynamic background color ---
    const initials = getInitials(displayName);
    const dynamicColor = getColorForName(displayName);

    // Update the container's background color
    initialsContainer.className = `w-24 h-24 rounded-full flex items-center justify-center ${dynamicColor}`;
    
    const initialsTextElement = document.createElement('span');
    initialsTextElement.className = 'text-4xl font-bold text-white';
    initialsTextElement.textContent = initials;
    
    initialsContainer.innerHTML = ''; 
    initialsContainer.appendChild(initialsTextElement);
    
    changePasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert('A password reset link has been sent to your email address.');
        })
        .catch((error) => {
          console.error("Error sending password reset email:", error);
          alert('Failed to send password reset email. Please try again.');
        });
    });

  } else {
    window.location.href = 'login.html';
  }
});

logoutButton.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error("Sign out error:", error);
  });
});

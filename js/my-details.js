// MODIFIED: Import 'auth' from your central firebase.js file
import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// REMOVED: No need to call getAuth() again, since we import it.
// const auth = getAuth();

// Get form inputs (this part is correct)
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageElement = document.getElementById('message');

// Listen for auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, populate the form
        nameInput.value = user.displayName || 'Not set';
        emailInput.value = user.email;
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html';
    }
});
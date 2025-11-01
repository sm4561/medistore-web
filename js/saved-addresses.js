import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// Import all necessary Firestore functions
import { getFirestore, collection, addDoc, query, where, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Initialize Firestore database
const db = getFirestore();

// Get references to all the HTML elements we need
const addressList = document.getElementById('address-list');
const modal = document.getElementById('address-modal');
const addAddressBtn = document.getElementById('add-address-btn');
const cancelBtn = document.getElementById('cancel-btn');
const addressForm = document.getElementById('address-form');
const modalTitle = document.getElementById('modal-title');

// A variable to store the current user's ID
let currentUserId = null;

// --- Modal Controls ---
const showModal = () => modal.classList.remove('hidden');
const hideModal = () => modal.classList.add('hidden');

addAddressBtn.addEventListener('click', () => {
    addressForm.reset();
    modalTitle.textContent = "Add a New Address";
    showModal();
});
cancelBtn.addEventListener('click', hideModal);

// --- Main Application Logic ---

// Listen for the user's login status
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        loadAddresses(currentUserId);
    } else {
        window.location.href = 'login.html';
    }
});

// Function to fetch addresses from Firestore and display them on the page
const loadAddresses = async (userId) => {
    addressList.innerHTML = '<p class="text-gray-400 col-span-full">Loading your saved addresses...</p>';
    
    const q = query(collection(db, "addresses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    addressList.innerHTML = ''; // Clear the "Loading..." message
    
    if (querySnapshot.empty) {
        addressList.innerHTML = '<p class="text-gray-400 col-span-full">You have no saved addresses yet. Click "Add New Address" to get started!</p>';
        return;
    }

    // Loop through each address and create a card for it
    querySnapshot.forEach((doc) => {
        renderAddressCard(doc.data(), doc.id);
    });
};

// Function to generate the HTML for a single address card
const renderAddressCard = (data, id) => {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 p-5 rounded-lg shadow-md flex justify-between items-start border border-gray-700';
    card.innerHTML = `
        <div class="space-y-1">
            <p class="font-bold text-lg text-white">${data.fullName}</p>
            <p class="text-gray-400">${data.addressLine1}, ${data.city}</p>
            <p class="text-gray-400">${data.state} - ${data.postalCode}</p>
            <p class="text-gray-400">Phone: ${data.phoneNumber}</p>
        </div>
        <button data-id="${id}" class="delete-btn text-red-500 hover:text-red-400 font-semibold">Delete</button>
    `;
    addressList.appendChild(card);
};

// --- Form and Button Event Handlers ---

// This is the MOST IMPORTANT part for saving the address
addressForm.addEventListener('submit', async (e) => {
    // 1. Prevent the browser's default form submission and the autofill pop-up from taking over
    e.preventDefault();
    
    // 2. Create an object with the data from the form
    const newAddress = {
        userId: currentUserId,
        fullName: addressForm.fullName.value,
        phoneNumber: addressForm.phoneNumber.value,
        addressLine1: addressForm.addressLine1.value,
        city: addressForm.city.value,
        postalCode: addressForm.postalCode.value,
        state: addressForm.state.value,
    };

    try {
        // 3. Save the new address to the "addresses" collection in Firestore
        await addDoc(collection(db, "addresses"), newAddress);
        
        // 4. Close the pop-up form and refresh the address list to show the new card
        hideModal();
        loadAddresses(currentUserId); 
    } catch (error) {
        console.error("Error adding address document: ", error);
        alert("Failed to save the address. Please try again.");
    }
});

// Handle the click event for the "Delete" button on an address card
addressList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const addressId = e.target.getAttribute('data-id');
        
        if (confirm('Are you sure you want to delete this address?')) {
            try {
                await deleteDoc(doc(db, "addresses", addressId));
                loadAddresses(currentUserId); // Refresh the list after deleting
            } catch (error) {
                console.error("Error deleting address document: ", error);
                alert("Failed to delete the address. Please try again.");
            }
        }
    }
});


import { db, auth } from './firebase.js';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- ELEMENT REFERENCES ---
const summaryItemsList = document.getElementById('summary-items-list');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const totalEl = document.getElementById('total');
const placeOrderBtn = document.getElementById('place-order-btn');
const checkoutForm = document.getElementById('checkout-form');

const SHIPPING_COST = 20.00;
let checkoutItems = [];
let currentUser = null; // Track user state globally

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state once to get the user
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    // Load checkout details immediately, regardless of login status
    loadCheckoutDetails();
});

function loadCheckoutDetails() {
    const itemsData = localStorage.getItem('checkoutItems');
    if (!itemsData) {
        alert("Your cart seems to be empty. Redirecting you to the cart page.");
        window.location.href = 'cart.html';
        return;
    }

    checkoutItems = JSON.parse(itemsData);
    renderSummary();
}

function renderSummary() {
    if (!checkoutItems || checkoutItems.length === 0) {
        summaryItemsList.innerHTML = '<p class="text-gray-500 text-sm">No items selected for checkout.</p>';
        return;
    }

    summaryItemsList.innerHTML = ''; // Clear previous items
    let subtotal = 0;

    checkoutItems.forEach(item => {
        const itemTotal = item.quantity * item.product.price;
        subtotal += itemTotal;

        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center text-sm mb-1';
        itemEl.innerHTML = `
            <span class="truncate pr-2">${item.product.name} (x${item.quantity})</span>
            <span class="font-medium">₹${itemTotal.toFixed(2)}</span>
        `;
        summaryItemsList.appendChild(itemEl);
    });
    
    // Update the totals in the summary box
    const total = subtotal + SHIPPING_COST;
    subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    shippingEl.textContent = `₹${SHIPPING_COST.toFixed(2)}`;
    totalEl.textContent = `₹${total.toFixed(2)}`;
}

// --- FORM SUBMISSION ---
checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default browser form submission
    
    // ✅ MODIFIED: Check user login status and handle accordingly
    if (!currentUser) {
        alert("Please log in or sign up to complete your order.");
        localStorage.setItem('redirectAfterLogin', 'checkout.html');
        window.location.href = 'login.html';
        return;
    } else {
        // Logged-in user case
        alert("Payment system is not integrated.");
        
        // The rest of your order placement logic can go here if/when you integrate a payment gateway.
        // I will keep the existing order placement code commented out for your reference.
        
        /* placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Placing Order...';

        const formData = new FormData(checkoutForm);
        const shippingAddress = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            address1: formData.get('address1'),
            address2: formData.get('address2'),
            city: formData.get('city'),
            pincode: formData.get('pincode'),
            state: formData.get('state'),
        };

        try {
            const ordersRef = collection(db, "users", currentUser.uid, "orders");
            await addDoc(ordersRef, {
                userId: currentUser.uid,
                items: checkoutItems,
                totalAmount: parseFloat(totalEl.textContent.replace('₹', '')),
                orderDate: serverTimestamp(),
                shippingAddress: shippingAddress,
                status: "Processing"
            });

            const batch = writeBatch(db);
            checkoutItems.forEach(item => {
                const itemRef = doc(db, "users", currentUser.uid, "cart", item.cartId);
                batch.delete(itemRef);
            });
            await batch.commit();

            localStorage.removeItem('checkoutItems');
            alert("✅ Order placed successfully!");
            window.location.href = 'order-history.html';

        } catch (error) {
            console.error("Error placing order:", error);
            alert("There was an error placing your order. Please try again.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Proceed to Payment';
        }
        */
    }
});

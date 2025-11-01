import { db, auth } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { addToCart } from './cart.js';

// Get elements from the page
const loadingState = document.getElementById('loading-state');
const productContent = document.getElementById('product-content');
const productImage = document.getElementById('product-image');
const productName = document.getElementById('product-name');
const productBrand = document.getElementById('product-brand');
const productPrice = document.getElementById('product-price');
const productDescription = document.getElementById('product-description');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const buyNowBtn = document.getElementById('buy-now-btn');

let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// NEW FUNCTION: Displays a non-blocking notification message
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.classList.remove('translate-x-full', 'bg-red-600', 'bg-green-600');
    notification.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
    notification.classList.add('translate-x-0');

    setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full');
    }, 2500);
}


// Function to get product ID from the URL
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Function to fetch and display the product
async function loadProduct() {
    const productId = getProductId();
    if (!productId) {
        loadingState.textContent = "Product not found. Please go back to the products page.";
        return;
    }

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const product = docSnap.data();

            // Populate the page with product data
            productImage.src = product.image || 'https://via.placeholder.com/300x300';
            productImage.alt = product.name;
            productName.textContent = product.name;
            productBrand.textContent = `Brand: ${product.brand || 'Generic'}`;
            productPrice.textContent = `₹${product.price}`;
            productDescription.textContent = product.description || 'No description available.';

            // Show the content and hide the loading message
            loadingState.classList.add('hidden');
            productContent.classList.remove('hidden');

            // Add event listeners to buttons
            addToCartBtn.onclick = async () => {
                await addToCart(productId);
                showNotification(`${product.name} added to cart!`);
            };

            // ✅ REMOVED THE if (!currentUser) CHECK FROM HERE
            buyNowBtn.onclick = async () => {
                // Create a temporary array with only the selected product
                const singleItemForCheckout = [{
                    cartId: productId, // Use productId as a placeholder
                    quantity: 1,
                    product: product
                }];

                // Store only this item in localStorage with a different key
                localStorage.setItem('checkoutItems', JSON.stringify(singleItemForCheckout));

                // Redirect directly to checkout, skipping the cart page.
                window.location.href = 'checkout.html';
            };

        } else {
            loadingState.textContent = "This product does not exist.";
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        loadingState.textContent = "Could not load product details. Please try again later.";
    }
}

// Load the product when the page loads
loadProduct();
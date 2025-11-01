// js/index.js
import { db, auth } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addToCart } from './cart.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';


let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// A function to render products, adapted from products.js
function renderProducts(products, container, emptyMessage = "No products found.") {
    if (!container) return;

    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">${emptyMessage}</p>`;
        return;
    }

    products.forEach(product => {
        const productId = product.id;
        const productData = product.data;

        const cardHTML = `
            <div class="bg-white border p-4 rounded-lg shadow-md hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700 flex flex-col">
                <a href="product-details.html?id=${productId}" class="flex-grow">
                    <img src="${productData.image}" alt="${productData.name}" class="w-full h-48 object-contain mb-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-300">${productData.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400">Category: ${productData.category || 'General'}</p>
                </a>
                <p class="text-blue-600 font-bold text-xl my-2 dark:text-blue-400">₹${productData.price}</p>
                <button
                    class="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600 add-to-cart-btn"
                    data-product-id="${productId}"
                >Add to Cart</button>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// Function to load and display featured products
async function loadFeaturedProducts() {
    const featuredContainer = document.getElementById("featured-products-container");
    if (!featuredContainer) return;

    try {
        const q = query(collection(db, "products"), where("isFeatured", "==", true));
        const snapshot = await getDocs(q);

        const featuredProducts = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        renderProducts(featuredProducts, featuredContainer, "No featured products available at the moment.");
    } catch (error) {
        console.error("Failed to load featured products:", error);
        featuredContainer.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading featured products.</p>`;
    }
}

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


// Event delegation for Add to Cart button
document.addEventListener('click', async (event) => {
    const button = event.target.closest('.add-to-cart-btn');
    if (!button) return;

    const productId = button.dataset.productId;
    const productElement = button.parentElement; // Get the parent div of the button

    if (productId) {
        button.textContent = 'Adding...';
        button.disabled = true;

        try {
            await addToCart(productId);
            // Find the product name directly from the DOM
            const productNameEl = productElement.querySelector('h3');
            const productName = productNameEl ? productNameEl.textContent : 'Item';
            showNotification(`${productName} added to cart!`);

        } catch (error) {
            console.error('Failed to add item to cart:', error);
            showNotification('Could not add item. Please try again.', true);
        } finally {
            button.textContent = 'Add to Cart';
            button.disabled = false;
        }
    }
});


function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    // Redirect to products page on click/focus
    searchInput.addEventListener('focus', () => {
        window.location.href = 'products.html';
    });

    // Redirect on Enter key press with search term
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();
    setupSearch();
});
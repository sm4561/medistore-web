import { db, auth } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { addToCart } from './cart.js'; 

const container = document.getElementById('product-details-container');
const searchBox = document.getElementById('search-box');
const heading = document.getElementById('products-heading');
const notification = document.getElementById('notification');
const loadingSpinner = document.getElementById('loading-spinner');
let allProducts = [];
let currentUser = null;

onAuthStateChanged(auth, (user) => { currentUser = user; });

async function loadAllProducts() {
  loadingSpinner.classList.remove('hidden');
  try {
    const snapshot = await getDocs(collection(db, "products"));
    if (snapshot.empty) {
      container.innerHTML = `<p class="col-span-full text-center text-red-500">No products found. Check back later!</p>`;
      return;
    }
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    applyFilters();
  } catch (err) {
    console.error("Error loading products:", err);
    container.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading products. Please try refreshing the page.</p>`;
  } finally {
    loadingSpinner.classList.add('hidden');
  }
}

function renderProducts(products) {
  container.innerHTML = '';
  if (products.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500">No matching products found.</p>`;
    return;
  }
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = "bg-white rounded-lg shadow p-4 flex flex-col dark:bg-gray-800";
    card.innerHTML = `
      <a href="product-details.html?id=${product.id}" class="flex flex-col flex-grow">
        <img src="${product.image || 'https://via.placeholder.com/300x300'}" alt="${product.name}" class="w-full h-48 object-contain mb-4 rounded-lg shadow-md" />
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1 hover:text-blue-600 dark:hover:text-blue-400">${product.name}</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-1">Category: ${product.category || 'General'}</p>
        <p class="text-gray-700 dark:text-gray-300 mb-2 flex-grow">${product.description || 'No description available.'}</p>
        <p class="text-blue-600 dark:text-blue-400 font-bold text-lg mb-4">₹${product.price}</p>
      </a>
      <div class="flex gap-3 mt-auto">
        <button data-action="add-to-cart" data-product-id="${product.id}" class="action-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
          Add to Cart
        </button>
        <button data-action="buy-now" data-product-id="${product.id}" class="action-btn bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 w-full dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
          Buy Now
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.classList.remove('translate-x-full', 'bg-red-600', 'bg-green-600');
  notification.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
  notification.classList.add('translate-x-0');
  setTimeout(() => {
    notification.classList.remove('translate-x-0');
    notification.classList.add('translate-x-full');
  }, 2500); 
}

// Event Delegation for Cart Actions
container.addEventListener('click', async (e) => {
  const button = e.target.closest('.action-btn');
  if (!button) return;
  
  // REMOVED THE IF(!currentUser) CHECK. 
  // The addToCart function will handle guest users.

  const productId = button.dataset.productId;
  const product = allProducts.find(p => p.id === productId);
  try {
    const action = button.dataset.action;
    if (action === 'add-to-cart') {
      await addToCart(productId);
      showNotification(`${product.name} added to cart!`);
    } else if (action === 'buy-now') {
      const singleItemForCheckout = [{
        cartId: productId,
        quantity: 1,
        product: product
      }];
      localStorage.setItem('checkoutItems', JSON.stringify(singleItemForCheckout));
      window.location.href = 'checkout.html';
    }
  } catch (error) {
    console.error("Failed to process action:", error);
    showNotification('Could not complete action. Please try again.', true);
  }
});

// Apply filters (Category + Search + Default)
function applyFilters() {
  const query = searchBox.value.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");
  let filtered = allProducts;
  let headingText = "All Products";
  // 1. Category filter
  if (categoryFromUrl) {
    const normalizedCategory = categoryFromUrl.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    filtered = filtered.filter(product => {
      const productCategory = (product.category || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
      return productCategory.includes(normalizedCategory);
    });
    headingText = categoryFromUrl;
  }
  // 2. Search filter (don’t update heading text)
  if (query) {
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  }
  heading.textContent = headingText;
  renderProducts(filtered);
}
searchBox.addEventListener('input', applyFilters);
loadAllProducts();
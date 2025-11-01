import { db, auth } from './firebase.js';
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, setDoc, increment, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- ELEMENT REFERENCES ---
const cartItemsList = document.getElementById('cart-items-list');
const subtotalAmountEl = document.getElementById('subtotal-amount');
const shippingAmountEl = document.getElementById('shipping-amount');
const totalAmountEl = document.getElementById('total-amount');
const checkoutBtn = document.getElementById('checkout-btn');
const selectAllCheckbox = document.getElementById('select-all-checkbox');
const cartContainer = document.getElementById('cart-container');
const cartCountElement = document.getElementById('cartCount');
const itemCountElement = document.getElementById('item-count');
const statusMessageEl = document.getElementById('status-message'); // New element for status messages

// --- STATE MANAGEMENT ---
let cartItems = []; // This will hold the merged cart and product data
let currentUser = null;
const SHIPPING_COST = 20.00;
let cartListener = null;

// --- GUEST CART (localStorage) FUNCTIONS ---

function getGuestCart() {
    return JSON.parse(localStorage.getItem('guestCart') || '[]');
}

function saveGuestCart(cart) {
    localStorage.setItem('guestCart', JSON.stringify(cart));
    updateGuestCartCount();
}

function updateGuestCartCount() {
    const guestCart = getGuestCart();
    const totalQuantity = guestCart.reduce((sum, item) => sum + item.quantity, 0);
    updateCartIcon(totalQuantity);
}

// --- UI MESSAGE FUNCTIONS ---

// Displays a non-blocking message to the user.
export function displayStatusMessage(message, type = 'success') {
    if (!statusMessageEl) return;
    statusMessageEl.textContent = message;
    statusMessageEl.className = 'px-4 py-2 my-2 rounded-lg text-center font-semibold ' + (type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');
    statusMessageEl.style.display = 'block';

    // Hide the message after a few seconds
    setTimeout(() => {
        statusMessageEl.style.display = 'none';
    }, 3000);
}

// --- CORE PUBLIC FUNCTIONS ---

export async function addToCart(productId) {
    // If a user is logged in, use Firestore
    if (auth.currentUser) {
        const user = auth.currentUser;
        const cartItemRef = doc(db, "users", user.uid, "cart", productId);
        const cartItemSnap = await getDoc(cartItemRef);

        if (cartItemSnap.exists()) {
            await updateDoc(cartItemRef, { quantity: increment(1) });
        } else {
            await setDoc(cartItemRef, { productId: productId, quantity: 1 });
        }
        displayStatusMessage('Item added to your cart!', 'success');
    } 
    // If no user is logged in, use localStorage for a guest cart
    else {
        let guestCart = getGuestCart();
        const existingItem = guestCart.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            // We need to fetch product details to store them for the guest
            const productRef = doc(db, "products", productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                 guestCart.push({
                    productId: productId,
                    quantity: 1,
                    product: productSnap.data() // Store product details directly
                });
            } else {
                console.error("Attempted to add a non-existent product to guest cart.");
                displayStatusMessage("Error adding item to cart. Product not found.", "error");
                return;
            }
        }
        saveGuestCart(guestCart);
        displayStatusMessage('Item added to your cart!', 'success');
    }
}

// --- CART PAGE LOGIC (runs only on cart.html) ---

if (window.location.pathname.endsWith('cart.html')) {
    
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            // User is logged in, merge local cart with Firestore cart
            await mergeCarts(user.uid);
            loadUserCart(user.uid);
        } else {
            // User is not logged in, load cart from localStorage
            loadGuestCart();
        }
    });

    async function mergeCarts(userId) {
        const guestCart = getGuestCart();
        if (guestCart.length === 0) return;

        const batch = writeBatch(db);
        
        for (const item of guestCart) {
            const cartItemRef = doc(db, "users", userId, "cart", item.productId);
            batch.set(cartItemRef, { productId: item.productId, quantity: increment(item.quantity) }, { merge: true });
        }

        await batch.commit();
        localStorage.removeItem('guestCart'); // Clear guest cart after merging
    }

    async function loadUserCart(userId) {
        cartItemsList.innerHTML = `<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-2xl"></i><p>Loading your items...</p></div>`;
        
        try {
            const cartRef = collection(db, "users", userId, "cart");
            const cartSnapshot = await getDocs(cartRef);

            if (cartSnapshot.empty) {
                handleEmptyCart();
                return;
            }

            const cartPromises = cartSnapshot.docs.map(async (cartDoc) => {
                const cartData = cartDoc.data();
                const productRef = doc(db, "products", cartData.productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    return {
                        cartId: cartDoc.id,
                        ...cartData,
                        product: productSnap.data(),
                        selected: true
                    };
                }
                return null;
            });

            cartItems = (await Promise.all(cartPromises)).filter(item => item !== null);
            renderCart();

        } catch (error) {
            console.error("Error loading user cart:", error);
            cartItemsList.innerHTML = `<p class="text-center py-10 text-red-500">Could not load your cart.</p>`;
        }
    }
    
    function loadGuestCart() {
        cartItems = getGuestCart().map(item => ({...item, cartId: item.productId, selected: true}));
        renderCart();
    }
    
    function handleEmptyCart() {
        cartItemsList.innerHTML = `<div class="text-center p-8">
            <h2 class="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p class="text-gray-500 mb-4">Looks like you haven't added anything yet.</p>
            <a href="products.html" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Start Shopping</a>
        </div>`;
        cartItems = [];
        updateTotals();
    }

    function renderCart() {
        cartItemsList.innerHTML = '';
        if (cartItems.length === 0) {
            handleEmptyCart();
            return;
        }

        cartItems.forEach(item => {
            const itemTotal = item.quantity * item.product.price;
            const itemEl = document.createElement('div');
            itemEl.className = 'flex items-center p-4';
            itemEl.innerHTML = `
                <input type="checkbox" class="item-checkbox h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" data-cart-id="${item.cartId}" ${item.selected ? 'checked' : ''}>
                <img src="${item.product.image}" alt="${item.product.name}" class="w-20 h-20 object-contain rounded-md mx-4">
                <div class="flex-grow">
                    <p class="font-semibold text-lg">${item.product.name}</p>
                    <p class="text-blue-500 font-bold">₹ ${item.product.price.toFixed(2)}</p>
                    <button class="text-red-500 text-sm hover:underline mt-1 remove-btn" data-cart-id="${item.cartId}">Remove</button>
                </div>
                <div class="flex items-center justify-center border rounded-md mx-4">
                    <button class="px-3 py-1 text-lg quantity-btn" data-cart-id="${item.cartId}" data-change="-1">-</button>
                    <span class="px-4 font-semibold">${item.quantity}</span>
                    <button class="px-3 py-1 text-lg quantity-btn" data-cart-id="${item.cartId}" data-change="1">+</button>
                </div>
                <div class="text-right font-bold text-lg w-32 pr-6">₹ ${itemTotal.toFixed(2)}</div>
            `;
            cartItemsList.appendChild(itemEl);
        });
        updateTotals();
        checkSelectAllState();
        updateItemCount();
    }

    function updateTotals() {
        const selectedItems = cartItems.filter(item => item.selected);
        const subtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
        const total = subtotal > 0 ? subtotal + SHIPPING_COST : 0;

        subtotalAmountEl.textContent = `₹ ${subtotal.toFixed(2)}`;
        shippingAmountEl.textContent = `₹ ${subtotal > 0 ? SHIPPING_COST.toFixed(2) : '0.00'}`;
        totalAmountEl.textContent = `₹ ${total.toFixed(2)}`;
        
        checkoutBtn.disabled = selectedItems.length === 0;
        checkoutBtn.classList.toggle('opacity-50', selectedItems.length === 0);
    }
    
    function updateItemCount() {
        if(itemCountElement) {
            itemCountElement.textContent = `${cartItems.length} item(s)`;
        }
    }

    function checkSelectAllState() {
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = cartItems.length > 0 && cartItems.every(item => item.selected);
        }
    }

    // --- EVENT LISTENERS ---
    cartContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const cartId = target.dataset.cartId;

        // Handle Checkbox clicks
        if (target.matches('.item-checkbox, #select-all-checkbox')) {
             cartItems.forEach(item => {
                if (target.id === 'select-all-checkbox') {
                    item.selected = target.checked;
                } else if (item.cartId === cartId) {
                    item.selected = target.checked;
                }
            });
            renderCart();
        }

        // Handle Quantity buttons
        if (target.matches('.quantity-btn')) {
            const change = parseInt(target.dataset.change, 10);
            const item = cartItems.find(i => i.cartId === cartId);
            if (item) {
                const newQuantity = item.quantity + change;
                if (newQuantity > 0) {
                    item.quantity = newQuantity;
                    if (currentUser) {
                        const itemRef = doc(db, "users", currentUser.uid, "cart", cartId);
                        await updateDoc(itemRef, { quantity: newQuantity });
                    } else {
                        saveGuestCart(cartItems);
                    }
                    renderCart();
                } else {
                    handleRemoveItem(cartId); // Remove if quantity becomes zero
                }
            }
        }
        
        // Handle Remove button
        if (target.matches('.remove-btn')) {
            handleRemoveItem(cartId);
        }
    });
    
    async function handleRemoveItem(cartId) {
        // Confirmation is handled with a non-blocking message.
        displayStatusMessage("Item has been removed from your cart.");
        cartItems = cartItems.filter(i => i.cartId !== cartId);
        if (currentUser) {
            await deleteDoc(doc(db, "users", currentUser.uid, "cart", cartId));
        } else {
            saveGuestCart(cartItems);
        }
        renderCart();
    }

    checkoutBtn.addEventListener('click', () => {
        const itemsToCheckout = cartItems.filter(item => item.selected);
        if (itemsToCheckout.length === 0) {
            displayStatusMessage("Please select at least one item to proceed.", "error");
            return;
        }
        localStorage.setItem('checkoutItems', JSON.stringify(itemsToCheckout));
        window.location.href = 'checkout.html';
    });
}


// --- GLOBAL CART COUNT MANAGEMENT ---

function updateCartIcon(totalQuantity) {
    if (cartCountElement) {
      if (totalQuantity > 0) {
        cartCountElement.textContent = totalQuantity;
        cartCountElement.classList.remove('hidden');
      } else {
        cartCountElement.classList.add('hidden');
      }
    }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // If user is logged in, listen to Firestore for real-time updates
    if (cartListener) cartListener(); // Unsubscribe from any previous listener
    const cartRef = collection(db, "users", user.uid, "cart");
    cartListener = onSnapshot(cartRef, (snapshot) => {
        const totalQuantity = snapshot.docs.reduce((sum, doc) => sum + doc.data().quantity, 0);
        updateCartIcon(totalQuantity);
    });
  } else {
    // If user is a guest, update count from localStorage
    if (cartListener) cartListener(); // Detach Firestore listener
    updateGuestCartCount();
  }
});

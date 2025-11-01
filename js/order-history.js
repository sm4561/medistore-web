import { db, auth } from './firebase.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const ordersContainer = document.getElementById('orders-container');

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadOrders(user.uid);
    } else {
        ordersContainer.innerHTML = `
            <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p class="text-gray-600 dark:text-gray-400">Please <a href="login.html" class="text-blue-500 underline">log in</a> to view your order history.</p>
            </div>
        `;
    }
});

async function loadOrders(userId) {
    ordersContainer.innerHTML = `<p class="text-center py-10">Loading your orders...</p>`;

    try {
        const ordersRef = collection(db, "users", userId, "orders");
        // Orders are queried to be sorted by date, with the most recent first.
        const q = query(ordersRef, orderBy("orderDate", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            ordersContainer.innerHTML = `
                <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <p class="text-gray-600 dark:text-gray-400">You haven't placed any orders yet.</p>
                    <a href="products.html" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Start Shopping</a>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = ''; // Clear loading message
        querySnapshot.forEach(doc => {
            const order = doc.data();
            const orderId = doc.id;
            const orderDate = new Date(order.orderDate.seconds * 1000).toLocaleDateString();
            const totalAmount = order.totalAmount.toFixed(2);
            
            const orderCard = document.createElement('div');
            orderCard.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6';
            
            let itemsHtml = order.items.map(item => `
                <div class="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-b-0">
                    <div class="flex items-center">
                        <img src="${item.product.image || 'https://via.placeholder.com/100'}" alt="${item.product.name}" class="w-16 h-16 object-contain rounded-md mr-4">
                        <div>
                            <p class="font-semibold">${item.product.name}</p>
                            <p class="text-sm text-gray-500">Qty: ${item.quantity}</p>
                        </div>
                    </div>
                    <p class="font-semibold">₹ ${(item.quantity * item.product.price).toFixed(2)}</p>
                </div>
            `).join('');

            orderCard.innerHTML = `
                <div class="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-3">
                    <div>
                        <p class="font-bold text-lg">Order ID: <span class="text-gray-600 dark:text-gray-400">${orderId.substring(0, 8)}</span></p>
                        <p class="text-sm text-gray-500">Placed on: ${orderDate}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-xl text-blue-600 dark:text-blue-400">₹ ${totalAmount}</p>
                        <span class="text-xs font-semibold px-2 py-1 bg-green-200 text-green-800 rounded-full">Completed</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <h4 class="font-semibold mt-4 mb-2">Items in this order:</h4>
                    ${itemsHtml}
                </div>
            `;
            ordersContainer.appendChild(orderCard);
        });

    } catch (error) {
        console.error("Error loading orders:", error);
        ordersContainer.innerHTML = `<p class="text-center py-10 text-red-500">Could not load your order history. Please try again later.</p>`;
    }
}

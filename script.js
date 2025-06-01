// script.js

// --- Global Application State ---
const appState = {
    isLoggedIn: false,
    inventory: [],
    sales: [],
    recoveries: [],
    expenses: [],
    activeTab: 'inventory',
    // States for forms and filters
    newItem: { name: '', batch: '', quantity: '', purchasePrice: '', sellingPrice: '', expiryDate: '' },
    newRecovery: { date: new Date().toISOString().split('T')[0], amount: '', source: '', description: '' },
    newExpense: { date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '' },
    searchTerm: '',
    filteredInventory: [],
    billItems: [],
    reportDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    message: '',
    messageType: '',
};

// --- State Management and Local Storage Utilities ---

function setState(newState, render = true) {
    Object.assign(appState, newState);
    if (render) {
        renderApp();
    }
}

function loadStateFromLocalStorage() {
    try {
        appState.inventory = JSON.parse(localStorage.getItem('ghazi_inventory')) || [];
        appState.sales = JSON.parse(localStorage.getItem('ghazi_sales')) || [];
        appState.recoveries = JSON.parse(localStorage.getItem('ghazi_recoveries')) || [];
        appState.expenses = JSON.parse(localStorage.getItem('ghazi_expenses')) || [];
    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
        // Reset to empty arrays if parsing fails
        appState.inventory = [];
        appState.sales = [];
        appState.recoveries = [];
        appState.expenses = [];
    }
}

function saveStateToLocalStorage() {
    localStorage.setItem('ghazi_inventory', JSON.stringify(appState.inventory));
    localStorage.setItem('ghazi_sales', JSON.stringify(appState.sales));
    localStorage.setItem('ghazi_recoveries', JSON.stringify(appState.recoveries));
    localStorage.setItem('ghazi_expenses', JSON.stringify(appState.expenses));
}

// --- UI Message Handling ---

function displayMessage(msg, type, duration = 3000) {
    setState({ message: msg, messageType: type }, false); // Don't re-render entire app for message
    const messageElement = document.getElementById('app-message-area');
    if (messageElement) {
        messageElement.textContent = msg;
        messageElement.className = `text-center py-2 rounded-md mb-4 ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
        if (msg) {
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = '';
                setState({ message: '', messageType: '' }, false); // Clear state after timeout
            }, duration);
        }
    }
}

// --- Component Rendering Functions ---

function renderLoginPage(parentEl) {
    parentEl.className = "bg-white p-8 rounded-lg shadow-xl w-96 border border-gray-200";
    parentEl.innerHTML = `
        <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Ghazi Veterinary and Medical Store</h2>
        <div class="mb-4">
            <label htmlFor="password" class="block text-gray-700 text-sm font-semibold mb-2">
                Password:
            </label>
            <input
                type="password"
                id="password"
                class="shadow-sm appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value=""
            />
        </div>
        <p id="login-error" class="text-red-500 text-sm mb-4"></p>
        <button
            id="login-button"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
        >
            Login
        </button>
        <p class="text-center text-gray-500 text-xs mt-6">
            &copy; 2025 Ghazi Veterinary and Medical Store. All rights reserved.
        </p>
    `;

    const passwordInput = parentEl.querySelector('#password');
    const loginButton = parentEl.querySelector('#login-button');
    const loginError = parentEl.querySelector('#login-error');

    const handleLogin = () => {
        if (passwordInput.value === 'Ghazi786') {
            setState({ isLoggedIn: true, activeTab: 'inventory' }); // Redirect to inventory after login
        } else {
            loginError.textContent = 'Incorrect password. Please try again.';
        }
    };

    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function renderDashboard(parentEl) {
    parentEl.className = "flex w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200";
    parentEl.innerHTML = `
        <div class="w-64 bg-gray-800 text-white p-6 flex flex-col justify-between rounded-l-lg">
            <div>
                <h1 class="text-2xl font-bold mb-8 text-center border-b border-gray-700 pb-4">Ghazi Store</h1>
                <nav>
                    <ul id="dashboard-nav-list">
                        </ul>
                </nav>
            </div>
            <button id="logout-button"
                class="flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition duration-200 ease-in-out"
            >
                <span class="mr-2">🚪</span> Logout
            </button>
        </div>

        <div id="dashboard-content-area" class="flex-1 p-8 overflow-auto">
            </div>
    `;

    const navList = parentEl.querySelector('#dashboard-nav-list');
    const contentArea = parentEl.querySelector('#dashboard-content-area');
    const logoutButton = parentEl.querySelector('#logout-button');

    const navItems = [
        { label: 'Inventory', icon: '📦', tab: 'inventory' },
        { label: 'Billing', icon: '🧾', tab: 'billing' },
        { label: 'Daily Reports', icon: '📊', tab: 'reports' },
        { label: 'Search Records', icon: '🔍', tab: 'search' },
    ];

    navList.innerHTML = navItems.map(item => `
        <li class="mb-2">
            <button id="nav-${item.tab}"
                class="flex items-center w-full py-2 px-4 rounded-md text-left transition duration-200 ease-in-out
                ${appState.activeTab === item.tab ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'}"
            >
                <span class="mr-3">${item.icon}</span> ${item.label}
            </button>
        </li>
    `).join('');

    navItems.forEach(item => {
        parentEl.querySelector(`#nav-${item.tab}`).addEventListener('click', () => {
            setState({ activeTab: item.tab });
        });
    });

    logoutButton.addEventListener('click', () => {
        setState({ isLoggedIn: false });
    });

    // Render content based on activeTab
    switch (appState.activeTab) {
        case 'inventory':
            renderInventoryManager(contentArea);
            break;
        case 'billing':
            renderBillingSection(contentArea);
            break;
        case 'reports':
            renderFinancialReports(contentArea);
            break;
        case 'search':
            renderSearchReports(contentArea);
            break;
        default:
            contentArea.innerHTML = '<h2 class="text-xl font-semibold text-gray-700">Welcome to Ghazi Veterinary and Medical Store!</h2>';
    }
}

function renderInventoryManager(parentEl) {
    parentEl.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Inventory Management</h2>

            <div class="mb-8 p-4 border border-blue-200 rounded-md bg-blue-50">
                <h3 class="text-xl font-semibold mb-4 text-blue-800">Add New Medicine</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="name" class="block text-gray-700 text-sm font-semibold mb-1">Medicine Name:</label>
                        <input type="text" id="itemName" name="name" value="${appState.newItem.name}"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="batch" class="block text-gray-700 text-sm font-semibold mb-1">Batch Number:</label>
                        <input type="text" id="itemBatch" name="batch" value="${appState.newItem.batch}"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="quantity" class="block text-gray-700 text-sm font-semibold mb-1">Quantity:</label>
                        <input type="number" id="itemQuantity" name="quantity" value="${appState.newItem.quantity}"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="purchasePrice" class="block text-gray-700 text-sm font-semibold mb-1">Purchase Price (per unit):</label>
                        <input type="number" id="itemPurchasePrice" name="purchasePrice" value="${appState.newItem.purchasePrice}"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="sellingPrice" class="block text-gray-700 text-sm font-semibold mb-1">Selling Price (per unit):</label>
                        <input type="number" id="itemSellingPrice" name="sellingPrice" value="${appState.newItem.sellingPrice}"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="expiryDate" class="block text-gray-700 text-sm font-semibold mb-1">Expiry Date (Compulsory):</label>
                        <input type="date" id="itemExpiryDate" name="expiryDate" value="${appState.newItem.expiryDate}"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                <p id="inventory-message-area" class="text-center py-2 rounded-md"></p>
                <button id="addItemButton"
                    class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
                    Add Item to Inventory
                </button>
            </div>

            <h3 class="text-xl font-semibold mb-4 text-gray-800">Current Inventory</h3>
            <div class="overflow-x-auto rounded-md border border-gray-300">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-table-body" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>
    `;

    const itemNameInput = parentEl.querySelector('#itemName');
    const itemBatchInput = parentEl.querySelector('#itemBatch');
    const itemQuantityInput = parentEl.querySelector('#itemQuantity');
    const itemPurchasePriceInput = parentEl.querySelector('#itemPurchasePrice');
    const itemSellingPriceInput = parentEl.querySelector('#itemSellingPrice');
    const itemExpiryDateInput = parentEl.querySelector('#itemExpiryDate');
    const addItemButton = parentEl.querySelector('#addItemButton');
    const inventoryMessageArea = parentEl.querySelector('#inventory-message-area');
    const inventoryTableBody = parentEl.querySelector('#inventory-table-body');

    // Update newItem state on input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        appState.newItem[name] = value;
        // No full re-render needed for just input value updates
    };

    itemNameInput.addEventListener('input', (e) => { appState.newItem.name = e.target.value; });
    itemBatchInput.addEventListener('input', (e) => { appState.newItem.batch = e.target.value; });
    itemQuantityInput.addEventListener('input', (e) => { appState.newItem.quantity = e.target.value; });
    itemPurchasePriceInput.addEventListener('input', (e) => { appState.newItem.purchasePrice = e.target.value; });
    itemSellingPriceInput.addEventListener('input', (e) => { appState.newItem.sellingPrice = e.target.value; });
    itemExpiryDateInput.addEventListener('input', (e) => { appState.newItem.expiryDate = e.target.value; });


    const handleAddItem = () => {
        const { name, batch, quantity, purchasePrice, sellingPrice, expiryDate } = appState.newItem;

        if (!name || !batch || !quantity || !purchasePrice || !sellingPrice || !expiryDate) {
            displayMessage('Please fill in all fields.', 'error', 3000, inventoryMessageArea);
            return;
        }
        if (isNaN(quantity) || isNaN(purchasePrice) || isNaN(sellingPrice) || parseFloat(quantity) <= 0) {
            displayMessage('Quantity, Purchase Price, and Selling Price must be valid positive numbers.', 'error', 3000, inventoryMessageArea);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < today) {
            displayMessage('Expiry Date must be today or a future date.', 'error', 3000, inventoryMessageArea);
            return;
        }

        const id = Date.now();
        const newItem = { ...appState.newItem, id, quantity: parseFloat(quantity) };
        setState({ inventory: [...appState.inventory, newItem], newItem: { name: '', batch: '', quantity: '', purchasePrice: '', sellingPrice: '', expiryDate: '' } });
        displayMessage('Item added successfully!', 'success', 3000, inventoryMessageArea);
    };

    addItemButton.addEventListener('click', handleAddItem);

    // Render inventory table rows
    if (appState.inventory.length === 0) {
        inventoryTableBody.innerHTML = `<tr><td colSpan="5" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">No items in inventory.</td></tr>`;
    } else {
        inventoryTableBody.innerHTML = appState.inventory.map(item => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${item.batch}</td>
                <td class="px-6 py-4 whitespace-nowrap">${item.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap">PKR ${parseFloat(item.sellingPrice).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${item.expiryDate}</td>
            </tr>
        `).join('');
    }
}

function renderBillingSection(parentEl) {
    parentEl.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Billing Section</h2>

            <div class="mb-6 p-4 border border-green-200 rounded-md bg-green-50">
                <h3 class="text-xl font-semibold mb-4 text-green-800">Add Medicine to Bill</h3>
                <input
                    type="text"
                    id="billingSearchTerm"
                    placeholder="Search medicine by name or batch..."
                    class="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500 mb-4"
                    value="${appState.searchTerm}"
                />
                <div id="filteredInventoryResults" class="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    </div>
            </div>

            <h3 class="text-xl font-semibold mb-4 text-gray-800">Current Bill</h3>
            <div class="overflow-x-auto rounded-md border border-gray-300 mb-6">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th class="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody id="billItemsTableBody" class="bg-white divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 class="text-xl font-bold text-gray-800">Grand Total: PKR <span id="grandTotalDisplay">0.00</span></h3>
                <button id="processSaleButton"
                    class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md transition duration-200 ease-in-out">
                    Process Sale
                </button>
            </div>
            <p id="billing-message-area" class="text-center py-2 rounded-md mt-4"></p>
        </div>
    `;

    const billingSearchTermInput = parentEl.querySelector('#billingSearchTerm');
    const filteredInventoryResultsDiv = parentEl.querySelector('#filteredInventoryResults');
    const billItemsTableBody = parentEl.querySelector('#billItemsTableBody');
    const grandTotalDisplay = parentEl.querySelector('#grandTotalDisplay');
    const processSaleButton = parentEl.querySelector('#processSaleButton');
    const billingMessageArea = parentEl.querySelector('#billing-message-area');

    const updateFilteredInventory = () => {
        if (appState.searchTerm.length > 2) {
            appState.filteredInventory = appState.inventory.filter(item =>
                item.name.toLowerCase().includes(appState.searchTerm.toLowerCase()) ||
                item.batch.toLowerCase().includes(appState.searchTerm.toLowerCase())
            );
        } else {
            appState.filteredInventory = [];
        }
        renderFilteredInventoryTable();
    };

    const renderFilteredInventoryTable = () => {
        if (appState.filteredInventory.length === 0) {
            filteredInventoryResultsDiv.innerHTML = `<table class="min-w-full divide-y divide-gray-200"><tbody><tr><td colSpan="5" class="px-4 py-2 whitespace-nowrap text-center text-gray-500">No matching items.</td></tr></tbody></table>`;
        } else {
            filteredInventoryResultsDiv.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th class="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredInventory.map(item => `
                            <tr>
                                <td class="px-4 py-2 whitespace-nowrap">${item.name}</td>
                                <td class="px-4 py-2 whitespace-nowrap">${item.batch}</td>
                                <td class="px-4 py-2 whitespace-nowrap">PKR ${parseFloat(item.sellingPrice).toFixed(2)}</td>
                                <td class="px-4 py-2 whitespace-nowrap">${item.quantity}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right">
                                    <button data-item-id="${item.id}" class="add-to-bill-btn bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 ease-in-out">
                                        Add
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            // Attach event listeners to newly rendered "Add" buttons
            filteredInventoryResultsDiv.querySelectorAll('.add-to-bill-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const itemId = parseInt(e.target.dataset.itemId);
                    const itemToAdd = appState.inventory.find(invItem => invItem.id === itemId);
                    handleAddToBill(itemToAdd);
                });
            });
        }
    };

    const handleAddToBill = (item) => {
        const existingItemIndex = appState.billItems.findIndex(bi => bi.id === item.id);
        let updatedBillItems;

        if (existingItemIndex > -1) {
            updatedBillItems = [...appState.billItems];
            updatedBillItems[existingItemIndex].soldQuantity += 1;
            updatedBillItems[existingItemIndex].total = updatedBillItems[existingItemIndex].soldQuantity * updatedBillItems[existingItemIndex].unitPrice;
        } else {
            updatedBillItems = [
                ...appState.billItems,
                {
                    id: item.id,
                    name: item.name,
                    batch: item.batch,
                    expiryDate: item.expiryDate,
                    unitPrice: parseFloat(item.sellingPrice),
                    soldQuantity: 1,
                    total: parseFloat(item.sellingPrice)
                }
            ];
        }
        setState({ billItems: updatedBillItems, searchTerm: '' });
    };

    const handleBillItemQuantityChange = (id, newQuantity) => {
        const updatedBillItems = appState.billItems.map(item =>
            item.id === id
                ? { ...item, soldQuantity: newQuantity, total: newQuantity * item.unitPrice }
                : item
        );
        setState({ billItems: updatedBillItems });
    };

    const handleRemoveBillItem = (id) => {
        const updatedBillItems = appState.billItems.filter(item => item.id !== id);
        setState({ billItems: updatedBillItems });
    };

    const handleProcessSale = () => {
        if (appState.billItems.length === 0) {
            displayMessage('Please add items to the bill before processing.', 'error', 3000, billingMessageArea);
            return;
        }

        const newInventory = JSON.parse(JSON.stringify(appState.inventory)); // Deep copy to avoid direct mutation
        const soldItemsForRecord = [];
        let isValidSale = true;

        for (const billItem of appState.billItems) {
            const inventoryItem = newInventory.find(item => item.id === billItem.id);

            if (!inventoryItem || inventoryItem.quantity < billItem.soldQuantity) {
                displayMessage(`Not enough stock for ${billItem.name} (Batch: ${billItem.batch}). Available: ${inventoryItem ? inventoryItem.quantity : 0}, Requested: ${billItem.soldQuantity}`, 'error', 5000, billingMessageArea);
                isValidSale = false;
                break;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(inventoryItem.expiryDate);
            expiry.setHours(0, 0, 0, 0);

            if (expiry < today) {
                displayMessage(`Cannot sell expired medicine: ${billItem.name} (Batch: ${billItem.batch}). Expired on: ${inventoryItem.expiryDate}`, 'error', 5000, billingMessageArea);
                isValidSale = false;
                break;
            }
        }

        if (!isValidSale) {
            return;
        }

        for (const billItem of appState.billItems) {
            const inventoryItem = newInventory.find(item => item.id === billItem.id);
            inventoryItem.quantity -= billItem.soldQuantity;
            soldItemsForRecord.push({
                itemId: billItem.id,
                name: billItem.name,
                batch: billItem.batch,
                quantity: billItem.soldQuantity,
                unitPrice: billItem.unitPrice,
                total: billItem.total
            });
        }

        const grandTotal = appState.billItems.reduce((sum, item) => sum + item.total, 0);
        const newSale = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0], //YYYY-MM-DD
            items: soldItemsForRecord,
            grandTotal: grandTotal.toFixed(2)
        };

        setState({
            inventory: newInventory,
            sales: [...appState.sales, newSale],
            billItems: []
        });
        displayMessage('Sale processed successfully!', 'success', 3000, billingMessageArea);
    };

    billingSearchTermInput.addEventListener('input', (e) => {
        appState.searchTerm = e.target.value;
        updateFilteredInventory();
    });
    processSaleButton.addEventListener('click', handleProcessSale);

    // Initial render of filtered inventory and bill items
    updateFilteredInventory(); // Call initially to set up event listeners
    renderBillItemsTable();

    function renderBillItemsTable() {
        const grandTotal = appState.billItems.reduce((sum, item) => sum + item.total, 0);
        grandTotalDisplay.textContent = grandTotal.toFixed(2);

        if (appState.billItems.length === 0) {
            billItemsTableBody.innerHTML = `<tr><td colSpan="6" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">No items in current bill.</td></tr>`;
        } else {
            billItemsTableBody.innerHTML = appState.billItems.map(item => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.batch}</td>
                    <td class="px-6 py-4 whitespace-nowrap">PKR ${item.unitPrice.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input
                            type="number"
                            min="1"
                            value="${item.soldQuantity}"
                            data-item-id="${item.id}"
                            class="bill-quantity-input w-20 p-1 border rounded-md text-center"
                        />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">PKR ${item.total.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <button data-item-id="${item.id}" class="remove-bill-item-btn bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 ease-in-out">
                            Remove
                        </button>
                    </td>
                </tr>
            `).join('');

            billItemsTableBody.querySelectorAll('.bill-quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    handleBillItemQuantityChange(parseInt(e.target.dataset.itemId), parseInt(e.target.value));
                });
            });

            billItemsTableBody.querySelectorAll('.remove-bill-item-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    handleRemoveBillItem(parseInt(e.target.dataset.itemId));
                });
            });
        }
    }
}


function renderFinancialReports(parentEl) {
    parentEl.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Financial Reports</h2>

            <div class="mb-6 flex space-x-4 border-b pb-4">
                <button id="tab-daily"
                    class="py-2 px-4 rounded-md font-semibold ${appState.activeSection === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                    Daily Report
                </button>
                <button id="tab-recoveries"
                    class="py-2 px-4 rounded-md font-semibold ${appState.activeSection === 'recoveries' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                    Add Recoveries
                </button>
                <button id="tab-expenses"
                    class="py-2 px-4 rounded-md font-semibold ${appState.activeSection === 'expenses' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                    Add Expenses
                </button>
            </div>

            <p id="reports-message-area" class="text-center py-2 rounded-md mb-4"></p>

            <div id="reports-content">
                </div>
        </div>
    `;

    const reportsContentDiv = parentEl.querySelector('#reports-content');
    const reportsMessageArea = parentEl.querySelector('#reports-message-area');

    parentEl.querySelector('#tab-daily').addEventListener('click', () => setState({ activeSection: 'daily' }));
    parentEl.querySelector('#tab-recoveries').addEventListener('click', () => setState({ activeSection: 'recoveries' }));
    parentEl.querySelector('#tab-expenses').addEventListener('click', () => setState({ activeSection: 'expenses' }));

    displayMessage(appState.message, appState.messageType, 3000, reportsMessageArea); // Display any lingering messages

    switch (appState.activeSection) {
        case 'daily':
            renderDailyReport(reportsContentDiv, reportsMessageArea);
            break;
        case 'recoveries':
            renderAddRecoveries(reportsContentDiv, reportsMessageArea);
            break;
        case 'expenses':
            renderAddExpenses(reportsContentDiv, reportsMessageArea);
            break;
        default:
            renderDailyReport(reportsContentDiv, reportsMessageArea); // Default to daily
            break;
    }
}

function renderDailyReport(parentEl, messageArea) {
    const dailySales = appState.sales.filter(sale => sale.date === appState.reportDate);
    const dailyRecoveries = appState.recoveries.filter(rec => rec.date === appState.reportDate);
    const dailyExpenses = appState.expenses.filter(exp => exp.date === appState.reportDate);

    const totalDailySales = dailySales.reduce((sum, sale) => sum + parseFloat(sale.grandTotal), 0);
    const totalDailyRecoveries = dailyRecoveries.reduce((sum, rec) => sum + rec.amount, 0);
    const totalDailyExpenses = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const dailyNet = (totalDailySales - totalDailyRecoveries - totalDailyExpenses).toFixed(2); // Updated calculation

    parentEl.innerHTML = `
        <div class="p-4 border border-indigo-200 rounded-md bg-indigo-50">
            <h3 class="text-xl font-semibold mb-4 text-indigo-800">Daily Report Summary</h3>
            <div class="mb-4">
                <label htmlFor="reportDate" class="block text-gray-700 text-sm font-semibold mb-1">Select Date:</label>
                <input type="date" id="reportDateInput" value="${appState.reportDate}"
                    class="p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <p class="text-gray-600">Total Sales:</p>
                    <p class="text-2xl font-bold text-green-600">PKR ${totalDailySales.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <p class="text-gray-600">Total Recoveries:</p>
                    <p class="text-2xl font-bold text-blue-600">PKR ${totalDailyRecoveries.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <p class="text-gray-600">Total Expenses:</p>
                    <p class="text-2xl font-bold text-red-600">PKR ${totalDailyExpenses.toFixed(2)}</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200 text-center">
                <p class="text-gray-600">Daily Net:</p>
                <p class="text-3xl font-bold text-purple-700">PKR ${dailyNet}</p>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-indigo-800">Sales for ${appState.reportDate}</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${dailySales.length === 0 ? `<tr><td colSpan="3" class="px-6 py-4 text-center text-gray-500">No sales for this date.</td></tr>` :
                           dailySales.map(sale => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">${sale.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        ${sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${sale.grandTotal}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-indigo-800">Recoveries for ${appState.reportDate}</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${dailyRecoveries.length === 0 ? `<tr><td colSpan="3" class="px-6 py-4 text-center text-gray-500">No recoveries for this date.</td></tr>` :
                           dailyRecoveries.map(rec => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.source}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${rec.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-indigo-800">Expenses for ${appState.reportDate}</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${dailyExpenses.length === 0 ? `<tr><td colSpan="3" class="px-6 py-4 text-center text-gray-500">No expenses for this date.</td></tr>` :
                           dailyExpenses.map(exp => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.category}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${exp.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;

    parentEl.querySelector('#reportDateInput').addEventListener('change', (e) => {
        setState({ reportDate: e.target.value });
    });
}

function renderAddRecoveries(parentEl, messageArea) {
    parentEl.innerHTML = `
        <div class="p-4 border border-blue-200 rounded-md bg-blue-50">
            <h3 class="text-xl font-semibold mb-4 text-blue-800">Add New Recovery</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="recDate" class="block text-gray-700 text-sm font-semibold mb-1">Date:</label>
                    <input type="date" id="recDate" name="date" value="${appState.newRecovery.date}"
                        class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="recAmount" class="block text-gray-700 text-sm font-semibold mb-1">Amount:</label>
                    <input type="number" id="recAmount" name="amount" value="${appState.newRecovery.amount}"
                        class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div class="md:col-span-2">
                    <label htmlFor="recSource" class="block text-gray-700 text-sm font-semibold mb-1">Source/Company:</label>
                    <input type="text" id="recSource" name="source" value="${appState.newRecovery.source}"
                        class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div class="md:col-span-2">
                    <label htmlFor="recDescription" class="block text-gray-700 text-sm font-semibold mb-1">Description (Optional):</label>
                    <textarea id="recDescription" name="description"
                        class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">${appState.newRecovery.description}</textarea>
                </div>
            </div>
            <button id="addRecoveryButton"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
                Add Recovery
            </button>
        </div>
    `;

    const recDateInput = parentEl.querySelector('#recDate');
    const recAmountInput = parentEl.querySelector('#recAmount');
    const recSourceInput = parentEl.querySelector('#recSource');
    const recDescriptionInput = parentEl.querySelector('#recDescription');
    const addRecoveryButton = parentEl.querySelector('#addRecoveryButton');

    recDateInput.addEventListener('input', (e) => { appState.newRecovery.date = e.target.value; });
    recAmountInput.addEventListener('input', (e) => { appState.newRecovery.amount = e.target.value; });
    recSourceInput.addEventListener('input', (e) => { appState.newRecovery.source = e.target.value; });
    recDescriptionInput.addEventListener('input', (e) => { appState.newRecovery.description = e.target.value; });

    addRecoveryButton.addEventListener('click', () => {
        const { date, amount, source, description } = appState.newRecovery;
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || !source) {
            displayMessage('Please enter a valid amount and source for recovery.', 'error', 3000, messageArea);
            return;
        }
        const newRec = { id: Date.now(), date, amount: parseFloat(amount), source, description };
        setState({ recoveries: [...appState.recoveries, newRec], newRecovery: { date: new Date().toISOString().split('T')[0], amount: '', source: '', description: '' } });
        displayMessage('Recovery added successfully!', 'success', 3000, messageArea);
    });
}

function renderAddExpenses(parentEl, messageArea) {
    parentEl.innerHTML = `
        <div class="p-4 border border-red-200 rounded-md bg-red-50">
            <h3 class="text-xl font-semibold mb-4 text-red-800">Add New Expense</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="expDate" class="block text-gray-700 text-sm font-semibold mb-1">Date:</label>
                    <input type="date" id="expDate" name="date" value="${appState.newExpense.date}"
                        class="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500" />
                </div>
                <div>
                    <label htmlFor="expAmount" class="block text-gray-700 text-sm font-semibold mb-1">Amount:</label>
                    <input type="number" id="expAmount" name="amount" value="${appState.newExpense.amount}"
                        class="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500" />
                </div>
                <div class="md:col-span-2">
                    <label htmlFor="expCategory" class="block text-gray-700 text-sm font-semibold mb-1">Category:</label>
                    <input type="text" id="expCategory" name="category" value="${appState.newExpense.category}"
                        class="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500" />
                </div>
                <div class="md:col-span-2">
                    <label htmlFor="expDescription" class="block text-gray-700 text-sm font-semibold mb-1">Description (Optional):</label>
                    <textarea id="expDescription" name="description"
                        class="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500">${appState.newExpense.description}</textarea>
                </div>
            </div>
            <button id="addExpenseButton"
                class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
                Add Expense
            </button>
        </div>
    `;

    const expDateInput = parentEl.querySelector('#expDate');
    const expAmountInput = parentEl.querySelector('#expAmount');
    const expCategoryInput = parentEl.querySelector('#expCategory');
    const expDescriptionInput = parentEl.querySelector('#expDescription');
    const addExpenseButton = parentEl.querySelector('#addExpenseButton');

    expDateInput.addEventListener('input', (e) => { appState.newExpense.date = e.target.value; });
    expAmountInput.addEventListener('input', (e) => { appState.newExpense.amount = e.target.value; });
    expCategoryInput.addEventListener('input', (e) => { appState.newExpense.category = e.target.value; });
    expDescriptionInput.addEventListener('input', (e) => { appState.newExpense.description = e.target.value; });

    addExpenseButton.addEventListener('click', () => {
        const { date, amount, category, description } = appState.newExpense;
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || !category) {
            displayMessage('Please enter a valid amount and category for expense.', 'error', 3000, messageArea);
            return;
        }
        const newExp = { id: Date.now(), date, amount: parseFloat(amount), category, description };
        setState({ expenses: [...appState.expenses, newExp], newExpense: { date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '' } });
        displayMessage('Expense added successfully!', 'success', 3000, messageArea);
    });
}

function renderSearchReports(parentEl) {
    parentEl.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Search Previous Results</h2>

            <div class="mb-6 p-4 border border-orange-200 rounded-md bg-orange-50">
                <h3 class="text-xl font-semibold mb-4 text-orange-800">Select Date Range</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" class="block text-gray-700 text-sm font-semibold mb-1">From Date:</label>
                        <input type="date" id="startDateInput" value="${appState.startDate}"
                            class="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" class="block text-gray-700 text-sm font-semibold mb-1">To Date:</label>
                        <input type="date" id="endDateInput" value="${appState.endDate}"
                            class="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                </div>
                <p id="search-message-area" class="text-red-500 text-center mb-4"></p>
                <button id="searchButton"
                    class="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
                    Search
                </button>
            </div>

            <div id="searchResultsDisplay">
                </div>
        </div>
    `;

    const startDateInput = parentEl.querySelector('#startDateInput');
    const endDateInput = parentEl.querySelector('#endDateInput');
    const searchButton = parentEl.querySelector('#searchButton');
    const searchMessageArea = parentEl.querySelector('#search-message-area');
    const searchResultsDisplay = parentEl.querySelector('#searchResultsDisplay');

    startDateInput.addEventListener('change', (e) => { appState.startDate = e.target.value; });
    endDateInput.addEventListener('change', (e) => { appState.endDate = e.target.value; });

    const handleSearch = () => {
        if (!appState.startDate || !appState.endDate) {
            searchMessageArea.textContent = 'Please select both start and end dates for the search.';
            return;
        }
        if (new Date(appState.startDate) > new Date(appState.endDate)) {
            searchMessageArea.textContent = 'Start date cannot be after end date.';
            return;
        }

        const start = new Date(appState.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(appState.endDate);
        end.setHours(23, 59, 59, 999);

        appState.filteredSales = appState.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0, 0, 0, 0);
            return saleDate >= start && saleDate <= end;
        });

        appState.filteredRecoveries = appState.recoveries.filter(rec => {
            const recDate = new Date(rec.date);
            recDate.setHours(0, 0, 0, 0);
            return recDate >= start && recDate <= end;
        });

        appState.filteredExpenses = appState.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            expDate.setHours(0, 0, 0, 0);
            return expDate >= start && expDate <= end;
        });
        searchMessageArea.textContent = ''; // Clear message on successful search

        renderSearchResults(searchResultsDisplay);
    };

    searchButton.addEventListener('click', handleSearch);

    // Initial render of search results (if any dates are set)
    if (appState.startDate && appState.endDate) {
        handleSearch(); // Re-run search if dates were already in state
    }

    function renderSearchResults(parentEl) {
        if (!appState.startDate || !appState.endDate) {
            parentEl.innerHTML = ''; // Clear results if dates are not set
            return;
        }
        parentEl.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Search Results for ${appState.startDate} to ${appState.endDate}</h3>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Sales Records</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredSales.length === 0 ? `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No sales found for this period.</td></tr>` :
                           appState.filteredSales.map(sale => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">${sale.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${sale.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        ${sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${sale.grandTotal}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Recovery Records</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredRecoveries.length === 0 ? `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No recoveries found for this period.</td></tr>` :
                           appState.filteredRecoveries.map(rec => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.source}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${rec.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Expense Records</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredExpenses.length === 0 ? `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No expenses found for this period.</td></tr>` :
                           appState.filteredExpenses.map(exp => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.category}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${exp.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    }
}


// --- Main Application Render Function ---
function renderApp() {
    const appRoot = document.getElementById('app-root');

    if (appState.isLoggedIn) {
        renderDashboard(appRoot);
    } else {
        renderLoginPage(appRoot);
    }
    saveStateToLocalStorage(); // Save state after every render
}

// --- Initial Application Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage();
    renderApp();
});


// Helper function for displaying messages specific to a container (e.g., inventory form)
function displayMessage(msg, type, duration = 3000, targetElement) {
    if (!targetElement) {
        console.error("Target message element not provided for displayMessage.");
        return;
    }
    targetElement.textContent = msg;
    targetElement.className = `text-center py-2 rounded-md ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    if (msg) {
        setTimeout(() => {
            targetElement.textContent = '';
            targetElement.className = '';
        }, duration);
    }
}
/**
 * Shop Stock Application
 * Manages inventory with client-side localStorage persistence.
 */

// Storage Key
const STORAGE_KEY = 'shop_stock_items_v1';

// Application State
let stockItems = [];
let editingId = null;
let searchQuery = '';

// DOM Elements
const stockForm = document.getElementById('stockForm');
const formTitle = document.getElementById('formTitle');
const editingBadge = document.getElementById('editingBadge');
const editItemId = document.getElementById('editItemId');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemQuantityInput = document.getElementById('itemQuantity');
const submitBtnText = document.getElementById('submitBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const itemNameError = document.getElementById('itemNameError');
const itemPriceError = document.getElementById('itemPriceError');
const itemQuantityError = document.getElementById('itemQuantityError');

const totalItemsCount = document.getElementById('totalItemsCount');
const totalUnitsCount = document.getElementById('totalUnitsCount');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

const stockListContainer = document.getElementById('stockListContainer');
const emptyState = document.getElementById('emptyState');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateMessage = document.getElementById('emptyStateMessage');

// ==========================================================================
// Initialization & Storage
// ==========================================================================

function initApp() {
  loadFromStorage();
  attachEventListeners();
  render();
}

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    stockItems = data ? JSON.parse(data) : [];
    if (!Array.isArray(stockItems)) {
      stockItems = [];
    }
  } catch (error) {
    console.error('Error loading stock items from localStorage:', error);
    stockItems = [];
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stockItems));
  } catch (error) {
    console.error('Error saving stock items to localStorage:', error);
    alert('Unable to save data. Browser storage might be full.');
  }
}

// ==========================================================================
// Event Listeners
// ==========================================================================

function attachEventListeners() {
  stockForm.addEventListener('submit', handleFormSubmit);
  cancelEditBtn.addEventListener('click', cancelEditing);

  // Search input events
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
    render();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    render();
  });

  // Clear validation errors on typing
  itemNameInput.addEventListener('input', () => clearFieldError(itemNameInput, itemNameError));
  itemPriceInput.addEventListener('input', () => clearFieldError(itemPriceInput, itemPriceError));
  itemQuantityInput.addEventListener('input', () => clearFieldError(itemQuantityInput, itemQuantityError));
}

// ==========================================================================
// Validation Helpers
// ==========================================================================

function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('input-error');
  errorEl.textContent = message;
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('input-error');
  errorEl.textContent = '';
}

function clearAllErrors() {
  clearFieldError(itemNameInput, itemNameError);
  clearFieldError(itemPriceInput, itemPriceError);
  clearFieldError(itemQuantityInput, itemQuantityError);
}

function validateInputs(name, price, quantity) {
  let isValid = true;
  clearAllErrors();

  if (!name.trim()) {
    showFieldError(itemNameInput, itemNameError, 'Please enter an item name.');
    isValid = false;
  }

  if (isNaN(price) || price === null || price < 0) {
    showFieldError(itemPriceInput, itemPriceError, 'Enter a valid price ($0 or greater).');
    isValid = false;
  }

  if (isNaN(quantity) || quantity === null || quantity < 0 || !Number.isInteger(quantity)) {
    showFieldError(itemQuantityInput, itemQuantityError, 'Enter a whole number (0 or greater).');
    isValid = false;
  }

  return isValid;
}

// ==========================================================================
// Form Submission (Add / Update)
// ==========================================================================

function handleFormSubmit(e) {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const price = itemPriceInput.value === '' ? NaN : parseFloat(itemPriceInput.value);
  const quantity = itemQuantityInput.value === '' ? NaN : Number(itemQuantityInput.value);

  if (!validateInputs(name, price, quantity)) {
    return;
  }

  if (editingId) {
    // Update existing item
    const itemIndex = stockItems.findIndex(item => item.id === editingId);
    if (itemIndex !== -1) {
      stockItems[itemIndex].name = name;
      stockItems[itemIndex].price = price;
      stockItems[itemIndex].quantity = quantity;
      stockItems[itemIndex].updatedAt = Date.now();
    }
    cancelEditing();
  } else {
    // Add new stock item
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      price: price,
      quantity: quantity,
      createdAt: Date.now()
    };
    stockItems.unshift(newItem); // Place newest at top
    resetForm();
  }

  saveToStorage();
  render();
}

// ==========================================================================
// Edit Operations
// ==========================================================================

function startEditing(id) {
  const item = stockItems.find(i => i.id === id);
  if (!item) return;

  editingId = id;
  editItemId.value = item.id;
  itemNameInput.value = item.name;
  itemPriceInput.value = item.price;
  itemQuantityInput.value = item.quantity;

  formTitle.textContent = 'Edit Stock Item';
  submitBtnText.textContent = 'Update Stock';
  cancelEditBtn.style.display = 'inline-flex';
  editingBadge.style.display = 'inline-block';

  clearAllErrors();
  render();

  // Scroll smoothly to form and focus input (great for mobile)
  stockForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  itemNameInput.focus();
}

function cancelEditing() {
  editingId = null;
  resetForm();
  formTitle.textContent = 'Add New Stock';
  submitBtnText.textContent = 'Add Stock';
  cancelEditBtn.style.display = 'none';
  editingBadge.style.display = 'none';
  clearAllErrors();
  render();
}

function resetForm() {
  stockForm.reset();
  editItemId.value = '';
}

// ==========================================================================
// Delete Operation (With Confirmation)
// ==========================================================================

function deleteStockItem(id) {
  const item = stockItems.find(i => i.id === id);
  if (!item) return;

  const confirmed = window.confirm(`Are you sure you want to delete "${item.name}" from your stock?`);
  if (!confirmed) return;

  // If deleting the item currently being edited, cancel edit mode
  if (editingId === id) {
    cancelEditing();
  }

  stockItems = stockItems.filter(i => i.id !== id);
  saveToStorage();
  render();
}

// ==========================================================================
// Rendering
// ==========================================================================

function formatCurrency(amount) {
  return '$' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getBadgeHtml(quantity) {
  if (quantity === 0) {
    return `<span class="item-stock-badge badge-out-of-stock">Out of stock (0 left)</span>`;
  }
  if (quantity <= 3) {
    return `<span class="item-stock-badge badge-low-stock">Low stock (${quantity} left)</span>`;
  }
  return `<span class="item-stock-badge badge-in-stock">In stock (${quantity} left)</span>`;
}

function render() {
  // 1. Update stats at the top
  const totalItems = stockItems.length;
  const totalUnits = stockItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  totalItemsCount.textContent = totalItems.toLocaleString();
  totalUnitsCount.textContent = totalUnits.toLocaleString();

  // 2. Filter items based on search query
  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery)
  );

  // 3. Clear container
  stockListContainer.innerHTML = '';

  // 4. Handle Empty States
  if (stockItems.length === 0) {
    emptyState.style.display = 'block';
    emptyStateTitle.textContent = 'No stock items yet';
    emptyStateMessage.textContent = 'Add your first item using the form above to start tracking your stock.';
    return;
  }

  if (filteredItems.length === 0) {
    emptyState.style.display = 'block';
    emptyStateTitle.textContent = 'No matching items';
    emptyStateMessage.textContent = `No stock items match your search "${searchQuery}".`;
    return;
  }

  emptyState.style.display = 'none';

  // 5. Render filtered items
  filteredItems.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'stock-item' + (item.id === editingId ? ' is-editing' : '');

    // Main header of item
    const itemMain = document.createElement('div');
    itemMain.className = 'item-main';

    const itemTitle = document.createElement('h3');
    itemTitle.className = 'item-title';
    itemTitle.textContent = item.name;

    const itemPrice = document.createElement('div');
    itemPrice.className = 'item-price';
    itemPrice.textContent = formatCurrency(item.price);

    itemMain.appendChild(itemTitle);
    itemMain.appendChild(itemPrice);

    // Details & Actions row
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';

    const badgeContainer = document.createElement('div');
    badgeContainer.innerHTML = getBadgeHtml(item.quantity);

    const itemActions = document.createElement('div');
    itemActions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-sm btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.title = `Edit ${item.name}`;
    editBtn.addEventListener('click', () => startEditing(item.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-sm btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.title = `Delete ${item.name}`;
    deleteBtn.addEventListener('click', () => deleteStockItem(item.id));

    itemActions.appendChild(editBtn);
    itemActions.appendChild(deleteBtn);

    itemDetails.appendChild(badgeContainer);
    itemDetails.appendChild(itemActions);

    itemEl.appendChild(itemMain);
    itemEl.appendChild(itemDetails);

    stockListContainer.appendChild(itemEl);
  });
}

// Start app on DOM ready
document.addEventListener('DOMContentLoaded', initApp);


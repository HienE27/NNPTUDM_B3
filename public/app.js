/**
 * Product Dashboard - JavaScript Module
 * Tổ chức theo module pattern, dễ maintain và mở rộng
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
    API_URL: 'https://api.escuelajs.co/api/v1/products',
    DEFAULT_ITEMS_PER_PAGE: 10,
    DEBOUNCE_DELAY: 300, // ms
};

// ========================================
// State Management
// ========================================
const state = {
    allProducts: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: CONFIG.DEFAULT_ITEMS_PER_PAGE,
    searchTerm: '',
    sortColumn: 'id',
    sortDirection: 'asc',
    isLoading: false,
};

// ========================================
// Utility Functions
// ========================================

/**
 * Debounce function cho search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

/**
 * Create product row element
 */
function createProductRow(product) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-description', escapeHtml(product.description || ''));
    tr.innerHTML = `
        <td>${product.id}</td>
        <td>${escapeHtml(product.title)}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>
            <img 
                src="${product.images[0]}" 
                alt="${escapeHtml(product.title)}"
                class="table-image"
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/150x150?text=No+Image'"
            >
        </td>
    `;
    return tr;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// API Functions
// ========================================

/**
 * Fetch all products from API
 */
async function fetchProducts() {
    try {
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// ========================================
// Render Functions
// ========================================

/**
 * Render products to table
 */
function renderProducts() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const productsToRender = state.filteredProducts.slice(startIndex, endIndex);

    if (productsToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem;">
                    Không tìm thấy sản phẩm nào
                </td>
            </tr>
        `;
        return;
    }

    productsToRender.forEach(product => {
        const tr = createProductRow(product);
        tbody.appendChild(tr);
    });
}

/**
 * Render pagination info
 */
function renderPaginationInfo() {
    const pageInfo = document.getElementById('pageInfo');
    if (!pageInfo) return;

    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage) || 1;
    const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endItem = Math.min(state.currentPage * state.itemsPerPage, state.filteredProducts.length);

    if (state.filteredProducts.length === 0) {
        pageInfo.textContent = 'Trang 0 / 0 (0 sản phẩm)';
    } else {
        pageInfo.textContent = `Trang ${state.currentPage} / ${totalPages} (${startItem}-${endItem}/${state.filteredProducts.length})`;
    }
}

/**
 * Update pagination buttons
 */
function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage) || 1;

    if (prevBtn) {
        prevBtn.disabled = state.currentPage === 1 || state.filteredProducts.length === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = state.currentPage === totalPages || state.filteredProducts.length === 0;
    }
}

// ========================================
// Filter & Search Functions
// ========================================

/**
 * Apply all filters to products
 */
function applyFilters() {
    let filtered = [...state.allProducts];

    // Apply search filter
    if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(term)
        );
    }

    state.filteredProducts = filtered;
    state.currentPage = 1; // Reset to first page

    renderProducts();
    renderPaginationInfo();
    updatePaginationButtons();
}

/**
 * Handle search input
 */
function handleSearch(event) {
    state.searchTerm = event.target.value;
    applyFilters();
}

/**
 * Handle items per page change
 */
function handleItemsPerPageChange(event) {
    state.itemsPerPage = parseInt(event.target.value, 10);
    state.currentPage = 1;
    renderProducts();
    renderPaginationInfo();
    updatePaginationButtons();
}

/**
 * Change page
 */
function changePage(direction) {
    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage) || 1;
    const newPage = state.currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        state.currentPage = newPage;
        renderProducts();
        renderPaginationInfo();
        updatePaginationButtons();

        // Scroll to top of table
        document.querySelector('.table-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ========================================
// Sort Functions
// ========================================

/**
 * Sort products by column
 */
function sortProducts(column, type) {
    // Toggle sort direction if same column, otherwise default to ascending
    if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = column;
        state.sortDirection = 'asc';
    }

    // Update header indicators
    updateSortIndicators(column, state.sortDirection);

    // Apply sort
    state.filteredProducts.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        // Handle different data types
        if (type === 'number') {
            valueA = parseFloat(valueA) || 0;
            valueB = parseFloat(valueB) || 0;
        } else if (type === 'string') {
            valueA = String(valueA || '').toLowerCase();
            valueB = String(valueB || '').toLowerCase();
        }

        // Compare values
        if (valueA < valueB) {
            return state.sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return state.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // Re-render
    renderProducts();
}

/**
 * Update sort indicators in table headers
 */
function updateSortIndicators(activeColumn, direction) {
    const headers = document.querySelectorAll('th.sortable');
    headers.forEach(th => {
        const column = th.dataset.sort;
        if (column === activeColumn) {
            th.dataset.sort = direction;
        } else {
            th.removeAttribute('data-sort');
        }
    });
}

/**
 * Handle sort click on table header
 */
function handleSort(event) {
    const th = event.currentTarget;
    const column = th.dataset.sort;
    const type = th.dataset.type || 'string';

    if (column) {
        sortProducts(column, type);
    }
}

// ========================================
// Event Listeners Setup
// ========================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    if (searchInput) {
        // Use debounce for better performance
        const debouncedSearch = debounce(handleSearch, CONFIG.DEBOUNCE_DELAY);
        searchInput.addEventListener('input', debouncedSearch);
    }

    // Items per page select
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
    }

    // Pagination buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(-1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(1));
    }

    // Sortable table headers
    const sortableHeaders = document.querySelectorAll('th.sortable');
    sortableHeaders.forEach(th => {
        th.addEventListener('click', handleSort);
        // Add cursor pointer via CSS class
        th.style.cursor = 'pointer';
    });
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the application
 */
async function init() {
    state.isLoading = true;

    // Show loading state
    const tbody = document.getElementById('productTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem;">
                    Đang tải dữ liệu...
                </td>
            </tr>
        `;
    }

    // Fetch products
    state.allProducts = await fetchProducts();
    state.filteredProducts = [...state.allProducts];
    state.isLoading = false;

    // Setup event listeners
    setupEventListeners();

    // Initial render
    renderProducts();
    renderPaginationInfo();
    updatePaginationButtons();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export functions for global use (if needed)
window.handleSearch = handleSearch;
window.handleItemsPerPageChange = handleItemsPerPageChange;
window.changePage = changePage;
window.handleSort = handleSort;

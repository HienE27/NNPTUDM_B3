// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;

// Hàm getAll - Lấy tất cả sản phẩm từ API
async function getAll() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Khởi tạo ứng dụng
async function init() {
    // Gọi hàm getAll để lấy dữ liệu
    allProducts = await getAll();
    filteredProducts = [...allProducts];
    
    // Hiển thị sản phẩm
    renderProducts();
}

// Render sản phẩm theo trang hiện tại
function renderProducts() {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    
    // Tính toán vị trí dữ liệu cho phân trang
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    // Render từng sản phẩm
    productsToShow.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td><img src="${product.images[0]}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/150'"></td>
            <td data-description="${product.description}">${product.description}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Cập nhật thông tin phân trang
    updatePagination();
}

// Cập nhật thông tin phân trang
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Chuyển trang
function changePage(direction) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderProducts();
    }
}

// Thay đổi số sản phẩm mỗi trang
function handleItemsPerPageChange(event) {
    itemsPerPage = parseInt(event.target.value);
    currentPage = 1;
    renderProducts();
}

// Tìm kiếm theo title
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Sắp xếp theo title
function sortByTitle(direction) {
    filteredProducts.sort((a, b) => {
        if (direction === 'asc') {
            return a.title.localeCompare(b.title);
        } else {
            return b.title.localeCompare(a.title);
        }
    });
    renderProducts();
}

// Sắp xếp theo price
function sortByPrice(direction) {
    filteredProducts.sort((a, b) => {
        if (direction === 'asc') {
            return a.price - b.price;
        } else {
            return b.price - a.price;
        }
    });
    renderProducts();
}

// Chạy ứng dụng khi trang được tải
document.addEventListener('DOMContentLoaded', init);


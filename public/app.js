// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State variables
let allProducts = [];

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
    
    // Hiển thị sản phẩm
    renderProducts();
}

// Render tất cả sản phẩm
function renderProducts() {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    
    // Render từng sản phẩm
    allProducts.forEach(product => {
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
}

// Chạy ứng dụng khi trang được tải
document.addEventListener('DOMContentLoaded', init);

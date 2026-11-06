
import { useState, useEffect, useMemo } from "react";
import "./App.css";

// Header Component
function Header({ cartCount }) {
  return (
    <header className="header">
      <h2>MyShop</h2>
      <h3>🛒 Cart: {cartCount}</h3>
    </header>
  );
}

// Product Card Component
function ProductCard({ product, user, onDetails, onAdd }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.title} />

      <h3>{product.title}</h3>

      <p className="price">${product.price}</p>

      <p>Category: {product.category}</p>

      <div className="user-info">
        <img src={user.picture.thumbnail} alt={user.name.first} />
        <span>
          {user.name.first} {user.name.last}
        </span>
      </div>

      <button onClick={() => onDetails(product)}>
        View Details
      </button>

      <button onClick={() => onAdd(product)}>
        Add to Cart
      </button>
    </div>
  );
}

// Product Details Modal
function ProductModal({ product, onClose, onAdd }) {
  if (!product) return null;

  return (
    <div className="modal-background" onClick={onClose}>
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        <img src={product.image} alt={product.title} />

        <h2>{product.title}</h2>

        <h3>${product.price}</h3>

        <p>{product.description}</p>

        <p>Category: {product.category}</p>

        <button onClick={() => onAdd(product)}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  const [page, setPage] = useState(1);

  const productsPerPage = 8;

  // Fetch both APIs
  useEffect(() => {
    async function fetchData() {
      try {
        const [productResponse, userResponse] = await Promise.all([
          fetch("https://fakestoreapi.com/products"),
          fetch("https://randomuser.me/api/?results=10"),
        ]);

        if (!productResponse.ok || !userResponse.ok) {
          throw new Error("API request failed");
        }

        const productData = await productResponse.json();
        const userData = await userResponse.json();

        setProducts(productData);
        setUsers(userData.results);
      } catch (error) {
        setError("Unable to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Save cart in localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Add product to cart
  function addToCart(product) {
    setCart((previousCart) => {
      const existingProduct = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previousCart, { ...product, quantity: 1 }];
    });
  }

  // Remove product from cart
  function removeFromCart(productId) {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== productId)
    );
  }

  // Category list
  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((item) => item.category))];
  }, [products]);

  // Search, filter and sort
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) =>
      product.title.toLowerCase().includes(search.toLowerCase())
    );

    if (category !== "All") {
      result = result.filter(
        (product) => product.category === category
      );
    }

    if (sort === "low") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, category, sort]);

  // Pagination
  const totalPages = Math.ceil(
    filteredProducts.length / productsPerPage
  );

  const currentProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  // Loading and error
  if (loading) {
    return <h2 className="message">Loading products...</h2>;
  }

  if (error) {
    return <h2 className="message">{error}</h2>;
  }

  return (
    <div>
      <Header
        cartCount={cart.reduce(
          (total, item) => total + item.quantity,
          0
        )}
      />

      <main className="container">
        <h1>Our Products</h1>

        {/* Search and Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Sort by Price</option>
            <option value="low">Low to High</option>
            <option value="high">High to Low</option>
          </select>
        </div>

        {/* Product Listing */}
        <div className="product-container">
          {currentProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              user={users[index % users.length]}
              onDetails={setSelectedProduct}
              onAdd={addToCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <h3 className="message">No products found.</h3>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages || 1}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>

        {/* Cart Items */}
        <div className="cart-section">
          <h2>Shopping Cart</h2>

          {cart.length === 0 && <p>Your cart is empty.</p>}

          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <span>
                {item.title} × {item.quantity}
              </span>

              <button onClick={() => removeFromCart(item.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
    </div>
  );
}

export default App;

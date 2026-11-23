const SUPABASE_URL = "https://ihtgcjuxotrncnqrnwji.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hrji8iYJpP8LYL79WtNYYw_kz3_TiAq";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
const phoneNumber = "233242669790";

let cart = [];

const products = [
  { name: "Wireless Earbuds", price: null },
  { name: "Smart Watches", price: null },
  { name: "Bluetooth Speakers", price: null },
  { name: "Power Banks", price: null }
];

// Add a shopping button to each product
document.querySelectorAll(".products article").forEach((card, index) => {
  const button = document.createElement("button");

  button.textContent = "Add to Cart +";
  button.className = "button";
  button.style.margin = "12px";
  button.style.padding = "10px";
  button.style.cursor = "pointer";

  button.addEventListener("click", () => {
    const product = products[index];

    const existing = cart.find(
      item => item.name === product.name
    );

    if (existing) {
      existing.quantity++;
    } else {
      cart.push({
        ...product,
        quantity: 1
      });
    }

    updateCart();
    button.textContent = "Added ✓";

    setTimeout(() => {
      button.textContent = "Add to Cart +";
    }, 1000);
  });

  card.appendChild(button);
});

// Create the cart display
const cartPanel = document.createElement("section");

cartPanel.id = "nova-cart";
cartPanel.className = "section";

cartPanel.innerHTML = `
  <p class="eyebrow">YOUR SELECTION</p>
  <h2>Your Shopping Cart</h2>
  <div id="cart-items">Your cart is empty.</div>
  <button id="clear-cart" class="button">
    Clear Cart
  </button>
  <button id="checkout" class="button">
    Proceed to Checkout
  </button>
`;

document.querySelector("main").appendChild(cartPanel);

// Update cart contents
function updateCart() {
  const container = document.querySelector("#cart-items");

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div style="
      padding:14px;
      margin:10px 0;
      background:#111927;
      border:1px solid #27364b;
      border-radius:8px;
    ">
      <strong>${item.name}</strong>
      <p>Quantity: ${item.quantity}</p>
      <p>Price: To be confirmed</p>
      <button class="button remove-item" data-index="${index}">
        Remove
      </button>
    </div>
  `).join("");

  document.querySelectorAll(".remove-item").forEach(button => {
    button.addEventListener("click", () => {
      cart.splice(Number(button.dataset.index), 1);
      updateCart();
    });
  });
}

// Clear the cart
document.querySelector("#clear-cart").addEventListener("click", () => {
  cart = [];
  updateCart();
});

// Create checkout form
document.querySelector("#checkout").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Please add a product to your cart first.");
    return;
  }

  const form = document.createElement("form");

  form.innerHTML = `
    <h2>Delivery Details</h2>

    <label>Full name</label>
    <input name="name" required
      placeholder="Your full name"
      style="display:block;width:100%;padding:12px;margin:8px 0">

    <label>Phone number</label>
    <input name="phone" required
      placeholder="Your phone number"
      style="display:block;width:100%;padding:12px;margin:8px 0">

    <label>Region</label>
    <select name="region" required
      style="display:block;width:100%;padding:12px;margin:8px 0">
      <option value="">Choose your region</option>
      <option>Greater Accra</option>
      <option>Ashanti</option>
      <option>Central</option>
      <option>Eastern</option>
      <option>Western</option>
      <option>Western North</option>
      <option>Volta</option>
      <option>Oti</option>
      <option>Northern</option>
      <option>Savannah</option>
      <option>North East</option>
      <option>Upper East</option>
      <option>Upper West</option>
      <option>Bono</option>
      <option>Bono East</option>
      <option>Ahafo</option>
    </select>

    <label>Town / Community</label>
    <input name="town" required
      placeholder="Enter your town"
      style="display:block;width:100%;padding:12px;margin:8px 0">

    <label>Detailed delivery address</label>
    <textarea name="address" required
      placeholder="Enter your delivery address"
      style="display:block;width:100%;padding:12px;margin:8px 0"></textarea>

    <label>Preferred payment method</label>
    <select name="payment" required
      style="display:block;width:100%;padding:12px;margin:8px 0">
      <option value="">Choose payment method</option>
      <option>MTN MoMo</option>
      <option>Telecel Cash</option>
      <option>Cash on Delivery</option>
    </select>

    <button class="button" type="submit">
      Send Order Request
    </button>
  `;

  const existingForm = document.querySelector("#checkout-form");

  if (existingForm) existingForm.remove();

  form.id = "checkout-form";
  cartPanel.appendChild(form);

  form.scrollIntoView({ behavior: "smooth" });

  form.addEventListener("submit", event => {
    event.preventDefault();

    const details = new FormData(form);

    const orderItems = cart.map(item =>
      `${item.name} x ${item.quantity} (price to confirm)`
    ).join("\n");

    const message = `
NEW ORDER REQUEST - NOVA GADGET STORE

Customer: ${details.get("name")}
Phone: ${details.get("phone")}
Region: ${details.get("region")}
Town: ${details.get("town")}
Address: ${details.get("address")}

Preferred payment: ${details.get("payment")}

ORDER ITEMS:
${orderItems}

Please confirm product availability, prices and delivery fee before payment.
`;

    const whatsappURL =
      "https://wa.me/" + phoneNumber +
      "?text=" + encodeURIComponent(message);

    window.open(whatsappURL, "_blank");

    alert("Your WhatsApp order request is ready. Please send it to complete your request.");
  });
});

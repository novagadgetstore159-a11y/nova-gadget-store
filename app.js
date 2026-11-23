
const SUPABASE_URL = "https://ihtgcjuxotrncnqrnwji.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_hrji8iYJpP8LYL79WtNYYw_kz3_TiAq";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const phoneNumber = "233242669790";

let cart = [];
let deliveryZones = null;

const products = [
  { name: "Wireless Earbuds", price: null },
  { name: "Smart Watches", price: null },
  { name: "Bluetooth Speakers", price: null },
  { name: "Power Banks", price: null }
];

function formatGHS(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2
  }).format(amount);
}

// Retrieve active delivery locations from Supabase
async function loadDeliveryZones() {
  if (deliveryZones !== null) {
    return deliveryZones;
  }

  const { data, error } = await supabaseClient
    .from("delivery_zones")
    .select("id, region, location_name, delivery_fee")
    .eq("is_active", true)
    .order("region")
    .order("location_name");

  if (error) {
    console.error("Delivery locations error:", error);
    throw new Error("Unable to load delivery locations.");
  }

  deliveryZones = data || [];
  return deliveryZones;
}

// Add shopping buttons to products
document.querySelectorAll(".products article").forEach((card, index) => {
  const product = products[index];

  if (!product) return;

  const button = document.createElement("button");

  button.textContent = "Add to Cart +";
  button.className = "button";
  button.style.margin = "12px";
  button.style.padding = "10px";
  button.style.cursor = "pointer";

  button.addEventListener("click", () => {
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

// Create shopping cart
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

// Update cart display
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
      <p>Product price: To be confirmed</p>

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

// Clear cart
document.querySelector("#clear-cart").addEventListener("click", () => {
  cart = [];
  updateCart();

  const form = document.querySelector("#checkout-form");
  if (form) form.remove();
});

// Create checkout form
document.querySelector("#checkout").addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Please add a product to your cart first.");
    return;
  }

  const existingForm = document.querySelector("#checkout-form");
  if (existingForm) existingForm.remove();

  let zones;

  try {
    zones = await loadDeliveryZones();
  } catch (error) {
    alert("We could not load delivery prices. Please try again.");
    return;
  }

  if (zones.length === 0) {
    alert("No active delivery locations are currently available.");
    return;
  }

  const form = document.createElement("form");
  form.id = "checkout-form";

  form.innerHTML = `
    <h2>Delivery Details</h2>

    <label>Full name</label>
    <input name="name" required
      placeholder="Your full name"
      style="display:block;width:100%;padding:12px;margin:8px 0">

    <label>Phone number</label>
    <input name="phone" type="tel" required
      placeholder="Your phone number"
      style="display:block;width:100%;padding:12px;margin:8px 0">

    <label>Region</label>
    <select name="region" required
      style="display:block;width:100%;padding:12px;margin:8px 0">
      <option value="">Choose your region</option>
    </select>

    <label>Delivery location</label>
    <select name="location" required disabled
      style="display:block;width:100%;padding:12px;margin:8px 0">
      <option value="">Choose your delivery location</option>
    </select>

    <div id="delivery-preview" style="
      padding:14px;
      margin:12px 0;
      background:#111927;
      border:1px solid #27364b;
      border-radius:8px;
    ">
      <p>Select your delivery location to see the fee.</p>
    </div>

    <label>Detailed delivery address</label>
    <textarea name="address" required
      placeholder="House number, street, landmark, etc."
      style="display:block;width:100%;padding:12px;margin:8px 0"></textarea>

    <label>Preferred payment method</label>
    <select name="payment" required
      style="display:block;width:100%;padding:12px;margin:8px 0">
      <option value="">Choose payment method</option>
      <option>MTN MoMo</option>
      <option>Telecel Cash</option>
      <option>Cash on Delivery</option>
    </select>

    <p style="font-size:13px;color:#aaa">
      Product prices will be confirmed before payment.
    </p>

    <button class="button" type="submit">
      Send Order Request
    </button>
  `;

  cartPanel.appendChild(form);

  const regionSelect = form.querySelector('[name="region"]');
  const locationSelect = form.querySelector('[name="location"]');
  const preview = form.querySelector("#delivery-preview");

  // Populate available regions
  const regions = [...new Set(zones.map(zone => zone.region))];

  regions.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });

  let selectedZone = null;

  // Update locations when region changes
  regionSelect.addEventListener("change", () => {
    selectedZone = null;

    locationSelect.innerHTML =
      '<option value="">Choose your delivery location</option>';

    locationSelect.disabled = true;

    preview.innerHTML = `
      <p>Select your delivery location to see the fee.</p>
    `;

    const matchingZones = zones.filter(
      zone => zone.region === regionSelect.value
    );

    matchingZones.forEach(zone => {
      const option = document.createElement("option");
      option.value = zone.id;
      option.textContent = zone.location_name;
      locationSelect.appendChild(option);
    });

    locationSelect.disabled = matchingZones.length === 0;
  });

  // Calculate and display delivery fee
  locationSelect.addEventListener("change", () => {
    selectedZone = zones.find(
      zone => String(zone.id) === locationSelect.value
    );

    if (!selectedZone) {
      preview.innerHTML = `
        <p>Select a delivery location.</p>
      `;
      return;
    }

    const fee = Number(selectedZone.delivery_fee);

    if (!Number.isFinite(fee) || fee < 0) {
      selectedZone = null;
      preview.innerHTML = `
        <p>Delivery fee is unavailable for this location.</p>
      `;
      return;
    }

    preview.innerHTML = `
      <p><strong>Delivery location:</strong>
        ${selectedZone.location_name}</p>
      <p><strong>Delivery fee:</strong>
        ${formatGHS(fee)}</p>
    `;
  });

  form.scrollIntoView({ behavior: "smooth" });

  // Submit order request to WhatsApp
  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!selectedZone) {
      alert("Please select a valid delivery location.");
      return;
    }

    const details = new FormData(form);

    const fee = Number(selectedZone.delivery_fee);

    const orderItems = cart.map(item =>
      `${item.name} x ${item.quantity} (price to confirm)`
    ).join("\n");

    const message = `
NEW ORDER REQUEST - NOVA GADGET STORE

Customer: ${details.get("name")}
Phone: ${details.get("phone")}

Region: ${selectedZone.region}
Delivery location: ${selectedZone.location_name}
Detailed address: ${details.get("address")}

Delivery fee: ${formatGHS(fee)}

Preferred payment: ${details.get("payment")}

ORDER ITEMS:
${orderItems}

Please confirm product availability and product prices before payment.

Delivery fee retrieved from the store's delivery system.
`;

    const whatsappURL =
      "https://wa.me/" + phoneNumber +
      "?text=" + encodeURIComponent(message);

    window.open(whatsappURL, "_blank");

    alert(
      "Your order request is ready. Please send the WhatsApp message to complete your request."
    );
  });
});

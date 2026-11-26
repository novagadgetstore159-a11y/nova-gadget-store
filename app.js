
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

let products = [];

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


// Load products from Supabase and display them
async function loadProducts() {
  const container = document.querySelector(".products");

  container.innerHTML = "<p>Loading products...</p>";

  const { data, error } = await supabaseClient
    .from("products")
    .select("id, name, description, category, price, stock_quantity, image_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products loading error:", error);
    container.innerHTML = "<p>Unable to load products. Please try again later.</p>";
    return;
  }

  products = data || [];
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products available at the moment.</p>";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("article");

    const image = document.createElement("div");
    image.className = "product-image";

    if (product.image_url) {
      const img = document.createElement("img");
      img.src = product.image_url;
      img.alt = product.name;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      image.appendChild(img);
    } else {
      image.textContent = "📦";
    }

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = formatGHS(Number(product.price));

    const button = document.createElement("button");
    button.className = "button";

    const outOfStock = Number(product.stock_quantity) <= 0;
    button.textContent = outOfStock ? "Out of Stock" : "Add to Cart +";
    button.disabled = outOfStock;

    button.addEventListener("click", () => {
      const existing = cart.find(item => item.id === product.id);

      if (existing) {
        if (existing.quantity >= Number(product.stock_quantity)) {
          alert("Sorry, there is not enough stock available.");
          return;
        }
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

    card.appendChild(image);
    card.appendChild(name);
    card.appendChild(description);
    card.appendChild(price);
    card.appendChild(button);

    container.appendChild(card);
  });
}

loadProducts();


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
      <p>Product price: ${formatGHS(Number(item.price))}</p>

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
<div id="custom-location-container" style="display:none">
  <label>Enter your town or community</label>
  <input
    id="custom-location"
    type="text"
    placeholder="Enter your exact delivery location"
    style="display:block;width:100%;padding:12px;margin:8px 0"
  >
</div>
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

  
// Populate all 16 regions of Ghana
const regions = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North"
];

regions.forEach(region => {
  const option = document.createElement("option");
  option.value = region;
  option.textContent = region;
  regionSelect.appendChild(option);
});


  let selectedZone = null;
const customContainer = form.querySelector("#custom-location-container");
const customInput = form.querySelector("#custom-location");

// Update locations when region changes
regionSelect.addEventListener("change", () => {
    selectedZone = null;
    customInput.value = "";
    customContainer.style.display = "none";
    customInput.required = false;

    locationSelect.innerHTML =
        '<option value="">Choose your delivery location</option>';

    preview.innerHTML =
        "<p>Select your delivery location to see the fee.</p>";

    if (regionSelect.value === "Greater Accra") {
        // Show the predefined Greater Accra locations
        locationSelect.disabled = false;
        locationSelect.required = true;

        const matchingZones = zones.filter(
            zone => zone.region === "Greater Accra"
        );

        matchingZones.forEach(zone => {
            const option = document.createElement("option");
            option.value = zone.id;
            option.textContent = zone.location_name;
            locationSelect.appendChild(option);
        });

        // Allow customers to enter an unlisted Greater Accra location
        const otherOption = document.createElement("option");
        otherOption.value = "other";
        otherOption.textContent = "Other";
        locationSelect.appendChild(otherOption);

} else if (regionSelect.value !== "") {
        // For all other regions, allow manual location entry
        locationSelect.disabled = true;
        locationSelect.required = false;

        customContainer.style.display = "block";
        customInput.required = true;

        preview.innerHTML =
            "<p>Enter your town or community. Delivery fee will be confirmed by Nova Gadget Store.</p>";

    } else {
        locationSelect.disabled = true;
        locationSelect.required = false;
    }
});


  // Calculate and display delivery fee

locationSelect.addEventListener("change", () => {
    selectedZone = null;
    customInput.value = "";

    // If customer selects Other in Greater Accra
    if (locationSelect.value === "other") {
        customContainer.style.display = "block";
        customInput.required = true;

        preview.innerHTML = `
            <p>Enter your town or community.</p>
            <p>Delivery fee will be confirmed by Nova Gadget Store.</p>
        `;
        return;
    }

    // Hide custom location field for listed locations
    customContainer.style.display = "none";
    customInput.required = false;

    // Find the selected Greater Accra location
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
        <p><strong>Delivery location:</strong></p>
        <p>${selectedZone.location_name}</p>
        <p><strong>Delivery fee:</strong></p>
        <p>${formatGHS(fee)}</p>
    `;
});


  form.scrollIntoView({ behavior: "smooth" });

  // Submit order request to WhatsApp
  
form.addEventListener("submit", event => {
  event.preventDefault();

  const details = new FormData(form);
  const region = details.get("region");

  let deliveryLocation = "";
  let feeText = "To be confirmed";

  if (!region) {
    alert("Please select your region.");
    return;
  }

  if (
    region === "Greater Accra" &&
    locationSelect.value &&
    locationSelect.value !== "other"
  ) {
    const selectedZone = zones.find(
      zone => String(zone.id) === locationSelect.value
    );

    if (!selectedZone) {
      alert("Please select a valid delivery location.");
      return;
    }

    deliveryLocation = selectedZone.location_name;

    const fee = Number(selectedZone.delivery_fee);

    if (!Number.isFinite(fee) || fee < 0) {
      alert("Delivery fee is unavailable for this location.");
      return;
    }

    feeText = formatGHS(fee);

  } else {
    deliveryLocation = customInput.value.trim();

    if (!deliveryLocation) {
      alert("Please enter your delivery town or community.");
      return;
    }
  }

  const orderItems = cart.map(item =>
    `${item.name} x ${item.quantity} (price to confirm)`
  ).join("\n");

  const message = `
NEW ORDER REQUEST - NOVA GADGET STORE

Customer: ${details.get("name")}
Phone: ${details.get("phone")}

Region: ${region}
Delivery location: ${deliveryLocation}
Detailed address: ${details.get("address")}

Delivery fee: ${feeText}

Preferred payment: ${details.get("payment")}

ORDER ITEMS:
${orderItems}

Please confirm product availability and prices before payment.

Delivery fee will be confirmed by Nova Gadget Store where applicable.
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

import axios from "axios";

// === API Endpoints ===
const GET_ORDERS_URL = "https://orbitweblabs.com/api/v1/revolut-orders";
const RENDER_URL = "http://31.97.133.25:3000/render";
const COMPLETE_ORDER_URL = "https://orbitweblabs.com/api/v1/complete-order";

// === Main function ===
async function checkOrders() {
  console.log(`[${new Date().toISOString()}] Checking for new orders...`);

  try {
    const { data } = await axios.get(GET_ORDERS_URL, { timeout: 60000 });

    if (!data?.status || !Array.isArray(data.data)) {
      console.log("❌ Invalid response format");
      return;
    }

    for (const order of data.data) {
      const { id, custom_link } = order;
      console.log(`➡️ Processing Order ID: ${id} | Link: ${custom_link}`);

      try {
        // Step 1: Send to render API
        const renderResponse = await axios.post(
          RENDER_URL,
          { url: custom_link },
          { timeout: 60000 }
        );
        const paymentStatus = renderResponse.data?.payment_status;

        if (paymentStatus === true) {
          console.log(
            `✅ Payment detected for Order ID ${id}, completing order...`
          );

          // Step 2: Complete order on Orbit API
          await axios.post(
            COMPLETE_ORDER_URL,
            { order_id: id },
            { timeout: 60000 }
          );

          console.log(`🎉 Order ID ${id} marked as complete.`);
        } else {
          console.log(`⌛ Order ID ${id} not paid yet.`);
        }
      } catch (err) {
        console.error(`⚠️ Error processing Order ID ${id}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err.message);
  }
}

// === Schedule to run every 2 minutes ===
setInterval(checkOrders, 5 * 60 * 1000);

// Run immediately on startup
checkOrders();

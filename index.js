import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

function hasPaymentReceived(html) {
  // Convert to lowercase for safer matching
  return html.toLowerCase().includes("payment already received");
}

app.post("/render", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send({ error: "Missing URL" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    const html = await page.content();
    await browser.close();

    res.json({ payment_status: hasPaymentReceived(html) });
  } catch (err) {
    console.error("Render failed:", err);
    res.status(500).json({ error: "Render failed", details: err.message });
  }
});

app.post("/render2", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send({ error: "Missing URL" });

  try {
    const browser = await puppeteer.launch({
      headless: true, // set false if you want to see it happen
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Listen for the redirect event
    page.on("framenavigated", async (frame) => {
      if (frame === page.mainFrame()) {
        console.log("Navigated to:", frame.url());
      }
    });

    // Go to the initial Revolut checkout link
    await page.goto(url, {
      waitUntil: "networkidle2", // waits until page and redirects load
    });

    // Get the final resolved URL after redirects
    const finalUrl = page.url();

    res.json({ url: finalUrl });
  } catch (err) {
    console.error("Render failed:", err);
    res.status(500).json({ error: "Render failed", details: err.message });
  }
});

app.listen(3000, () => console.log("Render service running on port 3000"));

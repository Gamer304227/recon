const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000; // Railway uses PORT env variable

// Function to run Puppeteer and extract the href value
async function runPuppeteer(link) {
  // Launch Puppeteer browser instance
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for cloud environments like Railway
  });
  const page = await browser.newPage();

  // Open the link
  await page.goto(link);

  // Wait for 2 seconds before checking the URL
  await page.waitForTimeout(2000);

  // Get the current URL of the page
  const currentUrl = await page.url();

  // Check if the URL is one of the allowed URLs
  if (currentUrl.startsWith('https://inventoryidea.com/') || currentUrl.startsWith('https://stockwallah.com')) {
    // Click on the verify button
    await page.click('#verify_btn');

    // Wait for 12 seconds
    await page.waitForTimeout(12000);

    // Extract the href from the button
    const hrefValue = await page.evaluate(() => {
      const verifyBtn = document.querySelector('#verify_btn');
      if (verifyBtn && verifyBtn.href) {
        return verifyBtn.href;
      }
      return null;
    });

    await browser.close();

    return hrefValue;
  } else {
    await browser.close();
    throw new Error('Invalid URL');
  }
}

// API endpoint for /h4
app.get('/h4', async (req, res) => {
  const { link } = req.query;

  if (!link) {
    return res.status(400).json({ success: false, error: 'No link parameter provided' });
  }

  try {
    const result = await runPuppeteer(link);

    if (result) {
      return res.json({ success: true, result: result });
    } else {
      return res.status(404).json({ success: false, error: 'Href value not found' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

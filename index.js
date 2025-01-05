const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 8000;

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to run Puppeteer and handle the specified logic
async function runPuppeteer(link) {
  // Launch Puppeteer browser instance
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ],
    executablePath: '/usr/bin/google-chrome-stable'
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1280,
      height: 800
    });

    // Open the link
    await page.goto(link, {
      waitUntil: 'load',
      timeout: 30000
    });

    let currentUrl = await page.url();
    console.log(`Initial URL: ${currentUrl}`);

    while (!currentUrl.startsWith('https://aryx.xyz')) {
      // Wait for 5 seconds
      await delay(5000);

      // Execute the command in the console if the page hasn't already reloaded
      await page.evaluate(() => {
        const button = document.querySelector("#btn6");
        if (button) {
          button.click();
        }
      });

      // Wait for 2 seconds before checking for reload
      await delay(2000);

      // Check if the page has reloaded
      const newUrl = await page.url();
      if (newUrl !== currentUrl) {
        console.log(`Page reloaded. New URL: ${newUrl}`);
        currentUrl = newUrl;
      } else {
        console.log('Page did not reload. Waiting...');
      }
    }

    // Once the URL starts with https://aryx.xyz, execute the final command
    console.log(`Final URL reached: ${currentUrl}`);
    await page.evaluate((ULink) => {
      window.location.href = `${ULink}`;
    }, link);

    // Wait for 4 seconds
    await delay(4000);

    // Return the final URL
    currentUrl = await page.url();
    return currentUrl;
  } catch (error) {
    console.error('Puppeteer error:', error);
    throw error;
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}

// API endpoint for /anylink
app.get('/anylink', async (req, res) => {
  const { link } = req.query;

  if (!link) {
    return res.status(400).json({ success: false, error: 'No link parameter provided' });
  }

  try {
    const result = await runPuppeteer(link);
    return res.json({ success: true, result: result });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Add a health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

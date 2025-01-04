const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 8000;

// Function to run Puppeteer and extract the href value
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
    executablePath: '/usr/bin/google-chrome-stable'  // Updated path
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
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for 2 seconds before checking the URL
    await page.waitForTimeout(2000);

    // Get the current URL of the page
    const currentUrl = await page.url();

    // Check if the URL is one of the allowed URLs
    if (currentUrl.startsWith('https://inventoryidea.com/') || currentUrl.startsWith('https://stockwallah.com')) {
      // Wait for the verify button to be available
      await page.waitForSelector('#verify_btn', { timeout: 10000 });
      
      // Click on the verify button
      await page.click('#verify_btn');
      
      // Wait for 12 seconds
      await page.waitForTimeout(12000);
      
      // Extract the href from the button
      const hrefValue = await page.evaluate(() => {
        const verifyBtn = document.querySelector('#verify_btn');
        return verifyBtn?.href || null;
      });

      return hrefValue;
    } else {
      throw new Error('Invalid URL');
    }
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

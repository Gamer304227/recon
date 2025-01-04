const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 8000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runPuppeteer(link) {
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
    
    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to:', link);
    await page.goto(link, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await delay(2000);
    const currentUrl = await page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.startsWith('https://inventoryidea.com/') || currentUrl.startsWith('https://stockwallah.com')) {
      // Wait for the button to be available
      console.log('Waiting for verify button...');
      await page.waitForSelector('#verify_btn', { timeout: 10000 });
      
      // Get initial href value
      const initialHref = await page.evaluate(() => {
        const btn = document.querySelector('#verify_btn');
        return btn ? btn.href : null;
      });
      console.log('Initial href value:', initialHref);

      // Click the button
      console.log('Clicking verify button...');
      await page.click('#verify_btn');
      
      // Wait and check for href changes
      let finalHref = null;
      for (let i = 0; i < 12; i++) {
        await delay(1000); // Check every second
        finalHref = await page.evaluate(() => {
          const btn = document.querySelector('#verify_btn');
          return btn ? btn.href : null;
        });
        console.log(`Attempt ${i + 1}: Current href value:`, finalHref);
        
        // If href has changed from javascript:void(0) and is a valid URL, break
        if (finalHref && finalHref !== 'javascript:void(0)' && finalHref.startsWith('http')) {
          console.log('Valid href found:', finalHref);
          break;
        }
      }

      // Try to find any other relevant elements that might contain the URL
      const possibleUrls = await page.evaluate(() => {
        const results = [];
        // Check for links that might appear after clicking
        document.querySelectorAll('a').forEach(a => {
          if (a.href && a.href !== 'javascript:void(0)' && a.href.startsWith('http')) {
            results.push({
              href: a.href,
              text: a.textContent,
              classes: a.className
            });
          }
        });
        return results;
      });
      console.log('Other possible URLs found:', possibleUrls);

      if (finalHref && finalHref !== 'javascript:void(0)') {
        return finalHref;
      } else if (possibleUrls.length > 0) {
        // Return the first valid URL found
        return possibleUrls[0].href;
      } else {
        throw new Error('Could not find valid URL after verification');
      }
    } else {
      throw new Error('Invalid URL');
    }
  } catch (error) {
    console.error('Puppeteer error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

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
      return res.status(404).json({ success: false, error: 'Valid URL not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

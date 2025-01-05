const fs = require('fs');
const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to handle Puppeteer logic
async function runPuppeteer(link) {
  const logs = [];
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
    await page.setViewport({ width: 1280, height: 800 });

    logs.push(`Navigating to initial link: ${link}`);
    await page.goto(link, { waitUntil: 'load', timeout: 30000 });

    let currentUrl = await page.url();
    logs.push(`Initial URL: ${currentUrl}`);

    let clickCount = 0;

    while (currentUrl.startsWith('https://ukrupdate.com/')) {
      if (clickCount < 3) {
        logs.push(`Attempting click #${clickCount + 1} on #btn6`);

        // Click the button
        await page.evaluate(() => {
          const button = document.querySelector("#btn6");
          if (button) {
            button.click();
          }
        });

        // Wait for potential page reload or redirection
        await delay(3000);

        // Check the current URL
        const newUrl = await page.url();
        if (newUrl !== currentUrl) {
          logs.push(`Page reloaded. New URL: ${newUrl}`);
          currentUrl = newUrl;
        } else {
          logs.push('Page did not reload. Retrying if necessary.');
        }

        clickCount++;
      } else {
        logs.push('Maximum clicks reached. Returning to ULink.');
        break;
      }
    }

    // Redirect to ULink after attempts
    logs.push(`Redirecting to final link: ${link}`);
    await page.goto(link, { waitUntil: 'load', timeout: 30000 });

    // Wait for 5 seconds before getting the final URL
    await delay(5000);
    currentUrl = await page.url();

    logs.push(`Final URL: ${currentUrl}`);
    return logs;
  } catch (error) {
    logs.push(`Error: ${error.message}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Serve HTML page
app.get('/', async (req, res) => {
  const { link } = req.query;

  if (!link) {
    return res.send('<h1>Error: No link parameter provided</h1>');
  }

  try {
    const logs = await runPuppeteer(link);
    const logOutput = logs.map(log => `<p>${log}</p>`).join('');
    res.send(`
      <html>
        <head><title>Puppeteer Logs</title></head>
        <body>
          <h1>Puppeteer Execution Logs</h1>
          ${logOutput}
        </body>
      </html>
    `);
  } catch (error) {
    res.send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error Occurred</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Start the server
const port = 8000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

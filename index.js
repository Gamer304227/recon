const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3000;

app.get('/take/screenshot', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const screenshot = await page.screenshot({ encoding: 'base64' });
    await browser.close();
    res.send(`<img src="data:image/png;base64,${screenshot}" />`);
  } catch (error) {
    res.status(500).send('An error occurred while taking the screenshot');
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

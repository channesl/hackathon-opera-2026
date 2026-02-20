const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Create a local page with the mazemap script
  await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <script type="text/javascript" src="https://api.mazemap.com/js/v2.0.114/mazemap.min.js"></script>
        </head>
        <body>
        </body>
        </html>
    `);

  // Wait for MazeMap object to be defined
  await page.waitForFunction(() => typeof Mazemap !== 'undefined');

  const result = await page.evaluate(() => {
    function getMethods(obj) {
      let res = [];
      for (let m in obj) { res.push(m); }
      return res;
    }

    return {
      Mazemap: getMethods(Mazemap),
      Data: Mazemap.Data ? getMethods(Mazemap.Data) : null,
      Routing: Mazemap.Routing ? getMethods(Mazemap.Routing) : null
    };
  });

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();

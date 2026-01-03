const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  try {
    const htmlPath = path.resolve(__dirname, 'news_letter_downloadable.html');
    const fileUrl = pathToFileURL(htmlPath).href;

    console.log('Launching headless browser...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Set a wider viewport so the layout matches typical desktop width
    await page.setViewport({ width: 1200, height: 900 });

    // Use print media so @media print rules apply
    await page.emulateMediaType('print');

    console.log('Loading file:', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    const output = path.resolve(__dirname, 'news_letter_downloadable.pdf');
    console.log('Rendering PDF to:', output);

    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();
    console.log('PDF generated successfully:', output);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    process.exitCode = 1;
  }
})();

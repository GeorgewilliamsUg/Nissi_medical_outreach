# Render news_letter_downloadable.html to PDF

Steps to generate the PDF from the local HTML file:

1. Open a terminal in the workspace root: `d:\Dev2024\Nissi_medical_outreach`
2. Install dependencies:

```powershell
npm install
```

3. Run the renderer:

```powershell
npm run render
```

Output: `news_letter_downloadable.pdf` will be created in the same folder.

Notes:
- Puppeteer will download a Chromium binary during install; an internet connection is required.
- If you prefer not to download Chromium, configure Puppeteer to use an existing Chrome/Chromium binary (see Puppeteer docs).

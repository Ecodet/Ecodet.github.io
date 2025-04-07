const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const cors  = require('cors');
const app = express();

app.use('/static', express.static(path.join(__dirname, 'public')));
// app.use(cors()); // Enable CORS
// Allow requests from your frontend origin
app.use(cors({
    origin: 'https://ecodet-github-io.onrender.com'
  }));
app.use(express.json());

app.post('/screenshot', async (req, res) => {
    const ID  = (new Date().getTime().toString(36));
    const url = new URL(req.body.url);
   

    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        ignoreDefaultArgs: ['--disable-extensions'] // on windows issues but not on mac
    });

    const page = await browser.newPage();
    await page.goto(req.body.url);

    // Generate PDF as a Buffer (in-memory)
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    // Set headers for PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="screenshot.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF file as the response
    res.end(pdfBuffer);
});



app.listen(5000, '0.0.0.0', () => {
    console.log('Server is running on port 5000');
});
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

async function urlToPdf(url, outputFolder = path.join(__dirname, 'pdfs')) {
    try {
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        const filename = new URL(url).hostname + '_' +
            url.split('/').pop()
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase();
        const pdfPath = path.join(outputFolder, `${filename}.pdf`);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true
        });
        await browser.close();
        return pdfPath;
    } catch (error) {
        console.error('Error converting URL to PDF:', error);
        return null;
    }
}

app.post('/convert', async (req, res) => {
    const { url } = req.body;
    const pdfPath = await urlToPdf(url);
    if (pdfPath) {
        res.download(pdfPath, path.basename(pdfPath), (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error downloading the file.');
            }
        });
    } else {
        res.status(500).json({ message: 'Error converting URL to PDF' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

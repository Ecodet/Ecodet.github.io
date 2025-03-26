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
        const filename = path.basename(pdfPath);
        res.json({ message: `PDF generated successfully.`, downloadUrl: `/download/${filename}` });
    } else {
        res.json({ message: 'Error converting URL to PDF' });
    }
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'pdfs', filename);
    res.download(filePath, (err) => {
        if (err) {
            res.status(500).send('Could not download the file.');
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

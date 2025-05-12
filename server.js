// server.js - Main application file
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors());

// Ensure the 'pdfs' directory exists
const pdfDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfDir)){
    fs.mkdirSync(pdfDir);
}

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/pdfs', express.static('pdfs'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to convert URL to PDF
app.post('/convert', async (req, res) => {
    try {
        const { urls } = req.body;

        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'At least one URL is required' });
        }

        function cleanFilenameFromUrl(url) {
            let slug = url.split("/").filter(Boolean).pop();
            // Remove .html or any other extension at the end
            // Use a regular expression to remove everything after .html
            slug = slug.replace(/\.html.*$/, "");
            
            // Remove leading numbers and dash
            const noNumbers = slug.replace(/^\d+-/, "").replace(/^\d+/, "");
            // Replace dashes with spaces
            const withSpaces = noNumbers.replace(/-/g, " ");
            // Capitalize first letter (optional)
            const capitalized = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
            // Return the cleaned filename with .pdf extension
            return `${capitalized.trim()}.pdf`;
        }

        const pdfUrls = [];
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (const url of urls) {
            try {
                new URL(url); // validate
                const filename = cleanFilenameFromUrl(url);
                const outputPath = path.join(pdfDir, filename);
                const page = await browser.newPage();
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
                await page.pdf({
                    path: outputPath,
                    format: 'A4',
                    printBackground: true,
                    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
                });
                pdfUrls.push(outputPath);
            } catch (err) {
                console.warn(`Failed to process ${url}:`, err.message);
            }
        }

        await browser.close();

        if (pdfUrls.length === 0) {
            return res.status(500).json({ error: 'Aucune URL n\'a pu être convertie.' });
        }

        // Create a ZIP file containing all PDFs
        const zipFilePath = path.join(__dirname, 'pdfs.zip');
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', () => {
            console.log(`ZIP file created in the folder: ${zipFilePath}`);
            res.download(zipFilePath, 'pdfs.zip', (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Failed to send file.' });
                }
                // Clean up the generated PDFs and ZIP file after sending
                pdfUrls.forEach(pdfPath => {
                    fs.unlink(pdfPath, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                });
                fs.unlink(zipFilePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        });

        archive.on('error', (err) => {
            console.error('Error creating ZIP file:', err);
            res.status(500).json({ error: 'Failed to create ZIP file.' });
        });

        archive.pipe(output);

        pdfUrls.forEach(pdfPath => {
            archive.file(pdfPath, { name: path.basename(pdfPath) });
        });

        archive.finalize();

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

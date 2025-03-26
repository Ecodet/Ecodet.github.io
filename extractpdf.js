const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function urlToPdf(url, outputFolder = path.join('C:', 'Users', 'holcman', 'Desktop', 'Pdfs')) {
    try {
        // Create output folder if it doesn't exist
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        // Launch the browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Generate filename from URL
        const filename = new URL(url).hostname + '_' + 
            url.split('/').pop()
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase();

        // Define full path for PDF
        const pdfPath = path.join(outputFolder, `${filename}.pdf`);

        // Generate PDF
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true
        });

        // Close the browser
        await browser.close();

        console.log(`PDF saved to: ${pdfPath}`);
        return pdfPath;
    } catch (error) {
        console.error('Error converting URL to PDF:', error);
        return null;
    }
}

// Example usage
async function main() {
    const websiteUrl = 'https://www.wansquare.com/012-41932-Le-modele-et-le-positionnement-de-RockFi-continuent-de-seduire-les-investisseurs.html';
    await urlToPdf(websiteUrl);
}

main();
module.exports = urlToPdf;
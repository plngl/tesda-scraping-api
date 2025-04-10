const { chromium } = require('playwright');

const scrapeTESDA = async (lastNameInput, firstNameInput, certFirstFour, certLastFour) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.tesda.gov.ph/Rwac/Rwac2017');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const iframeElement = await page.locator('iframe');
    const frame = await iframeElement.contentFrame();

    if (!frame) {
        console.error('❌ Iframe not found!');
        await browser.close();
        return { success: false, data: null };  // Return null if iframe not found
    }

    console.log("🔍 Filling form inside iframe...");

    await frame.getByRole('textbox', { name: 'Last Name' }).fill(lastNameInput);
    await frame.getByRole('textbox', { name: 'First Name' }).fill(firstNameInput);
    await frame.getByRole('textbox', { name: 'First Four of Certificate' }).fill(certFirstFour);
    await frame.getByRole('textbox', { name: 'Last Four of Certificate' }).fill(certLastFour);

    await frame.getByRole('button', { name: 'Search' }).click();

    // Wait for the page to update after the form is submitted using the page object
    await page.waitForTimeout(2000); // 2 seconds wait after clicking the submit button
    await page.waitForLoadState('domcontentloaded'); // Wait for DOM content to be loaded (can adjust if necessary)

    const noDataFoundLocator = frame.locator('text=No Data Found');
    const tableLocator = frame.locator('table');

    const isNoDataFound = await noDataFoundLocator.isVisible();
    const isTableVisible = await tableLocator.isVisible();

    if (isNoDataFound) {
        console.log('No certificate found for this user!');
        await browser.close();
        return { success: true, data: null }; // Return null when no data is found
    } else if (isTableVisible) {
        console.log('📥 Extracting all rows...');
        const allRows = await frame.locator('table tr').all();
        let results = [];

        for (let i = 1; i < allRows.length; i++) {
            const rowData = await allRows[i].locator('td').allTextContents();
            const cleanedRow = rowData.map(cell => cell.replace(/\s+/g, ' ').trim());
            const row = cleanedRow.filter(cell => cell.length > 0);
            results.push(row);
        }

        console.log('✅ Extracted Rows:', results);

        await browser.close();
        return { success: true, data: results }; // Return the extracted data
    }

    await browser.close();
    return { success: false, data: null }; // Return null for any unexpected errors
};

module.exports = { scrapeTESDA };



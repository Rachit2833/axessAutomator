import getElementXPath from '../utils/generateXpath.js';

export default async function fetchSelectOptions(page, col, data) {

    if (data.type !== 'select') return data;
    console.log("1");
    try {
        const selectHandle = await col.$('.select-v2:not(.disabled)');
        console.log("2");
        if (!selectHandle) return data;

        try {
            console.log(3);
            await selectHandle.click();
        } catch (err) {
            console.log(`Unable to click select: "${data.question}"`);
            return data;
        }

        await new Promise(resolve=>setTimeout(resolve,500)); // allow dropdown to render
        console.log("4");
        const optionHandles = await selectHandle.$$('.select-v2__dropdown li, .select-v2 li');
        const options = [];

        for (const li of optionHandles) {
            const text = (await (await li.getProperty('textContent')).jsonValue()).trim();
            if (!text) continue;

            const xpath = await getElementXPath(li); // ✅ XPath per option
         
            options.push({ text, xpath });
        }

        data.options = options;

        // XPath for the select element itself
        data.xpath = await getElementXPath(selectHandle);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
    } catch (err) {
        console.log(`No options found for select: "${data.question}"`);
    }

    return data;
}


export default async function fetchSelectOptions(page, col, data) {
    if (data.type !== 'select') return data;

    try {
        const selectHandle = await col.$('.select-v2:not(.disabled)');
        if (!selectHandle) return data;

        try {
            await selectHandle.click();
        } catch (err) {
            console.log(`Unable to click select: "${data.question}"`);
            return data;
        }

        await page.waitForTimeout(500); // allow dropdown to render

        const options = await page.evaluate(sel => {
            const dropdown = sel.querySelector('.select-v2__dropdown')
                || sel.parentElement.querySelector('.select-v2__dropdown');
            if (!dropdown) return [];
            return Array.from(dropdown.querySelectorAll('li'))
                .map(li => li.textContent.trim())
                .filter(Boolean);
        }, selectHandle);

        data.options = Array.from(new Set(options)); // remove duplicates

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
    } catch (err) {
        console.log(`No options found for select: "${data.question}"`);
    }

    return data;
}

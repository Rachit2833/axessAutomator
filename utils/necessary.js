
import fs from "fs/promises";
export async function getCurrentURL(page) {
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const finalUrl = page.url();
        console.log("✅ Redirect finished. Final URL:", finalUrl);
        return finalUrl;
    } catch (err) {
        console.error(`❌ Failed to get the url:`, err);
        throw err;
    }
}

export async function saveToJSON(data, filename = "questions.js") {
    try {
        await fs.writeFile(filename, JSON.stringify(data, null, 2), "utf-8");
        console.log(`✅ Saved to ${filename}`);
    } catch (err) {
        console.error("❌ Error saving JSON:", err);
    }
}

export async function selectDateRangeDropdown(page, value = "All") {
    // Step 1: Wait for and click the dropdown input
    await page.waitForSelector(".date-range .ac-multiselect__input", { visible: true });
    const dropdown = await page.$(".date-range .ac-multiselect__input");
    await dropdown.evaluate(e => e.scrollIntoView());
    await dropdown.click();

    // Step 2: Wait for the menu to open
    await page.waitForSelector(".date-range .ac-multiselect__menu.ac-multiselect__menu--open", { visible: true });

    // Step 3: Click the desired option inside that menu only
    await page.evaluate((val) => {
        const menu = document.querySelector(".date-range .ac-multiselect__menu.ac-multiselect__menu--open");
        if (!menu) return;
        const options = [...menu.querySelectorAll(".ac-multiselect__option-text")];
        const target = options.find(opt => opt.textContent.trim() === val);
        if (target) target.click();
    }, value);
}

export async function getSidebarItems(page) {
    const sidebarItemsSelector = 'ul.sidebar__list > li.sidebar__listitem';
    await page.waitForSelector(sidebarItemsSelector, { timeout: 100000 });

    const items = await page.$$(sidebarItemsSelector);

    // Prefetch text and class for each item
    const itemsData = await Promise.all(
        items.map(async (el, index) => {
            const text = await page.evaluate(el => el.childNodes[0].textContent.trim(), el);
            const className = await page.evaluate(el => el.className, el);
            return { el, text, className, index };
        })
    );

    return itemsData;
}
export function removeXPaths(obj) {
    if (Array.isArray(obj)) {
        return obj.map(removeXPaths); // process each element
    } else if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key !== 'xpath') { // skip xpath
                newObj[key] = removeXPaths(value); // recurse
            }
        }
        return newObj;
    } else {
        return obj; // primitive values
    }
}
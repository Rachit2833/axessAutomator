import path from 'path';
import puppeteer from 'puppeteer-core';

import { loginAxxess } from "./utils/login.js"
import { detectDashboardVersion } from './utils/dashboard_detect.js';
import { getCurrentURL, getSidebarItems, saveToJSON, selectDateRangeDropdown } from "./utils/necessary.js"
import { navigateSidebarPrefetched } from './utils/navigate_sidebar.js';
import extractQuestions, { optionsId } from './extract_question.js';
const COOKIES_PATH = path.resolve('./cookies.json');
const Browser_ID = '748fd01f-6275-4904-ab8e-b3d1424ad8c1'




async function runPuppeteer() {
    try {
        const wsUrl =
            `ws://127.0.0.1:9222/devtools/browser/${Browser_ID}`;
        const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl });

        const page = await browser.newPage();
        await page.setViewport({
            width: 1500,
            height: 900,

        });

        await page.goto('https://central.axxessweb.com/help', {
            waitUntil: 'networkidle2',
            timeout: 120000,
        });
        const currentUrl = await getCurrentURL(page)
        console.log(`✅ Page opened ${currentUrl}`);
        if (currentUrl.startsWith("https://central.axxessweb.com/oidc/sign-in?fragment=%2Fhelp&query=&referrer=") ||
            currentUrl.startsWith("https://identity.axxessweb.com/login")) {
            try {
                await loginAxxess(page)
            } catch (error) {
                console.log("Something went wrong", error);
            }

        }

        console.log("Checking version");
        await detectDashboardVersion(page)

        const homeHealth = await page.waitForSelector(
            '.au-target.btn.btn-axxess.btn-block.Home.Health.font-size-base',
            { visible: true, timeout: 120000 }
        );
        const homeHealthHtml = await page.evaluate(el => el.outerHTML, homeHealth);
        console.log("🔍 Home Health Button HTML:", homeHealthHtml);
        await homeHealth.click();
        console.log("✅ HNTS button clicked!");


        await page.waitForNetworkIdle({ timeout: 120000 });

        console.log("moving");
        // ---- Step 2: Click Patient (header icon) ----
        const patient = await page.waitForSelector(
            'ul#app-expanded-menu li.menu span',
            { visible: true, timeout: 120000 }
        );
        const patientHtml = await page.evaluate(el => el.outerHTML, patient);
        console.log("🔍 Patient Icon HTML:", patientHtml);
        await patient.click();
        console.log("✅ Patient icon clicked!");

        // ---- Step 3: Click Patient Charts from dropdown ----
        const viewMenu = (await page.$$('ul#app-expanded-menu li.menu'))[3]; // index 2 is "View"
        await viewMenu.hover(); // or use click if hover doesn't expand it
        await new Promise(resolve => setTimeout(resolve, 1000))
        const items = await page.$$('ul#app-expanded-menu li.menu ul.menu-list .menu-item');

        let found = false;
        for (const item of items) {
            //console.log(item)
            const text = await page.evaluate(el => el.textContent.trim(), item);
            if (text === 'Patient Charts') {
                await item.click();
                found = true;
                break;
            }
        }

        // ---- Step 4: Search Patient ----
        const searchInput = await page.waitForSelector(
            'input[placeholder="Search Patients"]',
            { visible: true, timeout: 120000 }
        );
        const inputHtml = await page.evaluate(el => el.outerHTML, searchInput);
        console.log("🔍 Search Input HTML:", inputHtml);

        // Clear the input
        await searchInput.click({ clickCount: 3 });
        await page.keyboard.press("Backspace");
        await page.evaluate(el => el.value = "", searchInput);
        const clearedValue = await page.evaluate(el => el.value, searchInput);
        console.log("🧹 Cleared search input, current value:", clearedValue);
        await page.waitForNetworkIdle({ timeout: 12000 })

        // Type new value
        await searchInput.type("A7-PAT1234", { delay: 100 });
        const typedValue = await page.evaluate(el => el.value, searchInput);
        console.log("✅ Typed into search input, current value:", typedValue);
        await new Promise(resolve => setTimeout(resolve, 4000))
        await selectDateRangeDropdown(page)
        await new Promise(resolve => setTimeout(resolve, 2000))
        const table = await page.waitForSelector(".table.table-striped", {
            timeout: 120000
        });

        const rows = await table.$$(".patient-activity-row");
        console.log("Number of rows:", rows.length, rows);

        await Promise.all(
            rows.map(async (row, i) => {
                console.log(row, "row")
                const span = await row.$(".text-link.cursor-pointer");
                console.log(span, "span")
                if (!span) return null;

                // ✅ Correct way: evaluate text from span
                const text = await span.evaluate(el => el.innerText.trim());
                const html = await span.evaluate(el => el.outerHTML);

                if (text === "OASIS-E1 Start of Care") {
                    console.log("Found:", text, "at row", i);
                    await span.click()
                    // console.log(html);
                    return { rowIndex: i, text };
                }

                return null;
            })
        );
        let allData = {};
        const sidebarItems = await getSidebarItems(page);
        for (let i = 4; i < sidebarItems.length; i++) {
            const section = sidebarItems[i];
            const sectionName = section.text || section; // depends on how getSidebarItems is returning

            console.log(`📍 Navigating to section ${i + 1}/${sidebarItems.length}: ${sectionName}`);

            // Navigate
            await navigateSidebarPrefetched(sidebarItems, 'goTo', sectionName);
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait for UI

            // Scrape select elements/questions
            const sectionData = await processPage(page);

            // Save under section name
            allData[sectionName] = sectionData;

            console.log(`✅ Processed section: ${sectionName}`);
        }
        console.log("🎯 Finished scraping all sections");
        console.log(JSON.stringify(allData, null, 2));




        // ---- Disconnect but keep Chrome alive ----
        // await browser.disconnect();
    } catch (err) {
        console.error('❌ Error in Puppeteer script:', err);
    }
}

runPuppeteer();




async function processPage(page) {
    const radioBox = await extractQuestions(page)
    console.log(radioBox);
    console.log("writitng");
    await saveToJSON(radioBox)
    console.log("written");
}


// async function extractQuestions(page) {
//     const results = [];

//     // Get all sections
//     const sections = await page.$$('section.oasis__subsection-container');

//     for (let section of sections) {
//         const html = await section.evaluate(el => {
//             const clone = el.cloneNode(false); // shallow clone, no children
//             return clone.outerHTML;
//         });

//         const sectionData = await page.evaluate(el => {
//             return {
//                 heading: el.querySelector('.oasis__subsection-title')?.textContent.trim() || 'Untitled Section',
//             };
//         }, section);

//         sectionData.questions = [];

//         const questionColumns = await section.$$(fieldSelectors.join(', '));

//         for (let col of questionColumns) {

//             const html = await col.evaluate(el => {
//                 const clone = el.cloneNode(false); // shallow clone, no children
//                 return clone.outerHTML;
//             });

//             const data = await page.evaluate(el => {
//                 const result = { type: null, code: null, question: null };

//                 // --- Common info ---
//                 const question =
//                     el.querySelector('.datepicker__label, .timepicker__label, .ACTextinput__label, .select-v2__header')
//                         ?.textContent?.trim()
//                     || el.querySelector(".oasis__checkgroup-container")?.querySelector(".ac-moo-label-title span")?.textContent?.trim()
//                     || null;

//                 if (!question) return null;

//                 result.question = question;
//                 result.code = el.querySelector('.ac-moo-label-code')?.textContent?.trim() || null;

//                 // --- Detect type ---
//                 const radios = el.querySelectorAll('.radio-container .ac-radio input[type="radio"]');
//                 if (radios.length) {
//                     const options = Array.from(el.querySelectorAll('.radio-container .ac-radio label'))
//                         .map(label => {
//                             const input = label.querySelector('input[type="radio"]');
//                             if (!input || input.disabled) return null;
//                             return {
//                                 value: input.value || null,
//                                 label: label.textContent.trim()
//                             };
//                         })
//                         .filter(Boolean);

//                     return { ...result, type: 'radio', options };
//                 }

//                 const select = el.querySelector('.select-v2:not(.disabled)');
//                 if (select) {
//                     return { ...result, type: 'select', options: [] };
//                 }

//                 const input = el.querySelector('input[type="text"], input[type="number"], input[type="date"], input.time-picker');
//                 if (input) {
//                     const type = input.getAttribute('type') || 'text';
//                     const placeholder = input.getAttribute('placeholder') || '';
//                     return {
//                         ...result,
//                         type: ['number', 'date'].includes(type) ? type : 'text',
//                         placeholder
//                     };
//                 }

//                 // --- Detect checkboxes ---
//                 const checkboxes = el.querySelectorAll('.checkbox__main');
//                 if (checkboxes.length) {
//                     // Return minimal info to Node; logging happens in Node context
//                     return {
//                         ...result, type: 'checkbox', options: Array.from(checkboxes).map(box => {
//                             const input = box.querySelector('input[type="checkbox"]');
//                             const label = box.querySelector('label');
//                             if (!input || !label) return null;
//                             return {
//                                 value: input.id || input.value || null,
//                                 label: label.textContent.trim(),
//                                 disabled: input.disabled || false
//                             };
//                         }).filter(Boolean)
//                     };
//                 }

//                 return null;
//             }, col);

//             // Log checkboxes in Node
//             if (data?.type === 'checkbox') {
//                 console.log(data.options.length, 'checkbox detected for question:', data.question);
//             }

//             if (data) {
//                 // --- Fetch select options if select ---
//                 if (data.type === 'select') {
//                     try {
//                         const selectHandle = await col.$('.select-v2:not(.disabled)');
//                         if (selectHandle) {
//                             await selectHandle.click();
//                             await new Promise(resolve => setTimeout(resolve, 500));

//                             const options = await page.evaluate(sel => {
//                                 const dropdown = sel.querySelector('.select-v2__dropdown') || sel.parentElement.querySelector('.select-v2__dropdown');
//                                 if (!dropdown) return [];
//                                 return Array.from(dropdown.querySelectorAll('li'))
//                                     .map(li => li.textContent.trim())
//                                     .filter(Boolean);
//                             }, selectHandle);

//                             data.options = options;
//                             await page.keyboard.press('Escape');
//                             await new Promise(resolve => setTimeout(resolve, 300));
//                         }
//                     } catch (err) {
//                         console.log(`No options found for select: "${data.question}"`);
//                     }
//                 }

//                 sectionData.questions.push(data);
//             }
//         }

//         // Deduplicate questions
//         sectionData.questions = sectionData.questions.filter((q, index, self) => {
//             return index === self.findIndex(other =>
//                 other.type === q.type &&
//                 other.question === q.question &&
//                 other.placeholder === q.placeholder
//             );
//         });

//         results.push(sectionData);
//     }

//     await new Promise(resolve => setTimeout(resolve, 4000));

//     return results;
// }




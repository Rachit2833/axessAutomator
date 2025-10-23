import path, { resolve } from 'path';
import puppeteer from 'puppeteer';

import { loginAxxess } from "./utils/login.js"
import { detectDashboardVersion } from './utils/dashboard_detect.js';
import { getCurrentURL, getSidebarItems, saveToJSON, selectDateRangeDropdown } from "./utils/necessary.js"
import { navigateSidebarPrefetched } from './utils/navigate_sidebar.js';
import extractQuestions, { optionsId } from './extract_question.js';
import chunkQuestion from './chunkQuestion.js';
import mapResponse from "./utils/mapResponse.js"
import performActions from './utils/permormAction.js';
import getResponse from "./fetchAnswer.js"
const COOKIES_PATH = path.resolve('./cookies.json');
const Browser_ID = '82456391-e868-4426-8f93-466f5b5c1805'
import { extractNestedCheckboxes } from './elementsDetectors/nested_detector.js';




async function runPuppeteer() {
    try {
        const browser = await puppeteer.launch({
            headless: false,          // 👈 set true for headless mode
        });

        const page = await browser.newPage();
        await page.setViewport({
            width: 1500,
            height: 900,
            deviceScaleFactor: 2, // Retina display
        })
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


        // await page.waitForNetworkIdle({ timeout: 120000 });

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
        await new Promise(resolve => setTimeout(resolve, 5000))
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
        for (let i = 0; i < sidebarItems.length; i++) {
            const section = sidebarItems[i];
            const sectionName = section.text || section; // depends on how getSidebarItems is returning

            console.log(`📍 Navigating to section ${i + 1}/${sidebarItems.length}: ${sectionName}`);

            // Navigate
            await navigateSidebarPrefetched(sidebarItems, 'goTo', sectionName);

            await new Promise(resolve => setTimeout(resolve, 3000)); // wait for UI

            // Scrape select elements/questions
            const sectionData = await processPage(page, i);

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




async function processPage(page, i) {
    const radioBox = await extractQuestions(page, i)
    console.log(radioBox);
    console.log("writitng");
    await saveToJSON(radioBox, `question${i}.js`)
    const questionChunk = chunkQuestion(radioBox)
    console.log(questionChunk);
    const response = await getResponse(questionChunk)
    await saveToJSON(response,"response.js")
    const searchedQuestion = mapResponse(radioBox,response)
    await saveToJSON(searchedQuestion,"action.js")
    console.log("waiting for action filling to start");
    await new Promise(resolve=>setTimeout(resolve, 2000))
    console.log("startied filling");
    await performActions(page,searchedQuestion)
     console.log("checking nested");
    const nestedCheckboxes = await extractNestedCheckboxes(page, i);
    await saveToJSON(nestedCheckboxes, `nestedQuestions${i}.json`);
    console.log("Nested checkboxes extracted:", nestedCheckboxes);
    
}



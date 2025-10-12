// import puppeteer from 'puppeteer-core';
// import path from 'path';

// import { loginAxxess } from "./utils/login.js";
// import { detectDashboardVersion } from "./utils/dashboard_detect.js";
// import { getCurrentURL } from "./utils/necessary.js";

// const CHROME_EXECUTABLE_PATH =
//   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // Update for Windows/Linux

// async function runLogin() {
//   let browser;
//   try {
//     console.log("🚀 Launching browser...");
//     browser = await puppeteer.launch({
//       headless: false,
//       executablePath: CHROME_EXECUTABLE_PATH,
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--start-maximized'
//       ],
//       defaultViewport: {
//         width: 1500,
//         height: 900,
//         deviceScaleFactor: 2,
//       },
//     });

//     const page = await browser.newPage();

//     console.log("🌐 Navigating to Axxess Central...");
//     await page.goto('https://central.axxessweb.com/help', {
//       waitUntil: 'networkidle2',
//       timeout: 120000,
//     });

//     const currentUrl = await getCurrentURL(page);
//     console.log(`✅ Page opened: ${currentUrl}`);

//     // --- Step 1: Login if necessary ---
//     if (
//       currentUrl.startsWith("https://central.axxessweb.com/oidc/sign-in") ||
//       currentUrl.startsWith("https://identity.axxessweb.com/login")
//     ) {
//       console.log("🔐 Detected login page... Logging in");
//       await loginAxxess(page);
//       console.log("✅ Login completed");

//       await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
//     }

//     // --- Step 2: Check version ---
//     console.log("🔍 Checking dashboard version...");
//     await detectDashboardVersion(page);

//     console.log("🎯 Login flow completed successfully!");
    
//     // Optional: keep browser open or close
//     // await browser.close();

//   } catch (error) {
//     console.error("❌ Error during Puppeteer login flow:", error);
//     if (browser) await browser.close();
//   }
// }

// runLogin();

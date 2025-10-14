import puppeteer from "puppeteer";

export default async function performActions(page, actions) {
  for (const { qn_id, action } of actions) {
    console.log(`🧩 Executing QN_ID: ${qn_id} | Type: ${action.type}`);

    try {
      if (action.type === "click") {
        for (const opt of action.options || []) {
          const el = await page.waitForSelector(`xpath/${opt.xpath}`, { visible: true, timeout: 15000 });
          if (el) {
            await el.click();
            console.log(`✅ Clicked on: ${opt.xpath}`);
          } else {
            console.warn(`⚠️ Element not found for click: ${opt.xpath}`);
          }
        }
      }

      else if (action.type === "type") {
        const el = await page.waitForSelector(`xpath/${action.xpath}`, { visible: true, timeout: 15000 });
        if (el) {
          await el.click({ clickCount: 3 });
          await page.keyboard.press("Backspace");
          await el.type(String(action.value), { delay: 50 });
          console.log(`✅ Typed "${action.value}" into: ${action.xpath}`);
        } else {
          console.warn(`⚠️ Input not found for typing: ${action.xpath}`);
        }
      }

      else if (action.type === "select") {
        console.log(`🎯 Handling dropdown for QN_ID: ${qn_id}`);

        try {
          // Try to detect if it's a native <select>
          const [nativeSelect] = await page.$x(`xpath/${action.xpath}`);

          if (nativeSelect) {
            const tagName = await page.evaluate(el => el.tagName.toLowerCase(), nativeSelect);

            if (tagName === 'select') {
              // ----- NATIVE SELECT -----
              const optionValues = (action.options || []).map(opt => opt.value || opt.label);
              for (const val of optionValues) {
                console.log(`🧩 Selecting value "${val}" from native <select>`);
                await nativeSelect.select(val);
                await page.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })), nativeSelect);
                await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => { });
                await new Promise(res => setTimeout(res, 800));
              }
            } else {
              // ----- CUSTOM SELECT-V2 -----
              console.log("🧠 Detected custom select-v2 component");

              const dropdown = await page.waitForSelector(`xpath/${action.xpath}`, { visible: true, timeout: 15000 });
              await dropdown.click();
              await new Promise(res => setTimeout(res, 800));

              for (const opt of action.options || []) {
                const label = opt.label || opt.value;
                console.log(`🧩 Selecting custom option: "${label}"`);
                const [optionEl] = await page.$x(`//li[normalize-space(text())='${label}']`);
                if (optionEl) {
                  await optionEl.click();
                  await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => { });
                  await new Promise(res => setTimeout(res, 800));
                } else {
                  console.warn(`⚠️ Option "${label}" not found in custom dropdown`);
                }

                // Reopen dropdown if multiple options to select
                if (action.options.length > 1 && opt !== action.options.at(-1)) {
                  console.log("🔁 Reopening custom dropdown...");
                  await dropdown.click();
                  await new Promise(res => setTimeout(res, 800));
                }
              }
            }
          } else {
            console.warn(`⚠️ Dropdown not found for XPath: ${action.xpath}`);
          }

        } catch (err) {
          console.error(`❌ Error handling select for QN_ID ${qn_id}:`, err);
        }
      }


      else {
        console.warn(`⚠️ Unknown action type: ${action.type}`);
      }

    } catch (err) {
      console.error(`❌ Error performing QN_ID ${qn_id}:`, err);
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log("🎯 All actions executed!");
}



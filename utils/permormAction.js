import puppeteer from "puppeteer";

export default async function performActions(page, actions) {
  for (const { qn_id, action } of actions) {
    console.log(`🧩 Executing QN_ID: ${qn_id} | Type: ${action?.type}`);
    if (!action) continue
    try {
      if (action.type === "click") {
        for (const opt of action.options || []) {
          try {
            // Check if checkbox/radio is already checked
            const isAlreadyChecked = await page.evaluate((xpath) => {
              const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              if (el) {
                // Check for radio/checkbox
                if (el.type === 'radio' || el.type === 'checkbox') {
                  return el.checked;
                }
                // Check for custom radio/checkbox classes
                if (el.classList.contains('checked') || el.classList.contains('active') || el.classList.contains('selected')) {
                  return true;
                }
              }
              return false;
            }, opt.xpath);

            if (isAlreadyChecked) {
              console.log(`⏭️ Skipping (already checked): ${opt.xpath}`);
              continue;
            }

            await page.evaluate((xpath) => {
              const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              if (el) el.click();
            }, opt.xpath);
            console.log(`✅ Clicked: ${opt.xpath}`);
            await new Promise(res => setTimeout(res, 800));
          } catch (error) {
            console.error(`❌ Error:`, error.message);
          }
        }
      }

      else if (action.type === "type") {
        try {
          const el = await page.waitForSelector(`xpath/${action.xpath}`, { timeout: 15000 });
          if (el) {
            // Check if input already has the value
            const currentValue = await page.evaluate((xpath) => {
              const input = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              if (input) {
                return input.value || input.textContent || '';
              }
              return '';
            }, action.xpath);

            const targetValue = String(action.value);

            if (currentValue.trim() === targetValue.trim()) {
              console.log(`⏭️ Skipping (already has value "${targetValue}"): ${action.xpath}`);
              continue;
            }

            await el.click({ clickCount: 3 });
            await page.keyboard.press("Backspace");
            await el.type(targetValue, { delay: 50 });
            console.log(`✅ Typed "${targetValue}" into: ${action.xpath}`);
          } else {
            console.warn(`⚠️ Input not found for typing: ${action.xpath}`);
          }
        } catch (error) {
          console.error(`❌ Error typing:`, error.message);
        }
      }

      else if (action.type === "select") {
        console.log(`🎯 Handling dropdown for QN_ID: ${qn_id}`);

        try {
          const nativeSelect = await page.waitForSelector(`xpath/${action.xpath}`, { timeout: 15000 });
          console.log(nativeSelect);

          if (nativeSelect) {
            const tagName = await page.evaluate(el => el.tagName.toLowerCase(), nativeSelect);

            if (tagName === 'select') {
              // ----- NATIVE SELECT -----
              const optionValues = (action.options || []).map(opt => opt.value || opt.label);

              for (const val of optionValues) {
                // Check if option is already selected
                const isAlreadySelected = await page.evaluate((xpath, targetVal) => {
                  const select = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                  if (select) {
                    return select.value === targetVal || 
                           Array.from(select.options).find(opt => opt.selected && (opt.text.trim() === targetVal || opt.value === targetVal));
                  }
                  return false;
                }, action.xpath, val);

                if (isAlreadySelected) {
                  console.log(`⏭️ Skipping (already selected "${val}"): ${action.xpath}`);
                  continue;
                }

                console.log(`🧩 Selecting option "${val}" in <select> using DOM evaluation`);

                await page.evaluate(
                  (xpath, val) => {
                    const select = document.evaluate(
                      xpath,
                      document,
                      null,
                      XPathResult.FIRST_ORDERED_NODE_TYPE,
                      null
                    ).singleNodeValue;

                    if (select) {
                      const option = Array.from(select.options).find(
                        opt => opt.text.trim() === val || opt.value === val
                      );
                      if (option) {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                      } else {
                        console.warn(`⚠️ Option "${val}" not found for select`, select);
                      }
                    } else {
                      console.warn(`⚠️ Select not found for XPath: ${xpath}`);
                    }
                  },
                  action.xpath,
                  val
                );

                await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => { });
                await new Promise(res => setTimeout(res, 800));
              }
            }
            else {
              // ----- CUSTOM SELECT-V2 -----
              console.log("🧠 Detected custom select-v2 component");

              for (const opt of action.options || []) {
                const label = opt.label || opt.value;

                // Check if option is already selected by comparing with displayed value
                const isAlreadySelected = await page.evaluate((dropdownXpath, optionLabel) => {
                  const dropdown = document.evaluate(dropdownXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                  if (dropdown) {
                    const displayValue = dropdown.querySelector('.select-v2__value');
                    if (displayValue) {
                      const currentText = displayValue.textContent.trim();
                      return currentText === optionLabel;
                    }
                  }
                  return false;
                }, action.xpath, label);

                if (isAlreadySelected) {
                  console.log(`⏭️ Skipping (already selected "${label}"): ${action.xpath}`);
                  continue;
                }

                console.log(`🧩 Selecting custom option: "${label}"`);
                const dropdown = await page.waitForSelector(`xpath/${action.xpath}`, { timeout: 15000 });
                await dropdown.click();
                await new Promise(res => setTimeout(res, 800));

                const optionEl = await page.waitForSelector(`xpath/${opt.xpath}`, { timeout: 15000 });
                if (optionEl) {
                  await optionEl.click();
                  await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => { });
                  await new Promise(res => setTimeout(res, 800));
                } else {
                  console.warn(`⚠️ Option "${label}" not found in custom dropdown`);
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
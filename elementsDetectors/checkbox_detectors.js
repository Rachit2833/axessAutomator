import { increaseOptionId } from "../extract_question.js";
import getElementXPath from "../utils/generateXpath.js"; // ✅ wrapper for ElementHandle

export default async function detectCheckboxField(el) {
  const checkboxEls = await el.$$('.checkbox__main, .checkbox-container .notacheck');
  if (!checkboxEls.length) return null;

  const options = [];

  for (let box of checkboxEls) {
    // ✅ Skip checkboxes that are inside nested containers
    const isNested = await box.evaluate(element => {
      return element.closest('.checkbox__nested') !== null;
    });
    
    if (isNested) continue;

    const id = increaseOptionId();
    const input = await box.$('input[type="checkbox"]');
    const labelEl = await box.$('label');

    if (!input || !labelEl) continue;

    const label = await labelEl.evaluate(el => el.textContent.trim());

    // ✅ Generate XPath in browser context via imported helper
    const xpath = await getElementXPath(box);

    options.push({ id, label, xpath });
  }

  // Return null if no valid options found
  if (options.length === 0) return null;

  return { type: 'checkbox', options };
}

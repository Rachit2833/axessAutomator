import { increaseOptionId } from "../extract_question.js";
import getElementXPath from "../utils/generateXpath.js";


export default async function detectCheckboxField(el, answeredDetect = false) {
  const checkboxEls = await el.$$('.checkbox__main, .checkbox-container .notacheck');
  if (!checkboxEls.length) return null;

  // ✅ Check if the entire field is disabled (check parent label or container)
  const isFieldDisabled = await el.evaluate(element => {
    const label = element.querySelector('.ac-moo-label');
    return label && label.hasAttribute('disabled');
  });

  if (isFieldDisabled) {
    console.log('⏭️ Skipping checkbox field - entire field is disabled');
    return null;
  }

  // ✅ Check if all checkboxes are disabled
  const allDisabled = await el.evaluate(element => {
    const checkboxes = element.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length === 0) return false;
    
    return Array.from(checkboxes).every(checkbox => {
      // Skip nested checkboxes in the check
      if (checkbox.closest('.checkbox__nested')) return true;
      return checkbox.disabled;
    });
  });

  if (allDisabled) {
    console.log('⏭️ Skipping checkbox field - all checkboxes are disabled');
    return null;
  }

  // ✅ Check if any checkbox is already checked (field is answered)
  if (!answeredDetect) {
    const hasChecked = await el.evaluate(element => {
      const checkboxes = element.querySelectorAll('input[type="checkbox"]');
      return Array.from(checkboxes).some(checkbox => {
        // Skip nested checkboxes in the check
        if (checkbox.closest('.checkbox__nested')) return false;
        return checkbox.checked;
      });
    });

    // Skip this field if it's already answered
    if (hasChecked) {
      console.log('⏭️ Skipping checkbox field - already answered');
      return null;
    }
  }

  const options = [];

  for (let box of checkboxEls) {
    // ✅ Skip checkboxes that are inside nested containers
    const isNested = await box.evaluate(element => {
      return element.closest('.checkbox__nested') !== null;
    });

    if (isNested) continue;

    const input = await box.$('input[type="checkbox"]');
    const labelEl = await box.$('label');

    if (!input || !labelEl) continue;

    // ✅ Check if this specific checkbox is disabled
    const isDisabled = await input.evaluate(el => el.disabled);
    
    // ✅ Skip disabled checkboxes - only include enabled ones
    if (isDisabled) {
      console.log('⏭️ Skipping disabled checkbox option');
      continue;
    }

    const id = increaseOptionId();
    const label = await labelEl.evaluate(el => el.textContent.trim());

    // ✅ Generate XPath for the input element itself (not the box)
    const xpath = await getElementXPath(input);

    options.push({ 
      id, 
      label, 
      xpath
    });
  }

  // Return null if no valid (enabled) options found
  if (options.length === 0) {
    console.log('⏭️ Skipping checkbox field - no enabled options available');
    return null;
  }

  return { type: 'checkbox', options };
}
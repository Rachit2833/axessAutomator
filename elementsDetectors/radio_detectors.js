import { increaseOptionId } from "../extract_question.js";
import getXPathFromHandle from "../utils/generateXpath.js";


export default async function detectRadioField(el, answeredDetect = false) {
  // Find all radio inputs
  const radios = await el.$$('.radio-container .ac-radio input[type="radio"]');
  if (!radios || radios.length === 0) return null;

  // ✅ If answeredDetect is FALSE, check if field is already answered and skip it
  if (answeredDetect === false) {
    const hasSelected = await el.evaluate(element => {
      const radioInputs = element.querySelectorAll('.radio-container .ac-radio input[type="radio"]');
      return Array.from(radioInputs).some(radio => radio.checked);
    });

    // Skip this field if it's already answered (when answeredDetect is false)
    if (hasSelected) {
      console.log('⏭️ Skipping radio field - already answered');
      return null;
    }
  }
  
  // ✅ If answeredDetect is TRUE, we continue and include the field even if answered

  // ✅ Check if all radios are disabled
  const allDisabled = await el.evaluate(element => {
    const radioInputs = element.querySelectorAll('.radio-container .ac-radio input[type="radio"]');
    if (radioInputs.length === 0) return false;
    return Array.from(radioInputs).every(radio => radio.disabled);
  });

  if (allDisabled) {
    console.log('⏭️ Skipping radio field - all options are disabled');
    return null;
  }

  const options = [];

  for (const radio of radios) {
    // Evaluate in browser to get label text and check if disabled
    const radioData = await radio.evaluate(input => {
      const labelEl = input.closest('.ac-radio')?.querySelector('label');
      if (!labelEl) return null;
      
      // Skip disabled radios
      if (input.disabled) return null;
      
      return {
        label: labelEl.textContent.trim(),
        value: input.value || null
      };
    });

    if (!radioData || !radioData.label) continue;

    // ✅ Get XPath using imported helper
    const xpath = await getXPathFromHandle(radio);
    
    if (!xpath) continue;

    options.push({
      id: increaseOptionId(),
      label: radioData.label,
      value: radioData.value,
      xpath,
    });
  }

  // Return null if no valid (enabled) options found
  if (options.length === 0) {
    console.log('⏭️ Skipping radio field - no enabled options available');
    return null;
  }

  return { type: 'radio', options };
}
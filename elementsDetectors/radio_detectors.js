import { increaseOptionId } from "../extract_question.js";
import getXPathFromHandle  from "../utils/generateXpath.js"; 

export default async function detectRadioField(el) {
  // Find all radio inputs
  const radios = await el.$$('.radio-container .ac-radio input[type="radio"]');
  if (!radios.length) return null;

  const options = [];

  for (const radio of radios) {
    // Evaluate in browser to get label text
    const label = await radio.evaluate(input => {
      const labelEl = input.closest('.ac-radio')?.querySelector('label');
      return labelEl && !input.disabled ? labelEl.textContent.trim() : null;
    });

    if (!label) continue;

    // ✅ Get XPath using imported helper
    const xpath = await getXPathFromHandle(radio);

    options.push({
      id: increaseOptionId(),
      label,
      xpath,
    });
  }

  return { type: 'radio', options };
}

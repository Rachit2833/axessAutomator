import getElementXPath from "../utils/generateXpath.js";

export default async function detectInputField(el, answeredDetect = false) {
  const input = await el.$('input[type="text"], input[type="number"], input[type="date"], input.time-picker');
  if (!input) return null;

  // ✅ Check if input is disabled
  const isDisabled = await input.evaluate(el => el.disabled);
  
  if (isDisabled) {
    console.log('⏭️ Skipping input field - disabled');
    return null;
  }

  // ✅ If answeredDetect is FALSE, check if field is already filled and skip it
  if (answeredDetect === false) {
    const isFilled = await input.evaluate(el => {
      return el.value && el.value.trim() !== '';
    });

    // Skip this field if it's already filled (when answeredDetect is false)
    if (isFilled) {
      console.log('⏭️ Skipping input field - already filled');
      return null;
    }
  }

  // Extract attributes
  const { type, placeholder } = await input.evaluate(el => ({
    type: el.getAttribute('type') || 'text',
    placeholder: el.getAttribute('placeholder') || ''
  }));

  // ✅ Get XPath
  const xpath = await getElementXPath(input);
  
  if (!xpath) return null;

  return {
    type: ['number', 'date'].includes(type) ? type : 'text',
    placeholder,
    xpath
  };
}
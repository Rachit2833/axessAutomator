import getElementXPath from "../utils/generateXpath.js";

export default async function detectInputField(el) {
  const input = await el.$('input[type="text"], input[type="number"], input[type="date"], input.time-picker');
  if (!input) return null;

  // Extract attributes
  const { type, placeholder } = await input.evaluate(el => ({
    type: el.getAttribute('type') || 'text',
    placeholder: el.getAttribute('placeholder') || ''
  }));

  // ✅ Get XPath
  const xpath = await getElementXPath(input);

  return {
    type: ['number', 'date'].includes(type) ? type : 'text',
    placeholder,
    xpath
  };
}

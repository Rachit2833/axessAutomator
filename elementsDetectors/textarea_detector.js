import { increaseOptionId } from "../extract_question.js";
import getElementXPath from "../utils/generateXpath.js";

export default async function detectTextArea(el) {
  const textarea = await el.$(".ACTextarea textarea");
  if (!textarea) return null;

  // ✅ Check if textarea already has a value
  const hasValue = await textarea.evaluate(el => el.value && el.value.trim().length > 0);
  if (hasValue) {
    console.log('⏭️ Skipping textarea - already has a value');
    return null;
  }

  // ✅ Extract placeholder
  const { placeholder } = await textarea.evaluate(el => ({
    placeholder: el.getAttribute('placeholder') || ''
  }));

  // ✅ Generate ID and XPath
  const id = increaseOptionId();
  const xpath = await getElementXPath(textarea);

  return {
    type: "textarea",
    id,
    placeholder: placeholder || "",
    xpath
  };
}

import { increaseOptionId } from "../extract_question.js";
import getXPathFromHandle from "../utils/generateXpath.js";   // ✅ import xpath helper

export default async function detectLivingSituationField(el, answeredDetect = false) {
  // Find the living situation table (M1100 style)
  const table = await el.$(".ac-living-situation");
  if (!table) return null;

  // Extract code and question text
  const codeEl = await el.$(".ac-moo-label-code");
  const code = codeEl
    ? await codeEl.evaluate((el) => el.textContent.trim())
    : null;

  const questionEl = await el.$(".ac-moo-label-title span");
  const question = questionEl
    ? await questionEl.evaluate((el) => el.textContent.trim())
    : null;

  // Extract header labels (availability)
  const headerEls = await table.$$("thead tr:last-child th");
  headerEls.shift()
  const headers = [];
  for (let h of headerEls) {
    const text = await h.evaluate((el) => el.textContent.trim());
    if (text) headers.push(text);
  }

  // Extract body rows
  const rowEls = await table.$$("tbody tr");
  const options = [];

  for (let row of rowEls) {
    const rowLabelEl = await row.$(".row-label");
    const rowLabel = rowLabelEl
      ? await rowLabelEl.evaluate((el) => el.textContent.trim())
      : "";

    const radios = await row.$$("input[type='radio']");
    if(!answeredDetect){
      for (let i = 0; i < radios.length; i++) {
      const radio = radios[i];
      const isActive = await radio.evaluate(el => {
        const parentDiv = el.closest('div');
        return parentDiv && parentDiv.classList.contains('active');
      });
      if(isActive){
         return;
      }
    }
    }
    for (let i = 0; i < radios.length; i++) {
      const radio = radios[i];
      const id = increaseOptionId();
      const headerLabel = headers[i] ? `(${headers[i]})` : "";
      const label = `${rowLabel} ${headerLabel}`.trim();

      // ✅ Extract XPath for this radio input
      const xpath = await getXPathFromHandle(radio);

      options.push({ id, label, xpath });
    }
  }

  return {
    type: "radio",
    code,
    question,
    options,
  };
}

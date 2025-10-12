import { increaseOptionId } from "../extract_question.js";
export default async function detectCheckboxField(el) {
    // Handle both .checkbox__main and .checkbox-container (O0110 style)
    const checkboxEls = await el.$$('.checkbox__main, .checkbox-container .notacheck');
    if (!checkboxEls.length) return null;

    const options = [];

    for (let box of checkboxEls) {
        const id= increaseOptionId()
        const input = await box.$('input[type="checkbox"]');
        const labelEl = await box.$('label');

        if (!input || !labelEl) continue;

        const label = await labelEl.evaluate(el => el.textContent.trim());

        options.push({ id, label, });
    }

    return { type: 'checkbox', options };
}

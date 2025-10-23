import getElementXPath from '../utils/generateXpath.js';
import { increaseOptionId } from '../extract_question.js';

export default async function detectRadioGroup(col) {
    // Find radio group container
    const radioGroupContainer = await col.$('.oasis__radio, .radio-container');
    if (!radioGroupContainer) return null;

    // Extract question text
    const titleHandle = await col.$('.ac-moo-label-title span');
    const question = titleHandle
        ? (await (await titleHandle.getProperty('textContent')).jsonValue()).trim()
        : null;

    if (!question) return null;

    // Get all radio option elements
    const radioOptionDivs = await col.$$('.ac-radio');
    const options = [];

    for (const optionDiv of radioOptionDivs) {
        const inputEl = await optionDiv.$('input[type="radio"]');
        if (!inputEl) continue;

        const labelEl = await optionDiv.$('label');
        if (!labelEl) continue;

        // ✅ Extract the text span: the span immediately after the icon span
        const text = await labelEl.evaluate(el => {
            const spans = Array.from(el.querySelectorAll('span'));
            for (let i = 0; i < spans.length; i++) {
                const span = spans[i];
                // if current span is icon, take the next one (usually text)
                if (span.classList.contains('radio__icon') && spans[i + 1]) {
                    const t = spans[i + 1].textContent.trim();
                    if (t.length > 0) return t;
                }
            }
            // fallback: just return the first non-empty non-icon span
            for (const s of spans) {
                if (!s.classList.contains('radio__icon') && s.textContent.trim().length > 0) {
                    return s.textContent.trim();
                }
            }
            return '';
        });

        const value = await inputEl.evaluate(el => el.value);
        const disabled = await inputEl.evaluate(el => el.disabled);
        const checked = await inputEl.evaluate(el => el.checked);
        const xpath = await getElementXPath(inputEl);

        options.push({
            id: increaseOptionId(),
            value,
            label: text,
            xpath,
            disabled,
            checked,
        });
    }

    if (options.length === 0) return null;

    return {
        type: 'radio-group',
        question,
        options,
    };
}

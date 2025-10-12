import { increaseOptionId} from "../extract_question.js";

export default async function detectRadioField(el) {
    // Find all radio inputs
    const radios = await el.$$('.radio-container .ac-radio input[type="radio"]');
    if (!radios.length) return null;

    // Get labels and values
    const options = await Promise.all(
        radios.map((radio) => radio.evaluate(input => {
            const labelEl = input.closest('.ac-radio')?.querySelector('label');
            if (!labelEl || input.disabled) return null;
            return {
                label: labelEl.textContent.trim()
            };
        }))
    );

    options.forEach(opt => {
        opt.id = increaseOptionId();
    })

    return { type: 'radio', options: options.filter(Boolean) };
}

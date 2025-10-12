export default async function detectInputField(el) {
    const input = await el.$('input[type="text"], input[type="number"], input[type="date"], input.time-picker');
    if (!input) return null;

    const { type, placeholder } = await input.evaluate(el => ({
        type: el.getAttribute('type') || 'text',
        placeholder: el.getAttribute('placeholder') || ''
    }));

    return {
        type: ['number', 'date'].includes(type) ? type : 'text',
        placeholder
    };
}

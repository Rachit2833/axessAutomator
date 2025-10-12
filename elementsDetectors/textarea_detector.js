export default async function detectTextArea(el) {
     const textarea= await el.$(".ACTextarea textarea")
     if(!textarea) return
    const {  placeholder } = await textarea.evaluate(el => ({
        placeholder: el.getAttribute('placeholder') || ''
    }));
     return {
        type: "textarea",
        placeholder: placeholder || ""
     }
}
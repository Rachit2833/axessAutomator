import detectCheckboxField from './elementsDetectors/checkbox_detectors.js';
import detectInputField from './elementsDetectors/inputs_detectors.js';
import detectRadioField from './elementsDetectors/radio_detectors.js';
import fetchSelectOptions from './elementsDetectors/select_option_detector.js';
import detectTextArea from "./elementsDetectors/textarea_detector.js"
import mergeExtraTextareas from "./utils/mergeComments.js"
import detectLivingSituationField from "./elementsDetectors/table_radio_detector.js"
import customActions, { logBanner } from "./customActions.js"
import getElementXPath from './utils/generateXpath.js';
export let optionsId = 2000
let questionId = 3000
export function increaseOptionId() {
    optionsId++
    return optionsId
}
const fieldSelectors = [
    '.vitals__bp-box',
    '.vitals__bmi-weight',
    '.vitals__bmi-height',
    '.vitals__unable',
    '.vitals__input',
    '.vitals__bp-box',
    '.noteHeader-inputs-container .datepicker',
    '.noteHeader-inputs-container .timepicker',
    '.noteHeader-inputs-container .ACTextinput',
    '.multi-item-box .timepicker',
    '.ac-mileage',
    '.ac-surcharge',
    '.question-column',

];
const forbiddenSectionIds = [
    'AideCarePlanOrders',
    'CareManagementClinicalPathways',
    'MedicationsClinicalPathways',
    'NutritionPlanOfCareOrders',
    'EndocrineProblemStatement',
    'FunctionalAbilitiesTherapyClinicalPathways',
    'FunctionalPlanOfCareOrders',
    'NeuroClinicalPathways',
    'CardiacClinicalPathways',
    'RespClinicalPathways',
    'IntegumentaryPocOrdersSubsection',
    'PainClinicalPathways',
    'SupportiveClinicalPathways',
    'PrognosisClinicalPathways',
    'RiskClinicalPathways',
    'EliminationClinicalPathways',
];

export default async function extractQuestions(page) {
    const results = [];

    // Get all sections
    const sections = await page.$$('section.oasis__subsection-container');

    for (let section of sections) {
        const sectionId = await section.evaluate(el => el.getAttribute('id'));

        // Skip forbidden sections
        if (forbiddenSectionIds.includes(sectionId)) {
            console.log(`⏭️ Skipping forbidden section: ${sectionId}`);
            continue;
        }

        // Get the heading element handle
        const headingHandle = await section.$('.oasis__subsection-title');

        let heading = 'Untitled Section'; // default
        if (headingHandle) {
            // Get the textContent property and convert it to a string
            const headingText = await headingHandle.getProperty('textContent');
            heading = (await headingText.jsonValue()).trim();
        }

        // Construct sectionData
        const sectionData = {
            heading,
            questions: []
        };

        console.log(sectionData);

        sectionData.questions = [];
        await customActions(sectionData, "before", section);

        // Wait a bit for the R boxes to appear
        await new Promise(resolve => setTimeout(resolve, 1000))

        const questionColumns = await section.$$(fieldSelectors.join(', '));
        console.log(questionColumns.length);

        for (let col of questionColumns) {
            const result = { type: null, code: null, question: null };
            let id = questionId++
            let question = null;

            const className = await col.evaluate(el => el.className);
            if (sectionData.heading === "Plan of Care: Vital Sign Parameters") {
                const subheaderHandle = await col.$('.ac-moo-label-subheader span');
                const titleHandles = await col.$$('.ac-moo-label-title span');

                const subheader = subheaderHandle
                    ? (await (await subheaderHandle.getProperty('textContent')).jsonValue()).trim()
                    : '';
                const title = titleHandles[1]
                    ? (await (await titleHandles[1].getProperty('textContent')).jsonValue()).trim()
                    : '';

                question = title ? `${subheader}: ${title}` : subheader;
            } else if (sectionData.heading === 'Vital Signs' && className.includes("vitals__bp-box")) {
                const labelHandle = await col.$('label');
                const labelText = labelHandle
                    ? (await (await labelHandle.getProperty('textContent')).jsonValue()).trim()
                    : '';

                question = `Blood Pressure ${labelText}`;
                logBanner("question", question);
            } else if (await col.$('.question-column .checkbox-container')) {
                const labelHandle = await col.$('.question-column .checkbox-container .notacheck label');
                question = labelHandle
                    ? (await (await labelHandle.getProperty('innerText')).jsonValue()).trim()
                    : null;

            }
            else {
                const labelHandle = await col.$('.datepicker__label, .timepicker__label, .ACTextinput__label, .select-v2__header, .vitals__input label , .vitals__bmi-weight label , .vitals__bmi-height label , .vitals__unable label , .ac-moo-label-title span , .ACTextarea__label');
                if (labelHandle) {
                    question = (await (await labelHandle.getProperty('textContent')).jsonValue()).trim();
                } else {
                    const checkgroupHandle = await col.$('.oasis__checkgroup-container .ac-moo-label-title span');
                    if (checkgroupHandle) {
                        question = (await (await checkgroupHandle.getProperty('textContent')).jsonValue()).trim();
                    }
                }
            }

            if (!question) continue;

            result.question = question;
            result.id = id

            const codeHandle = await col.$('.ac-moo-label-code');
            if (codeHandle) {
                result.code = (await (await codeHandle.getProperty('textContent')).jsonValue()).trim();
            }

            // Now detect field types, etc.
            let finalData = { ...result };

            if (await detectCheckboxField(col)) {
                finalData = { ...finalData, ...await detectCheckboxField(col) };
            } else if (await detectRadioField(col)) {
                finalData = { ...finalData, ...await detectRadioField(col) };
            } else if (await detectInputField(col)) {
                finalData = { ...finalData, ...await detectInputField(col) };
            } else if (await detectTextArea(col)) {
                finalData = { ...finalData, ...await detectTextArea(col) };
            } else if (await detectLivingSituationField(col)) {
                finalData = { ...finalData, ...await detectLivingSituationField(col) };
            }
            else if (className.includes("vitals__unable")) {
                const options = [];
                const input = await col.$('input[type="checkbox"]');
                const labelEl = await col.$('label');

                if (!input || !labelEl) continue;

                const value = await input.evaluate(el => el.id || el.value || null);
                const label = await labelEl.evaluate(el => el.textContent.trim());
                const OptionId = ++optionsId;

                // ✅ Generate XPath for the checkbox input
                const xpath = await getElementXPath(input);

                options.push({ id: optionsId, value, label, xpath });
                finalData = { id, type: 'checkbox', options, };
            }
            else if (await col.$('.vitals__input-wrapper select')) {
                const selectElem = await col.$('.vitals__input-wrapper select');
                finalData.type = 'select';
                finalData.options = [];

                if (selectElem) {
                    // ✅ Generate XPath for the select element
                    finalData.xpath = await getElementXPath(selectElem);

                    const optionHandles = await selectElem.$$('option');
                    for (const option of optionHandles) {
                        const textProp = await option.getProperty('textContent');
                        const text = (await textProp.jsonValue()).trim();
                        if (!text) continue;

                        // ✅ Generate XPath for each option
                        const xpath = await getElementXPath(option);

                        finalData.options.push({
                            id: optionsId++,
                            text,
                            xpath
                        });
                    }

                    // Remove duplicate options by text
                    finalData.options = Array.from(
                        new Map(finalData.options.map(o => [o.text, o])).values()
                    );
                }
            }
            else if (await col.$('.select-v2:not(.disabled)')) {
                finalData.type = 'select';
                finalData.options = [];

                // ✅ Generate XPath for the column itself
                finalData.xpath = await getElementXPath(col);

                // Fetch options for the select element
                finalData = await fetchSelectOptions(page, col, finalData);
            }
            if (
                sectionData.heading === "Special Treatments, Procedures, and Programs" &&
                finalData.type === "checkbox" &&
                finalData.question === "Special Treatments, Procedures, and Programs"
            ) {
                continue; // don't include the parent group
            }

            sectionData.questions.push(finalData);
        }

        sectionData.questions = sectionData.questions.filter((q, index, self) =>
            index === self.findIndex(other =>
                other.type === q.type &&
                other.question === q.question &&
                other.placeholder === q.placeholder
            )
        );
        const meragedData = mergeExtraTextareas(sectionData)

        results.push(meragedData);
    }

    await new Promise(resolve => setTimeout(resolve, 4000));

    return results;
}

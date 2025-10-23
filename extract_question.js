import detectCheckboxField from './elementsDetectors/checkbox_detectors.js';
import detectInputField from './elementsDetectors/inputs_detectors.js';
import detectRadioField from './elementsDetectors/radio_detectors.js';
import fetchSelectOptions from './elementsDetectors/select_option_detector.js';
import detectTextArea from "./elementsDetectors/textarea_detector.js";
import mergeExtraTextareas from "./utils/mergeComments.js";
import detectLivingSituationField from "./elementsDetectors/table_radio_detector.js";
import customActions, { logBanner } from "./customActions.js";
import getElementXPath from './utils/generateXpath.js';

export let optionsId = 2000;
let questionId = 3000;
export function increaseQuestionId() {
    questionId++;
    return questionId;
}
export function increaseOptionId() {
    optionsId++;
    return optionsId;
}

const fieldSelectors = [
    '.vitals__bp-box',
    '.vitals__bmi-weight',
    '.vitals__bmi-height',
    '.vitals__unable',
    '.vitals__input',
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

export default async function extractQuestions(page, i) {
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

        // Get heading
        const headingHandle = await section.$('.oasis__subsection-title');
        let heading = 'Untitled Section';
        if (headingHandle) {
            const headingText = await headingHandle.getProperty('textContent');
            heading = (await headingText.jsonValue()).trim();
        }

        const sectionData = {
            heading,
            questions: []
        };

        console.log(sectionData);

        await customActions(sectionData, "before", section);

        // Wait for elements to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // --- Handle Special Treatments section separately ---
        if (heading === "Special Treatments, Procedures, and Programs") {
            const groups = await section.$$('.ac-moo-label-title span');

            for (let group of groups) {
                const groupTitle = (await (await group.getProperty('textContent')).jsonValue()).trim();

                // Skip main title itself
                if (groupTitle === "Special Treatments, Procedures, and Programs") continue;

                const siblingContainer = await group.evaluateHandle(el => {
                    let next = el.closest('.ac-moo-label').nextElementSibling;
                    return next ? next.querySelectorAll('.checkbox-container') : [];
                });

                const checkboxes = await siblingContainer.getProperties();
                const options = [];

                for (const cb of checkboxes.values()) {
                    const labelEl = await cb.$('label');
                    if (!labelEl) continue;
                    const label = (await (await labelEl.getProperty('textContent')).jsonValue()).trim();
                    const input = await cb.$('input[type="checkbox"]');
                    const xpath = input ? await getElementXPath(input) : null;
                    options.push({ id: increaseOptionId(), label, xpath });
                }

                if (options.length) {
                    sectionData.questions.push({
                        id: increaseQuestionId(),
                        type: 'checkbox-group',
                        question: groupTitle,
                        options
                    });
                }
            }

            results.push([sectionData])
            continue; // skip normal column processing
        }

        // Inside your extractQuestions function, after fetching the heading:
        if (heading === "Sensory Status" || heading === "Elimination Status" || heading === "Neurological Status") {  // adjust to the real section heading
            const radioGroups = await section.$$('.oasis__radio, .radio-container');

            for (const group of radioGroups) {
                const titleHandle = await group.$('.ac-moo-label-title span');
                const question = titleHandle
                    ? (await (await titleHandle.getProperty('textContent')).jsonValue()).trim()
                    : null;

                if (!question) continue;

                const optionDivs = await group.$$('.ac-radio');
                const options = [];

                for (const optionDiv of optionDivs) {
                    const inputEl = await optionDiv.$('input[type="radio"]');
                    if (!inputEl) continue;

                    const labelEl = await optionDiv.$('label');
                    if (!labelEl) continue;

                    // ✅ Extract correct visible span text (not the .radio__icon)
                    const text = await labelEl.evaluate(el => {
                        const spans = Array.from(el.querySelectorAll('span'));
                        for (let i = 0; i < spans.length; i++) {
                            const span = spans[i];
                            // if current is icon, use next one for label
                            if (span.classList.contains('radio__icon') && spans[i + 1]) {
                                const t = spans[i + 1].textContent.trim();
                                if (t.length > 0) return t;
                            }
                        }
                        // fallback: any non-icon span with text
                        for (const s of spans) {
                            if (!s.classList.contains('radio__icon') && s.textContent.trim().length > 0) {
                                return s.textContent.trim();
                            }
                        }
                        return '';
                    });

                    const value = await inputEl.evaluate(el => el.value);
                    const disabled = await inputEl.evaluate(el => el.disabled);
                    const xpath = await getElementXPath(inputEl);

                    options.push({
                        id: increaseOptionId(),
                        value,
                        label: text,
                        xpath,
                        disabled
                    });
                }

                if (options.length) {
                    sectionData.questions.push({
                        id: increaseQuestionId(),
                        type: 'radio-group',
                        question,
                        options
                    });
                }
            }

            results.push([sectionData]);
            continue;
        }
        // --- Normal questionColumns processing for other sections ---
        let questionColumns = await section.$$(fieldSelectors.join(', '));

        if (i === 0 || i === 6) {
            questionColumns = await Promise.all(
                questionColumns.map(async (el) => {
                    const hasNested = await el.$('.question-column');
                    if (hasNested) return null;

                    const hasAnyChild = await el.$('*');
                    if (!hasAnyChild) {
                        const textContent = await el.evaluate(node => node.textContent.trim());
                        if (!textContent) return null;
                    }

                    return el;
                })
            );
            questionColumns = questionColumns.filter(Boolean);
            console.log('✅ Filtered question columns:', questionColumns.length);
        }

        for (let col of questionColumns) {
            if (await isNested(col)) continue;
            const result = { type: null, code: null, question: null };
            const id = questionId++;
            let question = null;

            const className = await col.evaluate(el => el.className);

            // Handle specific headings
            if (heading === "Plan of Care: Vital Sign Parameters") {
                const subheaderHandle = await col.$('.ac-moo-label-subheader span');
                const titleHandles = await col.$$('.ac-moo-label-title span');
                const subheader = subheaderHandle
                    ? (await (await subheaderHandle.getProperty('textContent')).jsonValue()).trim()
                    : '';
                const title = titleHandles[1]
                    ? (await (await titleHandles[1].getProperty('textContent')).jsonValue()).trim()
                    : '';
                question = title ? `${subheader}: ${title}` : subheader;

            } else if (heading === 'Vital Signs' && className.includes("vitals__bp-box")) {
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

            } else {
                const labelHandle = await col.$('.datepicker__label, .timepicker__label, .ACTextinput__label, .select-v2__header, .vitals__input label , .vitals__bmi-weight label , .vitals__bmi-height label , .vitals__unable label, .ac-moo-label-title span  , .ACTextarea__label');
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
            result.id = id;

            const codeHandle = await col.$('.ac-moo-label-code');
            if (codeHandle) {
                result.code = (await (await codeHandle.getProperty('textContent')).jsonValue()).trim();
            }

            let finalData = { ...result };
            const checkboxData = await detectCheckboxField(col);
            if (checkboxData) {
                finalData = { ...finalData, ...checkboxData };
            } else if (checkboxData === null && await col.$('.checkbox__main, .checkbox-container .notacheck')) {
                // Checkbox field exists but returned null (already answered), skip this question
                console.log('⏭️ Skipping answered checkbox question:', question);
                continue;
            }
            const radioData = await detectRadioField(col);
            if (radioData) {
                finalData = { ...finalData, ...radioData };
            } else if (radioData === null && await col.$('.radio-container .ac-radio input[type="radio"]')) {
                // Radio field exists but returned null (already answered), skip this question
                console.log('⏭️ Skipping answered radio question:', question);
                continue;
            } const inputData = await detectInputField(col);
            if (inputData) {
                finalData = { ...finalData, ...inputData };
            } else if (inputData === null && await col.$('input[type="text"], input[type="number"], input[type="date"], input.time-picker')) {
                // Input field exists but returned null (already filled/disabled), skip this question
                console.log('⏭️ Skipping answered/disabled input question:', question);
                continue;
            } const textareaData = await detectTextArea(col);
            if (textareaData) {
                finalData = { ...finalData, ...textareaData };
            } else if (textareaData === null && await col.$('.ACTextarea textarea')) {
                // Textarea exists but returned null (already has value or is disabled), skip this question
                console.log('⏭️ Skipping answered/disabled textarea question:', question);
                continue;
            }
            const livingData = await detectLivingSituationField(col);
            console.log(livingData, "libing");
            if (livingData != null) {
                console.log(1);
                finalData = { ...finalData, ...livingData };
            } else if (livingData === null) {
                console.log(2);
                console.log('⏭️ Skipping living situation question', question);
                continue;

            }

            else if (className.includes("vitals__unable")) {
                const options = [];
                const input = await col.$('input[type="checkbox"]');
                const labelEl = await col.$('label');
                if (!input || !labelEl) continue;
                const value = await input.evaluate(el => el.id || el.value || null);
                const label = await labelEl.evaluate(el => el.textContent.trim());
                const xpath = await getElementXPath(input);
                options.push({ id: increaseOptionId(), value, label, xpath });
                finalData = { id, type: 'checkbox', options };
            } else if (await col.$('.vitals__input-wrapper select')) {
                const selectElem = await col.$('.vitals__input-wrapper select');
                finalData.type = 'select';
                finalData.options = [];
                if (selectElem) {
                    finalData.xpath = await getElementXPath(selectElem);
                    const optionHandles = await selectElem.$$('option');
                    for (const option of optionHandles) {
                        const textProp = await option.getProperty('textContent');
                        const text = (await textProp.jsonValue()).trim();
                        if (!text) continue;
                        const xpath = await getElementXPath(option);
                        finalData.options.push({ id: increaseOptionId(), text, xpath });
                    }
                    finalData.options = Array.from(
                        new Map(finalData.options.map(o => [o.text, o])).values()
                    );
                }
            } else if (await col.$('.select-v2:not(.disabled)')) {

                finalData.type = 'select';
                finalData.options = [];
                finalData.xpath = await getElementXPath(col);
                finalData = await fetchSelectOptions(page, col, finalData);
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

        const mergedData = mergeExtraTextareas(sectionData);
        results.push(mergedData);
    }

    await new Promise(resolve => setTimeout(resolve, 4000));
    return results;
}
export async function isNested(element) {
    return await element.evaluate(el => el.closest('.checkbox__nested, .question-column .nested') !== null);
}
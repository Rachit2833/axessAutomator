import { increaseOptionId, increaseQuestionId } from "../extract_question.js";
import getElementXPath from "../utils/generateXpath.js";
import fetchSelectOptions from "../elementsDetectors/select_option_detector.js";

export async function extractNestedCheckboxes(page, sectionIndex = 0) {
    console.log(`🔹 Extracting nested checkboxes for section ${sectionIndex}...`);

    // Select all top-level checkboxes that have nested containers
    const parentCheckboxes = await page.$$('.ac-checkbox.checkbox.question');

    const result = [];

    for (const parentCheckbox of parentCheckboxes) {
        const extracted = await processNestedContainer(page, parentCheckbox, null);
        if (extracted && extracted.length > 0) {
            result.push(...extracted);
        }
    }

    console.log(`✅ Found ${result.length} nested questions.`);
    return result;
}

async function processNestedContainer(page, containerElement, parentLabel = null) {
    const results = [];

    // Get the current level's label
    const labelHandle = await containerElement.$('.checkbox__main label.checkbox__label');
    const currentLabel = labelHandle
        ? (await (await labelHandle.getProperty('innerText')).jsonValue()).trim()
        : null;

    // Build the full question path
    const fullLabel = parentLabel ? `${parentLabel} - ${currentLabel}` : currentLabel;

    // Find the nested container
    const nestedGroup = await containerElement.$('.checkbox__nested');
    if (!nestedGroup) return null;

    // === STEP 1: Extract ALL text inputs at THIS level ===
    const textFields = await extractTextInputsAtLevel(page, nestedGroup, fullLabel);
    results.push(...textFields);

    // === STEP 2: Extract ALL select dropdowns at THIS level ===
    const selectFields = await extractSelectsAtLevel(page, nestedGroup, fullLabel);
    results.push(...selectFields);

    // === STEP 3: Find all direct child checkboxes at THIS level ===
    const directCheckboxes = await getDirectCheckboxes(nestedGroup);

    const options = [];

    for (const cb of directCheckboxes) {
        const labelHandle = await cb.$('label.checkbox__label');
        const label = labelHandle
            ? (await (await labelHandle.getProperty('innerText')).jsonValue()).trim()
            : null;
        const xpath = await getElementXPath(cb);
        const id = increaseOptionId();

        // Add the checkbox itself to options
        options.push({ id, label, xpath });

        // Check if it has nested content
        const nestedCheckboxGroup = await cb.$('.checkbox__nested');
        if (nestedCheckboxGroup) {
            // Recursively process nested content
            const nestedResults = await processNestedContainer(page, cb, `${fullLabel} - ${label}`);
            if (nestedResults && nestedResults.length > 0) {
                results.push(...nestedResults);
            }
        }
    }

    // After loop, create the checkbox question
    if (options.length > 0) {
        const questionId = increaseQuestionId();
        results.unshift({
            type: "checkbox",
            code: null,
            question: fullLabel,
            id: questionId,
            options
        });
    }

    return results;

}


// Extract text inputs that belong to the current level only
async function extractTextInputsAtLevel(page, nestedGroup, fullLabel) {
    const fields = [];
    const allTextInputs = await nestedGroup.$$('.ACTextinput__textarea, input[type="text"]');

    for (const textInput of allTextInputs) {
        // Check if this input belongs to current level or deeper nested level
        const belongsToCurrentLevel = await textInput.evaluate((el, groupEl) => {
            let currentNested = el.closest('.checkbox__nested');

            // Walk up to find the nearest checkbox__nested
            while (currentNested) {
                // If we found our target group, this element belongs here
                if (currentNested === groupEl) {
                    return true;
                }

                // Check if there's a checkbox between this nested and our target
                const parentCheckbox = currentNested.closest('.ac-checkbox.checkbox');
                if (parentCheckbox) {
                    const parentNested = parentCheckbox.parentElement?.closest('.checkbox__nested');

                    // If the parent nested is our target, then this input is in a deeper level
                    if (parentNested === groupEl) {
                        return false;
                    }
                }

                // Keep walking up
                currentNested = currentNested.parentElement?.closest('.checkbox__nested');
            }

            return false;
        }, nestedGroup);

        if (!belongsToCurrentLevel) continue;

        const questionId = increaseQuestionId();
        const xpath = await getElementXPath(textInput);
        const placeholder = await textInput.evaluate(el => el.getAttribute('placeholder') || '');

        // Try to get field-specific label
        const fieldSpecificLabel = await getFieldLabel(textInput);
        const fieldLabel = fieldSpecificLabel ? `${fullLabel} - ${fieldSpecificLabel}` : fullLabel;

        fields.push({
            type: "text",
            code: null,
            question: fieldLabel,
            id: questionId,
            placeholder: placeholder,
            xpath: xpath
        });
    }

    return fields;
}

// Extract select dropdowns that belong to the current level only
async function extractSelectsAtLevel(page, nestedGroup, fullLabel) {
    const fields = [];
    const allSelects = await nestedGroup.$$('.oasis__select');

    for (const selectElement of allSelects) {
        // Check if this select belongs to current level or deeper nested level
        const belongsToCurrentLevel = await selectElement.evaluate((el, groupEl) => {
            let currentNested = el.closest('.checkbox__nested');

            while (currentNested) {
                if (currentNested === groupEl) {
                    return true;
                }

                const parentCheckbox = currentNested.closest('.ac-checkbox.checkbox');
                if (parentCheckbox) {
                    const parentNested = parentCheckbox.parentElement?.closest('.checkbox__nested');

                    if (parentNested === groupEl) {
                        return false;
                    }
                }

                currentNested = currentNested.parentElement?.closest('.checkbox__nested');
            }

            return false;
        }, nestedGroup);

        if (!belongsToCurrentLevel) continue;

        // Try to get field-specific label
        const fieldSpecificLabel = await getFieldLabel(selectElement);
        const fieldLabel = fieldSpecificLabel ? `${fullLabel} - ${fieldSpecificLabel}` : fullLabel;

        let selectData = {
            type: 'select',
            code: null,
            question: fieldLabel,
            id: increaseQuestionId(),
            options: [],
            xpath: await getElementXPath(selectElement)
        };

        selectData = await fetchSelectOptions(page, selectElement, selectData);

        if (selectData && selectData.options && selectData.options.length > 0) {
            fields.push(selectData);
        }
    }

    return fields;
}

// Get direct child checkboxes at the current level
async function getDirectCheckboxes(nestedGroup) {
    // Try multiple selector patterns to catch all direct checkboxes
    const selectors = [
        ':scope > .plr-5 > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > .plr-5 > div > .ac-checkbox.checkbox',
        ':scope > .question-wrapper > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > .ptb-3 > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > div > .oasis__checkgroup-container > div > .ac-checkbox.checkbox'
    ];

    const checkboxes = [];
    const seen = new Set();

    for (const selector of selectors) {
        const elements = await nestedGroup.$$(selector);
        for (const el of elements) {
            // Use a unique identifier to avoid duplicates
            const id = await el.evaluate(e => {
                const input = e.querySelector('input');
                return input ? input.id : null;
            });

            if (id && !seen.has(id)) {
                seen.add(id);
                checkboxes.push(el);
            } else if (!id) {
                checkboxes.push(el);
            }
        }
    }

    return checkboxes;
}

// Extract checkbox options from leaf checkbox elements
async function extractCheckboxOptions(checkboxElements, fullLabel) {
    const options = [];

    for (const cb of checkboxElements) {
        const id = increaseOptionId();
        const labelHandle = await cb.$('label.checkbox__label');

        const label = labelHandle
            ? (await (await labelHandle.getProperty('innerText')).jsonValue()).trim()
            : null;

        const xpath = await getElementXPath(cb);

        options.push({
            id,
            label,
            xpath
        });
    }

    if (options.length === 0) return null;

    const questionId = increaseQuestionId();

    return {
        type: "checkbox",
        code: null,
        question: fullLabel,
        id: questionId,
        options
    };
}

// Helper to extract field-specific labels
async function getFieldLabel(element) {
    try {
        const labelElement = await element.evaluateHandle(el => {
            const container = el.closest('.question-column, [data-test-id]');
            if (container) {
                const labelEl = container.querySelector('.ac-moo-label-title span, .select-v2__header .ac-moo-label-title span, label.ACTextinput__label');
                return labelEl;
            }
            return null;
        });

        if (labelElement) {
            const labelText = await labelElement.evaluate(el => el ? el.textContent.trim() : '');
            return labelText || null;
        }
    } catch (e) {
        // Label extraction failed, return null
    }

    return null;
}
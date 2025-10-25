import { increaseOptionId, increaseQuestionId } from "../extract_question.js";
import getElementXPath from "../utils/generateXpath.js";
import fetchSelectOptions from "../elementsDetectors/select_option_detector.js";

export async function extractNestedCheckboxes(page, sectionIndex = 0) {
    console.log(`🔹 Extracting nested checkboxes for section ${sectionIndex}...`);

    // Select all top-level checkboxes that have nested containers
    const parentCheckboxes = await page.$$(
        '.ac-checkbox.checkbox.question, .ac-checkbox.checkbox:has(.checkbox__nested)'
    );

    console.log(parentCheckboxes);
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

    // === STEP 1: Extract ALL multiselect dropdowns at THIS level ===
    const multiselectFields = await extractMultiselectsAtLevel(page, nestedGroup, fullLabel);
    results.push(...multiselectFields);

    // === STEP 2: Extract ALL text inputs at THIS level ===
    const textFields = await extractTextInputsAtLevel(page, nestedGroup, fullLabel);
    results.push(...textFields);

    // === STEP 3: Extract ALL select dropdowns at THIS level ===
    const selectFields = await extractSelectsAtLevel(page, nestedGroup, fullLabel);
    results.push(...selectFields);

    // === STEP 4: Find all direct child checkboxes at THIS level ===
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

// NEW: Extract multiselect dropdowns that belong to the current level only
async function extractMultiselectsAtLevel(page, nestedGroup, fullLabel) {
    const fields = [];
    const allMultiselects = await nestedGroup.$$('.form-multi-select-search');

    for (const multiselectElement of allMultiselects) {
        // Check if this multiselect belongs to current level or deeper nested level
        const belongsToCurrentLevel = await multiselectElement.evaluate((el, groupEl) => {
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

        // Extract options from the multiselect
        const options = await multiselectElement.evaluate(el => {
            const optionElements = el.querySelectorAll('.multiselect__element:not(.disabled-element) .multiselect__option span');
            return Array.from(optionElements).map((opt, index) => ({
                label: opt.textContent.trim()
            }));
        });

        // Add IDs and xpaths to options
        const processedOptions = [];
        for (let i = 0; i < options.length; i++) {
            const optionId = increaseOptionId();
            processedOptions.push({
                id: optionId,
                label: options[i].label,
                xpath: null // Multiselect options don't have individual xpaths
            });
        }

        // Try to get field-specific label
        const fieldSpecificLabel = await getFieldLabel(multiselectElement);
        const fieldLabel = fieldSpecificLabel ? `${fullLabel} - ${fieldSpecificLabel}` : fullLabel;

        // Get the xpath of the multiselect container
        const xpath = await getElementXPath(multiselectElement);

        if (processedOptions.length > 0) {
            fields.push({
                type: "multiselect",
                code: null,
                question: fieldLabel,
                id: increaseQuestionId(),
                options: processedOptions,
                xpath: xpath
            });
        }
    }

    return fields;
}

// Extract text inputs that belong to the current level only
async function extractTextInputsAtLevel(page, nestedGroup, fullLabel) {
    const fields = [];
    const allTextInputs = await nestedGroup.$$('.ACTextinput__textarea, input[type="text"]');

    for (const textInput of allTextInputs) {
        // Skip inputs that are part of multiselect components
        const isMultiselectInput = await textInput.evaluate(el => {
            return el.classList.contains('multiselect__input') ||
                el.closest('.multiselect') !== null ||
                el.closest('.form-multi-select-search') !== null;
        });

        if (isMultiselectInput) continue;

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

// Get direct child checkboxes at the current level with enhanced detection
async function getDirectCheckboxes(nestedGroup) {
    console.log('🔍 Starting enhanced checkbox detection...');

    // Enhanced selector patterns to catch all direct checkboxes
    const selectors = [
        // Original selectors with variations
        ':scope > .plr-5 > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > .plr-5 > div > .ac-checkbox.checkbox',
        ':scope > .question-wrapper > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > .question-wrapper.ptb-3 > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > .ptb-3 > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > div > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > .question-wrapper > div > .ac-checkbox.checkbox',
        ':scope > .question-wrapper.ptb-3 > div > .ac-checkbox.checkbox',

        // More flexible patterns that work regardless of intermediate classes
        ':scope .oasis__checkgroup-container > div > .ac-checkbox.checkbox:not(.question)',
        ':scope > .question-wrapper .oasis__checkgroup-container div > .ac-checkbox.checkbox',

        // New patterns to handle various DOM structures
        ':scope > [class*="question-wrapper"] > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > div[class*="ptb"] > .oasis__checkgroup-container > div > .ac-checkbox.checkbox',
        ':scope > div > .ac-checkbox.checkbox',

        // Additional fallback patterns
        ':scope .ac-checkbox.checkbox:not(.question)',
    ];

    const checkboxes = [];
    const seen = new Set();
    const selectorResults = {};

    // First pass: Use selector queries
    for (const selector of selectors) {
        try {
            const elements = await nestedGroup.$$(selector);
            selectorResults[selector] = elements.length;

            if (elements.length > 0) {
                console.log(`  ✓ Selector matched ${elements.length}: ${selector.substring(0, 80)}...`);
            }

            for (const el of elements) {
                const elementId = await getUniqueElementId(el);

                if (elementId && !seen.has(elementId)) {
                    seen.add(elementId);
                    checkboxes.push(el);
                    console.log(`    ✅ Added: ${elementId}`);
                } else if (elementId) {
                    console.log(`    ⏭️  Skipped (duplicate): ${elementId}`);
                }
            }
        } catch (e) {
            console.debug(`  ✗ Selector failed: ${selector.substring(0, 80)}...`);
        }
    }

    // Second pass: DOM traversal for additional robustness
    console.log('🔍 Running DOM traversal fallback...');
    const traversedCheckboxes = await traverseForCheckboxes(nestedGroup, seen);
    if (traversedCheckboxes.length > 0) {
        console.log(`  ✅ DOM traversal found ${traversedCheckboxes.length} additional checkboxes`);
        checkboxes.push(...traversedCheckboxes);
    }

    console.log(`✅ Total checkboxes detected: ${checkboxes.length}`);
    return checkboxes;
}

// Helper function to get unique identifier for elements
async function getUniqueElementId(element) {
    try {
        return await element.evaluate(el => {
            // Try to get input ID
            const input = el.querySelector('input[type="checkbox"]');
            if (input?.id) return input.id;

            // Fall back to label text
            const label = el.querySelector('label.checkbox__label');
            if (label?.textContent) return label.textContent.trim();

            return null;
        });
    } catch (e) {
        return null;
    }
}

// Alternative detection method: traverse DOM structure
async function traverseForCheckboxes(nestedGroup, seenIds) {
    const foundCheckboxes = [];

    try {
        // Get all checkbox elements and their identifiers
        const checkboxData = await nestedGroup.evaluate(() => {
            const data = [];
            const allCheckboxes = document.querySelectorAll('.checkbox__nested .ac-checkbox.checkbox:not(.question)');

            allCheckboxes.forEach(el => {
                const input = el.querySelector('input[type="checkbox"]');
                const inputId = input?.id;
                const label = el.querySelector('label.checkbox__label');
                const labelText = label?.textContent?.trim();

                if (inputId || labelText) {
                    data.push({
                        id: inputId || labelText,
                        labelText: labelText
                    });
                }
            });

            return data;
        });

        // Re-query checkboxes that haven't been seen yet
        for (const cbData of checkboxData) {
            if (cbData.id && !seenIds.has(cbData.id)) {
                try {
                    // Query by label text or input ID
                    let element;
                    if (cbData.labelText) {
                        element = await nestedGroup.evaluateHandle((groupEl, labelText) => {
                            const allCbs = groupEl.querySelectorAll('.ac-checkbox.checkbox');
                            for (const cb of allCbs) {
                                const label = cb.querySelector('label.checkbox__label');
                                if (label?.textContent?.trim() === labelText) {
                                    return cb;
                                }
                            }
                            return null;
                        }, cbData.labelText);

                        const el = await element.asElement();
                        if (el) {
                            seenIds.add(cbData.id);
                            foundCheckboxes.push(el);
                        }
                    }
                } catch (e) {
                    console.debug(`Could not retrieve checkbox for: ${cbData.labelText}`);
                }
            }
        }
    } catch (e) {
        console.debug('DOM traversal failed:', e.message);
    }

    return foundCheckboxes;
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
import chalk from "chalk"
const customActionForSection = {
  "Vital Signs": [
    {
      executionType: "before",
      actionType: "click",
      selector: ".vitals__bp.tablet-view .vitals__expand"
    }
  ]

}

export default async function customActions(sectionData, check, section) {
  logBanner(sectionData.heading, "sectiondata");
  if (check === "before") {
    logBanner("before Detected", "check passed")
    const actions = customActionForSection[sectionData.heading]
      ?.filter((ac) => ac.executionType === "before");

    if (!actions || actions.length === 0) return;
    logBanner("actions found", actions.length)
    for (const action of actions) {
      if (action.actionType === "click") {
        logBanner("actions click found", "wohoo!")
        const element = await section.$(action.selector);
        if (!element) continue;
        logBanner("element detected", "wohoo!")
        console.log("Clicking...");
        await element.click();
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }
}
export function logBanner(title, message) {
  console.log(chalk.yellow.bold(`\n=== ${title} ===`));
  console.log(chalk.white(message));
  console.log(chalk.yellow("=".repeat(30)) + "\n");
}



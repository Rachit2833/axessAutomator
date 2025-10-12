

export async function detectDashboardVersion(page) {
    try {
        // try the "beta" dashboard selector
        const link = await page.waitForSelector(".text-center.white-space-pre.svg-blue-color", {
            visible: true, timeout: 5000
        });
        console.log("✅ Found dashboard version link (Beta)");
        console.log("Navigating to old one");
        await link.click()
        console.log("On Legacy version");
        return "beta";
    } catch (err) {
        console.log("⚠️ Beta dashboard not found, checking Legacy...");
    }

    try {
        // try the "legacy" dashboard selector
        await page.waitForSelector(".au-target.input-group .form-control.au-target", {
            visible: true, timeout: 5000
        });
        console.log("✅ Found legacy input field (Legacy)");
        return "legacy";
    } catch (err) {
        console.error("❌ Neither dashboard type was found:", err);
        return null; // fallback if neither exists
    }
}
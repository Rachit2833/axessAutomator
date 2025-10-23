export default async function scrollAndScreenshot(page, filePath = 'fullpage.png') {
    // Helper to scroll from current position to bottom
    async function scrollToBottom() {
        await page.evaluate(async () => {
            await new Promise(resolve => {
                let totalHeight = 0;
                const distance = 800;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 300);
            });
        });
    }

    // Helper to scroll from bottom to top
    async function scrollToTop() {
        await page.evaluate(async () => {
            await new Promise(resolve => {
                const distance = 800;
                const timer = setInterval(() => {
                    window.scrollBy(0, -distance);
                    if (window.scrollY <= 0) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 300);
            });
        });
    }

    console.log("⬇️ Scrolling top → bottom (1st pass)...");
    await scrollToBottom();
    await new Promise(resolve=>setTimeout(resolve,500));

    console.log("⬇️ Scrolling top → bottom (2nd pass)...");
    await scrollToBottom();
    await new Promise(resolve=>setTimeout(resolve,500));

    console.log("⬆️ Scrolling bottom → top...");
    await scrollToTop();
    await new Promise(resolve=>setTimeout(resolve,500));

    console.log("📸 Taking full-page screenshot...");
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`✅ Screenshot saved to ${filePath}`);
}
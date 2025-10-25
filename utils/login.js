

const email = ""
const password1 = ""

export async function loginAxxess(page) {
    try {
        // inner try/catch (inside function)
        console.log("🔐 Starting login...");

        try {
            await page.waitForSelector('.form-group .form-control', { visible: true });
            const inputEmail = await page.$('.form-group .form-control');
            await inputEmail.click({ clickCount: 3 });
            await inputEmail.type(email, { delay: 50 });
            console.log("✅ Email entered");
        } catch (err) {
            console.error("❌ Failed at email step:", err);
            throw err; // bubble up
        }

        try {
            await page.waitForSelector('.btn.btn-axxess.btn-sm.mt-3.au-target', { visible: true, });
            await page.click('.btn.btn-axxess.btn-sm.mt-3.au-target');
            await new Promise(resolve => setTimeout(resolve, 2000))
            console.log("✅ Submitted email");
        } catch (err) {
            console.error("❌ Failed at submit-email step:", err);
            throw err;
        }

        try {
            await page.type('input[au-target-id="63"]', password1);
            await page.waitForSelector('.btn.btn-axxess.btn-sm.mt-3.au-target', { visible: true });
            await page.click('.btn.btn-axxess.btn-sm.mt-3.au-target');
            await new Promise(resolve => setTimeout(resolve, 5000))
            console.log("✅ Submitted password");
        } catch (err) {
            console.error("❌ Failed at password step:", err);
            throw err;
        }

        try {
           const abc= await page.waitForSelector('.btn.agreement-ok.w-50.au-target', {timeout:50000 });
            console.log(abc);
            await page.click('.btn.agreement-ok.w-50.au-target');
            console.log("🎉 Agreement accepted, login complete");
        } catch (err) {
            console.error("❌ Failed at agreement step:", err);
            throw err;
        }

    } catch (err) {
        console.error("🚨 loginAxxess failed overall:", err);
        throw err; // rethrow so the outer scope can handle it
    }
}
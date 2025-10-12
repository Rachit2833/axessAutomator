

export async function navigateSidebarPrefetched(itemsData, action, targetText) {
    // Find current active index
    let currentIndex = itemsData.findIndex(item => item.className.includes('routerlink--active'));

    let clicked = false;

    if (action === 'goTo' && targetText) {
        const target = itemsData.find(item => item.text === targetText);
        if (target) {
            await target.el.click();
            console.log(`Clicked [${target.index}]: "${target.text}"`);
            clicked = true;
        } else {
            console.log(`No sidebar item found with text "${targetText}"`);
        }
    } else if (action === 'next') {
        if (currentIndex >= 0 && currentIndex < itemsData.length - 1) {
            const nextItem = itemsData[currentIndex + 1];
            await nextItem.el.click();
            console.log(`Clicked next [${nextItem.index}]: "${nextItem.text}"`);
            clicked = true;
        } else {
            console.log('Already at the last item');
        }
    } else if (action === 'back') {
        if (currentIndex > 0) {
            const prevItem = itemsData[currentIndex - 1];
            await prevItem.el.click();
            console.log(`Clicked back [${prevItem.index}]: "${prevItem.text}"`);
            clicked = true;
        } else {
            console.log('Already at the first item');
        }
    } else {
        console.log('Invalid action');
    }

    return clicked;
}
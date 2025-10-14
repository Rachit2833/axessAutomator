// utils/generateXpath.js
export default async function getElementXPath(elementHandle) {
  return await elementHandle.evaluate(el => {
    const parts = [];
    while (el && el.nodeType === 1) {
      let index = 1;
      let sibling = el.previousSibling;
      while (sibling) {
        if (sibling.nodeType === 1 && sibling.nodeName === el.nodeName) index++;
        sibling = sibling.previousSibling;
      }
      parts.unshift(el.nodeName.toLowerCase() + `[${index}]`);
      el = el.parentNode;
    }
    return '/' + parts.join('/');
  });
}

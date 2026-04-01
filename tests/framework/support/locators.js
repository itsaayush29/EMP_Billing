import { By } from 'selenium-webdriver';

export function textCaseXpath(text, element = '*') {
  return `//${element}[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${text.toLowerCase()}')]`;
}

export function inputByLabel(labelText, ...names) {
  const lowered = labelText.toLowerCase();
  const nameMatch = names.length ? ` or ${names.map((name) => `@name='${name}'`).join(' or ')}` : '';

  return By.xpath(
    `//input[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')` +
      ` or contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')${nameMatch}]` +
      ` | //textarea[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')` +
      ` or contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')${nameMatch}]` +
      ` | //label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')]/following::*[self::input or self::textarea][1]` +
      ` | //*[contains(@class, 'form') or contains(@class, 'field')][.//label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')]]//*[self::input or self::textarea][1]`
  );
}

export function selectByLabel(labelText, ...names) {
  const lowered = labelText.toLowerCase();
  const nameMatch = names.length ? ` or ${names.map((name) => `@name='${name}'`).join(' or ')}` : '';

  return By.xpath(
    `//select[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')${nameMatch}]` +
      ` | //label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')]/following::select[1]` +
      ` | //*[contains(@class, 'form') or contains(@class, 'field')][.//label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')]]//select[1]`
  );
}

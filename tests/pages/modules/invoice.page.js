import { By } from 'selenium-webdriver';
import { inputByLabel, selectByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const InvoicePage = {
  invoicesLink: By.xpath(textCaseXpath('invoices', 'a')),
  newInvoiceButton: By.xpath(textCaseXpath('new invoice', 'button')),
  createInvoiceButton: By.xpath(textCaseXpath('create invoice', 'button')),
  clientSelect: selectByLabel('client', 'clientId'),
  issueDateField: inputByLabel('issue date', 'issueDate'),
  dueDateField: inputByLabel('due date', 'dueDate'),
  currencySelect: selectByLabel('currency', 'currency'),
  referenceField: inputByLabel('reference', 'reference'),
  itemNameField: inputByLabel('item name', 'name'),
  descriptionField: inputByLabel('description', 'description'),
  quantityField: By.css('input[placeholder="1"]'),
  rateField: By.css('input[placeholder="0.00"]'),
  statusToast: By.css('[role="status"]'),
};

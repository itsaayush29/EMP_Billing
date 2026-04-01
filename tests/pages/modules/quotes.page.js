import { By } from 'selenium-webdriver';
import { inputByLabel, selectByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const QuotesPage = {
  dashboardLink: By.xpath(textCaseXpath('dashboard', 'a')),
  quotesLink: By.xpath(textCaseXpath('quotes', 'a')),
  newQuoteButton: By.xpath(textCaseXpath('new quote', 'button')),
  newQuoteHeading: By.xpath(textCaseXpath('new quote', 'h1')),
  createQuoteButton: By.xpath(textCaseXpath('create quote', 'button')),
  clientSelect: selectByLabel('client', 'clientId'),
  issueDateField: inputByLabel('issue date', 'issueDate'),
  expiryDateField: inputByLabel('expiry date', 'expiryDate'),
  currencySelect: selectByLabel('currency', 'currency'),
  itemNameField: inputByLabel('item name', 'name'),
  descriptionField: inputByLabel('description', 'description'),
  quantityField: By.css('input[placeholder="1"]'),
  rateField: By.css('input[placeholder="0.00"]'),
  notesField: inputByLabel('notes', 'notes'),
  termsField: inputByLabel('terms', 'terms'),
};

import { By } from 'selenium-webdriver';
import { inputByLabel, selectByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const PaymentsPage = {
  dashboardLink: By.xpath(textCaseXpath('dashboard', 'a')),
  paymentsLink: By.xpath(textCaseXpath('payments', 'a')),
  recordPaymentButton: By.xpath(textCaseXpath('record payment', 'button')),
  clientSelect: selectByLabel('client', 'clientId'),
  invoiceSelect: selectByLabel('invoice', 'invoiceId'),
  amountField: inputByLabel('amount', 'amount'),
  dateField: inputByLabel('date', 'date'),
  paymentMethodSelect: selectByLabel('payment method', 'method'),
  referenceField: inputByLabel('reference', 'reference'),
  notesField: inputByLabel('notes', 'notes'),
};

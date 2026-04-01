import { By } from 'selenium-webdriver';
import { inputByLabel, selectByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const ClientPage = {
  dashboardLink: By.xpath(textCaseXpath('dashboard', 'a')),
  clientsLink: By.xpath(textCaseXpath('clients', 'a')),
  newClientButton: By.xpath(textCaseXpath('new client', 'button')),
  newClientHeading: By.xpath(textCaseXpath('new client', 'h1')),
  createClientButton: By.xpath(textCaseXpath('create client', 'button')),
  clientNameField: inputByLabel('client name', 'name'),
  displayNameField: inputByLabel('display name', 'displayName'),
  emailField: inputByLabel('email', 'email'),
  phoneField: inputByLabel('phone', 'phone'),
  paymentTermsSelect: selectByLabel('payment terms', 'paymentTerms'),
  gstinField: inputByLabel('gstin / tax id', 'gstin', 'taxId'),
  addressLineField: inputByLabel('address line', 'addressLine'),
  cityField: inputByLabel('city', 'city'),
  stateField: inputByLabel('state', 'state'),
  postalCodeField: inputByLabel('postal code', 'postalCode'),
  countryField: inputByLabel('country', 'country'),
  tagField: inputByLabel('type a tag', 'tags'),
  notesField: inputByLabel('notes', 'notes'),
  addFieldButton: By.xpath(textCaseXpath('add field', 'button')),
  valueField: inputByLabel('value'),
};

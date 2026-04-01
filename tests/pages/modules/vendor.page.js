import { By } from 'selenium-webdriver';
import { inputByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const VendorPage = {
  vendorsLink: By.xpath(textCaseXpath('vendors', 'a')),
  newVendorButtons: By.xpath(textCaseXpath('new vendor', 'button')),
  newVendorHeading: By.xpath(textCaseXpath('new vendor', 'h1')),
  createVendorButton: By.xpath(textCaseXpath('create vendor', 'button')),
  statusToast: By.css('[role="status"]'),
  vendorNameField: inputByLabel('vendor name', 'name'),
  companyField: inputByLabel('company', 'company'),
  emailField: inputByLabel('email', 'email'),
  phoneField: inputByLabel('phone', 'phone'),
  taxIdField: inputByLabel('gstin / tax id', 'taxId', 'gstin'),
  addressLine1Field: inputByLabel('address line 1', 'addressLine1'),
  addressLine2Field: inputByLabel('address line 2', 'addressLine2'),
  cityField: inputByLabel('city', 'city'),
  stateField: inputByLabel('state', 'state'),
  postalCodeField: inputByLabel('postal code', 'postalCode'),
  countryField: inputByLabel('country', 'country'),
  notesField: inputByLabel('notes', 'notes'),
};

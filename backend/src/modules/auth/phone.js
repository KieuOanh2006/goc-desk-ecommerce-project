const MOBILE_NUMBER_PATTERN = /^[35789][0-9]{8}$/;

function normalizeVietnamMobilePhone(input) {
  if (typeof input !== 'string') return null;

  let nationalNumber;
  if (/^0[0-9]{9}$/.test(input)) nationalNumber = input.slice(1);
  else if (/^84[0-9]{9}$/.test(input)) nationalNumber = input.slice(2);
  else if (/^\+84[0-9]{9}$/.test(input)) nationalNumber = input.slice(3);
  else if (/^[0-9]{9}$/.test(input)) nationalNumber = input;
  else return null;

  return MOBILE_NUMBER_PATTERN.test(nationalNumber) ? `+84${nationalNumber}` : null;
}

module.exports = { normalizeVietnamMobilePhone };

function validatePositiveNumber(value, fieldName) {
  if (typeof Number(value) !== "number") {
    return { error: `Invalid ${fieldName}`, status: 400 };
  }
  if (value <= 0) {
    return { error: `${fieldName} must be a positive number`, status: 400 };
  }
  return { value };
}

function validateString(value, fieldName) {
  if (typeof value !== "string") {
    return { error: `Invalid ${fieldName}`, status: 400 };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { error: `${fieldName} cannot be empty`, status: 400 };
  }
  return { value: trimmed };
}

function validateDateFormat(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  if (isNaN(Date.parse(date))) return false;
  return true;
}

module.exports = {
  validatePositiveNumber,
  validateString,
  validateDateFormat,
};

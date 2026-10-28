/**
 * Utility functions for precise currency arithmetic.
 * Mitigates IEEE 754 floating-point drift in financial operations.
 */

/**
 * Rounds a number to exactly two decimal places.
 * @param {number} value
 * @returns {number}
 */
const roundToTwoDecimals = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Safely adds two monetary amounts.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const addMoney = (a, b) => {
  return roundToTwoDecimals(Number(a) + Number(b));
};

/**
 * Safely subtracts monetary amount b from a.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const subtractMoney = (a, b) => {
  return roundToTwoDecimals(Number(a) - Number(b));
};

/**
 * Checks if a number has at most two decimal places.
 * @param {number} value
 * @returns {boolean}
 */
const hasAtMostTwoDecimals = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  const parts = value.toString().split('.');
  if (parts.length === 1) return true;
  return parts[1].length <= 2;
};

module.exports = {
  roundToTwoDecimals,
  addMoney,
  subtractMoney,
  hasAtMostTwoDecimals,
};

// True for a plain JSON object like { "a": 1 } (not null, not an array, not a string).
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// Only real strings are accepted. String(x) would turn [] / {} / 123 into text silently.
const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

module.exports = { isPlainObject, cleanText };

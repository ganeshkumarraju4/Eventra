import { FieldType } from "../generated/prisma/enums";

export function validateFieldValue(
  fieldType: FieldType,
  value: unknown,
  options?: unknown
): string | null {

  switch (fieldType) {
    case "TEXT":
    case "TEXTAREA":
    case "PHONE":
      if (typeof value !== "string") {
        return "Value must be a string";
      }
      break;

    case "NUMBER":
      if (
        typeof value !== "number" &&
        typeof value !== "string"
      ) {
        return "Value must be a number";
      }

      if (value === "" || Number.isNaN(Number(value))) {
        return "Value must be a valid number";
      }
      break;

    case "EMAIL":
      if (
        typeof value !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        return "Value must be a valid email";
      }
      break;

    case "URL":
      if (typeof value !== "string") {
        return "Value must be a valid URL";
      }

      try {
        new URL(value);
      } catch {
        return "Value must be a valid URL";
      }
      break;

    case "DATE":
      if (
        typeof value !== "string" ||
        Number.isNaN(Date.parse(value))
      ) {
        return "Value must be a valid date";
      }
      break;

    case "SELECT":
      if (!Array.isArray(options)) {
        return "Invalid field options";
      }

      if (
        typeof value !== "string" ||
        !options.includes(value)
      ) {
        return "Selected option is not valid";
      }
      break;

    case "CHECKBOX":
      if (!Array.isArray(value)) {
        return "Checkbox value must be an array";
      }

      if (!Array.isArray(options)) {
        return "Invalid field options";
      }

      for (const selected of value) {
        if (
          typeof selected !== "string" ||
          !options.includes(selected)
        ) {
          return `Invalid checkbox option: ${selected}`;
        }
      }
      break;

    default:
      return "Unsupported field type";
  }

  return null;
}
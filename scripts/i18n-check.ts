import en from "../src/i18n/messages/en.json";
import es from "../src/i18n/messages/es.json";
import zh from "../src/i18n/messages/zh.json";

type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

function isPlainObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findMissingKeys(
  source: JsonObject,
  target: JsonObject,
  path = "",
): string[] {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(source)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (!(key in target)) {
      missing.push(nextPath);
      continue;
    }

    const targetValue = target[key];
    if (isPlainObject(value)) {
      if (!isPlainObject(targetValue)) {
        missing.push(nextPath);
        continue;
      }
      missing.push(...findMissingKeys(value, targetValue, nextPath));
    }
  }

  return missing;
}

const checks = [
  { locale: "es", messages: es as JsonObject },
  { locale: "zh", messages: zh as JsonObject },
];

const failures = checks.flatMap(({ locale, messages }) =>
  findMissingKeys(en as JsonObject, messages).map((key) => `${locale}: ${key}`),
);

if (failures.length > 0) {
  console.error("Missing translation keys:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("i18n keys are in sync.");

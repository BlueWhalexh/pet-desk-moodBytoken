import { describe, expect, it } from "bun:test";

import en from "./messages/en.json";
import es from "./messages/es.json";
import zh from "./messages/zh.json";

const messagesByLocale = { en, es, zh };

describe("root metadata messages", () => {
  it("uses Next title template placeholders for every locale", () => {
    for (const [locale, messages] of Object.entries(messagesByLocale)) {
      const titleTemplate = messages.metadata.root.titleTemplate;

      expect(titleTemplate, locale).toContain("%s");
      expect(titleTemplate, locale).not.toContain("{title}");
    }
  });
});

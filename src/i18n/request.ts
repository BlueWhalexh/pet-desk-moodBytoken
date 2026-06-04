import { getRequestConfig } from "next-intl/server";

import { defaultLocale, hasLocale } from "@/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && hasLocale(requested) ? requested : defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});

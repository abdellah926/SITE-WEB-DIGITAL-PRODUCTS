import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import messagesAr from "./messages/ar";
import messagesFr from "./messages/fr";
import messagesEn from "./messages/en";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  return {
    locale,
    messages:
      locale === "ar" ? messagesAr : locale === "fr" ? messagesFr : messagesEn,
  };
});
// Synchronous i18next bootstrap from bundled resources. Imported for side
// effects before the first render (in main.tsx). The initial UI language is
// resolved at startup: persisted value -> device primary-subtag match ->
// English. Per-string fallback to English via fallbackLng.

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, NAMESPACES, DEFAULT_NAMESPACE } from "./locales";
import { resolveLanguage } from "./lib/language";
import { readLanguage } from "./lib/persistenceManager";

// Synchronous with bundled resources (no backend), so init resolves
// immediately; the returned promise is intentionally not awaited.
void i18next.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(readLanguage(), navigator.language),
  fallbackLng: "en",
  ns: [...NAMESPACES],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
});

export default i18next;

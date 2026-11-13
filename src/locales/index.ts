// i18n resources, bundled (not fetched). One flat file per namespace per
// locale, named `ui.<xx>.json`. Keys use i18next's default nested-object
// resolution (keySeparator "."), so a lookup like "common.close" resolves
// through the nested JSON. Register every bundled locale here.

import uiEn from "./ui.en.json";
import uiFr from "./ui.fr.json";
import uiEs from "./ui.es.json";
import uiDe from "./ui.de.json";
import { UI_LANGUAGES } from "../lib/language";

export const NAMESPACES = ["ui"] as const;
export const DEFAULT_NAMESPACE = "ui";

export const LOCALES = UI_LANGUAGES;

export const resources = {
  en: { ui: uiEn },
  fr: { ui: uiFr },
  es: { ui: uiEs },
  de: { ui: uiDe },
} as const;

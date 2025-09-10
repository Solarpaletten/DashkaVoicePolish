export interface LanguageConfig {
  meta: {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    direction: 'ltr' | 'rtl';
  };
  app: {
    title: string;
    subtitle: string;
  };
  buttons: {
    translate: string;
    clear: string;
    record: string;
  };
  placeholders: {
    inputText: string;
    outputLabel: string;
    sourceText: string;  // ← ДОБАВЛЕНО
  };
  languageSelector: {     // ← ДОБАВЛЕНО
    sourceLabel: string;
    targetLabel: string;
  };
  translationLanguages: {
    source: { code: string; name: string; flag: string; };
    target: { code: string; name: string; flag: string; };
  };
}

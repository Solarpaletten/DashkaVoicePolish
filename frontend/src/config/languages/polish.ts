import type { LanguageConfig } from '../types';

export const polishConfig: LanguageConfig = {
  meta: {
    code: 'pl',
    name: 'Polish', 
    nativeName: 'Polski',
    flag: '🇵🇱',
    direction: 'ltr'
  },
  app: {
    title: '🚀 DashkaBot Polish 2.0',
    subtitle: 'Galaxy S24 - Russian ⇄ Polish Voice Translator 2.1'
  },
  buttons: {
    translate: 'Перевести',
    clear: 'Очистить всё',
    record: 'Записываю... Нажмите когда закончите'
  },
  placeholders: {
    inputText: 'Привет',
    outputLabel: 'Перевод:',
    sourceText: 'Исходный текст:'  // ← ДОБАВЛЕНО
  },
  languageSelector: {               // ← ДОБАВЛЕНО
    sourceLabel: 'Russian Speaker',
    targetLabel: 'Polish Speaker'
  },
  translationLanguages: {
    source: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    target: { code: 'pl', name: 'Polski', flag: '🇵🇱' }
  }
};

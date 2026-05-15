'use client';

import { useState, useEffect } from 'react';

export default function LocaleSwitcher({ currentLocale, locales }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="locale-switcher">Loading...</div>;
  }

  const handleLocaleChange = (e) => {
    // This would typically update the locale
    // Implementation depends on your routing setup
    console.log('Switching to locale:', e.target.value);
  };

  return (
    <select value={currentLocale} onChange={handleLocaleChange} className="locale-switcher">
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale}
        </option>
      ))}
    </select>
  );
}

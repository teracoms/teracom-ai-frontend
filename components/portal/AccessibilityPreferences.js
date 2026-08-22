'use client';

import { useEffect } from 'react';

/**
 * Settings & Security V1 -- applies Reduce Motion / Larger Text to the
 * real page, not just storing the preference. Renders nothing; toggles
 * two classes on <body> (the one element a nested layout can actually
 * reach -- only the root layout, app/(product)/layout.js, owns <body>
 * itself, and this stays out of that file entirely by mutating the DOM
 * client-side instead). See app/globals.css for what these two classes
 * actually do.
 */
export default function AccessibilityPreferences({ reduceMotion, largerText }) {
  useEffect(() => {
    document.body.classList.toggle('a11y-reduce-motion', Boolean(reduceMotion));
    document.body.classList.toggle('a11y-larger-text', Boolean(largerText));

    return () => {
      document.body.classList.remove('a11y-reduce-motion', 'a11y-larger-text');
    };
  }, [reduceMotion, largerText]);

  return null;
}

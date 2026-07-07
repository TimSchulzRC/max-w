# Chrome Web Store listing – copy & paste

Everything you need for the store submission form.

## Item name

```
max-w
```

## Summary (short description, max 132 chars – already in manifest)

```
Gives wide web pages a comfortable maximum reading width. Auto-detects the content, or pick the element yourself.
```

## Detailed description

```
Many websites – especially older blogs – let their main content stretch across your entire screen. On a large or ultrawide monitor that means very long lines of text that are tiring to read. max-w adds the container these sites are missing: it caps the content width and centers it, so lines stay a comfortable, readable length – without changing anything else about the page.

Unlike reader-mode extensions, max-w keeps the site exactly as it is. It just fixes the width.

FEATURES
• Opt-in per site – does nothing until you turn it on for a site, and it remembers your choice.
• Automatic detection – finds the main content and applies a sensible width.
• Skips pages that already have a container – no double work.
• Manual element picker – click the exact element you want to constrain.
• Adjustable width – set the max width per site with a slider.
• Scrollbar-safe – keeps the page's scrollbar at the edge of the window.
• Syncs your settings across your signed-in Chrome profiles.

PRIVACY
max-w runs entirely in your browser. It collects no data and makes no network requests. Your per-site settings are stored with Chrome's own sync storage.

max-w is free and open source: https://github.com/TimSchulzRC/max-w
```

## Category

```
Productivity   (alternative: Accessibility)
```

## Language

```
English
```

## Single purpose (form field)

```
max-w constrains the reading width of web pages by adding a maximum content width, so lines of text stay a comfortable length.
```

## Permission justifications

- **storage**
  ```
  Stores each site's on/off state, chosen width, and picked container element, and syncs them across the user's Chrome profiles. No data leaves the browser.
  ```
- **activeTab**
  ```
  Lets the popup communicate with the current tab to apply width changes and start the element picker on the page the user is viewing.
  ```
- **Host permission (all sites / `<all_urls>`)**
  ```
  The extension adds a reading-width container on any website the user chooses to enable it on. Because the content that needs constraining can be on any site, access to all sites is required. No page data is read or transmitted.
  ```

## Data usage declarations

- Does the item collect user data? **No.**
- Certify compliance with the Developer Program Policies: **Yes.**

## Privacy policy URL

```
https://github.com/TimSchulzRC/max-w/blob/main/PRIVACY.md
```

## Website / homepage URL

```
https://github.com/TimSchulzRC/max-w
```

## Assets in this folder

| File | Use in the store | Size |
| --- | --- | --- |
| `store-icon-128.png` | Store icon | 128×128 |
| `screenshot-light.png` | Screenshot 1 | 1280×800 |
| `screenshot-dark.png` | Screenshot 2 | 1280×800 |
| `promo-small.png` | Small promo tile | 440×280 |
| `promo-marquee.png` | Marquee promo tile | 1400×560 |

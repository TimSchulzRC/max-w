# Security Policy

## Supported versions

The latest release receives security fixes.

## Reporting a vulnerability

Please report security issues privately via GitHub's
[private vulnerability reporting](https://github.com/TimSchulzRC/max-w/security/advisories/new)
rather than opening a public issue.

max-w runs entirely in the browser: it reads the page DOM and stores per-site settings
in `chrome.storage.sync`. It makes no network requests and collects no data. Reports
about that scope (e.g. injected CSS, the element picker, or stored settings) are
especially welcome.

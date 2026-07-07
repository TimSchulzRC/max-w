# Contributing to max-w

Thanks for your interest in improving max-w! Contributions of all kinds are welcome —
bug reports, feature ideas, and pull requests.

## Getting started

```bash
git clone https://github.com/TimSchulzRC/max-w.git
cd max-w
npm install
npm run dev      # Vite watch mode; load the dist/ folder in chrome://extensions once
```

Load the extension via **Load unpacked** → select the `dist/` folder. After changes to
the content script or manifest, reload the extension and refresh the page.

## Before opening a pull request

- Run `npm run build` — it typechecks with `tsc` and produces a clean build.
- Keep changes focused and describe the behavior in the PR.
- Match the existing code style (TypeScript, no unnecessary comments).

## Reporting bugs

Open an issue using the **Bug report** template and include your Chrome version, the
site where it happens, and steps to reproduce.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating,
you are expected to uphold it.

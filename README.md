# Ihkam Quran App

## Local Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Deploy to GitHub Pages

This project is configured for GitHub Pages on this repository:

- `https://github.com/abdelrahman-ahmed-nassar/Ihkam-Quran-App`

### One-time setup in GitHub

1. Open repository `Settings` -> `Pages`.
2. Under `Build and deployment`, select `Source: GitHub Actions`.
3. Ensure your default branch is `main` (or update workflow branch trigger if different).

### How deployment works

- Pushing to `main` triggers the workflow in `.github/workflows/deploy.yml`.
- The workflow installs dependencies with pnpm, runs `pnpm build`, and deploys `dist` to GitHub Pages.

### Published URL

After the workflow succeeds, the site will be available at:

- `https://abdelrahman-ahmed-nassar.github.io/Ihkam-Quran-App/`


used resources
https://qul.tarteel.ai/resources/quran-script/61
https://qul.tarteel.ai/resources/font/249
https://qul.tarteel.ai/resources/mushaf-layout/10
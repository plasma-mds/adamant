# Dependency Security Audit

`npm audit` flagged 13 advisories (1 low, 2 moderate, 9 high, 1 critical) on 2026-09-08. All 13 are resolved — `npm audit` now reports **0 vulnerabilities**. This document records what was found, what changed, and why it was safe.

## How it was fixed

```bash
npm audit fix --legacy-peer-deps          # resolved 12 of 13, all patch/minor bumps
npm audit fix --legacy-peer-deps --force  # resolved the last one (vitest major bump, see below)
```

`--legacy-peer-deps` is required for every `npm install`/`npm audit fix` in this repo — `mathjax-react@1.0.6` declares a peer dependency on React ^15/^16 while the project uses React 17. This is a pre-existing, already-documented constraint (see `README.md` and `Dockerfile.client`), not something this audit introduced.

After fixing, the full test suite (91 tests) and a production build were run to confirm nothing broke:

```bash
npx vitest run     # 8 test files, 91 tests, all passing
npx vite build      # succeeds, output unchanged in size/shape
```

## What was vulnerable and how it was resolved

All 12 of these were resolved by a patch/minor version bump within the existing semver range declared by their parent packages — no breaking changes, no manual code changes required.

| Package | Severity | Before → After | Ships to users? | Advisory |
|---|---|---|---|---|
| `fast-uri` | High | 3.1.2 → 3.1.7 | **Yes** — transitive dep of `ajv` (used client-side for JSON Schema validation) | Host confusion / SSRF via malformed URI normalization ([GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) and 5 related) |
| `ws` | High | 7.5.10 → 7.5.13 | No — dev tooling (Vite HMR) only | Memory exhaustion DoS from tiny fragments ([GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)) |
| `brace-expansion` | High | 2.1.0 → 2.1.4 | No — dev tooling only | DoS via exponential/unbounded expansion (3 advisories) |
| `browserslist` | High | 4.28.2 → 4.28.9 | No — build-time only | Unbounded memory growth / prototype write (2 advisories) |
| `form-data` | High | 4.0.5 → 4.0.6 | No — dev tooling only | CRLF injection via unescaped multipart field names ([GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx)) |
| `js-yaml` | High | 4.1.1 → 4.3.2 | No — dev tooling only | Quadratic-complexity DoS in merge-key handling (3 advisories) |
| `nanoid` | High | 3.3.12 → 3.3.18 | No — dev tooling only | Infinite loop with negative/zero size (2 advisories) |
| `postcss` | High | 8.5.14 → 8.5.28 | No — build-time only | Path traversal / arbitrary `.map` file disclosure (2 advisories) |
| `@babel/core` | Low | 7.29.0 → 7.29.7 | No — build-time only | Arbitrary file read via `sourceMappingURL` comment ([GHSA-4x5r-pxfx-6jf8](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8)) |
| `vite` | High | 6.4.2 → 6.4.3 | No — dev server only | `server.fs.deny` bypass on Windows; NTLMv2 hash disclosure via UNC paths (dev server only, never runs in production) |
| `vite-node` | Moderate | (bundled with vitest) | No — dev tooling only | Depends on the vulnerable `vite` above |
| `@vitest/mocker` | Moderate | (bundled with vitest) | No — dev tooling only | Depends on the vulnerable `vite` above |

### The one major-version bump

| Package | Severity | Before → After | Ships to users? | Advisory |
|---|---|---|---|---|
| `vitest` | **Critical** | 2.1.8 → 5.0.0 | No — devDependency, test runner only | Arbitrary file read/execute when the Vitest UI server is listening ([GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)) |

This required a semver-major bump (no 2.x/3.x/4.x patch fixes it). It was still safe to take because:
- It's a devDependency — never ships to production or to end users' browsers.
- The vulnerability requires actively running `vitest --ui` with its UI server reachable; this repo's `test` script (`package.json`) runs plain `vitest`, and `--ui` is not used anywhere in the codebase or CI.
- The full test suite (91/91) and the production build were both verified green after the bump, with `vite.config.js`'s test configuration (`pool: 'forks'`, MUI dep inlining) working unchanged.

## Residual risk

None currently tracked — `npm audit` reports 0 vulnerabilities as of this audit. Re-run `npm audit` periodically (it only reflects advisories known at the time it's run) and repeat this process — `npm audit fix --legacy-peer-deps` first, escalate to `--force` only after verifying tests + build, same as above.

# @tesseracs/staging-portal

Reusable Expo/React Native web staging portal.

Tesseracs owns the generic staging logic:

- password-gated entry page
- language selector
- product/version cards
- Expo QR/link cards
- local unlock/language persistence

Child companies such as Memuli provide a small wrapper with brand text,
organization slug, stage-specific password hashes, product links, and versions.

Credential rule:

- username is derived from the organization slug, for example `memuli`
- password is selected by stage, for example `staging`, `preview`, or `production-check`
- plaintext passwords stay outside git; wrappers commit only SHA-256 hashes

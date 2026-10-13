# Secret-base quality and games upgrade

**Goal:** Preserve uploaded photo detail, add three replayable games, and improve the existing mobile site at its established GitHub URL.

**Approved scope:** User requested more games, improved functionality and pages, and clearer uploads, then delegated the choice of cooperative and competitive games. Keep existing room data, private keys, free infrastructure, and double-tap opening one fullscreen photo.

## Implementation

- [x] Photos: preserve original JPEG/PNG/WebP up to 10 MiB; produce a separate 960px preview. Validate bounded input and store large originals in D1 chunks below the row limit. Keep legacy files readable and all reads member-only. Verify byte equality, malformed input, deletion and foreign access.
- [x] Games: add cooperative minesweeper, three-stage circuit repair and competitive dots-and-boxes, reusing room invitations, state versioning, chat and reconnect. Test complete games, invalid moves, hidden information and completion outcomes.
- [x] Library: mobile search, category filters, favorites, recently played and clearly labeled invitation actions. Preserve the existing visual identity and navigation.
- [x] Mailbox: local export with content, author, time and status; acknowledge only messages visible in the foreground rather than the whole mailbox. Test message selection and export escaping.
- [x] Album: original quality description, upload states, correct download format and fullscreen previous/next navigation. Keep uncropped aspect ratio.
- [ ] Verify tests, TypeScript and production builds; review independent changes. Deploy backend with schema first, then main/Pages. Check actual deployment steps and published assets, and verify key interactions through available UI tooling.

## Risks to verify

Large mobile uploads must receive enough time; historical low-resolution uploads cannot be reconstructed. D1 chunk reads must avoid concatenating chunks inside a SQLite value. Hidden game information must never appear in snapshots. Exported private letters stay on the user's device and never enter the public repository. Older clients and the new frontend must remain compatible during backend-first deployment.

## Verification evidence

135 automated tests passed; TypeScript and GitHub production build passed. Cloudflare build passed after resolving Windows sandbox dependency access. Isolated Miniflare tests passed exact-byte JPEG 2,785,051 B / PNG 8,656,357 B / WebP 2,697,332 B storage, preview generation, member-only reads, paired deletion, selective read receipts and invitations/actions/chat for all three games. Native browser QA at 390px tested search, favorite toggle and dual-player preparation UI. Final independent code review found no important blocker. Deployment and public assets remain to be checked.

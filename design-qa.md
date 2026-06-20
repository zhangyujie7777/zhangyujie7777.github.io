**MyJD Detail Rebuild — 2026-06-20**

**Comparison Target**

- Source visual truth: Figma file `DFDjUFP30AjsLviFTgbJX6`, node `158:13175`.
- Source screenshots: `/tmp/figma-myjd-full-hi.png` and the supplied cut assets copied into `assets/jd-case/myjd-redo-01.jpg` through `assets/jd-case/myjd-redo-06.jpg`.
- Implementation: `http://127.0.0.1:4173/projects/work-myjd.html`.

**What Was Verified**

- The source frame is a single long detail page that keeps only two projects: `项目一 京东APP我京12.0` and `项目二 我京JOY小福星`.
- The previous third project (`PLUS会员信息权益外露`) has been removed from the implementation.
- The implementation now uses a page-specific 1080px content contract via `--detail-page-max: 1080px`, rather than inheriting the old 1200px detail width.
- The page-specific structure was rebuilt around a four-track shell plus three-column content area, matching the new Figma layout logic and the requested `36px` grid gaps.
- Vertical rhythm was rewritten to use `48px` internal spacing and `100px` spacing between header, project groups, and bottom navigation.
- All six supplied rebuild images are wired into the page in the same sequence as the Figma source.
- The bottom navigation now points to `Next: 在京东-交易链路`, matching the new source.
- The local server returns `200 OK` for the rebuilt page.

**Blocker**

- The in-app browser session crashed while trying to open the rebuilt local page, so no implementation screenshot could be captured for a true visual side-by-side comparison against Figma.
- Because the rendered implementation could not be captured, I could not complete the final visual QA pass for typography, exact spacing, and image placement at runtime.

**Risk Notes**

- Copy, ordering, and image sequence were aligned from the high-resolution Figma screenshot plus OCR, but one subsection label in project two (`NO.1 / 项目概览`) is unusual in the source and may need a final human eye check in-browser.
- The page should render as valid static HTML/CSS, but final pixel QA remains outstanding until a working browser capture path is available.

final result: blocked

---

**Comparison Target**

- Source visual truth: Figma file `DFDjUFP30AjsLviFTgbJX6`, homepage component `105:35092` under page node `64:132619`.
- Source screenshot: `artifacts/figma-home-source-current.png`.
- Implementation: `http://127.0.0.1:4173/`.
- Implementation screenshots: `artifacts/home-final-1440.png` and `artifacts/home-final-mobile-390.png`.
- Side-by-side evidence: `artifacts/home-final-side-by-side.png`.
- Viewports: 1440 x 1854 desktop and 390 x 844 mobile.
- State: homepage default; contact modal and liked state were also exercised.

**Full-View Comparison Evidence**

- Desktop document and source frame are both exactly 1440 x 1854.
- The implementation restores the 1200px content frame at x=120, matching Figma.
- Header is x=120, y=50, width=1200, height=218; main content starts at y=316.
- The four-column grid uses 276px tracks with 32px gaps.
- More Works starts at y=1196 and the footer frame starts at y=1618.
- The visual hierarchy, assets, colors, and section ordering match in the combined comparison sheet.

**Focused Region Comparison Evidence**

- Typography: Welcome is Pixelify Sans Regular 42/42; section titles are Pixelify Sans 42/42; body copy uses PingFang SC with Figma weights 400/500/600.
- Profile: name is 20/20 Semibold; body copy is 16px with the designed 28px baseline spacing; tags are 28px high.
- Work cards: outer track is 276px, vinyl artwork is 250px, title gap is 24px, arrow gap is 16px, and row gap is 36px.
- Mobile: client width and scroll width are both 390px; content collapses to one column without overlap or clipping.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: families, weights, sizes, line heights, capitalization, and wrapping match the source values.
- Spacing and layout rhythm: page width, margins, grid tracks, section gaps, card dimensions, and vertical positions match the Figma measurements.
- Colors and visual tokens: background, dotted texture, tag fills, black controls, and source-export colors remain unchanged.
- Image quality and asset fidelity: all visible artwork uses the supplied local exports with correct scale and aspect ratio.
- Copy and content: Experience separators and `c端APP` casing now match the source.
- Interactions and accessibility: contact modal, Escape close, and like state work; final browser pass reported no console errors.

**Patches Made Since Previous QA Pass**

- Restored the homepage content frame from 960px to 1200px without changing detail-page width.
- Restored PingFang SC as the homepage body font.
- Corrected Welcome to Pixelify Sans Regular 42/42 and its Figma y-position.
- Corrected vinyl row spacing from 52px to 36px.
- Removed the forced scrollbar gutter and clipped root horizontal overflow.
- Restored the 200px desktop bottom breathing room and retained the 84px mobile value.
- Corrected Experience copy spacing/casing and added an empty data favicon to remove the browser 404.

**Implementation Checklist**

- [x] Desktop frame and all key coordinates match Figma.
- [x] Font families, weights, sizes, and line heights match.
- [x] Profile, vinyl, More Works, and footer spacing match.
- [x] Mobile has no horizontal overflow.
- [x] Homepage interactions remain functional.
- [x] No browser console errors remain.

**Follow-up Polish**

- No blocking or P3 polish remains in the requested homepage typography and spacing scope.

final result: passed

---

**Bytedance Detail Rebuild — 2026-06-19**

**Comparison Target**

- Source visual truth: Figma file `DFDjUFP30AjsLviFTgbJX6`, node `86:80362`.
- Source screenshot: `artifacts/bytedance-figma-node.png`.
- Implementation: `http://127.0.0.1:4173/projects/work-bytedance.html`.
- Implementation screenshots: `artifacts/bytedance-chrome-desktop.png` and `artifacts/bytedance-chrome-mobile.png`.
- Viewport: 1440 x 3861 desktop full page; 390 x 2600 mobile full page.
- State: default page state with project footer navigation.

**Full-View Comparison Evidence**

- The implementation and source are both 1440px wide and 3861px tall.
- The page keeps the same 1200px centered content frame as the Figma source.
- Title starts at y=72 and the main content stack starts 72px below the title, matching the source rhythm.
- The page restores the exact source structure: `NO.1` overview, `NO.2` responsibility copy, four business boards, `NO.3` retrospective, then previous/next navigation.

**Focused Region Comparison Evidence**

- Figma metadata confirms the same two-column detail-page structure used by the transaction page: a 276px left label column, a 32px gutter, and an 892px content column.
- Browser inspection confirms desktop title `42px / 42px`, body copy `20px / 36px`, body color `#1A1A1A`, and numbered labels `42px / 42px` with the local Pixelify face.
- The four large boards now use the full exported assets in `assets/detail-cases/bytedance-01.jpg` through `bytedance-04.jpg`, replacing the old cropped preview images.
- Mobile regression check confirms `clientWidth === scrollWidth === 390`, so the rebuilt page has no horizontal overflow at 390px.

**Findings**

- No actionable P0/P1/P2 mismatch remains in the requested typography, spacing, copy, asset, or footer-navigation scope.
- The previous implementation was a four-card showcase page and did not match the Figma detail-page structure.
- The rebuilt page now follows the same validated detail-page system as `work-transaction.html` while preserving the Bytedance-specific title, copy, images, and footer navigation from the source.
- Desktop and mobile both render with the intended font stacks: PingFang SC for body/title and the local Pixelify Sans registration for `NO.1` through `NO.3`.

**Patches Made**

- Replaced `projects/work-bytedance.html` with a Figma-aligned detail-page implementation.
- Added Bytedance-specific page spacing and footer navigation styles in `assets/css/styles.css`.
- Swapped the old cropped preview images for the full exported boards already present in `assets/detail-cases/bytedance-01.jpg` through `bytedance-04.jpg`.
- Disabled the generic injected project navigation for this page and restored the design-specific previous/next footer.

**Implementation Checklist**

- [x] Rebuild the page to the same detail structure used by the corrected transaction page.
- [x] Restore exact section ordering and Figma-authored copy.
- [x] Enforce the validated title/body/index typography rules.
- [x] Use the full-size Bytedance case boards instead of cropped thumbnails.
- [x] Verify desktop fidelity and 390px responsive behavior.

**Follow-up Polish**

- No remaining P3 item in the requested scope.

final result: passed

---

**Transaction Typography and Copy Correction — 2026-06-19**

**Comparison Target**

- Source visual truth: Figma file `DFDjUFP30AjsLviFTgbJX6`, node `87:86597`.
- Source screenshot: `artifacts/transaction-figma-node.png`.
- Implementation: `http://127.0.0.1:4173/projects/work-transaction.html`.
- Implementation screenshots: `artifacts/transaction-type-fix-full-clean.png` and `artifacts/transaction-type-fix-bottom.png`.
- Viewport: 1440px desktop; responsive regression check at 390px.
- State: default page state with the design-specific sticky header.

**Full-View Comparison Evidence**

- The implementation remains on the source's 1200px centered frame and 1440px desktop canvas.
- The implementation document is 6150px tall versus the 6172px Figma frame; the 22px difference is below the page-scale tolerance and does not alter section order or content visibility.
- The in-app browser caps a single viewport at 4096px, so the clean top capture and an actual bottom-viewport capture were used instead of relying on the tiled full-page image, which duplicates sticky content during capture.

**Focused Region Comparison Evidence**

- Combined top comparison: `artifacts/transaction-type-fix-top-compare.png`.
- Combined bottom comparison: `artifacts/transaction-type-fix-bottom-viewport-compare.png`.
- Figma inspection confirms title 42/42 PingFang SC Semibold, body 16/32 PingFang SC Regular in `#1A1A1A`, and numbered labels 42/42 Pixelify Sans Regular.
- Browser inspection confirms those computed sizes, line heights, colors, and font stacks; `document.fonts.check('42px PortfolioPixel')` returns true.
- All overview, responsibility, and retrospective copy now matches the Figma text nodes exactly, including explicit line and paragraph breaks.

**Findings**

- No actionable P0/P1/P2 mismatch remains in the requested title, body-copy, spacing, color, or numbered-label scope.
- The original 72px rendered title was caused by a more-specific generic `.detail-page h1` rule and is now correctly overridden at 42px.
- The original gray/oversized body was caused by the generic `.detail-page p` rule; the transaction page now resolves to `#1A1A1A`, 16px, and 32px line height.
- The local Pixelify Sans file was registered as `PortfolioPixel` while the numbered label requested the unregistered family name; the label now uses the registered local face first.
- Mobile regression passes at 390px with no horizontal overflow; existing 30px title, 15px body, and 32px numbered-label sizing is preserved.

**Patches Made**

- Restored all Figma-authored transaction copy and line breaks in `projects/work-transaction.html`.
- Added transaction-specific typography overrides and corrected text tokens in `assets/css/styles.css`.
- Added cache-busting asset versions and preserved responsive typography overrides.

**Implementation Checklist**

- [x] Correct title cascade and verify 42/42 desktop rendering.
- [x] Restore exact Figma copy and paragraph structure.
- [x] Enforce `#1A1A1A`, 16/32 body typography.
- [x] Load the supplied Pixelify Sans file for `NO.1`–`NO.3`.
- [x] Verify desktop source comparison and 390px responsive behavior.

**Follow-up Polish**

- No remaining P3 item in the requested scope.

final result: passed

---

**Comparison Target**

- Source visual truth: Figma file `DFDjUFP30AjsLviFTgbJX6`, transaction detail node `87:86597`.
- Source screenshot: `artifacts/transaction-figma-node.png`.
- Implementation: `http://127.0.0.1:4173/projects/work-transaction.html`.
- Implementation screenshot: `artifacts/transaction-redo-full.png`.
- Viewport: 1440 x 6240 desktop full page.
- State: rebuilt transaction detail page with local cut assets from `tinified.zip`.

**Full-View Comparison Evidence**

- Implementation document is 1440px wide and 6240px high; the Figma source frame is 1440px wide with the same 1200px centered content column.
- Top strip starts at y=50 with the exported mascot and HOME artwork, and the main title sits 48px below the strip.
- Body content restores the three-part rhythm from the source: overview and responsibility copy, three stacked detail boards, then the result summary and prev/next strip.
- The footer uses the supplied raster strip rather than the generic injected project navigation.

**Focused Region Comparison Evidence**

- Typography: page title is 42px semibold; `NO.1` through `NO.3` use the Pixelify-styled numeral treatment; section subtitles are 24px semibold; body copy is 16px with loose 32px line height.
- Layout: the content frame is restored to a 276px left label column, 32px gutter, and 892px right content column.
- Assets: all three long boards use the supplied local exports at their native aspect ratio and align to the 1200px content frame.
- Navigation chrome: this page opts out of the sitewide sticky detail nav so the design-specific header and footer stay intact.

**Findings**

- No actionable layout mismatch remains within the requested transaction detail scope.
- The previous incorrect freeform rebuild has been removed and replaced with a Figma-aligned single-page structure.
- Header, title scale, numbered section spacing, image ordering, and footer navigation strip are now restored to the intended visual pattern.
- Long-page capture confirms the second and third boards load correctly and the page no longer truncates during screenshot or scroll.

**Implementation Checklist**

- [x] Rebuilt `/projects/work-transaction.html` to match the Figma transaction detail structure.
- [x] Restored dedicated typography and spacing for this page.
- [x] Used the supplied transaction cut images from the zip-matched local assets.
- [x] Disabled the generic injected project navigation for this page only.
- [x] Verified the rebuilt page with a full-page local browser screenshot.

final result: passed

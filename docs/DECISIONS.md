# Architecture decisions

## ADR-001: Preserve the playbook stack

Use Java 21, Spring Boot 3.5.16, React with strict TypeScript, PostgreSQL 17, and
Docker Compose. Spring Boot 3.5.16 was confirmed in Maven Central's published
3.5 release metadata during initialization. Dependency manifests and the npm
lockfile will record exact application dependencies.

Use Node 22 in build containers. Host Node 14 is unsuitable and Java is absent
from PATH; do not replace host runtimes. Docker is installed and the user
started its engine. Container images may receive patch updates within their
declared families; release-image digest pinning is a later packaging task.

The official `create-vite@9.3.4` React/TypeScript scaffold selects Vite 8,
React 19, TypeScript 7, and Oxlint. Retain that compatible toolchain rather than
replacing its linter with the originally considered ESLint. Add Prettier,
Vitest, runtime response validation, and Playwright for the required gates.

## ADR-002: Prove the skeleton without premature task APIs

Use a database-backed system metadata endpoint plus a non-persistent configuration
preflight. This proves routing, JSON contracts, request validation, migrations,
database connectivity, and UI behavior without inventing a partial durable
task engine. The representative task routes begin in Phase 2.

Preflight's response always explicitly states that execution is disabled.

## ADR-003: PostgreSQL is authoritative; defer optional infrastructure

Use Flyway for schema ownership. Phase 1 creates only installation metadata.
Redis and Kafka have no demonstrated requirement yet and are not started.
This avoids introducing dual state stores or non-transactional event writes.

## ADR-004: Local-only access, future identity boundary

Publish only the web gateway on `127.0.0.1:18110`; proxy the API and health paths
through it. No host API/database ports. Development and verification use separate
Compose project names (`replicas` and `replicas-check`); verification publishes
no ports. This avoids collisions with other concurrent project sessions.

Authentication is deliberately absent from non-executing Phase 1 routes.
An identity provider and tenant/role contract must be selected and tested before
Phase 2 exposes task operations. Do not silently treat a request header as proof
of identity.

## ADR-005: Project-scoped operational safety

The user approved initializing a local Git repository on `main`, not committing
or publishing. Generate local credentials without printing them. Keep source,
configuration, test reports, and local credential files within this repository.
Docker owns images and named volumes as part of the approved local runtime.

Only operate on this project's Compose resources. Do not run global cleanup,
delete data volumes, restart Docker Desktop, or change sibling projects.

## ADR-006: Verification before completion

The same PowerShell command runs local and CI checks in containers.
Use real PostgreSQL for integration and smoke tests; do not substitute an
in-memory database. Browser tests exercise the built UI through the gateway.
The verification project is separate from the user's development stack.
CI configuration is not evidence that a hosted CI run has passed.

## ADR-007: Interface design system

The dashboard uses self-hosted variable fonts (Fraunces, Geist, Geist Mono)
from exact-pinned `@fontsource-variable` packages under the SIL Open Font
License. Vite bundles them and the gateway serves them, so the page makes no
third-party requests and the content-security policy stays unchanged. Asset
inlining is disabled because that policy has no `data:` font source.

The page is one scrolling experience made of full-width colour blocks. Each
section takes one tone (night, citron, lavender, or the theme's base tone) and
components read only that tone's variables. Two themes, Midnight (default) and
Daylight, change the base tone and the hero backdrop; the choice is stored in
`localStorage` only. Body text colours are checked against WCAG AA per tone.

Motion is a setting, not only a media query. `data-motion` on the root element
starts from the system's reduced-motion preference, can be switched in the
header, and is remembered. With motion off there is no boot sequence, no
scroll-linked movement, no wheel glide, no pinned roadmap, no cursor follower,
and each sculpture is a single still frame. Every piece of content and every
control works either way.

Script-driven animation is eased by elapsed time, never by a fixed amount per
frame, so it behaves the same at 30, 60 or 144 frames a second. A frame is
stamped with the time it began, which can be earlier than a clock reading taken
a moment before, so progress is never allowed below zero.

Motion must not cost layout. While the page scrolls or the pointer moves,
script and CSS change only transforms, opacity and clipping. One animation
frame serves every scroll effect and works in a fixed order: read the scroll
position once, measure sizes only when they may have changed, then write.
Anything that would lay the page out on every frame is done another way:
letters are stretched, not re-weighted; a moving dot slides, it is not
repositioned; a counter rolls strips of digits, it does not rewrite text.
A browser check counts layouts and fails when a settled page needs more than
two to scroll its whole length and back. Text that changes once on first view
(the boot counter, the decoding labels) is the stated exception.

Scrolling stays the browser's. With motion on, whole notches of a mouse wheel
glide to their target. A touchpad's stream of small movements is left to the
browser, which already scrolls it smoothly off the main thread. Anything else
that moves the page (keys, links, the scrollbar, touch, another script)
cancels a glide and wins. Pinch-zoom and sideways wheels are left alone.

The hero sculpture is drawn with WebGL by code written for this project, with
no 3D library. Since the fifth pass it is ordinary geometry (about 2,400
triangles drawn in one call), not a shape traced per pixel, which is what made
it too slow for integrated graphics. Each plate moves on its own springs, so
the stack assembles, leans, fans out and settles like something with weight.
Edges are softened in the shader, so the canvas needs no multisampling. It is
decoration: hidden from assistive technology and never needed to use the page.
It animates only on GPU renderers, while the hero is on screen and the tab is
visible. If frames stay slow it lowers its resolution once, then stops. A CPU
renderer gets one still frame. Without WebGL, or after the graphics context is
lost, a flat SVG schematic stands in.

The same renderer draws a second stack in the preflight console, sized from the
two limits in the form: 6 to 21 plates for the timeout and 62% to 100% of full
width for the memory. It illustrates the numbers typed and says so beside the
drawing. It has no part in validation: only the API's answer changes how it is
drawn. It runs on GPU renderers only, and only while on screen. Everywhere
else the schematic follows the same numbers, because a CPU renderer would
stall the sliders.

The hero is pinned while the page slides over it. Below 560 px of viewport
height it scrolls normally instead, so nothing in it is ever out of reach.

Two more layouts depend on room. The roadmap becomes a pinned horizontal strip
only at 1000 px wide and 620 px tall or more, with motion on; otherwise it is
an ordinary list. The marker on its rail shows where the view is along the
strip, never how far the work has come. The footer waits under the page only
when all of it fits on screen. Focus moving into it scrolls it into view, and
the block that reserves its scrolling room lets the pointer through.

Text that is split up for animation keeps its name. Headings split into
letters or words carry the full text as their accessible name, and labels that
resolve out of scrambled characters keep an untouched copy for assistive
technology.

The interface shows only values it actually has: API metadata, the measured
round trip of its own request, the checks it measured during this visit, the
request body it will send, and the response it received. The boot counter
follows real milestones (typefaces loaded, first stack response) and gives up
after about three seconds. Decoration is hidden from assistive technology, and
planned phases are labelled as planned.

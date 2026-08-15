---
name: Uploaded Vite bundle setup
description: Durable setup note for running complete Vite sites restored from uploaded archives.
---

When restoring a complete Vite site from an uploaded archive, expect the archive to contain the source and package lockfile but not installed dependencies. Install the declared Node packages before restarting the web workflow.

**Why:** The site source can be fully intact while the workflow still fails with `vite: not found` in a fresh repl.

**How to apply:** After copying the archive into the workspace, check for `node_modules` and install the package manifest dependencies before verification.
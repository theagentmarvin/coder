PR: tidy/4-mobile-fix-and-docs

Scope
- Collect and tidy current workspace changes related to ThatOpen fragment viewers.
- Provide developer-facing documentation to reproduce desktop build, smoke tests, and to explain the remaining mobile build issues.
- Prepare a small changelog and TODO for later work (mobile TS issues, worker vendoring, bundle-splitting).

What to include in the PR
- All commits already present in workspace-coder (shared adapter, shared raycast helper, desktop viewer patches, smoke-test, placeholder workers).
- New files (this PR): PR_SUMMARY.md, README_RUN.md, CHANGELOG.md, TODO_MOBILE.md

Goal
- Make it trivial for a reviewer or the Coder agent to pick up the work and continue. Document the failures and provide explicit next steps.

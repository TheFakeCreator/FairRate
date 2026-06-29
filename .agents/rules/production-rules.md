---
trigger: always_on
description: Production readiness and backward compatibility rules
---

# Production Chrome Extension Rules

When working on this codebase, you MUST adhere to the following rules:

1. **Production Readiness & Backward Compatibility**:
   - This is a production-ready Chrome Extension. Whenever you define a new feature, you must comprehensively update the extension code, `manifest.json`, `CHANGELOG.md`, and any related documentation.
   - You MUST ensure full backward compatibility. When updating code or storage structures (e.g. `localforage` or Mongoose Schemas), write migration logic to safely transition existing users to the new version without any data loss.

2. **Changelog Maintenance**:
   - When adding any new feature for the next release, always update the `CHANGELOG.md` file to include the new feature.

3. **Release Push Protocol**:
   - When doing a release push, you MUST generate a release note with a release title.
   - You MUST generate the compiled release zip file for distribution.
   - You MUST update the associated website to reflect the new changes during the release push. Along with the correct download button.
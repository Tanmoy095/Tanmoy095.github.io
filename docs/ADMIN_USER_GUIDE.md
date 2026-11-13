# Admin User Guide

Open `/admin/` on the public website after `PUBLIC_API_BASE_URL` and Vercel server variables have been configured. If the API cannot be reached, the login page displays the configuration error; it never enables local password authentication.

Sign in with `ADMIN_EMAIL` and the password corresponding to the server's scrypt `ADMIN_PASSWORD_HASH`. The session expires after 30 minutes. Log out when finished.

The dashboard provides profile fields (identity, summaries, links, roles and skills), project editing, blog Markdown CRUD, and learning/ADR entries. Uploads publish to the approved media folders; profile photo and CV references must be saved in profile data after upload. Publishing commits content to GitHub. Wait for the Pages workflow before checking the public change.

For an edit, open the item, change fields, then publish. For deletion, use the item's Delete action and confirm. Test deletion only on content created for testing; a repository commit can be reverted, but deletion is public after deployment. If a conflict appears, reload the item and reapply your edits so the current GitHub SHA is used.

This iteration preserves the existing dashboard editors but has not browser-verified every CRUD flow. CMS readiness and deployment still depend on server configuration and live integration checks.

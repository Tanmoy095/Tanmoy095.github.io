# Admin User Guide

## Academics & Life module

The Academics & Life tab manages academic profiles, research projects and notes, personal writing, travel journals, book notes, quotes, and reflections through the shared typed knowledge collection. Choose a type, complete its fields, and use the Markdown editor and preview. Search/filter entries, edit, and delete from the list.

New records start as drafts. **Save Draft** keeps an entry out of generated public pages. To publish, select Published and submit. Select Draft to unpublish. Unlisted entries can be opened by anyone with the URL and stay out of section indexes and sitemap; they are not private.

Photo uploads are re-encoded and lose EXIF/GPS metadata. Research PDFs are limited to 3 MB. Private entries are stored in the protected Redis store and do not reach GitHub. Draft and unlisted Markdown are still readable in the public repository, so do not store sensitive information in them.

Open `/admin/` on the public website after `PUBLIC_API_BASE_URL` and Vercel server variables have been configured. If the API cannot be reached, the login page displays the configuration error; it never enables local password authentication.

Sign in with `ADMIN_EMAIL` and the password corresponding to the server's scrypt `ADMIN_PASSWORD_HASH`. The session expires after 30 minutes. Log out when finished.

The dashboard provides profile fields (identity, summaries, links, roles and skills), project editing, blog Markdown CRUD, and learning/ADR entries. Uploads publish to the approved media folders; profile photo and CV references must be saved in profile data after upload. Publishing commits content to GitHub. Wait for the Pages workflow before checking the public change.

For an edit, open the item, change fields, then publish. For deletion, use the item's Delete action and confirm. Test deletion only on content created for testing; a repository commit can be reverted, but deletion is public after deployment. If a conflict appears, reload the item and reapply your edits so the current GitHub SHA is used.

The private-entry editor requires Redis to be configured and available. CMS readiness and deployment still depend on server configuration and live integration checks; local tests do not verify production credentials or live browser CRUD.

# Project architecture rules

- Treat `drizzle/migrations/0000_security_login_ip_notifications_storage_policies.sql` as the complete fresh-database baseline; later Drizzle migrations only add dated blocking behavior, avoiding dependencies on the retired backend migration history.
- Staff push delivery uses the shared notification helper; log only safe delivery identifiers and statuses, never raw provider responses, so secrets cannot leak through diagnostics.

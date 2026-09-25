# Documents

Employee documents extend the existing `employee_documents` metadata table. Document types are organization-configurable. Files are uploaded through `StorageProvider`; PostgreSQL stores metadata and storage keys only. If no provider is configured, upload returns a configuration error. Failed metadata writes attempt to delete the uploaded object.

Download requests authorize the tenant and employee ownership server-side, then return a short-lived signed URL. Verification history, replacement version metadata, expiry dates, and expiring-document queries are supported. Private document URLs are not exposed directly by the application.

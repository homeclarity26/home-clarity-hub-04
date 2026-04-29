// Shared file-upload constants.
//
// Adam wanted every upload control to take whatever a homeowner or
// consultant might hand them — PDFs, Word docs, plaintext, Markdown,
// spreadsheets, JPG/PNG/HEIC, audio, video, the works. Hardcoded
// `accept="image/*"` patterns were rejecting reasonable inputs at the
// browser before they could even hit storage.

// Permissive accept for general file controls (intake materials, project
// documents, message attachments). The empty string means "any file" and
// is more browser-friendly than `*/*` which a few older browsers
// interpret as "no filter at all" but render as a confusing label.
export const ACCEPT_ANY_FILE = "";

// Image-focused inputs (avatar pickers, photo galleries, hero shots)
// stay restricted to images for sane UX, but explicitly include HEIC and
// HEIF so iPhone exports match by file extension when the browser fails
// to set the MIME type.
export const ACCEPT_IMAGES = "image/*,.heic,.heif";

// 50 MB cap per file — matches the wizard-uploads bucket ceiling and the
// Supabase project default. Used by client-side guards that surface a
// friendly toast before the request hits storage and fails opaquely.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

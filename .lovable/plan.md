

## Build AI Client Chat Assistant + Creator Editing Panel + Comments + Back to Admin

I'll build as many remaining features as possible in one pass. Here's everything:

### 1. AI Client Chat Assistant
- **Edge function** `chat-assistant` — receives messages + report context, calls Lovable AI (gemini-3-flash-preview) with system prompt as a home advisor
- **`ChatPanel.tsx`** — Sheet sliding up from bottom, chat bubbles with markdown rendering, streaming responses
- **`Footer.tsx`** — wire search bar click/focus to open the chat panel, pass property context

### 2. AI Creator Editing Panel  
- **Edge function** `ai-edit` — receives current block content + instruction, returns edited version
- **`AIEditPanel.tsx`** — 350px right panel with instruction input, shows diff preview, Apply/Discard buttons
- **Sparkle button** on `EditableSection.tsx` — opens AI edit panel for that block
- Wire into `ReportPage.tsx`

### 3. Client Comments on Report Pages
- **DB migration** — create `report_comments` table (report_page_id, user_id, comment_text, comment_type question/note, response_text, resolved, timestamps) with RLS
- **`CommentsSection.tsx`** — renders at bottom of each report page, shows existing comments, add new comment form
- **Wire into admin** `CommentsManager.tsx` — query real comments instead of mock data

### 4. Back to Admin Navigation
- **`CreatorBar.tsx`** — add "Back to Admin" link when URL has `?from=admin` or similar param
- **Admin "Open in Portal" buttons** — append `?from=admin&clientId=X` to portal URLs

### 5. Report Landing Page
- Update `ReportTab.tsx` — when no page selected, show navy hero with property name and table of contents

### Files to create
- `supabase/functions/chat-assistant/index.ts`
- `supabase/functions/ai-edit/index.ts`  
- `src/components/chat/ChatPanel.tsx`
- `src/components/chat/ChatMessage.tsx`
- `src/components/chat/useChat.ts`
- `src/components/editor/AIEditPanel.tsx`
- `src/components/report/CommentsSection.tsx`

### Files to modify
- `supabase/config.toml` — add function configs
- `src/components/Footer.tsx` — wire chat panel
- `src/components/editor/EditableSection.tsx` — add sparkle button
- `src/components/report/ReportPage.tsx` — add comments section + AI panel
- `src/components/report/CreatorBar.tsx` — add Back to Admin link
- `src/components/tabs/ReportTab.tsx` — landing page hero
- `src/components/admin/CommentsManager.tsx` — wire to real data
- `src/components/admin/ReportPageManager.tsx` — add "Open in Portal" links with params
- DB migration for `report_comments` table

### Database: `report_comments` table
```sql
CREATE TABLE report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_page_id uuid NOT NULL REFERENCES report_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment_text text NOT NULL,
  comment_type text NOT NULL DEFAULT 'note', -- 'question' or 'note'
  response_text text,
  responded_by uuid,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;
-- RLS: clients can view/insert on their own report pages, creators can do everything
```

### No new dependencies needed
- Already have Sheet component for chat panel
- Will render markdown with simple prose styling (no react-markdown needed — use dangerouslySetInnerHTML with basic formatting or just whitespace-pre-wrap)


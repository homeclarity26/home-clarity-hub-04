

# Wire CommentsManager to Real Data with Profile Names & Relative Time

## Current State
The component already queries `report_comments` from the database, but is missing: commenter names (no profile join), an "unresolved" filter option, auto-resolving on reply, and relative timestamps.

## Changes (1 file)

### `src/components/admin/CommentsManager.tsx`

1. **Join profiles for commenter names**: After fetching comments, batch-fetch profiles for all unique `user_id` values and map `full_name` / `avatar_initials` onto each comment.

2. **Add "unresolved" filter**: Extend the filter type to `"all" | "unresolved" | "question" | "note"`. Add a button for "Unresolved" with a badge count. Filter logic: `!c.resolved`.

3. **Auto-resolve on reply**: In `handleReply`, update both `response_text` and `resolved: true` in a single `.update()` call.

4. **Relative timestamps**: Use `date-fns` `formatDistanceToNow` (already installed) to display "2 hours ago" instead of "Mar 9".

5. **Show commenter name**: Display the profile's `full_name` (or "Unknown") next to the page title in each comment card.


# How to Run Cleanup for Low-Quality Matches

## Quick Start

Run the cleanup script to remove all matches with similarity < 70%:

```bash
# From the backend directory
npm run cleanup-matches
```

Or directly:
```bash
# From the backend directory
node scripts/cleanup-matches.js
```

## What the Cleanup Does

1. ✅ Checks all lost items with potential matches
2. ✅ Recalculates similarity using accurate Xenova models
3. ✅ Removes matches with < 70% similarity
4. ✅ Updates the database with only high-quality matches
5. ✅ Shows detailed progress and statistics

## Example Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🧹 Starting cleanup of low-quality matches...
📊 Found 15 lost items with potential matches to check

[1/15] Checking: "Green Blanket"
   Current matches: 4
   ❌ Removed: "dolo tablet" (22% - below threshold)
   ❌ Removed: "triangular lines pattern" (19% - below threshold)
   ❌ Removed: "gold and pink beaded" (18% - below threshold)
   ✅ Kept: "Green blanket with blue trim" (85%)
   📝 Updated: Removed 3 low-quality match(es)

✅ Cleanup Complete!
📊 Statistics:
   - Lost items cleaned: 12
   - Total matches checked: 45
   - Low-quality matches removed: 28
   - Remaining high-quality matches: 17
```

## Alternative: Use API Endpoint

You can also trigger cleanup via API:

```bash
# Clean all items (requires authentication)
POST http://localhost:8080/api/cleanup-matches
Headers: Authorization: Bearer YOUR_TOKEN

# Clean specific item
POST http://localhost:8080/api/lost-items/:itemId/cleanup-matches
Headers: Authorization: Bearer YOUR_TOKEN
```

## When to Run Cleanup

- After fixing matching algorithms
- When you notice irrelevant matches showing up
- Periodically (e.g., weekly) to maintain database quality
- After importing old data with low-quality matches


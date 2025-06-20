# Claude CLI Instructions: Inline Send Back Confirmation

## Task
Replace the direct Send Back action with an inline confirmation warning that appears in the UI (not a browser popup).

## Files to Modify
- `src/components/admin/UserManagement/ReadyForTestingTab.tsx`

## Changes Required

### 1. Add State for Confirmation
Add this state variable with the other useState declarations around line 25:
```typescript
const [sendBackConfirm, setSendBackConfirm] = useState<string | null>(null);
```

### 2. Modify handleSendBack Function
Replace the current `handleSendBack` function (around line 176) with:
```typescript
const handleSendBack = (userId: string) => {
  // Show inline confirmation warning
  setSendBackConfirm(userId);
};
```

### 3. Modify confirmSendBack Function
Update the `confirmSendBack` function to hide the confirmation first:
```typescript
const confirmSendBack = async (userId: string) => {
  setSendBackConfirm(null); // Hide the confirmation
  setProcessingUser(userId);
  try {
    await onSendBackToPending(userId, 'Sent back from QA testing');
    // ... rest of existing function stays the same
```

### 4. Add Inline Confirmation UI
Add this confirmation component right after the closing `</div>` of each user card (around line 700, before the closing `</div>` of the map function):

```tsx
{/* Inline Send Back Confirmation */}
{sendBackConfirm === user.id && (
  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-medium text-amber-800 mb-1">
          Send Back to Pending?
        </h4>
        <p className="text-sm text-amber-700 mb-3">
          This will move the client back to pending status and remove all website/script data. Are you sure?
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => confirmSendBack(user.id)}
            disabled={processingUser === user.id}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {processingUser === user.id ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending Back...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Yes, Send Back</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSendBackConfirm(null)}
            disabled={processingUser === user.id}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

## Expected Behavior
1. Click "Send Back" → Shows inline amber warning box below the user card
2. Click "Yes, Send Back" → Executes the send back action and hides warning
3. Click "Cancel" → Hides the warning without taking action
4. Only one confirmation can be shown at a time (per user)

## Build Instructions
After making changes:
1. Update cache-busting version in `index.html` to `v=6.0-inline-confirm`
2. Build and deploy
3. Test with hard refresh (Ctrl+Shift+R)

## Notes
- This replaces the browser popup with a user-friendly inline confirmation
- Uses amber/warning styling to indicate destructive action
- Provides clear explanation of consequences
- Allows easy cancellation 
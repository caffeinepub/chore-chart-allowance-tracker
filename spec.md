# Chore Chart & Allowance Tracker

## Current State
New project with no existing code.

## Requested Changes (Diff)

### Add
- Child profiles: name, avatar/color, current balance
- Chore management: name, description, money amount, frequency (unlimited daily / once a day / once a week)
- Children can mark chores as complete (pending approval)
- Parent can approve or reject completed chores; money only added upon approval
- Parent can add deductions (negative transactions) for misbehavior with a note
- Transaction history per child (earnings and deductions)
- Parent admin view: manage children, manage chores, approve/reject pending completions, add deductions
- Child view: see their chores, mark chores complete, see their balance and recent earnings
- Kid-friendly UI with large text, colorful cards, simple navigation

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - Data types: Child, Chore, ChoreCompletion (pending/approved/rejected), Transaction
   - CRUD for children: add, list, delete
   - CRUD for chores: add, list, delete, with frequency (unlimited/daily/weekly)
   - Chore completion: markComplete (child action), approveCompletion, rejectCompletion (parent action)
   - Deductions: addDeduction(childId, amount, reason) decrements balance
   - Balances derived from approved transactions
   - Frequency enforcement: block duplicate same-day or same-week completions for restricted chores

2. Frontend:
   - Two modes: Parent mode (full access) and Child mode (select child, see their view)
   - Parent dashboard: tabs for Children, Chores, Pending Approvals, and per-child history
   - Child dashboard: greeting with balance, list of available chores with "Done!" button
   - Pending approvals list for parent with approve/reject controls
   - Add deduction form per child
   - Colorful, large-type, friendly design suitable for kids

# Web UI Verification Examples

## Example 1: Login Verification

**Task**: Verify login works with valid credentials

```
Step 1: Navigate
CallMcpTool(user-playwright, browser_navigate)
{
  "url": "https://discordbot.alexcodeforge.com/login"
}

Step 2: Take snapshot to see form structure
CallMcpTool(user-playwright, browser_snapshot)
{}

Step 3: Fill login form
CallMcpTool(user-playwright, browser_fill_form)
{
  "fields": {
    "email": "user@example.com",
    "password": "password123"
  }
}

Step 4: Submit form
CallMcpTool(user-playwright, browser_click)
{
  "target": "button containing 'Login'"
}

Step 5: Verify success
CallMcpTool(user-playwright, browser_snapshot)
{}
# Check snapshot shows dashboard, not login page

Step 6: Done
CallMcpTool(user-playwright, browser_close)
{}
```

## Example 2: Kanban Board Check

**Task**: Verify kanban board displays correctly

```
Step 1: Login first (use workflow from Example 1)

Step 2: Navigate to kanban
CallMcpTool(user-playwright, browser_navigate)
{
  "url": "https://discordbot.alexcodeforge.com/"
}

Step 3: Get page structure
CallMcpTool(user-playwright, browser_snapshot)
{}
# Look for: columns, cards, drag handles

Step 4: Check console for errors
CallMcpTool(user-playwright, browser_console_messages)
{}

Step 5: Take screenshot
CallMcpTool(user-playwright, browser_take_screenshot)
{
  "filename": "kanban-board.png"
}

Step 6: Close
CallMcpTool(user-playwright, browser_close)
{}
```

## Example 3: Network Request Debugging

**Task**: Check if API calls succeed during login

```
Step 1: Navigate to login
CallMcpTool(user-playwright, browser_navigate)
{
  "url": "https://discordbot.alexcodeforge.com/login"
}

Step 2: Fill and submit (combined)
CallMcpTool(user-playwright, browser_fill_form)
{
  "fields": {
    "email": "user@example.com",
    "password": "password123"
  }
}

CallMcpTool(user-playwright, browser_click)
{
  "target": "button with text Login"
}

Step 3: Check network requests
CallMcpTool(user-playwright, browser_network_requests)
{}
# Look for: POST /api/login, status 200/401

Step 4: Close
CallMcpTool(user-playwright, browser_close)
{}
```

## Example 4: Check Specific Element

**Task**: Verify "Add Lead" button exists and is clickable

```
Step 1: Login (using standard workflow)

Step 2: Get page snapshot
CallMcpTool(user-playwright, browser_snapshot)
{}
# Search for button containing "Add Lead"

Step 3: Click the button
CallMcpTool(user-playwright, browser_click)
{
  "target": "button containing 'Add Lead'"
}

Step 4: Verify modal/form opened
CallMcpTool(user-playwright, browser_snapshot)
{}
# Check for form fields in snapshot

Step 5: Close
CallMcpTool(user-playwright, browser_close)
{}
```

## Example 5: Form Interaction

**Task**: Create a new lead via UI

```
Step 1: Login

Step 2: Click "Add Lead"
CallMcpTool(user-playwright, browser_click)
{
  "target": "button with text Add Lead"
}

Step 3: Fill lead form
CallMcpTool(user-playwright, browser_fill_form)
{
  "fields": {
    "name": "Test Lead",
    "email": "lead@example.com",
    "phone": "1234567890"
  }
}

Step 4: Submit
CallMcpTool(user-playwright, browser_click)
{
  "target": "button with text Save"
}

Step 5: Verify lead appears
CallMcpTool(user-playwright, browser_snapshot)
{}
# Check kanban has new card

Step 6: Close
CallMcpTool(user-playwright, browser_close)
{}
```

## Example 6: Multi-Page Flow

**Task**: Navigate through multiple pages

```
Step 1: Login

Step 2: Go to leads list
CallMcpTool(user-playwright, browser_navigate)
{
  "url": "https://discordbot.alexcodeforge.com/"
}

Step 3: Click on a lead
CallMcpTool(user-playwright, browser_click)
{
  "target": "first lead card"
}

Step 4: Verify detail page
CallMcpTool(user-playwright, browser_snapshot)
{}

Step 5: Go back
CallMcpTool(user-playwright, browser_navigate_back)
{}

Step 6: Verify back on list
CallMcpTool(user-playwright, browser_snapshot)
{}

Step 7: Close
CallMcpTool(user-playwright, browser_close)
{}
```

## Example 7: Error State Verification

**Task**: Verify error message on invalid login

```
Step 1: Navigate to login
CallMcpTool(user-playwright, browser_navigate)
{
  "url": "https://discordbot.alexcodeforge.com/login"
}

Step 2: Fill with wrong credentials
CallMcpTool(user-playwright, browser_fill_form)
{
  "fields": {
    "email": "wrong@example.com",
    "password": "wrongpass"
  }
}

Step 3: Submit
CallMcpTool(user-playwright, browser_click)
{
  "target": "button Login"
}

Step 4: Check for error message
CallMcpTool(user-playwright, browser_snapshot)
{}
# Look for error text in snapshot

Step 5: Check console
CallMcpTool(user-playwright, browser_console_messages)
{}

Step 6: Close
CallMcpTool(user-playwright, browser_close)
{}
```

## Tips

1. **Always read tool schemas first**: Check `/home/discordbot/.cursor/projects/home-discordbot-code/mcps/user-playwright/tools/` for exact parameters

2. **Use snapshot before screenshot**: Snapshots are structured data, easier to verify programmatically

3. **Chain actions efficiently**: Don't close/reopen browser unnecessarily

4. **Descriptive selectors**: Use text content when possible, refs when specific

5. **Check multiple sources**: Snapshot + console + network gives complete picture

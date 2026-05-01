---
name: web-ui-verification
description: Verify web UI functionality using Playwright MCP browser automation. Use when checking UI elements, testing user flows, verifying visual components, or when the user asks to check the web interface, login flow, or any frontend functionality at discordbot.alexcodeforge.com.
disable-model-invocation: true
---

# Web UI Verification

Verify UI functionality using Playwright MCP for the CRM Discord Bot web interface.

## Application URL

**Main app**: https://discordbot.alexcodeforge.com/login

## Credentials

**IMPORTANT**: Fill in credentials before using this skill:

```
EMAIL: admin_crm_2026
PASSWORD: CRM#Admin@2026!Secure$Pass
```

## Session Persistence

Playwright MCP keeps browser context alive between operations. Sessions persist automatically until browser is closed.

To maintain login state across verifications:
1. Login once at the start
2. All subsequent operations use the same session
3. Only close browser when verification is complete

## Available MCP Tools

All tools are in the `user-playwright` MCP server:

### Navigation
- `browser_navigate` - Go to URL
- `browser_navigate_back` - Go back
- `browser_tabs` - List open tabs

### Inspection
- `browser_snapshot` - Get page structure (better than screenshot)
- `browser_take_screenshot` - Visual screenshot
- `browser_console_messages` - Get console logs
- `browser_network_requests` - View network activity

### Interaction
- `browser_click` - Click element
- `browser_type` - Type text
- `browser_fill_form` - Fill multiple fields
- `browser_hover` - Hover over element
- `browser_press_key` - Press keyboard key
- `browser_select_option` - Select dropdown option

### Lifecycle
- `browser_close` - Close page

## Login Workflow

```markdown
1. Navigate to login page
2. Fill credentials
3. Submit form
4. Verify successful login
```

**Implementation**:

```
1. CallMcpTool(user-playwright, browser_navigate)
   - url: "https://discordbot.alexcodeforge.com/login"

2. CallMcpTool(user-playwright, browser_fill_form)
   - fields: {"email": "[EMAIL]", "password": "[PASSWORD]"}

3. CallMcpTool(user-playwright, browser_click)
   - target: "button containing 'Login' or 'Sign in'"

4. CallMcpTool(user-playwright, browser_snapshot)
   - Verify redirect to dashboard
```

## Verification Checklist

When verifying UI:

- [ ] Navigate to the page
- [ ] Take initial snapshot to understand structure
- [ ] Perform required actions
- [ ] Verify expected elements exist
- [ ] Check console for errors
- [ ] Confirm correct navigation/state
- [ ] Close browser when done

## Common Verification Patterns

### Pattern 1: Element Existence
```
1. Navigate to page
2. Take snapshot
3. Search snapshot for expected element
4. Report found/not found
```

### Pattern 2: User Flow
```
1. Navigate to starting point
2. For each step:
   - Perform action (click, type, etc)
   - Take snapshot
   - Verify state changed correctly
3. Close browser
```

### Pattern 3: Visual Check
```
1. Navigate to page
2. Take screenshot
3. Report visual state
4. Close browser
```

## Element Selection

Playwright MCP uses element references from snapshots:

**From snapshot**:
```yaml
- button [ref=e57] [cursor=pointer]: Login
```

**To interact**:
```
target: "e57"  # Use the ref value
OR
target: "button containing 'Login'"  # Use descriptive selector
```

## Error Handling

If login fails:
1. Take snapshot to see error messages
2. Check browser console messages
3. Verify credentials are correct
4. Report specific error

If element not found:
1. Take full snapshot
2. List available elements
3. Suggest closest matches

## Network Debugging

To check API calls:

```
CallMcpTool(user-playwright, browser_network_requests)
- Check for failed requests (status 4xx, 5xx)
- Verify API endpoints called
- Inspect request/response data
```

## Best Practices

1. **Always start with snapshot** - Understand page structure before interacting
2. **Keep session alive** - Don't close browser between related checks
3. **Use descriptive selectors** - "button containing 'Submit'" better than "e57"
4. **Check console** - Errors often appear in console first
5. **Verify state changes** - Take snapshot after actions to confirm success
6. **Close when done** - Clean up browser resources

## Example: Full Verification

```markdown
Task: Verify kanban board displays leads

1. Login (see Login Workflow above)
2. Navigate to dashboard
3. Take snapshot
4. Verify kanban columns present
5. Check for lead cards
6. Report findings
7. Close browser
```

## Troubleshooting

**Browser won't open**: MCP server may not be initialized
- Check `~/.cursor/mcp.json` has playwright configured
- Restart Cursor if needed

**Session lost**: Browser was closed
- Run login workflow again

**Element not found**: Selector may be wrong
- Take snapshot first
- Use exact element ref or descriptive text

**Timeout**: Page loading slowly
- Check network requests for failed calls
- Verify URL is correct
- Check console for JS errors

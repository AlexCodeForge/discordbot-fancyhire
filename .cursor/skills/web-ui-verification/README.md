# Web UI Verification Skill

Automates UI verification for the CRM Discord Bot web interface using Playwright MCP.

## Quick Setup

1. **Add your credentials** to `SKILL.md`:
   ```
   EMAIL: [ADD_EMAIL_HERE]  ← Replace with your email
   PASSWORD: [ADD_PASSWORD_HERE]  ← Replace with your password
   ```

2. **Use the skill** by asking the agent to verify UI:
   - "Check if login works"
   - "Verify the kanban board displays correctly"
   - "Test the add lead form"

## What This Skill Does

- Automates browser interactions using Playwright MCP
- Maintains login sessions across operations
- Verifies UI elements, forms, and user flows
- Checks network requests and console errors
- Takes screenshots and snapshots for verification

## Files

- `SKILL.md` - Main skill instructions
- `EXAMPLES.md` - Detailed usage examples
- `README.md` - This file

## Prerequisites

- Playwright MCP configured in `~/.cursor/mcp.json`
- Valid credentials for https://discordbot.alexcodeforge.com/login

## Usage Pattern

The agent will:
1. Read this skill when UI verification is needed
2. Use Playwright MCP tools to automate browser
3. Maintain session state automatically
4. Report findings with evidence (snapshots/screenshots)

## Application Info

**URL**: https://discordbot.alexcodeforge.com/login
**Stack**: React + Vite + TailwindCSS
**Features**: Login, Kanban board, Lead management, Messaging

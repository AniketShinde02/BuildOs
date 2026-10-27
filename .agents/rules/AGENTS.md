# BuildOS Nexus Project Rules

This file isolates project-specific rules, stack guidelines, and behavioral context for Antigravity IDE, as mandated by the global instructions.

## 1. PONYTAIL STANDARD (MANDATORY)
*Source: ponytail.dev*
Write less code. Avoid garbage abstractions.
Before implementation, always follow the Ladder:
1. **YAGNI**: Don't build what isn't asked for.
2. **Standard Library / Existing Native**: Always use built-in tools before adding packages.
3. **Existing Code**: Reuse existing helpers and patterns.
4. **Minimum Viable Code**: If you must write, write only the absolute minimum.

## 2. PROJECT STACK
- **Framework**: Next.js (App Router)
- **UI**: MUI (Dark Mode baselightTheme - Charcoal/Amber)
- **Database**: Firebase (Firestore for Events & Drafts)

## 3. RECOMMENDED MCP SERVERS FOR DEVELOPMENT
To speed up development, we rely on the following MCP capabilities:
- **`sequential-thinking`**: Used for autonomous multi-step reasoning before complex implementation.
- **`chrome-devtools-mcp`**: Used for browser automation and visual verification of UI bounds.
- **`octocode-mcp`**: Recommended for deep GitHub ecosystem analysis and autonomous repository context gathering.
- **`context7`**: Recommended for injecting up-to-date documentation.
- **`claude-debugs-for-you`**: Recommended for automated test/debug workflows.

*Note: Antigravity IDE natively supports `GitKraken`, `StitchMCP`, and `firebase-mcp-server` which must be utilized instead of manual shell commands where applicable.*

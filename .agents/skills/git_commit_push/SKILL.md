---
name: git-commit-push
description: Commits all changed files with an appropriate, auto-generated commit message (unless the user specifies one), and pushes to the current remote branch. Use this when the user asks you to commit and push changes.
---

# Git Commit and Push Skill

When the user asks you to commit and push changes, follow these steps:

1.  **Check/Request Permissions:** If you do not have permission to run `git` commands, or if any `git` command fails due to a permission check error, immediately call `ask_permission` with `Action='command'` and `Target='git'` to request the necessary permissions.
2.  **Check Status:** Run `git status` to see what files are changed.
3.  **Analyze Changes:** Refer to the chat history to understand the context of the changes made.
4.  **Use Provided Message:** If the user has provided a specific commit message, use that exact message.
5.  **Generate a Message:** If no message is provided, create a concise, conventional commit message based on your analysis (e.g., `feat: added login page` or `fix: resolved button styling issue`).
6.  **Commit:** Execute `git commit -am "<commit_message>"` (ensure you escape quotes properly for Windows PowerShell).
7.  **Push:** Execute `git push`.
8.  **Report:** Notify the user that the commit and push were successful, and show them the commit message you used.


---
name: git-commit-push
description: Commits all changed files with an appropriate, auto-generated commit message (unless specified), and pushes to the current remote branch. Use this when the user asks you to commit and push changes.
---

# Git Commit and Push Skill

When the user asks you to commit and push changes, follow these steps:

1.  **Check Status:** Run `git status` to see what files are changed.
2.  **Analyze Changes:** Refer the chat
3.  **Generate a Message:** Create a concise, conventional commit message based on your analysis (e.g., `feat: added login page` or `fix: resolved button styling issue`).
4.  **Commit:** Execute `git commit -am "<your_generated_message>"` (ensure you escape quotes properly for Windows PowerShell).
5.  **Push:** Execute `git push`.
6.  **Report:** Notify the user that the commit and push were successful, and show them the commit message you used.

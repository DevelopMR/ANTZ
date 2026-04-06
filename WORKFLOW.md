# Workflow Notes

This repo keeps the local workflow lightweight on purpose.

## Browser Debug Loop

Start the simulation server:

```powershell
npm run dev
```

Then use one of the shared VS Code launch configs:

- `Ant Sim: Debug in Edge`
- `Ant Sim: Attach to Edge`
- `Ant Sim: Debug in Chrome`

These configs are defined in [.vscode/launch.json](/d:/dev/ANTZ/.vscode/launch.json) and use the shared background task in [.vscode/tasks.json](/d:/dev/ANTZ/.vscode/tasks.json).

## Git Hygiene

Shared repo defaults:

- [.editorconfig](/d:/dev/ANTZ/.editorconfig) keeps spacing, line endings, and final newlines consistent
- [.gitattributes](/d:/dev/ANTZ/.gitattributes) normalizes text files to LF while keeping binary assets binary
- [.gitmessage](/d:/dev/ANTZ/.gitmessage) is a simple commit template you can opt into with:

```powershell
git config commit.template .gitmessage
```

## GitHub CLI Helpers

Useful commands:

```powershell
npm run gh:status
gh pr create
gh pr checks
gh pr view --web
```

`npm run gh:status` wraps both `gh auth status` and `gh pr status`.

## CLI Tool Wishlist

These are optional but useful additions on top of `git`, `gh`, `rg`, `node`, and `npm`:

- `fd` for fast file discovery
- `jq` for inspecting JSON output from tools and APIs
- `bat` for readable terminal file previews

Suggested Windows installs:

```powershell
winget install --id sharkdp.fd --exact
winget install --id jqlang.jq --exact
winget install --id sharkdp.bat --exact
```

Check the current CLI stack with:

```powershell
npm run tools:check
```

## Sandbox Notes

When the sandbox starts acting flaky during large edit passes:

- prefer smaller patches over large multi-file rewrites
- create new utility files once, then edit them incrementally
- verify npm scripts and process-spawning helpers in a normal terminal
- prefer real helper files over long inline one-liner npm scripts
- move system installs, auth, and PATH changes to the normal terminal or an escalated shell

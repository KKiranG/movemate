# Claude Scripts

Scripts in this directory support project-level Claude hooks and future operating-system helpers.

Rules:
- keep scripts committed and repo-portable
- make every executable script `chmod +x`
- prefer reading hook JSON from stdin instead of assuming positional args
- keep error messages short and explicit so blocked actions are easy to understand

Current scripts:
- `validate-bash.sh`
  Blocks high-risk Bash patterns before they run.

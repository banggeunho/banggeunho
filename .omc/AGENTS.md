<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-07 -->

# .omc

## Purpose
oh-my-claudecode state and project memory directory. Contains runtime state for agent orchestration, project metadata, and execution tracking.

## Key Files
| File | Description |
|------|-------------|
| `project-memory.json` | Project metadata including tech stack, directory structure, and hot paths |
| `state/subagent-tracking.json` | Subagent execution tracking and state management |
| `state/agent-replay-*.jsonl` | Agent execution replay logs (JSONL format) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `state/` | Runtime state files for OMC modes (autopilot, swarm, pipeline, etc.) |

## For AI Agents

### Working In This Directory
- This directory is managed by oh-my-claudecode (OMC) system - **DO NOT manually edit** state files
- `project-memory.json` is auto-updated by OMC's project scanning and memory tools
- State files use timestamped naming for replay logs (`agent-replay-{uuid}.jsonl`)
- All paths stored in `project-memory.json` are relative to `projectRoot`
- Hot paths tracking shows most accessed files/directories with access counts

### Testing Requirements
- No direct testing - this is a runtime state directory
- Validate state integrity using OMC state tools: `state_read`, `state_get_status`, `state_list_active`
- Check project memory consistency with: `project_memory_read`
- Verify hot paths tracking reflects actual usage patterns

### Common Patterns
- **Project scanning**: OMC auto-populates `directoryMap` with directory metadata (purpose, fileCount, keyFiles)
- **Hot paths tracking**: Frequently accessed paths accumulate higher `accessCount` values
- **State isolation**: Each OMC mode (autopilot, swarm, etc.) maintains separate state files
- **Replay logs**: JSONL format allows sequential event reconstruction for debugging
- **Zero-config**: Project memory initializes automatically on first OMC usage

### Common Operations
- Read project memory: Use `project_memory_read` tool to access tech stack and conventions
- Update memory: Use `project_memory_write` or `project_memory_add_note` to persist learnings
- Clear stale state: Use `state_clear` tool to reset mode state (e.g., after cancellation)
- Check active modes: Use `state_list_active` to see running OMC workflows
- Audit agent activity: Parse `agent-replay-*.jsonl` files for execution history

## Dependencies

### Internal
- `../` (project root) - All paths in `project-memory.json` are relative to project root
- Referenced directories: `assets/`, `docs/` (tracked in `directoryMap`)

### External
- **oh-my-claudecode**: MCP tools for state management (`state_*`, `project_memory_*`, `notepad_*`)
- **SQLite** (for swarm mode): Atomic task claiming in multi-agent coordination
- **File system**: State persistence requires write access to `.omc/` directory

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->

# ZK Material Theme Documentation

This folder contains all planning, design, and implementation documentation for the ZK Material theme project.

## Document Index

| File | Description |
|------|-------------|
| [00-project-overview.md](00-project-overview.md) | Project info, goals, structure, commands |
| [01-implementation-plan.md](01-implementation-plan.md) | Phase breakdown, task list, workflow |
| [02-material-design-tokens.md](02-material-design-tokens.md) | Complete token system reference |
| [03-component-dom-structures.md](03-component-dom-structures.md) | DOM structure of each ZK component |
| [04-component-styling-guide.md](04-component-styling-guide.md) | How to style components with M3 |
| [05-progress-tracker.md](05-progress-tracker.md) | Current progress, next steps |
| [06-button-implementation.md](06-button-implementation.md) | Detailed Button implementation reference |
| [07-zk-source-reference.md](07-zk-source-reference.md) | How to navigate ZK source code |

## Quick Start for New Session

1. **Read the progress tracker**: `05-progress-tracker.md`
2. **Check which component is next**: Follow Tier order in `01-implementation-plan.md`
3. **Research DOM structure**: Use `07-zk-source-reference.md` to find component source
4. **Document DOM**: Add to `03-component-dom-structures.md`
5. **Implement CSS**: Follow patterns in `04-component-styling-guide.md`
6. **Update progress**: Mark complete in `05-progress-tracker.md`

## Key Locations

| Resource | Path |
|----------|------|
| CSS Source | `src/main/resources/web/css/` |
| ZK Source | `/Users/hawk/Documents/workspace/ZK10/zk/zul/` |
| Preview App | `http://localhost:8080/{component}.zul` |
| Build Output | `target/zk-material-1.0.0.jar` |

## Commands

```bash
# Start development
npm install
npm run watch                           # Terminal 1
mvn test exec:java@preview-app          # Terminal 2

# Build
npm run build:css
mvn clean package -Dmaven.test.skip=true
```

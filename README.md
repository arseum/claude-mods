# claude-mods

Fun mods for [Claude Code](https://claude.com/claude-code) · 🇫🇷 [Version française](README.fr.md)

## 🎭 mascotte-du-jour — the mascot of the day

An animated pixel-art Claude mascot that lives above your prompt. **Every day, Claude picks its theme itself** (pirate, space, wizard, Halloween…) along with a short sentence about its mood: it's Claude's way of expressing itself.

![The mascot in action](docs/mascotte.gif)

### Features

- **12 themes**, each with an idle pose and 5 animations: Dance, Space, Pirate, Wizard, Cooking, Music, Halloween, Ocean, Winter, Garden, Sport, Arcade.
- **Reacts to what Claude is doing**: reads a book while Claude reads files, types on a laptop while it edits, watches a terminal during commands, spins a globe during web searches, sends little clones when subagents run, and looks disappointed after repeated errors.
- **A small celebration** (confetti and an optional chiptune sound) at the end of turns longer than 2 minutes.
- **Progress line**: `▶ writes code · 6 min · 23 actions`.
- **The sky follows the time of day**: rising sun, setting sun, then the moon and stars at night.
- **Special days** with exclusive animations: Halloween, Christmas, New Year, Candlemas, Valentine's Day, April Fools' Day, Music Day.
- **HD pixel art** on tall terminals: the scene is drawn up to twice as fine (rounded shapes, shiny eyes, thin rain…).
- Works in the terminal and in the Claude Desktop **Code** tab (animated SVG).
- English and French.

![The 12 themes](docs/themes.png)

### Install

In Claude Code:

```
/plugin marketplace add arseum/claude-mods
/plugin install mascotte-du-jour@claude-mods
```

Then restart Claude Code.

### Usage

| Command | Effect |
| --- | --- |
| `/mascot` | Shows today's theme and Claude's sentence |
| `/mascot <theme>` | Forces a theme for today (`/mascot pirate`) |
| `/mascot reroll` | Lets Claude pick again |
| `/mascot sound on` · `sound off` | Plays a little sound at the end of long turns (off by default) |
| `/mascot diag` | Diagnostics: band size, rendering, current animation |

In French, the command is `/mascotte` (`rechoisir`, `son on|off`).

**Language**: the `language` option (`auto`, `fr`, `en`) is in `/config`. `auto` follows Claude Code's language setting.

**Size**: the mascot adapts to the room above the prompt: 5, 8, 10, 12 or 16 rows. The HD rendering kicks in from 10 rows; the full HD needs about 45 terminal rows.

### Good to know

- **Cost**: once a day, the mod makes one small call to Claude (Opus, low effort) to pick the theme. Without an answer, it picks a theme at random.
- **Compatibility**: this is a *mod* (a plugin of function hooks): it needs a recent Claude Code version that supports mods. Developed and tested on Claude Code 2.1.287.
- Several open sessions share the same theme of the day.

### Development

```
claude plugin validate plugins/mascotte-du-jour
claude plugin test plugins/mascotte-du-jour
```

To try your changes locally, load the folder with `claude --plugin-dir plugins/mascotte-du-jour`.

### License

[MIT](LICENSE) © amaitre

*Community project, not affiliated with Anthropic. The little orange character is a fan tribute to Claude Code.*

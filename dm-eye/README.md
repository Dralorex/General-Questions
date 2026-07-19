# DM Eye — Live Player Tracker (PWA)

DM-facing phone/desktop web app that watches Codex and Aincrad Mana sheets in real time via short **link codes**.

## Live URL

After deploy: https://dralorex.github.io/General-Questions/dm-eye/

Hub: https://dralorex.github.io/General-Questions/

## How it works

1. Player opens **Codex** or **Aincrad Mana** → **Profile** → **DM Link**
2. Player turns sharing **On** and gives the 6-character code to the DM
3. DM opens **DM Eye**, enters the code, and taps **Link**
4. When the player changes HP (or other sheet fields), the DM card updates live

### Collapsed vs expanded

- **Collapsed tab:** character name, level, AC, and health
- **Expanded:** tab shows **name only**; body shows class/subclass, race, full health, abilities, death saves, mana (Mana app), and more

## Local run

```bash
cd dm-eye
python3 -m http.server 4175
```

Open http://localhost:4175

## Notes

- Both devices need internet (uses a public MQTT broker for the link channel)
- Codes are the secret — anyone with a code can watch that sheet while sharing is on
- Turning sharing **Off** on the player sheet clears the retained snapshot
- Linked codes are remembered on this device’s browser

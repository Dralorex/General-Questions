# Songs

Original songs — sheet music, lyrics, and source files.

## Structure

Each song lives in its own folder and contains:

- `<song>.ly` — LilyPond source (the engraving definition)
- `<song>.pdf` — Rendered sheet music (compiled from the `.ly`)
- `<song>.midi` — MIDI playback file (compiled from the `.ly`)
- `<song>-lyrics.md` — Full lyrics with chord chart and performance notes

## Rebuilding sheet music

To regenerate the PDF and MIDI after editing the `.ly` source:

```bash
cd songs/<song>
lilypond <song>.ly
```

This requires [LilyPond](https://lilypond.org/) (tested with 2.24+).

## Songs

- **[Ammunition](ammunition/)** — A ballad in A minor about being loved conditionally.
  Piano/vocal score, key of Am, ♩ = 70. See
  [`ammunition/ammunition.pdf`](ammunition/ammunition.pdf) for the sheet music and
  [`ammunition/ammunition-lyrics.md`](ammunition/ammunition-lyrics.md) for the lyrics
  with chord chart.

# Dezco Lore Export Pack

Downloadable organized lore for Google Drive.

This environment cannot create a live Google Doc URL directly. These files are built so you can upload them and get tabs / Docs organization in one click.

## Files

| File | Open with | Best for |
|---|---|---|
| [Dezco_Knoleburn_Lore_Tabs.xlsx](Dezco_Knoleburn_Lore_Tabs.xlsx) | Google Sheets | Real tabs: party ref, family, timeline, crests, journals, Yua plots |
| [Dezco_Knoleburn_Lore.docx](Dezco_Knoleburn_Lore.docx) | Google Docs | Long reading; crest images embedded; page breaks by section |

## How to open in Google

### Tabbed version (recommended for quick lookup)

1. Go to [Google Drive](https://drive.google.com)
2. New → File upload → choose `Dezco_Knoleburn_Lore_Tabs.xlsx`
3. Open the uploaded file with **Google Sheets**
4. Use the sheet tabs along the bottom

Tabs included:

1. Index
2. Party Quick Ref
3. Me At A Glance
4. Family
5. Names
6. Timeline
7. Places And Gear
8. Crests And Sigils
9. Abilities Mana Well
10. Secrets
11. Character Intro
12. Journal 01
13. Journal 02
14. Journal 03
15. Yua Red And Black
16. Yua Mana Well
17. Yua Stays Hidden
18. Crest Lore Full

### Document version (recommended for reading / sharing prose)

1. Upload `Dezco_Knoleburn_Lore.docx` to Google Drive
2. Open with **Google Docs**
3. Optional: In Docs, use the outline / add Document tabs for each major heading (Party Ref, Character, Journal 01–03, Yua plots, Crests)

## Rebuild after lore changes

From repo root:

```bash
python3 character/lore/exports/build_dezco_lore_export.py
```

Requires `python-docx` and `openpyxl`.

## What is included

1. Party quick reference
2. Character introduction
3. Name meanings
4. Journal entries 01–03
5. Yua red/black reveal
6. Yua Mana Well system
7. Full crest/sigil meanings + image catalog/links
8. Embedded crest/sigil images inside the `.docx`

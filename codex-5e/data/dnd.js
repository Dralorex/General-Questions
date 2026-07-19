window.DND_ABILITIES = [
  {
    key: "str",
    name: "Strength",
    short: "STR",
    skills: [
      { id: "str-save", name: "Saving Throw", isSave: true },
      { id: "athletics", name: "Athletics", isSave: false },
    ],
  },
  {
    key: "dex",
    name: "Dexterity",
    short: "DEX",
    skills: [
      { id: "dex-save", name: "Saving Throw", isSave: true },
      { id: "acrobatics", name: "Acrobatics", isSave: false },
      { id: "sleight-of-hand", name: "Sleight of Hand", isSave: false },
      { id: "stealth", name: "Stealth", isSave: false },
    ],
  },
  {
    key: "con",
    name: "Constitution",
    short: "CON",
    skills: [{ id: "con-save", name: "Saving Throw", isSave: true }],
  },
  {
    key: "int",
    name: "Intelligence",
    short: "INT",
    skills: [
      { id: "int-save", name: "Saving Throw", isSave: true },
      { id: "arcana", name: "Arcana", isSave: false },
      { id: "history", name: "History", isSave: false },
      { id: "investigation", name: "Investigation", isSave: false },
      { id: "nature", name: "Nature", isSave: false },
      { id: "religion", name: "Religion", isSave: false },
    ],
  },
  {
    key: "wis",
    name: "Wisdom",
    short: "WIS",
    skills: [
      { id: "wis-save", name: "Saving Throw", isSave: true },
      { id: "animal-handling", name: "Animal Handling", isSave: false },
      { id: "insight", name: "Insight", isSave: false },
      { id: "medicine", name: "Medicine", isSave: false },
      { id: "perception", name: "Perception", isSave: false },
      { id: "survival", name: "Survival", isSave: false },
    ],
  },
  {
    key: "cha",
    name: "Charisma",
    short: "CHA",
    skills: [
      { id: "cha-save", name: "Saving Throw", isSave: true },
      { id: "deception", name: "Deception", isSave: false },
      { id: "intimidation", name: "Intimidation", isSave: false },
      { id: "performance", name: "Performance", isSave: false },
      { id: "persuasion", name: "Persuasion", isSave: false },
    ],
  },
];

window.DND_SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

window.LIVED_PROMPTS = [
  // hopeful
  "You clawed your way back. Breath returns.",
  "Light finds you. You are not done yet.",
  "Your heart staggers… then steadies. You live.",
  // cocky
  "Death blinked first.",
  "Nice try. You’re still in the fight.",
  "You spit blood and grin. Still standing.",
  // grim
  "You wake tasting iron. The dark lost this round.",
  "Something refused to let you go.",
  "Cold hands slip away. You remain.",
  // quiet / soft
  "A thin breath. Then another. You made it.",
  "The world swims back into focus. You live.",
  "Silence breaks. You are still here.",
  // anime / dramatic
  "Your HP bar refuses to empty.",
  "System message: consciousness restored.",
  "The Black Swordsman does not fall so easily.",
  // dry humor
  "Congrats. You’re inconveniently alive.",
  "Death says ‘maybe later.’",
  "Plot armor engaged. You live.",
];

window.proficiencyBonusForLevel = function proficiencyBonusForLevel(level) {
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  return Math.ceil(lv / 4) + 1;
};

window.abilityModifier = function abilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2);
};

window.formatMod = function formatMod(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v}` : `${v}`;
};

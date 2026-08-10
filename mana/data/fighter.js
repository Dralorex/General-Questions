/* 5e SRD Fighter features + combat uses for Aincrad Mana app.
   Content © Wizards of the Coast under CC-BY-4.0 (SRD 5.1). */

window.MAX_MANA_AT_LEVEL_1 = 100;
window.MAX_MANA_PER_LEVEL = 10;

/** Max mana scales: 100 at L1, +10 each level (L2=110 … L20=290). */
window.maxManaForLevel = function (level) {
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  return window.MAX_MANA_AT_LEVEL_1 + (lv - 1) * window.MAX_MANA_PER_LEVEL;
};

window.FIGHTER_FIGHTING_STYLES = [
  {
    id: "archery",
    name: "Archery",
    description: "+2 bonus to attack rolls you make with ranged weapons.",
  },
  {
    id: "defense",
    name: "Defense",
    description: "While you are wearing armor, you gain a +1 bonus to AC.",
  },
  {
    id: "dueling",
    name: "Dueling",
    description:
      "When you are wielding a melee weapon in one hand and no other weapons, +2 damage with that weapon.",
  },
  {
    id: "great-weapon-fighting",
    name: "Great Weapon Fighting",
    description:
      "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon you are wielding with two hands, you can reroll the die and must use the new roll.",
  },
  {
    id: "protection",
    name: "Protection",
    description:
      "When a creature you can see attacks a target other than you within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll (requires shield).",
  },
  {
    id: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    description:
      "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.",
  },
];

window.FIGHTER_CLASS = {
  id: "fighter",
  name: "Fighter",
  hitDie: 10,
  savingThrows: ["str", "con"],
  proficiencies:
    "Light armor, medium armor, heavy armor, shields, simple weapons, martial weapons",
  featuresByLevel: {
    1: [
      {
        id: "fighting-style",
        name: "Fighting Style",
        description:
          "You adopt a particular style of fighting as your specialty. Choose one Fighting Style option.",
      },
      {
        id: "second-wind",
        name: "Second Wind",
        description:
          "On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.",
      },
    ],
    2: [
      {
        id: "action-surge",
        name: "Action Surge",
        description:
          "On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.",
      },
    ],
    3: [
      {
        id: "martial-archetype",
        name: "Martial Archetype",
        description:
          "You choose an archetype that you strive to emulate in your combat styles and techniques (e.g. Champion).",
      },
    ],
    4: [
      {
        id: "asi-4",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    5: [
      {
        id: "extra-attack",
        name: "Extra Attack",
        description:
          "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
      },
    ],
    6: [
      {
        id: "asi-6",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    7: [
      {
        id: "archetype-7",
        name: "Martial Archetype feature",
        description: "You gain a feature from your Martial Archetype.",
      },
    ],
    8: [
      {
        id: "asi-8",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    9: [
      {
        id: "indomitable",
        name: "Indomitable",
        description:
          "You can reroll a saving throw that you fail. If you do so, you must use the new roll. You can use this feature once per long rest. You gain extra uses at 13th and 17th level.",
      },
    ],
    10: [
      {
        id: "archetype-10",
        name: "Martial Archetype feature",
        description: "You gain a feature from your Martial Archetype.",
      },
    ],
    11: [
      {
        id: "extra-attack-2",
        name: "Extra Attack (2)",
        description:
          "You can attack three times whenever you take the Attack action on your turn.",
      },
    ],
    12: [
      {
        id: "asi-12",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    13: [
      {
        id: "indomitable-2",
        name: "Indomitable (2 uses)",
        description: "You can use Indomitable twice per long rest.",
      },
    ],
    14: [
      {
        id: "asi-14",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    15: [
      {
        id: "archetype-15",
        name: "Martial Archetype feature",
        description: "You gain a feature from your Martial Archetype.",
      },
    ],
    16: [
      {
        id: "asi-16",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    17: [
      {
        id: "action-surge-2",
        name: "Action Surge (2 uses)",
        description: "You can use Action Surge twice before a rest (still once per turn).",
      },
      {
        id: "indomitable-3",
        name: "Indomitable (3 uses)",
        description: "You can use Indomitable three times per long rest.",
      },
    ],
    18: [
      {
        id: "archetype-18",
        name: "Martial Archetype feature",
        description: "You gain a feature from your Martial Archetype.",
      },
    ],
    19: [
      {
        id: "asi-19",
        name: "Ability Score Improvement",
        description:
          "Increase one ability score by 2, or two ability scores by 1 each (max 20).",
      },
    ],
    20: [
      {
        id: "extra-attack-3",
        name: "Extra Attack (3)",
        description:
          "You can attack four times whenever you take the Attack action on your turn.",
      },
    ],
  },
};

window.fighterFeaturesUpToLevel = function (level) {
  const cls = window.FIGHTER_CLASS;
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  const out = [];
  for (let i = 1; i <= lv; i++) {
    for (const f of cls.featuresByLevel[String(i)] || cls.featuresByLevel[i] || []) {
      out.push({ ...f, level: i });
    }
  }
  return out;
};

window.fighterCombatAbilities = function (level) {
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  const abs = [];
  if (lv >= 1) {
    abs.push({
      id: "second-wind",
      name: "Second Wind",
      actionType: "Bonus Action",
      rest: "short",
      usesMax: 1,
      summary: `Heal 1d10 + ${lv} HP`,
      detail:
        "Bonus action: regain hit points equal to 1d10 + your fighter level. Recharges on a short or long rest.",
    });
  }
  if (lv >= 2) {
    abs.push({
      id: "action-surge",
      name: "Action Surge",
      actionType: "Special",
      rest: "short",
      usesMax: lv >= 17 ? 2 : 1,
      summary: lv >= 17 ? "Extra action (2/rest)" : "Take one extra action",
      detail:
        "On your turn, take one additional action. Recharges on a short or long rest. At 17th level: 2 uses per rest (once per turn).",
    });
  }
  if (lv >= 5) {
    const attacks = lv >= 20 ? 4 : lv >= 11 ? 3 : 2;
    abs.push({
      id: "extra-attack",
      name: "Extra Attack",
      actionType: "Passive",
      rest: null,
      usesMax: 0,
      summary: `Attack action → ${attacks} attacks`,
      detail: `Whenever you take the Attack action, you can attack ${attacks} times.`,
    });
  }
  if (lv >= 9) {
    const uses = lv >= 17 ? 3 : lv >= 13 ? 2 : 1;
    abs.push({
      id: "indomitable",
      name: "Indomitable",
      actionType: "Special",
      rest: "long",
      usesMax: uses,
      summary: `Reroll a failed save (${uses}/long rest)`,
      detail:
        "Reroll a saving throw you fail; you must use the new roll. Recharges on a long rest.",
    });
  }
  return abs;
};

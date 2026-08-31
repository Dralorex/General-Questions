/* Fighter martial archetypes, maneuvers, and rollable class resources.
   Battle Master maneuvers © Wizards of the Coast under CC-BY-4.0 (SRD 5.1). */

window.FIGHTER_ARCHETYPES = [
  {
    id: "champion",
    name: "Champion",
    minLevel: 3,
    description:
      "Simple, reliable martial excellence — improved critical hits and physical prowess.",
    featuresByLevel: {
      3: [
        {
          id: "improved-critical",
          name: "Improved Critical",
          description:
            "Your weapon attacks score a critical hit on a roll of 19 or 20.",
        },
      ],
      7: [
        {
          id: "remarkable-athlete",
          name: "Remarkable Athlete",
          description:
            "Add half your proficiency bonus (rounded up) to Strength (Athletics) checks. Your running long jump distance increases by your Strength modifier in feet.",
        },
      ],
      10: [
        {
          id: "extra-fighting-style",
          name: "Additional Fighting Style",
          description: "Choose a second Fighting Style option.",
        },
      ],
      15: [
        {
          id: "superior-critical",
          name: "Superior Critical",
          description:
            "Your weapon attacks score a critical hit on a roll of 18–20.",
        },
      ],
      18: [
        {
          id: "survivor",
          name: "Survivor",
          description:
            "At the start of each of your turns, if you have no more than half your hit point maximum, you regain hit points equal to 5 + your Constitution modifier (minimum 1).",
        },
      ],
    },
  },
  {
    id: "battle-master",
    name: "Battle Master",
    minLevel: 3,
    description:
      "Tactical maneuvers fueled by superiority dice — roll dice for bonuses and spend them on combat tricks.",
    featuresByLevel: {
      3: [
        {
          id: "combat-superiority",
          name: "Combat Superiority",
          description:
            "You learn maneuvers and gain superiority dice (d8). A superiority die is expended when you use it. You regain all spent superiority dice when you finish a short or long rest.",
        },
        {
          id: "student-of-war",
          name: "Student of War",
          description:
            "You gain proficiency with one type of artisan's tools of your choice.",
        },
      ],
      7: [
        {
          id: "know-your-enemy",
          name: "Know Your Enemy",
          description:
            "If you spend at least 1 minute observing or interacting with a creature outside combat, you can learn certain information about its capabilities compared to your own.",
        },
      ],
      10: [
        {
          id: "improved-combat-superiority",
          name: "Improved Combat Superiority",
          description: "Your superiority dice become d10s.",
        },
      ],
      15: [
        {
          id: "relentless",
          name: "Relentless",
          description:
            "When you roll initiative and have no superiority dice remaining, you regain 1 superiority die.",
        },
      ],
      18: [
        {
          id: "survival-superiority",
          name: "Improved Combat Superiority",
          description: "Your superiority dice become d12s.",
        },
      ],
    },
    superiority: {
      minLevel: 3,
      shortRest: true,
    },
  },
  {
    id: "eldritch-knight",
    name: "Eldritch Knight",
    minLevel: 3,
    description: "A fighter who blends martial prowess with abjuration and evocation magic.",
    featuresByLevel: {
      3: [
        {
          id: "spellcasting-ek",
          name: "Spellcasting",
          description:
            "You learn cantrips and spells from the wizard list, focusing on abjuration and evocation. Intelligence is your spellcasting ability.",
        },
        {
          id: "weapon-bond",
          name: "Weapon Bond",
          description:
            "You learn a ritual that creates a magical bond with a weapon. You can't be disarmed of a bonded weapon unless incapacitated.",
        },
      ],
      7: [
        {
          id: "war-magic",
          name: "War Magic",
          description:
            "When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.",
        },
      ],
      10: [
        {
          id: "eldritch-strike",
          name: "Eldritch Strike",
          description:
            "When you hit a creature with a weapon attack, that creature has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.",
        },
      ],
      15: [
        {
          id: "arcane-charge",
          name: "Arcane Charge",
          description:
            "When you use Action Surge, you can teleport up to 30 feet to an unoccupied space you can see before or after the additional action.",
        },
      ],
      18: [
        {
          id: "improved-war-magic",
          name: "Improved War Magic",
          description:
            "When you use your action to cast a spell, you can make one weapon attack as a bonus action.",
        },
      ],
    },
  },
];

window.BATTLE_MASTER_MANEUVERS = [
  {
    id: "commanders-strike",
    name: "Commander's Strike",
    actionType: "Bonus Action",
    when: "On your turn, when you take the Attack action",
    summary: "Forfeit one attack; ally makes weapon attack + superiority die damage",
    description:
      "When you take the Attack action, you can forgo one attack and use a bonus action to direct one of your companions to strike. When you do so, choose a friendly creature that can see or hear you and expend one superiority die. That creature can immediately use its reaction to make one weapon attack, adding the superiority die to the attack's damage roll.",
  },
  {
    id: "disarming-attack",
    name: "Disarming Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; target makes Str save or drops item",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to disarm the target. Add the superiority die to the attack's damage roll, and the target must make a Strength saving throw. On a failed save, it drops one item of your choice that it's holding.",
  },
  {
    id: "distracting-strike",
    name: "Distracting Strike",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; next ally attack has advantage",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to distract the target. Add the superiority die to the attack's damage roll. The next attack roll against the target by an attacker other than you has advantage if the attack is made before the start of your next turn.",
  },
  {
    id: "evasive-footwork",
    name: "Evasive Footwork",
    actionType: "On Move",
    when: "When you move on your turn",
    summary: "Expend die to add result to AC until you stop moving",
    description:
      "When you move on your turn, you can expend one superiority die, rolling the die and adding the number rolled to your AC until you stop moving.",
  },
  {
    id: "feinting-attack",
    name: "Feinting Attack",
    actionType: "Bonus Action",
    when: "Bonus action, then attack same target",
    summary: "Advantage on next attack; add superiority die damage on hit",
    description:
      "You can expend one superiority die and use a bonus action to feint. Choose one creature within 5 feet as your target. You have advantage on your next attack roll against that creature this turn. If that attack hits, add the superiority die to the attack's damage roll.",
  },
  {
    id: "goading-attack",
    name: "Goading Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; target has disadvantage vs others",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to goad the target. Add the superiority die to the attack's damage roll. The target must make a Wisdom saving throw. On a failed save, the target has disadvantage on all attack rolls against targets other than you until the end of your next turn.",
  },
  {
    id: "lunging-attack",
    name: "Lunging Attack",
    actionType: "On Hit",
    when: "When you make a melee weapon attack on your turn",
    summary: "Add 5 ft reach; add superiority die damage on hit",
    description:
      "When you make a melee weapon attack on your turn, you can expend one superiority die to increase your reach for that attack by 5 feet. If you hit, add the superiority die to the attack's damage roll.",
  },
  {
    id: "maneuvering-attack",
    name: "Maneuvering Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; ally shifts half speed without OA",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to maneuver one of your comrades. Add the superiority die to the attack's damage roll, and choose a friendly creature that can see or hear you. That creature can use its reaction to move up to half its speed without provoking opportunity attacks from the target.",
  },
  {
    id: "menacing-attack",
    name: "Menacing Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; target makes Wis save or frightened",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to frighten the target. Add the superiority die to the attack's damage roll. The target must make a Wisdom saving throw. On a failed save, it is frightened of you until the end of your next turn.",
  },
  {
    id: "parry",
    name: "Parry",
    actionType: "Reaction",
    when: "When another creature damages you with a melee attack",
    summary: "Reduce damage by superiority die + Dex mod",
    description:
      "When another creature damages you with a melee attack, you can use your reaction and expend one superiority die to reduce the damage by the number you roll on your superiority die + your Dexterity modifier.",
  },
  {
    id: "precision-attack",
    name: "Precision Attack",
    actionType: "On Attack",
    when: "When you make a weapon attack roll against a creature",
    summary: "Add superiority die to the attack roll",
    description:
      "When you make a weapon attack roll against a creature, you can expend one superiority die to add it to the roll. You can use this maneuver before or after making the attack roll, but before any effects of the attack are applied.",
  },
  {
    id: "pushing-attack",
    name: "Pushing Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; push target up to 15 ft on failed Str save",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to drive the target back. Add the superiority die to the attack's damage roll. If the target is Large or smaller, it must make a Strength saving throw. On a failed save, you push the target up to 15 feet away from you.",
  },
  {
    id: "rally",
    name: "Rally",
    actionType: "Bonus Action",
    when: "On your turn (bonus action)",
    summary: "Ally gains temp HP equal to superiority die + Cha mod",
    description:
      "On your turn, you can use a bonus action and expend one superiority die to bolster the resolve of one of your companions. Choose a friendly creature that can see or hear you. That creature gains temporary hit points equal to the superiority die roll + your Charisma modifier.",
  },
  {
    id: "riposte",
    name: "Riposte",
    actionType: "Reaction",
    when: "When a creature misses you with a melee attack",
    summary: "Make melee attack; add superiority die damage on hit",
    description:
      "When a creature misses you with a melee attack, you can use your reaction and expend one superiority die to make a melee weapon attack against the creature. If you hit, add the superiority die to the attack's damage roll.",
  },
  {
    id: "sweeping-attack",
    name: "Sweeping Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a melee weapon attack",
    summary: "Add superiority die damage to a second creature within 5 ft",
    description:
      "When you hit a creature with a melee weapon attack, you can expend one superiority die to attempt to damage another creature with the same attack. Choose another creature within 5 feet of the original target and within your reach. If the original attack roll would hit the second creature, it takes damage equal to the number you roll on your superiority die. The damage is of the same type dealt by the original attack.",
  },
  {
    id: "trip-attack",
    name: "Trip Attack",
    actionType: "On Hit",
    when: "When you hit a creature with a weapon attack",
    summary: "Add superiority die damage; target makes Str save or prone",
    description:
      "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to knock the target down. Add the superiority die to the attack's damage roll. If the target is Large or smaller, it must make a Strength saving throw. On a failed save, you knock the target prone.",
  },
];

window.superiorityDieSides = function (level) {
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  if (lv >= 18) return 12;
  if (lv >= 10) return 10;
  return 8;
};

window.superiorityDiceMax = function (level) {
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  if (lv < 3) return 0;
  if (lv >= 15) return 6;
  if (lv >= 7) return 5;
  return 4;
};

window.maneuversKnownMax = function (level) {
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  if (lv < 3) return 0;
  if (lv >= 15) return 9;
  if (lv >= 10) return 7;
  if (lv >= 7) return 5;
  return 3;
};

window.getFighterArchetype = function (subclassId) {
  return (window.FIGHTER_ARCHETYPES || []).find((a) => a.id === subclassId) || null;
};

window.archetypeFeaturesUpToLevel = function (subclassId, level) {
  const arch = window.getFighterArchetype(subclassId);
  if (!arch) return [];
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  const out = [];
  for (let i = 1; i <= lv; i++) {
    for (const f of arch.featuresByLevel[String(i)] || arch.featuresByLevel[i] || []) {
      out.push({ ...f, level: i, archetypeId: arch.id, archetypeName: arch.name });
    }
  }
  return out;
};

window.getManeuverById = function (id) {
  return (window.BATTLE_MASTER_MANEUVERS || []).find((m) => m.id === id) || null;
};

window.hasSuperiorityDice = function (subclassId, level) {
  const arch = window.getFighterArchetype(subclassId);
  if (!arch?.superiority) return false;
  return Number(level) >= (arch.superiority.minLevel || 3);
};

window.classSkillCombatEntries = function (state) {
  const subclassId = state?.subclassId || "";
  const level = state?.level || 1;
  const entries = [];
  if (!subclassId || subclassId !== "battle-master") return entries;
  if (!window.hasSuperiorityDice(subclassId, level)) return entries;

  const selected = Array.isArray(state.selectedManeuvers) ? state.selectedManeuvers : [];
  for (const id of selected) {
    const m = window.getManeuverById(id);
    if (!m) continue;
    entries.push({
      kind: "maneuver",
      id: m.id,
      name: m.name,
      actionType: m.actionType,
      summary: m.summary,
      detail: m.description,
      when: m.when,
    });
  }
  return entries;
};

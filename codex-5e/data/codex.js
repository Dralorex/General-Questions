/* Codex 5e helpers for spells + classes */
window.CODEX_SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];
window.CODEX_SPELL_LEVELS = [0,1,2,3,4,5,6,7,8,9];

/** Classes that prepare spells (PHB). */
window.CODEX_PREPARE_CASTERS = ["wizard", "cleric", "druid", "paladin"];
/** Classes that know a fixed number of spells. */
window.CODEX_KNOWN_CASTERS = ["bard", "sorcerer", "warlock", "ranger"];

window.codexSpellLevelLabel = function (level) {
  if (level === 0) return "Cantrip";
  const ord = ["","1st","2nd","3rd","4th","5th","6th","7th","8th","9th"];
  return (ord[level] || (level + "th")) + "-level";
};

window.codexSlotLevelShort = function (level) {
  if (level === 0) return "Cantrip";
  const ord = ["","1st","2nd","3rd","4th","5th","6th","7th","8th","9th"];
  return ord[level] || (level + "th");
};

window.codexClassById = function (id) {
  return (window.CODEX_CLASSES || []).find((c) => c.id === id) || null;
};

window.codexSpellsForClass = function (classId) {
  if (!classId) return [];
  return (window.CODEX_SPELLS || []).filter((s) => (s.classes || []).includes(classId));
};

window.codexSpellById = function (id) {
  return (window.CODEX_SPELLS || []).find((s) => s.id === id) || null;
};

window.codexFeaturesUpToLevel = function (classId, level) {
  const cls = window.codexClassById(classId);
  if (!cls) return [];
  const out = [];
  const lv = Math.max(1, Math.min(20, Number(level) || 1));
  for (let i = 1; i <= lv; i++) {
    const feats = cls.featuresByLevel[String(i)] || [];
    for (const f of feats) out.push({ ...f, level: i });
  }
  return out;
};

window.codexSpellSlotsAtLevel = function (classId, level) {
  const cls = window.codexClassById(classId);
  if (!cls) return null;
  return cls.spellcastingByLevel[String(level)] || null;
};

window.codexCasterKind = function (classId) {
  if (!classId) return "none";
  if (window.CODEX_PREPARE_CASTERS.includes(classId)) return "prepare";
  if (window.CODEX_KNOWN_CASTERS.includes(classId)) return "known";
  return "none";
};

window.codexIsWarlock = function (classId) {
  return classId === "warlock";
};

window.codexIsSpellcaster = function (classId) {
  const cls = window.codexClassById(classId);
  return !!(cls && cls.spellcasting);
};

/** Max spell slots by level 1–9 from the class table. */
window.codexMaxSpellSlots = function (classId, level) {
  const row = window.codexSpellSlotsAtLevel(classId, level);
  const out = {};
  for (let i = 1; i <= 9; i++) {
    out[i] = row ? Math.max(0, Number(row[`spell_slots_level_${i}`]) || 0) : 0;
  }
  return out;
};

window.codexAbilityModifier = function (score) {
  return Math.floor((Number(score) - 10) / 2);
};

/**
 * How many cantrips / leveled spells the character may select.
 * Prepare casters: PHB formula (ability mod + level, or half level for paladin).
 * Known casters: table spells_known / cantrips_known.
 */
window.codexSpellSelectionLimits = function (classId, level, abilities) {
  const cls = window.codexClassById(classId);
  const empty = {
    kind: "none",
    cantrips: 0,
    leveled: 0,
    selectLabel: "Selected",
    cantripsLabel: "Cantrips",
    leveledLabel: "Spells",
  };
  if (!cls || !cls.spellcasting) return empty;

  const kind = window.codexCasterKind(classId);
  const row = window.codexSpellSlotsAtLevel(classId, level) || {};
  const cantrips = Math.max(0, Number(row.cantrips_known) || 0);
  const castStart = Number(cls.spellcasting.level) || 1;
  const abKey = cls.spellcasting.ability;
  const mod = window.codexAbilityModifier((abilities && abilities[abKey]) ?? 10);

  if (kind === "known") {
    return {
      kind,
      cantrips,
      leveled: Math.max(0, Number(row.spells_known) || 0),
      selectLabel: "Known",
      cantripsLabel: "Cantrips known",
      leveledLabel: "Spells known",
    };
  }

  // Prepared casters
  let leveled = 0;
  if (level >= castStart) {
    if (classId === "paladin") {
      leveled = Math.max(1, mod + Math.floor(level / 2));
    } else {
      leveled = Math.max(1, mod + level);
    }
  }

  return {
    kind,
    cantrips,
    leveled,
    selectLabel: "Prepared",
    cantripsLabel: "Cantrips known",
    leveledLabel: "Spells prepared",
  };
};

/** Pact slot level for warlock (the only slot level with max > 0), or 0. */
window.codexWarlockPactLevel = function (classId, level) {
  if (!window.codexIsWarlock(classId)) return 0;
  const max = window.codexMaxSpellSlots(classId, level);
  for (let i = 1; i <= 9; i++) {
    if (max[i] > 0) return i;
  }
  return 0;
};

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

/**
 * Class-aware label for the middle “Spells” dock tab / panel.
 * Martial classes get Features / Rage / Ki instead of Spellbook.
 */
window.codexClassPowerPanel = function (classId) {
  const cls = window.codexClassById(classId);
  if (cls && cls.spellcasting) {
    return {
      mode: "spells",
      tab: "Spells",
      title: "Spellbook",
      subtitle: `${cls.name} · expand a level, check spells to prepare or know. Selected spells appear in Combat.`,
    };
  }
  const martial = {
    barbarian: {
      mode: "features",
      tab: "Rage",
      title: "Rage & Features",
      subtitle: "Barbarian class features by level — expand a level to read the full SRD text.",
    },
    fighter: {
      mode: "features",
      tab: "Features",
      title: "Fighter Features",
      subtitle: "Fighting Style, Second Wind, Action Surge, and more — expand a level to read them.",
    },
    monk: {
      mode: "features",
      tab: "Ki",
      title: "Ki & Features",
      subtitle: "Martial Arts, Ki, and monk features by level — expand a level to read the full SRD text.",
    },
    rogue: {
      mode: "features",
      tab: "Tricks",
      title: "Rogue Features",
      subtitle: "Expertise, Sneak Attack, and more — expand a level to read the full SRD text.",
    },
  };
  if (classId && martial[classId]) return martial[classId];
  if (cls) {
    return {
      mode: "features",
      tab: "Features",
      title: `${cls.name} Features`,
      subtitle: `${cls.name} class features by level — expand a level to read the full SRD text.`,
    };
  }
  return {
    mode: "spells",
    tab: "Spells",
    title: "Spellbook",
    subtitle: "Pick a class in Profile. Casters get a spellbook; martial classes get their features here.",
  };
};

window.codexEquipmentById = function (id) {
  return (window.CODEX_EQUIPMENT || []).find((e) => e.id === id) || null;
};

/** Build a readable description block from an SRD equipment / magic-item record. */
window.codexEquipmentDetailText = function (item) {
  if (!item) return "";
  const lines = [];
  const meta = [];
  if (item.category) meta.push(item.category);
  if (item.rarity) meta.push(item.rarity);
  if (item.cost) meta.push(item.cost);
  if (item.weight != null && item.weight !== "") meta.push(`${item.weight} lb`);
  if (meta.length) lines.push(meta.join(" · "));

  if (item.weaponCategory || item.categoryRange) {
    lines.push(
      [item.categoryRange || item.weaponCategory, item.weaponRange]
        .filter(Boolean)
        .join(" · ")
    );
  }
  if (item.damage) lines.push(`Damage: ${item.damage}`);
  if (item.twoHandedDamage) lines.push(`Two-handed: ${item.twoHandedDamage}`);
  if (item.range) lines.push(`Range: ${item.range} ft`);
  if (item.throwRange) lines.push(`Thrown: ${item.throwRange} ft`);
  if (item.properties && item.properties.length) {
    lines.push(`Properties: ${item.properties.join(", ")}`);
  }
  if (item.armorCategory) {
    lines.push(`${item.armorCategory} armor`);
  }
  if (item.armorClass) lines.push(`AC: ${item.armorClass}`);
  if (item.strMinimum) lines.push(`Str minimum: ${item.strMinimum}`);
  if (item.stealthDisadvantage) lines.push("Stealth: disadvantage");
  if (item.toolCategory) lines.push(item.toolCategory);
  if (item.gearCategory) lines.push(item.gearCategory);
  if (item.vehicleCategory) lines.push(item.vehicleCategory);
  if (item.speed) lines.push(`Speed: ${item.speed}`);
  if (item.capacity) lines.push(`Capacity: ${item.capacity}`);
  if (item.contents && item.contents.length) {
    lines.push(`Contains: ${item.contents.join(", ")}`);
  }
  if (item.variants && item.variants.length) {
    lines.push(`Variants: ${item.variants.join(", ")}`);
  }
  const desc = Array.isArray(item.desc) ? item.desc.filter(Boolean) : [];
  const special = Array.isArray(item.special) ? item.special.filter(Boolean) : [];
  if (desc.length) {
    if (lines.length) lines.push("");
    lines.push(...desc);
  }
  if (special.length) {
    if (lines.length) lines.push("");
    lines.push(...special);
  }
  return lines.join("\n").trim();
};

window.codexEquipmentSummary = function (item) {
  if (!item) return "";
  const bits = [];
  if (item.category) bits.push(item.category);
  if (item.rarity) bits.push(item.rarity);
  if (item.damage) bits.push(item.damage);
  if (item.armorClass) bits.push(`AC ${item.armorClass}`);
  if (item.cost) bits.push(item.cost);
  return bits.join(" · ");
};

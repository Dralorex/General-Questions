/* Codex 5e helpers for spells + classes */
window.CODEX_SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];
window.CODEX_SPELL_LEVELS = [0,1,2,3,4,5,6,7,8,9];

window.codexSpellLevelLabel = function (level) {
  if (level === 0) return "Cantrip";
  const ord = ["","1st","2nd","3rd","4th","5th","6th","7th","8th","9th"];
  return (ord[level] || (level + "th")) + "-level";
};

window.codexClassById = function (id) {
  return (window.CODEX_CLASSES || []).find((c) => c.id === id) || null;
};

window.codexSpellsForClass = function (classId) {
  if (!classId) return [];
  return (window.CODEX_SPELLS || []).filter((s) => (s.classes || []).includes(classId));
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

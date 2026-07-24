/**
 * Slot definitions for the layered character composer.
 * Bodies always include undergarments. Heads share a common neck joint.
 */
window.CharacterSlots = {
  STAGE: { width: 400, height: 560 },
  /** Shared neck joint — heads and bodies align here */
  NECK: { x: 200, y: 148, width: 36 },

  /**
   * Draw order (low → high). Backgrounds first; handhelds last.
   */
  ORDER: [
    "background",
    "base",
    "body",
    "bottom",
    "footwear",
    "top",
    "outer",
    "head",
    "hair",
    "glasses",
    "hat",
    "prop",
    "weapon-off",
    "weapon-main",
    "item",
  ],

  META: {
    background: {
      label: "Background",
      plural: "Backgrounds",
      required: false,
      max: 1,
      hint: "Scene behind the figure",
    },
    base: {
      label: "Base",
      plural: "Bases",
      required: false,
      max: 1,
      hint: "Ground / stand under the figure",
    },
    body: {
      label: "Body",
      plural: "Bodies",
      required: true,
      max: 1,
      hint: "Always includes undergarments",
    },
    head: {
      label: "Head",
      plural: "Heads",
      required: true,
      max: 1,
      hint: "Merges to the body neck joint",
    },
    hair: {
      label: "Hair",
      plural: "Hair",
      required: false,
      max: 1,
      hint: "Fits the selected head; hides under hats",
    },
    hat: {
      label: "Hat",
      plural: "Hats",
      required: false,
      max: 1,
      hint: "Hides hair regions marked under-hat",
    },
    glasses: {
      label: "Glasses",
      plural: "Glasses",
      required: false,
      max: 1,
      hint: "Worn over the face",
    },
    top: {
      label: "Top",
      plural: "Tops",
      required: false,
      max: 1,
      hint: "Shirts, tunics, armor chest",
    },
    bottom: {
      label: "Bottom",
      plural: "Bottoms",
      required: false,
      max: 1,
      hint: "Pants, skirts, greaves",
    },
    outer: {
      label: "Outerwear",
      plural: "Outerwear",
      required: false,
      max: 1,
      hint: "Cloaks, coats, robes",
    },
    footwear: {
      label: "Footwear",
      plural: "Footwear",
      required: false,
      max: 1,
      hint: "Boots and shoes",
    },
    "weapon-main": {
      label: "Main hand",
      plural: "Main weapons",
      required: false,
      max: 1,
      hint: "Primary weapon",
    },
    "weapon-off": {
      label: "Off hand",
      plural: "Off-hand items",
      required: false,
      max: 1,
      hint: "Shield, dagger, torch",
    },
    item: {
      label: "Item",
      plural: "Items",
      required: false,
      max: 1,
      hint: "Belt pouch, book, charm",
    },
    prop: {
      label: "Prop",
      plural: "Props",
      required: false,
      max: 1,
      hint: "Companion object near the figure",
    },
  },

  /** Categories shown in the creator studio placement picker */
  CREATOR_TARGETS: [
    "body",
    "head",
    "hair",
    "hat",
    "glasses",
    "top",
    "bottom",
    "outer",
    "footwear",
    "weapon-main",
    "weapon-off",
    "item",
    "prop",
    "base",
    "background",
  ],
};

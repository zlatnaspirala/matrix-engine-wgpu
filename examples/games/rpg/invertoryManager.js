/**
 * @description
 * Hero invertory (Local)
 * Advanced Inventory system for RPG heroes.
 * Supports stacking, crafting, and time-limited items.
 */
export class Inventory {
  constructor(hero, size = 6) {
    this.hero = hero;
    this.size = size;
    this.slots = new Array(size).fill(null);
    this.craftingRules = [];
    this.activeTimers = new Map();

    this._dispatchUpdate();
  }

  // --- Add crafting rule
  addCraftingRule(requiredItems, resultItem) {
    this.craftingRules.push({ requiredItems, resultItem });
  }

  // --- Add item (supports stacking + timed items + effects)
  addItem(name, { quantity = 1, duration = null, effects = null } = {}) {
    const existingSlot = this.slots.find(s => s && s.name === name);

    if (existingSlot && !duration) {
      existingSlot.quantity += quantity;
    } else {
      const emptyIndex = this.slots.findIndex(s => s === null);
      if (emptyIndex === -1) {
        console.warn("Inventory is full!");
        return false;
      }

      const newItem = { name, quantity, createdAt: Date.now(), duration, effects };
      this.slots[emptyIndex] = newItem;

      // Apply effects immediately
      if (effects) this._applyEffects(effects, true);

      // Time-limited logic
      if (duration) {
        const timerId = setTimeout(() => {
          this.removeItem(name, quantity);
          this.activeTimers.delete(name);
          console.log(`⏳ Item "${name}" expired and removed.`);
        }, duration);
        this.activeTimers.set(name, timerId);
      }
    }

    console.log(`🧩 Added item "${name}" x${quantity}`);
    this._dispatchUpdate();
    this._checkCraftingRules();
    this._dispatchHeroUpdate();
    return true;
  }

  // --- Remove item and reverse effects
  removeItem(name, quantity = 1) {
    const slotIndex = this.slots.findIndex(s => s && s.name === name);
    if (slotIndex === -1) return false;

    const slot = this.slots[slotIndex];
    slot.quantity -= quantity;

    if (slot.effects) {
      this._applyEffects(slot.effects, false); // reverse effect
    }

    if (slot.quantity <= 0) {
      this.slots[slotIndex] = null;
      console.log(`❌ Removed item "${name}"`);
    }

    if (this.activeTimers.has(name)) {
      clearTimeout(this.activeTimers.get(name));
      this.activeTimers.delete(name);
    }

    this._dispatchUpdate();
    this._dispatchHeroUpdate();
    return true;
  }

  // --- Apply or reverse item effects on hero
  _applyEffects(effects, isAdding = true) {
    for (const [key, multiplier] of Object.entries(effects)) {
      if (this.hero[key] !== undefined && typeof this.hero[key] === "number") {
        const factor = isAdding ? multiplier : 1 / multiplier;
        this.hero[key] *= factor;
      }
    }
  }

  // --- Crafting
  _checkCraftingRules() {
    for (const rule of this.craftingRules) {
      const hasAll = rule.requiredItems.every(item =>
        this.slots.some(slot => slot && slot.name === item)
      );
      if (hasAll) {
        rule.requiredItems.forEach(item => this.removeItem(item, 1));
        this.addItem(rule.resultItem);
        console.log(`✨ Crafted new item: "${rule.resultItem}"`);
        return;
      }
    }
  }

  // --- Event helpers
  _dispatchHeroUpdate() {
    dispatchEvent(
      new CustomEvent("hero-stats-update", {
        detail: {
          hero: this.hero.name,
          hp: this.hero.hp,
          mana: this.hero.mana,
          attack: this.hero.attack,
          items: this.slots.filter(i => i).map(i => i.name)
        }
      })
    );
  }

  _dispatchUpdate() {
    dispatchEvent(
      new CustomEvent("inventory-update", {
        detail: { hero: this.hero.name, items: this.slots }
      })
    );
  }

  // --- Debug print
  debugPrint() {
    console.table(
      this.slots.map((slot, i) => ({
        Slot: i + 1,
        Item: slot ? slot.name : "Empty",
        Quantity: slot ? slot.quantity : "-",
        Duration: slot?.duration ? `${slot.duration / 1000}s` : "∞"
      }))
    );
  }

  clear() {
    this.slots.forEach(slot => {
      if (slot && slot.effects) this._applyEffects(slot.effects, false);
    });
    this.slots.fill(null);
    this.activeTimers.forEach(t => clearTimeout(t));
    this.activeTimers.clear();
    this._dispatchUpdate();
    this._dispatchHeroUpdate();
    console.log("🧹 Inventory cleared");
  }
}
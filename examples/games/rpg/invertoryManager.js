/**
 * @description
 * Hero invertory
 * Advanced Inventory system for RPG heroes.
 * Supports stacking, crafting, and time-limited items.
 */

export class Inventory {
  constructor(owner, size = 6) {
    this.owner = owner; // reference to Hero instance
    this.size = size;
    this.slots = new Array(size).fill(null);
    this.craftingRules = [];
    this.activeTimers = new Map(); // for timed items

    // Dispatch initial empty event
    this._dispatchUpdate();
  }

  // --- Add crafting rule
  // Example: addCraftingRule(["mana booster", "gold arrow"], "golden mana arrow")
  addCraftingRule(requiredItems, resultItem) {
    this.craftingRules.push({ requiredItems, resultItem });
  }

  // --- Add item (supports stacking + timed items)
  addItem(name, { quantity = 1, duration = null } = {}) {
    // First try to stack
    const existingSlot = this.slots.find(s => s && s.name === name);
    if (existingSlot && !duration) {
      existingSlot.quantity += quantity;
    } else {
      // Find empty slot
      const emptyIndex = this.slots.findIndex(s => s === null);
      if (emptyIndex === -1) {
        console.warn("Inventory is full!");
        return false;
      }

      const newItem = { name, quantity, createdAt: Date.now(), duration };

      this.slots[emptyIndex] = newItem;

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

    // Check crafting rules
    this._checkCraftingRules();

    return true;
  }

  // --- Remove item
  removeItem(name, quantity = 1) {
    const slotIndex = this.slots.findIndex(s => s && s.name === name);
    if (slotIndex === -1) return false;

    const slot = this.slots[slotIndex];
    slot.quantity -= quantity;

    if (slot.quantity <= 0) {
      this.slots[slotIndex] = null;
      console.log(`❌ Removed item "${name}"`);
    }

    // Cancel timer if time-limited
    if (this.activeTimers.has(name)) {
      clearTimeout(this.activeTimers.get(name));
      this.activeTimers.delete(name);
    }

    this._dispatchUpdate();
    return true;
  }

  // --- Check crafting rules
  _checkCraftingRules() {
    for (const rule of this.craftingRules) {
      const hasAll = rule.requiredItems.every(item =>
        this.slots.some(slot => slot && slot.name === item)
      );

      if (hasAll) {
        // Remove components
        rule.requiredItems.forEach(item => this.removeItem(item, 1));
        // Add new item
        this.addItem(rule.resultItem);
        console.log(`✨ Crafted new item: "${rule.resultItem}"`);
        return; // one rule at a time
      }
    }
  }

  // --- Find item
  getItem(name) {
    return this.slots.find(s => s && s.name === name) || null;
  }

  // --- Print inventory table
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

  // --- Clear inventory
  clear() {
    this.slots.fill(null);
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeTimers.clear();
    this._dispatchUpdate();
    console.log("🧹 Inventory cleared");
  }

  // --- Internal event dispatcher for HUD sync
  _dispatchUpdate() {
    dispatchEvent(
      new CustomEvent("inventory-update", {
        detail: { hero: this.owner.name, items: this.slots }
      })
    );
  }
}
// --- Core archetype definitions
export const HERO_ARCHETYPES = {
  Warrior: {
    hpMult: 1.2,
    manaMult: 0.8,
    attackMult: 1.1,
    armorMult: 1.2,
    moveSpeed: 1.0,
    attackSpeed: 1.0,
    hpRegenMult: 1.2,
    mpRegenMult: 0.9,
  },
  Mage: {
    hpMult: 0.8,
    manaMult: 1.4,
    attackMult: 0.9,
    armorMult: 0.8,
    moveSpeed: 1.05,
    attackSpeed: 0.95,
    hpRegenMult: 0.8,
    mpRegenMult: 1.4,
  },
  Assassin: {
    hpMult: 0.9,
    manaMult: 1.0,
    attackMult: 1.3,
    armorMult: 0.7,
    moveSpeed: 1.2,
    attackSpeed: 1.3,
    hpRegenMult: 1.0,
    mpRegenMult: 1.0,
  },
  Tank: {
    hpMult: 1.5,
    manaMult: 0.7,
    attackMult: 0.9,
    armorMult: 1.5,
    moveSpeed: 0.9,
    attackSpeed: 0.9,
    hpRegenMult: 1.4,
    mpRegenMult: 0.7,
  },
  Ranger: {
    hpMult: 1.0,
    manaMult: 1.0,
    attackMult: 1.2,
    armorMult: 0.9,
    moveSpeed: 1.1,
    attackSpeed: 1.15,
    hpRegenMult: 1.0,
    mpRegenMult: 1.0,
  },
  Support: {
    hpMult: 1.0,
    manaMult: 1.3,
    attackMult: 0.8,
    armorMult: 0.9,
    moveSpeed: 1.0,
    attackSpeed: 0.9,
    hpRegenMult: 1.1,
    mpRegenMult: 1.3,
  },
};

export class HeroProps {
  constructor(name) {
    this.name = name;

    this.levels = [
      {level: 1, xp: 100, hp: 500, mana: 300, attack: 40, armor: 5, moveSpeed: 4.0, attackSpeed: 1.0, hpRegen: 2.0, mpRegen: 1.0, abilityPoints: 1},
      {level: 2, xp: 200, hp: 570, mana: 345, attack: 46, armor: 5.5, moveSpeed: 4.05, attackSpeed: 1.05, hpRegen: 2.25, mpRegen: 1.15, abilityPoints: 2},
      {level: 3, xp: 350, hp: 645, mana: 395, attack: 52, armor: 6, moveSpeed: 4.10, attackSpeed: 1.10, hpRegen: 2.52, mpRegen: 1.31, abilityPoints: 3},
      {level: 4, xp: 500, hp: 725, mana: 450, attack: 58, armor: 6.5, moveSpeed: 4.15, attackSpeed: 1.16, hpRegen: 2.81, mpRegen: 1.49, abilityPoints: 4},
      {level: 5, xp: 700, hp: 810, mana: 510, attack: 65, armor: 7, moveSpeed: 4.20, attackSpeed: 1.23, hpRegen: 3.13, mpRegen: 1.68, abilityPoints: 5},
      {level: 6, xp: 900, hp: 900, mana: 575, attack: 72, armor: 7.5, moveSpeed: 4.25, attackSpeed: 1.31, hpRegen: 3.48, mpRegen: 1.88, abilityPoints: 6},
      {level: 7, xp: 1150, hp: 995, mana: 645, attack: 80, armor: 8, moveSpeed: 4.30, attackSpeed: 1.40, hpRegen: 3.85, mpRegen: 2.10, abilityPoints: 7},
      {level: 8, xp: 1400, hp: 1095, mana: 720, attack: 88, armor: 8.5, moveSpeed: 4.35, attackSpeed: 1.50, hpRegen: 4.25, mpRegen: 2.33, abilityPoints: 8},
      {level: 9, xp: 1700, hp: 1200, mana: 800, attack: 97, armor: 9, moveSpeed: 4.40, attackSpeed: 1.61, hpRegen: 4.68, mpRegen: 2.58, abilityPoints: 9},
      {level: 10, xp: null, hp: 1310, mana: 885, attack: 107, armor: 9.5, moveSpeed: 4.45, attackSpeed: 1.73, hpRegen: 5.13, mpRegen: 2.84, abilityPoints: 10}
    ];

    this.currentLevel = 1;
    this.currentXP = 0;
    this.gold = 0;

    this.baseXP = 100;
    this.baseGold = 200;

    // --- Multipliers
    this.xpMultiplier = {stronger: 0.1, weaker: 0.2};
    this.goldMultiplier = 50;

    // --- Maximum level difference for XP
    this.maxLevelDiffForXP = 3;

    this.abilities = [
      {name: "Spell 1", level: 1, maxLevel: 4},
      {name: "Spell 2", level: 0, maxLevel: 4},
      {name: "Spell 3", level: 0, maxLevel: 4},
      {name: "Ultimate", level: 0, maxLevel: 1}
    ];

    this.updateStats();
  }

  // --- Update stats
  updateStats() {
    const lvlData = this.levels[this.currentLevel - 1];
    if(!lvlData) return;

    Object.assign(this, {
      hp: lvlData.hp,
      mana: lvlData.mana,
      attack: lvlData.attack,
      armor: lvlData.armor,
      moveSpeed: lvlData.moveSpeed,
      attackSpeed: lvlData.attackSpeed,
      hpRegen: lvlData.hpRegen,
      mpRegen: lvlData.mpRegen,
      abilityPoints: lvlData.abilityPoints
    });
  }

  // --- Kill enemy: only enemyLevel argument
  killEnemy(enemyLevel) {
    if(enemyLevel < 1) enemyLevel = 1;

    const levelDiff = this.currentLevel - enemyLevel;

    // --- XP calculation with cap for weak enemies
    let earnedXP = 0;
    if(levelDiff < this.maxLevelDiffForXP) {
      if(enemyLevel >= this.currentLevel) {
        earnedXP = this.baseXP * (1 + this.xpMultiplier.stronger * (enemyLevel - this.currentLevel));
      } else {
        earnedXP = this.baseXP * (1 - this.xpMultiplier.weaker * (this.currentLevel - enemyLevel));
      }
      earnedXP = Math.round(Math.max(0, earnedXP));
    }

    // --- Gold reward
    const goldReward = this.baseGold + enemyLevel * this.goldMultiplier;

    this.currentXP += earnedXP;
    this.gold += goldReward;

    console.log(`${this.name} killed Lv${enemyLevel} enemy: +${earnedXP} XP, +${goldReward} gold`);
    this.checkLevelUp();
  }

  // --- Automatic level-up
  checkLevelUp() {
    while(this.currentLevel < 10) {
      const nextLevelXP = this.levels[this.currentLevel - 1].xp;
      if(this.currentXP >= nextLevelXP) {
        this.currentLevel++;
        console.log(`${this.name} leveled up! Now level ${this.currentLevel}`);
        this.updateStats();
        this.currentXP -= nextLevelXP;
      } else break;
    }
  }

  // --- Upgrade abilities
  upgradeAbility(spellIndex) {
    const spell = this.abilities[spellIndex];
    if(!spell) return false;
    if(spell.level < spell.maxLevel && this.abilityPoints > 0) {
      spell.level++;
      this.abilityPoints--;
      console.log(`${this.name} upgraded ${spell.name} to level ${spell.level}`);
      return true;
    }
    return false;
  }

  // --- Get / Set stats
  getStat(statName) {return this[statName] ?? null;}
  setStat(statName, value) {
    if(this.hasOwnProperty(statName)) {
      this[statName] = value;
      return true;
    }
    return false;
  }

  // --- Debug print
  debugPrint() {
    console.table({
      level: this.currentLevel,
      xp: this.currentXP,
      gold: this.gold,
      hp: this.hp,
      mana: this.mana,
      attack: this.attack,
      armor: this.armor,
      moveSpeed: this.moveSpeed,
      attackSpeed: this.attackSpeed,
      hpRegen: this.hpRegen,
      mpRegen: this.mpRegen,
      abilityPoints: this.abilityPoints,
      abilities: this.abilities.map(a => `${a.name} (Lv ${a.level})`).join(", ")
    });
  }

  showUpgradeableAbilities() {
    if(this.abilityPoints <= 0) {
      console.log(`${this.name} has no ability points to spend.`);
      return [];
    }

    const upgradeable = this.abilities
      .map((spell, index) => ({...spell, index}))
      .filter(spell => spell.level < spell.maxLevel);

    if(upgradeable.length === 0) {
      console.log(`${this.name} has no spells left to upgrade.`);
      return [];
    }

    console.log(`${this.name} has ${this.abilityPoints} ability point(s) available.`);
    console.log("Upgradeable spells:");
    upgradeable.forEach(spell => {
      console.log(`  [${spell.index}] ${spell.name} (Lv ${spell.level}/${spell.maxLevel})`);
    });

    return upgradeable;
  }

  // --- Upgrade a spell by name (optional convenience)
  upgradeAbilityByName(spellName) {
    const spellIndex = this.abilities.findIndex(s => s.name === spellName);
    if(spellIndex === -1) return false;
    return this.upgradeAbility(spellIndex);
  }
}

// --- Extend base HeroProps
export class Hero extends HeroProps {
  constructor(name, archetype = "Warrior") {
    super(name);
    this.archetype = archetype;
    this.applyArchetypeStats();
  }

  applyArchetypeStats() {
    const type = HERO_ARCHETYPES[this.archetype];
    if(!type) return;

    // Apply multipliers to current stats
    this.hp *= type.hpMult;
    this.mana *= type.manaMult;
    this.attack *= type.attackMult;
    this.armor *= type.armorMult;
    this.moveSpeed *= type.moveSpeed;
    this.attackSpeed *= type.attackSpeed;
    this.hpRegen *= type.hpRegenMult;
    this.mpRegen *= type.mpRegenMult;
  }

  // Override updateStats to include archetype scaling
  updateStats() {
    super.updateStats();
    this.applyArchetypeStats();
  }
}
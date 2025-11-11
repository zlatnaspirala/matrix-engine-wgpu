/**
 * @description
 * Hero based classes
 * Core of RPG type of game.
 */
export const HERO_ARCHETYPES = {
  Warrior: {
    hpMult: 1.2,
    manaMult: 0.8,
    attackMult: 1.1,
    armorMult: 1.2,
    moveSpeed: 1.0,
    attackSpeed: 1.0,
    hpRegenMult: 1.2,
    manaRegenMult: 0.8
  },
  Tank: {
    hpMult: 1.6,
    manaMult: 0.6,
    attackMult: 0.9,
    armorMult: 1.5,
    moveSpeed: 0.9,
    attackSpeed: 0.8,
    hpRegenMult: 1.4,
    manaRegenMult: 0.7
  },
  Assassin: {
    hpMult: 0.9,
    manaMult: 0.9,
    attackMult: 1.5,
    armorMult: 0.8,
    moveSpeed: 1.3,
    attackSpeed: 1.4,
    hpRegenMult: 0.9,
    manaRegenMult: 0.9
  },
  Mage: {
    hpMult: 0.8,
    manaMult: 1.5,
    attackMult: 0.9,
    armorMult: 0.7,
    moveSpeed: 1.0,
    attackSpeed: 0.9,
    hpRegenMult: 0.8,
    manaRegenMult: 1.5
  },
  Support: {
    hpMult: 1.0,
    manaMult: 1.2,
    attackMult: 0.8,
    armorMult: 1.0,
    moveSpeed: 1.0,
    attackSpeed: 1.0,
    hpRegenMult: 1.2,
    manaRegenMult: 1.2
  },
  Ranger: {
    hpMult: 1.0,
    manaMult: 1.0,
    attackMult: 1.2,
    armorMult: 0.9,
    moveSpeed: 1.2,
    attackSpeed: 1.2,
    hpRegenMult: 1.0,
    manaRegenMult: 1.0
  },
  Summoner: {
    hpMult: 0.9,
    manaMult: 1.4,
    attackMult: 0.8,
    armorMult: 0.9,
    moveSpeed: 1.0,
    attackSpeed: 0.9,
    hpRegenMult: 1.0,
    manaRegenMult: 1.4
  },
  Necromancer: {
    hpMult: 0.9,
    manaMult: 1.4,
    attackMult: 0.9,
    armorMult: 0.8,
    moveSpeed: 1.0,
    attackSpeed: 0.9,
    hpRegenMult: 0.9,
    manaRegenMult: 1.4
  },
  Engineer: {
    hpMult: 1.1,
    manaMult: 1.0,
    attackMult: 1.0,
    armorMult: 1.1,
    moveSpeed: 1.0,
    attackSpeed: 1.0,
    hpRegenMult: 1.0,
    manaRegenMult: 1.0
  },
  // special for creeps
  creep: {
    hpMult: 0.6,
    manaMult: 1,
    attackMult: 1,
    armorMult: 1,
    moveSpeed: 0.3,
    attackSpeed: 0.5,
    hpRegenMult: 1,
    manaRegenMult: 1
  }
};

export class HeroProps {
  constructor(name) {
    this.name = name;

    this.levels = [
      {level: 1, xp: 100, hp: 500, mana: 300, attack: 40, armor: 5, moveSpeed: 1.0, attackSpeed: 1.0, hpRegen: 2.0, mpRegen: 1.0, abilityPoints: 1},
      {level: 2, xp: 200, hp: 570, mana: 345, attack: 46, armor: 5.5, moveSpeed: 1.05, attackSpeed: 1.05, hpRegen: 2.25, mpRegen: 1.15, abilityPoints: 2},
      {level: 3, xp: 350, hp: 645, mana: 395, attack: 52, armor: 6, moveSpeed: 1.10, attackSpeed: 1.10, hpRegen: 2.52, mpRegen: 1.31, abilityPoints: 3},
      {level: 4, xp: 500, hp: 725, mana: 450, attack: 58, armor: 6.5, moveSpeed: 1.15, attackSpeed: 1.16, hpRegen: 2.81, mpRegen: 1.49, abilityPoints: 4},
      {level: 5, xp: 700, hp: 810, mana: 510, attack: 65, armor: 7, moveSpeed: 1.20, attackSpeed: 1.23, hpRegen: 3.13, mpRegen: 1.68, abilityPoints: 5},
      {level: 6, xp: 900, hp: 900, mana: 575, attack: 72, armor: 7.5, moveSpeed: 1.25, attackSpeed: 1.31, hpRegen: 3.48, mpRegen: 1.88, abilityPoints: 6},
      {level: 7, xp: 1150, hp: 995, mana: 645, attack: 80, armor: 8, moveSpeed: 1.30, attackSpeed: 1.40, hpRegen: 3.85, mpRegen: 2.10, abilityPoints: 7},
      {level: 8, xp: 1400, hp: 1095, mana: 720, attack: 88, armor: 8.5, moveSpeed: 1.35, attackSpeed: 1.50, hpRegen: 4.25, mpRegen: 2.33, abilityPoints: 8},
      {level: 9, xp: 1700, hp: 1200, mana: 800, attack: 97, armor: 9, moveSpeed: 1.40, attackSpeed: 1.61, hpRegen: 4.68, mpRegen: 2.58, abilityPoints: 9},
      {level: 10, xp: null, hp: 1310, mana: 885, attack: 107, armor: 9.5, moveSpeed: 1.45, attackSpeed: 1.73, hpRegen: 5.13, mpRegen: 2.84, abilityPoints: 10}
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

    this.invertoryBonus = {
      hp: 1,
      mana: 1,
      attack: 1,
      armor: 1,
      moveSpeed: 1,
      attackSpeed: 1,
      hpRegen: 1,
      mpRegen: 1
    };
    this.updateStats();
  }

  updateStats() {
    const lvlData = this.levels[this.currentLevel - 1];
    if(!lvlData) return;

    console.log('updateStats: armor ', this.invertoryBonus.armor)

    Object.assign(this, {
      hp: lvlData.hp * this.invertoryBonus.hp,
      mana: lvlData.mana * this.invertoryBonus.mana,
      attack: lvlData.attack * this.invertoryBonus.attack,
      armor: lvlData.armor * this.invertoryBonus.armor,
      moveSpeed: lvlData.moveSpeed * this.invertoryBonus.moveSpeed,
      attackSpeed: lvlData.attackSpeed * this.invertoryBonus.attackSpeed,
      hpRegen: lvlData.hpRegen * this.invertoryBonus.hpRegen,
      mpRegen: lvlData.mpRegen * this.invertoryBonus.mpRegen,
      abilityPoints: lvlData.abilityPoints
    });

    dispatchEvent(new CustomEvent('stats-localhero', {
      detail: {
        gold: this.gold,
        currentLevel: this.currentLevel,
        xp: this.currentXP,
        hp: this.hp,
        mana: this.mana,
        attack: this.attack,
        armor: this.armor,
        moveSpeed: this.moveSpeed,
        attackSpeed: this.attackSpeed,
        hpRegen: this.hpRegen,
        mpRegen: this.mpRegen,
      }
    }))
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

    // for creep any way - rule if they kill hero
    // maybe some smlall reward... checkLevelUp
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

    // emit for hud
    // dispatchEvent(new CustomEvent('stats-localhero', {
    //   detail: {
    //     gold: this.gold,
    //     currentLevel: this.currentLevel,
    //     xp: this.currentXP,
    //     hp: this.hp,
    //     mana: this.mana,
    //     attack: this.attack,
    //     armor: this.armor,
    //     moveSpeed: this.moveSpeed,
    //     attackSpeed: this.attackSpeed,
    //     hpRegen: this.hpRegen,
    //     mpRegen: this.mpRegen,
    //   }
    // }))
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

  // attack NORMAL
  calcDamage(attacker, defender, abilityMultiplier = 1.0, critChance = 1, critMult = 1) {
    // Use attack from your current scaled stats
    const baseAttack = attacker.attack;
    // Optional: magic abilities could use mana or another stat later
    const base = baseAttack * abilityMultiplier;
    // Critical hit roll - not for now
    const crit = Math.random() < critChance ? critMult : 1.0;
    // Damage reduced by armor
    const damage = Math.max(0, (base * crit) - defender.armor);
    // Apply damage
    defender.hp = Math.max(0, defender.hp - damage);
    // --- Sync energy bar (0 → 1)
    const progress = Math.max(0, Math.min(1, defender.hp / this.getHPMax()));
    dispatchEvent(new CustomEvent(`onDamage-${defender.name}`,
      {
        detail: {
          progress: progress,
          attacker: attacker.name,
          defenderLevel: defender.currentLevel,
          defender: defender.name,
          hp: defender.hp
        }
      }))
    return {damage, crit: crit > 1.0};
  }
}

export class Hero extends HeroProps {
  constructor(name, archetypes = ["Warrior"]) {
    super(name);
    this.archetypes = archetypes.slice(0, 2); // limit to 2
    this.applyArchetypeStats();
  }

  applyArchetypeStats() {
    if(!this.archetypes || this.archetypes.length === 0) return;

    let typeData;

    if(this.archetypes.length === 2) {
      typeData = mergeArchetypes(this.archetypes[0], this.archetypes[1]);
    } else {
      typeData = HERO_ARCHETYPES[this.archetypes[0]];
    }

    if(!typeData) return;

    this.hp *= typeData.hpMult;
    this.mana *= typeData.manaMult;
    this.attack *= typeData.attackMult;
    this.armor *= typeData.armorMult;
    this.moveSpeed *= typeData.moveSpeed;
    this.attackSpeed *= typeData.attackSpeed;
    this.hpRegen *= typeData.hpRegenMult;
    this.mpRegen *= typeData.manaRegenMult;

    this._mergedArchetype = typeData._mergedFrom || this.archetypes;
  }

  getHPMax() {
    let typeData;
    if(this.archetypes.length === 2) {
      typeData = mergeArchetypes(this.archetypes[0], this.archetypes[1]);
    } else {
      typeData = HERO_ARCHETYPES[this.archetypes[0]];
    }
    this.baseHp = this.levels[this.currentLevel - 1].hp;
    return this.baseHp; // * typeData.hpMult; ???
  }

  // Override updateStats to include archetype scaling
  updateStats() {
    super.updateStats();
    this.applyArchetypeStats();
    console.log('Override updateStats to include archetype scaling ....')
  }
}

export const HERO_PROFILES = {
  MariaSword: {
    baseArchetypes: ["Warrior", "Mage"],
    colorTheme: ["gold", "orange"],
    weapon: "Sword",
    abilities: ["Solar Dash", "Radiant Ascend", "Luminous Counter", "Solar Bloom"]
  }
};

export function mergeArchetypes(typeA, typeB) {
  if(!HERO_ARCHETYPES[typeA] || !HERO_ARCHETYPES[typeB]) {
    console.warn(`Invalid archetype(s): ${typeA}, ${typeB}`);
    return HERO_ARCHETYPES[typeA] || HERO_ARCHETYPES[typeB];
  }

  const a = HERO_ARCHETYPES[typeA];
  const b = HERO_ARCHETYPES[typeB];
  const merged = {};

  // Average their multipliers (or tweak with weights if needed)
  for(const key in a) {
    if(typeof a[key] === "number" && typeof b[key] === "number") {
      merged[key] = (a[key] + b[key]) / 2;
    }
  }

  merged._mergedFrom = [typeA, typeB];
  return merged;
}

// not used now
export function mergeArchetypesWeighted(typeA, typeB, weightA = 0.7) {
  const a = HERO_ARCHETYPES[typeA];
  const b = HERO_ARCHETYPES[typeB];
  const wB = 1 - weightA;
  const merged = {};

  for(const key in a)
    if(typeof a[key] === "number" && typeof b[key] === "number")
      merged[key] = a[key] * weightA + b[key] * wB;

  merged._mergedFrom = [typeA, typeB];
  return merged;
}
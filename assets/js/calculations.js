/**
 * VerdeScope Platform — Shared Calculation Engine
 * File: assets/js/calculations.js
 * Version: 1.0.0 | April 2026
 *
 * Implements IPCC 2006 + 2019 Refinement Tier 1/2/3 methodology for
 * upstream oil & gas GHG emissions, as mandated by NUPRC Guide 0024-2022.
 *
 * All emission factors locked to IPCC AR6 (2021) values.
 * GWP100 values: CO2=1, CH4=27.9, N2O=273  (IPCC AR6 Table 7.SM.7)
 * GWP20  values: CH4=82.5 (fossil methane)  (IPCC AR6; NUPRC energy intensity)
 *
 * Usage:
 *   import { VS } from './calculations.js';
 *   const result = VS.flaring.co2({ volumeM3: 1000, drePct: 98 });
 */

"use strict";

/* ════════════════════════════════════════════════════════════════
   CONSTANTS — IPCC AR6 locked values
════════════════════════════════════════════════════════════════ */
const GWP = Object.freeze({
  CO2:  1,
  CH4:  27.9,   // 100-year, AR6 — use for all CO2e totals
  CH4_20: 82.5, // 20-year, fossil methane — NUPRC energy intensity only
  N2O:  273,    // 100-year, AR6
});

const EF = Object.freeze({
  // Gas flaring (IPCC 2006 Vol 2 Ch4.2)
  FLARING_CO2_KG_PER_M3:  2.693,   // kg CO2 per m3 gas flared
  FLARING_CH4_FRACTION:   0.003,   // unburned CH4 at 98% DRE
  FLARING_N2O_KG_PER_M3:  0.00010, // kg N2O per m3 flared

  // Stationary combustion — diesel (IPCC 2006 Vol 2 Table 2.2)
  DIESEL_CO2_KG_PER_GJ:   74.1,    // kg CO2 per GJ
  DIESEL_GJ_PER_TONNE:    43.0,    // GJ per tonne diesel
  DIESEL_CH4_KG_PER_GJ:   0.003,
  DIESEL_N2O_KG_PER_GJ:   0.0006,

  // Natural gas combustion (IPCC 2006 Vol 2 Table 2.2)
  NAT_GAS_CO2_KG_PER_GJ:  56.1,
  NAT_GAS_GJ_PER_M3:      0.03846, // assuming 38.46 MJ/m3 (Nigerian lean gas)
  NAT_GAS_CH4_KG_PER_GJ:  0.001,
  NAT_GAS_N2O_KG_PER_GJ:  0.0001,

  // Electricity — Nigeria national grid (2023 estimate)
  GRID_KG_CO2_PER_KWH:    0.431,   // kgCO2/kWh — location-based

  // Fugitive — pneumatic controllers (API Compendium 3rd Ed.)
  PNEUMATIC_HIGH_BLEED_SCM_HR: 17.0,    // scm/hr per high-bleed controller
  PNEUMATIC_LOW_BLEED_SCM_HR:  1.4,     // scm/hr per low-bleed controller
  PNEUMATIC_CH4_FRACTION:      0.85,    // CH4 mole fraction in produced gas

  // Fugitive — compressor rod packing (API Compendium)
  ROD_PACK_KG_CH4_PER_HR:  0.000636,   // kg CH4/hr default leakage
  // Fugitive — centrifugal compressor wet seal (API Compendium)
  WET_SEAL_KG_CH4_PER_HR:  0.00140,    // kg CH4/hr default leakage

  // Venting
  CH4_DENSITY_KG_PER_SCM:  0.6772,     // at standard conditions

  // NUPRC flare DRE requirement
  NUPRC_DRE_REQUIREMENT:   0.98,
});

// Equipment-level constants
const EQUIP = Object.freeze({
  ROD_PACKING_MAX_HOURS:    26000,  // hours — NUPRC Guide 0024-2022 §3.4.4
  ROD_PACKING_MAX_MONTHS:   36,     // months — whichever first
  ROD_PACKING_WARN_HOURS:   24000,  // warning threshold in VerdeScope
  PNEUMATIC_PHASE_IN: [0.25, 0.65, 0.75, 0.85, 1.00], // years 1–5
  TANK_VOC_TIER1_TPY:       12,     // >12 tpy: Year 1 control
  TANK_VOC_TIER2_TPY:       6,      // 6–12 tpy: Year 2 control
  TANK_VOC_TIER3_TPY:       2,      // 2–6 tpy: Year 3 control
});

/* ════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
════════════════════════════════════════════════════════════════ */
const utils = {
  /**
   * Convert kg to metric tonnes
   */
  kgToT: (kg) => kg / 1000,

  /**
   * Convert kgCO2e using GWP100
   * @param {number} kgCO2 - kg CO2
   * @param {number} kgCH4 - kg CH4
   * @param {number} kgN2O - kg N2O
   * @returns {number} total tCO2e (GWP100)
   */
  toTCO2e: (kgCO2 = 0, kgCH4 = 0, kgN2O = 0) => {
    return utils.kgToT(
      kgCO2 * GWP.CO2 +
      kgCH4 * GWP.CH4 +
      kgN2O * GWP.N2O
    );
  },

  /**
   * Convert CH4 mass (kg) to tCO2e using 20-year GWP (for energy intensity only)
   */
  ch4ToTCO2e20: (kgCH4) => utils.kgToT(kgCH4 * GWP.CH4_20),

  /**
   * Safe division — returns 0 if denominator is 0
   */
  safeDiv: (num, den) => (den === 0 ? 0 : num / den),

  /**
   * Round to N decimal places
   */
  round: (val, dp = 2) => Math.round(val * 10 ** dp) / 10 ** dp,
};

/* ════════════════════════════════════════════════════════════════
   MODULE 1 — GAS FLARING
   IPCC 2006 Vol 2 Ch4.2 | NUPRC Guide 0024-2022 §3.3.2
════════════════════════════════════════════════════════════════ */
const flaring = {
  /**
   * CO2 from flaring
   * @param {Object} p
   * @param {number} p.volumeM3  — volume of gas sent to flare (m3)
   * @param {number} p.drePct    — destruction removal efficiency (%) default 98
   * @returns {Object} { kgCO2, kgCH4, kgN2O, tCO2e }
   */
  co2({ volumeM3, drePct = 98 }) {
    const dre = drePct / 100;
    const kgCO2 = volumeM3 * EF.FLARING_CO2_KG_PER_M3 * dre;
    const kgCH4 = volumeM3 * EF.FLARING_CH4_FRACTION * (1 - dre);
    const kgN2O = volumeM3 * EF.FLARING_N2O_KG_PER_M3;
    return {
      kgCO2: utils.round(kgCO2, 3),
      kgCH4: utils.round(kgCH4, 3),
      kgN2O: utils.round(kgN2O, 5),
      tCO2e: utils.round(utils.toTCO2e(kgCO2, kgCH4, kgN2O), 4),
    };
  },

  /**
   * Validate DRE compliance against NUPRC 98% requirement
   */
  dreCompliant: (drePct) => drePct >= EF.NUPRC_DRE_REQUIREMENT * 100,
};

/* ════════════════════════════════════════════════════════════════
   MODULE 2 — STATIONARY COMBUSTION (DIESEL / NAT GAS)
   IPCC 2006 Vol 2 Ch2 | Tier 1
════════════════════════════════════════════════════════════════ */
const combustion = {
  /**
   * Diesel combustion
   * @param {Object} p
   * @param {number} p.litres — litres consumed
   * @returns {Object} { kgCO2, kgCH4, kgN2O, tCO2e }
   */
  diesel({ litres }) {
    const tonnes = litres * 0.000832; // density ~0.832 kg/L
    const gj = tonnes * EF.DIESEL_GJ_PER_TONNE;
    const kgCO2 = gj * EF.DIESEL_CO2_KG_PER_GJ;
    const kgCH4 = gj * EF.DIESEL_CH4_KG_PER_GJ;
    const kgN2O = gj * EF.DIESEL_N2O_KG_PER_GJ;
    return {
      kgCO2: utils.round(kgCO2, 3),
      kgCH4: utils.round(kgCH4, 5),
      kgN2O: utils.round(kgN2O, 6),
      tCO2e: utils.round(utils.toTCO2e(kgCO2, kgCH4, kgN2O), 4),
    };
  },

  /**
   * Natural gas combustion (turbines, engines, heaters)
   * @param {Object} p
   * @param {number} p.volumeM3 — m3 of gas consumed
   * @returns {Object} { kgCO2, kgCH4, kgN2O, tCO2e }
   */
  naturalGas({ volumeM3 }) {
    const gj = volumeM3 * EF.NAT_GAS_GJ_PER_M3;
    const kgCO2 = gj * EF.NAT_GAS_CO2_KG_PER_GJ;
    const kgCH4 = gj * EF.NAT_GAS_CH4_KG_PER_GJ;
    const kgN2O = gj * EF.NAT_GAS_N2O_KG_PER_GJ;
    return {
      kgCO2: utils.round(kgCO2, 3),
      kgCH4: utils.round(kgCH4, 5),
      kgN2O: utils.round(kgN2O, 6),
      tCO2e: utils.round(utils.toTCO2e(kgCO2, kgCH4, kgN2O), 4),
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 3 — FUGITIVE EMISSIONS
   NUPRC Guide 0024-2022 §3 | API Compendium 3rd Ed.
════════════════════════════════════════════════════════════════ */
const fugitive = {
  /**
   * Pneumatic controller continuous bleed
   * @param {Object} p
   * @param {number} p.count         — number of controllers
   * @param {string} p.type          — 'high' | 'low' | 'zero'
   * @param {number} p.hoursPerYear  — operating hours (default 8760)
   * @returns {Object} { kgCH4, tCO2e }
   */
  pneumatic({ count, type = 'high', hoursPerYear = 8760 }) {
    const rateMap = { high: EF.PNEUMATIC_HIGH_BLEED_SCM_HR, low: EF.PNEUMATIC_LOW_BLEED_SCM_HR, zero: 0 };
    const bleedRate = rateMap[type] ?? 0;
    const kgCH4 = count * bleedRate * hoursPerYear * EF.CH4_DENSITY_KG_PER_SCM * EF.PNEUMATIC_CH4_FRACTION;
    return {
      kgCH4: utils.round(kgCH4, 3),
      tCO2e: utils.round(utils.toTCO2e(0, kgCH4, 0), 4),
    };
  },

  /**
   * Reciprocating compressor rod packing leakage
   * @param {Object} p
   * @param {number} p.hoursOperated — total hours operated
   * @returns {Object} { kgCH4, tCO2e }
   */
  rodPacking({ hoursOperated }) {
    const kgCH4 = hoursOperated * EF.ROD_PACK_KG_CH4_PER_HR;
    return {
      kgCH4: utils.round(kgCH4, 3),
      tCO2e: utils.round(utils.toTCO2e(0, kgCH4, 0), 4),
    };
  },

  /**
   * Rod packing compliance status
   * @returns {Object} { status: 'ok'|'warning'|'overdue', hoursRemaining }
   */
  rodPackingStatus({ hoursOperated }) {
    if (hoursOperated >= EQUIP.ROD_PACKING_MAX_HOURS) return { status: 'overdue', hoursRemaining: 0 };
    if (hoursOperated >= EQUIP.ROD_PACKING_WARN_HOURS) return { status: 'warning', hoursRemaining: EQUIP.ROD_PACKING_MAX_HOURS - hoursOperated };
    return { status: 'ok', hoursRemaining: EQUIP.ROD_PACKING_MAX_HOURS - hoursOperated };
  },

  /**
   * Centrifugal compressor wet seal
   * @param {Object} p
   * @param {number} p.count         — number of wet seal compressors
   * @param {number} p.hoursPerYear  — operating hours
   * @returns {Object} { kgCH4, tCO2e }
   */
  wetSeal({ count, hoursPerYear = 8760 }) {
    const kgCH4 = count * EF.WET_SEAL_KG_CH4_PER_HR * hoursPerYear;
    return {
      kgCH4: utils.round(kgCH4, 3),
      tCO2e: utils.round(utils.toTCO2e(0, kgCH4, 0), 4),
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 4 — SCOPE 2 ELECTRICITY
   GHG Protocol Scope 2 | Nigeria grid factor
════════════════════════════════════════════════════════════════ */
const scope2 = {
  /**
   * Grid electricity consumption
   * @param {Object} p
   * @param {number} p.kWh — kWh consumed
   * @returns {Object} { kgCO2, tCO2e }
   */
  grid({ kWh }) {
    const kgCO2 = kWh * EF.GRID_KG_CO2_PER_KWH;
    return {
      kgCO2: utils.round(kgCO2, 3),
      tCO2e: utils.round(utils.kgToT(kgCO2), 4),
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 5 — ENERGY INTENSITY
   NUPRC Guide 0024-2022 Appendix D
════════════════════════════════════════════════════════════════ */
const energyIntensity = {
  /**
   * Calculate energy intensity per NUPRC Appendix D
   * Note: uses GWP20 (82.5) for CH4 per NUPRC mandate
   * @param {Object} p
   * @param {number} p.tCO2           — tonnes CO2 (Scope 1)
   * @param {number} p.tCH4           — tonnes CH4 (Scope 1)
   * @param {number} p.oilBbls        — oil production in barrels
   * @param {number} p.gasMcf         — gas production in MCF
   * @returns {Object} { ei, tCO2eNumerator, mboe, unit: 'tCO2e/MBOE' }
   */
  calculate({ tCO2, tCH4, oilBbls, gasMcf }) {
    const tCO2eNumerator = tCO2 * GWP.CO2 + tCH4 * GWP.CH4_20;
    const oilMboe = oilBbls * 0.000001;
    const gasMboe = gasMcf * 0.000166;
    const mboe = oilMboe + gasMboe;
    const ei = utils.safeDiv(tCO2eNumerator, mboe);
    return {
      ei: utils.round(ei, 2),
      tCO2eNumerator: utils.round(tCO2eNumerator, 2),
      mboe: utils.round(mboe, 4),
      unit: 'tCO2e/MBOE',
    };
  },

  /**
   * Annual EI reduction target check
   * @param {number} currentEI   — current year EI
   * @param {number} baseYearEI  — 2020 base year EI
   * @param {number} yearsElapsed — years since 2020
   * @returns {Object} { targetEI, gap, onTrack }
   */
  targetCheck({ currentEI, baseYearEI, yearsElapsed }) {
    const targetEI = utils.round(baseYearEI * (1 - 0.025) ** yearsElapsed, 3);
    const gap = utils.round(currentEI - targetEI, 3);
    return { targetEI, gap, onTrack: gap <= 0 };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 6 — GHG INVENTORY AGGREGATION
════════════════════════════════════════════════════════════════ */
const inventory = {
  /**
   * Aggregate facility-level emission records into an annual inventory
   * @param {Array} records — array of { source, kgCO2, kgCH4, kgN2O, period }
   * @returns {Object} full inventory summary
   */
  aggregate(records) {
    let totKgCO2 = 0, totKgCH4 = 0, totKgN2O = 0;
    const bySource = {};

    for (const r of records) {
      totKgCO2 += r.kgCO2 || 0;
      totKgCH4 += r.kgCH4 || 0;
      totKgN2O += r.kgN2O || 0;
      if (!bySource[r.source]) bySource[r.source] = { kgCO2: 0, kgCH4: 0, kgN2O: 0, tCO2e: 0 };
      bySource[r.source].kgCO2 += r.kgCO2 || 0;
      bySource[r.source].kgCH4 += r.kgCH4 || 0;
      bySource[r.source].kgN2O += r.kgN2O || 0;
      bySource[r.source].tCO2e = utils.toTCO2e(bySource[r.source].kgCO2, bySource[r.source].kgCH4, bySource[r.source].kgN2O);
    }

    const totalTCO2e = utils.toTCO2e(totKgCO2, totKgCH4, totKgN2O);
    return {
      scope: 'Scope 1',
      totalKgCO2: utils.round(totKgCO2, 1),
      totalKgCH4: utils.round(totKgCH4, 1),
      totalKgN2O: utils.round(totKgN2O, 3),
      totalTCO2e: utils.round(totalTCO2e, 2),
      bySource,
      gwpBasis: 'IPCC AR6 GWP100',
      generatedAt: new Date().toISOString(),
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 7 — UPDT COMPLIANCE SCORING
════════════════════════════════════════════════════════════════ */
const updt = {
  /**
   * Calculate UPDT Compliance Readiness Score (0–100)
   * Weighted average of 5 obligations
   * @param {Object} obligations — { ob1, ob2, ob3, ob4, ob5 } each 0–100
   * @returns {Object} { score, breakdown, passed }
   */
  score({ ob1 = 0, ob2 = 0, ob3 = 0, ob4 = 0, ob5 = 0 }) {
    const weights = { ob1: 0.25, ob2: 0.25, ob3: 0.20, ob4: 0.20, ob5: 0.10 };
    const score = utils.round(
      ob1 * weights.ob1 +
      ob2 * weights.ob2 +
      ob3 * weights.ob3 +
      ob4 * weights.ob4 +
      ob5 * weights.ob5,
      1
    );
    return {
      score,
      breakdown: { ob1, ob2, ob3, ob4, ob5 },
      weights,
      passed: score >= 70,
      label: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'At Risk',
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 8 — LDAR REPAIR DEADLINES
   NUPRC Guide 0024-2022 §3.2.4
════════════════════════════════════════════════════════════════ */
const ldar = {
  /**
   * Calculate repair deadline from detection date and leak concentration
   * @param {Object} p
   * @param {Date|string} p.detectionDate
   * @param {number} p.concentrationPpmv
   * @param {boolean} p.isCriticalComponent
   * @returns {Object} { deadline, category, daysAllowed, resurveBy }
   */
  repairDeadline({ detectionDate, concentrationPpmv, isCriticalComponent = false }) {
    const detected = new Date(detectionDate);
    let daysAllowed, category;

    if (isCriticalComponent) {
      daysAllowed = 365; // next shutdown, max 1 year
      category = 'critical';
    } else if (concentrationPpmv >= 50000) {
      daysAllowed = 5;
      category = 'large';
    } else if (concentrationPpmv >= 5000) {
      daysAllowed = 14;
      category = 'small';
    } else {
      daysAllowed = null; // below threshold — record only
      category = 'below_threshold';
    }

    const deadline = daysAllowed
      ? new Date(detected.getTime() + daysAllowed * 86400000)
      : null;

    const resurveBy = deadline
      ? new Date(deadline.getTime() + 15 * 86400000)
      : null;

    return {
      category,
      daysAllowed,
      deadline: deadline?.toISOString().split('T')[0] ?? null,
      resurveBy: resurveBy?.toISOString().split('T')[0] ?? null,
    };
  },

  /**
   * Check if a deadline is overdue
   * @param {string} deadlineISO — YYYY-MM-DD
   * @returns {Object} { overdue, daysOverdue, daysRemaining }
   */
  deadlineStatus(deadlineISO) {
    const now = new Date();
    const dl = new Date(deadlineISO);
    const diffMs = dl - now;
    const diffDays = Math.ceil(diffMs / 86400000);
    return {
      overdue: diffDays < 0,
      daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
      daysRemaining: diffDays >= 0 ? diffDays : 0,
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MODULE 9 — CARBON CREDIT REVENUE ESTIMATOR
════════════════════════════════════════════════════════════════ */
const carbonMarket = {
  /**
   * Estimate carbon credit revenue from verified reductions
   * @param {Object} p
   * @param {number} p.verifiedTCO2e — verified emission reductions
   * @param {number} p.priceUSD      — VCM price per tCO2e (default $12.40)
   * @param {number} p.registryFee   — registry fee % (default 0.05 = 5%)
   * @returns {Object} { grossRevenue, netRevenue, creditsValue }
   */
  revenueEstimate({ verifiedTCO2e, priceUSD = 12.40, registryFee = 0.05 }) {
    const grossRevenue = utils.round(verifiedTCO2e * priceUSD, 2);
    const fees = utils.round(grossRevenue * registryFee, 2);
    const netRevenue = utils.round(grossRevenue - fees, 2);
    return {
      grossRevenue,
      fees,
      netRevenue,
      priceUSD,
      creditsForSale: verifiedTCO2e,
    };
  },

  /**
   * Price sensitivity analysis — bear/base/bull scenarios
   * @param {number} verifiedTCO2e
   * @returns {Object} { bear, base, bull }
   */
  priceSensitivity(verifiedTCO2e) {
    return {
      bear: carbonMarket.revenueEstimate({ verifiedTCO2e, priceUSD: 8.00 }),
      base: carbonMarket.revenueEstimate({ verifiedTCO2e, priceUSD: 12.40 }),
      bull: carbonMarket.revenueEstimate({ verifiedTCO2e, priceUSD: 20.00 }),
    };
  },
};

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT NAMESPACE
════════════════════════════════════════════════════════════════ */
const VS = {
  GWP,
  EF,
  EQUIP,
  utils,
  flaring,
  combustion,
  fugitive,
  scope2,
  energyIntensity,
  inventory,
  updt,
  ldar,
  carbonMarket,

  /** Version */
  VERSION: '1.0.0',
  /** Calculation standard */
  STANDARD: 'IPCC 2006 + 2019 Refinement | NUPRC Guide 0024-2022 | GHG Protocol',
};

/* Export for ES module environments */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VS };
}
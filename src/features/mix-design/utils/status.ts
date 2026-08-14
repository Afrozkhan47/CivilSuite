/**
 * Centralized Mix Status & Formatting Helper
 * 
 * Centralizes all compliance, stage, action, and presentation status decisions
 * across Web UI, PDF Export, Print View, and Saved Projects.
 */

import type { MixDesignResult } from '../types';

export type MixComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'INCOMPLETE' | 'INVALID_INPUT';
export type MixStage = 'FINAL' | 'PRELIMINARY_RAW' | 'INCOMPLETE';
export type MixAction = 'NONE' | 'REDESIGN_REQUIRED' | 'RETURN_TO_PARAMETERS';

export interface BlockedStepInfo {
  stepNumber: number;
  title: string;
  reason: string;
}

export interface CentralizedMixStatus {
  status: MixComplianceStatus;
  mixStage: MixStage;
  action: MixAction;
  heroHeader: string;
  heroSubheader: string;
  heroBadge: string;
  pdfHeader: string;
  pdfStatus: string;
  reason?: string;
  firstBlockedStep?: BlockedStepInfo;
  secondaryBlockedSteps?: BlockedStepInfo[];
}

export function findBlockedSteps(result: MixDesignResult): BlockedStepInfo[] {
  const blocked: BlockedStepInfo[] = [];

  if (!result.calculationSteps || result.calculationSteps.length === 0) {
    return [
      {
        stepNumber: 1,
        title: 'Input Parameters',
        reason: 'One or more required design parameters are missing.',
      },
    ];
  }

  for (const step of result.calculationSteps) {
    const resText = step.result || '';
    const isStepBlocked =
      step.isPlaceholder ||
      resText.includes('reference-data-required') ||
      resText.includes('outside verified') ||
      resText.includes('Cannot compute') ||
      resText.includes('not in IS 10262') ||
      resText.includes('unverified');

    if (isStepBlocked) {
      let cleanReason = resText;
      if (step.stepNumber === 2 && resText.includes('16 mm')) {
        cleanReason = 'Aggregate size 16 mm has no configured Table 4 reference value in IS 10262:2019 Clause 6.3.';
      } else if (resText.includes('reference-data-required:')) {
        cleanReason = resText.replace('reference-data-required:', '').trim();
      } else if (resText.includes('Cannot compute:')) {
        cleanReason = 'Upstream required calculation value (water content / W/C ratio) was not available.';
      }

      blocked.push({
        stepNumber: step.stepNumber,
        title: step.title,
        reason: cleanReason,
      });
    }
  }

  return blocked;
}

export function getCentralizedMixStatus(result: MixDesignResult): CentralizedMixStatus {
  const blockedSteps = findBlockedSteps(result);

  // If calculation could not finish due to missing reference data or unexecutable step
  if (result.isPlaceholder || blockedSteps.length > 0) {
    const first = blockedSteps[0] || {
      stepNumber: 2,
      title: 'Water Content',
      reason: 'Required reference data is missing or out of range for the selected parameters.',
    };
    const secondary = blockedSteps.slice(1);

    return {
      status: 'INCOMPLETE',
      mixStage: 'INCOMPLETE',
      action: 'RETURN_TO_PARAMETERS',
      heroHeader: 'CALCULATION INCOMPLETE',
      heroSubheader: 'Reference data required — No final mix proportion has been issued.',
      heroBadge: 'CALCULATION INCOMPLETE',
      pdfHeader: 'CIVILSUITE ENGINEERING CALCULATION EXCEPTION REPORT',
      pdfStatus: `STATUS: CALCULATION INCOMPLETE — Reference Data Required (${first.reason})`,
      reason: first.reason,
      firstBlockedStep: first,
      secondaryBlockedSteps: secondary,
    };
  }

  const isNonCompliant =
    result.cementContentCheck === 'fail' ||
    result.durabilityCheck === 'fail' ||
    result.strengthCheck === 'fail';

  if (isNonCompliant) {
    let reason = 'Mix fails configured IS code compliance limits.';
    if (result.cementContentCheck === 'fail') {
      if (result.cement > 450) {
        reason = `Calculated cement content (${result.cement} kg/m³) exceeds the maximum permitted 450 kg/m³.`;
      } else {
        reason = `Calculated cement content (${result.cement} kg/m³) is below the minimum limit of 300 kg/m³.`;
      }
    } else if (result.durabilityCheck === 'fail') {
      reason = 'Water-cement ratio exceeds IS 456:2000 Table 5 durability limit.';
    }

    return {
      status: 'NON_COMPLIANT',
      mixStage: 'PRELIMINARY_RAW',
      action: 'REDESIGN_REQUIRED',
      heroHeader: 'PRELIMINARY RAW SSD MIX RATIO — CEMENT : FINE AGGREGATE : COARSE AGGREGATE',
      heroSubheader: 'Cement : Fine Aggregate : Coarse Aggregate (SSD / Design Basis)',
      heroBadge: 'PRELIMINARY RAW MIX — REDESIGN REQUIRED',
      pdfHeader: 'PRELIMINARY RAW SSD MIX RATIO — CEMENT : FINE AGGREGATE : COARSE AGGREGATE',
      pdfStatus: `STATUS: NON-COMPLIANT MIX — REDESIGN REQUIRED (${reason})`,
      reason,
    };
  }

  return {
    status: 'COMPLIANT',
    mixStage: 'FINAL',
    action: 'NONE',
    heroHeader: 'FINAL MIX RATIO — SSD/DESIGN BASIS — CEMENT : FINE AGGREGATE : COARSE AGGREGATE',
    heroSubheader: 'Cement : Fine Aggregate : Coarse Aggregate',
    heroBadge: 'FINAL COMPLIANT MIX',
    pdfHeader: 'FINAL MIX PROPORTION — SSD/DESIGN BASIS (Cement : FA : CA)',
    pdfStatus: 'STATUS: COMPLIANT',
  };
}

/**
 * Cleanly formats calculation step results by stripping malformed quotes
 * and preventing duplicate unit suffixes like "kg/m³ kg/m³" or "N/mm² N/mm²".
 */
export function formatStepResult(result: string, unit?: string): string {
  if (!result) return '';
  let cleanResult = result.replace(/[”“]/g, '').trim();

  // Deduplicate adjacent identical unit tokens
  cleanResult = cleanResult.replace(/(kg\/m³|N\/mm²|m³\/m³|ratio)(\s+\1)+/gi, '$1');

  if (!unit || unit === 'dimensionless' || unit === 'ratio' || unit.includes('ratio')) {
    return cleanResult;
  }
  if (
    cleanResult.includes(unit) ||
    cleanResult.includes('kg/m³') ||
    cleanResult.includes('N/mm²') ||
    cleanResult.includes('m³/m³')
  ) {
    return cleanResult;
  }
  const formatted = `${cleanResult} ${unit}`;
  return formatted.replace(/(kg\/m³|N\/mm²|m³\/m³|ratio)(\s+\1)+/gi, '$1');
}

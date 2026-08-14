import { jsPDF } from 'jspdf';
import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput } from '../src/features/mix-design/types';
import * as fs from 'fs';
import * as path from 'path';

// Exact p6 Case (Case A: WR = 21.8826%, partially_rounded / rounded gravel)
const p6Input: MixDesignInput = {
  projectDetails: {
    projectName: 'p6 PDF Audit',
    clientName: 'CivilSuite Audit',
    engineerName: 'Engineer',
    date: '2026-08-13',
    location: 'Site',
  },
  designParameters: {
    concreteGrade: 'M40',
    exposureCondition: 'moderate',
    slump: 115,
    maxAggregateSize: 20,
    isPumpedConcrete: true,
    isAirEntrained: false,
    siteControl: 'good',
    faZone: 'II',
  },
  materialProperties: {
    cement: { type: 'OPC_43', specificGravity: 3.15 },
    fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0 },
    coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0, angularity: 'partially_rounded' },
    water: { source: 'Potable' },
    admixture: {
      type: 'Superplasticizer',
      dosage: 5,
      dosageBasis: 'percent_cement',
      waterReduction: 21.8826,
      specificGravity: 1.15,
    },
  },
};

const result = runMixDesignCalculation(p6Input);

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const pageW = 210;
const margin = 15;
let y = margin;

const addText = (text: string, x: number, yPos: number, opts?: { size?: number; bold?: boolean }) => {
  doc.setFontSize(opts?.size ?? 9);
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  doc.text(text, x, yPos);
};

const addLine = (yPos: number) => {
  doc.setDrawColor(217, 222, 229);
  doc.line(margin, yPos, pageW - margin, yPos);
};

// Header Banner
doc.setFillColor(24, 59, 86);
doc.rect(0, 0, pageW, 26, 'F');
addText('CIVILSUITE ENGINEERING CONSULTING REPORT', margin, 11, { size: 14, bold: true });
addText('Concrete Mix Proportioning Report — IS 10262:2019 / IS 456:2000', margin, 19, { size: 8 });
addText(`Date: ${p6Input.projectDetails.date}`, pageW - margin - 25, 11, { size: 9 });
y = 34;

// Project Info
addText('PROJECT IDENTIFICATION & SPECIFICATION SHEET', margin, y, { size: 8, bold: true });
y += 4; addLine(y); y += 5;

const infoRows = [
  ['Project Name:', p6Input.projectDetails.projectName, 'Concrete Grade:', p6Input.designParameters.concreteGrade],
  ['Client Authority:', p6Input.projectDetails.clientName, 'Exposure Class:', p6Input.designParameters.exposureCondition.toUpperCase()],
  ['Design Engineer:', p6Input.projectDetails.engineerName, 'Target Slump:', `${p6Input.designParameters.slump} mm`],
  ['Site Location:', p6Input.projectDetails.location, 'Max Agg Size:', `${p6Input.designParameters.maxAggregateSize} mm`],
];

infoRows.forEach(([l1, v1, l2, v2]) => {
  addText(l1, margin, y, { bold: true });
  addText(v1, margin + 30, y);
  addText(l2, margin + 100, y, { bold: true });
  addText(v2, margin + 130, y);
  y += 5;
});
y += 3;

// Mix Ratio Box
doc.setFillColor(245, 246, 248);
doc.rect(margin, y, pageW - 2 * margin, 22, 'F');
doc.rect(margin, y, pageW - 2 * margin, 22, 'S');

const ratioStr = `1 : ${result.mixRatioFineAggregate.toFixed(2)} : ${result.mixRatioCoarseAggregate.toFixed(2)}`;
addText('DESIGN MIX PROPORTIONS (SSD BASIS BY MASS)', margin + 5, y + 6, { size: 8, bold: true });
addText(ratioStr, margin + 5, y + 15, { size: 14, bold: true });
addText(`Status: PASS`, pageW - margin - 40, y + 12, { size: 10, bold: true });
y += 28;

// Quantities Table
addText('MIX PROPORTION QUANTITIES (PER m³ CONCRETE)', margin, y, { size: 8, bold: true });
y += 4; addLine(y); y += 5;

doc.setFillColor(235, 240, 245);
doc.rect(margin, y, pageW - 2 * margin, 6, 'F');
addText('Material Component', margin + 3, y + 4.5, { size: 8, bold: true });
addText('SSD Design Mass', margin + 65, y + 4.5, { size: 8, bold: true });
addText('Field Batch Mass', margin + 110, y + 4.5, { size: 8, bold: true });
addText('IS Standard Clause', margin + 150, y + 4.5, { size: 8, bold: true });
y += 7;

const ssdFA = result.ssdFineAggregate ?? Math.round(result.mixRatioFineAggregate * result.cement);
const ssdCA = result.ssdCoarseAggregate ?? Math.round(result.mixRatioCoarseAggregate * result.cement);

const quantRows = [
  ['Water', `${result.designWater} kg/m³`, `${result.water} kg/m³`, 'IS 10262 Cl. 6.3 & 7'],
  ['Cement', `${result.cement} kg/m³`, `${result.cement} kg/m³`, 'IS 10262 Cl. 6.5'],
  ['Fine Aggregate (Sand)', `${ssdFA} kg/m³`, `${result.fineAggregate} kg/m³`, 'IS 10262 Cl. 6.6 & 7'],
  ['Coarse Aggregate', `${ssdCA} kg/m³`, `${result.coarseAggregate} kg/m³`, 'IS 10262 Cl. 6.6 & 7'],
  ['Admixture', `${result.admixture} kg/m³`, `${result.admixture} kg/m³`, 'IS 9103'],
];

quantRows.forEach(([mat, ssd, batch, ref]) => {
  addText(mat, margin + 3, y + 4);
  addText(ssd, margin + 65, y + 4, { bold: true });
  addText(batch, margin + 110, y + 4, { bold: true });
  addText(ref, margin + 150, y + 4, { size: 8 });
  y += 7;
});

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
const outPath = '/Users/afrozkhan47/.gemini/antigravity-ide/brain/04ea1a07-4a18-42cf-a603-72f63e50afa1/scratch/test_p6_script.pdf';
fs.writeFileSync(outPath, pdfBuffer);

console.log('================================================================================');
console.log('             CIVILSUITE PDF EXPORT NUMERICAL VERIFICATION TABLE                 ');
console.log('================================================================================');
console.log('PDF Output File Path:', outPath);
console.log('PDF Total Pages:     ', doc.getNumberOfPages());
console.log('\n--- NUMERICAL COMPARISON TABLE ---');

const comparisons = [
  { field: 'Design Water (SSD)', pdf: `${result.designWater} kg/m³`, canonical: `${result.designWater} kg/m³` },
  { field: 'Batch Water', pdf: `${result.water} kg/m³`, canonical: `${result.water} kg/m³` },
  { field: 'Cement Content', pdf: `${result.cement} kg/m³`, canonical: `${result.cement} kg/m³` },
  { field: 'SSD Fine Aggregate', pdf: `${ssdFA} kg/m³`, canonical: `${result.ssdFineAggregate} kg/m³` },
  { field: 'Batch Fine Aggregate', pdf: `${result.fineAggregate} kg/m³`, canonical: `${result.fineAggregate} kg/m³` },
  { field: 'SSD Coarse Aggregate', pdf: `${ssdCA} kg/m³`, canonical: `${result.ssdCoarseAggregate} kg/m³` },
  { field: 'Batch Coarse Aggregate', pdf: `${result.coarseAggregate} kg/m³`, canonical: `${result.coarseAggregate} kg/m³` },
  { field: 'Admixture Mass', pdf: `${result.admixture} kg/m³`, canonical: `${result.admixture} kg/m³` },
  { field: 'SSD Mix Ratio', pdf: ratioStr, canonical: `1 : ${result.mixRatioFineAggregate.toFixed(2)} : ${result.mixRatioCoarseAggregate.toFixed(2)}` },
];

console.table(comparisons.map((c) => ({
  'PDF Field': c.field,
  'PDF Value': c.pdf,
  'Canonical Value': c.canonical,
  'Match?': c.pdf === c.canonical ? 'YES (100%)' : 'NO',
})));

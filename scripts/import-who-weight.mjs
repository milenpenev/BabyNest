import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const projectRoot = process.cwd();

const DAYS_PER_MONTH = 30.4375;

const sources = [
  {
    inputPath: path.join(
      projectRoot,
      "scripts/who-data/wfa-boys.xlsx",
    ),
    outputPath: path.join(
      projectRoot,
      "src/features/growth/who/data/weightForAgeBoys.ts",
    ),
    exportName: "weightForAgeBoys",
    description:
      "Official WHO weight-for-age LMS data for boys, birth to 5 years.",
  },
  {
    inputPath: path.join(
      projectRoot,
      "scripts/who-data/wfa-girls.xlsx",
    ),
    outputPath: path.join(
      projectRoot,
      "src/features/growth/who/data/weightForAgeGirls.ts",
    ),
    exportName: "weightForAgeGirls",
    description:
      "Official WHO weight-for-age LMS data for girls, birth to 5 years.",
  },
];

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findHeaderIndex(row, expectedHeader) {
  const normalizedExpected = normalizeHeader(expectedHeader);

  return row.findIndex(
    (cell) =>
      normalizeHeader(cell) === normalizedExpected,
  );
}

function findLmsTable(workbook, sourcePath) {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });

    for (
      let rowIndex = 0;
      rowIndex < rows.length;
      rowIndex += 1
    ) {
      const row = rows[rowIndex];

      if (!Array.isArray(row)) {
        continue;
      }

      const monthIndex = findHeaderIndex(row, "Month");
      const lIndex = findHeaderIndex(row, "L");
      const mIndex = findHeaderIndex(row, "M");
      const sIndex = findHeaderIndex(row, "S");

      if (
        monthIndex === -1 ||
        lIndex === -1 ||
        mIndex === -1 ||
        sIndex === -1
      ) {
        continue;
      }

      return {
        sheetName,
        rows,
        headerRowIndex: rowIndex,
        monthIndex,
        lIndex,
        mIndex,
        sIndex,
      };
    }
  }

  throw new Error(
    `Could not find Month/L/M/S columns in ${sourcePath}`,
  );
}

function readWhoRows(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `WHO source file does not exist: ${sourcePath}`,
    );
  }

  const workbook = XLSX.readFile(sourcePath);

  const {
    sheetName,
    rows,
    headerRowIndex,
    monthIndex,
    lIndex,
    mIndex,
    sIndex,
  } = findLmsTable(workbook, sourcePath);

  const result = [];

  for (
    let rowIndex = headerRowIndex + 1;
    rowIndex < rows.length;
    rowIndex += 1
  ) {
    const row = rows[rowIndex];

    if (!Array.isArray(row)) {
      continue;
    }

    const month = Number(row[monthIndex]);
    const l = Number(row[lIndex]);
    const m = Number(row[mIndex]);
    const s = Number(row[sIndex]);

    if (
      !Number.isFinite(month) ||
      !Number.isFinite(l) ||
      !Number.isFinite(m) ||
      !Number.isFinite(s)
    ) {
      continue;
    }

    if (
      month < 0 ||
      month > 60 ||
      m <= 0 ||
      s <= 0
    ) {
      continue;
    }

    result.push({
      ageDays: Number(
        (month * DAYS_PER_MONTH).toFixed(4),
      ),
      l,
      m,
      s,
    });
  }

  result.sort(
    (first, second) =>
      first.ageDays - second.ageDays,
  );

  const uniqueRows = result.filter(
    (row, index, allRows) =>
      index === 0 ||
      row.ageDays !== allRows[index - 1].ageDays,
  );

  if (uniqueRows.length < 61) {
    throw new Error(
      `Expected at least 61 WHO rows in ${sourcePath}, but found ${uniqueRows.length}. Sheet: ${sheetName}`,
    );
  }

  return {
    rows: uniqueRows,
    sheetName,
  };
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error(
      `Cannot serialize non-finite value: ${value}`,
    );
  }

  return String(value);
}

function createTypeScriptFile({
  rows,
  exportName,
  description,
  sourceFilename,
}) {
  const serializedRows = rows
    .map(
      (row) =>
        `  { ageDays: ${formatNumber(
          row.ageDays,
        )}, l: ${formatNumber(
          row.l,
        )}, m: ${formatNumber(
          row.m,
        )}, s: ${formatNumber(row.s)} },`,
    )
    .join("\n");

  return `import type { WhoLmsRow } from "../types/whoGrowth.types";

/**
 * ${description}
 *
 * Source: World Health Organization Child Growth Standards.
 * Original workbook: ${sourceFilename}
 *
 * Age values are based on WHO completed-month LMS rows.
 * Each completed month is represented as 30.4375 days so the
 * percentile engine can interpolate using the child's exact age.
 *
 * This file is generated automatically.
 * Do not edit the LMS values manually.
 */
export const ${exportName}: WhoLmsRow[] = [
${serializedRows}
];
`;
}

function generateDataset(source) {
  const { rows, sheetName } = readWhoRows(
    source.inputPath,
  );

  const output = createTypeScriptFile({
    rows,
    exportName: source.exportName,
    description: source.description,
    sourceFilename: path.basename(source.inputPath),
  });

  fs.mkdirSync(
    path.dirname(source.outputPath),
    {
      recursive: true,
    },
  );

  fs.writeFileSync(
    source.outputPath,
    output,
    "utf8",
  );

  console.log(
    `Generated ${source.exportName}: ${rows.length} rows from sheet "${sheetName}"`,
  );

  console.log(
    `Output: ${path.relative(
      projectRoot,
      source.outputPath,
    )}`,
  );
}

try {
  for (const source of sources) {
    generateDataset(source);
  }

  console.log(
    "WHO weight-for-age datasets generated successfully.",
  );
} catch (error) {
  console.error(
    "Failed to generate WHO datasets.",
  );

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
}

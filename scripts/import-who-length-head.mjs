import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const projectRoot = process.cwd();

const sources = [
  {
    input: "scripts/who-data/lhfa-boys.xlsx",
    output:
      "src/features/growth/who/data/lengthForAgeBoys.ts",
    exportName: "lengthForAgeBoys",
    description:
      "Official WHO length/height-for-age LMS data for boys.",
  },
  {
    input: "scripts/who-data/lhfa-girls.xlsx",
    output:
      "src/features/growth/who/data/lengthForAgeGirls.ts",
    exportName: "lengthForAgeGirls",
    description:
      "Official WHO length/height-for-age LMS data for girls.",
  },
  {
    input: "scripts/who-data/hcfa-boys.xlsx",
    output:
      "src/features/growth/who/data/headCircumferenceForAgeBoys.ts",
    exportName: "headCircumferenceForAgeBoys",
    description:
      "Official WHO head-circumference-for-age LMS data for boys.",
  },
  {
    input: "scripts/who-data/hcfa-girls.xlsx",
    output:
      "src/features/growth/who/data/headCircumferenceForAgeGirls.ts",
    exportName: "headCircumferenceForAgeGirls",
    description:
      "Official WHO head-circumference-for-age LMS data for girls.",
  },
];

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findColumn(row, names) {
  const normalizedNames = names.map(normalize);

  return row.findIndex((cell) =>
    normalizedNames.includes(normalize(cell)),
  );
}

function findLmsTable(workbook, inputPath) {
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

      const ageIndex = findColumn(row, [
        "Day",
        "Days",
        "Age",
        "Age (days)",
        "Age in days",
      ]);

      const lIndex = findColumn(row, ["L"]);
      const mIndex = findColumn(row, ["M"]);
      const sIndex = findColumn(row, ["S"]);

      if (
        ageIndex !== -1 &&
        lIndex !== -1 &&
        mIndex !== -1 &&
        sIndex !== -1
      ) {
        return {
          sheetName,
          rows,
          headerRowIndex: rowIndex,
          ageIndex,
          lIndex,
          mIndex,
          sIndex,
        };
      }
    }
  }

  throw new Error(
    `Could not find Day/Age/L/M/S columns in ${inputPath}`,
  );
}

function readDataset(inputPath) {
  const absolutePath = path.join(
    projectRoot,
    inputPath,
  );

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Source file does not exist: ${inputPath}`,
    );
  }

  const workbook = XLSX.readFile(absolutePath);

  const {
    sheetName,
    rows,
    headerRowIndex,
    ageIndex,
    lIndex,
    mIndex,
    sIndex,
  } = findLmsTable(workbook, inputPath);

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

    const ageDays = Number(row[ageIndex]);
    const l = Number(row[lIndex]);
    const m = Number(row[mIndex]);
    const s = Number(row[sIndex]);

    if (
      !Number.isFinite(ageDays) ||
      !Number.isFinite(l) ||
      !Number.isFinite(m) ||
      !Number.isFinite(s)
    ) {
      continue;
    }

    if (
      ageDays < 0 ||
      ageDays > 1856 ||
      m <= 0 ||
      s <= 0
    ) {
      continue;
    }

    result.push({
      ageDays,
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
      row.ageDays !==
        allRows[index - 1].ageDays,
  );

  if (uniqueRows.length < 100) {
    throw new Error(
      `Too few LMS rows found in ${inputPath}: ${uniqueRows.length}. Sheet: ${sheetName}`,
    );
  }

  return {
    rows: uniqueRows,
    sheetName,
  };
}

function serializeDataset(source, rows) {
  const values = rows
    .map(
      (row) =>
        `  { ageDays: ${row.ageDays}, l: ${row.l}, m: ${row.m}, s: ${row.s} },`,
    )
    .join("\n");

  return `import type { WhoLmsRow } from "../types/whoGrowth.types";

/**
 * ${source.description}
 *
 * Source: World Health Organization Child Growth Standards.
 * Original workbook: ${path.basename(source.input)}
 *
 * Generated automatically. Do not edit manually.
 */
export const ${source.exportName}: WhoLmsRow[] = [
${values}
];
`;
}

for (const source of sources) {
  const { rows, sheetName } = readDataset(
    source.input,
  );

  const outputPath = path.join(
    projectRoot,
    source.output,
  );

  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true,
  });

  fs.writeFileSync(
    outputPath,
    serializeDataset(source, rows),
    "utf8",
  );

  console.log(
    `Generated ${source.exportName}: ${rows.length} rows from "${sheetName}"`,
  );
}

console.log(
  "WHO length and head circumference datasets generated successfully.",
);

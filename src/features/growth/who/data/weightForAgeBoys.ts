import type { WhoLmsRow } from "../types/whoGrowth.types";

/**
 * Official WHO weight-for-age LMS data for boys, birth to 5 years.
 *
 * Source: World Health Organization Child Growth Standards.
 * Original workbook: wfa-boys.xlsx
 *
 * Age values are based on WHO completed-month LMS rows.
 * Each completed month is represented as 30.4375 days so the
 * percentile engine can interpolate using the child's exact age.
 *
 * This file is generated automatically.
 * Do not edit the LMS values manually.
 */
export const weightForAgeBoys: WhoLmsRow[] = [
  { ageDays: 0, l: 0.3487, m: 3.3464, s: 0.14602 },
  { ageDays: 30.4375, l: 0.2297, m: 4.4709, s: 0.13395 },
  { ageDays: 60.875, l: 0.197, m: 5.5675, s: 0.12385 },
  { ageDays: 91.3125, l: 0.1738, m: 6.3762, s: 0.11727 },
  { ageDays: 121.75, l: 0.1553, m: 7.0023, s: 0.11316 },
  { ageDays: 152.1875, l: 0.1395, m: 7.5105, s: 0.1108 },
  { ageDays: 182.625, l: 0.1257, m: 7.934, s: 0.10958 },
  { ageDays: 213.0625, l: 0.1134, m: 8.297, s: 0.10902 },
  { ageDays: 243.5, l: 0.1021, m: 8.6151, s: 0.10882 },
  { ageDays: 273.9375, l: 0.0917, m: 8.9014, s: 0.10881 },
  { ageDays: 304.375, l: 0.082, m: 9.1649, s: 0.10891 },
  { ageDays: 334.8125, l: 0.073, m: 9.4122, s: 0.10906 },
  { ageDays: 365.25, l: 0.0644, m: 9.6479, s: 0.10925 },
  { ageDays: 395.6875, l: 0.0563, m: 9.8749, s: 0.10949 },
  { ageDays: 426.125, l: 0.0487, m: 10.0953, s: 0.10976 },
  { ageDays: 456.5625, l: 0.0413, m: 10.3108, s: 0.11007 },
  { ageDays: 487, l: 0.0343, m: 10.5228, s: 0.11041 },
  { ageDays: 517.4375, l: 0.0275, m: 10.7319, s: 0.11079 },
  { ageDays: 547.875, l: 0.0211, m: 10.9385, s: 0.11119 },
  { ageDays: 578.3125, l: 0.0148, m: 11.143, s: 0.11164 },
  { ageDays: 608.75, l: 0.0087, m: 11.3462, s: 0.11211 },
  { ageDays: 639.1875, l: 0.0029, m: 11.5486, s: 0.11261 },
  { ageDays: 669.625, l: -0.0028, m: 11.7504, s: 0.11314 },
  { ageDays: 700.0625, l: -0.0083, m: 11.9514, s: 0.11369 },
  { ageDays: 730.5, l: -0.0137, m: 12.1515, s: 0.11426 },
  { ageDays: 760.9375, l: -0.0189, m: 12.3502, s: 0.11485 },
  { ageDays: 791.375, l: -0.024, m: 12.5466, s: 0.11544 },
  { ageDays: 821.8125, l: -0.0289, m: 12.7401, s: 0.11604 },
  { ageDays: 852.25, l: -0.0337, m: 12.9303, s: 0.11664 },
  { ageDays: 882.6875, l: -0.0385, m: 13.1169, s: 0.11723 },
  { ageDays: 913.125, l: -0.0431, m: 13.3, s: 0.11781 },
  { ageDays: 943.5625, l: -0.0476, m: 13.4798, s: 0.11839 },
  { ageDays: 974, l: -0.052, m: 13.6567, s: 0.11896 },
  { ageDays: 1004.4375, l: -0.0564, m: 13.8309, s: 0.11953 },
  { ageDays: 1034.875, l: -0.0606, m: 14.0031, s: 0.12008 },
  { ageDays: 1065.3125, l: -0.0648, m: 14.1736, s: 0.12062 },
  { ageDays: 1095.75, l: -0.0689, m: 14.3429, s: 0.12116 },
  { ageDays: 1126.1875, l: -0.0729, m: 14.5113, s: 0.12168 },
  { ageDays: 1156.625, l: -0.0769, m: 14.6791, s: 0.1222 },
  { ageDays: 1187.0625, l: -0.0808, m: 14.8466, s: 0.12271 },
  { ageDays: 1217.5, l: -0.0846, m: 15.014, s: 0.12322 },
  { ageDays: 1247.9375, l: -0.0883, m: 15.1813, s: 0.12373 },
  { ageDays: 1278.375, l: -0.092, m: 15.3486, s: 0.12425 },
  { ageDays: 1308.8125, l: -0.0957, m: 15.5158, s: 0.12478 },
  { ageDays: 1339.25, l: -0.0993, m: 15.6828, s: 0.12531 },
  { ageDays: 1369.6875, l: -0.1028, m: 15.8497, s: 0.12586 },
  { ageDays: 1400.125, l: -0.1063, m: 16.0163, s: 0.12643 },
  { ageDays: 1430.5625, l: -0.1097, m: 16.1827, s: 0.127 },
  { ageDays: 1461, l: -0.1131, m: 16.3489, s: 0.12759 },
  { ageDays: 1491.4375, l: -0.1165, m: 16.515, s: 0.12819 },
  { ageDays: 1521.875, l: -0.1198, m: 16.6811, s: 0.1288 },
  { ageDays: 1552.3125, l: -0.123, m: 16.8471, s: 0.12943 },
  { ageDays: 1582.75, l: -0.1262, m: 17.0132, s: 0.13005 },
  { ageDays: 1613.1875, l: -0.1294, m: 17.1792, s: 0.13069 },
  { ageDays: 1643.625, l: -0.1325, m: 17.3452, s: 0.13133 },
  { ageDays: 1674.0625, l: -0.1356, m: 17.5111, s: 0.13197 },
  { ageDays: 1704.5, l: -0.1387, m: 17.6768, s: 0.13261 },
  { ageDays: 1734.9375, l: -0.1417, m: 17.8422, s: 0.13325 },
  { ageDays: 1765.375, l: -0.1447, m: 18.0073, s: 0.13389 },
  { ageDays: 1795.8125, l: -0.1477, m: 18.1722, s: 0.13453 },
  { ageDays: 1826.25, l: -0.1506, m: 18.3366, s: 0.13517 },
];

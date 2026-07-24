import type { WhoLmsRow } from "../types/whoGrowth.types";

/**
 * Official WHO weight-for-age LMS data for girls, birth to 5 years.
 *
 * Source: World Health Organization Child Growth Standards.
 * Original workbook: wfa-girls.xlsx
 *
 * Age values are based on WHO completed-month LMS rows.
 * Each completed month is represented as 30.4375 days so the
 * percentile engine can interpolate using the child's exact age.
 *
 * This file is generated automatically.
 * Do not edit the LMS values manually.
 */
export const weightForAgeGirls: WhoLmsRow[] = [
  { ageDays: 0, l: 0.3809, m: 3.2322, s: 0.14171 },
  { ageDays: 30.4375, l: 0.1714, m: 4.1873, s: 0.13724 },
  { ageDays: 60.875, l: 0.0962, m: 5.1282, s: 0.13 },
  { ageDays: 91.3125, l: 0.0402, m: 5.8458, s: 0.12619 },
  { ageDays: 121.75, l: -0.005, m: 6.4237, s: 0.12402 },
  { ageDays: 152.1875, l: -0.043, m: 6.8985, s: 0.12274 },
  { ageDays: 182.625, l: -0.0756, m: 7.297, s: 0.12204 },
  { ageDays: 213.0625, l: -0.1039, m: 7.6422, s: 0.12178 },
  { ageDays: 243.5, l: -0.1288, m: 7.9487, s: 0.12181 },
  { ageDays: 273.9375, l: -0.1507, m: 8.2254, s: 0.12199 },
  { ageDays: 304.375, l: -0.17, m: 8.48, s: 0.12223 },
  { ageDays: 334.8125, l: -0.1872, m: 8.7192, s: 0.12247 },
  { ageDays: 365.25, l: -0.2024, m: 8.9481, s: 0.12268 },
  { ageDays: 395.6875, l: -0.2158, m: 9.1699, s: 0.12283 },
  { ageDays: 426.125, l: -0.2278, m: 9.387, s: 0.12294 },
  { ageDays: 456.5625, l: -0.2384, m: 9.6008, s: 0.12299 },
  { ageDays: 487, l: -0.2478, m: 9.8124, s: 0.12303 },
  { ageDays: 517.4375, l: -0.2562, m: 10.0226, s: 0.12306 },
  { ageDays: 547.875, l: -0.2637, m: 10.2315, s: 0.12309 },
  { ageDays: 578.3125, l: -0.2703, m: 10.4393, s: 0.12315 },
  { ageDays: 608.75, l: -0.2762, m: 10.6464, s: 0.12323 },
  { ageDays: 639.1875, l: -0.2815, m: 10.8534, s: 0.12335 },
  { ageDays: 669.625, l: -0.2862, m: 11.0608, s: 0.1235 },
  { ageDays: 700.0625, l: -0.2903, m: 11.2688, s: 0.12369 },
  { ageDays: 730.5, l: -0.2941, m: 11.4775, s: 0.1239 },
  { ageDays: 760.9375, l: -0.2975, m: 11.6864, s: 0.12414 },
  { ageDays: 791.375, l: -0.3005, m: 11.8947, s: 0.12441 },
  { ageDays: 821.8125, l: -0.3032, m: 12.1015, s: 0.12472 },
  { ageDays: 852.25, l: -0.3057, m: 12.3059, s: 0.12506 },
  { ageDays: 882.6875, l: -0.308, m: 12.5073, s: 0.12545 },
  { ageDays: 913.125, l: -0.3101, m: 12.7055, s: 0.12587 },
  { ageDays: 943.5625, l: -0.312, m: 12.9006, s: 0.12633 },
  { ageDays: 974, l: -0.3138, m: 13.093, s: 0.12683 },
  { ageDays: 1004.4375, l: -0.3155, m: 13.2837, s: 0.12737 },
  { ageDays: 1034.875, l: -0.3171, m: 13.4731, s: 0.12794 },
  { ageDays: 1065.3125, l: -0.3186, m: 13.6618, s: 0.12855 },
  { ageDays: 1095.75, l: -0.3201, m: 13.8503, s: 0.12919 },
  { ageDays: 1126.1875, l: -0.3216, m: 14.0385, s: 0.12988 },
  { ageDays: 1156.625, l: -0.323, m: 14.2265, s: 0.13059 },
  { ageDays: 1187.0625, l: -0.3243, m: 14.414, s: 0.13135 },
  { ageDays: 1217.5, l: -0.3257, m: 14.601, s: 0.13213 },
  { ageDays: 1247.9375, l: -0.327, m: 14.7873, s: 0.13293 },
  { ageDays: 1278.375, l: -0.3283, m: 14.9727, s: 0.13376 },
  { ageDays: 1308.8125, l: -0.3296, m: 15.1573, s: 0.1346 },
  { ageDays: 1339.25, l: -0.3309, m: 15.341, s: 0.13545 },
  { ageDays: 1369.6875, l: -0.3322, m: 15.524, s: 0.1363 },
  { ageDays: 1400.125, l: -0.3335, m: 15.7064, s: 0.13716 },
  { ageDays: 1430.5625, l: -0.3348, m: 15.8882, s: 0.138 },
  { ageDays: 1461, l: -0.3361, m: 16.0697, s: 0.13884 },
  { ageDays: 1491.4375, l: -0.3374, m: 16.2511, s: 0.13968 },
  { ageDays: 1521.875, l: -0.3387, m: 16.4322, s: 0.14051 },
  { ageDays: 1552.3125, l: -0.34, m: 16.6133, s: 0.14132 },
  { ageDays: 1582.75, l: -0.3414, m: 16.7942, s: 0.14213 },
  { ageDays: 1613.1875, l: -0.3427, m: 16.9748, s: 0.14293 },
  { ageDays: 1643.625, l: -0.344, m: 17.1551, s: 0.14371 },
  { ageDays: 1674.0625, l: -0.3453, m: 17.3347, s: 0.14448 },
  { ageDays: 1704.5, l: -0.3466, m: 17.5136, s: 0.14525 },
  { ageDays: 1734.9375, l: -0.3479, m: 17.6916, s: 0.146 },
  { ageDays: 1765.375, l: -0.3492, m: 17.8686, s: 0.14675 },
  { ageDays: 1795.8125, l: -0.3505, m: 18.0445, s: 0.14748 },
  { ageDays: 1826.25, l: -0.3518, m: 18.2193, s: 0.14821 },
];

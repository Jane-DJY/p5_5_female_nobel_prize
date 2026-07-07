(function () {
  const START_YEAR = 1901;
  const END_YEAR = 2025;
  const TOTAL_INDIVIDUALS = 990;
  const FEMALE_INDIVIDUALS = 67;
  const MALE_INDIVIDUALS = 923;

  // First-version aggregate-constrained data. It keeps the requested totals exact
  // and spreads total laureates across 1901-2025 for animation pacing.
  const LOWER_TOTAL_YEARS = [1914, 1916, 1918, 1924, 1932, 1940, 1941, 1942, 1943, 1944];

  const FEMALE_LAUREATE_YEARS = [
    1903, 1905, 1909, 1911, 1926, 1928, 1931, 1935, 1938, 1945, 1946, 1947,
    1963, 1964, 1966, 1976, 1977, 1979, 1982, 1983, 1986, 1988, 1991, 1992,
    1993, 1995, 1996, 1997, 2003, 2004, 2004, 2007, 2008, 2009, 2009, 2011,
    2011, 2011, 2013, 2014, 2014, 2015, 2015, 2018, 2018, 2018, 2018, 2019,
    2019, 2020, 2020, 2020, 2020, 2021, 2022, 2022, 2023, 2023, 2023, 2025,
    2025, 2025, 2025, 2025, 2025, 2025, 2025
  ];

  function countOccurrences(values) {
    return values.reduce((acc, year) => {
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});
  }

  const femaleByYear = countOccurrences(FEMALE_LAUREATE_YEARS);
  const rows = [];

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    const total = LOWER_TOTAL_YEARS.includes(year) ? 7 : 8;
    const female = femaleByYear[year] || 0;
    rows.push({
      year,
      total,
      female,
      male: total - female
    });
  }

  const check = rows.reduce(
    (acc, row) => {
      acc.total += row.total;
      acc.female += row.female;
      acc.male += row.male;
      return acc;
    },
    { total: 0, female: 0, male: 0 }
  );

  if (
    check.total !== TOTAL_INDIVIDUALS ||
    check.female !== FEMALE_INDIVIDUALS ||
    check.male !== MALE_INDIVIDUALS
  ) {
    throw new Error(
      `Nobel data totals mismatch: total=${check.total}, female=${check.female}, male=${check.male}`
    );
  }

  window.NOBEL_TOTALS = {
    startYear: START_YEAR,
    endYear: END_YEAR,
    totalIndividuals: TOTAL_INDIVIDUALS,
    femaleIndividuals: FEMALE_INDIVIDUALS,
    maleIndividuals: MALE_INDIVIDUALS,
    organizations: 28,
    sourceMode: "aggregate-constrained first version",
    sources: [
      "https://www.nobelprize.org/prizes/lists/nobel-prize-awarded-women/",
      "https://www.nobelprize.org/prizes/lists/all-nobel-prizes/"
    ]
  };

  window.NOBEL_BY_YEAR = rows;
})();

(function () {
  const START_YEAR = 1901;
  const END_YEAR = 2025;
  const TOTAL_INDIVIDUALS = 990;
  const FEMALE_INDIVIDUALS = 67;
  const MALE_INDIVIDUALS = 923;

  // Counts are unique individual laureates by first Nobel award year.
  // Source checked from the official Nobel Prize API on 2026-07-09.
  // Row format: [year, first-time individual laureates, first-time female individual laureates]
  const FIRST_AWARD_YEAR_ROWS = [
    [1901, 6, 0],
    [1902, 7, 0],
    [1903, 7, 1],
    [1904, 5, 0],
    [1905, 5, 1],
    [1906, 6, 0],
    [1907, 6, 0],
    [1908, 7, 0],
    [1909, 7, 1],
    [1910, 4, 0],
    [1911, 5, 0],
    [1912, 6, 0],
    [1913, 5, 0],
    [1914, 3, 0],
    [1915, 4, 0],
    [1916, 1, 0],
    [1917, 3, 0],
    [1918, 2, 0],
    [1919, 4, 0],
    [1920, 5, 0],
    [1921, 5, 0],
    [1922, 6, 0],
    [1923, 5, 0],
    [1924, 3, 0],
    [1925, 6, 0],
    [1926, 6, 1],
    [1927, 7, 0],
    [1928, 4, 1],
    [1929, 7, 0],
    [1930, 5, 0],
    [1931, 6, 1],
    [1932, 5, 0],
    [1933, 5, 0],
    [1934, 6, 0],
    [1935, 5, 1],
    [1936, 7, 0],
    [1937, 7, 0],
    [1938, 4, 1],
    [1939, 5, 0],
    [1940, 0, 0],
    [1941, 0, 0],
    [1942, 0, 0],
    [1943, 4, 0],
    [1944, 5, 0],
    [1945, 7, 1],
    [1946, 8, 1],
    [1947, 6, 1],
    [1948, 4, 0],
    [1949, 6, 0],
    [1950, 8, 0],
    [1951, 7, 0],
    [1952, 7, 0],
    [1953, 6, 0],
    [1954, 7, 0],
    [1955, 5, 0],
    [1956, 9, 0],
    [1957, 6, 0],
    [1958, 9, 0],
    [1959, 7, 0],
    [1960, 6, 0],
    [1961, 6, 0],
    [1962, 7, 0],
    [1963, 9, 1],
    [1964, 8, 1],
    [1965, 8, 0],
    [1966, 6, 1],
    [1967, 8, 0],
    [1968, 7, 0],
    [1969, 9, 0],
    [1970, 9, 0],
    [1971, 6, 0],
    [1972, 10, 0],
    [1973, 12, 0],
    [1974, 12, 0],
    [1975, 12, 0],
    [1976, 9, 2],
    [1977, 10, 1],
    [1978, 11, 0],
    [1979, 11, 1],
    [1980, 10, 0],
    [1981, 10, 0],
    [1982, 9, 1],
    [1983, 7, 1],
    [1984, 9, 0],
    [1985, 7, 0],
    [1986, 11, 1],
    [1987, 9, 0],
    [1988, 11, 1],
    [1989, 10, 0],
    [1990, 11, 0],
    [1991, 7, 2],
    [1992, 7, 1],
    [1993, 11, 1],
    [1994, 12, 0],
    [1995, 11, 1],
    [1996, 13, 1],
    [1997, 11, 1],
    [1998, 12, 0],
    [1999, 6, 0],
    [2000, 13, 0],
    [2001, 14, 0],
    [2002, 13, 0],
    [2003, 11, 1],
    [2004, 12, 3],
    [2005, 12, 0],
    [2006, 8, 0],
    [2007, 11, 1],
    [2008, 12, 1],
    [2009, 13, 5],
    [2010, 11, 0],
    [2011, 13, 3],
    [2012, 9, 0],
    [2013, 12, 1],
    [2014, 13, 2],
    [2015, 10, 2],
    [2016, 11, 0],
    [2017, 11, 0],
    [2018, 13, 4],
    [2019, 14, 1],
    [2020, 11, 4],
    [2021, 13, 1],
    [2022, 11, 2],
    [2023, 11, 4],
    [2024, 11, 1],
    [2025, 14, 2]
  ];

  const rows = FIRST_AWARD_YEAR_ROWS.map(([year, total, female]) => ({
    year,
    total,
    female,
    male: total - female
  }));

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
    sourceMode: "official-api-first-award-year",
    sources: [
      "https://api.nobelprize.org/2.1/laureates?limit=1200",
      "https://www.nobelprize.org/prizes/lists/nobel-prize-awarded-women/",
      "https://www.nobelprize.org/prizes/lists/all-nobel-prizes/"
    ]
  };

  window.NOBEL_BY_YEAR = rows;
})();

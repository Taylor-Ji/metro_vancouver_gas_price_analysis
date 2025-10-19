// async function fetchData(url) {
//   const resp = await fetch(url);
//   if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
//   return resp.json();
// }

// function renderTable(containerId, data) {
//   const container = document.getElementById(containerId);
//   if (!container) return;

//   // Clear existing
//   container.innerHTML = "";

//   if (!data || data.length === 0) {
//     container.innerText = "No data available";
//     return;
//   }

//   const table = document.createElement("table");
//   table.className = "data-table";

//   const thead = document.createElement("thead");
//   const headerRow = document.createElement("tr");

//   // Preferred column order — will be used if those keys exist in the data
//   const preferredOrder = [
//     "station",
//     "price_cents",
//     "price_per_litre",
//     "price",
//     "address",
//     "scraped_at",
//     "weekday",
//   ];
//   const availableKeys = Object.keys(data[0]);
//   const availableSet = new Set(availableKeys);

//   // Build final column list: preferred keys first (if present), then any remaining keys
//   const cols = [];
//   preferredOrder.forEach((k) => {
//     if (availableSet.has(k)) {
//       cols.push(k);
//       availableSet.delete(k);
//     }
//   });
//   // Append any other keys that weren't in the preferred list, preserving original order
//   availableKeys.forEach((k) => {
//     if (availableSet.has(k)) {
//       cols.push(k);
//       availableSet.delete(k);
//     }
//   });

//   // Create headers
//   cols.forEach((c) => {
//     const th = document.createElement("th");
//     // Make header slightly nicer by replacing underscores with spaces and capitalizing
//     th.innerText = c.replace(/_/g, " ");
//     headerRow.appendChild(th);
//   });
//   thead.appendChild(headerRow);
//   table.appendChild(thead);

//   const tbody = document.createElement("tbody");
//   // helper: format scraped_at ISO string into "YYYY-MM-DD HH:MM"
//   const formatScrapedAt = (val) => {
//     if (!val && val !== 0) return "";
//     if (typeof val === "string") {
//       // try to extract YYYY-MM-DDTHH:MM from the ISO-like string
//       const m = val.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
//       if (m) return `${m[1]} ${m[2]}`;
//       // fallback: try to parse as Date and format in local/time-zone-neutral way
//       const d = new Date(val);
//       if (!isNaN(d)) {
//         const pad = (n) => `${n}`.padStart(2, "0");
//         return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
//           d.getDate()
//         )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
//       }
//       return val;
//     }
//     // if it's a numeric timestamp (ms since epoch)
//     if (typeof val === "number") {
//       const d = new Date(val);
//       const pad = (n) => `${n}`.padStart(2, "0");
//       return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
//         d.getDate()
//       )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
//     }
//     return String(val);
//   };

//   data.forEach((row) => {
//     const tr = document.createElement("tr");
//     cols.forEach((c) => {
//       const td = document.createElement("td");
//       let cellValue = row[c] === null || row[c] === undefined ? "" : row[c];
//       if (c === "scraped_at") {
//         cellValue = formatScrapedAt(cellValue);
//       }
//       td.innerText = cellValue;
//       tr.appendChild(td);
//     });
//     tbody.appendChild(tr);
//   });
//   table.appendChild(tbody);

//   container.appendChild(table);
// }

// async function initDashboard() {
//   try {
//     const [
//       data,
//       median_gas_price_data,
//       median_gas_price_by_city_data,
//       daily_lowest_gas_price_data,
//     ] = await Promise.all([
//       fetchData("/get_all_data_sql"),
//       fetchData("/get_daily_median_gas_price"),
//       fetchData("/get_median_by_city"), // New endpoint for median by city
//       fetchData("/get_daily_lowest_price"), // New endpoint for daily lowest price
//     ]);

//     renderTable("gasTableContainer", data);

//     // Render median weekday bar chart
//     try {
//       const weekdayCanvas = document.getElementById("medianWeekdayChart");
//       if (weekdayCanvas && median_gas_price_data) {
//         const orderedWeekdays = [
//           "Monday",
//           "Tuesday",
//           "Wednesday",
//           "Thursday",
//           "Friday",
//           "Saturday",
//           "Sunday",
//         ];
//         const mapData = {};
//         (median_gas_price_data || []).forEach((m) => {
//           mapData[m.weekday] = m.median_price;
//         });
//         const labels = orderedWeekdays.filter((d) => mapData[d] !== undefined);
//         const values = labels.map((d) => mapData[d]);

//         if (weekdayCanvas._chartInstance)
//           weekdayCanvas._chartInstance.destroy();
//         weekdayCanvas._chartInstance = new Chart(
//           weekdayCanvas.getContext("2d"),
//           {
//             type: "bar",
//             data: {
//               labels,
//               datasets: [
//                 {
//                   label: "Median (¢/L)",
//                   data: values,
//                   backgroundColor: "rgba(43,140,190,0.9)",
//                 },
//               ],
//             },
//             options: {
//               plugins: { legend: { display: false } },
//               scales: { y: { title: { display: true, text: "¢ per litre" } } },
//             },
//           }
//         );
//         // also render a ranked table below the chart
//         try {
//           const rankContainer = document.getElementById("medianRankContainer");
//           if (rankContainer) {
//             const pairs = labels.map((w, i) => ({
//               weekday: w,
//               median: values[i],
//             }));
//             // sort ascending by median so smallest median gets rank 1
//             pairs.sort((a, b) => a.median - b.median);
//             // build table
//             const t = document.createElement("table");
//             t.className = "data-table";
//             const thead = document.createElement("thead");
//             const hr = document.createElement("tr");
//             ["Rank", "Weekday", "Median (¢/L)", "Δ from min"].forEach((h) => {
//               const th = document.createElement("th");
//               th.innerText = h;
//               hr.appendChild(th);
//             });
//             thead.appendChild(hr);
//             const tbody = document.createElement("tbody");
//             const minVal = Math.min(...values);
//             pairs.forEach((p, idx) => {
//               const tr = document.createElement("tr");
//               const rankTd = document.createElement("td");
//               rankTd.innerText = idx + 1;
//               const wTd = document.createElement("td");
//               wTd.innerText = p.weekday;
//               const mTd = document.createElement("td");
//               mTd.innerText = p.median.toFixed(1);
//               const dTd = document.createElement("td");
//               dTd.innerText = `${(p.median - minVal).toFixed(1)} ¢`;
//               [rankTd, wTd, mTd, dTd].forEach((n) => tr.appendChild(n));
//               tbody.appendChild(tr);
//             });
//             t.appendChild(thead);
//             t.appendChild(tbody);
//             rankContainer.innerHTML = "";
//             rankContainer.appendChild(t);
//           }
//         } catch (e) {
//           console.error("rank table error", e);
//         }
//       }
//     } catch (err) {
//       console.error("weekday chart error", err);
//     }

//     // Render median-by-city horizontal bar chart (sorted)
//     try {
//       const cityCanvas = document.getElementById("medianByCityChart");
//       if (cityCanvas && median_gas_price_by_city_data) {
//         // sort by median descending
//         const sorted = (median_gas_price_by_city_data || [])
//           .slice()
//           .sort((a, b) => a.median_price_cents - b.median_price_cents);
//         const labels = sorted.map((r) => r.city);
//         const vals = sorted.map((r) => r.median_price_cents);

//         if (cityCanvas._chartInstance) cityCanvas._chartInstance.destroy();
//         cityCanvas._chartInstance = new Chart(cityCanvas.getContext("2d"), {
//           type: "bar",
//           data: {
//             labels,
//             datasets: [
//               {
//                 label: "Median (¢/L)",
//                 data: vals,
//                 backgroundColor: "rgba(43,140,190,0.9)",
//               },
//             ],
//           },
//           options: {
//             indexAxis: "y",
//             plugins: {
//               legend: { display: false },
//               tooltip: {
//                 callbacks: {
//                   label: (ctx) => `${ctx.label}: ${ctx.parsed.x} ¢/L`,
//                 },
//               },
//               datalabels: {
//                 anchor: "end",
//                 align: "right",
//                 formatter: (v) => `${Number(v).toFixed(1)} ¢/L`,
//                 color: "#fff",
//               },
//             },
//             scales: {
//               x: { title: { display: true, text: "¢ per litre" } },
//               y: { ticks: { autoSkip: false } },
//             },
//           },
//         });
//       }
//     } catch (err) {
//       console.error("city bar error", err);
//     }

//     // ---- build "rank by city" table (ascending median) ----
//     try {
//       const rankContainer = document.getElementById(
//         "medianByCityRankContainer"
//       );
//       if (rankContainer) {
//         // Sort ascending for ranking (1 = cheapest)
//         const ranked = (median_gas_price_by_city_data || [])
//           .slice()
//           .sort((a, b) => a.median_price_cents - b.median_price_cents);

//         // compute min for Δ column
//         const minMedian = ranked.length ? ranked[0].median_price_cents : null;

//         // Build table
//         const t = document.createElement("table");
//         t.className = "data-table";
//         const thead = document.createElement("thead");
//         const hr = document.createElement("tr");
//         ["Rank", "City", "Median (¢/L)", "Δ from min"].forEach((h) => {
//           const th = document.createElement("th");
//           th.innerText = h;
//           hr.appendChild(th);
//         });
//         thead.appendChild(hr);

//         const tbody = document.createElement("tbody");
//         ranked.forEach((row, idx) => {
//           const tr = document.createElement("tr");
//           const rankTd = document.createElement("td");
//           rankTd.innerText = idx + 1;
//           const cityTd = document.createElement("td");
//           cityTd.innerText = row.city;
//           const medTd = document.createElement("td");
//           medTd.innerText = Number(row.median_price_cents).toFixed(1);
//           const dTd = document.createElement("td");
//           const delta =
//             minMedian == null
//               ? ""
//               : (Number(row.median_price_cents) - Number(minMedian)).toFixed(
//                   1
//                 ) + " ¢";
//           dTd.innerText = delta;

//           [rankTd, cityTd, medTd, dTd].forEach((n) => tr.appendChild(n));
//           tbody.appendChild(tr);
//         });

//         t.appendChild(thead);
//         t.appendChild(tbody);
//         rankContainer.innerHTML = "";
//         rankContainer.appendChild(t);
//       }
//     } catch (e) {
//       console.error("city rank table error", e);
//     }

//     const dailyLowestFormatted = (daily_lowest_gas_price_data || []).map(
//       (m) => {
//         // backend may return 'price_cents' or 'lowest_price' depending on code path
//         const rawPrice =
//           m.price_cents ??
//           m.lowest_price ??
//           m["price_cents"] ??
//           m["lowest_price"];
//         if (rawPrice === undefined || rawPrice === null) {
//           console.warn("daily lowest row missing price:", m);
//         }
//         const priceVal =
//           rawPrice === undefined || rawPrice === null
//             ? ""
//             : Number(rawPrice).toFixed(1);
//         return {
//           Date: m.date,
//           "Price (¢/L)": priceVal,
//           Station: m.station,
//           City: m.city,
//           Address: m.address,
//         };
//       }
//     );
//     renderTable("dailyLowestGasPriceContainer", dailyLowestFormatted);
//   } catch (err) {
//     console.error("Error loading dashboard data", err);
//     const container = document.getElementById("gasTableContainer");
//     const container2 = document.getElementById("medianByCityContainer");
//     const container3 = document.getElementById("medianByCityContainer");
//     const container4 = document.getElementById("dailyLowestGasPriceContainer");
//     if (container) container.innerText = "Error loading data";
//     if (container2) container2.innerText = "Error loading data";
//     if (container3) container3.innerText = "Error loading data";
//     if (container4) container4.innerText = "Error loading data";
//   }
// }

// document.addEventListener("DOMContentLoaded", initDashboard);

// // register datalabels plugin globally if available
// if (window.Chart && Chart.register && Chart.register.window) {
//   // noop for safety
// }
// if (window.Chart && Chart.register) {
//   try {
//     Chart.register(ChartDataLabels);
//   } catch (e) {
//     /* plugin may already be registered or missing */
//   }
// }


// -----------------------------
// Global state + caches
// -----------------------------
const state = {
  city: "__ALL__",
};

let ALL_DATA = [];
let MEDIAN_WEEKDAY_DATA = [];
let MEDIAN_BY_CITY_DATA = [];
let DAILY_LOWEST_DATA = [];

// Keep chart instances to destroy before redraw
const CHARTS = {
  medianWeekday: null,
  medianByCity: null,
};

// Register datalabels if present
if (window.Chart && Chart.register) {
  try { Chart.register(ChartDataLabels); } catch (e) { /* ok if missing */ }
}

// -----------------------------
// Utils
// -----------------------------
async function fetchData(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  return resp.json();
}

function renderTable(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear existing
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerText = "No data available";
    return;
  }

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // Preferred column order — will be used if those keys exist in the data
  const preferredOrder = [
    "station",
    "price_cents",
    "price_per_litre",
    "price",
    "address",
    "scraped_at",
    "weekday",
    "city",
  ];
  const availableKeys = Object.keys(data[0]);
  const availableSet = new Set(availableKeys);

  // Build final column list: preferred keys first (if present), then any remaining keys
  const cols = [];
  preferredOrder.forEach((k) => {
    if (availableSet.has(k)) {
      cols.push(k);
      availableSet.delete(k);
    }
  });
  // Append any other keys that weren't in the preferred list, preserving original order
  availableKeys.forEach((k) => {
    if (availableSet.has(k)) {
      cols.push(k);
      availableSet.delete(k);
    }
  });

  // Create headers
  cols.forEach((c) => {
    const th = document.createElement("th");
    th.innerText = c.replace(/_/g, " ");
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  // helper: format scraped_at ISO string into "YYYY-MM-DD HH:MM"
  const formatScrapedAt = (val) => {
    if (!val && val !== 0) return "";
    if (typeof val === "string") {
      const m = val.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
      if (m) return `${m[1]} ${m[2]}`;
      const d = new Date(val);
      if (!isNaN(d)) {
        const pad = (n) => `${n}`.padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      return val;
    }
    if (typeof val === "number") {
      const d = new Date(val);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return String(val);
  };

  data.forEach((row) => {
    const tr = document.createElement("tr");
    cols.forEach((c) => {
      const td = document.createElement("td");
      let cellValue = row[c] === null || row[c] === undefined ? "" : row[c];
      if (c === "scraped_at") {
        cellValue = formatScrapedAt(cellValue);
      }
      td.innerText = cellValue;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

function populateCitySelect(sourceRows) {
  const sel = document.getElementById("citySelect");
  if (!sel) return;

  const cities = Array.from(
    new Set((sourceRows || []).map(d => d.city).filter(Boolean))
  ).sort();

  sel.innerHTML = `<option value="__ALL__">All</option>` +
    cities.map(c => `<option value="${c}">${c}</option>`).join("");

  sel.value = state.city;
  sel.onchange = () => {
    state.city = sel.value;
    rerenderAll();
  };
}

function filterByCity(rows) {
  if (state.city === "__ALL__") return rows || [];
  return (rows || []).filter(r => r.city === state.city);
}

// -----------------------------
// Renderers
// -----------------------------
function renderMedianWeekdayChartAndRank() {
  const canvas = document.getElementById("medianWeekdayChart");
  const container = document.getElementById("medianRankContainer");
  if (!canvas) return;

  const orderedWeekdays = [
    "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
  ];
  const mapData = {};
  (MEDIAN_WEEKDAY_DATA || []).forEach((m) => { mapData[m.weekday] = m.median_price; });
  const labels = orderedWeekdays.filter((d) => mapData[d] !== undefined);
  const values = labels.map((d) => mapData[d]);

  if (CHARTS.medianWeekday) CHARTS.medianWeekday.destroy();
  CHARTS.medianWeekday = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Median (¢/L)", data: values }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { title: { display: true, text: "¢ per litre" } } },
    },
  });

  // Ranked table
  if (container) {
    const pairs = labels.map((w, i) => ({ weekday: w, median: values[i] }))
      .sort((a, b) => a.median - b.median);

    const t = document.createElement("table");
    t.className = "data-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["Rank", "Weekday", "Median (¢/L)", "Δ from min"].forEach((h) => {
      const th = document.createElement("th"); th.innerText = h; hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    const minVal = Math.min(...values);
    pairs.forEach((p, idx) => {
      const tr = document.createElement("tr");
      const cells = [
        idx + 1,
        p.weekday,
        Number(p.median).toFixed(1),
        `${(p.median - minVal).toFixed(1)} ¢`,
      ];
      cells.forEach(v => { const td = document.createElement("td"); td.innerText = v; tr.appendChild(td); });
      tbody.appendChild(tr);
    });

    t.appendChild(thead);
    t.appendChild(tbody);
    container.innerHTML = "";
    container.appendChild(t);
  }
}

function renderMedianByCityChartAndRank() {
  const canvas = document.getElementById("medianByCityChart");
  const rankContainer = document.getElementById("medianByCityRankContainer");
  if (!canvas) return;

  // If All: show all. Else: just the selected city.
  const subset = (state.city === "__ALL__")
    ? (MEDIAN_BY_CITY_DATA || []).slice()
    : (MEDIAN_BY_CITY_DATA || []).filter(r => r.city === state.city);

  const sorted = subset.sort((a, b) => a.median_price_cents - b.median_price_cents);
  const labels = sorted.map(r => r.city);
  const vals = sorted.map(r => r.median_price_cents);

  if (CHARTS.medianByCity) CHARTS.medianByCity.destroy();
  CHARTS.medianByCity = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Median (¢/L)", data: vals }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "¢ per litre" } },
        y: { ticks: { autoSkip: false } },
      },
    },
  });

  // Rank table
  if (rankContainer) {
    const ranked = sorted;
    const minMedian = ranked.length ? ranked[0].median_price_cents : null;

    const t = document.createElement("table");
    t.className = "data-table";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["Rank", "City", "Median (¢/L)", "Δ from min"].forEach((h) => {
      const th = document.createElement("th"); th.innerText = h; hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement("tbody");
    ranked.forEach((row, idx) => {
      const tr = document.createElement("tr");
      const delta = (minMedian == null) ? "" :
        (Number(row.median_price_cents) - Number(minMedian)).toFixed(1) + " ¢";
      [idx + 1, row.city, Number(row.median_price_cents).toFixed(1), delta]
        .forEach(val => { const td = document.createElement("td"); td.innerText = val; tr.appendChild(td); });
      tbody.appendChild(tr);
    });

    t.appendChild(thead);
    t.appendChild(tbody);
    rankContainer.innerHTML = "";
    rankContainer.appendChild(t);
  }
}

// -----------------------------
// Rerender for city filter
// -----------------------------
function rerenderAll() {
  // Filtered 100-row data
  renderTable("gasTableContainer", filterByCity(ALL_DATA));

  // Filtered daily lowest table
  const dailyLowestFormatted = filterByCity(DAILY_LOWEST_DATA).map((m) => {
    const rawPrice = m.price_cents ?? m.lowest_price ?? m["price_cents"] ?? m["lowest_price"];
    const priceVal = (rawPrice == null) ? "" : Number(rawPrice).toFixed(1);
    return {
      Date: m.date,
      "Price (¢/L)": priceVal,
      Station: m.station,
      City: m.city,
      Address: m.address,
    };
  });
  renderTable("dailyLowestGasPriceContainer", dailyLowestFormatted);

  // Median-by-city (focus on selection or show all)
  renderMedianByCityChartAndRank();
}

// -----------------------------
// Init
// -----------------------------
async function initDashboard() {
  try {
    const [
      data,
      median_gas_price_data,
      median_gas_price_by_city_data,
      daily_lowest_gas_price_data,
    ] = await Promise.all([
      fetchData("/get_all_data_sql"),
      fetchData("/get_daily_median_gas_price"),
      fetchData("/get_median_by_city"),
      fetchData("/get_daily_lowest_price"),
    ]);

    ALL_DATA = data || [];
    MEDIAN_WEEKDAY_DATA = median_gas_price_data || [];
    MEDIAN_BY_CITY_DATA = median_gas_price_by_city_data || [];
    DAILY_LOWEST_DATA = daily_lowest_gas_price_data || [];

    // Populate city dropdown from the 100-row data
    populateCitySelect(ALL_DATA);

    // Global weekday chart (doesn't depend on city)
    renderMedianWeekdayChartAndRank();

    // First render of city-dependent views
    rerenderAll();
  } catch (err) {
    console.error("Error loading dashboard data", err);
    const ids = [
      "gasTableContainer",
      "medianByCityRankContainer",
      "dailyLowestGasPriceContainer",
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerText = "Error loading data";
    });
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);

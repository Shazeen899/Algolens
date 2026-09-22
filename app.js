// --- DOM Element References ---
const arrayContainer = document.getElementById("array-container");
const btnGenerate = document.getElementById("btn-generate");
const btnSort = document.getElementById("btn-sort");
const btnPause = document.getElementById("btn-pause");
const btnStep = document.getElementById("btn-step");
const algoSelect = document.getElementById("algo-select");
const statComparisons = document.getElementById("stat-comparisons");
const statSwaps = document.getElementById("stat-swaps");
const statSize = document.getElementById("stat-size");
const statTime = document.getElementById("stat-time");
const sliderSize = document.getElementById("slider-size");
const sliderSpeed = document.getElementById("slider-speed");
const valSize = document.getElementById("val-size");
const valSizeHeader = document.getElementById("val-size-header");
const valSpeed = document.getElementById("val-speed");
const codeView = document.getElementById("code-view");
const codeTitle = document.getElementById("code-title");
const algoTitleDisplay = document.getElementById("algo-title-display");
const statusText = document.getElementById("status-text");
const timeComplexity = document.getElementById("time-complexity");
const spaceComplexity = document.getElementById("space-complexity");

// Custom Array DOM references
const customInput = document.getElementById("custom-array-input");
const btnCustom = document.getElementById("btn-custom");

// --- Global State ---
let currentArray = [];
let originalValues = []; // Stores real raw values for custom input display
let arraySize = parseInt(sliderSize.value, 10);
let animationSpeedMs = parseInt(sliderSpeed.value, 10);
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let timerHandle = null;

// Pause & Step Controls State
let isPaused = false;
let isSorting = false;
let stepRequested = false;

// Sleep Function with Pause & Step Interrupt Handler
const sleep = (ms) => {
  return new Promise((resolve) => {
    const checkState = () => {
      if (stepRequested) {
        stepRequested = false;
        isPaused = true;
        updatePauseUI(true);
        resolve();
      } else if (!isPaused) {
        setTimeout(resolve, ms);
      } else {
        setTimeout(checkState, 50);
      }
    };
    checkState();
  });
};

// Algorithm Templates & Complexity Map
const algoCodeTemplates = {
  bubble: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        swap(arr, j, j + 1);
      }
    }
  }
}`,
  selection: `function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    swap(arr, i, minIdx);
  }
}`,
  insertion: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i], j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}`,
  quick: `function quickSort(arr, low, high) {
  if (low < high) {
    let pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}`,
  merge: `function mergeSort(arr, l, r) {
  if (l >= r) return;
  let m = Math.floor((l + r) / 2);
  mergeSort(arr, l, m);
  mergeSort(arr, m + 1, r);
  merge(arr, l, m, r);
}`
};

const algoDetails = {
  bubble: { label: "Bubble Sort", time: "O(n²)", space: "O(1)" },
  selection: { label: "Selection Sort", time: "O(n²)", space: "O(1)" },
  insertion: { label: "Insertion Sort", time: "O(n²)", space: "O(1)" },
  quick: { label: "Quick Sort", time: "O(n log n)", space: "O(log n)" },
  merge: { label: "Merge Sort", time: "O(n log n)", space: "O(n)" }
};

function renderCode() {
  const algo = algoSelect.value;
  const info = algoDetails[algo];
  codeView.textContent = algoCodeTemplates[algo];
  codeTitle.textContent = info.label.toLowerCase();
  algoTitleDisplay.textContent = info.label;
  timeComplexity.textContent = info.time;
  spaceComplexity.textContent = info.space;
}

// --- Metrics & Timer ---
function updateMetrics() {
  statComparisons.innerText = comparisons;
  statSwaps.innerText = swaps;
}

function startTimer() {
  startTime = performance.now();
  statTime.innerText = "0.0s";
  timerHandle = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    statTime.innerText = elapsed.toFixed(1) + "s";
  }, 100);
}

function stopTimer() {
  if (timerHandle) clearInterval(timerHandle);
  const elapsed = (performance.now() - startTime) / 1000;
  statTime.innerText = elapsed.toFixed(1) + "s";
}

// --- Helper to Update Bar Height and Numeric Label ---
function setBarValue(barElement, heightVal, labelVal) {
  barElement.style.height = `${heightVal}px`;
  const label = barElement.querySelector(".bar-value");
  if (label) {
    label.innerText = labelVal !== undefined ? labelVal : heightVal;
  }
}

// --- Array Rendering and Generation ---
function renderBars() {
  arrayContainer.querySelectorAll(".bar").forEach((b) => b.remove());
  comparisons = 0;
  swaps = 0;
  updateMetrics();
  statTime.innerText = "0.0s";
  statusText.innerText = "idle";

  // Sync array size display across all UI elements
  arraySize = currentArray.length;
  if (valSize) valSize.textContent = arraySize;
  if (valSizeHeader) valSizeHeader.textContent = arraySize;
  if (statSize) statSize.textContent = arraySize;
  if (sliderSize) sliderSize.value = arraySize;

  for (let i = 0; i < currentArray.length; i++) {
    const value = currentArray[i];
    const displayVal = originalValues[i] !== undefined ? originalValues[i] : value;

    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${value}px`;

    // Numeric label above bar
    const label = document.createElement("span");
    label.classList.add("bar-value");
    label.innerText = displayVal;
    bar.appendChild(label);

    arrayContainer.appendChild(bar);
  }
}

// Generate Random Numbers
function generateRandomArray() {
  if (isSorting) return;
  currentArray = [];
  originalValues = [];
  for (let i = 0; i < arraySize; i++) {
    const value = Math.floor(Math.random() * 250) + 20;
    currentArray.push(value);
    originalValues.push(value);
  }
  renderBars();
}

// Parse and Generate Custom User Array
function generateCustomArray() {
  if (isSorting) return;
  const rawInput = customInput ? customInput.value.trim() : "";

  if (rawInput === "") {
    alert("Please enter numbers separated by commas or spaces.");
    return;
  }

  // Parse text into an array of positive numbers
  const parsedValues = rawInput
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  if (parsedValues.length < 2) {
    alert("Please enter at least 2 valid positive numbers.");
    return;
  }

  originalValues = [...parsedValues];

  // Scale bar heights proportionately to fit canvas height
  const maxValue = Math.max(...parsedValues);
  currentArray = parsedValues.map((val) =>
    Math.max(20, Math.floor((val / maxValue) * 260))
  );

  renderBars();
}

function getBars() {
  return arrayContainer.getElementsByClassName("bar");
}

function setUIState(sorting) {
  isSorting = sorting;
  btnSort.disabled = sorting;
  btnGenerate.disabled = sorting;
  sliderSize.disabled = sorting;
  algoSelect.disabled = sorting;
  btnPause.disabled = !sorting;
  btnStep.disabled = !sorting;
  
  if (btnCustom) btnCustom.disabled = sorting;
  if (customInput) customInput.disabled = sorting;
  
  statusText.innerText = sorting ? "running" : "finished";
}

function updatePauseUI(paused) {
  btnPause.disabled = paused;
  btnSort.disabled = !paused;
  btnStep.disabled = !paused;
  statusText.innerText = paused ? "paused" : "running";
}

// --- Sorting Algorithms with Live Bar Labels ---
async function runBubbleSort() {
  const bars = getBars();
  for (let i = 0; i < currentArray.length; i++) {
    for (let j = 0; j < currentArray.length - i - 1; j++) {
      bars[j].className = "bar active";
      bars[j + 1].className = "bar active";
      comparisons++;
      updateMetrics();
      await sleep(animationSpeedMs);

      if (currentArray[j] > currentArray[j + 1]) {
        swaps++;
        updateMetrics();

        // Swap heights & raw values
        [currentArray[j], currentArray[j + 1]] = [currentArray[j + 1], currentArray[j]];
        [originalValues[j], originalValues[j + 1]] = [originalValues[j + 1], originalValues[j]];

        bars[j].className = "bar swap";
        bars[j + 1].className = "bar swap";

        setBarValue(bars[j], currentArray[j], originalValues[j]);
        setBarValue(bars[j + 1], currentArray[j + 1], originalValues[j + 1]);

        await sleep(animationSpeedMs);
      }

      bars[j].className = "bar";
      bars[j + 1].className = "bar";
    }
    bars[currentArray.length - 1 - i].className = "bar sorted";
  }
}

async function runSelectionSort() {
  const bars = getBars();
  for (let i = 0; i < currentArray.length; i++) {
    let minIdx = i;
    bars[i].className = "bar active";

    for (let j = i + 1; j < currentArray.length; j++) {
      bars[j].className = "bar active";
      comparisons++;
      updateMetrics();
      await sleep(animationSpeedMs);

      if (currentArray[j] < currentArray[minIdx]) {
        if (minIdx !== i) bars[minIdx].className = "bar";
        minIdx = j;
      } else {
        bars[j].className = "bar";
      }
    }

    if (minIdx !== i) {
      swaps++;
      updateMetrics();

      [currentArray[i], currentArray[minIdx]] = [currentArray[minIdx], currentArray[i]];
      [originalValues[i], originalValues[minIdx]] = [originalValues[minIdx], originalValues[i]];

      setBarValue(bars[i], currentArray[i], originalValues[i]);
      setBarValue(bars[minIdx], currentArray[minIdx], originalValues[minIdx]);

      bars[minIdx].className = "bar";
    }
    bars[i].className = "bar sorted";
  }
}

async function runInsertionSort() {
  const bars = getBars();
  for (let i = 1; i < currentArray.length; i++) {
    let key = currentArray[i];
    let keyRaw = originalValues[i];
    let j = i - 1;

    bars[i].className = "bar active";
    await sleep(animationSpeedMs);

    while (j >= 0) {
      comparisons++;
      updateMetrics();

      if (currentArray[j] > key) {
        swaps++;
        updateMetrics();
        bars[j].className = "bar swap";

        currentArray[j + 1] = currentArray[j];
        originalValues[j + 1] = originalValues[j];

        setBarValue(bars[j + 1], currentArray[j + 1], originalValues[j + 1]);
        bars[j + 1].className = "bar sorted";

        await sleep(animationSpeedMs);
        bars[j].className = "bar sorted";
        j--;
      } else {
        break;
      }
    }

    currentArray[j + 1] = key;
    originalValues[j + 1] = keyRaw;

    setBarValue(bars[j + 1], key, keyRaw);
    bars[j + 1].className = "bar sorted";
  }
  for (const bar of bars) bar.className = "bar sorted";
}

async function runQuickSortWrapper() {
  await quickSort(0, currentArray.length - 1);
  for (const bar of getBars()) bar.className = "bar sorted";
}

async function quickSort(low, high) {
  if (low < high) {
    const pivotIdx = await partition(low, high);
    await quickSort(low, pivotIdx - 1);
    await quickSort(pivotIdx + 1, high);
  }
}

async function partition(low, high) {
  const bars = getBars();
  const pivot = currentArray[high];
  bars[high].className = "bar active";
  let i = low;

  for (let j = low; j < high; j++) {
    bars[j].className = "bar active";
    comparisons++;
    updateMetrics();
    await sleep(animationSpeedMs);

    if (currentArray[j] < pivot) {
      swaps++;
      updateMetrics();

      [currentArray[i], currentArray[j]] = [currentArray[j], currentArray[i]];
      [originalValues[i], originalValues[j]] = [originalValues[j], originalValues[i]];

      setBarValue(bars[i], currentArray[i], originalValues[i]);
      setBarValue(bars[j], currentArray[j], originalValues[j]);

      bars[i].className = "bar swap";
      bars[j].className = "bar swap";
      await sleep(animationSpeedMs);
      bars[i].className = "bar";
      i++;
    }
    bars[j].className = "bar";
  }

  swaps++;
  updateMetrics();

  [currentArray[i], currentArray[high]] = [currentArray[high], currentArray[i]];
  [originalValues[i], originalValues[high]] = [originalValues[high], originalValues[i]];

  setBarValue(bars[i], currentArray[i], originalValues[i]);
  setBarValue(bars[high], currentArray[high], originalValues[high]);

  bars[high].className = "bar sorted";
  bars[i].className = "bar";

  return i;
}

async function runMergeSortWrapper() {
  await mergeSort(0, currentArray.length - 1);
  for (const bar of getBars()) bar.className = "bar sorted";
}

async function mergeSort(start, end) {
  if (start >= end) return;
  const mid = Math.floor((start + end) / 2);
  await mergeSort(start, mid);
  await mergeSort(mid + 1, end);
  await merge(start, mid, end);
}

async function merge(start, mid, end) {
  const bars = getBars();
  const left = currentArray.slice(start, mid + 1);
  const leftRaw = originalValues.slice(start, mid + 1);
  const right = currentArray.slice(mid + 1, end + 1);
  const rightRaw = originalValues.slice(mid + 1, end + 1);

  let i = 0, j = 0, k = start;

  while (i < left.length && j < right.length) {
    bars[k].className = "bar active";
    comparisons++;
    updateMetrics();
    await sleep(animationSpeedMs);

    if (left[i] <= right[j]) {
      currentArray[k] = left[i];
      originalValues[k] = leftRaw[i];
      i++;
    } else {
      currentArray[k] = right[j];
      originalValues[k] = rightRaw[j];
      j++;
    }
    swaps++;
    updateMetrics();

    setBarValue(bars[k], currentArray[k], originalValues[k]);
    bars[k].className = "bar swap";
    await sleep(animationSpeedMs);
    bars[k].className = "bar";
    k++;
  }

  while (i < left.length) {
    currentArray[k] = left[i];
    originalValues[k] = leftRaw[i];
    setBarValue(bars[k], currentArray[k], originalValues[k]);
    bars[k].className = "bar swap";
    await sleep(animationSpeedMs);
    bars[k].className = "bar";
    i++;
    k++;
  }

  while (j < right.length) {
    currentArray[k] = right[j];
    originalValues[k] = rightRaw[j];
    setBarValue(bars[k], currentArray[k], originalValues[k]);
    bars[k].className = "bar swap";
    await sleep(animationSpeedMs);
    bars[k].className = "bar";
    j++;
    k++;
  }
}

// --- Control Router ---
async function handleSortRoute() {
  if (isPaused) {
    isPaused = false;
    updatePauseUI(false);
    return;
  }

  setUIState(true);
  comparisons = 0;
  swaps = 0;
  updateMetrics();
  startTimer();

  const selectedAlgo = algoSelect.value;
  if (selectedAlgo === "bubble") await runBubbleSort();
  else if (selectedAlgo === "selection") await runSelectionSort();
  else if (selectedAlgo === "insertion") await runInsertionSort();
  else if (selectedAlgo === "quick") await runQuickSortWrapper();
  else if (selectedAlgo === "merge") await runMergeSortWrapper();

  stopTimer();
  setUIState(false);
}

// --- Event Listeners ---
sliderSize.addEventListener("input", (e) => {
  arraySize = parseInt(e.target.value, 10);
  generateRandomArray();
});

sliderSpeed.addEventListener("input", (e) => {
  animationSpeedMs = parseInt(e.target.value, 10);
  valSpeed.textContent = animationSpeedMs;
});

btnPause.addEventListener("click", () => {
  isPaused = true;
  updatePauseUI(true);
});

btnStep.addEventListener("click", () => {
  if (isPaused) {
    stepRequested = true;
  }
});

if (btnCustom) btnCustom.addEventListener("click", generateCustomArray);
algoSelect.addEventListener("change", renderCode);
btnGenerate.addEventListener("click", generateRandomArray);
btnSort.addEventListener("click", handleSortRoute);

// --- Initialization ---
renderCode();
generateRandomArray();
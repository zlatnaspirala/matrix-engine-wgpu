import './index.css';
import { MEEditorClient } from "./client";
import { SYSTEM_PROMPT_MULTI } from './prompt';

export let providers = [
  "ollama",
  "groq",
  "anthropic",
  "google"
];

let client=new MEEditorClient();

// Setup listener for custom event 'aiGenGraphCall'
// document.addEventListener('aiGenGraphCall', (e: Event) => {
//   const customEvent = e as CustomEvent<{ provider: string; task: string }>;
//   if (customEvent.detail) {
//     client.handleAiGenGraphCall(customEvent.detail);
//   }
// });

// Create Layout Container
const root = document.getElementById('root') || document.body;
root.innerHTML = ''; // clear any existing content

const appContainer = document.createElement('div');
appContainer.className = 'flex h-screen w-screen bg-slate-900 text-slate-100 font-sans overflow-hidden';

// =====================================
// LEFT SIDE PANEL
// =====================================
const leftPanel = document.createElement('div');
leftPanel.className = 'w-1/2 min-w-[320px] max-w-[600px] border-r border-slate-800 bg-slate-950 flex flex-col h-full';

// Header
const header = document.createElement('div');
header.className = 'p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60';

const titleContainer = document.createElement('div');
titleContainer.className = 'flex items-center gap-2';

const titleIcon = document.createElement('div');
titleIcon.className = 'w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30';
titleIcon.innerText = 'AI';

const titleText = document.createElement('div');
titleText.innerHTML = '<h1 class="font-semibold text-sm text-slate-200">Prompt & AI Call</h1><p class="text-[11px] text-slate-400">MEEditorClient Vanilla TS Setup</p>';

titleContainer.appendChild(titleIcon);
titleContainer.appendChild(titleText);

// Provider Select
const providerSelectGroup = document.createElement('div');
providerSelectGroup.className = 'flex items-center gap-2';

const providerLabel = document.createElement('label');
providerLabel.className = 'text-xs text-slate-400 font-medium';
providerLabel.innerText = 'Provider:';

const providerSelect = document.createElement('select');
providerSelect.className = 'bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer capitalize';

providers.forEach((prov) => {
  const option = document.createElement('option');
  option.value = prov;
  option.innerText = prov;
  providerSelect.appendChild(option);
});

providerSelectGroup.appendChild(providerLabel);
providerSelectGroup.appendChild(providerSelect);

header.appendChild(titleContainer);
header.appendChild(providerSelectGroup);

// Main Form Body (Split into System Prompt & Task/User Input)
const formBody = document.createElement('div');
formBody.className = 'p-4 flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto';

// --- SYSTEM PROMPT SECTION ---
const systemSection = document.createElement('div');
systemSection.className = 'flex-1 flex flex-col gap-1.5 min-h-[140px]';

const systemLabelRow = document.createElement('div');
systemLabelRow.className = 'flex items-center justify-between';

const systemLabel = document.createElement('label');
systemLabel.className = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5';
systemLabel.innerHTML = '<span class="w-2 h-2 rounded-full bg-indigo-500"></span> System Prompt';

const resetSystemBtn = document.createElement('button');
resetSystemBtn.type = 'button';
resetSystemBtn.className = 'text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer';
resetSystemBtn.innerText = 'Reset Default';

systemLabelRow.appendChild(systemLabel);
systemLabelRow.appendChild(resetSystemBtn);

const systemTextarea = document.createElement('textarea');
systemTextarea.id = 'systemPromptInput';
systemTextarea.className = 'flex-1 w-full bg-slate-900 text-slate-200 text-xs p-3 rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono leading-relaxed';
systemTextarea.placeholder = 'System prompt configuration...';
systemTextarea.value = SYSTEM_PROMPT_MULTI;

resetSystemBtn.addEventListener('click', () => {
  systemTextarea.value = SYSTEM_PROMPT_MULTI;
});

systemSection.appendChild(systemLabelRow);
systemSection.appendChild(systemTextarea);

// --- TASK (USER INPUT) SECTION ---
const taskSection = document.createElement('div');
taskSection.className = 'flex-1 flex flex-col gap-1.5 min-h-[140px]';

const taskLabelRow = document.createElement('div');
taskLabelRow.className = 'flex items-center justify-between';

const taskLabel = document.createElement('label');
taskLabel.className = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5';
taskLabel.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Task (User Input)';

const clearTaskBtn = document.createElement('button');
clearTaskBtn.type = 'button';
clearTaskBtn.className = 'text-[11px] text-slate-400 hover:text-slate-300 transition-colors cursor-pointer';
clearTaskBtn.innerText = 'Clear';

taskLabelRow.appendChild(taskLabel);
taskLabelRow.appendChild(clearTaskBtn);

const taskTextarea = document.createElement('textarea');
taskTextarea.id = 'taskInput';
taskTextarea.className = 'flex-1 w-full bg-slate-900 text-slate-200 text-xs p-3 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-mono leading-relaxed';
taskTextarea.placeholder = 'Type user task or prompt here...';
taskTextarea.value = 'Create an interactive graph workflow with node processing and data pipeline execution.';

clearTaskBtn.addEventListener('click', () => {
  taskTextarea.value = '';
});

taskSection.appendChild(taskLabelRow);
taskSection.appendChild(taskTextarea);

// Run Button
const runBtn = document.createElement('button');
runBtn.type = 'button';
runBtn.className = 'w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-950/40 cursor-pointer flex items-center justify-center gap-2 shrink-0';
runBtn.innerText = 'Run Prompt Event';

// Log Container
const logSection = document.createElement('div');
logSection.className = 'border-t border-slate-800 p-4 bg-slate-900/40 flex flex-col gap-2 max-h-40 shrink-0';

const logTitle = document.createElement('div');
logTitle.className = 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider';
logTitle.innerText = 'Dispatched CustomEvents Log';

const logList = document.createElement('div');
logList.className = 'overflow-y-auto space-y-2 text-xs font-mono max-h-28 pr-1';
logList.innerHTML = '<p class="text-slate-600 italic py-1">Click "Run Prompt Event" to dispatch custom event.</p>';

logSection.appendChild(logTitle);
logSection.appendChild(logList);

// Dispatch handler
runBtn.addEventListener('click', () => {
  const selectedProvider = providerSelect.value;
  const systemValue = systemTextarea.value;
  const taskValue = taskTextarea.value;

  // Dispatch CustomEvent as required
  document.dispatchEvent(new CustomEvent('aiGenGraphCall', {
    detail: {
      provider: selectedProvider,
      systemPrompt: systemValue,
      task: taskValue,
      prompt: `${systemValue}\n\nTask:\n${taskValue}`
    }
  }));

  // Update UI Feedback Log
  if (logList.querySelector('.italic')) {
    logList.innerHTML = '';
  }

  const logItem = document.createElement('div');
  logItem.className = 'p-2 rounded bg-slate-900 border border-slate-800 flex flex-col gap-1';
  logItem.innerHTML = `
    <div class="flex items-center justify-between text-[10px]">
      <span class="text-indigo-400 font-bold uppercase">${selectedProvider}</span>
      <span class="text-slate-500">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="text-slate-300 truncate"><span class="text-slate-500">Task:</span> ${taskValue || '(empty)'}</div>
  `;
  logList.insertBefore(logItem, logList.firstChild);

  // Quick visual feedback on button
  const originalText = runBtn.innerText;
  runBtn.innerText = '✓ Dispatched aiGenGraphCall!';
  runBtn.classList.replace('bg-indigo-600', 'bg-emerald-600');
  setTimeout(() => {
    runBtn.innerText = originalText;
    runBtn.classList.replace('bg-emerald-600', 'bg-indigo-600');
  }, 1500);
});

formBody.appendChild(systemSection);
formBody.appendChild(taskSection);
formBody.appendChild(runBtn);

leftPanel.appendChild(header);
leftPanel.appendChild(formBody);
leftPanel.appendChild(logSection);

// =====================================
// RIGHT SIDE IFRAME
// =====================================
const rightPanel = document.createElement('div');
rightPanel.className = 'flex-1 bg-slate-900 flex flex-col h-full overflow-hidden';

// Top Bar for Iframe URL Setup
const iframeHeader = document.createElement('div');
iframeHeader.className = 'p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-3';

const iframeLabel = document.createElement('span');
iframeLabel.className = 'text-xs text-slate-400 font-medium shrink-0';
iframeLabel.innerText = 'Iframe src:';

const iframeUrlInput = document.createElement('input');
iframeUrlInput.type = 'text';
iframeUrlInput.placeholder = 'Enter src URL for iframe (e.g., https://example.com or about:blank)';
iframeUrlInput.className = 'flex-1 bg-slate-900 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono';

iframeHeader.appendChild(iframeLabel);
iframeHeader.appendChild(iframeUrlInput);

// Iframe Container
const iframeWrapper = document.createElement('div');
iframeWrapper.className = 'flex-1 w-full h-full relative bg-slate-950';

const iframe = document.createElement('iframe');
iframe.id = 'previewIframe';
iframe.title = 'AI Output Preview';
iframe.className = 'w-full h-full border-0 bg-white';
iframe.src = 'about:blank';

iframeUrlInput.addEventListener('input', () => {
  iframe.src = iframeUrlInput.value || 'about:blank';
});

iframeWrapper.appendChild(iframe);

rightPanel.appendChild(iframeHeader);
rightPanel.appendChild(iframeWrapper);

// Assemble App Layout
appContainer.appendChild(leftPanel);
appContainer.appendChild(rightPanel);
root.appendChild(appContainer);

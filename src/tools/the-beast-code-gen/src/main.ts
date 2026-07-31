import './index.css';
import { MEEditorClient } from "./client";
import { SYSTEM_PROMPT_MULTI } from './prompt';
import { tasks } from './tasks';
export let providers = [
  "ollama",
  "groq",
  "anthropic",
  "google"
];

let client = new MEEditorClient();

// Create Layout Container
const root = document.getElementById('root') || document.body;
root.innerHTML = ''; // clear any existing content

const appContainer = document.createElement('div');
appContainer.className = 'flex h-screen w-screen bg-black text-emerald-400 font-mono overflow-hidden text-xs';

// =====================================
// LEFT SIDE PANEL
// =====================================
const leftPanel = document.createElement('div');
leftPanel.className = 'w-1/2 min-w-[320px] max-w-[600px] border-r border-emerald-900/60 bg-slate-950 flex flex-col h-full';

// Header
const header = document.createElement('div');
header.className = 'px-3 py-2 border-b border-emerald-900/60 flex items-center justify-between bg-black/80';

const titleContainer = document.createElement('div');
titleContainer.className = 'flex items-center gap-2';

const titleIcon = document.createElement('div');
titleIcon.className = 'w-6 h-6 rounded bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
titleIcon.innerText = '⚡';

const titleText = document.createElement('div');
titleText.innerHTML = '<h1 class="font-bold text-xs text-emerald-300 tracking-wider">BEAST_AI // EDITOR</h1><p class="text-[10px] text-emerald-600">MEEditorClient Flux Codex</p>';

titleContainer.appendChild(titleIcon);
titleContainer.appendChild(titleText);

// Provider Select
const providerSelectGroup = document.createElement('div');
providerSelectGroup.className = 'flex items-center gap-1.5';

const providerLabel = document.createElement('label');
providerLabel.className = 'text-[10px] text-emerald-600 font-mono';
providerLabel.innerText = 'PROVIDER:';

const providerSelect = document.createElement('select');
providerSelect.className = 'bg-slate-900 text-emerald-300 text-[11px] px-2 py-1 rounded border border-emerald-800/80 focus:border-emerald-400 focus:outline-none cursor-pointer uppercase font-mono';

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

// Main Form Body
const formBody = document.createElement('div');
formBody.className = 'p-3 flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto bg-slate-950/90';

// --- SYSTEM PROMPT SECTION ---
const systemSection = document.createElement('div');
systemSection.className = 'flex-1 flex flex-col gap-1 min-h-[110px]';

const systemLabelRow = document.createElement('div');
systemLabelRow.className = 'flex items-center justify-between';

const systemLabel = document.createElement('label');
systemLabel.className = 'text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1';
systemLabel.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> SYSTEM_PROMPT';

const resetSystemBtn = document.createElement('button');
resetSystemBtn.type = 'button';
resetSystemBtn.className = 'text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors cursor-pointer font-mono';
resetSystemBtn.innerText = '[RESET]';

systemLabelRow.appendChild(systemLabel);
systemLabelRow.appendChild(resetSystemBtn);

const systemTextarea = document.createElement('textarea');
systemTextarea.id = 'systemPromptInput';
systemTextarea.className = 'flex-1 w-full bg-black/90 text-cyan-200 text-[11px] p-2 rounded border border-cyan-900/60 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none font-mono leading-relaxed';
systemTextarea.placeholder = 'System prompt configuration...';
systemTextarea.value = SYSTEM_PROMPT_MULTI;

resetSystemBtn.addEventListener('click', () => {
  systemTextarea.value = SYSTEM_PROMPT_MULTI;
});

systemSection.appendChild(systemLabelRow);
systemSection.appendChild(systemTextarea);

// --- TASK (USER INPUT) SECTION ---
const taskSection = document.createElement('div');
taskSection.className = 'flex-1 flex flex-col gap-1 min-h-[130px]';

const taskLabelRow = document.createElement('div');
taskLabelRow.className = 'flex items-center justify-between gap-2';

const taskLabel = document.createElement('label');
taskLabel.className = 'text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 shrink-0';
taskLabel.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> USER_TASK';

const taskControls = document.createElement('div');
taskControls.className = 'flex items-center gap-1.5 overflow-hidden';

// Tasks Presets Dropdown
const taskSelect = document.createElement('select');
taskSelect.id = 'taskPresetsSelect';
taskSelect.className = 'bg-slate-900 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800/80 focus:border-emerald-400 focus:outline-none cursor-pointer font-mono max-w-[210px] truncate';

const defaultOpt = document.createElement('option');
defaultOpt.value = '';
defaultOpt.innerText = '-- PRESET TASKS --';
taskSelect.appendChild(defaultOpt);

tasks.forEach((t, idx) => {
  const opt = document.createElement('option');
  opt.value = t.trim();
  // Short preview snippet for dropdown option
  const preview = t.trim().replace(/\s+/g, ' ');
  opt.innerText = `${idx + 1}. ${preview.length > 35 ? preview.slice(0, 35) + '...' : preview}`;
  taskSelect.appendChild(opt);
});

const clearTaskBtn = document.createElement('button');
clearTaskBtn.type = 'button';
clearTaskBtn.className = 'text-[10px] text-emerald-600 hover:text-emerald-400 transition-colors cursor-pointer font-mono shrink-0';
clearTaskBtn.innerText = '[CLEAR]';

taskControls.appendChild(taskSelect);
taskControls.appendChild(clearTaskBtn);

taskLabelRow.appendChild(taskLabel);
taskLabelRow.appendChild(taskControls);

const taskTextarea = document.createElement('textarea');
taskTextarea.id = 'taskInput';
taskTextarea.className = 'flex-1 w-full bg-black/90 text-emerald-200 text-[11px] p-2 rounded border border-emerald-900/60 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 resize-none font-mono leading-relaxed';
taskTextarea.placeholder = 'Type user task or select a preset above...';
taskTextarea.value = tasks[0];

// On selecting a task preset, populate the task textarea
taskSelect.addEventListener('change', () => {
  if (taskSelect.value) {
    taskTextarea.value = taskSelect.value;
  }
});

clearTaskBtn.addEventListener('click', () => {
  taskTextarea.value = '';
  taskSelect.value = '';
});

taskSection.appendChild(taskLabelRow);
taskSection.appendChild(taskTextarea);

// Run Button
const runBtn = document.createElement('button');
runBtn.type = 'button';
runBtn.className = 'w-full py-2 px-3 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-[0.99]';
runBtn.innerText = '▶ DISPATCH aiGenGraphCall';

// Log Container
const logSection = document.createElement('div');
logSection.className = 'border-t border-emerald-900/60 p-2.5 bg-black/60 flex flex-col gap-1.5 max-h-36 shrink-0';

const logTitle = document.createElement('div');
logTitle.className = 'text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-between';
logTitle.innerHTML = '<span>DISPATCHED_EVENTS_LOG</span><span className="text-[9px] text-emerald-700">WS STATUS: ONLINE</span>';

const logList = document.createElement('div');
logList.className = 'overflow-y-auto space-y-1.5 text-[10px] font-mono max-h-24 pr-1';
logList.innerHTML = '<p class="text-emerald-800 italic py-0.5">&gt; Ready. Click Dispatch to emit CustomEvent.</p>';

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
  logItem.className = 'p-1.5 rounded bg-slate-900/90 border border-emerald-900/80 flex flex-col gap-0.5';
  logItem.innerHTML = `
    <div class="flex items-center justify-between text-[9px]">
      <span class="text-emerald-400 font-bold uppercase">[${selectedProvider}]</span>
      <span class="text-emerald-700">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="text-emerald-200 truncate"><span class="text-emerald-600">&gt; Task:</span> ${taskValue || '(empty)'}</div>
  `;
  logList.insertBefore(logItem, logList.firstChild);

  // Quick visual feedback on button
  const originalText = runBtn.innerText;
  runBtn.innerText = '✓ DISPATCHED EVENT!';
  runBtn.className = runBtn.className.replace('bg-emerald-950', 'bg-cyan-950').replace('text-emerald-300', 'text-cyan-300').replace('border-emerald-500/60', 'border-cyan-400');
  setTimeout(() => {
    runBtn.innerText = originalText;
    runBtn.className = runBtn.className.replace('bg-cyan-950', 'bg-emerald-950').replace('text-cyan-300', 'text-emerald-300').replace('border-cyan-400', 'border-emerald-500/60');
  }, 1200);
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
rightPanel.className = 'flex-1 bg-black flex flex-col h-full overflow-hidden';

// Helper to format code/detail into iframe HTML srcdoc
function formatCodeToHTML(detail: any): string {
  let code = typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2);
  
  // Clean markdown fences if AI returns formatted code block
  code = code.replace(/```html/gi, '').replace(/```javascript/gi, '').replace(/```js/gi, '').replace(/```/g, '').trim();

  // Normalize relative matrix-engine imports to "matrix-engine-wgpu"
  code = code.replace(/import\s+MatrixEngineWGPU\s+from\s+['"]\.\.?\/src\/world\.js['"];?/g, 'import { MatrixEngineWGPU } from "matrix-engine-wgpu";');
  code = code.replace(/from\s+['"]\.\.?\/src\/[^'"]+['"]/g, 'from "matrix-engine-wgpu"');

  const importMap = `<script type="importmap">
  {
    "imports": {
      "matrix-engine-wgpu": "https://esm.sh/matrix-engine-wgpu@1.16.2"
    }
  }
  </script>`;

  // If already full HTML page
  if (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<body')) {
    if (!code.includes('type="importmap"')) {
      code = code.replace('<head>', '<head>\n' + importMap);
    }
    return code;
  }

  // Wrap JS script or output into full HTML runner template with ES module & importmap support
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI Preview</title>
  ${importMap}
  <style>
    body { margin: 0; background: #0a0e17; color: #10b981; font-family: monospace; padding: 16px; overflow: auto; }
    canvas { display: block; max-width: 100%; margin: 0 auto; }
    pre { background: #111827; padding: 12px; border-radius: 6px; border: 1px solid #1f2937; white-space: pre-wrap; word-break: break-all; }
  </style>
  <script>
    window.addEventListener('error', function(e) {
      const errBox = document.createElement('pre');
      errBox.style.color = '#f87171';
      errBox.innerText = '[EXECUTION ERROR]\\n' + (e.error?.stack || e.message);
      document.body.appendChild(errBox);
    });
    window.addEventListener('unhandledrejection', function(e) {
      const errBox = document.createElement('pre');
      errBox.style.color = '#f87171';
      errBox.innerText = '[UNHANDLED REJECTION]\\n' + (e.reason?.stack || e.reason);
      document.body.appendChild(errBox);
    });
  </script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
${code}
  </script>
</body>
</html>`;
}

// Top Bar for Iframe URL Setup
const iframeHeader = document.createElement('div');
iframeHeader.className = 'p-2 bg-slate-950 border-b border-emerald-900/60 flex items-center gap-2';

const iframeLabel = document.createElement('span');
iframeLabel.className = 'text-[10px] text-emerald-600 font-mono shrink-0';
iframeLabel.innerText = 'IFRAME_SRC:';

const iframeUrlInput = document.createElement('input');
iframeUrlInput.type = 'text';
iframeUrlInput.placeholder = 'Enter src URL or leave empty for direct AI srcdoc preview...';
iframeUrlInput.className = 'flex-1 bg-black text-emerald-300 text-[11px] px-2 py-1 rounded border border-emerald-900/60 focus:outline-none focus:border-emerald-400 font-mono';

const statusBadge = document.createElement('span');
statusBadge.className = 'text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 shrink-0';
statusBadge.innerText = 'SRCDOC: WAITING';

iframeHeader.appendChild(iframeLabel);
iframeHeader.appendChild(iframeUrlInput);
iframeHeader.appendChild(statusBadge);

// Iframe Container
const iframeWrapper = document.createElement('div');
iframeWrapper.className = 'flex-1 w-full h-full relative bg-slate-950';

const iframe = document.createElement('iframe') as HTMLIFrameElement;
iframe.id = 'previewIframe';
iframe.title = 'AI Output Preview';
iframe.className = 'w-full h-full border-0 bg-white';
iframe.src = 'about:blank';

iframeUrlInput.addEventListener('input', () => {
  if (iframeUrlInput.value.trim()) {
    iframe.removeAttribute('srcdoc');
    iframe.src = iframeUrlInput.value.trim();
    statusBadge.innerText = 'SRC URL MODE';
    statusBadge.className = 'text-[10px] text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 shrink-0';
  } else {
    iframe.src = 'about:blank';
    statusBadge.innerText = 'SRCDOC: WAITING';
    statusBadge.className = 'text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 shrink-0';
  }
});

iframeWrapper.appendChild(iframe);

// Handle 'on-ai-response' event and load code directly into iframe srcdoc
document.addEventListener('on-ai-response', (e: Event) => {
  const customEvent = e as CustomEvent<any>;
  console.log('[AI RESPONSE RECEIVED] Loading into iframe.srcdoc:', customEvent.detail);
  if (customEvent.detail !== undefined && customEvent.detail !== null) {
    const htmlContent = formatCodeToHTML(customEvent.detail);
    iframe.removeAttribute('src');
    iframe.srcdoc = htmlContent;
    
    statusBadge.innerText = 'SRCDOC LOADED ✓';
    statusBadge.className = 'text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/80 shrink-0 font-bold';
  }
});

rightPanel.appendChild(iframeHeader);
rightPanel.appendChild(iframeWrapper);

// Assemble App Layout
appContainer.appendChild(leftPanel);
appContainer.appendChild(rightPanel);
root.appendChild(appContainer);

// Helper function to get element by id
const byId = function(id: string) { return document.getElementById(id); };

// =====================================
// ASSETS POPUP MODAL
// =====================================
const assetsModal = document.createElement('div');
assetsModal.id = 'assetsModal';
assetsModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4 animate-in fade-in duration-200';

const assetsModalContent = document.createElement('div');
assetsModalContent.className = 'bg-slate-950 border border-emerald-500/60 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.2)] w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh] font-mono';

const assetsModalHeader = document.createElement('div');
assetsModalHeader.className = 'px-4 py-2.5 bg-black/90 border-b border-emerald-900/80 flex items-center justify-between shrink-0';

const assetsTitleGroup = document.createElement('div');
assetsTitleGroup.className = 'flex items-center gap-2 overflow-hidden';
assetsTitleGroup.innerHTML = `
  <span class="text-emerald-400 text-sm">📂</span>
  <div class="flex flex-col">
    <h3 class="text-xs font-bold text-emerald-300 tracking-wider uppercase">RESOURCE_ASSETS_EXPLORER</h3>
    <span id="resFolderRoot" class="text-[10px] text-emerald-600 truncate">Root: /</span>
  </div>
`;

const closeAssetsBtn = document.createElement('button');
closeAssetsBtn.type = 'button';
closeAssetsBtn.className = 'text-emerald-500 hover:text-emerald-300 font-mono text-[11px] px-2.5 py-1 rounded border border-emerald-800 hover:border-emerald-500 transition-colors cursor-pointer shrink-0';
closeAssetsBtn.innerText = '[CLOSE X]';
closeAssetsBtn.addEventListener('click', () => {
  assetsModal.classList.add('hidden');
});

assetsModalHeader.appendChild(assetsTitleGroup);
assetsModalHeader.appendChild(closeAssetsBtn);

const assetsModalBody = document.createElement('div');
assetsModalBody.className = 'p-4 overflow-y-auto flex-1 bg-slate-950/90 min-h-[160px]';

const resFolder = document.createElement('div');
resFolder.id = 'res-folder';
resFolder.className = 'grid grid-cols-2 sm:grid-cols-3 gap-2.5';
resFolder.innerHTML = '<p class="text-emerald-700 italic text-xs col-span-full py-4 text-center">&gt; Waiting for list-assets event payload...</p>';

assetsModalBody.appendChild(resFolder);
assetsModalContent.appendChild(assetsModalHeader);
assetsModalContent.appendChild(assetsModalBody);
assetsModal.appendChild(assetsModalContent);

// Close on backdrop click
assetsModal.addEventListener('click', (e) => {
  if (e.target === assetsModal) {
    assetsModal.classList.add('hidden');
  }
});

document.body.appendChild(assetsModal);

// Header button to open assets modal
const openAssetsBtn = document.createElement('button');
openAssetsBtn.type = 'button';
openAssetsBtn.className = 'text-[10px] bg-emerald-950 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900 px-2 py-1 rounded border border-emerald-700/80 hover:border-emerald-400 transition-all cursor-pointer font-mono flex items-center gap-1 shrink-0';
openAssetsBtn.innerHTML = '<span>📂</span><span>ASSETS</span>';
openAssetsBtn.addEventListener('click', () => {
  assetsModal.classList.remove('hidden');
});
providerSelectGroup.appendChild(openAssetsBtn);

document.addEventListener('list-assets', (e: any) => {
  const detail = e.detail;
  console.log(`[Code creator] Root Resource Folder: ${detail.rootFolder}`);
  const folderEl = byId('res-folder');
  const rootTextEl = byId('resFolderRoot');
  
  if (rootTextEl && detail.rootFolder) {
    rootTextEl.innerText = `Root: ${detail.rootFolder}`;
  }

  if (folderEl) {
    folderEl.setAttribute('data-root-folder', detail.rootFolder || '');
    folderEl.innerHTML = '';

    if (!detail.payload || detail.payload.length === 0) {
      folderEl.innerHTML = '<p class="text-emerald-600 italic text-xs col-span-full py-4 text-center">&gt; Directory is empty.</p>';
    } else {
      detail.payload.forEach((i: any) => {
        let item = document.createElement('div');
        item.classList.add('file-item');
        
        const ext = i.name.split('.').pop()?.toLowerCase() || '';
        
        if (i.isDir === true) {
          item.classList.add('folder');
        } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
          item.classList.add('png');
        } else if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) {
          item.classList.add('mp3');
        } else if (['js', 'ts', 'json'].includes(ext)) {
          item.classList.add('js');
        } else if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
          item.classList.add('ttf');
        } else if (['glb', 'gltf', 'obj'].includes(ext)) {
          item.classList.add('glb');
        } else {
          item.classList.add('unknown');
        }

        item.innerHTML = "<p>" + i.name + "</p>";
        folderEl.appendChild(item);

        item.addEventListener('click', () => {
          if (i.isDir === true) {
            document.dispatchEvent(new CustomEvent("nav-folder", {
              detail: {
                rootFolder: folderEl.getAttribute('data-root-folder') || "",
                name: (item.children[0] as HTMLElement)?.innerText || i.name
              }
            }));
          } else {
            document.dispatchEvent(new CustomEvent("file-detail", {
              detail: {
                rootFolder: folderEl.getAttribute('data-root-folder') || "",
                name: item.innerText
              }
            }));
          }
        });
      });

      document.querySelectorAll('.file-item').forEach(el => {
        el.addEventListener('click', () => {
          document.querySelectorAll('.file-item').forEach(x => x.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
    }

    // Unhide modal popup on list-assets event
    assetsModal.classList.remove('hidden');
  }
});


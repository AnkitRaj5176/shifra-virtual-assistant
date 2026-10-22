// ================================================
// SHIFRA VIRTUAL ASSISTANT - script.js  (clean)
// ================================================

// ── Elements ───────────────────────────────────
let btn        = document.querySelector('#btn');
let chatBox    = document.querySelector('#chat');
let chatHeader = document.querySelector('#chatHeader');
let voice      = document.querySelector('#voice');

// ── User ───────────────────────────────────────
const _cu    = JSON.parse(localStorage.getItem('shifra_current_user') || '{}');
let userName = _cu.name ? _cu.name.split(' ')[0] : 'Sir';

// ── Language ───────────────────────────────────
let currentLang = localStorage.getItem('shifra_lang') || 'en';
updateLangBtn();
document.getElementById('langToggle').addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  localStorage.setItem('shifra_lang', currentLang);
  recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
  updateLangBtn();
  speak(currentLang === 'hi' ? 'Language switched to Hindi mode.' : 'Language switched to English.');
});
function updateLangBtn() {
  const el = document.getElementById('langToggle');
  if (el) el.textContent = currentLang === 'hi' ? '🇬🇧 English' : '🇮🇳 Hindi';
}

// ── State ──────────────────────────────────────
let isListening = false;
let isSpeaking  = false;
let _greeted    = false;

// ── Voices ─────────────────────────────────────
let _voices = [];
function loadVoices() { _voices = window.speechSynthesis.getVoices(); }
loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;
function getEnglishVoice() {
  if (!_voices.length) _voices = window.speechSynthesis.getVoices();
  return _voices.find(v => v.lang === 'en-GB') ||
         _voices.find(v => v.lang === 'en-US') ||
         _voices.find(v => v.lang.startsWith('en')) ||
         _voices[0] || null;
}

// ── Speak ──────────────────────────────────────
function speak(text) {
  window.speechSynthesis.cancel();
  isSpeaking = true;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1; utter.pitch = 1; utter.volume = 1;
  const v = getEnglishVoice();
  if (v) { utter.voice = v; utter.lang = v.lang; } else { utter.lang = 'en-US'; }
  const reset = () => {
    isSpeaking = false;
    if (isListening) { try { recognition.start(); } catch(e){} }
  };
  utter.onerror = reset;
  const t = setTimeout(reset, Math.max(3000, text.length * 80));
  utter.onend = () => { clearTimeout(t); reset(); };
  window.speechSynthesis.speak(utter);
  addBubble('ai', text);
  saveChat('ai', text);
}

// ── Chat bubble ────────────────────────────────
function addBubble(sender, text) {
  chatHeader.style.display = 'flex';
  const b = document.createElement('div');
  b.className   = `chat-bubble ${sender}`;
  b.textContent = (sender === 'user' ? '🗣️ ' : '🤖 ') + text;
  chatBox.appendChild(b);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ── Save chat ──────────────────────────────────
async function saveChat(sender, message) {
  if (!token) return;
  try {
    await fetch(`${API}/chat/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sender, message }),
    });
  } catch(e) {}
}

// ── Load history ───────────────────────────────
async function loadChatHistory() {
  if (!token) return;
  try {
    const res  = await fetch(`${API}/chat/history`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success && data.chats.length > 0) {
      chatHeader.style.display = 'flex';
      data.chats.forEach(c => {
        const b = document.createElement('div');
        b.className   = `chat-bubble ${c.sender}`;
        b.textContent = (c.sender === 'user' ? '🗣️ ' : '🤖 ') + c.message;
        chatBox.appendChild(b);
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch(e) {}
}
document.getElementById('clearChatBtn').addEventListener('click', async () => {
  chatBox.innerHTML = '';
  chatHeader.style.display = 'none';
  try { await fetch(`${API}/chat/clear`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); } catch(e) {}
});
loadChatHistory();

// ── Speech Recognition ─────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SR();
recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
recognition.interimResults = false;
recognition.continuous     = false;

btn.addEventListener('click', () => {
  if (!isListening) {
    isListening = true;
    voice.style.display = 'block';
    btn.innerHTML = '<span id="content">🛑 Stop Listening</span>';
    recognition.start();
  } else {
    recognition.stop();
    isListening = false; _greeted = false;
    voice.style.display = 'none';
    btn.innerHTML = '<img src="mic.svg" alt="mic"><span id="content">Click here to talk to me</span>';
    speak(`Goodbye ${userName}!`);
  }
});

recognition.onstart = () => {
  if (!_greeted) { _greeted = true; speak(`Hello ${userName}, I am listening.`); }
};

recognition.onresult = (e) => {
  const transcript = e.results[0][0].transcript.trim();
  const lower      = transcript.toLowerCase();
  const c = document.querySelector('#content');
  if (c) c.innerText = transcript;
  addBubble('user', transcript);
  saveChat('user', transcript);
  handleCommand(lower, transcript);
};

recognition.onend = () => {
  if (isListening && !isSpeaking) {
    setTimeout(() => { if (isListening) { try { recognition.start(); } catch(e){} } }, 300);
  }
};
recognition.onerror = (e) => {
  if (e.error === 'no-speech' && isListening) { try { recognition.start(); } catch(e){} }
};

// ── Jokes ──────────────────────────────────────
const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why did the programmer quit? Because he didn't get arrays!",
  "A SQL query walks into a bar and asks two tables: Can I join you?",
  "Why do Java developers wear glasses? Because they don't C sharp!",
  "How many programmers to change a bulb? None, that's a hardware problem!",
  "I told my computer I needed a break. Now it keeps sending me vacation ads.",
  "Why was the math book sad? It had too many problems!",
  "What do you call a bear with no teeth? A gummy bear!",
];

// ── Helper ─────────────────────────────────────
function has(msg, keywords) { return keywords.some(k => msg.includes(k)); }

// ══════════════════════════════════════════════
// ── MAIN COMMAND HANDLER ──────────────────────
// RULE: All CLOSE commands checked FIRST before
//       open commands to avoid keyword conflicts
// ══════════════════════════════════════════════
function handleCommand(msg, original) {

  // ════════════════════════════════════
  // POWER COMMANDS — topmost priority
  // ════════════════════════════════════
  if (has(msg, ['shutdown laptop','shut down laptop','laptop shutdown',
                'laptop band karo','laptop band kar do','shut down my laptop'])) {
    powerAction('shutdown');
  }
  else if (has(msg, ['restart laptop','laptop restart','reboot laptop',
                     'laptop restart karo','dobara chalu karo'])) {
    powerAction('restart');
  }
  else if (has(msg, ['sleep mode','laptop sleep','put laptop to sleep',
                     'laptop so jao','suspend laptop','sleep laptop'])) {
    powerAction('sleep');
  }
  else if (has(msg, ['cancel shutdown','cancel restart','shutdown cancel',
                     'restart cancel','roklo shutdown','roklo'])) {
    powerAction('cancel');
  }

  // ════════════════════════════════════
  // CLOSE WEBSITE TABS — checked before open
  // ════════════════════════════════════
  else if (has(msg, ['close youtube',    'youtube band']))   { closeWin('youtube',      'YouTube');         }
  else if (has(msg, ['close google',     'google band']))    { closeWin('google',        'Google');          }
  else if (has(msg, ['close whatsapp',   'whatsapp band']))  { closeWin('whatsapp',      'WhatsApp');        }
  else if (has(msg, ['close gmail',      'gmail band']))     { closeWin('gmail',         'Gmail');           }
  else if (has(msg, ['close github',     'github band']))    { closeWin('github',        'GitHub');          }
  else if (has(msg, ['close facebook',   'facebook band']))  { closeWin('facebook',      'Facebook');        }
  else if (has(msg, ['close instagram',  'instagram band'])) { closeWin('instagram',     'Instagram');       }
  else if (has(msg, ['close twitter',    'twitter band']))   { closeWin('twitter',       'Twitter');         }
  else if (has(msg, ['close linkedin',   'linkedin band']))  { closeWin('linkedin',      'LinkedIn');        }
  else if (has(msg, ['close netflix',    'netflix band']))   { closeWin('netflix',       'Netflix');         }
  else if (has(msg, ['close amazon',     'amazon band']))    { closeWin('amazon',        'Amazon');          }
  else if (has(msg, ['close flipkart',   'flipkart band']))  { closeWin('flipkart',      'Flipkart');        }
  else if (has(msg, ['close maps',       'maps band']))      { closeWin('maps',          'Google Maps');     }
  else if (has(msg, ['close news',       'news band']))      { closeWin('news',          'Google News');     }
  else if (has(msg, ['close weather',    'weather band','mausam band'])) { closeWin('weather','Weather');   }
  else if (has(msg, ['close chatgpt',    'chatgpt band']))   { closeWin('chatgpt',       'ChatGPT');         }
  else if (has(msg, ['close translate',  'translate band'])) { closeWin('translate',     'Google Translate');}
  else if (has(msg, ['close drive',      'drive band']))     { closeWin('drive',         'Google Drive');    }
  else if (has(msg, ['close docs',       'docs band']))      { closeWin('docs',          'Google Docs');     }
  else if (has(msg, ['close sheets',     'sheets band']))    { closeWin('sheets',        'Google Sheets');   }
  else if (has(msg, ['close meet',       'meet band']))      { closeWin('meet',          'Google Meet');     }
  else if (has(msg, ['close reddit',     'reddit band']))    { closeWin('reddit',        'Reddit');          }
  else if (has(msg, ['close stackoverflow','stackoverflow band','close stack overflow'])) { closeWin('stackoverflow','Stack Overflow'); }
  else if (has(msg, ['close twitch',     'twitch band']))    { closeWin('twitch',        'Twitch');          }
  else if (has(msg, ['close pinterest',  'pinterest band'])) { closeWin('pinterest',     'Pinterest');       }
  else if (has(msg, ['close songs','stop songs','gaana band','music band'])) { closeWin('songs','Songs');   }
  else if (has(msg, ['close zoom',       'zoom band']))      { closeWin('zoomweb',       'Zoom');            }

  // ════════════════════════════════════
  // CLOSE LAPTOP APPS
  // ════════════════════════════════════
  else if (has(msg, ['close notepad',      'notepad band']))      { closeApp('notepad');      }
  else if (has(msg, ['close calculator',   'calculator band']))   { closeApp('calculator');   }
  else if (has(msg, ['close paint',        'paint band']))        { closeApp('paint');        }
  else if (has(msg, ['close wordpad',      'wordpad band']))      { closeApp('wordpad');      }
  else if (has(msg, ['close task manager', 'task manager band'])) { closeApp('task manager'); }
  else if (has(msg, ['close snipping',     'snipping band']))     { closeApp('snipping');     }
  else if (has(msg, ['close camera',       'camera band']))       { closeApp('camera');       }
  else if (has(msg, ['close file explorer','explorer band']))     { closeApp('file explorer');}
  else if (has(msg, ['close cmd',          'cmd band']))          { closeApp('cmd');          }
  else if (has(msg, ['close powershell',   'powershell band']))   { closeApp('powershell');   }
  else if (has(msg, ['close vs code','close vscode','vs code band','vscode band'])) { closeApp('vs code'); }
  else if (has(msg, ['close word',         'word band']))         { closeApp('word');         }
  else if (has(msg, ['close excel',        'excel band']))        { closeApp('excel');        }
  else if (has(msg, ['close powerpoint',   'powerpoint band']))   { closeApp('powerpoint');   }
  else if (has(msg, ['close vlc',          'vlc band']))          { closeApp('vlc');          }
  else if (has(msg, ['close spotify',      'spotify band']))      { closeApp('spotify');      }
  else if (has(msg, ['close chrome',       'chrome band']))       { closeApp('chrome');       }
  else if (has(msg, ['close firefox',      'firefox band']))      { closeApp('firefox');      }
  else if (has(msg, ['close edge',         'edge band']))         { closeApp('edge');         }
  else if (has(msg, ['close teams',        'teams band']))        { closeApp('teams');        }
  else if (has(msg, ['close skype',        'skype band']))        { closeApp('skype');        }

  // ════════════════════════════════════
  // GREETINGS & GENERAL
  // ════════════════════════════════════
  else if (has(msg, ['hello','hey','hi','नमस्ते','हेलो','हाय','namaste'])) {
    speak(`Hello ${userName}! How can I help you?`);
  }
  else if (has(msg, ['how are you','kaise ho','kaisi ho','kya haal','haal','theek ho'])) {
    speak(`I am doing great ${userName}! How can I assist you?`);
  }
  else if (has(msg, ['who are you','tum kaun','aap kaun','your name','tumhara naam'])) {
    speak(`I am Shifra, your personal virtual assistant!`);
  }
  else if (has(msg, ['my name','mera naam','what is my name'])) {
    speak(`Your name is ${userName}.`);
  }
  else if (has(msg, ['thank you','thanks','shukriya','dhanyawad','शुक्रिया','धन्यवाद'])) {
    speak(`You are welcome ${userName}!`);
  }
  else if (has(msg, ['joke','tell me a joke','funny','mazak','hansao'])) {
    speak(jokes[Math.floor(Math.random() * jokes.length)]);
  }

  // ════════════════════════════════════
  // CALCULATOR
  // ════════════════════════════════════
  else if (has(msg, ['calculate','what is','plus','minus','times','divided','multiply','add','subtract','kitna hai'])) {
    handleCalculation(msg);
  }

  // ════════════════════════════════════
  // WIKIPEDIA
  // ════════════════════════════════════
  else if (has(msg, ['wikipedia','wiki'])) {
    const q = msg.replace(/search|wikipedia|wiki|for/g,'').trim();
    if (q) { speak(`Searching Wikipedia for ${q}.`); window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`, '_blank'); }
    else speak(`What should I search on Wikipedia?`);
  }

  // ════════════════════════════════════
  // OPEN WEBSITES
  // ════════════════════════════════════
  else if (has(msg, ['open youtube','youtube kholo','youtube chalao'])) { openWin('youtube','https://www.youtube.com','YouTube'); }
  else if (has(msg, ['open google','google kholo']))                    { openWin('google','https://www.google.com','Google'); }
  else if (has(msg, ['open whatsapp','whatsapp kholo']))                { openWin('whatsapp','https://web.whatsapp.com','WhatsApp'); }
  else if (has(msg, ['open gmail','gmail kholo']))                      { openWin('gmail','https://mail.google.com','Gmail'); }
  else if (has(msg, ['open github','github kholo']))                    { openWin('github','https://github.com','GitHub'); }
  else if (has(msg, ['open facebook','facebook kholo']))                { openWin('facebook','https://www.facebook.com','Facebook'); }
  else if (has(msg, ['open instagram','instagram kholo']))              { openWin('instagram','https://www.instagram.com','Instagram'); }
  else if (has(msg, ['open twitter','open x','twitter kholo']))        { openWin('twitter','https://www.twitter.com','Twitter'); }
  else if (has(msg, ['open linkedin','linkedin kholo']))                { openWin('linkedin','https://www.linkedin.com','LinkedIn'); }
  else if (has(msg, ['open netflix','netflix kholo']))                  { openWin('netflix','https://www.netflix.com','Netflix'); }
  else if (has(msg, ['open amazon','amazon kholo']))                    { openWin('amazon','https://www.amazon.in','Amazon'); }
  else if (has(msg, ['open flipkart','flipkart kholo']))                { openWin('flipkart','https://www.flipkart.com','Flipkart'); }
  else if (has(msg, ['open maps','open google maps','maps dikhaao']))   { openWin('maps','https://maps.google.com','Google Maps'); }
  else if (has(msg, ['open news','latest news','aaj ki khabar']))       { openWin('news','https://news.google.com','Google News'); }
  else if (has(msg, ['open weather','show weather','mausam dikhaao'])) { openWin('weather','https://www.google.com/search?q=weather+today','Weather'); }
  else if (has(msg, ['open chatgpt','open chat gpt']))                  { openWin('chatgpt','https://chat.openai.com','ChatGPT'); }
  else if (has(msg, ['open translate','google translate']))             { openWin('translate','https://translate.google.com','Google Translate'); }
  else if (has(msg, ['open drive','google drive']))                     { openWin('drive','https://drive.google.com','Google Drive'); }
  else if (has(msg, ['open docs','google docs']))                       { openWin('docs','https://docs.google.com','Google Docs'); }
  else if (has(msg, ['open sheets','google sheets']))                   { openWin('sheets','https://sheets.google.com','Google Sheets'); }
  else if (has(msg, ['open meet','google meet']))                       { openWin('meet','https://meet.google.com','Google Meet'); }
  else if (has(msg, ['open zoom','zoom kholo']))                        { openWin('zoomweb','https://zoom.us/join','Zoom'); }
  else if (has(msg, ['open reddit','reddit kholo']))                    { openWin('reddit','https://www.reddit.com','Reddit'); }
  else if (has(msg, ['open stackoverflow','open stack overflow']))      { openWin('stackoverflow','https://stackoverflow.com','Stack Overflow'); }
  else if (has(msg, ['open twitch','twitch kholo']))                    { openWin('twitch','https://www.twitch.tv','Twitch'); }
  else if (has(msg, ['open pinterest','pinterest kholo']))              { openWin('pinterest','https://www.pinterest.com','Pinterest'); }
  else if (has(msg, ['play songs','play music','gaana chalao']))        { openWin('songs','https://www.youtube.com/watch?v=-FGYMkL_u-g&list=RD-FGYMkL_u-g','Songs'); }
  else if (has(msg, ['weather','mausam']))                              { openWin('weather','https://www.google.com/search?q=weather+today','Weather'); }

  // ════════════════════════════════════
  // OPEN LAPTOP APPS
  // ════════════════════════════════════
  else if (has(msg, ['open notepad',      'notepad kholo']))      { openApp('notepad');      }
  else if (has(msg, ['open calculator',   'calculator kholo']))   { openApp('calculator');   }
  else if (has(msg, ['open paint',        'paint kholo']))        { openApp('paint');        }
  else if (has(msg, ['open wordpad',      'wordpad kholo']))      { openApp('wordpad');      }
  else if (has(msg, ['open task manager', 'task manager kholo'])) { openApp('task manager'); }
  else if (has(msg, ['open snipping tool','snipping tool','screenshot'])) { openApp('snipping'); }
  else if (has(msg, ['open camera',       'camera kholo']))       { openApp('camera');       }
  else if (has(msg, ['open settings',     'settings kholo']))     { openApp('settings');     }
  else if (has(msg, ['open file explorer','file explorer','explorer kholo'])) { openApp('file explorer'); }
  else if (has(msg, ['open cmd',          'command prompt']))     { openApp('cmd');          }
  else if (has(msg, ['open powershell',   'powershell kholo']))   { openApp('powershell');   }
  else if (has(msg, ['open vs code','open vscode','visual studio code'])) { openApp('vs code'); }
  else if (has(msg, ['open word',         'ms word']))            { openApp('word');         }
  else if (has(msg, ['open excel',        'ms excel']))           { openApp('excel');        }
  else if (has(msg, ['open powerpoint',   'ms powerpoint']))      { openApp('powerpoint');   }
  else if (has(msg, ['open vlc',          'vlc player']))         { openApp('vlc');          }
  else if (has(msg, ['open spotify',      'spotify kholo']))      { openApp('spotify');      }
  else if (has(msg, ['open chrome',       'google chrome']))      { openApp('chrome');       }
  else if (has(msg, ['open firefox',      'mozilla firefox']))    { openApp('firefox');      }
  else if (has(msg, ['open edge',         'microsoft edge']))     { openApp('edge');         }
  else if (has(msg, ['open teams',        'microsoft teams']))    { openApp('teams');        }
  else if (has(msg, ['open skype',        'skype kholo']))        { openApp('skype');        }

  // ════════════════════════════════════
  // TIME & DATE
  // ════════════════════════════════════
  else if (has(msg, ['time','samay','kitne baj','what time','टाइम'])) {
    speak(`The current time is ${new Date().toLocaleTimeString('en-IN')}.`);
  }
  else if (has(msg, ['date','tareekh','aaj ka din','what date','तारीख'])) {
    speak(`Today is ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}.`);
  }

  // ════════════════════════════════════
  // STOP LISTENING
  // ════════════════════════════════════
  else if (has(msg, ['stop listening','shifra stop','shifra band','sunna band','bye shifra','goodbye shifra'])) {
    isListening = false; _greeted = false;
    try { recognition.stop(); } catch(e) {}
    voice.style.display = 'none';
    btn.innerHTML = '<img src="mic.svg" alt="mic"><span id="content">Click here to talk to me</span>';
    speak(`Okay ${userName}, I stopped. Click the button whenever you need me.`);
  }

  // ════════════════════════════════════
  // FALLBACK — Google search
  // ════════════════════════════════════
  else {
    speak(`Searching Google for: ${original}`);
    setTimeout(() => { window.open(`https://www.google.com/search?q=${encodeURIComponent(original)}`, '_blank'); }, 1800);
  }
}

// ── Tab command via backend + extension ────────
async function tabCommand(action, key, url, name) {

  // In Electron — open/close in default browser via shell
  if (typeof IS_ELECTRON !== 'undefined' && IS_ELECTRON) {
    if (action === 'openTab') {
      // Ask backend to open URL via shell command
      try {
        const res  = await fetch(`${API}/launcher/openurl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url, name }),
        });
        const data = await res.json();
        speak(data.message || `Opening ${name}.`);
      } catch(e) {
        speak(`Opening ${name}.`);
      }
    } else {
      // close — use tabs backend (extension still works in Chrome)
      try {
        const res  = await fetch(`${API}/tabs/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, key, url, name }),
        });
        const data = await res.json();
        speak(data.message || `${name} closed.`);
      } catch(e) {
        speak(`${name} closed.`);
      }
    }
    return;
  }

  // In Browser — use extension polling
  try {
    const res  = await fetch(`${API}/tabs/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, key, url, name }),
    });
    const data = await res.json();
    speak(data.message || (action === 'openTab' ? `Opening ${name}.` : `${name} closed.`));
  } catch(e) {
    speak(`Backend error. Make sure the server is running.`);
  }
}

function openWin(key, url, name) { tabCommand('openTab',  key, url,  name); }
function closeWin(key, name)      { tabCommand('closeTab', key, null, name); }

// ── Open laptop app ────────────────────────────
async function openApp(appName) {
  speak(`Opening ${appName}.`);
  try {
    const res  = await fetch(`${API}/launcher/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ app: appName }),
    });
    const data = await res.json();
    if (!res.ok) speak(`Could not open ${appName}. ${data.message || ''}`);
  } catch(e) { speak(`Backend not reachable.`); }
}

// ── Close laptop app ───────────────────────────
async function closeApp(appName) {
  speak(`Closing ${appName}.`);
  try {
    const res  = await fetch(`${API}/launcher/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ app: appName }),
    });
    const data = await res.json();
    if (!res.ok) speak(`${appName} is not running or could not be closed.`);
  } catch(e) { speak(`Backend not reachable.`); }
}

// ── Power command ──────────────────────────────
async function powerAction(action) {
  const confirmMsgs = {
    shutdown: `Okay ${userName}, shutting down your laptop in 10 seconds. Say cancel shutdown to stop it.`,
    restart:  `Okay ${userName}, restarting your laptop in 10 seconds. Say cancel restart to stop it.`,
    sleep:    `Okay ${userName}, putting your laptop to sleep.`,
    cancel:   `Shutdown or restart has been cancelled.`,
  };
  speak(confirmMsgs[action] || `Executing ${action}.`);
  try {
    const res  = await fetch(`${API}/launcher/power`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) speak(`Could not ${action} the laptop. ${data.message || ''}`);
  } catch(e) { speak(`Backend not reachable.`); }
}

// ── Calculator ─────────────────────────────────
function handleCalculation(msg) {
  let expr = msg
    .replace(/calculate|what is|kitna hai/gi, '')
    .replace(/plus|aur/gi, '+').replace(/minus/gi, '-')
    .replace(/times|multiplied by|multiply/gi, '*')
    .replace(/divided by|divide/gi, '/')
    .trim();
  if (/^[\d\s\+\-\*\/\.\(\)\%]+$/.test(expr)) {
    try {
      const r = Function('"use strict"; return (' + expr + ')')();
      if (!isFinite(r)) throw new Error();
      speak(`The answer is ${r}.`);
    } catch { speak(`Sorry, I could not calculate that.`); }
  } else { speak(`Please say a calculation like: what is 5 plus 3`); }
}

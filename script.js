const PORTFOLIO_CONFIG = {
  email: "ywm062005@gmail.com",
  github: "https://github.com/yashie-w06",
  linkedin: "https://www.linkedin.com/in/yashwardhan-markam-ba7404363/"
};

const appTitles = {
  welcome: "WELCOME.EXE",
  about: "ABOUT_ME.SYS",
  projects: "PROJECTS",
  skills: "TERMINAL",
  journey: "JOURNEY.LOG",
  contact: "CONTACT",
  readme: "README.txt"
};

const desktop = document.getElementById("desktop");
const boot = document.getElementById("boot");
const taskButtons = document.getElementById("taskButtons");
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
const contextMenu = document.getElementById("contextMenu");
const toast = document.getElementById("toast");
const terminalForm = document.getElementById("terminalForm");
const terminalInput = document.getElementById("terminalCommand");
const terminalOutput = document.getElementById("terminalOutput");

let topZ = 20;
let soundEnabled = true;
let audioContext;
let toastTimer;

function getWindow(name) {
  return document.querySelector(`[data-window="${name}"]`);
}

function beep(frequency = 440, duration = 35) {
  if (!soundEnabled) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "square";
    gain.gain.setValueAtTime(0.025, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch {
    soundEnabled = false;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function closeMenus() {
  startMenu.hidden = true;
  contextMenu.hidden = true;
  startButton.classList.remove("open");
  startButton.setAttribute("aria-expanded", "false");
}

function focusWindow(win) {
  if (!win) return;
  document.querySelectorAll(".window").forEach(item => item.classList.toggle("inactive", item !== win));
  win.style.zIndex = String(++topZ);
  taskButtons.querySelectorAll(".task-button").forEach(button => {
    button.classList.toggle("pressed", button.dataset.task === win.dataset.window);
  });
}

function ensureTaskButton(name) {
  let button = taskButtons.querySelector(`[data-task="${name}"]`);
  if (button) return button;

  button = document.createElement("button");
  button.className = "task-button";
  button.dataset.task = name;
  button.textContent = `[] ${appTitles[name]}`;
  button.addEventListener("click", () => {
    const win = getWindow(name);
    if (!win) return;

    if (win.classList.contains("open") && button.classList.contains("pressed")) {
      minimizeWindow(win);
    } else {
      win.classList.add("open");
      focusWindow(win);
    }
    beep(300);
  });
  taskButtons.appendChild(button);
  return button;
}

function openWindow(name) {
  const win = getWindow(name);
  if (!win) return;

  win.classList.add("open");
  ensureTaskButton(name);
  focusWindow(win);
  closeMenus();
  beep(520);

  if (name === "skills") {
    setTimeout(() => terminalInput.focus(), 30);
  }
}

function closeWindow(win) {
  const name = win.dataset.window;
  win.classList.remove("open", "active", "maximized");
  taskButtons.querySelector(`[data-task="${name}"]`)?.remove();
  const nextWindow = [...document.querySelectorAll(".window.open")].pop();
  if (nextWindow) focusWindow(nextWindow);
  beep(220);
}

function minimizeWindow(win) {
  win.classList.remove("open", "active");
  taskButtons.querySelector(`[data-task="${win.dataset.window}"]`)?.classList.remove("pressed");
  const nextWindow = [...document.querySelectorAll(".window.open")].pop();
  if (nextWindow) focusWindow(nextWindow);
  beep(280);
}

function toggleMaximize(win) {
  win.classList.toggle("maximized");
  win.classList.add("moved");
  focusWindow(win);
  beep(390);
}

function bindOpenControls() {
  document.querySelectorAll("[data-open]").forEach(button => {
    const name = button.dataset.open;
    const isDesktopIcon = button.classList.contains("desktop-icon");

    button.addEventListener("click", () => {
      if (!isDesktopIcon || matchMedia("(pointer: coarse)").matches) {
        openWindow(name);
      }
    });

    if (isDesktopIcon) {
      button.addEventListener("dblclick", () => openWindow(name));
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openWindow(name);
        }
      });
    }
  });
}

function bindWindowControls() {
  document.querySelectorAll(".window").forEach(win => {
    win.addEventListener("pointerdown", () => focusWindow(win));
    win.querySelector("[data-close]").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      closeWindow(win);
    });
    win.querySelector("[data-minimize]").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      minimizeWindow(win);
    });
    win.querySelector("[data-maximize]").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      toggleMaximize(win);
    });
    win.querySelector("[data-drag-handle]").addEventListener("dblclick", () => toggleMaximize(win));
  });
}

function bindDragging() {
  document.querySelectorAll("[data-drag-handle]").forEach(handle => {
    let dragState = null;

    handle.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      if (event.target.closest(".window-controls")) return;
      const win = handle.closest(".window");
      if (win.classList.contains("maximized") || matchMedia("(max-width: 720px)").matches) return;

      event.preventDefault();
      const rect = win.getBoundingClientRect();
      dragState = {
        win,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width
      };
      win.classList.add("moved");
      handle.setPointerCapture(event.pointerId);
    });

    handle.addEventListener("pointermove", event => {
      if (!dragState) return;

      const maxX = window.innerWidth - 120;
      const maxY = window.innerHeight - 70;
      const minX = -dragState.width + 120;
      dragState.win.style.left = `${Math.max(minX, Math.min(maxX, event.clientX - dragState.offsetX))}px`;
      dragState.win.style.top = `${Math.max(0, Math.min(maxY, event.clientY - dragState.offsetY))}px`;
      dragState.win.style.setProperty("--x", "0px");
      dragState.win.style.setProperty("--y", "0px");
    });

    handle.addEventListener("pointerup", () => {
      dragState = null;
    });

    handle.addEventListener("lostpointercapture", () => {
      dragState = null;
    });
  });
}

function bindMenus() {
  startButton.addEventListener("click", event => {
    event.stopPropagation();
    startMenu.hidden = !startMenu.hidden;
    contextMenu.hidden = true;
    startButton.classList.toggle("open", !startMenu.hidden);
    startButton.setAttribute("aria-expanded", String(!startMenu.hidden));
    beep(360);
  });

  document.addEventListener("pointerdown", event => {
    if (!startMenu.contains(event.target) && event.target !== startButton) {
      startMenu.hidden = true;
      startButton.classList.remove("open");
      startButton.setAttribute("aria-expanded", "false");
    }
    if (!contextMenu.contains(event.target)) {
      contextMenu.hidden = true;
    }
  });

  desktop.addEventListener("contextmenu", event => {
    if (event.target.closest(".window, .taskbar")) return;
    event.preventDefault();
    contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 155)}px`;
    contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 150)}px`;
    contextMenu.hidden = false;
    startMenu.hidden = true;
    startButton.classList.remove("open");
  });

  document.getElementById("contextRefresh").addEventListener("click", () => {
    closeMenus();
    showToast("Desktop refreshed.");
    beep(610);
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    closeMenus();
    document.querySelectorAll(".window").forEach(win => {
      if (win.dataset.window !== "welcome") closeWindow(win);
    });
    boot.classList.remove("done");
    setTimeout(() => {
      boot.classList.add("done");
      openWindow("welcome");
    }, 1100);
  });
}

function bindProjects() {
  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(item => item.classList.toggle("selected", item === button));

      let visible = 0;
      document.querySelectorAll(".project-card").forEach(card => {
        const shouldHide = filter !== "all" && card.dataset.category !== filter;
        card.hidden = shouldHide;
        if (!shouldHide) visible++;
      });

      document.getElementById("projectCount").textContent = `${visible} object(s)`;
      beep(430);
    });
  });
}

function bindContact() {
  document.querySelectorAll("[data-contact]").forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.contact;
      const value = PORTFOLIO_CONFIG[type];

      if (!value || value.includes("your.") || value.includes("your-")) {
        showToast(`Add your ${type} link at the top of script.js first.`);
        return;
      }

      window.open(type === "email" ? `mailto:${value}` : value, "_blank", "noopener,noreferrer");
    });
  });
}

function bindTerminal() {
  const commands = {
    help: "Available: about, projects, skills, contact, whoami, date, clear",
    about: "B.Tech IT student at SGSITS Indore.",
    projects: "check the projects window for a list of my work.",
    skills: "TypeScript,JavaScript, Java, C, Next.js, Spring Boot, SQL, Git",
    contact: "Open contact.wav from the desktop or Start menu.",
    whoami: "yashwardhan - Information Technology student at SGSITS Indore, India.",
    date: () => new Date().toString()
  };

  terminalForm.addEventListener("submit", event => {
    event.preventDefault();
    const command = terminalInput.value.trim().toLowerCase();
    if (!command) return;

    if (command === "clear") {
      terminalOutput.innerHTML = "<p>Terminal cleared. Type <b>help</b> for commands.</p>";
      terminalInput.value = "";
      beep(490);
      return;
    }

    const promptLine = document.createElement("p");
    promptLine.textContent = `C:\\YASH\\PORTFOLIO> ${command}`;
    promptLine.className = "accent";
    terminalOutput.appendChild(promptLine);

    const result = commands[command];
    const response = document.createElement("p");
    response.textContent = result ? (typeof result === "function" ? result() : result) : `'${command}' is not recognized. Type help.`;
    if (!result) response.className = "error";
    terminalOutput.appendChild(response);

    terminalInput.value = "";
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    beep(result ? 490 : 180);
  });
}

function updateClock() {
  document.getElementById("clock").textContent = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function bootDesktop() {
  ensureTaskButton("welcome");
  focusWindow(getWindow("welcome"));
  setTimeout(() => boot.classList.add("done"), 1050);
}

bindOpenControls();
bindWindowControls();
bindDragging();
bindMenus();
bindProjects();
bindContact();
bindTerminal();
updateClock();
setInterval(updateClock, 30000);

document.getElementById("soundButton").addEventListener("click", event => {
  soundEnabled = !soundEnabled;
  event.currentTarget.classList.toggle("muted", !soundEnabled);
  event.currentTarget.setAttribute("aria-label", soundEnabled ? "Mute sound effects" : "Enable sound effects");
  if (soundEnabled) beep(680);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenus();
});

window.addEventListener("load", bootDesktop);

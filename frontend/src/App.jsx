import { useCallback, useEffect, useState } from "react";
import useLocalStorage from "./hooks/useLocalStorage.js";
import { getUsage } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import BulletImprover from "./components/BulletImprover.jsx";
import InterviewGenerator from "./components/InterviewGenerator.jsx";
import AnswerChecker from "./components/AnswerChecker.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import Toast from "./components/Toast.jsx";

const HISTORY_LIMIT = 20;
const REVISION_LIMIT = 30;

const HEADINGS = {
  bullets: ["Make your resume bullets stronger", "Paste a weak bullet and get 3 sharper rewrites for your target role."],
  interview: ["Practise real interview questions", "Get 5 questions with short hints, then save the hard ones for revision."],
  checker: ["Check your interview answer", "Write an answer and get a score, feedback and a stronger outline."],
};

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function App() {
  const [tab, setTab] = useState("home");
  const [theme, setTheme] = useLocalStorage("ppk_theme", prefersDark() ? "dark" : "light");
  const [storedHistory, setHistory] = useLocalStorage("ppk_history", []);
  const [storedRevision, setRevision] = useLocalStorage("ppk_revision", []);
  const [usage, setUsage] = useState({ remaining: null, limit: 10 });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reuse, setReuse] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [toast, setToast] = useState(null);

  // Guard against damaged values in localStorage
  const history = asArray(storedHistory);
  const revision = asArray(storedRevision);

  // Apply the theme using Bootstrap's data-bs-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme === "dark" ? "dark" : "light");
  }, [theme]);

  // Read the usage count on page load
  useEffect(() => {
    getUsage()
      .then((u) => setUsage({ remaining: u.remaining, limit: u.limit }))
      .catch(() => {}); // the counter just shows "-" if the backend is down
  }, []);

  const notify = useCallback((text) => setToast({ text, id: Date.now() }), []);
  const closeToast = useCallback(() => setToast(null), []);
  const updateRemaining = useCallback((remaining) => setUsage((u) => ({ ...u, remaining })), []);

  const saveToHistory = useCallback(
    (entry) => setHistory((h) => [entry, ...asArray(h)].slice(0, HISTORY_LIMIT)),
    [setHistory]
  );

  // Add a question to the revision list, or remove it if it is already there
  const toggleRevise = (item) => {
    const exists = revision.some((r) => r.question === item.question);
    setRevision(
      exists ? revision.filter((r) => r.question !== item.question) : [item, ...revision].slice(0, REVISION_LIMIT)
    );
    notify(exists ? "Removed from revision list" : "Saved to revision list");
  };

  const openWithBullet = (entry) => {
    setReuse({ ...entry, nonce: Date.now() }); // new object every time, so the form refills
    setTab("bullets");
  };

  const practise = (data) => {
    setPrefill({ ...data, nonce: Date.now() });
    setTab("checker");
  };

  return (
    <>
      <Navbar
        tab={tab}
        onTabChange={setTab}
        remaining={usage.remaining}
        limit={usage.limit}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onOpenHistory={() => setHistoryOpen(true)}
        historyCount={history.length}
      />

      <main className="container py-4">
        {tab !== "home" && (
          <div className="mb-4">
            <h1 className="h3 fw-bold mb-1">{HEADINGS[tab][0]}</h1>
            <p className="text-secondary mb-0">{HEADINGS[tab][1]}</p>
          </div>
        )}

        {/* All screens stay mounted so switching tabs does not erase your work */}
        <div hidden={tab !== "home"}>
          <Home
            remaining={usage.remaining}
            limit={usage.limit}
            onOpen={setTab}
            onUseExample={(demo) => openWithBullet({ original: demo.before, role: demo.role })}
          />
        </div>
        <div hidden={tab !== "bullets"}>
          <BulletImprover reuse={reuse} onRemaining={updateRemaining} onSave={saveToHistory} notify={notify} />
        </div>
        <div hidden={tab !== "interview"}>
          <InterviewGenerator
            onRemaining={updateRemaining}
            revision={revision}
            onToggleRevise={toggleRevise}
            onPractice={practise}
          />
        </div>
        <div hidden={tab !== "checker"}>
          <AnswerChecker prefill={prefill} onRemaining={updateRemaining} />
        </div>
      </main>

      <HistoryPanel
        show={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onReuse={openWithBullet}
        onClear={() => setHistory([])}
      />

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}

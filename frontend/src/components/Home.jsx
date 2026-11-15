import { useState } from "react";
import useTypewriter from "../hooks/useTypewriter.js";
import Icon from "./Icon.jsx";

const DEMOS = [
  {
    label: "Frontend",
    role: "Frontend Developer",
    before: "Made a website for the college fest",
    beforeScore: 2,
    after: "Built a responsive fest website in [tech stack] with [N] event pages for [N] attendees.",
    afterScore: 9,
  },
  {
    label: "Backend",
    role: "Backend Developer",
    before: "Worked on an API for our project",
    beforeScore: 2,
    after: "Designed and built [N] REST endpoints in [tech stack] used by [N] team members.",
    afterScore: 8,
  },
  {
    label: "Data",
    role: "Data Analyst",
    before: "Did analysis of sales data",
    beforeScore: 3,
    after: "Analysed [N] months of sales data in [tool] to find [N] trends for the [team] team.",
    afterScore: 8,
  },
];

const TOOLS = [
  { id: "bullets", icon: "bullets", tint: "#8b7cff", title: "Bullet Improver", text: "Turn a vague bullet into 3 sharper versions with strength scores." },
  { id: "interview", icon: "interview", tint: "#4f9bff", title: "Interview Questions", text: "Get 5 questions on any topic, open the hints, and save the ones to revise." },
  { id: "checker", icon: "checker", tint: "#2dc7b0", title: "Answer Checker", text: "Type your answer to a question and get a score, feedback and a stronger outline." },
];

export default function Home({ remaining, limit, onOpen, onUseExample }) {
  const [index, setIndex] = useState(0);
  const demo = DEMOS[index];
  const typed = useTypewriter(demo.after);
  const done = typed.length === demo.after.length;

  return (
    <div>
      <div className="row g-4 align-items-center hero">
        <div className="col-lg-6">
          <span className="hero-badge"><Icon name="sparkle" size={14} /> Your personal placement copilot</span>
          <h1 className="hero-title">
            Make every bullet and every answer <span className="grad-text">placement-ready.</span>
          </h1>
          <p className="hero-lead text-secondary">
            Improve resume bullets, practise interview questions, and get your own answers checked. Free to use, all in one place.
          </p>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-accent btn-lg-soft" onClick={() => onOpen("bullets")}>
              <Icon name="sparkle" size={16} /> Improve a bullet
            </button>
            <button className="btn btn-glass btn-lg-soft" onClick={() => onOpen("interview")}>
              <Icon name="interview" size={16} /> Practise questions
            </button>
          </div>
          <p className="small text-secondary mb-0 d-flex align-items-center gap-1">
            <Icon name="bolt" size={14} /> You have {remaining ?? "-"} of {limit} AI requests left today.
          </p>
        </div>

        <div className="col-lg-6">
          <div className="card tool-card demo-card">
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Choose an example">
                {DEMOS.map((d, i) => (
                  <button
                    key={d.label}
                    className={`btn btn-sm rounded-pill demo-chip ${i === index ? "active" : ""}`}
                    aria-pressed={i === index}
                    onClick={() => setIndex(i)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <p className="small text-secondary mb-1">Before ({demo.beforeScore}/10)</p>
              <p className="demo-before mb-3">{demo.before}</p>

              <p className="small text-secondary mb-1">After ({done ? `${demo.afterScore}/10` : "writing..."})</p>
              <p className="demo-after mb-2" aria-live="polite">
                {typed}
                {!done && <span className="caret" aria-hidden="true"></span>}
              </p>
              <div className="progress mb-3" style={{ height: "8px" }}>
                <div className="progress-bar bar-accent demo-bar" style={{ width: done ? `${demo.afterScore * 10}%` : "0%" }}></div>
              </div>

              <button className="btn btn-sm btn-glass" onClick={() => onUseExample(demo)}>
                <Icon name="sparkle" size={14} /> Try this on my own bullet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-4">
        {TOOLS.map((t) => (
          <div className="col-md-4" key={t.id}>
            <div className="card tool-card tool-tile h-100" style={{ "--tint": t.tint }}>
              <div className="card-body d-flex flex-column">
                <span className="tile-icon"><Icon name={t.icon} size={22} /></span>
                <h2 className="h6 mt-3">{t.title}</h2>
                <p className="small text-secondary flex-grow-1">{t.text}</p>
                <button className="btn btn-sm btn-glass align-self-start" onClick={() => onOpen(t.id)}>
                  Open {t.title}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

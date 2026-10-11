import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3,
  Heart, LoaderCircle, MessageCircleHeart, RotateCcw, Sparkles,
  WandSparkles, X
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const emotionStyles = {
  joy: { emoji: "☀️", title: "Joy", tint: "joy" },
  love: { emoji: "💗", title: "Love", tint: "love" },
  sadness: { emoji: "🌧️", title: "Sadness", tint: "sadness" },
  anger: { emoji: "🔥", title: "Anger", tint: "anger" },
  fear: { emoji: "🌙", title: "Fear", tint: "fear" },
  surprise: { emoji: "✨", title: "Surprise", tint: "surprise" },
};

function emotionStyle(label = "") {
  const key = label.toLowerCase();
  return emotionStyles[key] || { emoji: "💜", title: label, tint: "default" };
}

const examples = [
  "I feel so grateful to have people who care about me.",
  "I can't stop worrying about what might happen tomorrow.",
  "Today has been a really wonderful day.",
];

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiReady(Boolean(data.model_ready)))
      .catch(() => setApiReady(false));
  }, []);

  const characterCount = text.length;
  const bars = useMemo(() => result?.scores?.slice(0, 5) || [], [result]);

  async function analyze(event) {
    event?.preventDefault();
    if (!text.trim()) {
      setError("Add a sentence first, and we'll explore its emotional tone.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to analyze this text.");
      setResult(data);
      setHistory((old) => [
        { text: text.trim(), emotion: data.emotion, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ...old.filter((item) => item.text !== text.trim()),
      ].slice(0, 4));
    } catch (err) {
      setError(err.message || "Could not connect to the API. Check that Flask is running.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setText("");
    setResult(null);
    setError("");
  }

  const style = emotionStyle(result?.emotion);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Feelings home">
          <span className="brand-mark"><Heart size={19} fill="currentColor" /></span>
          <span>feelings<span className="brand-dot">.</span></span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="active" href="#analyzer">Analyzer</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className={`api-status ${apiReady ? "online" : "offline"}`}>
          <span className="status-dot" />
          <span>{apiReady ? "Model connected" : "API not ready"}</span>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><Sparkles size={14} /> A little more in touch</div>
          <h1>Words carry <span>feelings.</span></h1>
          <p className="hero-copy">Sometimes it helps to pause and understand what's beneath the words. Start with a thought, and let the language tell its story.</p>
          <div className="hero-note"><span className="note-icon"><Heart size={15} /></span> A gentle space to explore your words, without judgment.</div>
        </section>

        <section className="workspace" id="analyzer">
          <div className="input-column">
            <div className="section-heading">
              <div>
                <span className="step-label">YOUR SPACE</span>
                <h2>What's on your mind?</h2>
              </div>
              <span className="number-chip">01</span>
            </div>
            <form className="input-card" onSubmit={analyze}>
              <label className="sr-only" htmlFor="thought">Enter a sentence to analyze</label>
              <textarea
                id="thought"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 5000))}
                placeholder="Write a thought, a moment, or simply how you're feeling today..."
                rows={7}
                maxLength={5000}
              />
              <div className="input-footer">
                <span className="character-count">{characterCount} / 5,000 characters</span>
                <button type="button" className="text-button" onClick={clearAll}><RotateCcw size={14} /> Clear</button>
              </div>
              <div className="input-divider" />
              <button className="analyze-button" type="submit" disabled={loading || !text.trim()}>
                {loading ? <><LoaderCircle className="spin" size={17} /> Reading your words...</> : <><WandSparkles size={17} /> Analyze emotion <ArrowUpRight size={17} /></>}
              </button>
              {error && <div className="error-message"><CircleHelp size={16} /> {error}</div>}
            </form>

            <div className="examples">
              <div className="examples-label">NEED A STARTING POINT?</div>
              {examples.map((example, i) => (
                <button key={example} className="example-pill" onClick={() => { setText(example); setError(""); }}>
                  <span className="example-number">0{i + 1}</span>{example}<ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="result-column">
            <div className="section-heading">
              <div>
                <span className="step-label">YOUR INSIGHT</span>
                <h2>The feeling behind it</h2>
              </div>
              <span className="number-chip">02</span>
            </div>

            <div className={`result-card ${result ? "has-result" : ""}`}>
              {!result ? (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="face"><span>◡</span></div>
                    <span className="float-heart">♡</span>
                    <span className="float-star">✳</span>
                  </div>
                  <h3>Your insight will appear here</h3>
                  <p>When you're ready, analyze a sentence to see the emotion our language model recognizes.</p>
                  <div className="empty-bottom"><Sparkles size={14} /> One sentence can be a good beginning.</div>
                </div>
              ) : (
                <div className="result-content">
                  <div className={`emotion-art ${style.tint}`}><span>{style.emoji}</span></div>
                  <span className="result-kicker">THE MODEL DETECTED</span>
                  <h3 className="emotion-name">{style.title}</h3>
                  <p className="result-description">This is the emotion most strongly predicted by the text classification model.</p>
                  {typeof result.score === "number" && (
                    <div className="score-panel">
                      <div className="score-header"><span>Model score</span><strong>{Math.round(result.score * 100)}%</strong></div>
                      <div className="score-track"><div style={{ width: `${Math.max(0, Math.min(100, result.score * 100))}%` }} /></div>
                      <p>Probability estimate from the model, not a clinical or psychological assessment.</p>
                    </div>
                  )}
                  {bars.length > 1 && (
                    <div className="distribution">
                      <div className="distribution-title">OTHER POSSIBLE TONES <span>MODEL SCORES</span></div>
                      {bars.map((item) => (
                        <div className="bar-row" key={item.emotion}>
                          <span>{emotionStyle(item.emotion).emoji} {item.emotion}</span>
                          <div className="mini-track"><div style={{ width: `${Math.max(0, Math.min(100, item.score * 100))}%` }} /></div>
                          <strong>{Math.round(item.score * 100)}%</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="result-disclaimer"><Heart size={14} /> Text can express more than one feeling. This is a model prediction, not a diagnosis.</div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="below-grid" id="how-it-works">
          <div className="how-card">
            <div className="mini-icon"><Activity size={18} /></div>
            <div><h3>Behind the words</h3><p>TF-IDF turns text into numerical features, and Logistic Regression predicts an emotion learned from the training dataset.</p></div>
            <ChevronDown size={16} className="muted-chevron" />
          </div>
          <div className="history-card">
            <div className="history-heading"><div><span className="step-label">RECENT ACTIVITY</span><h3>Your recent explorations</h3></div><Clock3 size={17} /></div>
            {history.length === 0 ? (
              <div className="history-empty"><MessageCircleHeart size={18} /><span>Your analyzed sentences will show up here during this session.</span></div>
            ) : (
              <div className="history-list">
                {history.map((item) => {
                  const itemStyle = emotionStyle(item.emotion);
                  return <button className="history-item" key={item.text} onClick={() => { setText(item.text); setResult(null); setError(""); }}>
                    <span className={`history-emoji ${itemStyle.tint}`}>{itemStyle.emoji}</span>
                    <span className="history-text"><strong>{item.emotion}</strong><small>{item.text}</small></span>
                    <time>{item.at}</time>
                  </button>;
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><Heart size={15} fill="currentColor" /></span><span>feelings<span className="brand-dot">.</span></span></a>
        <span>Made for reflection, not judgment.</span>
        <span className="footer-right">NLP · TF-IDF · Logistic Regression</span>
      </footer>
    </div>
  );
}

export default App;

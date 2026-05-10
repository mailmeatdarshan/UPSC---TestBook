import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend 
} from 'recharts'
import { Sun, Moon, Keyboard, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, BookOpen, Target, GraduationCap, Bookmark, BookmarkCheck } from 'lucide-react'
import './index.css'

// ─── Constants & Data ───
const YEAR_FILES = {
  2012: 'upsc2012.json', 2013: 'upsc2013.json', 2014: 'gs_prelims_2014.json',
  2015: 'upsc2015.json', 2016: 'upsc2016.json', 2017: 'upsc2017.json',
  2018: 'upsc2018.json', 2019: 'GS_Prelims_2019_Questions.json',
  2020: 'GS_Prelims_2020_Questions.json', 2021: 'GS_Prelims_2021_Questions.json',
  2022: 'upsc2022.json', 2023: 'GS_Prelims_2023_Questions.json',
  2024: 'upsc2024.json', 2025: 'GS_Prelims_2025_Questions.json',
}

const HISTORICAL_CUTOFFS = {
  2024: 94.46, 2023: 75.41, 2022: 88.22, 2021: 87.54, 2020: 92.51,
  2019: 98.00, 2018: 98.00, 2017: 105.34, 2016: 116.00, 2015: 107.34,
}

const SECTION_MAP = {
  'POLITY': 'Polity', 'ECONOMY': 'Economy', 'ECONOMICS': 'Economy',
  'GEOGRAPHY': 'Geography', 'ENVIRONMENT': 'Environment', 'ECOLOGY': 'Environment',
  'HISTORY': 'History', 'ANCIENT': 'History', 'MEDIEVAL': 'History', 'MODERN': 'History',
  'SCIENCE': 'Science & Tech', 'TECH': 'Science & Tech', 'ART': 'Art & Culture', 'CULTURE': 'Art & Culture',
  'CURRENT': 'Current Affairs'
}

const EXAM_DURATION = 120 * 60
const MARKS_CORRECT = 2
const MARKS_INCORRECT = -0.67

// ─── Helpers ───
function normalizeAnswer(raw) {
  if (!raw) return ''
  const s = raw.toString().trim().toUpperCase()
  const m = s.match(/^\(?([A-D])\)?/)
  return m ? m[1] : s.charAt(0)
}

function normalizeDifficulty(d) {
  if (!d) return 'Medium'
  const s = d.toString().trim().toUpperCase()
  if (s.startsWith('E')) return 'Easy'
  if (s.startsWith('D') || s.startsWith('H')) return 'Difficult'
  return 'Medium'
}

function normalizeSection(sec) {
  if (!sec) return 'General'
  const s = sec.toString().toUpperCase()
  for (const [key, val] of Object.entries(SECTION_MAP)) {
    if (s.includes(key)) return val
  }
  return 'General'
}

async function fetchYearQuestions(year) {
  const filename = YEAR_FILES[year]
  if (!filename) return []
  const res = await fetch(`/upsc_jsons/${filename}`)
  let data = await res.json()
  if (!Array.isArray(data)) data = data.questions || [data]
  return data
    .filter(q => q && q.question && q.options)
    .map((q, idx) => ({
      id: q.id || `${year}_${idx}`,
      index: idx, year,
      section: normalizeSection(q.section),
      question: q.question, options: q.options,
      answer: normalizeAnswer(q.answer),
      explanation: q.explanation || '',
      difficulty: normalizeDifficulty(q.difficulty),
    }))
}

async function fetchAllYearCounts() {
  const counts = {}
  for (const year of Object.keys(YEAR_FILES)) {
    try {
      const qs = await fetchYearQuestions(Number(year))
      counts[year] = qs.length
    } catch { counts[year] = 0 }
  }
  return counts
}

// ─── Components ───

function Header({ onHome, theme, toggleTheme, onMistakeBook, onBookmarks }) {
  return (
    <header className="app-header">
      <div className="header-brand" onClick={onHome} style={{ cursor: 'pointer' }}>
        <div className="header-title">TestBook</div>
        <div className="header-subtitle">Advanced Study Ecosystem</div>
      </div>
      <div className="header-actions">
        <button className="btn btn-secondary btn-small" onClick={onBookmarks} title="Review Bookmarks">
          <Bookmark size={16} /> <span className="hide-mobile">Bookmarks</span>
        </button>
        <button className="btn btn-secondary btn-small" onClick={onMistakeBook} title="Review Mistakes">
          <BookOpen size={16} /> <span className="hide-mobile">Mistakes</span>
        </button>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  )
}

function HomeScreen({ yearCounts, onSelectYear, savedResults, onViewResult, onDeepDive }) {
  const years = Object.keys(YEAR_FILES).sort((a, b) => b - a)
  const categories = ['History', 'Polity', 'Geography', 'Economy', 'Environment', 'Science & Tech', 'Art & Culture', 'Current Affairs']

  return (
    <div className="home-screen fade-in">
      <div className="home-hero">
        <h1>Welcome to TestBook</h1>
        <p>Your minimalist, data-driven UPSC Prelims preparation companion.</p>
      </div>

      <div className="home-section-title"><Target size={20} /> Annual Mock Tests</div>
      <div className="year-grid">
        {years.map(year => (
          <div key={year} className="year-card slide-up" onClick={() => onSelectYear(Number(year))}>
            <div className="year-card-year">{year}</div>
            <div className="year-card-info"><BarChart3 size={14} /> {yearCounts[year] || '...'} Questions</div>
            {savedResults[year] && savedResults[year].score !== undefined && (
              <button className="year-card-result-btn" onClick={(e) => { e.stopPropagation(); onViewResult(Number(year)) }}>
                📊 Last: {Number(savedResults[year].score).toFixed(1)}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="home-section-title" style={{ marginTop: '48px' }}><GraduationCap size={20} /> Topic Deep Dive</div>
      <div className="category-grid">
        {categories.map(cat => (
          <div key={cat} className="category-card" onClick={() => onDeepDive(cat)}>
            <div className="category-name">{cat}</div>
            <div className="category-desc">Practice across all years</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExamScreen({ questions, onSubmit, onQuit, duration = EXAM_DURATION }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [responses, setResponses] = useState({})
  const [marked, setMarked] = useState(new Set())
  const [visited, setVisited] = useState(new Set([0]))
  const [showConfirm, setShowConfirm] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set(JSON.parse(localStorage.getItem('upsc_bookmarks') || '[]').map(q => q.id)))

  const handleExpire = useCallback(() => onSubmit(responses), [responses, onSubmit])
  const { formatTime, isPaused, togglePause } = useTimer(duration, handleExpire)

  const selectOption = useCallback((letter) => setResponses(prev => ({ ...prev, [currentIdx]: letter })), [currentIdx])
  const toggleMark = useCallback(() => setMarked(prev => {
    const next = new Set(prev); next.has(currentIdx) ? next.delete(currentIdx) : next.add(currentIdx); return next
  }), [currentIdx])
  const goToQuestion = useCallback((idx) => { setCurrentIdx(idx); setVisited(v => new Set(v).add(idx)) }, [])
  const goNext = useCallback(() => currentIdx < questions.length - 1 && goToQuestion(currentIdx + 1), [currentIdx, questions.length, goToQuestion])
  const goPrev = useCallback(() => currentIdx > 0 && goToQuestion(currentIdx - 1), [currentIdx, goToQuestion])

  const toggleBookmark = useCallback(() => {
    const q = questions[currentIdx]
    const currentBookmarks = JSON.parse(localStorage.getItem('upsc_bookmarks') || '[]')
    let nextBookmarks
    if (bookmarkedIds.has(q.id)) {
      nextBookmarks = currentBookmarks.filter(b => b.id !== q.id)
      setBookmarkedIds(prev => { const next = new Set(prev); next.delete(q.id); return next })
    } else {
      nextBookmarks = [...currentBookmarks, q]
      setBookmarkedIds(prev => { const next = new Set(prev); next.add(q.id); return next })
    }
    localStorage.setItem('upsc_bookmarks', JSON.stringify(nextBookmarks))
  }, [currentIdx, questions, bookmarkedIds])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused || showConfirm || showQuitConfirm) return
      const key = e.key.toUpperCase()
      if (key === 'ARROWLEFT') goPrev()
      else if (key === 'ARROWRIGHT') goNext()
      else if (['A', 'B', 'C', 'D'].includes(key)) selectOption(key)
      else if (key === 'M') toggleMark()
      else if (key === 'B') toggleBookmark()
    }
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, showConfirm, showQuitConfirm, goPrev, goNext, selectOption, toggleMark, toggleBookmark])

  const currentQ = questions[currentIdx]
  const attempted = Object.keys(responses).length

  return (
    <div className="exam-screen fade-in">
      {isPaused && (
        <div className="pause-overlay" onClick={togglePause}>
          <div className="pause-overlay-content" onClick={e => e.stopPropagation()}>
            <div className="pause-icon"><Clock size={48} /></div>
            <h2>Exam Paused</h2>
            <button className="btn btn-primary" onClick={togglePause} style={{ marginTop: '24px' }}>Resume</button>
          </div>
        </div>
      )}
      <div className="exam-main">
        <div className="question-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="question-number">Question {currentIdx + 1} of {questions.length}</span>
            <button className={`bookmark-btn ${bookmarkedIds.has(currentQ.id) ? 'active' : ''}`} onClick={toggleBookmark} title="Bookmark (B)">
              {bookmarkedIds.has(currentQ.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="question-section-badge">{currentQ.section}</span>
            <span className={`question-difficulty diff-${currentQ.difficulty.toLowerCase()}`}>{currentQ.difficulty}</span>
          </div>
        </div>
        <div className="question-text">{currentQ.question}</div>
        <div className="options-list">
          {Object.entries(currentQ.options).map(([l, t]) => (
            <div key={l} className={`option-item ${responses[currentIdx] === l.toUpperCase() ? 'selected' : ''}`} onClick={() => selectOption(l.toUpperCase())}>
              <div className="option-radio"></div>
              <span className="option-letter">({l.toUpperCase()})</span>
              <span className="option-text">{t}</span>
            </div>
          ))}
        </div>
        <div className="question-actions">
          <button className="btn btn-secondary btn-small" onClick={() => selectOption(undefined)}>Clear</button>
          <button className="btn btn-secondary btn-small" onClick={toggleMark}>{marked.has(currentIdx) ? 'Unmark' : 'Mark Review'}</button>
          <button className="btn btn-secondary btn-small" onClick={goPrev} disabled={currentIdx === 0}><ChevronLeft size={16} /> Prev</button>
          <button className="btn btn-primary btn-small" onClick={goNext} disabled={currentIdx === questions.length - 1}>Next <ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="exam-sidebar">
        <div className="timer-bar">
          <div><div className="timer-label">Remaining</div><div className="timer-display">{formatTime()}</div></div>
          <button className="btn-pause" onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'}</button>
        </div>
        <div className="palette-container">
          <div className="palette-grid">
            {questions.map((_, idx) => {
              const status = responses[idx] ? (marked.has(idx) ? 'answered marked' : 'answered') : (marked.has(idx) ? 'marked' : (visited.has(idx) ? 'not-answered' : ''))
              return <button key={idx} className={`palette-btn ${status} ${idx === currentIdx ? 'current' : ''}`} onClick={() => goToQuestion(idx)}>{idx + 1}</button>
            })}
          </div>
        </div>
        <div className="sidebar-submit">
          <button className="btn btn-primary" onClick={() => setShowConfirm(true)}>Submit</button>
          <button className="btn btn-secondary" onClick={() => setShowQuitConfirm(true)}>Quit</button>
        </div>
      </div>
      {(showConfirm || showQuitConfirm) && (
        <div className="modal-overlay" onClick={() => { setShowConfirm(false); setShowQuitConfirm(false) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{showConfirm ? 'Submit Exam?' : 'Quit Exam?'}</h2>
            <p>{showConfirm ? `You have attempted ${attempted} out of ${questions.length} questions.` : 'Your current progress will be lost.'}</p>
            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => { setShowConfirm(false); setShowQuitConfirm(false) }}>Cancel</button>
              <button className="btn btn-primary" style={showQuitConfirm ? { background: 'var(--error)' } : {}} onClick={showConfirm ? () => onSubmit(responses) : onQuit}>
                {showConfirm ? 'Submit Now' : 'Quit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScorecardScreen({ year, questions, responses, onRetake, onHome }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [reviewIdx, setReviewIdx] = useState(0)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set(JSON.parse(localStorage.getItem('upsc_bookmarks') || '[]').map(q => q.id)))

  const stats = useMemo(() => {
    let correct = 0, incorrect = 0, unattempted = 0, totalMarks = 0
    const sectionStats = {}
    questions.forEach((q, idx) => {
      if (!sectionStats[q.section]) sectionStats[q.section] = { total: 0, correct: 0, marks: 0 }
      const s = sectionStats[q.section]; s.total++
      const ans = responses[idx]
      if (ans === undefined) unattempted++
      else if (ans === q.answer) { correct++; s.correct++; totalMarks += MARKS_CORRECT; s.marks += MARKS_CORRECT }
      else { incorrect++; totalMarks += MARKS_INCORRECT; s.marks += MARKS_INCORRECT }
    })
    const cutoff = HISTORICAL_CUTOFFS[year] || null
    return { correct, incorrect, unattempted, totalMarks, cutoff, qualified: cutoff ? totalMarks >= cutoff : null, 
      radarData: Object.entries(sectionStats).map(([name, s]) => ({ subject: name, score: Math.max(0, (s.marks / (s.total * 2)) * 100) })),
      pieData: [{ name: 'Correct', value: correct, color: '#10b981' }, { name: 'Incorrect', value: incorrect, color: '#ef4444' }, { name: 'Unattempted', value: unattempted, color: '#9ca3af' }]
    }
  }, [questions, responses, year])

  const toggleBookmark = useCallback((q) => {
    const currentBookmarks = JSON.parse(localStorage.getItem('upsc_bookmarks') || '[]')
    let nextBookmarks
    if (bookmarkedIds.has(q.id)) {
      nextBookmarks = currentBookmarks.filter(b => b.id !== q.id)
      setBookmarkedIds(prev => { const next = new Set(prev); next.delete(q.id); return next })
    } else {
      nextBookmarks = [...currentBookmarks, q]
      setBookmarkedIds(prev => { const next = new Set(prev); next.add(q.id); return next })
    }
    localStorage.setItem('upsc_bookmarks', JSON.stringify(nextBookmarks))
  }, [bookmarkedIds])

  return (
    <div className="scorecard-screen fade-in">
      <div className="scorecard-header">
        <h1>Exam Result — {year || 'Special Attempt'}</h1>
        {stats.cutoff && (
          <div className={`status-badge ${stats.qualified ? 'qualified' : 'failed'}`}>
            {stats.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
            <small>Cut-off: {stats.cutoff} | Your Score: {stats.totalMarks.toFixed(2)}</small>
          </div>
        )}
      </div>

      <div className="score-hero">
        <div className="score-circle">
          <div className="big-number">{stats.totalMarks.toFixed(2)}</div>
          <div className="small-label">Score</div>
        </div>
        <div className="score-circle" style={{ borderColor: 'var(--success)' }}>
          <div className="big-number" style={{ color: 'var(--success)' }}>{((stats.correct / questions.length) * 100).toFixed(0)}%</div>
          <div className="small-label">Accuracy</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Analytics</button>
        <button className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>Review</button>
      </div>

      {activeTab === 'summary' && (
        <div className="analytics-grid fade-in">
          <div className="analytics-card">
            <h3>Subject Strengths</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={stats.radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-card">
            <h3>Accuracy Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <div className="fade-in">
          <div className="review-palette"><div className="review-palette-grid">
            {questions.map((q, i) => {
              const status = responses[i] === undefined ? 'unattempted' : (responses[i] === q.answer ? 'correct' : 'incorrect')
              return <button key={i} className={`review-palette-btn ${status} ${i === reviewIdx ? 'current' : ''}`} onClick={() => setReviewIdx(i)}>{i + 1}</button>
            })}
          </div></div>
          {(() => {
            const q = questions[reviewIdx], ans = responses[reviewIdx]
            return (
              <div className="review-question slide-up">
                <div className="review-question-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`review-status-icon ${ans === q.answer ? 'correct' : (ans === undefined ? 'unattempted' : 'incorrect')}`}>
                      {ans === q.answer ? <CheckCircle2 size={16}/> : (ans === undefined ? <AlertCircle size={16}/> : <XCircle size={16}/>)}
                    </span>
                    <span className="question-number">Q{reviewIdx + 1}</span>
                    <button className={`bookmark-btn ${bookmarkedIds.has(q.id) ? 'active' : ''}`} onClick={() => toggleBookmark(q)}>
                      {bookmarkedIds.has(q.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                  </div>
                  <span className="question-section-badge">{q.section}</span>
                </div>
                <div className="question-text">{q.question}</div>
                <div className="options-list">
                  {Object.entries(q.options).map(([l, t]) => (
                    <div key={l} className={`option-item ${l.toUpperCase() === q.answer ? 'correct' : (l.toUpperCase() === ans ? 'incorrect' : '')}`}>
                      <span className="option-letter">({l.toUpperCase()})</span>
                      <span className="option-text">{t}</span>
                    </div>
                  ))}
                </div>
                {q.explanation && <div className="explanation-box"><strong>Explanation</strong>{q.explanation}</div>}
              </div>
            )
          })()}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '40px', justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={onHome}>Home</button>
        <button className="btn btn-primary" onClick={onRetake}>Retake</button>
      </div>
    </div>
  )
}

// ─── Timer Hook ───
function useTimer(initialSeconds, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef()
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (isPaused) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(intervalRef.current); onExpireRef.current(); return 0 }; return s - 1 })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isPaused])

  return { seconds, isPaused, togglePause: () => setIsPaused(!isPaused), formatTime: () => {
    const h = Math.floor(seconds/3600), m = Math.floor((seconds%3600)/60), s = seconds%60
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  }}
}

// ─── Main App ───
function App() {
  const [screen, setScreen] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [yearCounts, setYearCounts] = useState({})
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [selectedYear, setSelectedYear] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    fetchAllYearCounts().then(counts => { setYearCounts(counts); setLoading(false) })
  }, [])

  const handleSelectYear = async (year) => {
    setLoading(true); setSelectedYear(year)
    const qs = await fetchYearQuestions(year); setQuestions(qs); setScreen('exam'); setLoading(false)
  }

  const handleDeepDive = async (cat) => {
    setLoading(true); setSelectedYear(null)
    let allQs = []
    for (const year of Object.keys(YEAR_FILES)) {
      const qs = await fetchYearQuestions(Number(year))
      allQs = allQs.concat(qs.filter(q => q.section === cat))
    }
    setQuestions(allQs.sort(() => 0.5 - Math.random()).slice(0, 50))
    setScreen('exam'); setLoading(false)
  }

  const handleMistakeBook = () => {
    const mistakes = JSON.parse(localStorage.getItem('upsc_mistakes') || '[]')
    if (mistakes.length === 0) { alert('No mistakes recorded yet. Finish a test to populate your mistake book!'); return }
    setQuestions(mistakes.sort(() => 0.5 - Math.random())); setScreen('exam'); setSelectedYear(null)
  }

  const handleBookmarks = () => {
    const bookmarks = JSON.parse(localStorage.getItem('upsc_bookmarks') || '[]')
    if (bookmarks.length === 0) { alert('Your bookmark list is empty. Save questions during exams or review to see them here!'); return }
    setQuestions(bookmarks.sort((a, b) => b.year - a.year)); setScreen('exam'); setSelectedYear(null)
  }

  const handleSubmit = (r) => {
    setResponses(r)
    const currentMistakes = JSON.parse(localStorage.getItem('upsc_mistakes') || '[]')
    const newMistakes = questions.filter((q, idx) => r[idx] && r[idx] !== q.answer)
    const combined = [...currentMistakes, ...newMistakes].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    localStorage.setItem('upsc_mistakes', JSON.stringify(combined))

    if (selectedYear) {
      const score = questions.reduce((acc, q, idx) => {
        if (r[idx] === q.answer) return acc + MARKS_CORRECT
        if (r[idx]) return acc + MARKS_INCORRECT
        return acc
      }, 0)
      localStorage.setItem(`upsc_result_${selectedYear}`, JSON.stringify({ score, responses: r, timestamp: new Date() }))
    }
    setScreen('scorecard')
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div><div className="loading-text">Optimizing TestBook...</div></div>

  return (
    <>
      <Header 
        onHome={() => setScreen('home')} 
        theme={theme} 
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
        onMistakeBook={handleMistakeBook} 
        onBookmarks={handleBookmarks}
      />
      {screen === 'home' && (
        <HomeScreen 
          yearCounts={yearCounts} 
          onSelectYear={handleSelectYear} 
          onDeepDive={handleDeepDive}
          savedResults={Object.keys(YEAR_FILES).reduce((acc, y) => {
            const res = localStorage.getItem(`upsc_result_${y}`); if (res) acc[y] = JSON.parse(res); return acc
          }, {})}
          onViewResult={async (y) => {
            setLoading(true); setSelectedYear(y); const qs = await fetchYearQuestions(y)
            setQuestions(qs); setResponses(JSON.parse(localStorage.getItem(`upsc_result_${y}`)).responses); setScreen('scorecard'); setLoading(false)
          }}
        />
      )}
      {screen === 'exam' && <ExamScreen questions={questions} onQuit={() => setScreen('home')} onSubmit={handleSubmit} />}
      {screen === 'scorecard' && <ScorecardScreen year={selectedYear} questions={questions} responses={responses} onRetake={() => setScreen('exam')} onHome={() => setScreen('home')} />}
      <footer className="app-footer"><div className="footer-content"><p className="footer-title">TestBook Elite Edition</p></div></footer>
    </>
  )
}

export default App

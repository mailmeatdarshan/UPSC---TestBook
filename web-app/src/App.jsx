import { useState, useEffect, useCallback, useRef } from 'react'
import './index.css'

// ─── Year-to-filename mapping (strict segregation per year) ───
const YEAR_FILES = {
  2012: 'upsc2012.json',
  2013: 'upsc2013.json',
  2014: 'gs_prelims_2014.json',
  2015: 'upsc2015.json',
  2016: 'upsc2016.json',
  2017: 'upsc2017.json',
  2018: 'upsc2018.json',
  2019: 'GS_Prelims_2019_Questions.json',
  2020: 'GS_Prelims_2020_Questions.json',
  2021: 'GS_Prelims_2021_Questions.json',
  2022: 'upsc2022.json',
  2023: 'GS_Prelims_2023_Questions.json',
  2024: 'upsc2024.json',
  2025: 'GS_Prelims_2025_Questions.json',
}

// ─── Normalize answer to single uppercase letter ───
function normalizeAnswer(raw) {
  if (!raw) return ''
  const s = raw.toString().trim().toUpperCase()
  // Match patterns like "(A)", "A", "(A) Some text", "a"
  const m = s.match(/^\(?([A-D])\)?/)
  if (m) return m[1]
  return s.charAt(0)
}

// ─── Normalize difficulty ───
function normalizeDifficulty(d) {
  if (!d) return 'Medium'
  const s = d.toString().trim().toUpperCase()
  if (s === 'E' || s.startsWith('EASY')) return 'Easy'
  if (s === 'D' || s.startsWith('DIFF') || s.startsWith('HARD')) return 'Difficult'
  return 'Medium'
}

// ─── Fetch questions for a specific year ───
async function fetchYearQuestions(year) {
  const filename = YEAR_FILES[year]
  if (!filename) return []
  const res = await fetch(`/upsc_jsons/${filename}`)
  let data = await res.json()
  // Handle different JSON structures
  if (!Array.isArray(data)) {
    if (data.questions && Array.isArray(data.questions)) data = data.questions
    else data = [data]
  }
  // Filter out empty/malformed entries and normalize
  return data
    .filter(q => q && q.question && q.options && Object.keys(q.options).length >= 2)
    .map((q, idx) => ({
      id: q.id || idx + 1,
      index: idx,
      year,
      section: q.section || 'General',
      question: q.question,
      options: q.options,
      answer: normalizeAnswer(q.answer),
      explanation: q.explanation || '',
      motivation: q.motivation || '',
      difficulty: normalizeDifficulty(q.difficulty),
    }))
}

// ─── Fetch question counts for all years (for home screen) ───
async function fetchAllYearCounts() {
  const counts = {}
  for (const year of Object.keys(YEAR_FILES)) {
    try {
      const qs = await fetchYearQuestions(Number(year))
      counts[year] = qs.length
    } catch {
      counts[year] = 0
    }
  }
  return counts
}

// ─── Constants ───
const EXAM_DURATION = 120 * 60 // 2 hours in seconds
const MARKS_CORRECT = 2
const MARKS_INCORRECT = -0.67

// ─── Emblem SVG ───
function EmblemIcon() {
  return (
    <svg className="header-emblem" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="#F5A623" strokeWidth="2" />
      <circle cx="50" cy="50" r="8" stroke="#F5A623" strokeWidth="2" />
      <line x1="50" y1="5" x2="50" y2="95" stroke="#F5A623" strokeWidth="1" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="#F5A623" strokeWidth="1" />
      <line x1="18" y1="18" x2="82" y2="82" stroke="#F5A623" strokeWidth="1" />
      <line x1="82" y1="18" x2="18" y2="82" stroke="#F5A623" strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180
        const x1 = 50 + 12 * Math.cos(rad)
        const y1 = 50 + 12 * Math.sin(rad)
        const x2 = 50 + 42 * Math.cos(rad)
        const y2 = 50 + 42 * Math.sin(rad)
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A623" strokeWidth="0.5" opacity="0.6" />
      })}
    </svg>
  )
}

// ─── Header ───
function Header({ onHome }) {
  return (
    <header className="app-header">
      <div className="header-brand" onClick={onHome} style={{ cursor: 'pointer' }}>
        <EmblemIcon />
        <div>
          <div className="header-title">UPSC Civil Services Examination</div>
          <div className="header-subtitle">General Studies — Preliminary</div>
        </div>
      </div>
    </header>
  )
}

// ─── Home Screen ───
function HomeScreen({ yearCounts, onSelectYear, savedResults, onViewResult }) {
  const years = Object.keys(YEAR_FILES).sort((a, b) => b - a)

  return (
    <div className="home-screen fade-in">
      <div className="home-hero">
        <h1>UPSC Prelims Mock Test</h1>
        <p>
          Practice with authentic Previous Year Questions from 2012 to 2025.
          Select a year to begin your exam simulation.
        </p>
      </div>
      <div className="year-grid">
        {years.map(year => (
          <div
            key={year}
            className="year-card slide-up"
            onClick={() => onSelectYear(Number(year))}
          >
            <div className="year-card-year">{year}</div>
            <div className="year-card-label">GS Paper I</div>
            <div className="year-card-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{yearCounts[year] || '...'} Questions</span>
            </div>
            <div className="year-card-badge">Previous Year Questions</div>
            {savedResults && savedResults[year] && (
              <button
                className="year-card-result-btn"
                onClick={(e) => { e.stopPropagation(); onViewResult(Number(year)) }}
              >
                📊 View Last Result
                <span className="result-date">
                  {new Date(savedResults[year].timestamp).toLocaleDateString()}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pre-Test Modal ───
function PreTestModal({ year, questionCount, onStart, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content slide-up">
        <h2>UPSC Prelims {year}</h2>
        <div className="modal-info-grid">
          <div className="modal-info-item">
            <div className="label">Total Questions</div>
            <div className="value">{questionCount}</div>
          </div>
          <div className="modal-info-item">
            <div className="label">Duration</div>
            <div className="value">2 Hours</div>
          </div>
          <div className="modal-info-item">
            <div className="label">Correct Answer</div>
            <div className="value" style={{ color: '#22C55E' }}>+2.00</div>
          </div>
          <div className="modal-info-item">
            <div className="label">Wrong Answer</div>
            <div className="value" style={{ color: '#EF4444' }}>−0.67</div>
          </div>
        </div>
        <div className="modal-rules">
          <h4>Exam Rules</h4>
          <ul>
            <li>Each question carries 2 marks</li>
            <li>1/3rd negative marking for incorrect answers</li>
            <li>No penalty for unattempted questions</li>
            <li>Timer will auto-submit when time expires</li>
            <li>You can mark questions for review</li>
            <li>Progress is saved automatically</li>
          </ul>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onStart}>
            Start Exam →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Timer Hook (with pause/resume + localStorage persistence) ───
function useTimer(initialSeconds, onExpire, storageKey) {
  const [seconds, setSeconds] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved !== null) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed > 0) return parsed
      }
    }
    return initialSeconds
  })
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  // Persist seconds to localStorage on every tick
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, seconds.toString())
    }
  }, [seconds, storageKey])

  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onExpire])

  useEffect(() => {
    if (!isPaused) {
      startInterval()
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPaused, startInterval])

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  const formatTime = useCallback(() => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [seconds])

  return { seconds, formatTime, isPaused, togglePause }
}

// ─── Helper: read saved exam progress from localStorage ───
function loadExamProgress(year) {
  try {
    const saved = localStorage.getItem(`upsc_exam_${year}`)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

// ─── Exam Screen ───
function ExamScreen({ year, questions, onSubmit }) {
  // Lazy-init all state from localStorage so refresh restores everything instantly
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = loadExamProgress(year)
    return saved?.currentIdx ?? 0
  })
  const [responses, setResponses] = useState(() => {
    const saved = loadExamProgress(year)
    return saved?.responses ?? {}
  })
  const [marked, setMarked] = useState(() => {
    const saved = loadExamProgress(year)
    return new Set(saved?.marked ?? [])
  })
  const [visited, setVisited] = useState(() => {
    const saved = loadExamProgress(year)
    return new Set(saved?.visited ?? [0])
  })
  const [sectionFilter, setSectionFilter] = useState('All')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleExpire = useCallback(() => {
    onSubmit(responses)
  }, [responses, onSubmit])

  const { seconds, formatTime, isPaused, togglePause } = useTimer(EXAM_DURATION, handleExpire, `upsc_timer_${year}`)

  // Save progress to localStorage on every change
  useEffect(() => {
    const key = `upsc_exam_${year}`
    localStorage.setItem(key, JSON.stringify({ responses, marked: [...marked], visited: [...visited], currentIdx }))
  }, [responses, marked, visited, currentIdx, year])

  const currentQ = questions[currentIdx]
  const sections = ['All', ...new Set(questions.map(q => q.section))]

  const selectOption = (letter) => {
    setResponses(prev => ({ ...prev, [currentIdx]: letter.toUpperCase() }))
  }

  const clearResponse = () => {
    setResponses(prev => {
      const next = { ...prev }
      delete next[currentIdx]
      return next
    })
  }

  const toggleMark = () => {
    setMarked(prev => {
      const next = new Set(prev)
      if (next.has(currentIdx)) next.delete(currentIdx)
      else next.add(currentIdx)
      return next
    })
  }

  const goToQuestion = (idx) => {
    setCurrentIdx(idx)
    setVisited(prev => new Set(prev).add(idx))
  }

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      goToQuestion(currentIdx + 1)
    }
  }

  const goPrev = () => {
    if (currentIdx > 0) {
      goToQuestion(currentIdx - 1)
    }
  }

  const handleSubmit = () => {
    localStorage.removeItem(`upsc_exam_${year}`)
    localStorage.removeItem(`upsc_timer_${year}`)
    localStorage.removeItem('upsc_active_session')
    onSubmit(responses)
  }

  const getQuestionStatus = (idx) => {
    if (responses[idx] !== undefined && marked.has(idx)) return 'answered marked'
    if (responses[idx] !== undefined) return 'answered'
    if (marked.has(idx)) return 'marked'
    if (visited.has(idx) && responses[idx] === undefined) return 'not-answered'
    return ''
  }

  const filteredIndices = questions.map((q, i) => i).filter(i =>
    sectionFilter === 'All' || questions[i].section === sectionFilter
  )

  const attempted = Object.keys(responses).length
  const markedCount = marked.size

  return (
    <div className="exam-screen fade-in">
      {/* Pause overlay */}
      {isPaused && (
        <div className="pause-overlay" onClick={togglePause}>
          <div className="pause-overlay-content">
            <div className="pause-icon">⏸</div>
            <h2>Exam Paused</h2>
            <p>Click anywhere or press the Resume button to continue</p>
            <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={togglePause}>
              ▶ Resume Exam
            </button>
          </div>
        </div>
      )}
      {/* Main question area */}
      <div className="exam-main">
        <div className="question-header">
          <span className="question-number">Question {currentIdx + 1} of {questions.length}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="question-section-badge">{currentQ.section}</span>
            <span className={`question-difficulty diff-${currentQ.difficulty.toLowerCase()}`}>
              {currentQ.difficulty}
            </span>
          </div>
        </div>

        <div className="question-text">{currentQ.question}</div>

        <div className="options-list">
          {Object.entries(currentQ.options).map(([letter, text]) => (
            <div
              key={letter}
              className={`option-item ${responses[currentIdx] === letter.toUpperCase() ? 'selected' : ''}`}
              onClick={() => selectOption(letter)}
            >
              <div className="option-radio"></div>
              <span className="option-letter">({letter.toUpperCase()})</span>
              <span className="option-text">{text}</span>
            </div>
          ))}
        </div>

        <div className="question-actions">
          <button className="btn btn-secondary btn-small" onClick={clearResponse}>
            Clear Response
          </button>
          <button className="btn btn-secondary btn-small" onClick={toggleMark}>
            {marked.has(currentIdx) ? '★ Unmark Review' : '☆ Mark for Review'}
          </button>
          <button className="btn btn-secondary btn-small" onClick={goPrev} disabled={currentIdx === 0}>
            ← Previous
          </button>
          <button className="btn btn-primary btn-small" onClick={goNext} disabled={currentIdx === questions.length - 1}>
            Save & Next →
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="exam-sidebar">
        {/* Timer */}
        <div className="timer-bar">
          <div>
            <div className="timer-label">Time Remaining</div>
            <div className={`timer-display ${seconds < 300 ? 'urgent' : ''} ${isPaused ? 'paused' : ''}`}>
              {formatTime()}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <button
              className={`btn-pause ${isPaused ? 'is-paused' : ''}`}
              onClick={togglePause}
              title={isPaused ? 'Resume Timer' : 'Pause Timer'}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div>{attempted}/{questions.length} answered</div>
              <div>{markedCount} marked</div>
            </div>
          </div>
        </div>

        {/* Section filter */}
        <div className="section-filter">
          {sections.map(sec => (
            <button
              key={sec}
              className={`section-pill ${sectionFilter === sec ? 'active' : ''}`}
              onClick={() => setSectionFilter(sec)}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Question palette */}
        <div className="palette-container">
          <div className="palette-title">Question Palette</div>
          <div className="palette-grid">
            {filteredIndices.map(idx => (
              <button
                key={idx}
                className={`palette-btn ${getQuestionStatus(idx)} ${idx === currentIdx ? 'current' : ''}`}
                onClick={() => goToQuestion(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="palette-legend">
          <div className="legend-item"><span className="legend-dot not-visited"></span>Not Visited</div>
          <div className="legend-item"><span className="legend-dot answered"></span>Answered</div>
          <div className="legend-item"><span className="legend-dot marked"></span>Marked</div>
          <div className="legend-item"><span className="legend-dot not-answered"></span>Not Answered</div>
        </div>

        {/* Submit */}
        <div className="sidebar-submit">
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowConfirm(true)}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowConfirm(false)}>
          <div className="modal-content slide-up">
            <h2>Submit Exam?</h2>
            <div style={{ margin: '16px 0', color: 'var(--text-secondary)' }}>
              <p>You have answered <strong style={{ color: 'var(--success)' }}>{attempted}</strong> out of <strong>{questions.length}</strong> questions.</p>
              <p style={{ marginTop: '8px' }}>{questions.length - attempted} questions are unattempted.</p>
              {markedCount > 0 && <p style={{ marginTop: '8px', color: 'var(--warning)' }}>{markedCount} questions are marked for review.</p>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Continue Exam</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Custom Notes Component ───
function QuestionNotes({ year, questionId }) {
  const storageKey = `upsc_notes_${year}_${questionId}`
  const [note, setNote] = useState(() => localStorage.getItem(storageKey) || '')
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    const val = e.target.value
    setNote(val)
    localStorage.setItem(storageKey, val)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="my-notes-container">
      <div className="my-notes-header">
        <strong>📝 My Notes</strong>
        {saved && <span className="notes-saved-indicator">✓ Saved</span>}
      </div>
      <textarea
        className="my-notes-textarea"
        value={note}
        onChange={handleChange}
        placeholder="Write your own explanation or notes here… These are saved permanently."
        rows={4}
      />
    </div>
  )
}

// ─── Scorecard Screen ───
function ScorecardScreen({ year, questions, responses, onRetake, onHome }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [reviewFilter, setReviewFilter] = useState('all') // all, correct, incorrect, unattempted
  const [reviewIdx, setReviewIdx] = useState(0)

  // Calculate results
  let correct = 0, incorrect = 0, unattempted = 0
  let totalMarks = 0, negativeMarks = 0

  questions.forEach((q, idx) => {
    const userAnswer = responses[idx]
    if (userAnswer === undefined) {
      unattempted++
    } else if (userAnswer === q.answer) {
      correct++
      totalMarks += MARKS_CORRECT
    } else {
      incorrect++
      totalMarks += MARKS_INCORRECT
      negativeMarks += Math.abs(MARKS_INCORRECT)
    }
  })

  const maxMarks = questions.length * MARKS_CORRECT
  const accuracy = correct + incorrect > 0 ? ((correct / (correct + incorrect)) * 100).toFixed(1) : 0
  const percentage = ((totalMarks / maxMarks) * 100).toFixed(1)

  // Section analysis
  const sectionStats = {}
  questions.forEach((q, idx) => {
    if (!sectionStats[q.section]) {
      sectionStats[q.section] = { total: 0, correct: 0, incorrect: 0, unattempted: 0, marks: 0 }
    }
    const s = sectionStats[q.section]
    s.total++
    const userAnswer = responses[idx]
    if (userAnswer === undefined) {
      s.unattempted++
    } else if (userAnswer === q.answer) {
      s.correct++
      s.marks += MARKS_CORRECT
    } else {
      s.incorrect++
      s.marks += MARKS_INCORRECT
    }
  })

  // Difficulty breakdown
  const difficultyStats = { Easy: { total: 0, correct: 0, incorrect: 0 }, Medium: { total: 0, correct: 0, incorrect: 0 }, Difficult: { total: 0, correct: 0, incorrect: 0 } }
  questions.forEach((q, idx) => {
    const d = q.difficulty
    if (!difficultyStats[d]) return
    difficultyStats[d].total++
    const userAnswer = responses[idx]
    if (userAnswer === q.answer) difficultyStats[d].correct++
    else if (userAnswer !== undefined) difficultyStats[d].incorrect++
  })

  // Filtered questions for review tab
  const reviewQuestions = questions.map((q, idx) => ({
    ...q,
    idx,
    userAnswer: responses[idx],
    status: responses[idx] === undefined ? 'unattempted' : responses[idx] === q.answer ? 'correct' : 'incorrect'
  })).filter(q => reviewFilter === 'all' || q.status === reviewFilter)

  return (
    <div className="scorecard-screen fade-in">
      <div className="scorecard-header">
        <h1>Exam Result — UPSC {year}</h1>
        <p>Detailed analysis of your performance</p>
      </div>

      {/* Score Hero */}
      <div className="score-hero">
        <div className="score-circle">
          <div className="big-number">{totalMarks.toFixed(2)}</div>
          <div className="small-label">out of {maxMarks}</div>
        </div>
        <div className="score-circle" style={{ borderColor: 'var(--success)' }}>
          <div className="big-number" style={{ color: 'var(--success)' }}>{accuracy}%</div>
          <div className="small-label">Accuracy</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="score-stats">
        <div className="stat-card">
          <div className="stat-value text-success">{correct}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-error">{incorrect}</div>
          <div className="stat-label">Incorrect</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-muted">{unattempted}</div>
          <div className="stat-label">Unattempted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-warning">{negativeMarks.toFixed(2)}</div>
          <div className="stat-label">Negative Marks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-accent">{percentage}%</div>
          <div className="stat-label">Score %</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'summary', label: 'Section Analysis' },
          { id: 'review', label: 'Question Review' },
          { id: 'difficulty', label: 'Difficulty Breakdown' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="fade-in">
          {Object.entries(sectionStats)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([section, stats]) => {
              const maxSectionMarks = stats.total * MARKS_CORRECT
              const scorePercent = maxSectionMarks > 0 ? Math.max(0, (stats.marks / maxSectionMarks) * 100) : 0
              return (
                <div key={section} className="section-bar-container">
                  <div className="section-bar-label">
                    <span>{section}</span>
                    <span>{stats.correct}/{stats.total} correct · {stats.marks.toFixed(2)}/{maxSectionMarks} marks</span>
                  </div>
                  <div className="section-bar-track">
                    <div className="section-bar-fill" style={{ width: `${scorePercent}%` }}></div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="fade-in">
          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${questions.length})` },
              { id: 'correct', label: `Correct (${correct})` },
              { id: 'incorrect', label: `Incorrect (${incorrect})` },
              { id: 'unattempted', label: `Unattempted (${unattempted})` },
            ].map(f => (
              <button
                key={f.id}
                className={`btn btn-small ${reviewFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setReviewFilter(f.id); setReviewIdx(0) }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Question palette for quick navigation */}
          {reviewQuestions.length > 0 && (
            <div className="review-palette">
              <div className="review-palette-title">Jump to Question</div>
              <div className="review-palette-grid">
                {reviewQuestions.map((rq, rIdx) => (
                  <button
                    key={rq.idx}
                    className={`review-palette-btn ${rq.status} ${rIdx === Math.min(reviewIdx, reviewQuestions.length - 1) ? 'current' : ''}`}
                    onClick={() => setReviewIdx(rIdx)}
                    title={`Q${rq.idx + 1} — ${rq.status}`}
                  >
                    {rq.idx + 1}
                  </button>
                ))}
              </div>
              <div className="review-palette-legend">
                <div className="legend-item"><span className="legend-dot answered"></span>Correct</div>
                <div className="legend-item"><span className="legend-dot not-answered"></span>Incorrect</div>
                <div className="legend-item"><span className="legend-dot unattempted-dot"></span>Unattempted</div>
              </div>
            </div>
          )}

          {/* Single question view — paginated */}
          {reviewQuestions.length > 0 && (() => {
            const q = reviewQuestions[Math.min(reviewIdx, reviewQuestions.length - 1)]
            const safeIdx = Math.min(reviewIdx, reviewQuestions.length - 1)
            const googleQuery = encodeURIComponent(q.question.substring(0, 200))
            return (
              <div>
                {/* Navigation header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setReviewIdx(Math.max(0, safeIdx - 1))}
                    disabled={safeIdx === 0}
                  >
                    ← Previous
                  </button>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
                    {safeIdx + 1} of {reviewQuestions.length}
                  </span>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setReviewIdx(Math.min(reviewQuestions.length - 1, safeIdx + 1))}
                    disabled={safeIdx === reviewQuestions.length - 1}
                  >
                    Next →
                  </button>
                </div>

                <div className="review-question" style={{ marginBottom: '20px' }}>
                  <div className="review-question-header">
                    <span className={`review-status-icon ${q.status}`}>
                      {q.status === 'correct' ? '✓' : q.status === 'incorrect' ? '✗' : '—'}
                    </span>
                    <span className="question-number">Q{q.idx + 1}</span>
                    <span className="question-section-badge">{q.section}</span>
                    <span className={`question-difficulty diff-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                    <a
                      className="google-search-link"
                      href={`https://www.google.com/search?q=${googleQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Search this question on Google"
                    >
                      🔍 Google
                    </a>
                  </div>

                  <div className="question-text" style={{ marginBottom: '16px' }}>{q.question}</div>

                  <div className="options-list" style={{ marginBottom: '16px' }}>
                    {Object.entries(q.options).map(([letter, text]) => {
                      const L = letter.toUpperCase()
                      const isCorrect = L === q.answer
                      const isUserPick = L === q.userAnswer
                      let cls = ''
                      if (isCorrect) cls = 'correct'
                      else if (isUserPick && !isCorrect) cls = 'incorrect'
                      return (
                        <div key={letter} className={`option-item ${cls}`} style={{ cursor: 'default' }}>
                          <div className="option-radio"></div>
                          <span className="option-letter">({L})</span>
                          <span className="option-text">{text}</span>
                          {isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>✓ Correct</span>}
                          {isUserPick && !isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--error)', fontSize: '0.9rem', fontWeight: 600 }}>Your Answer</span>}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <div className="explanation-box">
                      <strong>Explanation</strong>
                      <p style={{ marginTop: '10px' }}>{q.explanation}</p>
                    </div>
                  )}

                  {q.motivation && (
                    <div className="explanation-box" style={{ borderLeftColor: 'var(--success)', marginTop: '12px' }}>
                      <strong style={{ color: 'var(--success)' }}>💡 Motivation &amp; Tip</strong>
                      <p style={{ marginTop: '10px' }}>{q.motivation}</p>
                    </div>
                  )}

                  {/* Custom notes per question — permanent */}
                  <QuestionNotes key={`${year}_${q.id}`} year={year} questionId={q.id} />
                </div>

                {/* Bottom navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setReviewIdx(Math.max(0, safeIdx - 1))}
                    disabled={safeIdx === 0}
                  >
                    ← Previous Question
                  </button>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => setReviewIdx(Math.min(reviewQuestions.length - 1, safeIdx + 1))}
                    disabled={safeIdx === reviewQuestions.length - 1}
                  >
                    Next Question →
                  </button>
                </div>
              </div>
            )
          })()}

          {reviewQuestions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No questions in this filter.
            </div>
          )}
        </div>
      )}

      {activeTab === 'difficulty' && (
        <div className="difficulty-grid fade-in">
          {['Easy', 'Medium', 'Difficult'].map(d => {
            const s = difficultyStats[d]
            const acc = s.correct + s.incorrect > 0 ? ((s.correct / (s.correct + s.incorrect)) * 100).toFixed(0) : '—'
            return (
              <div key={d} className="difficulty-card">
                <h4 style={{
                  color: d === 'Easy' ? 'var(--success)' : d === 'Difficult' ? 'var(--error)' : 'var(--warning)'
                }}>
                  {d}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{s.total} questions</p>
                <div className="difficulty-stats">
                  <div className="difficulty-stat">
                    <div className="d-value" style={{ color: 'var(--success)' }}>{s.correct}</div>
                    <div className="d-label">Correct</div>
                  </div>
                  <div className="difficulty-stat">
                    <div className="d-value" style={{ color: 'var(--error)' }}>{s.incorrect}</div>
                    <div className="d-label">Wrong</div>
                  </div>
                  <div className="difficulty-stat">
                    <div className="d-value" style={{ color: 'var(--accent)' }}>{acc}%</div>
                    <div className="d-label">Accuracy</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={onHome}>← Back to Home</button>
        <button className="btn btn-primary" onClick={onRetake}>Retake Exam</button>
      </div>
    </div>
  )
}

// ─── Helper: get all saved test results from localStorage ───
function getSavedResults() {
  const results = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('upsc_result_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        if (data && data.year) {
          results[data.year] = data
        }
      } catch { /* ignore */ }
    }
  }
  return results
}

// ─── Main App ───
function App() {
  const [screen, setScreen] = useState('home') // home, modal, exam, scorecard
  const [yearCounts, setYearCounts] = useState({})
  const [selectedYear, setSelectedYear] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [savedResults, setSavedResults] = useState({})

  // Load year counts, saved results, and check for active session on mount
  useEffect(() => {
    fetchAllYearCounts().then(async (counts) => {
      setYearCounts(counts)
      setSavedResults(getSavedResults())

      // Check for an active exam session (page was refreshed mid-test)
      const activeSession = localStorage.getItem('upsc_active_session')
      if (activeSession) {
        try {
          const session = JSON.parse(activeSession)
          if (session.year && session.screen === 'exam') {
            // Restore exam state
            const yearQuestions = await fetchYearQuestions(session.year)
            setSelectedYear(session.year)
            setQuestions(yearQuestions)
            setScreen('exam')
            setLoading(false)
            return
          }
        } catch { /* ignore invalid session */ }
      }

      setLoading(false)
    })
  }, [])

  const handleSelectYear = (year) => {
    setSelectedYear(year)
    setScreen('modal')
  }

  const handleStartExam = async () => {
    setLoading(true)
    // Fetch questions ONLY for the selected year — strict segregation
    const yearQuestions = await fetchYearQuestions(selectedYear)
    setQuestions(yearQuestions)
    setResponses({})
    setLoading(false)
    // Save active session so refresh can resume
    localStorage.setItem('upsc_active_session', JSON.stringify({ screen: 'exam', year: selectedYear }))
    setScreen('exam')
  }

  const handleSubmitExam = (examResponses) => {
    setResponses(examResponses)
    // Save completed test result to localStorage
    const resultData = {
      year: selectedYear,
      responses: examResponses,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`upsc_result_${selectedYear}`, JSON.stringify(resultData))
    setSavedResults(prev => ({ ...prev, [selectedYear]: resultData }))
    setScreen('scorecard')
  }

  const handleRetake = () => {
    localStorage.removeItem(`upsc_exam_${selectedYear}`)
    localStorage.removeItem(`upsc_timer_${selectedYear}`)
    setResponses({})
    // Save active session so refresh can resume the retake too
    localStorage.setItem('upsc_active_session', JSON.stringify({ screen: 'exam', year: selectedYear }))
    setScreen('exam')
  }

  const handleGoHome = () => {
    localStorage.removeItem('upsc_active_session')
    setSelectedYear(null)
    setQuestions([])
    setResponses({})
    setSavedResults(getSavedResults())
    setScreen('home')
  }

  // Load a saved result from localStorage
  const handleViewSavedResult = async (year) => {
    const saved = savedResults[year]
    if (!saved) return
    setLoading(true)
    setSelectedYear(year)
    const yearQuestions = await fetchYearQuestions(year)
    setQuestions(yearQuestions)
    setResponses(saved.responses)
    setLoading(false)
    setScreen('scorecard')
  }

  if (loading) {
    return (
      <>
        <Header onHome={handleGoHome} />
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading UPSC Questions...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header onHome={handleGoHome} />

      {screen === 'home' && (
        <HomeScreen yearCounts={yearCounts} onSelectYear={handleSelectYear} savedResults={savedResults} onViewResult={handleViewSavedResult} />
      )}

      {screen === 'modal' && (
        <>
          <HomeScreen yearCounts={yearCounts} onSelectYear={handleSelectYear} savedResults={savedResults} onViewResult={handleViewSavedResult} />
          <PreTestModal
            year={selectedYear}
            questionCount={yearCounts[selectedYear] || 0}
            onStart={handleStartExam}
            onClose={() => setScreen('home')}
          />
        </>
      )}

      {screen === 'exam' && (
        <ExamScreen
          year={selectedYear}
          questions={questions}
          onSubmit={handleSubmitExam}
        />
      )}

      {screen === 'scorecard' && (
        <ScorecardScreen
          year={selectedYear}
          questions={questions}
          responses={responses}
          onRetake={handleRetake}
          onHome={handleGoHome}
        />
      )}
    </>
  )
}

export default App

$ErrorActionPreference = 'Stop'
$target = Join-Path (Get-Location) 'src\modules\ShrutiTrainer\index.tsx'
if (-not (Test-Path -LiteralPath $target)) { throw "Cannot find $target. Run this script from E:\nadopaasana-android" }
$content = Get-Content -LiteralPath $target -Raw
$original = $content
function Replace-Once([string]$Old, [string]$New, [string]$Description) {
  $count = ([regex]::Matches($script:content, [regex]::Escape($Old))).Count
  if ($count -ne 1) { throw "Expected one match for '$Description'; found $count. No file changes were written." }
  $script:content = $script:content.Replace($Old, $New)
}
# Add practice-level state and refs; keep tolerance in a ref so changing levels mid-session works.
Replace-Once @'
  const [gainThreshold, setGainThreshold] = useState(0.012)
'@ @'
  const [gainThreshold, setGainThreshold] = useState(0.012)
  const [practiceLevel, setPracticeLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const toleranceCents = practiceLevel === 'beginner' ? 40 : practiceLevel === 'intermediate' ? 20 : 10
'@ 'practice level state'
Replace-Once @'
  const streakRef    = useRef(0)
'@ @'
  const streakRef    = useRef(0)
  const lastScoredAtRef = useRef(0)
  const toleranceRef = useRef(40)
  const targetSwaraRef = useRef<string | null>(null)
  toleranceRef.current = toleranceCents
  targetSwaraRef.current = targetSwara
'@ 'scoring refs'
Replace-Once @'
      goodRef.current = 0; totalRef.current = 0; streakRef.current = 0
'@ @'
      goodRef.current = 0; totalRef.current = 0; streakRef.current = 0; lastScoredAtRef.current = 0
'@ 'reset scoring timer'
# The live project already has the threshold wired up; don't replace it unnecessarily.
if ($content -notmatch 'autocorrelate\(buf, ctx\.sampleRate, gainThreshold\)') {
  Replace-Once @'
const hz = autocorrelate(buf, ctx.sampleRate)
'@ @'
const hz = autocorrelate(buf, ctx.sampleRate, gainThreshold)
'@ 'wire noise threshold'
}
Replace-Once @'
          const isGood = Math.abs(ps.cents) < 15
          totalRef.current++
          if (isGood) {
            goodRef.current++
            streakRef.current++
            if (streakRef.current > bestStreak) setBestStreak(streakRef.current)
          } else {
            streakRef.current = 0
          }
          setGoodFrames(goodRef.current)
          setTotalFrames(totalRef.current)
          setStreak(streakRef.current)
          setCentsHistory(prev => [...prev.slice(-60), ps.cents])
'@ @'
          // Score no more than 10 samples per second; pitch display still updates every frame.
          const now = performance.now()
          if (now - lastScoredAtRef.current >= 100) {
            lastScoredAtRef.current = now
            const targetMatches = targetSwaraRef.current === null || ps.note === targetSwaraRef.current
            const isGood = targetMatches && Math.abs(ps.cents) <= toleranceRef.current
            totalRef.current++
            if (isGood) {
              goodRef.current++
              streakRef.current++
              if (streakRef.current > bestStreak) setBestStreak(streakRef.current)
            } else {
              streakRef.current = 0
            }
            setGoodFrames(goodRef.current)
            setTotalFrames(totalRef.current)
            setStreak(streakRef.current)
            setCentsHistory(prev => [...prev.slice(-60), ps.cents])
          }
'@ 'sampled scoring'
# Add visible selector immediately before the existing target-swara card.
Replace-Once @'
      {/* ── Svara target picker ── */}
'@ @'
      {/* ── Practice level ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Practice level</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([
            { value: 'beginner', label: 'Beginner · ±40¢' },
            { value: 'intermediate', label: 'Intermediate · ±20¢' },
            { value: 'advanced', label: 'Advanced · ±10¢' },
          ] as const).map(level => (
            <button key={level.value} onClick={() => setPracticeLevel(level.value)}
              style={{ padding: '6px 10px', borderRadius: 99, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid', borderColor: practiceLevel === level.value ? 'var(--accent)' : 'var(--border)', background: practiceLevel === level.value ? 'var(--accent-dim)' : 'transparent', color: practiceLevel === level.value ? 'var(--accent)' : 'var(--text-muted)' }}>
              {level.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: '0.65rem', color: 'var(--text-faint)' }}>
          Accuracy uses the selected pitch tolerance. This is a practice guide, not a formal assessment of musical skill.
        </div>
      </div>

      {/* ── Svara target picker ── */}
'@ 'practice-level selector UI'
# Add a simple reference tone for the selected swara.
Replace-Once @'
  // ── Derived ───────────────────────────────────────────────────────────────
'@ @'
  // ── Reference note playback ───────────────────────────────────────────────
  const playTargetReference = useCallback(() => {
    if (!targetSwara) return
    const target = PRINCIPAL_SWARAS.find(s => s.name === targetSwara)
    if (!target) return
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = settings.tonicHz * Math.pow(2, target.semi / 12)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04)
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.65)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.92)
  }, [targetSwara, settings.tonicHz])

  // ── Derived ───────────────────────────────────────────────────────────────
'@ 'reference-note playback function'
# Ensure the pitch-scoring callback uses current target and tolerance values.
if ($content -match '\}, \[settings\.tonicHz, bestStreak, gainThreshold\]\)') {
  Replace-Once @'
  }, [settings.tonicHz, bestStreak, gainThreshold])
'@ @'
  }, [settings.tonicHz, bestStreak, gainThreshold, targetSwara, toleranceCents])
'@ 'scoring callback dependencies'
} elseif ($content -match '\}, \[settings\.tonicHz, bestStreak\]\)') {
  Replace-Once @'
  }, [settings.tonicHz, bestStreak])
'@ @'
  }, [settings.tonicHz, bestStreak, gainThreshold, targetSwara, toleranceCents])
'@ 'scoring callback dependencies'
} elseif ($content -notmatch 'targetSwara, toleranceCents\]\)') {
  throw 'Could not find the expected startSession dependency list. No changes were written.'
}
# Add the reference button in the target-swara card.
Replace-Once @'
        {targetSwara && pitch && (
          <div style={{ marginTop: 8, fontSize: '0.8rem', color: pitch.note === targetSwara && pitch.direction === 'correct' ? 'var(--green)' : 'var(--orange)' }}>
            {pitch.note === targetSwara && pitch.direction === 'correct' ? '✅ Singing target Svara correctly!' : `Singing: ${pitch.note} (Target: ${targetSwara})`}
          </div>
        )}
'@ @'
        {targetSwara && pitch && (
          <div style={{ marginTop: 8, fontSize: '0.8rem', color: pitch.note === targetSwara && pitch.direction === 'correct' ? 'var(--green)' : 'var(--orange)' }}>
            {pitch.note === targetSwara && pitch.direction === 'correct' ? '✅ Singing target Svara correctly!' : `Singing: ${pitch.note} (Target: ${targetSwara})`}
          </div>
        )}
        {targetSwara && (
          <button onClick={playTargetReference}
            style={{ marginTop: 10, padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 600 }}>
            ▶ Hear {targetSwara} reference
          </button>
        )}
'@ 'reference-note button'

# Make frame counter label accurate after scoring is sampled.
Replace-Once @'
{ label: 'Frames', value: totalRef.current, color: 'var(--text)' },
'@ @'
{ label: 'Samples', value: totalRef.current, color: 'var(--text)' },
'@ 'rename scored frame counter'
# Only write after all exact-match checks succeed. Create a timestamped backup first.
$backup = "$target.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -LiteralPath $target -Destination $backup
Set-Content -LiteralPath $target -Value $content -Encoding UTF8
Write-Host 'Practice levels, sampled scoring, target-aware scoring, and reference-note playback added.' -ForegroundColor Green
Write-Host "Backup created: $backup"
Write-Host 'Next: run npm run build, then refresh the app and test practice levels, target scoring, reference tone, microphone, tanpura, and recordings.'

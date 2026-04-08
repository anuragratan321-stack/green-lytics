import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ESGInputLayout from '../components/ESGInputLayout'
import { getESGInputStore, getESGSectionState, setESGSectionState } from '../utils/esgInput'
import { getCurrentDraft, saveCurrentDraft } from '../services/draftsApi'

const SECTION_KEY = 'governance'
const FIELD_KEYS = ['boardIndependence', 'womenOnBoard', 'ceoPayRatio', 'fraudCases', 'transparencyScore']

const fields = [
  { key: 'boardIndependence', label: 'Board Independence (%)', placeholder: 'e.g. 64', tooltip: 'Share of independent board members.', min: 0, max: 100, step: '0.1', unit: '%' },
  { key: 'womenOnBoard', label: 'Women on Board (%)', placeholder: 'e.g. 38', tooltip: 'Percentage of women representation on the board.', min: 0, max: 100, step: '0.1', unit: '%' },
  { key: 'ceoPayRatio', label: 'CEO Pay Ratio', placeholder: 'e.g. 110', tooltip: 'CEO-to-median employee pay ratio.', min: 0, max: 500, step: '0.1' },
  { key: 'fraudCases', label: 'Fraud Cases', placeholder: 'e.g. 0', tooltip: 'Number of reported fraud or major compliance cases.', min: 0, step: '1' },
  { key: 'transparencyScore', label: 'Transparency Score (%)', placeholder: 'e.g. 81', tooltip: 'Score for reporting clarity and disclosure quality.', min: 0, max: 100, step: '0.1', unit: '%' },
]

function GovernanceInput() {
  const navigate = useNavigate()
  const location = useLocation()
  const freshStart = Boolean(location.state?.freshStart)
  const seededSection = location.state?.reportInputs?.governance
  const [draftStatus, setDraftStatus] = useState('')
  const [state, setState] = useState(() => {
    if (seededSection && typeof seededSection === 'object') {
      const base = getESGSectionState(SECTION_KEY, FIELD_KEYS)
      return {
        values: { ...base.values, ...(seededSection.values || {}) },
        skipped: { ...base.skipped, ...(seededSection.skipped || {}) },
      }
    }
    return getESGSectionState(SECTION_KEY, FIELD_KEYS, { mode: freshStart ? 'create' : 'edit' })
  })

  useEffect(() => {
    setESGSectionState(SECTION_KEY, state)
  }, [state])

  useEffect(() => {
    if (freshStart || seededSection) return

    ;(async () => {
      const draft = await getCurrentDraft().catch(() => null)
      if (!draft?.inputs?.[SECTION_KEY]) return
      const section = draft.inputs[SECTION_KEY]
      setState((prev) => ({
        values: { ...prev.values, ...(section.values || {}) },
        skipped: { ...prev.skipped, ...(section.skipped || {}) },
      }))
    })()
  }, [freshStart, seededSection])

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setDraftStatus('Saving draft...')
        const inputs = getESGInputStore()
        await saveCurrentDraft({
          inputs,
          metadata: { step: SECTION_KEY },
        })
        setDraftStatus('Draft saved')
      } catch {
        setDraftStatus('Draft not synced')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [state])

  const handleChange = (key, value) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: value },
      skipped: { ...prev.skipped, [key]: false },
    }))
  }

  const handleToggleSkip = (key) => {
    setState((prev) => {
      const nextSkipped = !prev.skipped[key]
      return {
        ...prev,
        values: { ...prev.values, [key]: nextSkipped ? '' : prev.values[key] },
        skipped: { ...prev.skipped, [key]: nextSkipped },
      }
    })
  }

  return (
    <ESGInputLayout
      title='Governance Metrics'
      description='Complete governance inputs to finalize your ESG data capture.'
      stepIndex={2}
      fields={fields}
      values={state.values}
      skipped={state.skipped}
      onChange={handleChange}
      onToggleSkip={handleToggleSkip}
      onBack={() => navigate('/esg-input/social', { state: { reportInputs: location.state?.reportInputs || null, reportId: location.state?.reportId || null } })}
      onNext={() =>
        navigate(location.state?.reportId ? `/analysis/${location.state.reportId}` : '/analysis', {
          state: { fromEdit: Boolean(location.state?.reportId) },
        })
      }
      nextLabel='Continue to Analysis'
      draftStatus={draftStatus}
    />
  )
}

export default GovernanceInput

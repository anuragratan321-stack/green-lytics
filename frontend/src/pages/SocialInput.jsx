import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ESGInputLayout from '../components/ESGInputLayout'
import { getESGInputStore, getESGSectionState, setESGSectionState } from '../utils/esgInput'
import { getCurrentDraft, saveCurrentDraft } from '../services/draftsApi'

const SECTION_KEY = 'social'
const FIELD_KEYS = ['employeeSatisfaction', 'attritionRate', 'genderDiversity', 'workplaceIncidents', 'csrSpending']

const fields = [
  {
    key: 'employeeSatisfaction',
    label: 'Employee Satisfaction (%)',
    placeholder: 'e.g. 78',
    tooltip: 'Average satisfaction score across your workforce.',
    min: 0,
    max: 100,
    step: '0.1',
    unit: '%',
  },
  {
    key: 'attritionRate',
    label: 'Attrition Rate (%)',
    placeholder: 'e.g. 12',
    tooltip: 'Percentage of employees leaving during a period.',
    min: 0,
    max: 100,
    step: '0.1',
    unit: '%',
  },
  {
    key: 'genderDiversity',
    label: 'Gender Diversity (%)',
    placeholder: 'e.g. 46',
    tooltip: 'Share of women and diverse genders in workforce (closer to 50% is generally better).',
    min: 0,
    max: 100,
    step: '0.1',
    unit: '%',
  },
  { key: 'workplaceIncidents', label: 'Workplace Incidents', placeholder: 'e.g. 3', tooltip: 'Reported safety incidents in the reporting period.', min: 0, step: '1' },
  {
    key: 'csrSpending',
    label: 'CSR Spending (%)',
    placeholder: 'e.g. 2.4',
    tooltip: 'CSR spend as a percentage of revenue or profit base.',
    min: 0,
    max: 100,
    step: '0.1',
    unit: '%',
  },
]

function SocialInput() {
  const navigate = useNavigate()
  const location = useLocation()
  const freshStart = Boolean(location.state?.freshStart)
  const seededSection = location.state?.reportInputs?.social
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
      title='Social Metrics'
      description='Capture people and community indicators for the social pillar.'
      stepIndex={1}
      fields={fields}
      values={state.values}
      skipped={state.skipped}
      onChange={handleChange}
      onToggleSkip={handleToggleSkip}
      onBack={() => navigate('/esg-input/environmental', { state: { reportInputs: location.state?.reportInputs || null, reportId: location.state?.reportId || null } })}
      onNext={() => navigate('/esg-input/governance', { state: { reportInputs: location.state?.reportInputs || null, reportId: location.state?.reportId || null } })}
      nextLabel='Next: Governance'
      draftStatus={draftStatus}
    />
  )
}

export default SocialInput

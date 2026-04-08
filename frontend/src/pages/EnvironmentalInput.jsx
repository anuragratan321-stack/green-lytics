import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ESGInputLayout from '../components/ESGInputLayout'
import { getESGInputStore, getESGSectionState, setESGSectionState } from '../utils/esgInput'
import { getCurrentDraft, saveCurrentDraft } from '../services/draftsApi'

const SECTION_KEY = 'environmental'
const FIELD_KEYS = ['carbonEmissions', 'revenue', 'revenueCurrency', 'revenueMeta', 'renewableEnergy', 'waterUsage', 'wasteRecycling']

const fields = [
  {
    key: 'carbonEmissions',
    label: 'Carbon Emissions (tons CO₂/year)',
    placeholder: 'e.g. 1200',
    tooltip: 'Total CO₂ emissions produced annually by your company.',
    type: 'text',
    inputMode: 'decimal',
    allowCommas: true,
    min: 0,
    unit: 'tons CO₂/year',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    placeholder: 'e.g. 500000',
    tooltip: 'Annual revenue used to calculate emissions intensity.',
    type: 'text',
    inputMode: 'decimal',
    allowCommas: true,
    min: 0,
    validate: (value) => {
      if (value === '' || value === null || value === undefined) return ''
      return Number(value) <= 0 ? 'Revenue must be greater than 0.' : ''
    },
    selector: { key: 'revenueCurrency', options: ['₹', '$', '€'] },
    unit: '/ year',
  },
  {
    key: 'renewableEnergy',
    label: 'Renewable Energy (%)',
    placeholder: 'e.g. 40',
    tooltip: 'Share of total energy consumption sourced from renewable energy.',
    min: 0,
    max: 100,
    step: '0.1',
    unit: '%',
  },
  {
    key: 'waterUsage',
    label: 'Water Usage (liters/year)',
    placeholder: 'e.g. 2300',
    tooltip: 'Total annual freshwater consumption used by your operations.',
    type: 'text',
    inputMode: 'decimal',
    allowCommas: true,
    min: 0,
    unit: 'liters/year',
  },
  {
    key: 'wasteRecycling',
    label: 'Waste Recycling (%)',
    placeholder: 'e.g. 62',
    tooltip: 'Percentage of total waste recycled during the year.',
    min: 0,
    max: 100,
    step: '0.1',
    unit: '%',
  },
]

function EnvironmentalInput() {
  const navigate = useNavigate()
  const location = useLocation()
  const freshStart = Boolean(location.state?.freshStart)
  const seededSection = location.state?.reportInputs?.environmental
  const [draftStatus, setDraftStatus] = useState('')
  const [state, setState] = useState(() => {
    if (seededSection && typeof seededSection === 'object') {
      const values = { ...getESGSectionState(SECTION_KEY, FIELD_KEYS).values, ...(seededSection.values || {}) }
      const skipped = { ...getESGSectionState(SECTION_KEY, FIELD_KEYS).skipped, ...(seededSection.skipped || {}) }
      return { values, skipped }
    }

    const initial = getESGSectionState(SECTION_KEY, FIELD_KEYS, { mode: freshStart ? 'create' : 'edit' })
    const currentCurrency = initial.values.revenueCurrency || '₹'
    return {
      ...initial,
      values: {
        ...initial.values,
        revenueMeta:
          initial.values.revenueMeta && typeof initial.values.revenueMeta === 'object'
            ? initial.values.revenueMeta
            : { value: initial.values.revenue || '', currency: currentCurrency },
      },
    }
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

  const intensity = useMemo(() => {
    const emissions = Number(state.values.carbonEmissions)
    const revenue = Number(state.values.revenue)
    if (!Number.isFinite(emissions) || !Number.isFinite(revenue) || revenue <= 0) return null
    return emissions / revenue
  }, [state.values.carbonEmissions, state.values.revenue])

  const handleChange = (key, value) => {
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: value,
        revenueMeta:
          key === 'revenue'
            ? {
                value,
                currency: prev.values.revenueCurrency || prev.values.revenueMeta?.currency || '₹',
              }
            : key === 'revenueCurrency'
              ? {
                  value: prev.values.revenue || prev.values.revenueMeta?.value || '',
                  currency: value,
                }
              : prev.values.revenueMeta,
      },
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
      title='Environmental Metrics'
      description='Provide environmental data to shape your ESG analysis baseline.'
      stepIndex={0}
      fields={fields}
      values={state.values}
      skipped={state.skipped}
      onChange={handleChange}
      onToggleSkip={handleToggleSkip}
      onBack={() => navigate('/dashboard')}
      onNext={() => navigate('/esg-input/social', { state: { reportInputs: location.state?.reportInputs || null, reportId: location.state?.reportId || null } })}
      nextLabel='Next: Social'
      draftStatus={draftStatus}
    >
      <div className='mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950'>
        <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Calculated Intensity</p>
        <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-200'>
          {intensity === null ? 'Add both Carbon Emissions and Revenue to calculate emissions intensity.' : `Emissions Intensity = ${intensity.toFixed(4)}`}
        </p>
      </div>
    </ESGInputLayout>
  )
}

export default EnvironmentalInput

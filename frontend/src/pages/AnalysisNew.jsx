import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { getCurrentDraft, removeCurrentDraft } from '../services/draftsApi'
import { ESG_INPUT_STORAGE_KEY, clearESGInputDraft } from '../utils/esgInput'

function AnalysisNew() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [existingDraft, setExistingDraft] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const draft = await getCurrentDraft().catch(() => null)
        if (mounted) setExistingDraft(draft)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (existingDraft?._id) return
    clearESGInputDraft()
    navigate('/esg-input/environmental', { replace: true, state: { freshStart: true } })
  }, [existingDraft?._id, isLoading, navigate])

  const handleStartNew = async () => {
    await removeCurrentDraft().catch(() => {})
    clearESGInputDraft()
    navigate('/esg-input/environmental', { replace: true, state: { freshStart: true } })
  }

  const handleResumeDraft = () => {
    if (existingDraft?.inputs) {
      localStorage.setItem(ESG_INPUT_STORAGE_KEY, JSON.stringify(existingDraft.inputs))
    }
    navigate('/esg-input/environmental', { replace: true })
  }

  if (isLoading) return null

  if (!existingDraft?._id) return null

  return (
    <PageTransition>
      <section className='mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl items-center justify-center px-6 py-12'>
        <Card title='Unfinished Analysis Found' description='You have an active draft analysis. Would you like to resume where you left off or start fresh?'>
          <div className='mt-6 flex flex-wrap items-center gap-3'>
            <Button type='button' onClick={handleResumeDraft}>
              Resume Draft
            </Button>
            <Button type='button' onClick={handleStartNew} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
              Start New
            </Button>
          </div>
        </Card>
      </section>
    </PageTransition>
  )
}

export default AnalysisNew

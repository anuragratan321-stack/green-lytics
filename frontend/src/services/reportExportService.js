import React from 'react'
import { pdf } from '@react-pdf/renderer'
import ReportPDF from '../components/reports/ReportPDF'
import { createReportModel } from '../utils/reportModel'

async function createReportPdfBlob(source) {
  const model = createReportModel(source)
  const blob = await pdf(React.createElement(ReportPDF, { report: model })).toBlob()
  return { blob, model }
}

export async function downloadReportPdf(source) {
  const { blob, model } = await createReportPdfBlob(source)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ESG_Report_${model.fileDate}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function printSingleReport(source) {
  const { blob } = await createReportPdfBlob(source)
  const pdfUrl = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  iframe.setAttribute('aria-hidden', 'true')

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    URL.revokeObjectURL(pdfUrl)
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }

  const triggerPrint = () => {
    setTimeout(() => {
      const targetWindow = iframe.contentWindow
      if (!targetWindow) {
        cleanup()
        return
      }

      targetWindow.focus()
      targetWindow.print()

      targetWindow.onafterprint = () => {
        cleanup()
      }

      // Fallback cleanup in case onafterprint does not fire in some browsers.
      setTimeout(cleanup, 2000)
    }, 300)
  }

  iframe.onload = triggerPrint
  document.body.appendChild(iframe)
  iframe.src = pdfUrl
}

const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')

const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'reports.json')

function formatReportDateTimeLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart}, ${timePart}`
}

function resolveReportName(payload, createdAt) {
  if (typeof payload?.reportName === 'string' && payload.reportName.trim()) return payload.reportName.trim()
  const dataName = payload?.data?.reportName
  if (typeof dataName === 'string' && dataName.trim()) return dataName.trim()
  const formatted = formatReportDateTimeLabel(createdAt)
  return formatted ? `ESG Report - ${formatted}` : 'ESG Report'
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]), 'utf8')
  }
}

async function readReports() {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeReports(reports) {
  await ensureStoreFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(reports, null, 2), 'utf8')
}

function normalizePayload(payload = {}) {
  const now = new Date().toISOString()
  const createdAt = payload.createdAt || now
  const reportName = resolveReportName(payload, createdAt)
  return {
    reportName,
    industry: payload.industry || '',
    role: payload.role || '',
    companySize: payload.companySize || '',
    region: payload.region || '',
    scores: {
      environmental: Number(payload?.scores?.environmental) || 0,
      social: Number(payload?.scores?.social) || 0,
      governance: Number(payload?.scores?.governance) || 0,
      total: Number(payload?.scores?.total) || 0,
    },
    inputs: payload.inputs && typeof payload.inputs === 'object' ? payload.inputs : {},
    data:
      payload.data && typeof payload.data === 'object'
        ? {
            ...payload.data,
            reportName,
          }
        : { reportName },
    createdAt,
    updatedAt: now,
  }
}

async function getReportsByUser(userId) {
  const reports = await readReports()
  return reports
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

async function getReportById(userId, id) {
  const reports = await readReports()
  return reports.find((item) => item.userId === userId && item._id === id) || null
}

async function createReport(userId, payload) {
  const reports = await readReports()
  const next = {
    _id: randomUUID(),
    userId,
    ...normalizePayload(payload),
  }
  reports.push(next)
  await writeReports(reports)
  return next
}

async function updateReport(userId, id, payload) {
  const reports = await readReports()
  const index = reports.findIndex((item) => item.userId === userId && item._id === id)
  if (index < 0) return null

  const existing = reports[index]
  reports[index] = {
    ...existing,
    ...normalizePayload({
      ...existing,
      ...payload,
      createdAt: existing.createdAt,
    }),
    _id: existing._id,
    userId: existing.userId,
  }
  await writeReports(reports)
  return reports[index]
}

async function deleteReport(userId, id) {
  const reports = await readReports()
  const next = reports.filter((item) => !(item.userId === userId && item._id === id))
  if (next.length === reports.length) return false
  await writeReports(next)
  return true
}

module.exports = {
  getReportsByUser,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
}

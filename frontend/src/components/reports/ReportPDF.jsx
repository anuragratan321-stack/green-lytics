import React from 'react'
import { Document, Page, StyleSheet, Svg, Rect, Text, View, Image } from '@react-pdf/renderer'
import logo from '../../assets/greenlytics.png'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  reportName: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 700,
  },
  metaText: {
    fontSize: 9,
    color: '#6b7280',
  },
  scoreSection: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 700,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
  },
  chartBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  breakdownCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
  },
  breakdownLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  breakdownValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 700,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 2,
  },
  listBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
  },
  listItem: {
    marginBottom: 6,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
})

function statusBadgeStyle(status) {
  if (status === 'Excellent') return { backgroundColor: '#d1fae5', color: '#065f46' }
  if (status === 'Good') return { backgroundColor: '#dcfce7', color: '#166534' }
  if (status === 'Average') return { backgroundColor: '#fef3c7', color: '#92400e' }
  return { backgroundColor: '#ffe4e6', color: '#9f1239' }
}

function ChartBars({ report }) {
  const barWidth = 150
  const maxHeight = 64
  const barGap = 20
  const bars = [
    { label: 'E', value: report.environmental, color: '#10b981' },
    { label: 'S', value: report.social, color: '#0284c7' },
    { label: 'G', value: report.governance, color: '#8b5cf6' },
  ]

  return (
    <Svg width={barWidth} height={96}>
      {bars.map((bar, index) => {
        const x = index * (32 + barGap) + 8
        const h = Math.max(4, (Math.min(100, Math.max(0, bar.value)) / 100) * maxHeight)
        const y = 72 - h
        return (
          <React.Fragment key={bar.label}>
            <Rect x={x} y={8} width={28} height={64} fill='#e5e7eb' rx={6} />
            <Rect x={x} y={y + 8} width={28} height={h} fill={bar.color} rx={6} />
            <Text x={x + 10} y={86} style={{ fontSize: 8, color: '#4b5563' }}>
              {bar.label}
            </Text>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}

function ReportPDF({ report }) {
  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={styles.brand}>
              <Image style={styles.logo} src={logo} />
              <Text style={styles.brandTitle}>GreenLytics</Text>
            </View>
            <Text style={styles.reportName}>{report.name}</Text>
          </View>
          <Text style={styles.metaText}>{report.dateLabel}</Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Overall ESG Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{report.esgScore.toFixed(1)}</Text>
            <Text style={[styles.statusBadge, statusBadgeStyle(report.status)]}>{report.status}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.metaText}>Industry: {report.industry || 'N/A'}</Text>
            <Text style={styles.metaText}>Role: {report.role || 'N/A'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pillar Chart</Text>
        <View style={styles.chartBox}>
          <ChartBars report={report} />
        </View>

        <Text style={styles.sectionTitle}>Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Environmental</Text>
            <Text style={styles.breakdownValue}>{report.environmental.toFixed(1)}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Social</Text>
            <Text style={styles.breakdownValue}>{report.social.toFixed(1)}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Governance</Text>
            <Text style={styles.breakdownValue}>{report.governance.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>AI Insights</Text>
        <View style={styles.listBox}>
          {report.insights.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.listBox}>
          {report.recommendations.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>GreenLytics ESG Report • Data-driven sustainability analysis and reporting</Text>
      </Page>
    </Document>
  )
}

export default ReportPDF

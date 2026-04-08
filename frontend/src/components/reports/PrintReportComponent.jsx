function PrintReportComponent({ report, logoUrl }) {
  const insights = Array.isArray(report?.insights) ? report.insights : []
  const recommendations = Array.isArray(report?.recommendations) ? report.recommendations : []
  const chartItems = [
    { label: 'Environmental', short: 'E', value: report?.environmental || 0, color: '#10b981' },
    { label: 'Social', short: 'S', value: report?.social || 0, color: '#0284c7' },
    { label: 'Governance', short: 'G', value: report?.governance || 0, color: '#8b5cf6' },
  ]

  return (
    <div className='print-report-root'>
      <header className='print-header'>
        <div className='print-brand'>
          {logoUrl ? <img src={logoUrl} alt='GreenLytics' className='print-logo' /> : null}
          <div>
            <h1>GreenLytics</h1>
            <p>ESG Report</p>
          </div>
        </div>
        <div className='print-meta'>
          <p>{report?.dateTimeLabel || 'Unknown date'}</p>
          <h2>{report?.name || 'ESG Report'}</h2>
        </div>
      </header>

      <section className='print-score'>
        <span>ESG Score</span>
        <strong>{report?.esgScore?.toFixed?.(1) ?? '0.0'}</strong>
        <em>{report?.status || 'Unknown'}</em>
      </section>

      <section className='print-chart'>
        <h3>Pillar Chart</h3>
        <div className='chart-bars'>
          {chartItems.map((item) => (
            <div key={item.label} className='chart-item'>
              <div className='chart-bar-track'>
                <div className='chart-bar-fill' style={{ height: `${Math.max(4, Math.min(100, item.value))}%`, background: item.color }} />
              </div>
              <span>{item.short}</span>
            </div>
          ))}
        </div>
      </section>

      <section className='print-grid'>
        <article>
          <h3>Profile</h3>
          <p>
            <span>Industry</span>
            <strong>{report?.industry || 'N/A'}</strong>
          </p>
          <p>
            <span>Role</span>
            <strong>{report?.role || 'N/A'}</strong>
          </p>
        </article>

        <article>
          <h3>Score Breakdown</h3>
          <p>
            <span>Environmental</span>
            <strong>{report?.environmental?.toFixed?.(1) ?? '0.0'}</strong>
          </p>
          <p>
            <span>Social</span>
            <strong>{report?.social?.toFixed?.(1) ?? '0.0'}</strong>
          </p>
          <p>
            <span>Governance</span>
            <strong>{report?.governance?.toFixed?.(1) ?? '0.0'}</strong>
          </p>
        </article>
      </section>

      <section className='print-insights'>
        <h3>AI Insights</h3>
        {insights.length ? (
          <ul>
            {insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        ) : (
          <p>No AI insights available for this report.</p>
        )}
      </section>

      <section className='print-insights'>
        <h3>Recommendations</h3>
        {recommendations.length ? (
          <ul>
            {recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available.</p>
        )}
      </section>
    </div>
  )
}

export default PrintReportComponent

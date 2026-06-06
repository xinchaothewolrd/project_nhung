import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { fmtDateShort } from '../lib/format'

// Biểu đồ đường xu hướng nhịp tim & SpO2 qua các lần đo (2 trục Y)
export default function TrendChart({ records }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    const recs = [...records].reverse() // cũ -> mới

    chart.setOption({
      grid: { left: 42, right: 20, top: 45, bottom: 28 },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Nhịp tim', 'SpO₂'], top: 5, textStyle: { color: '#566461' } },
      xAxis: {
        type: 'category', data: recs.map((r) => fmtDateShort(r.createdAt)),
        axisLine: { lineStyle: { color: '#E3DCCD' } }, axisLabel: { color: '#8C9794' },
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 200,
        interval: 20,
        axisLabel: { color: '#8C9794' },
        splitLine: { lineStyle: { color: '#EDE8DC' } }
      },
      series: [
        { name: 'Nhịp tim', type: 'line', smooth: true, data: recs.map((r) => +r.bpm || null), itemStyle: { color: '#D34A33' }, lineStyle: { width: 2.5 } },
        { name: 'SpO₂', type: 'line', smooth: true, data: recs.map((r) => +r.spo2 || null), itemStyle: { color: '#15655D' }, lineStyle: { width: 2.5 } },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [records])

  return <div className="trend-chart" ref={ref} />
}

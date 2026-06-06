import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { parseECG } from '../lib/ecg'

/**
 * Biểu đồ ECG tương tác.
 * - Tải file CSV từ `url`, parse, nhồi toàn bộ điểm vào ECharts.
 * - Lăn chuột = zoom, kéo = pan, thanh trượt dưới = xem toàn cảnh.
 * - Mặc định zoom sẵn vài nhịp đầu để lộ rõ Q-R-S.
 */
export default function EcgChart({ url }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errMsg, setErrMsg] = useState('')
  const [points, setPoints] = useState(null)

  // 1) Tải & parse dữ liệu khi đổi url
  useEffect(() => {
    let alive = true
    setStatus('loading')
    setPoints(null)

    async function load() {
      if (!url) { if (alive) { setErrMsg('Không có tệp ECG cho lần đo này.'); setStatus('error') } return }
      let text
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('HTTP ' + res.status)
        text = await res.text()
      } catch (e) {
        if (alive) { setErrMsg('Không tải được tệp ECG. ' + e.message); setStatus('error') }
        return
      }
      if (!alive) return
      const pts = parseECG(text)
      if (!pts.length) { setErrMsg('Tệp ECG rỗng hoặc sai định dạng.'); setStatus('error'); return }
      setPoints(pts)
      setStatus('ready')
    }
    load()
    return () => { alive = false }
  }, [url])

  // 2) Vẽ chart khi đã có dữ liệu (div .ecg-chart đã render)
  useEffect(() => {
    if (status !== 'ready' || !points || !ref.current) return
    const chart = echarts.init(ref.current)
    chartRef.current = chart

    const n = points.length
    // % cửa sổ hiển thị ban đầu: khoảng ~1000 điểm (vài nhịp) để thấy rõ Q-R-S
    const initWin = Math.min(100, Math.max(2, (100 * 1000) / n))

    chart.setOption({
      backgroundColor: 'transparent',
      animation: false,
      grid: { left: 46, right: 24, top: 18, bottom: 64 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(6,18,14,.92)',
        borderColor: '#1d4',
        textStyle: { color: '#bdedd8', fontFamily: 'IBM Plex Mono' },
        formatter: (p) => {
          const d = p[0]
          return `t = ${d.value[0]} ms<br/>biên độ = ${d.value[1]}`
        },
      },
      xAxis: {
        type: 'value', name: 'thời gian (ms)', nameTextStyle: { color: '#4e7a68' },
        axisLine: { lineStyle: { color: '#1f4536' } },
        axisLabel: { color: '#5e8a78', fontFamily: 'IBM Plex Mono', fontSize: 10 },
        splitLine: { show: true, lineStyle: { color: 'rgba(65,229,138,.10)' } },
        minorTick: { show: true },
        minorSplitLine: { show: true, lineStyle: { color: 'rgba(65,229,138,.05)' } },
      },
      yAxis: {
        type: 'value', name: 'mV', nameTextStyle: { color: '#4e7a68' }, scale: true,
        axisLine: { lineStyle: { color: '#1f4536' } },
        axisLabel: { color: '#5e8a78', fontFamily: 'IBM Plex Mono', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(65,229,138,.10)' } },
        minorSplitLine: { show: true, lineStyle: { color: 'rgba(65,229,138,.05)' } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, start: 0, end: initWin, zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false },
        { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: 'shift' }, // giữ Shift + lăn để zoom biên độ
        {
          type: 'slider', xAxisIndex: 0, start: 0, end: initWin, height: 26, bottom: 14,
          backgroundColor: 'rgba(65,229,138,.05)', borderColor: '#16332a',
          fillerColor: 'rgba(65,229,138,.14)',
          handleStyle: { color: '#41E58A' }, moveHandleStyle: { color: '#41E58A' },
          dataBackground: { lineStyle: { color: '#2f6e57' }, areaStyle: { color: 'rgba(65,229,138,.12)' } },
          selectedDataBackground: { lineStyle: { color: '#41E58A' }, areaStyle: { color: 'rgba(65,229,138,.25)' } },
          textStyle: { color: '#5e8a78', fontFamily: 'IBM Plex Mono' },
        },
      ],
      series: [{
        type: 'line', data: points, showSymbol: false, smooth: false,
        sampling: 'lttb', large: true, largeThreshold: 2000,
        lineStyle: { color: '#41E58A', width: 1.3, shadowColor: 'rgba(65,229,138,.55)', shadowBlur: 5 },
        emphasis: { disabled: true },
      }],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [status, points])

  if (status === 'loading')
    return <div className="ecg-loading"><div className="ecg-spinner" />Đang tải tín hiệu ECG…</div>
  if (status === 'error')
    return <div className="ecg-error">{errMsg}</div>
  return <div className="ecg-chart" ref={ref} />
}

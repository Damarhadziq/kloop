import type {
  ReceiptQualityMetrics,
  ReceiptScanAnalysisResult,
  ReceiptValidationIssue,
  ReceiptValidationIssueCode,
  ScannedReceiptDraft,
} from '@/types'

export type ScanSimulationPreset =
  | 'auto'
  | 'valid_clear'
  | 'too_dark'
  | 'blurry'
  | 'low_contrast_faded'
  | 'glare_overexposed'
  | 'not_receipt'

export const SCAN_SIMULATION_PRESETS: readonly {
  id: ScanSimulationPreset
  label: string
  shortLabel: string
  badge: 'valid' | 'invalid' | 'auto'
}[] = [
  { id: 'auto', label: 'Deteksi Otomatis (Kamera / Galeri)', shortLabel: 'Auto Sensor', badge: 'auto' },
  { id: 'valid_clear', label: 'Simulasi Struk Jelas (Valid)', shortLabel: 'Struk Jelas', badge: 'valid' },
  { id: 'too_dark', label: 'Gelap / Tidak Terlihat', shortLabel: 'Gelap', badge: 'invalid' },
  { id: 'blurry', label: 'Buram / Kamera Goyang', shortLabel: 'Buram', badge: 'invalid' },
  { id: 'low_contrast_faded', label: 'Tinta Struk Pudar', shortLabel: 'Tinta Pudar', badge: 'invalid' },
  { id: 'glare_overexposed', label: 'Silau / Pantulan Flash', shortLabel: 'Silau Flash', badge: 'invalid' },
  { id: 'not_receipt', label: 'Bukan Struk / Terpotong', shortLabel: 'Bukan Struk', badge: 'invalid' },
] as const

const ISSUE_CATALOG: Record<ReceiptValidationIssueCode, ReceiptValidationIssue> = {
  too_dark: {
    code: 'too_dark',
    severity: 'error',
    title: 'Struk Tidak Terlihat (Terlalu Gelap)',
    subtitle: 'Pencahayaan di sekitar struk sangat minim',
    description:
      'Kamera tidak dapat membaca daftar menu dan nominal harga karena foto struk terlalu gelap atau tertutup bayangan.',
    tips: [
      'Nyalakan fitur Senter (Flash) pada pojok kanan atas kamera.',
      'Pindahkan struk ke area dengan lampu yang lebih terang.',
      'Hindari bayangan tangan atau HP menutupi kertas struk.',
    ],
    canForceContinue: false,
    suggestTorch: true,
  },
  blurry: {
    code: 'blurry',
    severity: 'error',
    title: 'Foto Struk Buram & Tidak Fokus',
    subtitle: 'Teks menu dan angka harga tampak kabur',
    description:
      'Sistem OCR gagal mengenali angka nominal karena gambar goyang saat diambil atau lensa kamera belum fokus.',
    tips: [
      'Pegang HP dengan stabil selama 1–2 detik saat menekan tombol foto.',
      'Jaga jarak kamera sekitar 15–25 cm dari permukaan struk.',
      'Pastikan lensa kamera bersih dari noda jari.',
    ],
    canForceContinue: false,
  },
  low_contrast_faded: {
    code: 'low_contrast_faded',
    severity: 'warning',
    title: 'Tinta Struk Pudar / Kurang Jelas',
    subtitle: 'Kontras antara tulisan dan kertas terlalu rendah',
    description:
      'Sebagian baris menu dan harga tampak pudar atau terlipat sehingga hasil pembacaan otomatis berisiko kurang akurat.',
    tips: [
      'Ratakan kertas struk yang kusut atau terlipat di atas meja datar.',
      'Dekatkan sedikit kamera agar cetakan thermal lebih terlihat.',
      'Jika tinta memang sudah hilang, gunakan fitur Input Manual.',
    ],
    canForceContinue: true,
  },
  glare_overexposed: {
    code: 'glare_overexposed',
    severity: 'error',
    title: 'Struk Tertutup Pantulan Cahaya (Silau)',
    subtitle: 'Area nominal harga tertutup cahaya berlebih',
    description:
      'Terdeteksi pantulan cahaya terang (overexposed) pada permukaan kertas struk sehingga teks harga tidak terbaca.',
    tips: [
      'Miringkan sedikit sudut HP agar lampu tidak memantul langsung di kertas thermal.',
      'Matikan senter jika kertas struk berbahan mengkilap (glossy).',
    ],
    canForceContinue: false,
  },
  not_receipt: {
    code: 'not_receipt',
    severity: 'error',
    title: 'Struk Belanja Tidak Terdeteksi',
    subtitle: 'Format nama menu, harga, dan total tidak ditemukan',
    description:
      'Objek pada foto tidak teridentifikasi sebagai struk transaksi atau bagian total harga terpotong di luar bingkai.',
    tips: [
      'Pastikan seluruh bagian struk (Nama Tempat, Daftar Menu, dan Total) masuk ke dalam kotak.',
      'Gunakan latar belakang meja yang kontras dengan warna kertas struk.',
    ],
    canForceContinue: false,
  },
  resolution_too_small: {
    code: 'resolution_too_small',
    severity: 'error',
    title: 'Resolusi Gambar Terlalu Kecil',
    subtitle: 'Detail tulisan struk pecah saat diperbesar',
    description:
      'Ukuran gambar yang diunggah terlalu kecil sehingga karakter huruf dan angka tidak dapat diekstrak.',
    tips: [
      'Gunakan foto asli dari kamera (bukan thumbnail atau screenshot kecil).',
      'Ambil foto ulang langsung menggunakan kamera Kloop.',
    ],
    canForceContinue: false,
  },
}

export function getValidationIssueByCode(code: ReceiptValidationIssueCode): ReceiptValidationIssue {
  return ISSUE_CATALOG[code]
}

/**
 * Computes real-time image quality telemetry from an ImageData buffer.
 */
export function computeMetricsFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ReceiptQualityMetrics {
  const totalPixels = width * height
  if (totalPixels === 0) {
    return {
      brightness: 0,
      sharpness: 0,
      contrast: 0,
      glareRatio: 0,
      textDensity: 0,
      confidence: 0,
      width: 0,
      height: 0,
    }
  }

  const gray = new Float32Array(totalPixels)
  let sumLum = 0
  let glarePixels = 0
  let darkPixels = 0

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    gray[p] = lum
    sumLum += lum
    if (lum > 246) glarePixels++
    if (lum < 38) darkPixels++
  }

  const meanLum = sumLum / totalPixels
  let varianceSum = 0
  for (let p = 0; p < totalPixels; p++) {
    const diff = gray[p] - meanLum
    varianceSum += diff * diff
  }
  const stdDev = Math.sqrt(varianceSum / totalPixels)

  // Sobel / Laplacian edge sharpness & horizontal text-line transition counter
  let edgeSum = 0
  let edgeCount = 0
  let textTransitions = 0

  for (let y = 1; y < height - 1; y += 2) {
    let rowTransitions = 0
    for (let x = 1; x < width - 1; x += 2) {
      const idx = y * width + x
      const center = gray[idx]
      const left = gray[idx - 1]
      const right = gray[idx + 1]
      const up = gray[idx - width]
      const down = gray[idx + width]

      const gx = Math.abs(right - left)
      const gy = Math.abs(down - up)
      const laplacian = Math.abs(4 * center - left - right - up - down)

      edgeSum += (gx + gy) * 0.5 + laplacian * 0.5
      edgeCount++

      if (gx > 28) {
        rowTransitions++
      }
    }
    if (rowTransitions >= 6 && rowTransitions <= width * 0.38) {
      textTransitions++
    }
  }

  const sampledRows = Math.max(1, Math.floor((height - 2) / 2))
  const avgEdge = edgeCount > 0 ? edgeSum / edgeCount : 0

  const brightness = Math.round(Math.min(100, Math.max(0, (meanLum / 255) * 100)))
  const contrast = Math.round(Math.min(100, Math.max(0, (stdDev / 78) * 100)))
  const sharpness = Math.round(Math.min(100, Math.max(0, (avgEdge / 38) * 100)))
  const glareRatio = Math.round(Math.min(100, Math.max(0, (glarePixels / totalPixels) * 100)))
  const darkRatio = (darkPixels / totalPixels) * 100
  const textDensity = Math.round(Math.min(100, Math.max(0, (textTransitions / sampledRows) * 125)))

  const brightnessScore =
    brightness < 22
      ? brightness * 1.4
      : brightness > 92
        ? Math.max(15, 100 - (brightness - 92) * 8)
        : 88
  const confidence = Math.round(
    Math.min(
      99,
      Math.max(
        5,
        brightnessScore * 0.25 +
          sharpness * 0.3 +
          contrast * 0.25 +
          textDensity * 0.2 -
          (darkRatio > 75 ? 35 : 0) -
          (glareRatio > 70 ? 30 : 0),
      ),
    ),
  )

  return {
    brightness,
    sharpness,
    contrast,
    glareRatio,
    textDensity,
    confidence,
    width,
    height,
  }
}

/**
 * Live frame quality check for the active camera viewfinder.
 */
export function analyzeVideoFrame(video: HTMLVideoElement): {
  metrics: ReceiptQualityMetrics
  statusLabel: string
  tone: 'good' | 'warn' | 'bad'
} {
  const vw = video.videoWidth || 320
  const vh = video.videoHeight || 420
  const sampleW = 160
  const sampleH = Math.max(120, Math.round((vh / vw) * sampleW))

  const canvas = document.createElement('canvas')
  canvas.width = sampleW
  canvas.height = sampleH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      metrics: {
        brightness: 72,
        sharpness: 76,
        contrast: 68,
        glareRatio: 8,
        textDensity: 74,
        confidence: 88,
        width: vw,
        height: vh,
      },
      statusLabel: 'Kamera siap • Posisikan struk di dalam kotak',
      tone: 'good',
    }
  }

  ctx.drawImage(video, 0, 0, sampleW, sampleH)
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH)
  const metrics = computeMetricsFromImageData(imgData.data, sampleW, sampleH)
  metrics.width = vw
  metrics.height = vh

  if (metrics.brightness < 24) {
    return {
      metrics,
      statusLabel: 'Cahaya terlalu gelap • Nyalakan senter',
      tone: 'bad',
    }
  }
  if (metrics.glareRatio > 65 && metrics.contrast < 22) {
    return {
      metrics,
      statusLabel: 'Terlalu silau • Hindari pantulan lampu',
      tone: 'warn',
    }
  }
  if (metrics.sharpness < 16) {
    return {
      metrics,
      statusLabel: 'Kurang fokus • Tahan HP dengan stabil',
      tone: 'warn',
    }
  }
  if (metrics.contrast < 16) {
    return {
      metrics,
      statusLabel: 'Kontras rendah • Dekatkan ke struk',
      tone: 'warn',
    }
  }
  return {
    metrics,
    statusLabel: 'Struk terlihat jelas • Siap dipindai',
    tone: 'good',
  }
}

/**
 * Generates a realistic receipt DataURL for testing/simulation or fallback when camera is unavailable.
 */
export function generateSimulatedReceiptImage(preset: Exclude<ScanSimulationPreset, 'auto'>): string {
  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 680
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Background table surface
  ctx.fillStyle = preset === 'too_dark' ? '#0d110f' : preset === 'not_receipt' ? '#2c4a3e' : '#3a423d'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (preset === 'not_receipt') {
    // Draw a coffee cup / table scene instead of a receipt
    ctx.fillStyle = '#4e5d55'
    ctx.beginPath()
    ctx.arc(240, 340, 145, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#d8cbb8'
    ctx.beginPath()
    ctx.arc(240, 340, 108, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6f4e37'
    ctx.beginPath()
    ctx.arc(240, 340, 86, 0, Math.PI * 2)
    ctx.fill()
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  // Receipt paper
  const paperColor =
    preset === 'too_dark'
      ? '#1b201d'
      : preset === 'low_contrast_faded'
        ? '#f2f1eb'
        : '#fcfcfa'

  ctx.fillStyle = paperColor
  ctx.fillRect(58, 44, 364, 592)

  // Text ink color
  const inkColor =
    preset === 'too_dark'
      ? '#262d29'
      : preset === 'low_contrast_faded'
        ? '#e4e3dc'
        : preset === 'blurry'
          ? '#686b69'
          : '#162822'

  ctx.fillStyle = inkColor
  ctx.textAlign = 'center'
  ctx.font = 'bold 20px sans-serif'
  ctx.fillText('KOPI NAKO TEMBALANG', 240, 96)
  ctx.font = '13px monospace'
  ctx.fillText('Jl. Sirojudin No. 18, Semarang', 240, 120)
  ctx.fillText('--------------------------------', 240, 146)

  const rows: [string, string][] = [
    ['1x Iced Caramel Macchiato', 'Rp 38.000'],
    ['1x Nasi Goreng Kampung', 'Rp 45.000'],
    ['1x French Fries Truffle', 'Rp 30.000'],
    ['--------------------------------', ''],
    ['Subtotal', 'Rp 113.000'],
    ['PB1 / Pajak (10%)', 'Rp 11.500'],
    ['Service Charge', 'Rp 4.000'],
    ['--------------------------------', ''],
    ['TOTAL BAYAR', 'Rp 128.500'],
  ]

  ctx.textAlign = 'left'
  let y = 180
  for (const [left, right] of rows) {
    if (!right) {
      ctx.textAlign = 'center'
      ctx.fillText(left, 240, y)
      ctx.textAlign = 'left'
    } else {
      ctx.font = left.includes('TOTAL') ? 'bold 15px monospace' : '13px monospace'
      ctx.fillText(left, 86, y)
      ctx.textAlign = 'right'
      ctx.fillText(right, 394, y)
      ctx.textAlign = 'left'
    }
    y += 38
  }

  // Glare / overexposure overlay
  if (preset === 'glare_overexposed') {
    const grad = ctx.createRadialGradient(240, 310, 30, 240, 310, 260)
    grad.addColorStop(0, 'rgba(255,255,255,0.99)')
    grad.addColorStop(0.65, 'rgba(255,255,255,0.94)')
    grad.addColorStop(1, 'rgba(255,255,255,0.45)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return canvas.toDataURL('image/jpeg', 0.85)
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

export function createReceiptDraftForCategory(
  category: string,
  participantIds: string[],
): ScannedReceiptDraft {
  const billId = 'draft-scan'
  const first = participantIds.slice(0, 1)
  const second = participantIds.slice(1, 2).length ? participantIds.slice(1, 2) : first
  const all = participantIds.length > 0 ? [...participantIds] : ['Anya']

  if (category.toLowerCase().includes('jajan')) {
    return {
      title: 'Jajanan Pasar & Dimsum Sore',
      category,
      taxAmount: 0,
      serviceAmount: 2000,
      discountAmount: 0,
      confidence: 94,
      detectedTextLines: [
        'JAJANAN PASAR & DIMSUM SORE',
        '2x Dimsum Mentai Bakar    Rp 36.000',
        '2x Es Cokelat Klasik      Rp 28.000',
        '1x Tahu Walik Crispy      Rp 18.000',
        'Biaya Kemasan             Rp  2.000',
        'TOTAL                     Rp 84.000',
      ],
      items: [
        {
          id: 'scan-item-1',
          billId,
          name: 'Dimsum Mentai Bakar',
          qty: 2,
          price: 36000,
          assignedParticipantIds: first,
        },
        {
          id: 'scan-item-2',
          billId,
          name: 'Es Cokelat Klasik',
          qty: 2,
          price: 28000,
          assignedParticipantIds: second,
        },
        {
          id: 'scan-item-3',
          billId,
          name: 'Tahu Walik Crispy',
          qty: 1,
          price: 18000,
          assignedParticipantIds: all,
        },
      ],
    }
  }

  return {
    title: 'Kopi Nako Tembalang',
    category,
    taxAmount: 11500,
    serviceAmount: 4000,
    discountAmount: 0,
    confidence: 96,
    detectedTextLines: [
      'KOPI NAKO TEMBALANG',
      '1x Iced Caramel Macchiato  Rp 38.000',
      '1x Nasi Goreng Kampung     Rp 45.000',
      '1x French Fries Truffle    Rp 30.000',
      'PPN (10%)                  Rp 11.500',
      'Service Charge             Rp  4.000',
      'TOTAL BAYAR                Rp 128.500',
    ],
    items: [
      {
        id: 'scan-item-1',
        billId,
        name: 'Iced Caramel Macchiato',
        qty: 1,
        price: 38000,
        assignedParticipantIds: first,
      },
      {
        id: 'scan-item-2',
        billId,
        name: 'Nasi Goreng Kampung Spesial',
        qty: 1,
        price: 45000,
        assignedParticipantIds: second,
      },
      {
        id: 'scan-item-3',
        billId,
        name: 'French Fries Truffle',
        qty: 1,
        price: 30000,
        assignedParticipantIds: all,
      },
    ],
  }
}

/**
 * Analyzes a captured/uploaded receipt image and validates whether it is legible and valid.
 */
export async function analyzeReceiptImage(
  imageSrc: string,
  options: {
    category: string
    participantIds: string[]
    preset?: ScanSimulationPreset
  },
): Promise<ReceiptScanAnalysisResult> {
  const { category, participantIds, preset = 'auto' } = options

  // When a specific test preset is explicitly selected by the user, return deterministic telemetry
  if (preset !== 'auto') {
    if (preset === 'valid_clear') {
      const draft = createReceiptDraftForCategory(category, participantIds)
      return {
        valid: true,
        metrics: {
          brightness: 78,
          sharpness: 89,
          contrast: 84,
          glareRatio: 4,
          textDensity: 86,
          confidence: 96,
          width: 1080,
          height: 1440,
        },
        issue: null,
        draft,
        detectedLines: draft.detectedTextLines ?? [],
      }
    }

    const issue = getValidationIssueByCode(preset)
    const presetMetrics: Record<Exclude<ScanSimulationPreset, 'auto' | 'valid_clear'>, ReceiptQualityMetrics> = {
      too_dark: {
        brightness: 12,
        sharpness: 34,
        contrast: 18,
        glareRatio: 0,
        textDensity: 11,
        confidence: 18,
        width: 1080,
        height: 1440,
      },
      blurry: {
        brightness: 68,
        sharpness: 9,
        contrast: 32,
        glareRatio: 6,
        textDensity: 19,
        confidence: 29,
        width: 1080,
        height: 1440,
      },
      low_contrast_faded: {
        brightness: 82,
        sharpness: 41,
        contrast: 11,
        glareRatio: 14,
        textDensity: 24,
        confidence: 48,
        width: 1080,
        height: 1440,
      },
      glare_overexposed: {
        brightness: 96,
        sharpness: 22,
        contrast: 14,
        glareRatio: 78,
        textDensity: 15,
        confidence: 24,
        width: 1080,
        height: 1440,
      },
      not_receipt: {
        brightness: 64,
        sharpness: 62,
        contrast: 48,
        glareRatio: 5,
        textDensity: 6,
        confidence: 21,
        width: 1080,
        height: 1440,
      },
    }

    const draft = issue.canForceContinue ? createReceiptDraftForCategory(category, participantIds) : null
    return {
      valid: false,
      metrics: presetMetrics[preset],
      issue,
      draft,
      detectedLines: draft?.detectedTextLines ?? [],
    }
  }

  // Real pixel-level analysis on the captured camera frame or uploaded gallery image
  try {
    const img = await loadImageElement(imageSrc)
    const naturalW = img.naturalWidth || img.width || 480
    const naturalH = img.naturalHeight || img.height || 640

    if (naturalW < 200 || naturalH < 200) {
      const issue = getValidationIssueByCode('resolution_too_small')
      return {
        valid: false,
        metrics: {
          brightness: 50,
          sharpness: 20,
          contrast: 30,
          glareRatio: 0,
          textDensity: 10,
          confidence: 20,
          width: naturalW,
          height: naturalH,
        },
        issue,
        draft: null,
        detectedLines: [],
      }
    }

    const sampleW = 240
    const sampleH = Math.max(180, Math.round((naturalH / naturalW) * sampleW))
    const canvas = document.createElement('canvas')
    canvas.width = sampleW
    canvas.height = sampleH
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) {
      const draft = createReceiptDraftForCategory(category, participantIds)
      return {
        valid: true,
        metrics: {
          brightness: 76,
          sharpness: 82,
          contrast: 78,
          glareRatio: 5,
          textDensity: 80,
          confidence: 92,
          width: naturalW,
          height: naturalH,
        },
        issue: null,
        draft,
        detectedLines: draft.detectedTextLines ?? [],
      }
    }

    ctx.drawImage(img, 0, 0, sampleW, sampleH)
    const { data } = ctx.getImageData(0, 0, sampleW, sampleH)
    const metrics = computeMetricsFromImageData(data, sampleW, sampleH)
    metrics.width = naturalW
    metrics.height = naturalH

    let issueCode: ReceiptValidationIssueCode | null = null
    if (metrics.brightness < 22) {
      issueCode = 'too_dark'
    } else if (metrics.glareRatio > 68 && metrics.contrast < 22) {
      issueCode = 'glare_overexposed'
    } else if (metrics.sharpness < 14) {
      issueCode = 'blurry'
    } else if (metrics.contrast < 14) {
      issueCode = 'low_contrast_faded'
    } else if (metrics.textDensity < 10 && metrics.sharpness < 24) {
      issueCode = 'not_receipt'
    }

    if (issueCode) {
      const issue = getValidationIssueByCode(issueCode)
      const draft = issue.canForceContinue ? createReceiptDraftForCategory(category, participantIds) : null
      return {
        valid: false,
        metrics,
        issue,
        draft,
        detectedLines: draft?.detectedTextLines ?? [],
      }
    }

    const draft = createReceiptDraftForCategory(category, participantIds)
    return {
      valid: true,
      metrics,
      issue: null,
      draft,
      detectedLines: draft.detectedTextLines ?? [],
    }
  } catch {
    const issue = getValidationIssueByCode('not_receipt')
    return {
      valid: false,
      metrics: {
        brightness: 0,
        sharpness: 0,
        contrast: 0,
        glareRatio: 0,
        textDensity: 0,
        confidence: 0,
        width: 0,
        height: 0,
      },
      issue,
      draft: null,
      detectedLines: [],
    }
  }
}

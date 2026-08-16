import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"

// html-to-image re-fetches every <img> src and inlines it as a base64 data
// URL before rasterizing, on top of the browser's own decode of the visible
// <img>. On slow mobile CPUs/networks that round trip can lose the race
// against the canvas snapshot and the image is silently dropped from the
// output. Pre-converting each <img> to a data: URL here does that fetch
// once, up front, and lets html-to-image skip its internal fetch entirely
// (it no-ops on srcs that are already data: URLs). Waiting for `decode()`
// afterwards also guarantees the pixels are actually ready to paint, not
// just downloaded, before the snapshot runs. Callers must call the
// returned restore() once toPng() has finished, since we mutate img.src.
async function inlineImages(node: HTMLElement): Promise<() => void> {
  const images = Array.from(node.querySelectorAll("img"))
  const originalSrcs = images.map((img) => img.src)

  await Promise.all(
    images.map(async (img) => {
      if (!img.src || img.src.startsWith("data:")) {
        return img.decode().catch(() => {})
      }
      try {
        const res = await fetch(img.src)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        })
        img.src = dataUrl
        await img.decode().catch(() => {})
      } catch {
        // Fetch/decode failed (offline, bad path, etc.) — leave the
        // original src in place and let html-to-image try its own fetch
        // rather than losing the image entirely.
      }
    }),
  )

  return () => {
    images.forEach((img, i) => {
      img.src = originalSrcs[i]
    })
  }
}

async function nodeToPng(node: HTMLElement): Promise<string> {
  const restoreImages = await inlineImages(node)
  try {
    // Render at 2x for crisp output. Use the resolved background so the
    // exported image isn't transparent.
    const bg = getComputedStyle(document.body).backgroundColor || "#ffffff"
    return await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: bg,
    })
  } finally {
    restoreImages()
  }
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function exportAsImage(node: HTMLElement, filename: string) {
  const dataUrl = await nodeToPng(node)
  triggerDownload(dataUrl, `${filename}.png`)
}

export async function exportAsPdf(node: HTMLElement, filename: string) {
  const dataUrl = await nodeToPng(node)
  const img = new Image()
  img.src = dataUrl
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 32
  const maxWidth = pageWidth - margin * 2
  const ratio = img.height / img.width
  let renderWidth = maxWidth
  let renderHeight = renderWidth * ratio
  const maxHeight = pageHeight - margin * 2
  if (renderHeight > maxHeight) {
    renderHeight = maxHeight
    renderWidth = renderHeight / ratio
  }
  const x = (pageWidth - renderWidth) / 2
  pdf.addImage(dataUrl, "PNG", x, margin, renderWidth, renderHeight)
  pdf.save(`${filename}.pdf`)
}

export async function shareInvoice(
  node: HTMLElement,
  filename: string,
): Promise<"shared" | "downloaded"> {
  const dataUrl = await nodeToPng(node)
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], `${filename}.png`, { type: "image/png" })

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    // Share the image alone — no title/text caption, so apps like
    // WhatsApp don't prefill a message such as "invoice-XXX".
    await navigator.share({ files: [file] })
    return "shared"
  }

  triggerDownload(dataUrl, `${filename}.png`)
  return "downloaded"
}

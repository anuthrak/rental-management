import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"

async function nodeToPng(node: HTMLElement): Promise<string> {
  // Render at 2x for crisp output. Use the resolved background so the
  // exported image isn't transparent.
  const bg = getComputedStyle(document.body).backgroundColor || "#ffffff"
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: bg,
  })
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
    await navigator.share({
      files: [file],
      title: filename,
      text: filename,
    })
    return "shared"
  }

  triggerDownload(dataUrl, `${filename}.png`)
  return "downloaded"
}

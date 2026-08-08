import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"

// html-to-image snapshots the DOM synchronously, so any <img> that hasn't
// finished decoding yet (e.g. the stamp logo) gets silently dropped from
// the output. Wait for every image in the node to be fully decoded first.
async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"))
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return img
        .decode()
        .catch(
          () =>
            new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            }),
        )
    }),
  )
}

async function nodeToPng(node: HTMLElement): Promise<string> {
  await waitForImages(node)
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
    // Share the image alone — no title/text caption, so apps like
    // WhatsApp don't prefill a message such as "invoice-XXX".
    await navigator.share({ files: [file] })
    return "shared"
  }

  triggerDownload(dataUrl, `${filename}.png`)
  return "downloaded"
}

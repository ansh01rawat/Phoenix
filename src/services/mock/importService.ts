import type { ArchiveMetadata } from '@/types/repair'

/** Checks bounded ZIP metadata only. Never extracts or executes archive entries. */
export async function validateArchive(file: File): Promise<ArchiveMetadata> {
  if (!/\.zip$/i.test(file.name)) throw new Error('Choose a ZIP archive (.zip).')
  if (file.size > 20 * 1024 * 1024) throw new Error('This demo accepts archives up to 20 MB.')
  if (file.size < 22) throw new Error('This file is empty or is not a complete ZIP archive.')
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (header[0] !== 80 || header[1] !== 75 || header[2] !== 3 || header[3] !== 4)
    throw new Error('The file does not contain a supported ZIP header.')
  const tail = new DataView(await file.slice(Math.max(0, file.size - 65557)).arrayBuffer())
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50) {
      const entries = tail.getUint16(i + 10, true)
      if (entries === 0 || entries === 65535)
        throw new Error(
          'Choose a non-empty, standard ZIP archive. ZIP64 is not supported in this demo.',
        )
      if (i + 22 + tail.getUint16(i + 20, true) !== tail.byteLength) continue
      return { name: file.name, size: file.size, entries }
    }
  }
  throw new Error('The ZIP directory could not be found. Choose a complete archive.')
}

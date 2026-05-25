import { withRetry } from '../retry'
import type { HttpClient } from '../HttpClient'
import type { ClaimDocument, DocumentType } from '../types'

export interface UploadOptions {
  type: DocumentType
  fileName?: string
  onProgress?: (percent: number) => void
}

export class DocumentsNamespace {
  constructor(private http: HttpClient) {}

  async upload(
    claimId: string,
    file: Buffer | Blob,
    options: UploadOptions
  ): Promise<ClaimDocument> {
    const { type, onProgress } = options
    const fileName = options.fileName ?? 'document'

    if (onProgress) {
      await this.simulateProgress(onProgress)
    }

    const formData = new FormData()
    const blob = Buffer.isBuffer(file) ? new Blob([file]) : file
    formData.append('file', blob, fileName)
    formData.append('type', type)

    return withRetry(() =>
      this.http.postFormData<ClaimDocument>(`/api/v1/claims/${claimId}/documents`, formData)
    )
  }

  private simulateProgress(onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve) => {
      let pct = 0
      const interval = setInterval(() => {
        pct = Math.min(pct + Math.floor(Math.random() * 30) + 10, 95)
        onProgress(pct)
        if (pct >= 95) {
          clearInterval(interval)
          setTimeout(() => {
            onProgress(100)
            resolve()
          }, 50)
        }
      }, 80)
    })
  }
}

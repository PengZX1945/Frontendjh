import { requestWithFormData } from '@/api/http'
import { readEnvelopeData, isRecord, toText } from '@/utils/type-guards'
import type { ApiRequestOptions } from '@/types/api'

/**
 * `POST /api/upload` — 上传单张图片。
 * 限制：jpg / jpeg / png / webp，单张 ≤ 5MB；失败返回 code 8。
 * 前端在 `utils/image-upload.ts` 里会先做一遍本地校验，避免无谓的往返。
 */
export async function uploadImage(file: File, options: ApiRequestOptions = {}): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const rawBody = await requestWithFormData<unknown>('/upload', formData, options)
  const data = readEnvelopeData(rawBody)
  if (isRecord(data)) return toText(data.url)
  return typeof data === 'string' ? data : ''
}

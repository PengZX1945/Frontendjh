import { uploadConstraints } from '@/constants/domain'

/** 人类可读的体积上限，用于错误提示 */
export const maxFileSizeLabel = `${Math.round(uploadConstraints.maxFileSizeBytes / 1024 / 1024)}MB`

/**
 * 上传前的本地校验。
 * 与接口文档的限制保持一致（jpg/jpeg/png/webp，单张 ≤ 5MB），
 * 先在本地拦一次，避免明知会被拒还打一次往返。
 */
export function validateImageFile(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isMimeAccepted = uploadConstraints.acceptedMimeTypes.includes(
    file.type as (typeof uploadConstraints.acceptedMimeTypes)[number],
  )
  const isExtensionAccepted = uploadConstraints.acceptedExtensions.includes(
    extension as (typeof uploadConstraints.acceptedExtensions)[number],
  )

  if (!isMimeAccepted && !isExtensionAccepted) {
    return `仅支持 ${uploadConstraints.acceptedExtensions.join(' / ')} 格式`
  }
  if (file.size > uploadConstraints.maxFileSizeBytes) {
    return `单张图片不能超过 ${maxFileSizeLabel}`
  }
  return ''
}

/** `<input accept>` 属性值 */
export const imageAcceptAttribute = uploadConstraints.acceptedExtensions
  .map((extension) => `.${extension}`)
  .join(',')

/**
 * 后端统一错误码表（对应接口文档「0.2 错误码表」）。
 *
 * 所有接口的响应结构都是 { code, msg, data }，code === 0 表示成功。
 * 页面里不要直接写数字，统一用 ErrorCode.XXX 判断，提示文案用 resolveErrorMessage 取，
 * 这样后端新增 / 调整错误码时只需要改这一个文件。
 */

/** 错误码常量 */
export const ErrorCode = {
  /** 成功 */
  SUCCESS: 0,
  /** 参数错误：请求参数缺失或格式不合法 */
  PARAM_ERROR: 10001,
  /** 未登录或登录已过期：token 缺失 / 非法 / 过期，前端应跳登录页 */
  UNAUTHORIZED: 10002,
  /** 无权限操作：角色不满足接口要求 */
  FORBIDDEN: 10003,
  /** 资源不存在：帖子 / 用户 / 公告等不存在 */
  NOT_FOUND: 10004,
  /** 用户名已存在：注册冲突 */
  USERNAME_EXISTS: 10005,
  /** 用户名或密码错误：登录失败 */
  LOGIN_FAILED: 10006,
  /** 当前状态不允许该操作：如重复审核、审核未发布帖、修改他人帖子 */
  INVALID_STATE: 10007,
  /** 文件上传失败：格式不支持或超过大小限制 */
  UPLOAD_FAILED: 10008,
  /** 请勿重复提交：如重复认领同一帖子 */
  DUPLICATE_SUBMIT: 10009,
  /** 账号已被禁用：登录时被禁用的账号 */
  ACCOUNT_DISABLED: 10010,
  /** 新密码不能与旧密码相同 */
  PASSWORD_SAME_AS_OLD: 10011,
  /** 服务器内部错误：未预期异常 */
  SERVER_ERROR: 20001,
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

/** 错误码 → 兜底提示文案，后端 msg 缺失时使用 */
export const ERROR_CODE_MESSAGE: Record<number, string> = {
  [ErrorCode.PARAM_ERROR]: '参数错误',
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '无权限操作',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.USERNAME_EXISTS]: '用户名已存在',
  [ErrorCode.LOGIN_FAILED]: '用户名或密码错误',
  [ErrorCode.INVALID_STATE]: '当前状态不允许该操作',
  [ErrorCode.UPLOAD_FAILED]: '文件上传失败',
  [ErrorCode.DUPLICATE_SUBMIT]: '请勿重复提交',
  [ErrorCode.ACCOUNT_DISABLED]: '账号已被禁用',
  [ErrorCode.PASSWORD_SAME_AS_OLD]: '新密码不能与旧密码相同',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误',
}

/** 是否成功：页面拿到响应后先判断它，再处理 data */
export function isSuccess(code: unknown): boolean {
  return code === ErrorCode.SUCCESS
}

/**
 * 统一取错误提示：优先用错误码表里的文案，其次用后端返回的 msg，最后用默认文案。
 * 用法：message.value = resolveErrorMessage(res?.code, res?.msg)
 */
export function resolveErrorMessage(
  code: unknown,
  msg?: string,
  fallback = '操作失败，请稍后重试',
): string {
  const mapped = typeof code === 'number' ? ERROR_CODE_MESSAGE[code] : undefined
  return mapped || msg || fallback
}

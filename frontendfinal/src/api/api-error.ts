import type { ApiErrorKind } from '@/types/api'

/** 接口文档「错误码表」中由后端业务 code 承担的部分，用于 msg 缺失时兜底 */
export const businessCodeMessages: Record<number, string> = {
  1: '请求参数缺失或格式不合法',
  2: '登录状态已过期，请重新登录',
  3: '当前账号没有执行该操作的权限',
  4: '资源不存在或已被删除',
  5: '用户名已被占用',
  6: '用户名或密码错误',
  7: '当前状态不允许该操作',
  8: '文件上传失败：格式不支持或超过大小限制',
  9: '请勿重复提交',
  10: '账号已被禁用',
  11: '新密码不能与旧密码相同',
  114: '服务器内部错误，请稍后再试',
}

/** 后端「登录状态失效」的业务码（文档：token 缺失/非法/过期） */
export const authExpiredBusinessCode = 2

/** HTTP 状态码兜底文案 */
export const httpStatusMessages: Record<number, string> = {
  400: '请求参数有误',
  401: '登录状态已过期，请重新登录',
  403: '没有访问该资源的权限',
  404: '请求的资源不存在',
  405: '当前状态不允许该操作',
  406: '服务器不接受该请求格式',
  409: '该操作与现有数据冲突',
  423: '账号已被锁定',
  500: '服务器内部错误，请稍后再试',
}

/**
 * 统一异常类型。
 * 请求层把 axios 的各种失败（HTTP 4xx/5xx、业务 code、超时、断网）都收敛成它，
 * 页面只判断这一种类型。
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** 业务 code（信封里的 code）；非业务错误为 -1 */
  readonly code: number
  /** HTTP 状态码；非 HTTP 错误为 0 */
  readonly status: number

  constructor(options: { kind: ApiErrorKind; message: string; code?: number; status?: number }) {
    super(options.message)
    this.name = 'ApiError'
    this.kind = options.kind
    this.code = options.code ?? -1
    this.status = options.status ?? 0
  }

  /** 会话失效：业务 code 2 或 HTTP 401 */
  get isAuthExpired(): boolean {
    return this.code === authExpiredBusinessCode || this.status === 401
  }

  /** 是否为「资源不存在」，详情页据此展示空态而非错误态 */
  get isNotFound(): boolean {
    return this.code === 4 || this.status === 404
  }
}

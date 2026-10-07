/**
 * 后端统一响应结构。
 *
 * 所有接口的响应都是 { code, msg, data }，code === 0 表示成功（见 api/errorCode.ts）。
 * 各 api 模块共用这一个定义，避免每个模块各写一份。
 */
export interface ApiResponse<T> {
  code: number;
  msg?: string;
  data?: T | null;
};

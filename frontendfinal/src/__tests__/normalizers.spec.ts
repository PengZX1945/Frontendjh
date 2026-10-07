import { describe, expect, it } from 'vitest'

import {
  buildLoginSession,
  extractAuthToken,
  extractProfileFromLoginBody,
  normalizeUserProfile,
} from '@/utils/user-normalizers'
import { normalizeItemList, normalizeItemRecord } from '@/utils/item-normalizers'
import { buildPagedResult } from '@/utils/paged-result'
import {
  formatDateTime,
  formatRelativeTime,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/utils/date-format'

/**
 * 归一化层的价值就在「后端字段没定稿」时：这些用例固定住兼容口径，
 * 后端改字段名时，先改这里，再改实现。
 */
describe('extractAuthToken', () => {
  it('取到文档所述的 data.token', () => {
    expect(extractAuthToken({ code: 0, msg: 'ok', data: { token: 'abc.def' } })).toBe('abc.def')
  })

  it('兼容 token 放在响应体顶层', () => {
    expect(extractAuthToken({ token: 'top-level' })).toBe('top-level')
  })

  it('兼容 accessToken / jwt 等别名', () => {
    expect(extractAuthToken({ error: 'x', accessToken: 'camel' })).toBe('camel')
    expect(extractAuthToken({ jwt: 'from-jwt' })).toBe('from-jwt')
  })

  it('退回响应头，并剥离 Bearer 前缀', () => {
    expect(extractAuthToken({}, { authorization: 'Bearer header-token' })).toBe('header-token')
  })

  it('全都拿不到时返回空串（调用方按 Cookie 会话兜底）', () => {
    expect(extractAuthToken({ code: 0, msg: 'ok', data: null })).toBe('')
  })
})

describe('extractProfileFromLoginBody', () => {
  it('登录响应内联用户信息时直接复用', () => {
    const profile = extractProfileFromLoginBody({
      data: {
        token: 't',
        user: { id: 7, username: 'student001', nickname: '彭同学', role: 'user', contact: 'a@b.c' },
      },
    })
    expect(profile?.userId).toBe(7)
    expect(profile?.nickname).toBe('彭同学')
  })

  it('没有用户信息时返回 null', () => {
    expect(extractProfileFromLoginBody({ data: { token: 't' } })).toBeNull()
  })
})

describe('buildLoginSession', () => {
  it('凭证与档案一次取齐', () => {
    const session = buildLoginSession({
      code: 0,
      data: { token: 'abc', username: 'student001', nickname: '彭同学', id: 9, role: 'user' },
    })
    expect(session.authToken).toBe('abc')
    expect(session.userProfile?.userId).toBe(9)
  })
})

describe('normalizeUserProfile', () => {
  it('兼容 user_id 与 id 两种写法，未知角色收敛为普通用户', () => {
    expect(normalizeUserProfile({ user_id: 3, username: 'u', role: 'finder_admin' }).userId).toBe(3)
    expect(normalizeUserProfile({ id: 4, username: 'u', role: 'root' }).role).toBe('user')
  })
})

describe('normalizeItemRecord', () => {
  it('下划线字段映射为小驼峰，图片兼容 image / images', () => {
    const item = normalizeItemRecord({
      item_id: 5,
      type: 'found',
      item_name: '无线鼠标',
      category: '数码电子',
      happen_time: '2026-10-01 09:00:00',
      poster_contact: 'a@b.c',
      image: ['/a.png', '', '/b.png'],
      item_status: 1,
      poster_id: 2,
    })
    expect(item.itemId).toBe(5)
    expect(item.type).toBe('found')
    expect(item.happenTime).toBe('2026-10-01 09:00:00')
    expect(item.images).toEqual(['/a.png', '/b.png'])
    expect(item.itemStatus).toBe(1)
  })

  it('未知状态收敛为待审核，未知类型用兜底类型', () => {
    const item = normalizeItemRecord({ item_status: 99 }, 'found')
    expect(item.itemStatus).toBe(0)
    expect(item.type).toBe('found')
  })

  it('图片字段不是数组时按空列表处理', () => {
    expect(normalizeItemRecord({ image: null }).images).toEqual([])
  })
})

describe('normalizeItemList', () => {
  it('非数组输入返回空列表', () => {
    expect(normalizeItemList(undefined)).toEqual([])
  })
})

describe('buildPagedResult', () => {
  it('装满一页即认为还有下一页', () => {
    expect(buildPagedResult([1, 2, 3], 3).hasMore).toBe(true)
    expect(buildPagedResult([1, 2], 3).hasMore).toBe(false)
  })
})

describe('date-format', () => {
  it('解析带空格的日期串并格式化', () => {
    expect(formatDateTime('2026-10-07 10:30:00')).toBe('2026-10-07 10:30')
  })

  it('无法解析时原样回显，不出现 Invalid Date', () => {
    expect(formatDateTime('不是时间')).toBe('不是时间')
  })

  it('相对时间按区间给出中文表述', () => {
    const now = new Date('2026-10-07T12:00:00')
    expect(formatRelativeTime('2026-10-07T11:59:30', now)).toBe('刚刚')
    expect(formatRelativeTime('2026-10-07T11:30:00', now)).toBe('30 分钟前')
    expect(formatRelativeTime('2026-10-07T09:00:00', now)).toBe('3 小时前')
    expect(formatRelativeTime('2026-10-04T12:00:00', now)).toBe('3 天前')
  })

  it('datetime-local 取值去掉秒', () => {
    expect(toDateTimeLocalValue('2026-10-07 10:30:00')).toBe('2026-10-07T10:30')
  })

  /* 回归：曾把 `14:30` 只取到 `14`，分钟丢失并整点回退成 00:00 —— 该函数当时没有用例覆盖 */
  it('datetime-local 提交时保留时分', () => {
    expect(fromDateTimeLocalValue('2026-10-07T10:30')).toBe('2026-10-07 10:30:00')
    expect(fromDateTimeLocalValue('2026-10-07T23:59')).toBe('2026-10-07 23:59:00')
    expect(fromDateTimeLocalValue('2026-10-07T09:05')).toBe('2026-10-07 09:05:00')
    expect(fromDateTimeLocalValue('2026-10-07T00:00')).toBe('2026-10-07 00:00:00')
  })

  it('datetime-local 带秒时截到分钟', () => {
    expect(fromDateTimeLocalValue('2026-10-07T10:30:45')).toBe('2026-10-07 10:30:00')
  })

  it('只给日期时补零成当天零点', () => {
    expect(fromDateTimeLocalValue('2026-10-07')).toBe('2026-10-07 00:00:00')
  })

  it('空值原样返回（遗失时间允许留空）', () => {
    expect(fromDateTimeLocalValue('')).toBe('')
    expect(fromDateTimeLocalValue('   ')).toBe('')
  })

  it('与 toDateTimeLocalValue 往返一致（编辑页回填后原样存回）', () => {
    expect(toDateTimeLocalValue('2026-10-07 10:30:00')).toBe('2026-10-07T10:30')
    expect(fromDateTimeLocalValue('2026-10-07T10:30')).toBe('2026-10-07 10:30:00')
  })
})

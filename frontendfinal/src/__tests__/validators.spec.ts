import { describe, expect, it } from 'vitest'

import {
  validateClaimReason,
  validateConfirmPassword,
  validateContact,
  validateItemCategory,
  validateItemForm,
  validateItemName,
  validatePassword,
  validateUsername,
} from '@/utils/validators'
import type { ItemFormDraft } from '@/types/item'

function buildDraft(overrides: Partial<ItemFormDraft> = {}): ItemFormDraft {
  return {
    itemName: '黑色雨伞',
    category: '其他',
    location: '三号教学楼',
    happenTime: '2026-10-07T10:00',
    description: '伞柄有磨白痕迹',
    images: [],
    getLocation: '图书馆一层服务台',
    getContact: 'Astra@zjut.edu.cn',
    ...overrides,
  }
}

describe('validateUsername', () => {
  it('接受字母数字下划线', () => {
    expect(validateUsername('student_001')).toBe('')
  })

  it('拒绝过短、超长与非法字符', () => {
    expect(validateUsername('ab')).not.toBe('')
    expect(validateUsername('a'.repeat(21))).not.toBe('')
    expect(validateUsername('学生001')).not.toBe('')
  })
})

describe('validatePassword', () => {
  it('少于 6 位被拒', () => {
    expect(validatePassword('12345')).not.toBe('')
    expect(validatePassword('123456')).toBe('')
  })
})

describe('validateConfirmPassword', () => {
  it('两次输入不一致被拒', () => {
    expect(validateConfirmPassword('abc123', 'abc124')).not.toBe('')
    expect(validateConfirmPassword('abc123', 'abc123')).toBe('')
  })
})

describe('validateContact', () => {
  it('邮箱写法必须合法', () => {
    expect(validateContact('name@campus.edu')).toBe('')
    expect(validateContact('name@campus')).not.toBe('')
  })

  it('手机号一类的自由文本通过', () => {
    expect(validateContact('13800000000')).toBe('')
  })
})

describe('validateItemForm', () => {
  it('完整表单无错误', () => {
    expect(validateItemForm(buildDraft())).toEqual({})
  })

  it('缺少名称、分类、领取信息时逐项报错', () => {
    const errors = validateItemForm(
      buildDraft({ itemName: '', category: '', getLocation: '', getContact: '' }),
    )
    expect(Object.keys(errors).sort()).toEqual([
      'category',
      'getContact',
      'getLocation',
      'itemName',
    ])
  })

  it('分类必须在文档给定的列表内', () => {
    expect(validateItemCategory('其他')).toBe('')
    expect(validateItemCategory('电子产品')).not.toBe('')
  })

  it('物品名称过短被拒', () => {
    expect(validateItemName('伞')).not.toBe('')
  })
})

describe('validateClaimReason', () => {
  it('要求填写且不少于 5 个字', () => {
    expect(validateClaimReason('   ')).not.toBe('')
    expect(validateClaimReason('我的')).not.toBe('')
    expect(validateClaimReason('鼠标上有我贴的防滑贴')).toBe('')
  })
})

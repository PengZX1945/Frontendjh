#!/usr/bin/env node
/**
 * 本地联调用的 mock 后端（零依赖，仅用 node:http）。
 *
 * 目的：在后端 Go 服务就绪之前，让前端可以按接口文档真跑一遍 —— 生成种子数据、
 * 执行鉴权与角色校验、returncode 与错误码都按《精弘大作业（失物招领系统）》文档来。
 *
 * 启动：MOCK_PORT=8090 npm run mock:api
 * 前端：VITE_API_TARGET=http://localhost:8090 npm run dev
 *
 * 账号：
 *   student001 / abc123    普通用户
 *   finder001  / abc123    失物招领管理员
 *   admin      / admin123  系统管理员
 *
 * 注意：这不是交付代码，仅用于联调自测。
 */
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const port = Number(process.env.MOCK_PORT ?? 8080)

/* ────────────────────────── 错误码（与文档错误码表一致） ────────────────────────── */
const errorCodes = {
  success: 0,
  badRequest: 1,
  unauthorized: 2,
  forbidden: 3,
  notFound: 4,
  usernameTaken: 5,
  badCredentials: 6,
  invalidState: 7,
  uploadFailed: 8,
  duplicateSubmit: 9,
  accountDisabled: 10,
  samePassword: 11,
  serverError: 114,
}

const errorMessages = {
  [errorCodes.badRequest]: '参数错误',
  [errorCodes.unauthorized]: '未登录或登录已过期',
  [errorCodes.forbidden]: '无权限操作',
  [errorCodes.notFound]: '资源不存在',
  [errorCodes.usernameTaken]: '用户名已存在',
  [errorCodes.badCredentials]: '用户名或密码错误',
  [errorCodes.invalidState]: '当前状态不允许该操作',
  [errorCodes.uploadFailed]: '文件上传失败',
  [errorCodes.duplicateSubmit]: '请勿重复提交',
  [errorCodes.accountDisabled]: '账号已被禁用',
  [errorCodes.samePassword]: '新密码不能与旧密码相同',
  [errorCodes.serverError]: '服务器内部错误',
}

/* ────────────────────────── 工具：占位图（内联 SVG，可离线渲染） ────────────────────────── */
const categoryPalette = {
  卡证: ['#dbeafe', '#1e3a8a'],
  数码电子: ['#e0e7ff', '#312e81'],
  挂饰饰品: ['#fce7f3', '#831843'],
  箱包: ['#fef3c7', '#78350f'],
  钥匙: ['#d1fae5', '#064e3b'],
  书籍文具: ['#ede9fe', '#4c1d95'],
  衣物: ['#ffe4e6', '#881337'],
  现金钱包: ['#dcfce7', '#14532d'],
  其他: ['#f1f5f9', '#334155'],
}

function buildPlaceholderImage(label, category) {
  const [background, ink] = categoryPalette[category] ?? categoryPalette['其他']
  const safeLabel = String(label).slice(0, 12)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<rect width="640" height="480" fill="${background}"/>
<circle cx="500" cy="90" r="120" fill="${ink}" opacity="0.08"/>
<circle cx="120" cy="400" r="160" fill="${ink}" opacity="0.06"/>
<text x="48" y="250" font-family="PingFang SC, Helvetica, sans-serif" font-size="46" font-weight="600" fill="${ink}">${safeLabel}</text>
<text x="48" y="300" font-family="PingFang SC, Helvetica, sans-serif" font-size="22" fill="${ink}" opacity="0.6">${category}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/* ────────────────────────── 内存数据 ────────────────────────── */
let nextUserId = 1
let nextItemId = 1
let nextClaimId = 1
let nextAnnouncementId = 1

const users = []
const items = []
const claims = []
const announcements = []

function createUser({ username, password, nickname, contact, role }) {
  const user = {
    user_id: nextUserId++,
    username,
    password,
    nickname,
    contact,
    role: role ?? 'user',
    disabled: false,
  }
  users.push(user)
  return user
}

createUser({
  username: 'admin',
  password: 'admin123',
  nickname: '系统管理员',
  contact: '13800000000',
  role: 'sys_admin',
})
// 第二个 sys_admin：文档「不允许修改其他 sys_admin 的角色」这条规则要有多个 sys_admin 才验证得了
createUser({
  username: 'admin2',
  password: 'admin123',
  nickname: '系统管理员（副）',
  contact: '13800000099',
  role: 'sys_admin',
})
createUser({
  username: 'finder001',
  password: 'abc123',
  nickname: '招领处・李同学',
  contact: 'liming@campus.edu',
  role: 'finder_admin',
})
createUser({
  username: 'student001',
  password: 'abc123',
  nickname: '张同学',
  contact: 'pzx@campus.edu',
})
createUser({
  username: 'student002',
  password: 'abc123',
  nickname: '王同学',
  contact: 'wang@campus.edu',
})

// 种子里引用用户一律按用户名解析 ID，避免插入新用户后写死的数字整体位移
function userIdOf(username) {
  const found = users.find((entry) => entry.username === username)
  return found === undefined ? 0 : found.user_id
}
const student001Id = userIdOf('student001')
const student002Id = userIdOf('student002')
const finderId = userIdOf('finder001')

const seedItems = [
  [
    'lost',
    '黑色长柄雨伞',
    '其他',
    '三号教学楼 2 层自习室',
    '伞柄有一圈磨白的胶布，伞骨内侧写了名字缩写',
    '图书馆一层服务台',
    'asd@campus.edu',
    2,
  ],
  [
    'lost',
    'AirPods Pro 充电盒',
    '数码电子',
    '体育馆羽毛球场 4 号场',
    '外壳有一处磕碰凹痕，内侧刻了手机号后四位',
    '体育馆器材室',
    'pasd@campus.edu',
    5,
  ],
  [
    'lost',
    '蓝色学生卡（章同学）',
    '卡证',
    '二食堂二楼',
    '卡面右下角贴了一枚蓝色贴纸',
    '二食堂失物窗',
    '13800000001',
    1,
  ],
  [
    'lost',
    '黑色双肩包',
    '箱包',
    '东门校车站台',
    '包内有线装笔记本与一支钢笔，拉链头换过',
    '东门保安亭',
    'pasd@campus.edu',
    3,
  ],
  [
    'lost',
    '银色保温杯',
    '其他',
    '四号教学楼 501 阶梯教室',
    '杯盖内圈有茶渍，杯身贴着实验室标签',
    '四号教学楼值班室',
    '13500000002',
    8,
  ],
  [
    'lost',
    '宿舍钥匙（三把一串）',
    '钥匙',
    '五号宿舍楼电梯口',
    '钥匙扣是橙色塑料圆牌，牌上写着宿舍号',
    '五号宿舍楼宿管处',
    '13600000003',
    2,
  ],
  [
    'lost',
    '蓝色文件夹（内含实验报告）',
    '书籍文具',
    '化学实验楼 B210',
    '封面贴着一张实验安排表，内有手写数据',
    '化学实验楼收发室',
    'pasd@campus.edu',
    6,
  ],
  [
    'lost',
    '灰色围巾',
    '衣物',
    '图书馆三层南侧靠窗座位',
    '羊绒材质，一端有勾丝',
    '图书馆一层服务台',
    '13700000004',
    4,
  ],
  [
    'lost',
    '棕色皮质钱包（少量现金）',
    '现金钱包',
    '操场跑道外侧看台',
    '内有校园卡与一张公交卡，现金不多',
    '操场管理室',
    'pasd@campus.edu',
    7,
  ],
  [
    'lost',
    '银戒指（素圈）',
    '挂饰饰品',
    '游泳馆更衣室 3 号柜前',
    '内圈刻字模糊，圈口偏细',
    '游泳馆前台',
    '13800000005',
    9,
  ],
  [
    'found',
    '白色无线鼠标',
    '数码电子',
    '一号教学楼机房 A',
    '底部有使用痕迹，接收器还在收在电池仓里',
    '一号教学楼机房值班室',
    '机房管理员 13500000010',
    1,
  ],
  [
    'found',
    '黑色雨伞（自动伞）',
    '其他',
    '三号教学楼大厅伞架',
    '伞面印有校徽，自动开合正常',
    '三号教学楼物业值班室',
    '物业 13500000011',
    2,
  ],
  [
    'found',
    '学生证（张同学）',
    '卡证',
    '图书馆自助借还机旁',
    '证件照清晰，学号可见',
    '图书馆一层服务台',
    '前台 13500000012',
    3,
  ],
  [
    'found',
    '深蓝色笔袋',
    '书籍文具',
    '四号教学楼 302 教室',
    '内含两支黑色签字笔与一把直尺',
    '四号教学楼值班室',
    '值班室 13500000013',
    4,
  ],
  [
    'found',
    '保温杯（不锈钢）',
    '其他',
    '体育馆看台第三排',
    '杯身贴着一枚已经卷边的贴纸',
    '体育馆器材室',
    '器材室 13500000014',
    5,
  ],
  [
    'found',
    '一串钥匙（带小黄鸭挂件）',
    '钥匙',
    '二食堂门口长椅',
    '挂件是一只小黄鸭，共四把钥匙',
    '二食堂失物窗',
    '窗口 13500000015',
    6,
  ],
  [
    'found',
    '黑色有线耳机',
    '数码电子',
    '五号宿舍楼一楼洗衣房',
    '线材有一处缠胶带，耳塞套偏小号',
    '五号宿舍楼宿管处',
    '宿管 13500000016',
    8,
  ],
  [
    'found',
    '米白色针织开衫',
    '衣物',
    '一号教学楼 208 教室椅背',
    '均码，左袖口有小块污渍',
    '一号教学楼值班室',
    '值班室 13500000017',
    9,
  ],
  [
    'found',
    '帆布袋（印有社团标志）',
    '箱包',
    '操场入口台阶',
    '袋内有一本英语词汇书与一副眼镜布',
    '操场管理室',
    '管理室 13500000018',
    7,
  ],
  [
    'found',
    '银色手链',
    '挂饰饰品',
    '游泳馆更衣区长凳',
    '链节处有一处断开后用线缠过',
    '游泳馆前台',
    '前台 13500000019',
    10,
  ],
]

function daysAgoIso(days) {
  const date = new Date(Date.now() - days * 24 * 3600 * 1000)
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

for (const [
  type,
  itemName,
  category,
  location,
  description,
  getLocation,
  getContact,
  days,
] of seedItems) {
  const happenTime = daysAgoIso(days)
  items.push({
    item_id: nextItemId++,
    type,
    item_name: itemName,
    category,
    location,
    happen_time: happenTime,
    poster_contact: getContact,
    description,
    image: [buildPlaceholderImage(itemName, category)],
    item_status: 1,
    created_time: happenTime,
    last_edit_time: happenTime,
    reject_reason: '',
    poster_id: type === 'lost' ? student001Id : finderId,
    get_location: getLocation,
    get_contact: getContact,
  })
}

// 追加批量生成的数据：一页 12 条，只有超过一页才能真正验证「滚动加载下一页」
const extraCategories = ['卡证', '数码电子', '钥匙', '书籍文具', '衣物', '其他', '箱包']
const extraLostNames = [
  '黑色机械键盘腕托',
  '充电宝（白色 20000mAh）',
  '蓝色水彩笔盒',
  '黄色手机支架',
  '灰色运动水壶',
  '银色 U 盘（32G）',
  '红色棒球帽',
  '白色护腕（一对）',
  '黑色眼镜盒',
  '绿色环保袋',
  '棕色皮带',
  '粉色化妆包',
  '黑色耳机转接头',
  '蓝色游泳镜',
  '白色充电线（Type-C）',
  '灰色笔记本内胆包',
  '黑色计算器',
  '黄色雨衣',
]
const extraFoundNames = [
  '黑色 U 盘（16G）',
  '蓝色运动手环',
  '白色充电器（65W）',
  '灰色钥匙包',
  '棕色皮质笔袋',
  '银色口琴',
  '红色围脖',
  '黑色刻度尺',
  '蓝色保温饭盒',
  '白色蓝牙耳机盒',
  '灰色鼠标垫',
  '黑色双肩电脑包',
]

for (const [index, name] of extraLostNames.entries()) {
  const category = extraCategories[index % extraCategories.length]
  const happenTime = daysAgoIso(index * 2 + 3)
  items.push({
    item_id: nextItemId++,
    type: 'lost',
    item_name: name,
    category,
    location: `${(index % 6) + 1} 号教学楼 ${(index % 4) + 1}0${(index % 9) + 1} 教室`,
    happen_time: happenTime,
    poster_contact: index % 2 === 0 ? 'pzx@campus.edu' : 'student002@campus.edu',
    description: `${name}的特征：${['有一处明显磨损', '贴了手写标签', '边角有磕碰痕迹', '颜色略有褪色', '带有挂饰'][index % 5]}，如有拾到请与我联系。`,
    image: [buildPlaceholderImage(name, category)],
    item_status: 1,
    created_time: happenTime,
    last_edit_time: happenTime,
    reject_reason: '',
    poster_id: index % 2 === 0 ? student001Id : student002Id,
    get_location: `${(index % 6) + 1} 号教学楼值班室`,
    get_contact: index % 2 === 0 ? 'pzx@campus.edu' : 'student002@campus.edu',
  })
}

for (const [index, name] of extraFoundNames.entries()) {
  const category = extraCategories[(index + 3) % extraCategories.length]
  const happenTime = daysAgoIso(index * 2 + 1)
  items.push({
    item_id: nextItemId++,
    type: 'found',
    item_name: name,
    category,
    location: `${(index % 5) + 1} 号教学楼走廊`,
    happen_time: happenTime,
    poster_contact: '招领处 13500000010',
    description: `在${(index % 5) + 1} 号教学楼走廊拾到，${['外观完好', '有一处划痕', '贴纸已卷边', '带原装收纳袋'][index % 4]}，暂存于值班室。`,
    image: [buildPlaceholderImage(name, category)],
    item_status: 1,
    created_time: happenTime,
    last_edit_time: happenTime,
    reject_reason: '',
    poster_id: finderId,
    get_location: `${(index % 5) + 1} 号教学楼值班室`,
    get_contact: '招领处 13500000010',
  })
}

// 一条待审核、一条已驳回，用于验证审核台与「我的发布」的驳回理由展示
items.push({
  item_id: nextItemId++,
  type: 'lost',
  item_name: '白色蓝牙音箱',
  category: '数码电子',
  location: '六号教学楼报告厅',
  happen_time: daysAgoIso(1),
  poster_contact: 'pzx@campus.edu',
  description: '音箱侧面有一道细小划痕，配黑色挂绳',
  image: [buildPlaceholderImage('白色蓝牙音箱', '数码电子')],
  item_status: 0,
  created_time: daysAgoIso(1),
  last_edit_time: daysAgoIso(1),
  reject_reason: '',
  poster_id: student001Id,
  get_location: '六号教学楼值班室',
  get_contact: 'pzx@campus.edu',
})

items.push({
  item_id: nextItemId++,
  type: 'found',
  item_name: '保温饭盒',
  category: '其他',
  location: '二食堂三楼',
  happen_time: daysAgoIso(4),
  poster_contact: '窗口 13500000020',
  description: '饭盒',
  image: [buildPlaceholderImage('保温饭盒', '其他')],
  item_status: 2,
  created_time: daysAgoIso(4),
  last_edit_time: daysAgoIso(3),
  reject_reason: '描述过于简单，请补充外观特征（颜色、品牌、有无贴纸）后重新提交',
  poster_id: finderId,
  get_location: '二食堂失物窗',
  get_contact: '窗口 13500000020',
})

claims.push({
  claim_id: nextClaimId++,
  item_id: 11,
  reason: '鼠标底部有一道我贴的防滑贴，接收器上写着我的名字缩写 WL',
  applicant_contact: 'wang@campus.edu',
  created_time: daysAgoIso(0),
  last_edit_time: daysAgoIso(0),
  claim_status: 0,
  applicant_id: student002Id,
})

claims.push({
  claim_id: nextClaimId++,
  item_id: 13,
  reason: '学生证是我本人的，学号 2023xxxxxx，证件照可以核对',
  applicant_contact: 'pzx@campus.edu',
  created_time: daysAgoIso(1),
  last_edit_time: daysAgoIso(1),
  claim_status: 1,
  applicant_id: student001Id,
})

announcements.push(
  {
    announcement_id: nextAnnouncementId++,
    title: '失物招领处开放时间调整',
    content:
      '自本周起，图书馆一层失物招领服务台开放时间调整为 08:30–20:30，中午不休息。\n节假日期间请以门口告示为准，感谢配合。',
    announcement_status: 0,
    created_time: daysAgoIso(2),
  },
  {
    announcement_id: nextAnnouncementId++,
    title: '关于认领流程的说明',
    content:
      '为提高核对准确率，认领申请需写清物品的可辨识特征。管理员核对通过后，会在 1 个工作日内联系申请人安排交接。\n请勿在申请中直接公开完整证件号码等敏感信息。',
    announcement_status: 0,
    created_time: daysAgoIso(6),
  },
  {
    announcement_id: nextAnnouncementId++,
    title: '【已结束】开学季失物集中清点',
    content: '开学季集中清点活动已结束，未被认领的物品已统一移交各楼栋值班室保管。',
    announcement_status: 1,
    created_time: daysAgoIso(20),
  },
)

/* ────────────────────────── HTTP 辅助 ────────────────────────── */
function sendJson(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  })
  response.end(body)
}

function ok(response, data = null) {
  sendJson(response, 200, { code: errorCodes.success, msg: 'success', data })
}

function fail(response, code, httpStatus = 200) {
  sendJson(response, httpStatus, { code, msg: errorMessages[code] ?? '请求失败', data: null })
}

async function readJsonBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

function resolveUser(request) {
  const header = request.headers.authorization ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (match === null) return null
  const token = match[1]
  const userId = Number(token.replace('mock-token-', ''))
  return users.find((user) => user.user_id === userId) ?? null
}

function isBackOffice(user) {
  return user.role === 'finder_admin' || user.role === 'sys_admin'
}

function paginate(list, query) {
  const page = Number(query.get('page') ?? 1) || 1
  const pageSize = Number(query.get('page_size') ?? 12) || 12
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function toPublicItem(item) {
  const { ...rest } = item
  return { ...rest }
}

/* ────────────────────────── 路由 ────────────────────────── */
const requestLog = []

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`)
  // 文档里多个路径带尾斜杠，这里统一去掉再匹配
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const query = url.searchParams
  const method = request.method ?? 'GET'

  requestLog.push(`${method} ${path}${url.search}`)
  if (requestLog.length > 60) requestLog.shift()

  if (method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  const user = resolveUser(request)
  const requireUser = () => {
    if (user === null) {
      fail(response, errorCodes.unauthorized, 401)
      return false
    }
    return true
  }
  const requireBackOffice = () => {
    if (!requireUser()) return false
    if (!isBackOffice(user)) {
      fail(response, errorCodes.forbidden, 403)
      return false
    }
    return true
  }
  const requireSysAdmin = () => {
    if (!requireUser()) return false
    if (user.role !== 'sys_admin') {
      fail(response, errorCodes.forbidden, 403)
      return false
    }
    return true
  }

  /* ---------- 上传 ---------- */
  if (method === 'POST' && path === '/api/upload') {
    if (!requireUser()) return
    // 真实实现会解析 multipart；这里直接回一个可渲染的占位图
    ok(response, { url: buildPlaceholderImage('已上传图片', '其他') })
    return
  }

  /* ---------- 鉴权 ---------- */
  if (method === 'POST' && path === '/api/auth/register') {
    const body = await readJsonBody(request)
    if (!body.username || !body.password || !body.nickname || !body.contact) {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    if (users.some((entry) => entry.username === body.username)) {
      fail(response, errorCodes.usernameTaken, 409)
      return
    }
    createUser({
      username: body.username,
      password: body.password,
      nickname: body.nickname,
      contact: body.contact,
    })
    ok(response, null)
    return
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await readJsonBody(request)
    const matched = users.find((entry) => entry.username === body.username)
    if (matched === undefined || matched.password !== body.password) {
      fail(response, errorCodes.badCredentials, 401)
      return
    }
    if (matched.disabled) {
      fail(response, errorCodes.accountDisabled, 423)
      return
    }
    // 与文档一致：凭证放在 data.token
    ok(response, { token: `mock-token-${matched.user_id}` })
    return
  }

  if (method === 'POST' && path === '/api/auth/logout') {
    if (!requireUser()) return
    ok(response, null)
    return
  }

  if (path === '/api/auth/profile' && method === 'GET') {
    if (!requireUser()) return
    ok(response, {
      id: user.user_id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      contact: user.contact,
    })
    return
  }

  if (path === '/api/auth/profile' && method === 'PUT') {
    if (!requireUser()) return
    const body = await readJsonBody(request)
    const queryUserId = Number(query.get('user_id') ?? 0)
    if (queryUserId !== 0 && queryUserId !== user.user_id) {
      fail(response, errorCodes.forbidden, 403)
      return
    }
    if (!body.nickname || !body.contact) {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    user.nickname = body.nickname
    user.contact = body.contact
    ok(response, null)
    return
  }

  if (path === '/api/auth/password' && method === 'PUT') {
    if (!requireUser()) return
    const body = await readJsonBody(request)
    if (body.old_password !== user.password) {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    if (body.new_password === body.old_password) {
      fail(response, errorCodes.samePassword, 400)
      return
    }
    user.password = body.new_password
    ok(response, null)
    return
  }

  /* ---------- 物品：公开列表与详情 ---------- */
  const listMatch = /^\/api\/items\/list\/(lost|found)$/.exec(path)
  if (method === 'GET' && listMatch !== null) {
    const type = listMatch[1]
    let result = items.filter((item) => item.type === type && item.item_status === 1)
    const category = query.get('category') ?? ''
    if (category !== '') result = result.filter((item) => item.category === category)
    const keyword = query.get('keyword') ?? ''
    if (keyword !== '') {
      result = result.filter(
        (item) => item.item_name.includes(keyword) || item.description.includes(keyword),
      )
    }
    const location = query.get('location') ?? ''
    if (location !== '') result = result.filter((item) => item.location.includes(location))
    result = [...result].sort((left, right) => (left.happen_time < right.happen_time ? 1 : -1))
    ok(response, { items: paginate(result, query).map(toPublicItem) })
    return
  }

  if (method === 'GET' && path === '/api/my/items') {
    if (!requireUser()) return
    let result = items.filter((item) => item.poster_id === user.user_id)
    const type = query.get('type') ?? ''
    if (type !== '') result = result.filter((item) => item.type === type)
    const statusParam = query.get('item_status')
    if (statusParam !== null && statusParam !== '') {
      result = result.filter((item) => item.item_status === Number(statusParam))
    }
    result = [...result].sort((left, right) => (left.created_time < right.created_time ? 1 : -1))
    ok(response, { items: paginate(result, query).map(toPublicItem) })
    return
  }

  const closeMatch = /^\/api\/items\/(\d+)\/close$/.exec(path)
  if (method === 'POST' && closeMatch !== null) {
    if (!requireUser()) return
    const item = items.find((entry) => entry.item_id === Number(closeMatch[1]))
    if (item === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    if (item.poster_id !== user.user_id && !isBackOffice(user)) {
      fail(response, errorCodes.forbidden, 403)
      return
    }
    item.item_status = 3
    item.last_edit_time = daysAgoIso(0)
    ok(response, null)
    return
  }

  const detailMatch = /^\/api\/items\/(\d+)$/.exec(path)
  if (detailMatch !== null && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
    const item = items.find((entry) => entry.item_id === Number(detailMatch[1]))
    if (item === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }

    if (method === 'GET') {
      // 待审核 / 已驳回仅本人与管理员可见
      if (item.item_status === 0 || item.item_status === 2) {
        const viewer = user
        if (viewer === null || (viewer.user_id !== item.poster_id && !isBackOffice(viewer))) {
          fail(response, errorCodes.notFound, 404)
          return
        }
      }
      ok(response, toPublicItem(item))
      return
    }

    if (method === 'PUT') {
      if (!requireUser()) return
      if (item.poster_id !== user.user_id && !isBackOffice(user)) {
        fail(response, errorCodes.forbidden, 403)
        return
      }
      if (item.item_status === 3) {
        fail(response, errorCodes.invalidState, 405)
        return
      }
      const body = await readJsonBody(request)
      if (!body.item_name || !body.category || !body.get_location || !body.get_contact) {
        fail(response, errorCodes.badRequest, 400)
        return
      }
      Object.assign(item, {
        type: body.type ?? item.type,
        item_name: body.item_name,
        category: body.category,
        location: body.location ?? '',
        happen_time: body.happen_time ?? '',
        description: body.description ?? '',
        image: Array.isArray(body.image) ? body.image : [],
        get_location: body.get_location,
        get_contact: body.get_contact,
        item_status: 0,
        reject_reason: '',
        last_edit_time: daysAgoIso(0),
      })
      ok(response, null)
      return
    }

    if (!requireUser()) return
    if (item.poster_id !== user.user_id && !isBackOffice(user)) {
      fail(response, errorCodes.forbidden, 403)
      return
    }
    items.splice(items.indexOf(item), 1)
    ok(response, null)
    return
  }

  const createItemMatch = /^\/api\/items\/(lost|found)$/.exec(path)
  if (method === 'POST' && createItemMatch !== null) {
    if (!requireUser()) return
    const body = await readJsonBody(request)
    if (!body.item_name || !body.category || !body.get_location || !body.get_contact) {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    const now = daysAgoIso(0)
    items.push({
      item_id: nextItemId++,
      type: createItemMatch[1],
      item_name: body.item_name,
      category: body.category,
      location: body.location ?? '',
      happen_time: body.happen_time ?? '',
      poster_contact: user.contact,
      description: body.description ?? '',
      image: Array.isArray(body.image) ? body.image : [],
      item_status: 0,
      created_time: now,
      last_edit_time: now,
      reject_reason: '',
      poster_id: user.user_id,
      get_location: body.get_location,
      get_contact: body.get_contact,
    })
    ok(response, null)
    return
  }

  /* ---------- 认领申请 ---------- */
  if (method === 'GET' && path === '/api/admin/claims') {
    if (!requireBackOffice()) return
    let result = [...claims]
    const statusParam = query.get('claim_status')
    if (statusParam !== null && statusParam !== '') {
      result = result.filter((claim) => claim.claim_status === Number(statusParam))
    }
    result = result.sort((left, right) => (left.created_time < right.created_time ? 1 : -1))
    ok(response, { claims: paginate(result, query) })
    return
  }

  if (method === 'GET' && path === '/api/my/claims') {
    if (!requireUser()) return
    let result = claims.filter((claim) => claim.applicant_id === user.user_id)
    const statusParam = query.get('claim_status')
    if (statusParam !== null && statusParam !== '') {
      result = result.filter((claim) => claim.claim_status === Number(statusParam))
    }
    result = result.sort((left, right) => (left.created_time < right.created_time ? 1 : -1))
    ok(response, { claims: paginate(result, query) })
    return
  }

  if (method === 'POST' && path === '/api/claims') {
    if (!requireUser()) return
    const itemId = Number(query.get('item_id') ?? 0)
    const item = items.find((entry) => entry.item_id === itemId)
    if (item === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    if (item.type !== 'found' || item.item_status !== 1) {
      fail(response, errorCodes.invalidState, 405)
      return
    }
    if (item.poster_id === user.user_id) {
      fail(response, errorCodes.invalidState, 409)
      return
    }
    if (claims.some((claim) => claim.item_id === itemId && claim.applicant_id === user.user_id)) {
      fail(response, errorCodes.duplicateSubmit, 409)
      return
    }
    const body = await readJsonBody(request)
    if (!body.reason) {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    const now = daysAgoIso(0)
    claims.push({
      claim_id: nextClaimId++,
      item_id: itemId,
      reason: body.reason,
      applicant_contact: user.contact,
      created_time: now,
      last_edit_time: now,
      claim_status: 0,
      applicant_id: user.user_id,
    })
    ok(response, null)
    return
  }

  const claimReviewMatch = /^\/api\/admin\/claims\/(\d+)\/(approve|reject)$/.exec(path)
  if (method === 'POST' && claimReviewMatch !== null) {
    if (!requireBackOffice()) return
    const claim = claims.find((entry) => entry.claim_id === Number(claimReviewMatch[1]))
    if (claim === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    if (claim.claim_status !== 0) {
      fail(response, errorCodes.invalidState, 405)
      return
    }
    const isApprove = claimReviewMatch[2] === 'approve'
    claim.claim_status = isApprove ? 1 : 2
    claim.last_edit_time = daysAgoIso(0)
    if (isApprove) {
      const item = items.find((entry) => entry.item_id === claim.item_id)
      if (item !== undefined) item.item_status = 3
      // 同物品的其他待审批申请自动驳回
      for (const other of claims) {
        if (
          other.item_id === claim.item_id &&
          other.claim_id !== claim.claim_id &&
          other.claim_status === 0
        ) {
          other.claim_status = 2
          other.last_edit_time = daysAgoIso(0)
        }
      }
    }
    ok(response, null)
    return
  }

  const claimDetailMatch = /^\/api\/claims\/(\d+)$/.exec(path)
  if (claimDetailMatch !== null && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
    const claim = claims.find((entry) => entry.claim_id === Number(claimDetailMatch[1]))
    if (claim === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }

    if (method === 'GET') {
      if (!requireUser()) return
      if (claim.applicant_id !== user.user_id && !isBackOffice(user)) {
        fail(response, errorCodes.forbidden, 403)
        return
      }
      const item = items.find((entry) => entry.item_id === claim.item_id)
      ok(response, {
        claim_id: claim.claim_id,
        item: item === undefined ? null : toPublicItem(item),
        reason: claim.reason,
        contact: claim.applicant_contact,
        created_time: claim.created_time,
        last_edit_time: claim.last_edit_time,
        claim_status: claim.claim_status,
        user_id: claim.applicant_id,
      })
      return
    }

    if (method === 'PUT') {
      if (!requireUser()) return
      if (claim.applicant_id !== user.user_id) {
        fail(response, errorCodes.forbidden, 403)
        return
      }
      const body = await readJsonBody(request)
      if (!body.reason) {
        fail(response, errorCodes.badRequest, 400)
        return
      }
      claim.reason = body.reason
      claim.applicant_contact = body.applicant_contact ?? claim.applicant_contact
      claim.last_edit_time = daysAgoIso(0)
      ok(response, null)
      return
    }

    if (!requireUser()) return
    if (claim.applicant_id !== user.user_id && user.role !== 'sys_admin') {
      fail(response, errorCodes.forbidden, 403)
      return
    }
    claims.splice(claims.indexOf(claim), 1)
    ok(response, null)
    return
  }

  /* ---------- 发布审核 ---------- */
  const pendingMatch = /^\/api\/admin\/items\/pending\/(lost|found)$/.exec(path)
  if (method === 'GET' && pendingMatch !== null) {
    if (!requireBackOffice()) return
    const result = items
      .filter((item) => item.type === pendingMatch[1] && item.item_status === 0)
      .sort((left, right) => (left.created_time < right.created_time ? 1 : -1))
    ok(response, { items: paginate(result, query).map(toPublicItem) })
    return
  }

  if (method === 'GET' && path === '/api/admin/items') {
    if (!requireSysAdmin()) return
    let result = [...items]
    const type = query.get('type') ?? ''
    if (type !== '') result = result.filter((item) => item.type === type)
    const statusParam = query.get('status')
    if (statusParam !== null && statusParam !== '') {
      result = result.filter((item) => item.item_status === Number(statusParam))
    }
    const category = query.get('category') ?? ''
    if (category !== '') result = result.filter((item) => item.category === category)
    const keyword = query.get('keyword') ?? ''
    if (keyword !== '') {
      result = result.filter(
        (item) => item.item_name.includes(keyword) || item.description.includes(keyword),
      )
    }
    result = result.sort((left, right) => (left.created_time < right.created_time ? 1 : -1))
    ok(response, { items: paginate(result, query).map(toPublicItem) })
    return
  }

  const reviewItemMatch = /^\/api\/admin\/items\/(\d+)\/(approve|reject)$/.exec(path)
  if (method === 'POST' && reviewItemMatch !== null) {
    if (!requireBackOffice()) return
    const item = items.find((entry) => entry.item_id === Number(reviewItemMatch[1]))
    if (item === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    if (item.item_status !== 0) {
      fail(response, errorCodes.invalidState, 405)
      return
    }
    const isApprove = reviewItemMatch[2] === 'approve'
    const body = await readJsonBody(request)
    item.item_status = isApprove ? 1 : 2
    item.reject_reason = isApprove ? '' : String(body.reject_reason ?? '')
    item.last_edit_time = daysAgoIso(0)
    ok(response, { reject_reason: item.reject_reason })
    return
  }

  const adminItemMatch = /^\/api\/admin\/items\/(\d+)$/.exec(path)
  if (method === 'PUT' && adminItemMatch !== null) {
    if (!requireSysAdmin()) return
    const item = items.find((entry) => entry.item_id === Number(adminItemMatch[1]))
    if (item === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    const body = await readJsonBody(request)
    if (Number(body.status) !== 3) {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    item.item_status = 3
    item.last_edit_time = daysAgoIso(0)
    ok(response, null)
    return
  }

  /* ---------- 公告 ---------- */
  if (method === 'GET' && path === '/api/announcements') {
    const result = announcements
      .filter((entry) => entry.announcement_status === 0)
      .sort((left, right) => (left.created_time < right.created_time ? 1 : -1))
    ok(response, { announcements: paginate(result, query) })
    return
  }

  if (path === '/api/admin/announcements') {
    if (!requireSysAdmin()) return
    if (method === 'GET') {
      const result = [...announcements].sort((left, right) =>
        left.created_time < right.created_time ? 1 : -1,
      )
      ok(response, { announcements: paginate(result, query) })
      return
    }
    if (method === 'POST') {
      const body = await readJsonBody(request)
      if (!body.title || !body.content) {
        fail(response, errorCodes.badRequest, 400)
        return
      }
      announcements.push({
        announcement_id: nextAnnouncementId++,
        title: body.title,
        content: body.content,
        announcement_status: 0,
        created_time: daysAgoIso(0),
      })
      ok(response, null)
      return
    }
  }

  const adminAnnouncementMatch = /^\/api\/admin\/announcements\/(\d+)$/.exec(path)
  if (adminAnnouncementMatch !== null) {
    if (!requireSysAdmin()) return
    const announcement = announcements.find(
      (entry) => entry.announcement_id === Number(adminAnnouncementMatch[1]),
    )
    if (announcement === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    if (method === 'PUT') {
      const body = await readJsonBody(request)
      if (typeof body.title === 'string') announcement.title = body.title
      if (typeof body.content === 'string') announcement.content = body.content
      if (body.announcement_status !== undefined) {
        announcement.announcement_status = Number(body.announcement_status) === 1 ? 1 : 0
      }
      ok(response, null)
      return
    }
    if (method === 'DELETE') {
      announcements.splice(announcements.indexOf(announcement), 1)
      ok(response, null)
      return
    }
  }

  const announcementDetailMatch = /^\/api\/announcements\/(\d+)$/.exec(path)
  if (method === 'GET' && announcementDetailMatch !== null) {
    const announcement = announcements.find(
      (entry) => entry.announcement_id === Number(announcementDetailMatch[1]),
    )
    if (announcement === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    ok(response, announcement)
    return
  }

  /* ---------- 系统管理 ---------- */
  if (method === 'GET' && path === '/api/admin/users') {
    if (!requireSysAdmin()) return
    let result = [...users]
    const keyword = query.get('keyword') ?? ''
    if (keyword !== '') {
      result = result.filter(
        (entry) => entry.username.includes(keyword) || entry.nickname.includes(keyword),
      )
    }
    const role = query.get('role') ?? ''
    if (role !== '') result = result.filter((entry) => entry.role === role)
    const page = Number(query.get('page') ?? 1) || 1
    const pageSize = Number(query.get('page_size') ?? 20) || 20
    ok(response, {
      users: result.slice((page - 1) * pageSize, page * pageSize).map((entry) => ({
        user_id: entry.user_id,
        username: entry.username,
        nickname: entry.nickname,
        role: entry.role,
        contact: entry.contact,
      })),
    })
    return
  }

  const roleMatch = /^\/api\/admin\/users\/(\d+)\/role$/.exec(path)
  if (method === 'PUT' && roleMatch !== null) {
    if (!requireSysAdmin()) return
    const target = users.find((entry) => entry.user_id === Number(roleMatch[1]))
    if (target === undefined) {
      fail(response, errorCodes.notFound, 404)
      return
    }
    if (target.user_id === user.user_id) {
      // 先判「自己」：文档把降级自己单列为 7，若先判角色会先撞上 3
      fail(response, errorCodes.invalidState, 405)
      return
    }
    if (target.role === 'sys_admin') {
      fail(response, errorCodes.forbidden, 403)
      return
    }
    const body = await readJsonBody(request)
    if (body.role !== 'finder_admin' && body.role !== 'user') {
      fail(response, errorCodes.badRequest, 400)
      return
    }
    target.role = body.role
    ok(response, null)
    return
  }

  /* ---------- 调试：请求日志 ---------- */
  if (path === '/mock/log') {
    sendJson(response, 200, { log: requestLog })
    return
  }

  fail(response, errorCodes.notFound, 404)
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error('[mock] unhandled error', error)
    fail(response, errorCodes.serverError, 500)
  })
})

server.listen(port, () => {
  console.log(`[mock] 失物招领接口已启动: http://localhost:${port}/api`)
  console.log(`[mock] 账号: student001/abc123 · finder001/abc123 · admin/admin123`)
  console.log(
    `[mock] 种子数据: 物品 ${items.length} 条（含待审核与已驳回）、认领 ${claims.length} 条、公告 ${announcements.length} 条`,
  )
  console.log(`[mock] 唯一一次性标识: ${randomUUID().slice(0, 8)}`)
})


import 'element-plus/dist/index.css'
import './assets/main.css'

import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

import router from './router'

const app = createApp(App)

// Pinia 必须比 router 先安装：路由守卫会在首次导航时用到 user store
app.use(createPinia())
// 全局中文：MessageBox 按钮 OK/Cancel → 确定/取消，其余组件文案一并汉化
app.use(ElementPlus, { locale: zhCn })
app.use(router)

app.mount('#app')

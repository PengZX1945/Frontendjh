
import 'element-plus/dist/index.css'
import './assets/main.css'

import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

import router from './router'

const app = createApp(App)

// Pinia 必须比 router 先安装：路由守卫会在首次导航时用到 user store
app.use(createPinia())
app.use(ElementPlus)
app.use(router)

app.mount('#app')

<template>
    <div class="DefaultLayout">
        <NavBar />
        <main class="main-content">
            <slot name="main" />
        </main>
        <footer class="footer">
            <!-- 页面不传 footer 插槽时，用默认页脚 -->
            <slot name="footer">
                <div class="footer-inner">
                    <p class="footer-note">校园失物招领系统 · 让每一件失物都能回家</p>
                    <p class="footer-copy">© 大作业第六组</p>
                </div>
            </slot>
        </footer>
    </div>
</template>

<script setup lang="ts">
import NavBar from '../components/NavBar.vue';
// 用户端的布局：顶部一行导航栏 + 中间内容区 + 页脚
</script>

<style scoped>
.DefaultLayout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.main-content {
    /* 撑满剩余高度，页脚才能贴在页面底部 */
    flex: 1;
    background: #f7f8fa;
}

.footer {
    background: #fff;
    border-top: 1px solid #ebeef5;
    padding: 16px 12px;
}

.footer-inner {
    max-width: 1120px;
    margin: 0 auto;
    text-align: center;
    font-size: 13px;
    color: #909399;
}

.footer-brand {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 600;
    color: #606266;
}

.footer-note {
    margin: 0 0 6px;
}

.footer-copy {
    margin: 0;
}
</style>
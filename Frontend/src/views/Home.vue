<template>
    <div class="container">
        <div class="display_block">
            <div class="navigate_bar">
                <el-segmented v-model="tab" :options="tabs" class="navigate_selection_bar" />
                <div class="user_bar">
                    <span>当前用户：<el-tag v-if="userStore.isLoggedIn" type="success" size="small">{{ userStore.username }}</el-tag><el-tag v-else type="info" size="small">未登录</el-tag></span>
                    <el-button type="danger" plain size="small" @click="handleLogout">退出登录</el-button>
                </div>
                <div class="news" v-if="tab === '动态'">
                    <el-empty v-if="!newslist.length" description="暂无动态" :image-size="80" />
                    <el-card v-for="i in newslist" :key="i.id" class="news_card" shadow="hover">

                        <h4><b>{{ i.title }}</b></h4>
                        <p><i>{{ i.content }}</i></p>

                    </el-card>
                </div>
                <div class="news" v-if="tab === '投稿'">
                    <el-empty v-if="!videoslist.length" description="暂无投稿" :image-size="80" />
                    <el-card v-for="i in videoslist" :key="i.id" class="news_card" shadow="hover">
                        <h4><b>{{ i.title }}</b></h4>
                        <p><i>{{ i.content }}</i></p>
                    </el-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

function handleLogout() {
    // 清掉凭证和用户信息，守卫会在下次跳转时把用户送回登录页
    userStore.logout();
    router.push('/login');
}

const tab = ref("动态");
const tabs = ["动态", "投稿"];

const newslist = ref([
    { id: 1, title: "动态1", content: "动态1的内容" },
    { id: 2, title: "动态2", content: "动态2的内容" },
    { id: 3, title: "动态3", content: "动态3的内容" },
])
const videoslist = ref([
    { id: 1, title: "投稿1", content: "投稿1的内容" },
    { id: 2, title: "投稿2", content: "投稿2的内容" },
    { id: 3, title: "投稿3", content: "投稿3的内容" },
])
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.display_block {
    width: 300px;
    height: 500px;
    border: 2px solid black;
    /* 让内部区域可以按剩余高度分配，卡片列表才能滚动 */
    display: flex;
    flex-direction: column;
}

.navigate_bar {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    margin-bottom: 10px;
}

.navigate_selection_bar {
    width: 100%;
}

.news {
    width: 100%;
    text-align: left;
    /* 卡片内容超出 500px 的容器时自己滚动，别把外框撑破 */
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.user_bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 13px;
    color: gray;
}

.news_card {
    margin-bottom: 8px;
}

.news_card h4 {
    margin: 0 0 6px;
}

.news_card p {
    margin: 0;
}
</style>

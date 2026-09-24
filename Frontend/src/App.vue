<template>
    <!-- 未登录：显示登录页 -->
    <index-page v-if="!currentUser" @login-success="handleLoginSuccess" />

    <!-- 登录成功：显示原来的内容 -->
    <div v-else class="container">
        <div class="display_block">
            <div class="navigate_bar">
                <div class="navigate_selection_bar">
                    <div class="navigate_selection" @click="tab = '动态'":style="tab === '动态' ? { backgroundColor: 'lightgray' ,color: 'green'} : undefined"><b>动态</b></div>
                    <div class="navigate_selection" @click="tab = '投稿'":style="tab === '投稿' ? { backgroundColor: 'lightgray' ,color: 'green'} : undefined"><b>投稿</b></div>
                </div>
                <div class="user_bar">
                    <span>当前用户：{{ currentUser }}</span>
                    <button class="logout" @click="handleLogout">退出登录</button>
                </div>
                <div class="news" v-if="tab === '动态'">
                    <div class="news_content" v-for="i in newslist" :key="i.id">
                        
                        <h4><b>{{ i.title }}</b></h4>
                        <p><i>{{ i.content }}</i></p>
                
                    </div>
                </div>
                <div class="news" v-if="tab === '投稿'">
                    <div class="videos_content" v-for="i in videoslist" :key="i.id">
                        <h4><b>{{ i.title }}</b></h4>
                        <p><i>{{ i.content }}</i></p>
                    </div>
                </div>
            </div>
        </div>
    </div>



</template>

<script setup>
import { ref } from 'vue';
import IndexPage from './index.vue';

// 当前登录用户（从 localStorage 恢复“记住我”的登录状态）
const currentUser = ref(localStorage.getItem('login_user') || "");

function handleLoginSuccess(username) {
    currentUser.value = username;
}

function handleLogout() {
    localStorage.removeItem('login_user');
    currentUser.value = "";
}

const tab = ref("动态");

const newslist=ref([
    {id:1,title:"动态1",content:"动态1的内容"},
    {id:2,title:"动态2",content:"动态2的内容"},
    {id:3,title:"动态3",content:"动态3的内容"},
])
const videoslist=ref([
    {id:1,title:"投稿1",content:"投稿1的内容"},
    {id:2,title:"投稿2",content:"投稿2的内容"},
    {id:3,title:"投稿3",content:"投稿3的内容"},
])

</script>

<style scoped>
.container{
    display:flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}
.display_block{
    width: 300px;
    height: 500px;
    border: 2px solid black;
}
.navigate_bar{
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
}
.navigate_selection_bar{
    display: flex;
}
.navigate_selection{
    width: 100px;
    height: 50px;
    border: 2px solid gray;
    text-align: center;
    font-size: 20px;
    line-height: 50px;
    cursor: pointer;
    box-sizing: border-box;
}
.navigate_selection + .navigate_selection{
    margin-left: -2px;
}
.news{
    width: 100%;
    text-align: left;
}
.user_bar{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 13px;
    color: gray;
}
.logout{
    padding: 4px 10px;
    font-size: 12px;
    color: #b91c1c;
    background: #fff;
    border: 1px solid #fecaca;
    border-radius: 6px;
    cursor: pointer;
}
.logout:hover{
    background: #fef2f2;
}
.news_content,
.videos_content{
    
    border-bottom: 1px solid #fff;
    padding: 8px 0px;
}

</style>
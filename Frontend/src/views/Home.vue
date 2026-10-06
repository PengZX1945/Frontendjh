<template>
    <DefaultLayout>
        <template #main>
            <div class="home-page">

                <router-view />
            </div>
        </template>
    </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '../layouts/DefaultLayout.vue';
</script>

<style scoped>
.home-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 16px 40px;
    box-sizing: border-box;
}
</style>

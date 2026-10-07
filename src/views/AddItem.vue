<template>
    <div class="publish-page">
        <h2 class="page-title">发布信息</h2>

        <el-alert class="publish-tip" type="info" :closable="false" show-icon
            title="提交后帖子为「待审核」状态，管理员审核通过后其他用户才能看到" />

        <el-form ref="formRef" class="publish-card" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="信息类型" prop="type">
                <el-radio-group v-model="form.type">
                    <el-radio value="found">招领（捡到物品）</el-radio>
                    <el-radio value="lost">寻物（物品遗失）</el-radio>
                </el-radio-group>
            </el-form-item>

            <el-form-item label="物品名称" prop="item_name">
                <el-input v-model="form.item_name" placeholder="请输入物品名称" maxlength="50" show-word-limit />
            </el-form-item>

            <el-form-item label="物品分类" prop="category">
                <el-select v-model="form.category" class="field-block" placeholder="请选择分类">
                    <el-option v-for="item in ITEM_CATEGORIES" :key="item" :label="item" :value="item" />
                </el-select>
            </el-form-item>

            <el-form-item label="拾获/丢失地点" prop="location">
                <el-input v-model="form.location" placeholder="如：图书馆三楼" />
            </el-form-item>

            <el-form-item label="时间" prop="happen_time">
                <el-date-picker v-model="form.happen_time" class="field-block" type="datetime" placeholder="请选择时间"
                    format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>

            <el-form-item label="联系方式" prop="contact">
                <el-input v-model="form.contact" placeholder="手机号 / 微信号，方便失主联系你" />
            </el-form-item>

            <el-form-item label="详细描述" prop="description">
                <el-input v-model="form.description" type="textarea" :rows="4" maxlength="200" show-word-limit
                    placeholder="补充物品特征、认领方式等" />
            </el-form-item>

            <el-form-item label="物品图片">
                <el-upload v-model:file-list="fileList" list-type="picture-card" :limit="UPLOAD_MAX_COUNT"
                    accept="image/jpeg,image/png,image/webp" :before-upload="beforeUpload"
                    :http-request="handleUpload" :on-exceed="handleExceed">
                    <span class="upload-plus">+</span>
                </el-upload>
                <p class="upload-tip">最多 {{ UPLOAD_MAX_COUNT }} 张，支持 jpg / jpeg / png / webp，单张不超过 5MB</p>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
                <el-button @click="handleReset">重置</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    type UploadFile,
    type UploadRequestOptions,
} from 'element-plus';
import { createItem, uploadImage } from '../api/items';
import { isSuccess, resolveErrorMessage } from '../api/errorCode';
import { useUserStore } from '../stores/user';
import {
    ITEM_CATEGORIES,
    UPLOAD_ACCEPT,
    UPLOAD_MAX_COUNT,
    UPLOAD_MAX_SIZE,
    toDateTimeString,
    type CreateItemPayload,
} from '../api/itemMeta';

/** 表单里不含 images，图片由上传组件单独维护 */
type ItemForm = Omit<CreateItemPayload, 'images'>;

const router = useRouter();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const fileList = ref<UploadFile[]>([]);
const submitting = ref(false);

const form = reactive<ItemForm>({
    type: 'found',
    item_name: '',
    category: '',
    location: '',
    happen_time: toDateTimeString(new Date()),
    contact: '',
    description: '',
});

const rules: FormRules<ItemForm> = {
    item_name: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
    category: [{ required: true, message: '请选择物品分类', trigger: 'change' }],
    location: [{ required: true, message: '请输入拾获/丢失地点', trigger: 'blur' }],
    happen_time: [{ required: true, message: '请选择时间', trigger: 'change' }],
    contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
    description: [{ required: true, message: '请输入详细描述', trigger: 'blur' }],
};

/** 只收集上传成功的图片，避免把本地预览用的 blob 地址一起提交 */
const uploadedUrls = computed(() =>
    fileList.value
        .filter((file) => file.status === 'success')
        .map((file) => (file.response as { url?: string } | undefined)?.url ?? '')
        .filter(Boolean),
);

function beforeUpload(file: File): boolean {
    if (!UPLOAD_ACCEPT.includes(file.type)) {
        ElMessage.error('仅支持 jpg / jpeg / png / webp 格式的图片');
        return false;
    }

    if (file.size > UPLOAD_MAX_SIZE) {
        ElMessage.error('单张图片不能超过 5MB');
        return false;
    }

    return true;
}

/** 走 /upload 接口，成功后把 url 作为 response 存进文件项 */
async function handleUpload(options: UploadRequestOptions): Promise<{ url: string }> {
    try {
        const res = await uploadImage(options.file);

        if (!isSuccess(res?.code)) {
            // 10008：格式不支持或超过大小限制
            throw new Error(resolveErrorMessage(res?.code, res?.msg, '文件上传失败'));
        }

        return { url: res.data?.url ?? '' };
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '文件上传失败');
        throw error;
    }
}

function handleExceed(): void {
    ElMessage.warning(`最多只能上传 ${UPLOAD_MAX_COUNT} 张图片`);
}

async function handleSubmit(): Promise<void> {
    if (!formRef.value) return;

    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;
    try {
        const res = await createItem({ ...form, images: uploadedUrls.value });

        if (!isSuccess(res?.code)) {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
            return;
        }

        // 管理员及以上发布免审核，仅提示发布成功；普通用户提示等待审核
        ElMessage.success(userStore.isAdmin ? '发布成功' : '发布成功，等待管理员审核');
        // 跳转到刚发布的物品详情页；拿不到 id 时兜底回到对应列表页
        if (res.data?.id != null) {
            router.push({ name: 'details', params: { id: res.data.id } });
        } else {
            router.push({ name: form.type === 'found' ? 'found' : 'lost' });
        }
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '发布失败，请稍后重试');
    } finally {
        submitting.value = false;
    }
}

function handleReset(): void {
    formRef.value?.resetFields();
    fileList.value = [];
}
</script>

<style scoped>
.page-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.publish-tip {
    margin-bottom: 16px;
}

.publish-card {
    padding: 24px 24px 8px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.field-block {
    width: 100%;
}

.upload-plus {
    font-size: 22px;
    line-height: 1;
    color: #8c939d;
}

.upload-tip {
    margin: 8px 0 0;
    font-size: 12px;
    color: #909399;
}
</style>

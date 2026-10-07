<template>
    <el-dialog :model-value="modelValue" title="修改物品详情" width="580px" :close-on-click-modal="false"
        @update:model-value="$emit('update:modelValue', $event)" @open="initForm">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
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
        </el-form>

        <template #footer>
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSave">保存修改</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
    ElMessage,
    type FormInstance,
    type FormRules,
    type UploadFile,
    type UploadRequestOptions,
} from 'element-plus';
import { updateItem, uploadImage } from '../api/items';
import { isSuccess, resolveErrorMessage } from '../api/errorCode';
import {
    ITEM_CATEGORIES,
    UPLOAD_ACCEPT,
    UPLOAD_MAX_COUNT,
    UPLOAD_MAX_SIZE,
    type CreateItemPayload,
    type Item,
} from '../api/itemMeta';

/** 表单里不含 images，图片由上传组件单独维护 */
type EditForm = Omit<CreateItemPayload, 'images'>;

const props = defineProps<{ modelValue: boolean; item: Item | null }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>();

const formRef = ref<FormInstance>();
const fileList = ref<UploadFile[]>([]);
const submitting = ref(false);

const form = reactive<EditForm>({
    type: 'found',
    item_name: '',
    category: '',
    location: '',
    happen_time: '',
    contact: '',
    description: '',
});

const rules: FormRules<EditForm> = {
    item_name: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
    category: [{ required: true, message: '请选择物品分类', trigger: 'change' }],
    location: [{ required: true, message: '请输入拾获/丢失地点', trigger: 'blur' }],
    happen_time: [{ required: true, message: '请选择时间', trigger: 'change' }],
    contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
    description: [{ required: true, message: '请输入详细描述', trigger: 'blur' }],
};

/** 只收集上传成功的图片；也兼容预填的旧图（无 response 时取 file.url） */
const uploadedUrls = computed(() =>
    fileList.value
        .filter((file) => file.status === 'success')
        .map((file) => (file.response as { url?: string } | undefined)?.url ?? file.url ?? '')
        .filter(Boolean),
);

/** 打开弹窗时用当前物品数据预填表单，并把已存图片转成上传列表项 */
function initForm(): void {
    const it = props.item;
    if (!it) return;
    form.type = it.type;
    form.item_name = it.item_name ?? '';
    form.category = it.category ?? '';
    form.location = it.location ?? '';
    form.happen_time = it.happen_time || '';
    form.contact = it.contact ?? '';
    form.description = it.description ?? '';
    fileList.value = (it.images ?? []).map((url, idx) => ({
        name: url.split('/').pop() || url,
        url,
        status: 'success' as const,
        uid: Date.now() + idx,
        response: { url },
    }));
}

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

async function handleUpload(options: UploadRequestOptions): Promise<{ url: string }> {
    try {
        const res = await uploadImage(options.file);
        if (!isSuccess(res?.code)) {
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

function handleCancel(): void {
    emit('update:modelValue', false);
}

async function handleSave(): Promise<void> {
    if (!formRef.value) return;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;
    if (!props.item) return;

    submitting.value = true;
    try {
        const res = await updateItem(props.item.id, { ...form, images: uploadedUrls.value });
        if (!isSuccess(res?.code)) {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg, '修改失败'));
            return;
        }
        ElMessage.success('修改成功，已重新提交审核');
        emit('update:modelValue', false);
        emit('saved');
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '修改失败，请稍后重试');
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
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

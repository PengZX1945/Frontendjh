/**
 * 本地兜底：后端 /api 还没就绪时，把帖子存进 localStorage，让发布 / 列表流程先跑通。
 * 思路和 api/localAccounts.ts 的本地登录一致；要停用就把 api/items.ts 里的
 * USE_LOCAL_ITEMS 改成 false。;
 */
import {
  ItemStatus,
  toDateTimeString,
  type CreateItemPayload,
  type Item,
  type ItemListQuery,
} from './itemMeta';

const LOCAL_ITEMS_KEY = 'local_items';

/** 本地图片先压到这个宽度以内再转 dataURL，否则 localStorage 很快写满 */
const LOCAL_IMAGE_MAX_WIDTH = 600;

function readLocalItems(): Item[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_ITEMS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Item[]) : [];
  } catch {
    return [];
  }
}

function writeLocalItems(items: Item[]): void {
  try {
    localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // 图片占满配额时忽略写入失败，只影响本地兜底，不影响真实接口
  }
}

/** 本地创建：补 id / 状态 / 创建时间，模拟后端行为（新建即待审核） */
export function localCreateItem(payload: CreateItemPayload): Item {
  const item: Item = {
    ...payload,
    id: Date.now(),
    status: ItemStatus.PENDING,
    created_at: toDateTimeString(new Date()),
  };
  writeLocalItems([item, ...readLocalItems()]);
  return item;
}

/** 本地列表：按类型 / 分类 / 关键词过滤，最新的排在前面 */
export function localListItems({ type, keyword, category }: ItemListQuery = {}): Item[] {
  const kw = keyword?.trim().toLowerCase() ?? '';

  return readLocalItems()
    .filter((item) => (type ? item.type === type : true))
    .filter((item) => (category ? item.category === category : true))
    .filter((item) => {
      if (!kw) return true;
      return [item.item_name, item.description, item.location].some((text) =>
        String(text ?? '').toLowerCase().includes(kw),
      );
    })
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

/** 把图片等比缩到 LOCAL_IMAGE_MAX_WIDTH 以内，再转成 jpeg 的 dataURL */
function downscaleToDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(dataUrl);
    image.onload = () => {
      if (image.width <= LOCAL_IMAGE_MAX_WIDTH) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = LOCAL_IMAGE_MAX_WIDTH;
      canvas.height = Math.round((image.height * LOCAL_IMAGE_MAX_WIDTH) / image.width);

      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    image.src = dataUrl;
  });
}

/** 本地「上传」：直接把图片转成 dataURL，这样列表里能真的显示出图片 */
export function localUploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.onload = () => {
      downscaleToDataUrl(String(reader.result)).then(resolve, () => resolve(String(reader.result)));
    };
    reader.readAsDataURL(file);
  });
}

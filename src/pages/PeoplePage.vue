<template>
  <q-page padding class="flex flex-center">
    <q-card id="form-card" class="form-card q-pa-lg" style="width: 100%">
      <q-card-section>
        <h3 class="text-h4 text-center q-mb-lg text-weight-bold">参与人</h3>
      </q-card-section>

      <div class="q-pa-md">
        <div class="q-pa-md">
          <div class="q-gutter-md row items-end">
            <q-file
              v-model="files"
              label="选择 Excel 文件"
              filled
              outlined
              use-chips
              max-files="1"
              accept=".xlsx,.xls"
              style="max-width: 500px"
            >
              <template v-slot:prepend>
                <q-icon name="description" />
              </template>
            </q-file>
            <!-- 解析文件按钮 -->
            <q-btn
              v-if="files"
              color="primary"
              icon="upload"
              label="解析文件"
              @click="parseSelectedFile"
              :loading="loading"
              no-caps
              unelevated
              style="height: 56px; border-radius: 4px"
              class="q-px-lg text-weight-medium"
            />
          </div>
        </div>
        <q-table
          title="表格内容"
          :rows="rows"
          :columns="columns"
          row-key="id"
          :selected-rows-label="getSelectedString"
          selection="multiple"
          v-model:selected="selected"
          :loading="loading"
          @request="onRequest"
          v-model:pagination="pagination"
          ref="tableRef"
          binary-state-sort
          rows-per-page-label="每页显示条目："
          :rows-per-page-options="[3, 5, 7, 10, 20, 50]"
          :filter="filter"
        >
        </q-table>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Notify } from 'quasar';
import { usePeopleStore } from '../stores/people';
import type { RowData, TableColumn } from '../stores/people';
import * as XLSX from 'xlsx';

// 文件选择相关
const files = ref([]);

// 使用 Pinia store
const peopleStore = usePeopleStore();

// 页面初始化时从 store 恢复数据
onMounted(() => {
  if (peopleStore.isDataLoaded && peopleStore.peopleData.length > 0) {
    console.log('从 Pinia store 恢复数据:', peopleStore.peopleData.length, '条记录');
    rows.value = peopleStore.peopleData;
    columns.value = peopleStore.columns;
  }
});

// 计数器标签函数
// const counterLabelFn = ({
//   totalSize,
//   filesNumber,
//   maxFiles,
// }: {
//   totalSize: string;
//   filesNumber: number;
//   maxFiles: string | number;
// }) => {
//   return `${filesNumber}${maxFiles ? `/${maxFiles}` : ''} 个文件${totalSize ? ` (${totalSize})` : ''}`;
// };

// 监听文件选择变化
watch(files, (newFiles) => {
  console.log('文件选择发生变化');
  console.log('新文件:', newFiles);
  console.log('newFiles 的类型:', typeof newFiles);
  console.log('newFiles 是否为数组:', Array.isArray(newFiles));

  // 检查 newFiles 是否是单个文件对象还是文件数组
  let fileToProcess = null;

  if (newFiles) {
    if (newFiles instanceof File) {
      // 如果是单个 File 对象
      console.log('检测到单个文件对象');
      fileToProcess = newFiles;
    } // 其他情况不处理
  }

  if (fileToProcess) {
    console.log('处理文件:', fileToProcess);
    console.log('文件名:', fileToProcess.name);

    if (
      fileToProcess &&
      !(fileToProcess.name.endsWith('.xlsx') || fileToProcess.name.endsWith('.xls'))
    ) {
      // 如果文件类型不正确，清空文件并提示
      console.log('文件类型不正确，清空文件');
      files.value = null;
      Notify.create({
        type: 'negative',
        message: '请选择 .xlsx 或 .xls 格式的 Excel 文件。',
        position: 'top',
      });
    } else {
      // 文件格式正确，提示用户点击解析按钮
      console.log('文件格式正确，显示提示');
      Notify.create({
        type: 'info',
        message: '文件已选择，请点击"解析文件"按钮进行解析',
        position: 'top',
      });
    }
  } else {
    // 当文件被清空时，清空表格数据
    console.log('文件被清空，清空表格数据');
    rows.value = [];
    columns.value = [];
    // 同时清空 store 中的数据
    peopleStore.clearPeopleData();
  }
});

// 手动解析选中的文件
const parseSelectedFile = async () => {
  console.log('parseSelectedFile 被调用');
  console.log('当前 files.value:', files.value);

  let fileToProcess = null;

  if (files.value) {
    if (files.value instanceof File) {
      // 如果是单个 File 对象
      console.log('files.value 是单个 File 对象');
      fileToProcess = files.value;
    }
  }

  if (fileToProcess) {
    console.log('选中的文件:', fileToProcess);
    console.log('文件名:', fileToProcess.name);
    console.log(
      '文件类型检查:',
      fileToProcess &&
        (fileToProcess.name.endsWith('.xlsx') || fileToProcess.name.endsWith('.xls')),
    );

    if (
      fileToProcess &&
      (fileToProcess.name.endsWith('.xlsx') || fileToProcess.name.endsWith('.xls'))
    ) {
      console.log('开始解析文件...');
      await parseExcelFile(fileToProcess);
    } else {
      console.log('文件类型不正确');
    }
  } else {
    console.log('没有选择文件');
  }
};

// 解析 Excel 文件的函数
const parseExcelFile = async (file: File) => {
  console.log('parseExcelFile 开始执行');
  console.log('接收到的文件:', file);
  console.log('文件名:', file.name);
  console.log('文件大小:', file.size);
  console.log('文件类型:', file.type);

  try {
    loading.value = true;
    console.log('设置 loading 为 true');

    // 使用 Promise 来处理异步文件读取
    console.log('开始读取文件...');
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('文件读取成功');
        resolve(e.target?.result as ArrayBuffer);
      };
      reader.onerror = (e) => {
        console.error('文件读取失败:', e);
        reject(new Error('文件读取失败'));
      };
      reader.readAsArrayBuffer(file);
    });

    // 使用 XLSX 解析文件
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log('工作簿:', workbook);
    console.log('工作表名称:', workbook.SheetNames);

    const firstSheetName = workbook.SheetNames[0];
    console.log('使用第一个工作表:', firstSheetName);

    const worksheet = workbook.Sheets[firstSheetName];
    console.log('工作表对象:', worksheet);

    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('解析的 JSON 数据:', jsonData);
    console.log('数据行数:', jsonData.length);

    if (jsonData.length > 0) {
      console.log('开始处理数据...');
      // 动态生成列定义（基于第一行数据的键）
      const firstRow = jsonData[0] as Record<string, string | number>;
      console.log('第一行数据:', firstRow);
      console.log('列名:', Object.keys(firstRow));

      const dynamicColumns: TableColumn[] = Object.keys(firstRow).map((key) => ({
        name: key,
        label: key,
        field: key,
        align: 'center',
        sortable: true,
      }));

      console.log('生成的列定义:', dynamicColumns);

      // 更新列定义和数据
      columns.value = dynamicColumns;
      rows.value = jsonData.map((row: Record<string, string | number>, index: number) => ({
        // 确保每行都有一个唯一的 'id'
        id: row.id || index + 1,
        ...row,
      }));

      // 将数据保存到 Pinia store
      peopleStore.setPeopleData(rows.value, dynamicColumns);

      console.log('更新后的列:', columns.value);
      console.log('更新后的行数据:', rows.value);

      Notify.create({
        type: 'positive',
        message: `成功解析 Excel 文件，共 ${jsonData.length} 条数据`,
        position: 'top',
      });
    } else {
      console.log('没有找到数据');
      Notify.create({
        type: 'warning',
        message: 'Excel 文件中没有找到数据',
        position: 'top',
      });
      // 清空表格
      rows.value = [];
      columns.value = [];
    }
  } catch (error) {
    console.error('解析 Excel 文件时出错:', error);
    Notify.create({
      type: 'negative',
      message: '解析 Excel 文件时出错，请检查文件格式或内容。',
      position: 'top',
    });
  } finally {
    loading.value = false;
    console.log('设置 loading 为 false');
  }
};

// 表格相关数据

const rows = ref<RowData[]>([]);

const columns = ref<TableColumn[]>([
  {
    name: 'department_short',
    align: 'center',
    label: '部门简称',
    field: 'department_short',
    sortable: true,
  },
  {
    name: 'department',
    label: '部门',
    field: 'department',
    align: 'center',
  },
  {
    name: 'id',
    required: true,
    label: '雇员工号',
    align: 'center',
    field: 'id',
    format: (val: string | number) => `${val}`,
    sortable: true,
  },
]);

const selected = ref([]);
const loading = ref(false);
const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 10,
});
const filter = ref('');
const tableRef = ref();

// 表格方法
const getSelectedString = () => {
  return selected.value.length === 0 ? '' : `已选择 ${selected.value.length} 行`;
};

const onRequest = () => {
  // 处理表格请求的逻辑，此处可忽略
};
</script>

<template>
  <q-page padding class="flex flex-center">
    <q-card id="form-card" class="form-card q-pa-lg" style="width: 100%">
      <q-card-section>
        <h3 class="text-h4 text-center q-mb-lg text-weight-bold">中奖历史记录</h3>
      </q-card-section>
      <div class="q-pa-md">
        <q-table
          flat
          bordered
          title="中奖记录"
          :rows="rows"
          :columns="columns"
          color="primary"
          row-key="id"
        >
          <template v-slot:top-right>
            <q-btn
              color="primary"
              icon-right="archive"
              label="导出CSV"
              no-caps
              @click="exportTable"
            />
          </template>
        </q-table>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { exportFile, useQuasar } from 'quasar';
import { useWinnersStore } from '../stores/winner';
import type { WinnerRecord } from '../stores/winner';

// 使用 winnerStore
const winnerStore = useWinnersStore();

// 类型定义
interface TableColumn {
  name: string;
  required?: boolean;
  label: string;
  align?: 'left' | 'right' | 'center';
  field: string | ((row: WinnerRecord) => string | number);
  format?: (val: string | number, row?: WinnerRecord) => string;
  sortable?: boolean;
  sort?: (a: WinnerRecord, b: WinnerRecord) => number;
}

// Quasar实例
const $q = useQuasar();

// 表格列定义 - 改为中奖记录相关的列
const columns = ref<TableColumn[]>([
  {
    name: 'timestamp',
    required: true,
    label: '中奖时间',
    align: 'left',
    field: 'timestamp',
    format: (val: string | number) => new Date(Number(val)).toLocaleString('zh-CN'),
    sortable: true,
    sort: (a: WinnerRecord, b: WinnerRecord) => b.timestamp - a.timestamp,
  },
  {
    name: 'department',
    align: 'center',
    label: '部门',
    field: (row: WinnerRecord) => row.person.department,
    sortable: true,
  },
  {
    name: 'employeeId',
    label: '工号',
    field: (row: WinnerRecord) => row.person.employeeId,
    sortable: true,
  },
  {
    name: 'prize',
    label: '奖品',
    field: 'prize',
    sortable: true,
  },
  {
    name: 'tableName',
    label: '桌号',
    field: 'tableName',
    sortable: true,
  },
]);

// 表格数据 - 从 winnerStore 获取
const rows = computed(() => winnerStore.winnerHistory);

// CSV包装函数
const wrapCsvValue = (
  val: string | number,
  formatFn?: (val: string | number, row?: WinnerRecord) => string,
  row?: WinnerRecord,
): string => {
  let formatted = formatFn !== undefined ? formatFn(val, row) : val;

  formatted = formatted === undefined || formatted === null ? '' : String(formatted);

  formatted = formatted.split('"').join('""');
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`;
};

// 导出表格函数
const exportTable = (): void => {
  // 生成CSV内容
  const csvContent = [columns.value.map((col) => wrapCsvValue(col.label))]
    .concat(
      rows.value.map((row) =>
        columns.value
          .map((col) => {
            let fieldValue: string | number;
            if (typeof col.field === 'function') {
              fieldValue = col.field(row);
            } else {
              // 直接使用字段名访问 WinnerRecord 的属性
              switch (col.field) {
                case 'id':
                  fieldValue = row.id;
                  break;
                case 'prize':
                  fieldValue = row.prize;
                  break;
                case 'tableName':
                  fieldValue = row.tableName;
                  break;
                case 'timestamp':
                  fieldValue = row.timestamp;
                  break;
                default:
                  fieldValue = '';
              }
            }
            return wrapCsvValue(fieldValue, col.format, row);
          })
          .join(','),
      ),
    )
    .join('\r\n');

  // 添加UTF-8 BOM来解决中文乱码问题
  const BOM = '\uFEFF';
  const contentWithBOM = BOM + csvContent;

  const status = exportFile('winner-history.csv', contentWithBOM, 'text/csv;charset=utf-8');

  if (status !== true) {
    $q.notify({
      message: '浏览器阻止了文件下载...',
      color: 'negative',
      icon: 'warning',
    });
  }
};
</script>

<style scoped>
.form-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
</style>

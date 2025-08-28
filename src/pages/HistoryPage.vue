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
          row-key="name"
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
import { ref } from 'vue';
import { exportFile, useQuasar } from 'quasar';

// 类型定义
interface TableColumn {
  name: string;
  required?: boolean;
  label: string;
  align?: 'left' | 'right' | 'center';
  field: string | ((row: TableRow) => string | number);
  format?: (val: string | number, row?: TableRow) => string;
  sortable?: boolean;
  sort?: (a: TableRow, b: TableRow) => number;
}

interface TableRow {
  name: string;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  sodium: number;
  calcium: string;
  iron: string;
}

// Quasar实例
const $q = useQuasar();

// 表格列定义
const columns = ref<TableColumn[]>([
  {
    name: 'name',
    required: true,
    label: '甜品名称 (100g)',
    align: 'left',
    field: (row: TableRow) => row.name,
    format: (val: string) => `${val}`,
    sortable: true,
  },
  {
    name: 'calories',
    align: 'center',
    label: '卡路里',
    field: 'calories',
    sortable: true,
  },
  {
    name: 'fat',
    label: '脂肪 (g)',
    field: 'fat',
    sortable: true,
  },
  {
    name: 'carbs',
    label: '碳水化合物 (g)',
    field: 'carbs',
  },
  {
    name: 'protein',
    label: '蛋白质 (g)',
    field: 'protein',
  },
  {
    name: 'sodium',
    label: '钠 (mg)',
    field: 'sodium',
  },
  {
    name: 'calcium',
    label: '钙 (%)',
    field: 'calcium',
    sortable: true,
    sort: (a: TableRow, b: TableRow) => parseInt(a.calcium, 10) - parseInt(b.calcium, 10),
  },
  {
    name: 'iron',
    label: '铁 (%)',
    field: 'iron',
    sortable: true,
    sort: (a: TableRow, b: TableRow) => parseInt(a.iron, 10) - parseInt(b.iron, 10),
  },
]);

// 表格数据
const rows = ref<TableRow[]>([
  {
    name: '冷冻酸奶',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    sodium: 87,
    calcium: '14%',
    iron: '1%',
  },
  {
    name: '冰淇淋三明治',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    sodium: 129,
    calcium: '8%',
    iron: '1%',
  },
  {
    name: '闪电泡芙',
    calories: 262,
    fat: 16.0,
    carbs: 23,
    protein: 6.0,
    sodium: 337,
    calcium: '6%',
    iron: '7%',
  },
  {
    name: '纸杯蛋糕',
    calories: 305,
    fat: 3.7,
    carbs: 67,
    protein: 4.3,
    sodium: 413,
    calcium: '3%',
    iron: '8%',
  },
  {
    name: '姜饼',
    calories: 356,
    fat: 16.0,
    carbs: 49,
    protein: 3.9,
    sodium: 327,
    calcium: '7%',
    iron: '16%',
  },
  {
    name: '软糖豆',
    calories: 375,
    fat: 0.0,
    carbs: 94,
    protein: 0.0,
    sodium: 50,
    calcium: '0%',
    iron: '0%',
  },
  {
    name: '棒棒糖',
    calories: 392,
    fat: 0.2,
    carbs: 98,
    protein: 0,
    sodium: 38,
    calcium: '0%',
    iron: '2%',
  },
  {
    name: '蜂窝糖',
    calories: 408,
    fat: 3.2,
    carbs: 87,
    protein: 6.5,
    sodium: 562,
    calcium: '0%',
    iron: '45%',
  },
  {
    name: '甜甜圈',
    calories: 452,
    fat: 25.0,
    carbs: 51,
    protein: 4.9,
    sodium: 326,
    calcium: '2%',
    iron: '22%',
  },
  {
    name: 'KitKat巧克力',
    calories: 518,
    fat: 26.0,
    carbs: 65,
    protein: 7,
    sodium: 54,
    calcium: '12%',
    iron: '6%',
  },
]);

// CSV包装函数
const wrapCsvValue = (
  val: string | number,
  formatFn?: (val: string | number, row?: TableRow) => string,
  row?: TableRow,
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
  // naive encoding to csv format
  const content = [columns.value.map((col) => wrapCsvValue(col.label))]
    .concat(
      rows.value.map((row) =>
        columns.value
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : row[col.field === undefined ? col.name : (col.field as keyof TableRow)],
              col.format,
              row,
            ),
          )
          .join(','),
      ),
    )
    .join('\r\n');

  const status = exportFile('table-export.csv', content, 'text/csv');

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

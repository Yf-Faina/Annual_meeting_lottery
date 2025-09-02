<template>
  <q-page class="lottery-page">
    <!-- 数据状态提示区 -->
    <div v-if="store.totalCount === 0" class="data-warning">
      <q-banner class="bg-warning text-dark">
        <template v-slot:avatar>
          <q-icon name="warning" color="dark" />
        </template>
        <div>
          <div class="text-weight-bold">暂无参与人员数据</div>
          <div>请先到"参与人"页面上传人员名单</div>
        </div>
      </q-banner>
    </div>

    <!-- 数据统计信息 -->
    <div v-else class="data-info-section">
      <div class="data-info">
        <q-chip color="info" text-color="white" icon="people"> 总人数: {{ totalPeople }} </q-chip>
        <q-chip color="positive" text-color="white" icon="table_restaurant">
          总桌数: {{ tables.length }}
        </q-chip>
        <q-chip color="orange" text-color="white" icon="auto_awesome"> 每桌最多10人 </q-chip>
        <q-btn
          @click="refreshTables"
          color="grey-7"
          icon="refresh"
          size="sm"
          flat
          round
          class="q-ml-md"
        >
          <q-tooltip>重新从数据源分桌</q-tooltip>
        </q-btn>
      </div>
    </div>
    <!-- 奖品信息区 -->
    <div class="prize-info-section">
      <div class="prize-info">
        <q-chip
          :color="
            currentPrize.level === '特等奖'
              ? 'purple'
              : currentPrize.level === '一等奖'
                ? 'red'
                : currentPrize.level === '二等奖'
                  ? 'orange'
                  : 'blue'
          "
          text-color="white"
          size="lg"
          class="prize-chip"
        >
          {{ currentPrize.name }} ({{ currentPrize.level }})
        </q-chip>
        <div class="prize-count">剩余数量: {{ currentPrize.remaining }}</div>

        <!-- 奖品管理弹出按钮 -->
        <q-fab
          v-model="prizeManageFab"
          label="奖品管理"
          label-position="left"
          color="purple"
          icon="card_giftcard"
          direction="down"
          class="prize-fab"
        >
          <q-fab-action
            v-for="prize in prizes"
            :key="prize.id"
            :color="getPrizeColor(prize.level)"
            @click="selectPrize(prize)"
            :icon="prize.level === currentPrize.level ? 'check_circle' : 'local_activity'"
            :label="prize.level"
          />
          <q-fab-action
            color="grey-7"
            @click="showPrizeEditDialog = true"
            icon="edit"
            label="编辑奖品"
          />
        </q-fab>
      </div>
    </div>

    <!-- 抽奖主体区域 -->
    <div class="main-content">
      <!-- 左侧：桌子选择区 -->
      <div class="table-section">
        <h3>第一步：抽取桌号</h3>

        <!-- 滚动数字显示器 -->
        <div class="number-roller-container">
          <div class="number-display">
            <div class="number-label">桌号</div>
            <div class="rolling-number">
              <span class="number-digit">{{ displayTableNumber }}</span>
            </div>
            <div v-if="selectedTable" class="selected-info">
              <div class="table-name">{{ selectedTable.name }}</div>
              <div class="people-count">{{ selectedTable.people.length }}人</div>
            </div>
          </div>
        </div>

        <!-- 桌子信息列表（显示所有桌子供参考） -->
        <div v-if="!isSelectingTable" class="table-list">
          <div class="table-list-title">所有桌号 (权重信息)</div>
          <div class="table-items">
            <div
              v-for="table in tables"
              :key="table.id"
              :class="[
                'table-info-item',
                {
                  selected: selectedTable?.id === table.id,
                  'low-weight': table.currentWeight <= 0,
                  'high-weight': table.currentWeight > 0 && table.winnerCount === 0,
                },
              ]"
              :title="`权重: ${table.currentWeight.toFixed(2)} | 中奖率: ${(table.winningRate * 100).toFixed(1)}% | 已中奖: ${table.winnerCount}人`"
            >
              <span class="table-num">{{ table.name.replace('号桌', '') }}</span>
              <span class="table-desc">{{ table.people.length }}人</span>
              <span class="table-weight">权重: {{ table.currentWeight.toFixed(1) }}</span>
              <span class="table-winners" v-if="table.winnerCount > 0">
                已中{{ table.winnerCount }}人
              </span>
            </div>
          </div>
        </div>

        <div class="table-controls">
          <q-btn
            :loading="isSelectingTable"
            :disable="isSelectingPerson"
            @click="startTableSelection"
            color="primary"
            size="lg"
            class="lottery-btn"
          >
            {{ isSelectingTable ? '抽取中...' : '开始抽桌号' }}
          </q-btn>
          <q-btn
            v-if="selectedTable"
            @click="resetTableSelection"
            color="grey"
            size="md"
            flat
            class="reset-btn"
          >
            重新抽桌
          </q-btn>
        </div>
      </div>

      <!-- 右侧：人员选择区 -->
      <div class="person-section">
        <h3>第二步：抽取中奖人员</h3>
        <div v-if="!selectedTable" class="waiting-message">
          <q-icon name="arrow_back" size="2rem" color="grey-5" />
          <span>请先抽取桌号</span>
        </div>

        <div v-else class="person-grid">
          <div
            v-for="person in selectedTable.people"
            :key="person.id"
            :class="[
              'person-item',
              {
                winner: winnerPerson?.id === person.id,
                highlight: isPersonHighlighting && highlightedPerson?.id === person.id,
              },
            ]"
          >
            <div class="person-avatar">
              <!-- <img :src="person.avatar || '/icons/favicon-96x96.png'" /> -->
              <img :src="person.avatar || '/icons/face.png'" />
            </div>
            <div class="person-info">
              <div class="person-dept">部门: {{ person.department }}</div>
              <div class="person-id">工号: {{ person.employeeId }}</div>
            </div>
          </div>
        </div>

        <div v-if="selectedTable" class="person-controls">
          <q-btn
            :loading="isSelectingPerson"
            :disable="isSelectingTable"
            @click="startPersonSelection"
            color="secondary"
            size="lg"
            class="lottery-btn"
          >
            {{ isSelectingPerson ? '抽取中...' : '开始抽人' }}
          </q-btn>
          <!-- <q-btn
            v-if="winnerPerson"
            @click="confirmWinner"
            color="positive"
            size="lg"
            class="confirm-btn"
          >
            确认中奖
          </q-btn> -->
        </div>
      </div>
    </div>

    <!-- 中奖结果展示 -->
    <div v-if="winnerPerson" class="winner-display">
      <div class="winner-card">
        <!-- 关闭按钮 -->
        <q-btn
          @click="winnerPerson = null"
          icon="close"
          flat
          round
          color="grey-6"
          class="winner-close-btn"
        />

        <div class="winner-avatar">
          <img :src="winnerPerson.avatar || '/icons/face.png'" />
        </div>
        <div class="winner-info">
          <h2>🎉 恭喜中奖 🎉</h2>
          <div class="winner-details">
            <div>部门：{{ winnerPerson.department }}</div>
            <div>工号: {{ winnerPerson.employeeId }}</div>
            <div>桌号: {{ selectedTable?.name }}</div>
          </div>
          <div class="prize-won">获得: {{ currentPrize.name }}</div>

          <!-- 将确认中奖按钮移到这里！ -->
          <div class="winner-actions">
            <q-btn
              @click="confirmWinner"
              color="positive"
              size="xl"
              class="confirm-winner-btn"
              icon="check_circle"
            >
              确认中奖
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部控制区 -->
    <div class="bottom-controls">
      <q-btn-group>
        <q-btn @click="resetAll" color="warning" icon="refresh" label="重新开始" />
      </q-btn-group>
    </div>

    <!-- 中奖记录弹窗 -->
    <q-dialog v-model="showHistory">
      <q-card class="history-card">
        <q-card-section>
          <div class="text-h6">中奖记录</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-list>
            <q-item v-for="record in winnerStore.winnerHistory" :key="record.id">
              <q-item-section avatar>
                <img
                  :src="record.person.avatar || '/icons/favicon-96x96.png'"
                  class="record-avatar"
                />
              </q-item-section>
              <q-item-section>
                <!-- <q-item-label>{{ record.person.name }}</q-item-label> -->
                <q-item-label caption
                  >{{ record.person.department }} | {{ record.tableName }}</q-item-label
                >
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ record.prize }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="关闭" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 奖品编辑弹窗 -->
    <q-dialog v-model="showPrizeEditDialog">
      <q-card class="prize-edit-card" style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">编辑奖品</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="prize-edit-list">
            <div v-for="prize in prizes" :key="prize.id" class="prize-edit-item">
              <div class="prize-level-badge">
                <q-chip :color="getPrizeColor(prize.level)" text-color="white" size="sm">
                  {{ prize.level }}
                </q-chip>
              </div>

              <div class="prize-edit-controls">
                <q-input
                  v-model="prize.name"
                  label="奖品名称"
                  outlined
                  dense
                  class="prize-name-input"
                />

                <q-input
                  v-model.number="prize.total"
                  label="总数量"
                  type="number"
                  outlined
                  dense
                  min="1"
                  class="prize-total-input"
                  @update:model-value="
                    (val) => {
                      const numVal = Number(val);
                      prize.remaining = numVal; // 始终保持一致
                    }
                  "
                />
                <div class="prize-remaining">剩余: {{ prize.remaining }}</div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup />
          <q-btn flat label="保存" color="primary" @click="showPrizeEditDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePeopleStore } from '../stores/people';
import type { RowData } from '../stores/people';
import { useWinnersStore } from 'src/stores/winner';

// 奖品管理相关
const prizeManageFab = ref(false);
const showPrizeEditDialog = ref(false);

// 类型定义
interface Person {
  id: string | number;
  // name: string;
  department: string;
  employeeId: string | number;
  avatar?: string;
  isPresent: boolean;
}

interface Table {
  id: string;
  name: string;
  people: Person[];
  totalPeople: number; // 该桌总人数（固定值）
  winnerCount: number; // 该桌已中奖人数
  weightedWinnerCount: number; // 加权中奖计数（考虑奖品等级），为累计值
  currentWeight: number; // 当前中奖权重
  winningRate: number; // 中奖率
  prizeHistory: {
    // 记录每次中奖的奖品权重
    prizeId: string;
    weightFactor: number;
  }[];
}

interface Prize {
  id: string;
  name: string;
  level: string;
  total: number;
  remaining: number;
  image?: string;
  weightFactor: number; // 权重影响因子
}

// WinnerRecord 接口已在 winnerStore 中定义，这里不再需要
// interface WinnerRecord {
//   id: string;
//   person: Person;
//   prize: string;
//   tableName: string;
// }

const store = usePeopleStore();

// 将 store 中的数据转换为 Person 格式并分桌
const convertToPersons = (data: RowData[]): Person[] => {
  return data.map((item) => ({
    id: item.id,
    // name: (item.name || item.姓名 || item.员工姓名 || '未知姓名') as string,
    department: (item.department || item.部门缩写 || '未知部门') as string,
    employeeId: (item.雇员工号 || '未知工号') as string,
    isPresent: true,
  }));
};

// 按每桌10人分配桌子
const generateTables = (persons: Person[]): Table[] => {
  const tables: Table[] = [];
  const peoplePerTable = 10;

  for (let i = 0; i < persons.length; i += peoplePerTable) {
    const tablePeople = persons.slice(i, i + peoplePerTable);
    const tableNumber = Math.floor(i / peoplePerTable) + 1;

    tables.push({
      id: tableNumber.toString(),
      name: `${tableNumber}号桌`,
      people: tablePeople,
      totalPeople: tablePeople.length,
      winnerCount: 0,
      weightedWinnerCount: 0,
      currentWeight: 1,
      winningRate: 0,
      prizeHistory: [], // 初始化空数组
    });
  }

  return tables;
};

// 响应式数据
const allPersons = ref<Person[]>([]);
const tables = ref<Table[]>([]);

// 初始化数据
const initializeData = () => {
  console.log('初始化数据...');
  console.log('Store 数据:', store.peopleData);

  if (store.peopleData.length > 0) {
    allPersons.value = convertToPersons(store.peopleData);
    tables.value = generateTables(allPersons.value);
    console.log('转换后的人员数据:', allPersons.value);
    console.log('生成的桌子数据:', tables.value);
  } else {
    console.log('Store 中没有数据');
    allPersons.value = [];
    tables.value = [];
  }
};

// 页面挂载时初始化数据
onMounted(() => {
  initializeData();
});

// 监听 store 数据变化
const totalPeople = computed(() => store.totalCount);

// 重新分桌的功能
const refreshTables = () => {
  initializeData();
  resetAll();
};

// 计算桌子权重的方法
const calculateTableWeights = () => {
  // 计算所有奖品的总权重影响因子
  const totalWeightFactor = prizes.value.reduce(
    (sum, prize) => sum + prize.total * prize.weightFactor,
    0,
  );
  // 计算平均每桌的中奖阈值
  const averageWeightPerTable = totalWeightFactor / Math.max(tables.value.length, 1);

  tables.value.forEach((table) => {
    // 计算中奖率：已中奖人数 / 总人数
    table.winningRate = table.totalPeople > 0 ? table.winnerCount / table.totalPeople : 0;

    // 计算带权中奖计数 - 基于历史中奖记录
    table.weightedWinnerCount = table.prizeHistory.reduce(
      (sum, record) => sum + record.weightFactor,
      0,
    );

    // 新中奖权重公式：Weight = (1 - 中奖率) * 总人数
    // 如果带权计数已超过阈值，将权重设为0（不会被选中）
    if (table.weightedWinnerCount >= averageWeightPerTable) {
      table.currentWeight = 0;
    } else {
      table.currentWeight = (1 - table.winningRate) * table.totalPeople;
    }
  });

  console.log(
    '权重计算结果:',
    tables.value.map((t) => ({
      name: t.name,
      winnerCount: t.winnerCount,
      weightedWinnerCount: t.weightedWinnerCount,
      winningRate: t.winningRate,
      currentWeight: t.currentWeight,
      threshold: averageWeightPerTable,
      overThreshold: t.weightedWinnerCount >= averageWeightPerTable,
    })),
  );
};

//基于权重选桌子
const selectTableByWeight = (): Table | null => {
  // 先更新所有桌子的权重
  calculateTableWeights();

  // 计算所有奖品的总权重影响因子
  const totalWeightFactor = prizes.value.reduce(
    (sum, prize) => sum + prize.total * prize.weightFactor,
    0,
  );
  // 计算平均每桌的中奖阈值
  const averageWeightPerTable = totalWeightFactor / Math.max(tables.value.length, 1);

  // 过滤出符合以下条件的桌子：
  // 1. 还有人没中奖的桌子 (winnerCount < totalPeople)
  // 2. 带权中奖计数未超过平均阈值的桌子 (weightedWinnerCount < averageWeightPerTable)
  const availableTables = tables.value.filter(
    (table) =>
      table.winnerCount < table.totalPeople && table.weightedWinnerCount < averageWeightPerTable,
  );

  if (availableTables.length === 0) {
    console.log('没有可用的桌子（所有桌子要么已全部中奖，要么已超过平均中奖阈值）');
    return null;
  }

  // 计算可用桌子的总权重
  const totalWeight = availableTables.reduce((sum, table) => sum + table.currentWeight, 0);

  if (totalWeight <= 0) {
    // 如果所有权重都为0，随机选择一个可用桌子
    const randomIndex = Math.floor(Math.random() * availableTables.length);
    return availableTables[randomIndex];
  }

  // 生成随机数
  let randomValue = Math.random() * totalWeight;

  // 根据权重选择桌子
  for (const table of availableTables) {
    randomValue -= table.currentWeight;
    if (randomValue <= 0) {
      console.log(
        `选中桌子: ${table.name}, 权重: ${table.currentWeight}, ` +
          `中奖率: ${table.winningRate}, 带权计数: ${table.weightedWinnerCount}, ` +
          `阈值: ${averageWeightPerTable.toFixed(2)}`,
      );
      return table;
    }
  }

  // 兜底：返回最后一个可用桌子
  return availableTables[availableTables.length - 1];
};

// 更新桌子中奖信息
const updateTableWinningInfo = (table: Table, prize: Prize) => {
  table.winnerCount++; // 增加中奖人数

  // 记录中奖信息
  table.prizeHistory.push({
    prizeId: prize.id,
    weightFactor: prize.weightFactor,
  });

  // 重新计算权重
  calculateTableWeights();

  console.log(`桌子 ${table.name} 中奖更新:`, {
    winnerCount: table.winnerCount,
    weightedWinnerCount: table.weightedWinnerCount,
    newWeight: table.currentWeight,
  });
};

// 奖品数据
const prizes = ref<Prize[]>([
  { id: '0', name: 'MacBook Pro', level: '特等奖', total: 1, remaining: 1, weightFactor: 4 },
  { id: '1', name: 'iPhone 15 Pro', level: '一等奖', total: 1, remaining: 1, weightFactor: 3 },
  { id: '2', name: 'iPad Air', level: '二等奖', total: 2, remaining: 2, weightFactor: 2 },
  { id: '3', name: 'AirPods Pro', level: '三等奖', total: 5, remaining: 5, weightFactor: 1 },
]);

// 当前状态
const currentPrize = ref<Prize>(prizes.value[0]);
const selectedTable = ref<Table | null>(null);
const highlightedTable = ref<Table | null>(null);
const highlightedPerson = ref<Person | null>(null);
const winnerPerson = ref<Person | null>(null);
const isSelectingTable = ref(false);
const isSelectingPerson = ref(false);
const isTableHighlighting = ref(false);
const isPersonHighlighting = ref(false);
const showHistory = ref(false);
// 使用 winnerStore 代替本地的 winnerHistory
// const winnerHistory = ref<WinnerRecord[]>([]);

// 滚动数字显示
const displayTableNumber = ref('?');

// 抽桌号逻辑
const startTableSelection = () => {
  if (isSelectingTable.value) return;

  isSelectingTable.value = true;
  isTableHighlighting.value = true;
  selectedTable.value = null;
  winnerPerson.value = null;
  displayTableNumber.value = '?';

  let count = 0;
  const maxCount = 30; // 抽取次数

  const interval = setInterval(() => {
    // 在滚动过程中随机显示桌号（纯视觉效果）
    const availableTables = tables.value.filter(
      (table) => table.currentWeight > 0 && table.people.length > 0,
    );

    if (availableTables.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTables.length);
      const randomTable = availableTables[randomIndex];
      if (randomTable) {
        highlightedTable.value = randomTable;
        displayTableNumber.value = randomTable.name.replace('号桌', '');
      }
    }

    count++;
    if (count >= maxCount) {
      clearInterval(interval);

      // 使用加权随机算法最终选择桌子
      const finalSelectedTable = selectTableByWeight();

      if (finalSelectedTable) {
        selectedTable.value = finalSelectedTable;
        displayTableNumber.value = finalSelectedTable.name.replace('号桌', '');
        console.log(`最终选中桌子: ${finalSelectedTable.name}`);
      } else {
        console.log('没有可选择的桌子');
        displayTableNumber.value = '无';
      }

      highlightedTable.value = null;
      isSelectingTable.value = false;
      isTableHighlighting.value = false;
    }
  }, 100);
};

// 抽人逻辑
const startPersonSelection = () => {
  if (!selectedTable.value || isSelectingPerson.value) return;

  isSelectingPerson.value = true;
  isPersonHighlighting.value = true;
  winnerPerson.value = null;

  let count = 0;
  const maxCount = 15;
  let currentSpeed = 300;

  const interval = setInterval(() => {
    // 随机高亮人员
    const randomIndex = Math.floor(Math.random() * selectedTable.value.people.length);
    const selectedPerson = selectedTable.value.people[randomIndex];
    if (selectedPerson) {
      highlightedPerson.value = selectedPerson;
    }

    count++;

    if (count < 5) {
      currentSpeed = 300; // 开始较慢
    } else if (count < maxCount - 3) {
      currentSpeed = 120; // 中间较快
    } else {
      currentSpeed = 250; // 结束时放慢
    }

    if (count >= maxCount) {
      clearInterval(interval);
      // 最终选择
      const finalIndex = Math.floor(Math.random() * selectedTable.value.people.length);
      const finalSelectedPerson = selectedTable.value.people[finalIndex];
      if (finalSelectedPerson) {
        winnerPerson.value = finalSelectedPerson;
      }
      highlightedPerson.value = null;
      isSelectingPerson.value = false;
      isPersonHighlighting.value = false;
    }
  }, 150);
};

// 确认中奖
const confirmWinner = () => {
  if (!winnerPerson.value || !selectedTable.value) return;

  // 添加到中奖记录 - 使用 winnerStore
  winnerStore.addWinnerRecord({
    person: winnerPerson.value,
    prize: currentPrize.value.name,
    tableName: selectedTable.value.name,
  });

  // 减少奖品数量
  currentPrize.value.remaining--;

  // 更新桌子的中奖信息和权重
  updateTableWinningInfo(selectedTable.value, currentPrize.value);

  // 从桌子中移除中奖人员（防止重复中奖）
  const tableIndex = tables.value.findIndex((t) => t.id === selectedTable.value.id);
  if (tableIndex !== -1) {
    const targetTable = tables.value[tableIndex];
    if (targetTable) {
      targetTable.people = targetTable.people.filter((p) => p.id !== winnerPerson.value.id);
    }
  }

  resetAll();
};

// 重置选择
const resetTableSelection = () => {
  selectedTable.value = null;
  winnerPerson.value = null;
  displayTableNumber.value = '?';
};

const resetAll = () => {
  selectedTable.value = null;
  highlightedTable.value = null;
  highlightedPerson.value = null;
  winnerPerson.value = null;
  isSelectingTable.value = false;
  isSelectingPerson.value = false;
  isTableHighlighting.value = false;
  isPersonHighlighting.value = false;
  displayTableNumber.value = '?';
};

// 奖品管理方法
const getPrizeColor = (level: string) => {
  switch (level) {
    case '特等奖':
      return 'purple';
    case '一等奖':
      return 'red';
    case '二等奖':
      return 'orange';
    case '三等奖':
      return 'blue';
    default:
      return 'grey';
  }
};

const selectPrize = (prize: Prize) => {
  currentPrize.value = prize;
  prizeManageFab.value = false;
};

const winnerStore = useWinnersStore();
</script>

<style scoped>
/* 现有样式保持不变... */

/* 右侧人员选择区域样式调整 */
.person-section {
  flex: 1;
  padding: 1rem;
  border-radius: 12px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  position: relative; /* 添加相对定位，为按钮绝对定位做准备 */
}

.person-section h3 {
  margin-bottom: 1rem;
  text-align: center;
  color: #fff;
  flex-shrink: 0;
}

/* 人员网格调整 - 为按钮留出空间 */
.person-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
  perspective: 1000px;
  flex: 1; /* 占据剩余空间 */
  margin-bottom: 80px; /* 为按钮预留底部空间 */
}

/* 人员控制按钮区域 - 新的定位方式 */
.person-controls {
  position: absolute;
  bottom: 30%; /* 距离底部30%的位置 */
  left: 50%; /* 水平居中 */
  transform: translateX(-50%); /* 精确居中 */
  display: flex;
  justify-content: center;
  gap: 1rem;
  z-index: 10; /* 确保按钮在上层 */
}

/* 等待消息样式调整 */
.waiting-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #666;
  font-size: 1.1rem;
  height: 200px;
  flex: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .person-controls {
    top: 25%; /* 小屏幕上稍微向上移动 */
    padding: 0.8rem 1.5rem;
    border-radius: 20px;
  }
  
  .person-grid {
    margin-bottom: 60px; /* 小屏幕上减少底部边距 */
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .main-content {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .person-controls {
    top: 20%;
    padding: 0.6rem 1rem;
    border-radius: 15px;
  }
  
  .lottery-btn {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }
}

/* 人员卡片基础样式 */
.person-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 平滑过渡 */
  cursor: pointer;
  overflow: hidden;
}

/* 高亮动画效果 */
.person-item.highlight {
  transform: scale(1.05);
  border-color: #ff6b35;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
  animation: pulse-highlight 0.6s ease-in-out;
}

/* 中奖者样式 */
.person-item.winner {
  transform: scale(1.1);
  border-color: #4caf50;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  box-shadow: 0 12px 35px rgba(76, 175, 80, 0.5);
  animation: winner-celebrate 1s ease-in-out;
}

/* 高亮脉冲动画 */
@keyframes pulse-highlight {
  0% {
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
  }
  50% {
    box-shadow: 0 12px 35px rgba(255, 107, 53, 0.7);
    transform: scale(1.08);
  }
  100% {
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
    transform: scale(1.05);
  }
}

/* 中奖庆祝动画 */
@keyframes winner-celebrate {
  0% {
    transform: scale(1.05);
  }
  25% {
    transform: scale(1.15) rotate(2deg);
  }
  50% {
    transform: scale(1.1) rotate(-1deg);
  }
  75% {
    transform: scale(1.12) rotate(1deg);
  }
  100% {
    transform: scale(1.1) rotate(0deg);
  }
}

/* 人员头像样式 */
.person-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.5rem;
  transition: transform 0.3s ease;
}

.person-item.highlight .person-avatar {
  transform: scale(1.1);
}

.person-item.winner .person-avatar {
  transform: scale(1.2);
}

.person-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 人员信息样式 */
.person-info {
  text-align: center;
  transition: all 0.3s ease;
}

.person-item.highlight .person-info {
  color: #d32f2f;
  font-weight: 600;
}

.person-item.winner .person-info {
  color: #2e7d32;
  font-weight: bold;
}

.person-dept {
  font-size: 0.85rem;
  color: #fff;
  margin-bottom: 0.25rem;
}

.person-id {
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff; /* 确保颜色可见 */
  display: block; /* 确保显示 */
  visibility: visible; /* 确保可见 */
}

/* 人员网格布局优化 */
.person-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
  perspective: 1000px; /* 3D 效果 */
}

/* 桌号滚动数字优化 */
.rolling-number {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 按钮悬停效果 */
.lottery-btn {
  transition: all 0.3s ease;
}

.lottery-btn:hover:not([disabled]) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 抽奖按钮加载状态 */
.lottery-btn[loading] {
  animation: button-pulse 1.5s ease-in-out infinite;
}

@keyframes button-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 数字滚动效果 */
.number-digit {
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .person-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .person-item {
    padding: 0.75rem;
  }
}
</style>

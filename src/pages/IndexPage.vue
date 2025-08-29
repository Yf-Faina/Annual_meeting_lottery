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
        <q-chip color="info" text-color="white" icon="people">
          总人数: {{ totalPeople }}
        </q-chip>
        <q-chip color="positive" text-color="white" icon="table_restaurant">
          总桌数: {{ tables.length }}
        </q-chip>
        <q-chip color="orange" text-color="white" icon="auto_awesome">
          每桌最多10人
        </q-chip>
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
            currentPrize.level === '一等奖'
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
          <div class="table-list-title">所有桌号</div>
          <div class="table-items">
            <div
              v-for="table in tables"
              :key="table.id"
              :class="['table-info-item', { selected: selectedTable?.id === table.id }]"
            >
              <span class="table-num">{{ table.name.replace('号桌', '') }}</span>
              <span class="table-desc">{{ table.people.length }}人</span>
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
              <img :src="person.avatar || '/icons/favicon-96x96.png'" />
            </div>
            <div class="person-info">
              <div class="person-dept">{{ person.department }}</div>
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
          <q-btn
            v-if="winnerPerson"
            @click="confirmWinner"
            color="positive"
            size="lg"
            class="confirm-btn"
          >
            确认中奖
          </q-btn>
        </div>
      </div>
    </div>

    <!-- 中奖结果展示 -->
    <div v-if="winnerPerson" class="winner-display">
      <div class="winner-card">
        <div class="winner-avatar">
          <!-- <img :src="winnerPerson.avatar || '/icons/favicon-96x96.png'" :alt="winnerPerson.name" /> -->
          <img :src="winnerPerson.avatar || '/icons/favicon-96x96.png'"/>
        </div>
        <div class="winner-info">
          <h2>🎉 恭喜中奖 🎉</h2>
          <!-- <div class="winner-name">{{ winnerPerson.name }}</div> -->
          <div class="winner-details">
            <div>{{ winnerPerson.department }}</div>
            <div>工号: {{ winnerPerson.employeeId }}</div>
            <div>桌号: {{ selectedTable?.name }}</div>
          </div>
          <div class="prize-won">获得: {{ currentPrize.name }}</div>
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
            <q-item v-for="record in winnerHistory" :key="record.id">
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
                <q-item-label caption>{{ record.time }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="关闭" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePeopleStore } from '../stores/people';
import type { RowData } from '../stores/people';

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
}

interface Prize {
  id: string;
  name: string;
  level: string;
  total: number;
  remaining: number;
  image?: string;
}

interface WinnerRecord {
  id: string;
  person: Person;
  prize: string;
  tableName: string;
  time: string;
}

const store = usePeopleStore();

// 将 store 中的数据转换为 Person 格式并分桌
const convertToPersons = (data: RowData[]): Person[] => {
  return data.map(item => ({
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

// 奖品数据
const prizes = ref<Prize[]>([
  { id: '1', name: 'iPhone 15 Pro', level: '一等奖', total: 1, remaining: 1 },
  { id: '2', name: 'iPad Air', level: '二等奖', total: 2, remaining: 2 },
  { id: '3', name: 'AirPods Pro', level: '三等奖', total: 5, remaining: 5 },
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
const winnerHistory = ref<WinnerRecord[]>([]);

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
    // 随机显示数字
    const randomIndex = Math.floor(Math.random() * tables.value.length);
    const randomTable = tables.value[randomIndex];
    if (randomTable) {
      highlightedTable.value = randomTable;
      // 提取桌号数字（去掉"号桌"后缀）
      displayTableNumber.value = randomTable.name.replace('号桌', '');
    }

    count++;
    if (count >= maxCount) {
      clearInterval(interval);
      // 最终选择
      const finalIndex = Math.floor(Math.random() * tables.value.length);
      const finalSelectedTable = tables.value[finalIndex];
      if (finalSelectedTable) {
        selectedTable.value = finalSelectedTable;
        displayTableNumber.value = finalSelectedTable.name.replace('号桌', '');
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
  const maxCount = 20;

  const interval = setInterval(() => {
    // 随机高亮人员
    const randomIndex = Math.floor(Math.random() * selectedTable.value.people.length);
    const selectedPerson = selectedTable.value.people[randomIndex];
    if (selectedPerson) {
      highlightedPerson.value = selectedPerson;
    }

    count++;
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

  // 添加到中奖记录
  const record: WinnerRecord = {
    id: Date.now().toString(),
    person: winnerPerson.value,
    prize: currentPrize.value.name,
    tableName: selectedTable.value.name,
    time: new Date().toLocaleString(),
  };
  winnerHistory.value.unshift(record);

  // 减少奖品数量
  currentPrize.value.remaining--;

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
</script>
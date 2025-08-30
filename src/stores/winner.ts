// stores/winners.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface WinnerPerson {
  id: string | number;
  department: string;
  employeeId: string | number;
  avatar?: string;
}

export interface WinnerRecord {
  id: string;
  person: WinnerPerson;
  prize: string;
  tableName: string;
  timestamp: number;
}

export const useWinnersStore = defineStore('winners', () => {
  // 中奖记录列表
  const winnerHistory = ref<WinnerRecord[]>([]);

  // 添加中奖记录
  const addWinnerRecord = (record: Omit<WinnerRecord, 'id' | 'timestamp'>) => {
    const newRecord: WinnerRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    winnerHistory.value.unshift(newRecord);
  };

  // 获取所有中奖记录（按时间倒序）
  const getAllRecords = () => {
    return winnerHistory.value;
  };

  // 按奖品筛选记录
  const getRecordsByPrize = (prizeName: string) => {
    return winnerHistory.value.filter((record) => record.prize === prizeName);
  };

  // 按部门筛选记录
  const getRecordsByDepartment = (department: string) => {
    return winnerHistory.value.filter((record) => record.person.department === department);
  };

  // 清空记录
  const clearAllRecords = () => {
    winnerHistory.value = [];
  };

  return {
    winnerHistory,
    addWinnerRecord,
    getAllRecords,
    getRecordsByPrize,
    getRecordsByDepartment,
    clearAllRecords,
  };
});

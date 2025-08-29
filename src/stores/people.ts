import { defineStore } from 'pinia';

// 定义行数据类型
export interface RowData {
  id: string | number;
  [key: string]: string | number | boolean | null | undefined;
}

// 定义列的类型接口
export interface TableColumn {
  name: string;
  label: string;
  field: string | ((row: RowData) => string | number);
  required?: boolean;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  format?: (val: string | number) => string;
}

export const usePeopleStore = defineStore('people', {
  state: () => ({
    // 存储解析后的人员数据
    peopleData: [] as RowData[],
    // 存储动态生成的列定义
    columns: [] as TableColumn[],
    // 存储是否已加载数据的状态
    isDataLoaded: false,
  }),
  
  getters: {
    // 获取人员总数
    totalCount: (state) => state.peopleData.length,
    // 根据部门筛选人员
    getPeopleByDepartment: (state) => (department: string) => {
      return state.peopleData.filter(person => 
        person.department === department || person.department_short === department
      );
    },
    // 获取所有部门列表
    allDepartments: (state) => {
      const departments = new Set();
      state.peopleData.forEach(person => {
        if (person.department) departments.add(person.department);
        if (person.department_short) departments.add(person.department_short);
      });
      return Array.from(departments);
    },
  },
  
  actions: {
    // 保存解析的数据
    setPeopleData(data: RowData[], columns: TableColumn[]) {
      this.peopleData = data;
      this.columns = columns;
      this.isDataLoaded = true;
      console.log('数据已保存到 Pinia store:', this.peopleData.length, '条记录');
    },
    
    // 清空数据
    clearPeopleData() {
      this.peopleData = [];
      this.columns = [];
      this.isDataLoaded = false;
    },
    
    // 添加单个人员
    addPerson(person: RowData) {
      this.peopleData.push(person);
    },
    
    // 删除人员
    removePerson(id: string | number) {
      const index = this.peopleData.findIndex(person => person.id === id);
      if (index > -1) {
        this.peopleData.splice(index, 1);
      }
    },
    
    // 更新人员信息
    updatePerson(id: string | number, updatedData: Partial<RowData>) {
      const index = this.peopleData.findIndex(person => person.id === id);
      if (index > -1) {
        this.peopleData[index] = { ...this.peopleData[index], ...updatedData };
      }
    },
  },
  
  // 持久化配置 - 页面刷新数据不会丢失
  persist: true,
});

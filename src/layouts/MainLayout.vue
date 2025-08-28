<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="lottery-header" height-hint="98">
      <q-toolbar class="lottery-toolbar">
        <q-toolbar-title class="lottery-title">
          <q-avatar class="logo-avatar">
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          尚睿公司年会抽奖系统
        </q-toolbar-title>
      </q-toolbar>

      <q-tabs align="left" class="lottery-tabs">
        <q-route-tab to="/" label="抽奖大厅" class="lottery-tab" />
        <q-route-tab to="/history" label="中奖历史记录" class="lottery-tab" />
        <q-route-tab to="/people" label="参与人" class="lottery-tab" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// No imports needed for this basic layout
</script>

<style lang="scss" scoped>
.lottery-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.lottery-toolbar {
  background: transparent;
  padding: 0 20px;
}

.lottery-title {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  .logo-avatar {
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
}

.lottery-tabs {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.lottery-tab {
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.q-tab--active {
    background: rgba(255, 255, 255, 0.2);
    border-bottom: 3px solid #ffd700;
  }
}

// 确保整个布局的一致性
:deep(.q-layout) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>

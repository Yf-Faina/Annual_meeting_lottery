declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

// Pinia 持久化插件类型声明
import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase{
    persist?: boolean
  }
}

// import 'pinia'

// declare module 'pinia' {
//   export interface DefineStoreOptionsBase<S, Store>{
//     persist?: boolean
//   }
// }

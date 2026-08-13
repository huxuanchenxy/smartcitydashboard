<template>
  <div class="datav-menu-box">
    <div class="datav-menu-left">
      <div class="datav-menu-logo">
        <div class="logo-img" v-if="activeMode == 0" @click="goHome()"></div>
        <n-popover trigger="hover" placement="bottom" v-if="activeMode == 1">
          <template #trigger>
            <IconHome class="logo-home" @click="goHome()" />
          </template>
          <span style="font-size:18px;font-family:思源黑体Normal">返回主页</span>
        </n-popover>
      </div>
      <div class="datav-menu-list">
        <div class="datav-menu-item" v-for="nav in navs?.filter(r => r.enabled)" :key="nav.id"
          :class="{ 'datav-menu-actived': activeNav === nav.id }" @click="toggleNav(nav)">
          <n-popover trigger="hover" placement="right">
            <template #trigger>
              <component :is="nav.key" class="menu-icon"></component>
            </template>
            <span style="font-size:18px;font-family:思源黑体Normal">{{ nav.name }}</span>
          </n-popover>
        </div>
      </div>
    </div>
    <div class="datav-menu-right">
      <div class="datav-menu-title">
        <div class="title">{{ navs ? navs[activeNav]?.name : "" }}</div>
      </div>
      <div class="datav-menu-children">
        <div class="menu-item" v-for="item in navs[activeNav]?.children?.filter(r => r.enabled)" :key="item.id"
          :class="{ 'menu-item-actived': activeItem === item.id }" @click="toggleItem(item)">
          <component :is="item.icon" class="menu-icon"></component>
          <div style="width:120px;text-align:left;white-space: nowrap;">{{ item.name }}</div>
          <IconNext class="menu-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconArrowDown, IconPassword, IconProject, IconSystem, IconUserManage, IconNext, IconXmlb, IconJsgl, IconYhgl, IconCspz, IconSbglqpz,
  IconSbgl, IconJqpz, IconHb, IconHmgl, IconBl, IconBlgl, IconBb, IconBb2, IconPf, IconPf2, IconDatarecord, IcondeviceLocation, IconBj, IconBjgz, IconLsbj, IconKz, IconKzq, IconHome, IconCavansLocation, IconAi
} from '@/icons'
import type { PropType } from 'vue'

interface NavDataType {
  id: number
  key: string
  name: string
  enabled: boolean
  children: NavChildDataType[]
}

interface NavChildDataType {
  id: number
  icon: string
  name: string
  path: string
  enabled: boolean
}

export default defineComponent({
  name: 'NavHeader',
  components: {
    IconArrowDown, IconPassword, IconProject, IconSystem, IconUserManage, IconNext, IconXmlb, IconJsgl, IconYhgl, IconCspz, IconSbglqpz, IconSbgl, IconJqpz,
    IconHb, IconDatarecord, IcondeviceLocation, IconHmgl, IconBl, IconBlgl, IconBb, IconBb2, IconPf, IconPf2, IconBj, IconBjgz, IconLsbj, IconKz, IconKzq, IconHome, IconCavansLocation, IconAi
  },
  props: {
    navs: {
      type: Array as PropType<NavDataType[]>,
      required: true,
    },
    activeMode: {
      type: Object as PropType<number>,
      required: true,
    }
  },
  setup(props, context) {
    const route = useRoute()
    const router = useRouter()
    const activeNav = ref(0)
    const activeItem = ref(0)

    const toggleNav = (nav: NavDataType) => {
      activeNav.value = nav.id
      activeItem.value = nav.children[0].id
      toggleItem(nav.children[0]);
      //context.emit('change', nav)
    }

    const toggleItem = (item: NavChildDataType) => {
      activeItem.value = item.id
      context.emit('change', item)
    }

    const goHome = () => {
      context.emit('home', null);
    }

    watch(
      () => props.navs, // 监听 id 的变化
      async (navs) => {
        navs.forEach((r) => {
          r.children.forEach((m) => {
            if (m.path === router.currentRoute.value.name) {
              activeNav.value = r.id;
              activeItem.value = m.id;
            }
          })
        })
      }
    );

    return {
      toggleNav,
      toggleItem,
      activeNav,
      activeItem,
      goHome
    }
  },
})
</script>

<style lang="scss">
.datav-menu-box {
  width: 360px;
  height: 100vh;
  display: flex;
  flex-direction: row;

  .datav-menu-left {
    width: 120px;
    height: 100vh;
    display: flex;
    flex-direction: column;

    .datav-menu-logo {
      width: 100%;
      height: 120px;
      flex-grow: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #F7F7F7;

      .logo-img {
        width: 72px;
        height: 72px;
        background-size: cover;
        background-position: center;
        background-image: url('../images/logo_icon.png');
        cursor: pointer;
      }

      .logo-home {
        width: 60px;
        height: 60px;
        fill: #999999;
        cursor: pointer;
      }

      .logo-home:hover {
        fill: #005497;
      }
    }

    .datav-menu-list {
      width: 100%;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;


      .datav-menu-item {
        width: 120px;
        height: 120px;
        border: 0;
        color: #999999;
        text-align: center;

        .menu-icon {
          width: 45px;
          height: 45px;
          margin-top: 37px;
          fill: #999999;
          cursor: pointer;
        }

        .menu-icon:hover {
          fill: #005497;
        }
      }

      .datav-menu-actived {
        background-color: #F0F4FD;
        position: relative;
        color: #005497;

        &:before {
          content: "";
          position: absolute;
          bottom: -19px;
          right: 0;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle at 100% 0%, transparent 20px, #F0F4FD 0);
          transform: rotate(180deg);
        }

        &::after {
          content: "";
          position: absolute;
          top: -19px;
          right: 0;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle at 0% 0%, transparent 20px, #F0F4FD 0);
        }


        .menu-icon {
          fill: #005497;
        }
      }
    }
  }

  .datav-menu-right {
    width: 240px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #F0F4FD;

    .datav-menu-title {
      width: 100%;
      height: 120px;
      flex-grow: 0;
      border-bottom: 1px solid #F7F7F7;

      .title {
        font-size: 24px;
        font-weight: 400;
        font-family: '思源黑体Normal';
        width: 200px;
        height: 35px;
        margin: 42px 0 0 20px;
      }
    }

    .datav-menu-children {
      width: 100%;
      flex-grow: 1;

      .menu-item {
        width: 236px;
        height: 48px;
        font-size: 20px;
        font-family: '思源黑体Normal';
        color: #999999;
        background-color: #FFFFFF;
        margin: 6px 0 0 2px;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        cursor: pointer;

        .menu-icon {
          margin: 0 12px;
          width: 24px;
          height: 24px;
          fill: #999999;
        }
      }

      .menu-item-actived {
        background-color: #0E62A9;
        color: #FFFFFF;

        .menu-icon {
          fill: #FFFFFF;
        }
      }
    }
  }
}
</style>

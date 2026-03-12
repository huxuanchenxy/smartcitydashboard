<template>
  <div class="datav-wrapper" :style="wrapperStyle">
    <div ref="titleRef" :style="titleStyle">
      {{ titleText }}
    </div>
    <div :style="counterStyle">
      <span :style="prefixStyle">
        {{ prefixText }}
      </span>
      <span v-for="(n, i) in realNumber" :key="i" :style="[n === separatingSymbol ? separateCharStyle : numberStyle]">
        {{ n }}
      </span>
      <span :style="suffixStyle">
        {{ suffixText }}
      </span>
    </div>
  </div>
</template>

<script lang='ts'>
import { defineComponent, PropType, ref, toRef, computed, watchEffect, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import type { CSSProperties } from 'vue'
import gsap from 'gsap'
import Accounting from 'accounting'
import NP from 'number-precision'
import { useDataCenter, getFieldMap } from '@/mixins/data-center'
import { ApiModule } from '@/store/modules/api'
import { calcStrWidth, setNP } from '@/utils/util'
import { RangeNumberFlop } from './range-number-flop'
import { useEventCenter } from '@/mixins/event-center'
import { IcHandleItemField } from '@/components/data-handle'
import { DatavError } from '@/domains/error'

export default defineComponent({
  name: 'VRangeNumberFlop',
  props: {
    com: {
      type: Object as PropType<RangeNumberFlop>,
      required: true,
    },
  },
  setup(props) {
    useDataCenter(props.com)
    useEventCenter(props.com)

    const titleRef = ref(null)
    const numVal = ref(0)
    const timer = ref<number | null>(null)

    const dv_data = computed(() => {
      return ApiModule.dataMap[props.com.id]?.source ?? {}
    })

    const dv_field = computed(() => {
      return getFieldMap(props.com.apis.source.fields)
    })

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')

    const titleText = computed((): string => {
      return dv_data.value[dv_field.value.title] || config.value.title.content
    })

    const prefixText = computed((): string => {
      return dv_data.value[dv_field.value.prefix] ?? config.value.counter.prefix.content
    })

    const suffixText = computed((): string => {
      return dv_data.value[dv_field.value.suffix] ?? config.value.counter.suffix.content
    })

    const separatingSymbol = computed(() => {
      return config.value.numbers.separatingSymbol
        ? config.value.numbers.separatingSymbol.charAt(0)
        : ','
    })

    const decimalSymbol = computed(() => {
      return config.value.numbers.decimalSymbol
        ? config.value.numbers.decimalSymbol.charAt(0)
        : '.'
    })

    const duration = computed(() => {
      return config.value.numbers.duration > 0
        ? config.value.numbers.duration
        : 0
    })

    const realNumber = computed(() => {
      const { numbers } = config.value
      let value = Accounting.toFixed(numVal.value, numbers.decimal)
      const hasDecimal = value.includes('.')
      let [lStr, rStr = ''] = value.split('.')
      if (numbers.digit > 0) {
        const _digit = numbers.digit - rStr.length
        if (_digit > 0) {
          lStr = (Array(_digit).join('0') + lStr).slice(-_digit)
        } else {
          lStr = '0'
          rStr = rStr.slice(0, _digit || -1)
        }
      }

      if (numbers.separatingChart) {
        lStr = lStr.replace(/(?=\B(\d{3})+($|\.))/g, separatingSymbol.value)
      }

      const rn = hasDecimal ? `${lStr}${decimalSymbol.value}${rStr}` : lStr
      return rn.split('')
    })

    const wrapperStyle = computed(() => {
      const arrangement = config.value.global.arrangement
      let style = {}
      if (arrangement === 'top') {
        style = {
          display: 'block',
          alignItems: 'start',
          flexDirection: 'column',
        }
      } else if (arrangement === 'left') {
        style = {
          display: 'flex',
          alignItems: 'baseline',
          flexDirection: 'row',
        }
      } else if (arrangement === 'bottom') {
        style = {
          display: 'flex',
          alignItems: 'start',
          flexDirection: 'column-reverse',
        }
      }
      style['cursor'] = config.value.cursor
      return {
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
        ...style,
      } as Partial<CSSProperties>
    })

    const titleStyle = computed(() => {
      const { fontFamily, arrangement, distance } = config.value.global
      const { textStyle } = config.value.title

      const style: Partial<CSSProperties> = {
        display: 'flex',
        alignItems: 'center',
        color: textStyle.color,
        fontWeight: textStyle.fontWeight as any,
        fontFamily: `${fontFamily}, Arial, sans-serif`,
        fontSize: `${textStyle.fontSize}px`,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        lineHeight: 'normal',
        margin: '0px',
        justifyContent: textStyle.textAlign,
        width: '100%',
      }

      if (arrangement === 'top') {
        style.margin = `0px 0px ${distance}px`
      } else if (arrangement === 'left') {
        style.width = 'auto'
        style.margin = `0px ${distance}px 0px 0px`
      } else if (arrangement === 'bottom') {
        style.margin = `${distance}px 0px 0px`
      }
      return style
    })

    const counterStyle = computed(() => {
      const { title, counter, numbers, global } = config.value
      const style: Partial<CSSProperties> = {
        display: 'flex',
        alignItems: 'baseline',
        color: numbers.textStyle.color,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        justifyContent: counter.justifyContent,
        fontFamily: counter.fontFamily,
        backgroundColor: 'rgba(0, 0, 0, 0)',
      }

      const titleFont = `${title.textStyle.fontWeight} ${title.textStyle.fontSize}px ${global.fontFamily}, Arial, sans-serif`
      const titleContainerW = calcStrWidth(titleText.value, titleFont)
      const titleContainerH = title.textStyle.fontSize + 10
      const arrangement = global.arrangement
      if (arrangement === 'top' || arrangement === 'bottom') {
        style.width = `${attr.value.w}px`
        style.height = `${attr.value.h - titleContainerH}px`
      } else if (arrangement === 'left') {
        style.width = `${attr.value.w - titleContainerW}px`
        style.height = `${attr.value.h}px`
      }
      return style
    })

    const prefixStyle = computed(() => {
      const { prefix, margin } = config.value.counter
      return {
        marginRight: `${margin.preNum}px`,
        color: prefix.textStyle.color,
        fontSize: `${prefix.textStyle.fontSize}px`,
        fontWeight: prefix.textStyle.fontWeight,
        VerticalAlign: 'super',
        fontFamily: config.value.global.fontFamily,
      } as CSSProperties
    })

    const suffixStyle = computed(() => {
      const { suffix, margin } = config.value.counter
      return {
        marginLeft: `${margin.numSuff}px`,
        color: suffix.textStyle.color,
        fontSize: `${suffix.textStyle.fontSize}px`,
        fontWeight: suffix.textStyle.fontWeight,
        VerticalAlign: 'super',
        fontFamily: config.value.global.fontFamily,
      } as CSSProperties
    })

    const numberStyle = computed(() => {
      const { numbers } = config.value
      const style: Partial<CSSProperties> = {
        display: 'inline-block',
        textIndent: '0.02em',
        letterSpacing: '0.02em',
        height: 'auto',
        lineHeight: 'normal',
        backgroundColor: numbers.bgColor,
        fontSize: `${numbers.textStyle.fontSize}px`,
        fontWeight: numbers.textStyle.fontWeight as any,
        marginRight: `${numbers.marginRight}em`,
        borderRadius: `${numbers.bgRadius}px`,
        textAlign: numbers.textalign as any,
      }
      if (numbers.fixedWidth > 0) {
        style.width = `${numbers.fixedWidth}px`
      }
      return style
    })

    const separateCharStyle = computed(() => {
      const { numbers } = config.value
      const style: Partial<CSSProperties> = {
        display: 'inline-block',
        textIndent: '0.02em',
        letterSpacing: '0.02em',
        height: 'auto',
        lineHeight: 'normal',
        fontSize: `${numbers.textStyle.fontSize}px`,
        fontWeight: numbers.textStyle.fontWeight as any,
        marginRight: `${numbers.marginRight}em`,
        borderRadius: `${numbers.bgRadius}px`,
        textAlign: numbers.textalign as any,
      }
      if (numbers.bgSeparating) {
        style.backgroundColor = numbers.bgColor
      }
      return style
    })

    const generateRandomNumber = () => {
      const { min, max } = config.value.range
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    const startTimer = () => {
      // 清除之前的定时器
      if (timer.value) {
        clearInterval(timer.value)
      }

      // 立即生成一个随机数
      const initialNumber = generateRandomNumber()
      if (config.value.numbers.animation) {
        numVal.value = 0
        gsap.to(numVal, {
          duration: duration.value / 1000,
          value: initialNumber,
        })
      } else {
        numVal.value = initialNumber
      }

      // 设置定时器
      timer.value = window.setInterval(() => {
        const randomNumber = generateRandomNumber()
        if (config.value.numbers.animation) {
          gsap.to(numVal, {
            duration: duration.value / 1000,
            value: randomNumber,
          })
        } else {
          numVal.value = randomNumber
        }
      }, config.value.range.interval)
    }

    const mitter = getCurrentInstance()?.appContext.config.globalProperties.mitter

    //点位联动事件 ic_event
    mitter.on(props.com.id, (field: IcHandleItemField) => {
      switch (field.targetMethodName) {
        case 'property':
          if (field.bindType == "bind") {
            setNP(props.com, field.targetProperty, field.value);
          }
          else {
            if (field.hasDecideScript && field.decideScript) {
              try {
                const func = new Function("data,com,path,setNP", field.decideScript);
                func(field.value, props.com, field.targetProperty, setNP);
              } catch (error) {
                throw new DatavError("过滤条件执行失败", error.toString(), {
                  targetId: props.com.id,
                  origin: error
                });
              }
            } else {
              //console.log("未编写执行语句");
            }
          }
          break
      }
    })

    // 监听范围配置变化，重新启动定时器
    watchEffect(() => {
      const { range } = config.value
      startTimer()
    })

    onMounted(() => {
      startTimer()
    })

    onUnmounted(() => {
      if (timer.value) {
        clearInterval(timer.value)
      }
    })

    return {
      titleRef,
      titleText,
      prefixText,
      suffixText,
      separatingSymbol,
      decimalSymbol,
      duration,
      realNumber,
      wrapperStyle,
      titleStyle,
      counterStyle,
      prefixStyle,
      suffixStyle,
      numberStyle,
      separateCharStyle,
    }
  },
})
</script>
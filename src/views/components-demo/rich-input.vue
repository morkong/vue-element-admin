<template>
  <div class="components-container">
    <h3>富文本输入框，高亮非法字符，例如：/([\u3000]|[^\x20-\x7E,./?])/gu 表示全角空格或者非 ASCII 字符</h3>
    <p>单行输入框</p>
    <rich-input v-model="text1" />
    <p>多行输入框</p>
    <rich-input v-model="text2" type="textarea" :rows="5" />
    <p>显示每行字数</p>
    <div class="text-box">
      <rich-input v-model.lazy="text3" class="rich-input" type="textarea" :rows="5" @scroll="scrollChange" />
      <div v-for="(item, index) in lineList" v-show="lineList.length" :key="index" class="input__count" :style="`top:${index * 18 - scrollTop}px;`">
        <span :class="{ 'text-warning': item.length > lineMax }"> {{ countStringLength(item) }} </span>/{{ lineMax }}
      </div>
    </div>
  </div>
</template>

<script>
import RichInput from '@/components/RichInput'
export default {
  components: {
    RichInput
  },
  data() {
    return {
      text1: '',
      text2: '',
      text3: '',
      scrollTop: 0,
      lineMax: 35 // 每行最大字数
    }
  },
  computed: {
    lineList() {
      return this.text3?.trimEnd('\n')?.split('\n') || []
    },
    countStringLength() {
      return (str) => {
        if (!str) return 0
        let count = 0
        for (let i = 0; i < str.length; i++) {
          // 检查字符是否为汉字
          if (/[\u4e00-\u9fa5]/.test(str[i])) {
            count += 2 // 汉字计算为2
          } else {
            count++ // 其他字符计算为1
          }
        }
        return count
      }
    }
  },
  methods: {
    scrollChange(scrollTop) {
      this.scrollTop = scrollTop
    }
  }
}
</script>

<style lang="scss" scoped>
.text-box {
  overflow: hidden;
  position: relative;

  .rich-input {
    ::v-deep .el-textarea__inner,
    ::v-deep .ql-editor {
      padding-right: 50px;
    }
  }
  .input__count {
    position: absolute;
    right: 15px;
    color: #909399;
    font-size: 12px;
    padding: 7px 5px;
  }
  .text-warning {
    color: #f56c6c;
  }
}
</style>

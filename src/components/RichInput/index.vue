<template>
  <div class="editorBox">
    <el-input v-show="isInputShow" ref="textarea" v-model="localValue" class="textareaDIY" :type="type" size="mini" :rows="rows" :autosize="{ minRows: rows }" :placeholder="placeholder" :disabled="disabled" v-bind="$attrs" v-on="$listeners" @blur.native.capture="inputBlur" @change="inputChange" />
    <quill-editor v-show="!isInputShow" ref="editorRef" :content="content" :options="editorOption" :height="rows * 40" :style="{ '--editor-height': `${10 + rows * 18}px` }" @focus="onEditorFocus($event)" />
  </div>
</template>

<script>
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

import { quillEditor } from 'vue-quill-editor'
import { isEmpty } from 'lodash-es'

export default {
  name: 'RichInput',
  components: { quillEditor },
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'text'
    },
    rows: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      content: '',
      editorOption: {
        theme: 'bubble',
        modules: {
          // 禁用浮动工具栏
          toolbar: false
        },
        readOnly: true,
        placeholder: this.placeholder,
        // 设置默认样式
        formats: {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#333'
        }
      },
      highlightPromise: null,
      scrollTop: 0,
      inputShow: false,
      // 符合正则表达式的内容会被高亮显示
      // 例如：/([\u3000]|[^\x20-\x7E,./?])/gu 表示全角空格或者非 ASCII 字符
      regex: /([\u3000]|[^\x20-\x7E,./?])/gu,
      // 添加一个标志位，用于记录 inputBlur 执行的时间
      lastBlurTime: 0
    }
  },
  computed: {
    regexTest() {
      return this.regex.test(this.localValue)
    },
    isInputShow() {
      // 判断是否显示输入框
      // disabled 时
      // 为空时
      // 内容不包含全角空格或者非 ASCII 字符
      return this.inputShow || this.disabled || this.localValue === '' || !this.regexTest
    },
    localValue: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  watch: {
    value: {
      handler(newValue, oldValue) {
        if (isEmpty(newValue) && isEmpty(oldValue)) {
          return
        }
        if (newValue === oldValue) {
          return
        }
        this.highlightPromise = this.highlightPromise || Promise.resolve()
        this.highlightPromise.then(() => {
          this.highlightText(newValue)
        })
      },
      immediate: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.editorRef) {
        const textarea = this.$refs.editorRef.quill.root
        textarea.addEventListener('scroll', (e) => {
          this.scrollTop = e.target.scrollTop
          this.$emit('scroll', e.target.scrollTop)
        })
        // 设置 spellcheck 属性为 false
        this.$refs.editorRef.quill.root.setAttribute('spellcheck', false)
        this.$refs.editorRef.quill.enable(false)
      }
      if (this.$refs.textarea) {
        const textarea = this.$refs.textarea.$el.firstChild
        textarea.addEventListener('scroll', (e) => {
          this.$emit('scroll', e.target.scrollTop)
        })
      }
    })
  },
  methods: {
    inputChange(value) {
      this.$emit('change', value)
    },
    inputBlur(e) {
      // 解决el-input 回车后失去焦点的问题
      if (e instanceof FocusEvent) {
        if (!e.sourceCapabilities) {
          this.onEditorFocus()
          return
        }
      }
      this.inputShow = false
      this.lastBlurTime = Date.now()
      this.highlightPromise = this.highlightPromise || Promise.resolve()
      this.highlightPromise.then(() => {
        this.$nextTick(() => {
          this.highlightText(this.value)
        })
      })
    },
    onEditorFocus() {
      // 检查是否在 inputBlur 执行后的 200ms 内
      // 解决点击输入框外面，输入框也会获取焦点的问题
      if (Date.now() - this.lastBlurTime < 200) {
        return
      }
      this.inputShow = true
      this.$nextTick(() => {
        this.$refs.textarea.$refs.textarea.focus()
      })
    },
    highlightText(str) {
      if (!this.regex.test(str)) {
        return Promise.resolve()
      }
      const editor = this.$refs.editorRef.quill
      if (!editor) {
        return Promise.resolve()
      }

      this.highlightPromise = new Promise((resolve) => {
        const text = str || this.getInnerText()
        if (str) {
          editor.setText(text)
        }
        // 重置所有文本为默认样式
        editor.formatText(0, editor.getLength(), {
          color: '#606266',
          // background: "#fff",
          'user-select': 'text'
        })

        // 匹配全角空格
        const fullWidthSpaceRegex = /[\u3000]/gu
        const fullWidthMatches = [...text.matchAll(fullWidthSpaceRegex)]

        // 匹配其他非ASCII字符(除了,./?)
        const nonAsciiRegex = /([^\x20-\x7E,./?])/gu
        const nonAsciiMatches = [...text.matchAll(nonAsciiRegex)]

        // 处理其他非ASCII字符
        nonAsciiMatches.forEach((match) => {
          editor.formatText(match.index, match[0].length, {
            color: '#f56c6c',
            'user-select': 'text'
          })
        })

        // 处理全角空格
        fullWidthMatches.forEach((match) => {
          editor.formatText(match.index, 1, {
            background: '#f56c6c',
            'user-select': 'text',
            bold: true
          })
        })
        this.$nextTick(() => {
          resolve()
        })
      })
      return this.highlightPromise
    },
    getInnerText() {
      const editor = this.$refs.editorRef.quill
      if (!editor) {
        return ''
      }
      const delta = editor.getContents()
      const text = delta.ops.map((op) => op.insert).join('')
      return text
    }
  }
}
</script>
<style lang="scss" scoped>
.editorBox {
  position: relative;
  overflow: hidden;

  .textareaDIY {
    font-size: 12px;
  }
}

.editorBox ::v-deep p {
  line-height: 1.5;
}

::v-deep .ql-editor {
  box-sizing: border-box;
  width: 100%;
  overflow-y: auto;
  height: var(--editor-height);
  line-height: 1.5;
  font-size: 12px;
  color: #606266;
  background-color: #fff;
  background-image: none;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 5px 15px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  display: block;
  user-select: text;
}

::v-deep .ql-editor * {
  white-space: pre-wrap;
}

::v-deep .ql-editor.ql-blank:before {
  color: rgba(0, 0, 0, 0.3);
  content: attr(data-placeholder);
  pointer-events: none;
  position: absolute;
  font-style: normal;
  left: 15px;
  right: 15px;
}

::v-deep .ql-editor:focus {
  border-color: #07467c;
  outline: none;
}

::v-deep .ql-editor {
  white-space: pre-wrap;
}

::v-deep .ql-editor span {
  position: relative;
}

::v-deep .ql-editor span[style*='background']::after {
  content: ' ';
  display: inline-block;
  width: 1em;
}
</style>
<style lang="css" scoped>
::v-deep .input__count {
  position: absolute;
  right: 15px;
  color: #909399;
  font-size: 12px;
  padding: 0 5px;
}
</style>

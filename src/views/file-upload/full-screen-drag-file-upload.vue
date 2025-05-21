<template>
  <div class="fullScreenDragFileUpload" @dragover.prevent @drop="handleDrop" @dragenter="handleDragEnter" @dragleave="handleDragLeave">
    <h1>全屏拖拽文件上传</h1>
    <!-- 正常区域 -->
    <div class="normal-area">随便放点东西</div>

    <!-- 拖拽区域 -->
    <div v-show="isDragging" class="drag-drop-area">
      <p>嘿！松开文件就可以上传文件啦~</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FullScreenDragFileUpload',
  data() {
    return {
      isDragging: false, // 用于判断是否正在拖拽
      uploadLoading: false
    }
  },
  methods: {
    // 检查是否有对话框打开
    isAnyDialogOpen() {
      // const dialogsToCheck = [this.dialogVisible]
      // return dialogsToCheck.some((dialog) => dialog)
      return false
    },
    handleDragEnter(event) {
      if (this.uploadLoading) {
        return this.$message.warning('加载中，请稍后再试')
      }

      if (this.isAnyDialogOpen()) {
        return
      }

      const dt = event.dataTransfer
      if (dt && dt.types && (dt.types.includes('Files') || dt.types.includes('application/x-moz-file'))) {
        this.lastenterDragAreaNode = event.target
        this.isDragging = true
      }
    },

    handleDragLeave(event) {
      if (this.uploadLoading) {
        return
      }

      if (this.lastenterDragAreaNode === event.target) {
        this.isDragging = false
      }
    },

    handleDrop(event) {
      if (this.isAnyDialogOpen()) {
        return
      }
      event.preventDefault()
      if (this.uploadLoading) {
        return
      }

      this.isDragging = false
      this.lastenterDragAreaNode = null
      const files = event.dataTransfer.files
      if (files.length > 1) {
        this.$message.warning('只能拖拽一个文件，请重新操作。')
        return
      }

      if (files.length === 1) {
        this.handleUpload(files[0])
      }
    },

    handleUpload(file) {
      const FormDatas = new FormData()

      const getFileExtension = (filename) => {
        return /[.]/.exec(filename) ? filename.slice(filename.lastIndexOf('.') + 1).toLowerCase() : ''
      }
      if (!['xlsx', 'xls'].includes(getFileExtension(file.name))) {
        return this.$message({
          message: '只支持上传xlsx和xls类型的文件',
          type: 'warning'
        })
      }
      this.uploadLoading = true
      FormDatas.append('file', file)
      this.$message({
        message: '正在导入，请稍等...',
        type: 'info'
      })
      axios({
        method: 'post',
        url: '/api/import', // 替换为你的API接口地址
        data: FormDatas,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
        .then((res) => {
          // 处理上传成功的逻辑，例如显示上传成功的消息
          this.$message({
            message: '导入成功',
            type: 'success'
          })
        })
        .catch((error) => {
          // 处理上传失败的逻辑，例如显示上传失败的消息
          this.$alert(error?.data?.msg ?? error, '导入失败', {
            confirmButtonText: '确定',
            type: 'error'
          })
        })
        .finally(() => {
          this.uploadLoading = false
        })
    }
  }
}
</script>
<style lang="scss" scoped>
.fullScreenDragFileUpload {
  position: relative;
  background-color: #f0f2f5;
  padding: 30px;
  min-height: calc(100vh - 84px);
}
.drag-drop-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;

  /* 确保拖拽区域在最上层 */
  background-color: #edf2fa;
  /* 半透明背景 */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

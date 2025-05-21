/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const tableRouter = {
  path: '/file-upload',
  component: Layout,
  redirect: '/file-upload/full-screen-drag-file-upload',
  name: 'FileUpload',
  meta: {
    title: '文件上传',
    icon: 'table'
  },
  children: [
    {
      path: 'full-screen-drag-file-upload',
      component: () => import('@/views/file-upload/full-screen-drag-file-upload'),
      name: 'full-screen-drag',
      meta: { title: '全屏拖拽文件上传' }
    }
  ]
}
export default tableRouter

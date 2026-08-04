/* =========================================================
 * 导航配置 —— 加网站只改这个文件就够了
 * =========================================================
 *
 * 字段说明：
 *   title    页面大标题
 *   subtitle 副标题（可为空字符串 ""）
 *   theme    "auto" 跟随系统 | "light" 浅色 | "dark" 深色
 *
 * sites 是一个分组数组，每个分组有：
 *   group 分组名称（如「常用」「工作」）
 *   items 该分组下的网站列表，每个网站：
 *     name 网站名称（必填）
 *     url  链接地址（必填，建议带 https://）
 *     desc 一句话描述（可选）
 *     icon 图标地址（可选；不填则自动用网站 favicon，
 *          再不行就用名称首字）
 *
 * 想加一个新网站，直接复制一行 items 里的对象改掉就行。
 * ========================================================= */

// 注意：必须挂到 window 上，app.js 才能读到（顶层 const 不会自动成为全局属性）
window.SITE_CONFIG = {
  title: "我的导航",
  subtitle: "常用网站收藏 · 随时添加",
  theme: "auto", // auto | light | dark

  sites: [
    {
      group: "内网",
      items: [
        { name: "产品管理登录（内网）", url: "http://product.ycitus.cn/login", desc: "产品管理登录页" },
        { name: "key绑定重置（内网）", url: "http://product.ycitus.cn/admin/unbind-key", desc: "key绑定重置页" },
      ],
    },
    {
      group: "公网",
      items: [
        { name: "产品管理登录（公网）", url: "https://product.ycitus.top/login", desc: "产品管理登录页" },
        { name: "key绑定重置（公网）", url: "https://product.ycitus.top/admin/unbind-key", desc: "key绑定重置页" },
      ],
    },
  ],
};

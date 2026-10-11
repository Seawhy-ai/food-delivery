# 食客 · 外卖点餐演示应用

一个**零依赖、零构建**的单文件外卖点餐前端 Demo。双击 `index.html` 即可运行，也可直接部署到任意静态托管。

> 说明：本项目为纯前端演示，数据为本地静态模拟数据，没有后端接口，下单不会产生真实订单。

## 功能

| 模块 | 说明 |
|---|---|
| 餐厅列表 | 6 家餐厅 / 18 道菜品，卡片式布局 |
| 搜索 | 支持按**餐厅名、餐厅描述、菜品名、菜品描述**匹配；输入即搜（200ms 防抖），也可点按钮或按回车 |
| 筛选排序 | 按评分 / 距离 / 销量排序，**可与搜索条件叠加生效** |
| 餐厅详情 | 菜品加减、数量实时同步、选中态高亮、本店小计 |
| 购物车 | 按餐厅分组展示、单项移除、清空购物车、合计金额 |
| 结算 | 生成订单号、订单小票、实付金额、自动清空购物车 |
| 深色模式 | 跟随系统偏好，手动切换后记忆到 `localStorage` |
| 数据持久化 | 购物车写入 `localStorage`，刷新页面不丢失 |
| 响应式 | 桌面 / 平板 / 手机三档布局，移动端搜索框完整可用 |
| 可访问性 | 语义化标签、`aria-label`、键盘可达（Enter/Space 进店、ESC 关闭弹窗）、焦点样式 |

## 使用

```bash
# 方式一：直接打开
start index.html        # Windows
open index.html         # macOS

# 方式二：起一个本地服务（推荐，避免个别浏览器对 file:// 的限制）
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 部署到 GitHub Pages

本仓库是纯静态单文件，**不需要任何构建步骤**：

1. 仓库 **Settings → Pages**
2. **Source** 选择 `Deploy from a branch`
3. Branch 选 `main`，目录选 `/ (root)`
4. 保存后访问 `https://<用户名>.github.io/<仓库名>/`

因为 `index.html` 在仓库根目录且所有资源（CSS/JS）都是内联的，因此**不存在相对路径 / `base` 路径问题**，也不需要 SPA 的 `404.html` 重定向。

## 代码结构

单个 `index.html`，内部划分为：

```
<style>           设计令牌（CSS 变量）+ 组件样式，深色模式靠覆盖变量实现
<body>            语义化结构：header / main / 三个 dialog
<script>          IIFE 作用域，无全局污染
  ├─ 数据层        RESTAURANTS 静态数据 + ITEM_INDEX 菜品索引
  ├─ 状态层        state { keyword, filter, currentRestaurant, cart, lastOrder }
  ├─ 持久化         store() 封装 localStorage，隐私模式下静默降级
  ├─ 业务层        loadCart / addItem / removeItem / dropItem / clearCart / checkout
  ├─ 渲染层        renderGrid / syncMenuRows / renderRestaurantCart / renderCartModal
  └─ 事件层        统一事件委托 + ACTIONS 表 + 键盘事件
```

### 几个实现约定

- **事件委托而非内联 `onclick`**：所有交互通过 `data-action` 属性 + 单一 `click` 监听器分发，避免字符串拼接带来的引号断裂与注入风险。
- **所有插值文本经 `esc()` 转义**：就算以后把静态数据换成接口数据，也不会引入 XSS。
- **局部更新而非整块重绘**：加减菜品只更新数量文本与选中态（`syncMenuRows`），不重建整个菜单，避免焦点与滚动位置丢失。
- **`localStorage` 读取带校验**：`loadCart()` 会丢弃已不存在的菜品 id 和非法数量，脏数据不会把 UI 带崩。

## 测试

项目自身零依赖，测试也**不需要在项目内安装任何包**：

```bash
npx --yes -p jsdom node test/smoke.js
```

`test/smoke.js` 用 jsdom 真实加载 `index.html` 并模拟点击，覆盖 42 项断言：首屏渲染、搜索与筛选叠加、加减菜品、购物车分组与金额、结算流程、`localStorage` 脏数据清理、深色模式恢复、键盘可达性等。

## 已知限制

- 数据为硬编码的前端模拟数据，无后端、无鉴权、无真实下单。
- 没有用户账号、地址管理、订单历史、支付流程。
- 购物车允许跨餐厅下单（真实外卖平台通常限制单店下单）。
- 无构建流程与类型检查，靠 `node --check` + jsdom 冒烟测试保证正确性。

## License

MIT

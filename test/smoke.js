/**
 * index.html 冒烟测试：用 jsdom 真实加载页面并模拟交互
 *
 * 运行（无需在项目内安装依赖）：
 *   npx --yes -p jsdom node test/smoke.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

const results = [];
let failed = 0;

function ok(name, cond, extra) {
    results.push((cond ? '  PASS  ' : '  FAIL  ') + name + (extra ? '   -> ' + extra : ''));
    if (!cond) failed++;
}

const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => jsdomErrors.push(e.message));
vc.on('error', m => jsdomErrors.push('console.error: ' + m));

const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.com/food-delivery/',
    virtualConsole: vc,
    beforeParse(window) {
        // jsdom 未实现 confirm，打桩以便测试「清空购物车」
        window.confirm = () => true;
        // 预置脏数据：一个有效菜品 + 一个不存在的菜品 + 一个非法数量
        window.localStorage.setItem('foodapp.dark', '1');
        window.localStorage.setItem('foodapp.cart', JSON.stringify({ '4': 2, '999': 5, '7': 0 }));
    }
});

const { window } = dom;
const { document } = window;
const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---------- 1. 启动无报错 ----------
ok('页面加载无 JS 报错', jsdomErrors.length === 0, jsdomErrors.join(' | '));

// ---------- 2. 首屏渲染 ----------
ok('渲染出 6 张餐厅卡片', $$('.restaurant-card').length === 6, '实际 ' + $$('.restaurant-card').length);
ok('结果摘要已生成', $('resultSummary').textContent.indexOf('6 家餐厅') !== -1, $('resultSummary').textContent);

// ---------- 3. 主题：localStorage=1 时应恢复深色 ----------
ok('深色模式按存储恢复', document.body.classList.contains('dark'));
$('themeToggle').click();
ok('点击可切回浅色', !document.body.classList.contains('dark'));
$('themeToggle').click();

// ---------- 4. 持久化购物车：脏数据被清理，合法数据保留 ----------
ok('脏数据被剔除，仅保留合法菜品', $('cartCount').textContent === '2', 'cartCount=' + $('cartCount').textContent);
ok('footer 年份为动态当前年', $('year').textContent === String(new Date().getFullYear()), 'year=' + $('year').textContent);

// ---------- 5. 筛选 ----------
$$('[data-action="filter"]').find(b => b.dataset.filter === 'distance').click();
ok('按距离排序：最近的是汉堡快餐(0.9km)',
    document.querySelector('.restaurant-card .restaurant-name').textContent === '汉堡快餐',
    document.querySelector('.restaurant-card .restaurant-name').textContent);

// ---------- 6. 搜索（与筛选可叠加） ----------
const input = $('searchInput');
input.value = '寿司';
input.dispatchEvent(new window.Event('input', { bubbles: true }));
// 输入是 200ms 防抖，这里直接点搜索按钮走同步路径
$$('[data-action="search"]')[0].click();
ok('搜索「寿司」命中 1 家', $$('.restaurant-card').length === 1, '实际 ' + $$('.restaurant-card').length);
const hint = document.querySelector('.match-hint');
ok('命中卡片展示匹配菜品', hint !== null && hint.textContent.indexOf('握寿司套餐') !== -1,
    hint ? hint.textContent : '未渲染 .match-hint');
ok('搜索后仍保留排序筛选', $('resultSummary').textContent.indexOf('按距离排序') !== -1, $('resultSummary').textContent);

// 搜索无结果
input.value = '不存在的菜';
$$('[data-action="search"]')[0].click();
ok('无结果时显示空状态', document.querySelector('.empty-state') !== null);

// 清空搜索恢复全量
input.value = '';
$$('[data-action="search"]')[0].click();
ok('清空关键词后恢复 6 家', $$('.restaurant-card').length === 6, '实际 ' + $$('.restaurant-card').length);

// ---------- 7. 进入餐厅 + 加减数量 ----------
document.querySelector('[data-restaurant="1"]').click();
ok('餐厅弹窗已打开', $('restaurantModal').classList.contains('show'));
ok('弹窗标题正确', $('modalRestaurantName').textContent === '麻辣烫天堂', $('modalRestaurantName').textContent);
ok('菜品共 3 个', $$('#menuContainer .menu-item').length === 3);

const addBtn = () => document.querySelector('#menuContainer [data-action="add"][data-id="1"]');
const minusBtn = () => document.querySelector('#menuContainer [data-action="remove"][data-id="1"]');
const qtyOf = id => document.querySelector('#menuContainer [data-qty="' + id + '"]').textContent;

ok('未选菜品的「−」为禁用态', minusBtn().disabled === true);
addBtn().click();
addBtn().click();
ok('点两次「+」数量为 2', qtyOf('1') === '2', '实际 ' + qtyOf('1'));
ok('「−」已解禁', minusBtn().disabled === false);
ok('卡片头部计数同步为 4（2 预置 + 2 新增）', $('cartCount').textContent === '4', $('cartCount').textContent);
ok('本店小计正确 (28*2 = 56.00)', $('restaurantCartTotal').textContent === '¥56.00', $('restaurantCartTotal').textContent);
ok('选中的菜品行被高亮', document.querySelector('#menuContainer [data-row="1"]').classList.contains('selected'));

minusBtn().click();
ok('点「−」后数量回到 1', qtyOf('1') === '1', '实际 ' + qtyOf('1'));

// ---------- 8. 回归测试：重进餐厅数量不应归零（原 P1 bug） ----------
$$('[data-action="close-restaurant"]')[0].click();
document.querySelector('[data-restaurant="1"]').click();
ok('[回归] 重进餐厅数量显示仍为 1，不归零', qtyOf('1') === '1', '实际 ' + qtyOf('1'));
ok('[回归] 重进餐厅后「−」仍可用', minusBtn().disabled === false);

// ---------- 9. 购物车弹窗：按餐厅分组 + 合计 ----------
$('restaurantModal').classList.remove('show');
$$('[data-action="open-cart"]')[0].click();
ok('购物车弹窗已打开', $('cartModal').classList.contains('show'));
const groups = $$('.cart-group');
ok('购物车按餐厅分组（2 家）', groups.length === 2, '实际 ' + groups.length + ' 组');
// 期望：寿司工坊 综合生鱼片盖饭 58*2=116 + 麻辣烫天堂 经典麻辣烫套餐 28*1=28 = 144
ok('合计金额正确 (58*2 + 28 = 144.00)',
    $('fullCartView').querySelector('.cart-total .amount').textContent === '¥144.00',
    $('fullCartView').querySelector('.cart-total .amount').textContent);

// 移除单项
document.querySelector('[data-action="drop"][data-id="4"]').click();
ok('「移除」按钮生效，合计变为 ¥28.00',
    $('fullCartView').querySelector('.cart-total .amount').textContent === '¥28.00',
    $('fullCartView').querySelector('.cart-total .amount').textContent);

// ---------- 10. 结算 ----------
document.querySelector('#cartModal [data-action="checkout"]').click();
ok('结算后订单弹窗打开', $('orderModal').classList.contains('show'));
ok('订单号格式为 FD + 10 位', /^FD\d{10}$/.test($('orderNumber').textContent), $('orderNumber').textContent);
ok('订单小票列出菜品', $('orderReceipt').textContent.indexOf('经典麻辣烫套餐') !== -1);
ok('订单实付金额正确', $('orderReceipt').textContent.indexOf('¥28.00') !== -1, $('orderReceipt').textContent);
ok('结算后购物车已清空', $('cartCount').textContent === '0', $('cartCount').textContent);
ok('结算后 localStorage 已清空', window.localStorage.getItem('foodapp.cart') === '{}',
    window.localStorage.getItem('foodapp.cart'));

// ---------- 11. 空购物车不再弹 alert ----------
$$('[data-action="back-home"]')[0].click();
ok('返回首页后订单弹窗关闭', !$('orderModal').classList.contains('show'));
$$('[data-action="open-cart"]')[0].click();
ok('空购物车展示空状态而非 alert', $('fullCartView').querySelector('.empty-cart') !== null);
$$('[data-action="close-cart"]')[0].click();

// ---------- 12. 键盘可达性 ----------
ok('卡片可通过键盘聚焦', document.querySelector('.restaurant-card').getAttribute('tabindex') === '0');
ok('搜索框可通过回车触发（存在 Enter 分支）', html.indexOf("e.key === 'Enter'") !== -1);
ok('ESC 可关闭弹窗（存在 Escape 分支）', html.indexOf("e.key === 'Escape'") !== -1);

// ---------- 13. 安全检查 ----------
ok('无内联 onclick 处理器', !/\son\w+=/.test(html.replace(/<script>[\s\S]*?<\/script>/g, '')));
ok('所有插值文本均经 esc() 转义（不存在裸 ${ 模板）', !html.includes('${'));

console.log(results.join('\n'));
console.log('\n' + (failed === 0 ? '✅ 全部 ' + results.length + ' 项通过' : '❌ ' + failed + ' / ' + results.length + ' 项失败'));
process.exit(failed === 0 ? 0 : 1);

/**
 * 袋鼠外卖（美团风格单文件应用）冒烟测试
 *
 * 用 jsdom 真实加载 index.html，模拟点击/输入并断言结果。
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
// jsdom 的 hashchange 是异步任务，需要等一小段真实时间让路由完成重渲染
const tick = () => new Promise(r => setTimeout(r, 30));

const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => jsdomErrors.push(e.message));
vc.on('error', m => jsdomErrors.push('console.error: ' + m));

const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.com/',
    virtualConsole: vc,
    beforeParse(window) {
        window.confirm = () => true;               // jsdom 未实现，测试「更换商家」时需要
        window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
        window.scrollTo = () => {};
    }
});

const { window } = dom;
const { document } = window;
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));
const A = window.__app;
const hash = () => window.location.hash;

(async function run() {

// ============================================================
// 1. 启动
// ============================================================
ok('页面加载无 JS 报错', jsdomErrors.length === 0, jsdomErrors.join(' | '));
ok('默认路由为首页', A.parseHash().path === 'home', JSON.stringify(A.parseHash()));

// ============================================================
// 2. 首页结构（定位 → 搜索 → 金刚区 → 瓷片区 → 排序 → 商家列表）
// ============================================================
ok('顶部展示默认收货地址', ($('.loc-text') || {}).textContent.indexOf('天府大道') !== -1,
    ($('.loc-text') || {}).textContent);
ok('搜索入口带满减利益点文案', ($('.search-bar .ph') || {}).textContent.indexOf('满 30 减 5') !== -1);
ok('金刚区 10 个入口', $$('.kk-item').length === 10, '实际 ' + $$('.kk-item').length);
ok('瓷片区 3 个卡片', $$('.tile').length === 3, '实际 ' + $$('.tile').length);
ok('排序条 4 项', $$('.sort-item').length === 4, '实际 ' + $$('.sort-item').length);
ok('商家列表 8 家', $$('.shop-card').length === 8, '实际 ' + $$('.shop-card').length);
ok('底部 Tab 3 个且首页高亮', $$('.tab').length === 3 && $$('.tab')[0].classList.contains('on'));
ok('商家卡片含起送价与满减', ($('.shop-card') || {}).textContent.indexOf('起送') !== -1 &&
    ($('.shop-card') || {}).textContent.indexOf('满减') !== -1);

// ============================================================
// 3. 金刚区筛选 + 排序
// ============================================================
const kk = name => $$('.kk-item').find(b => b.textContent.indexOf(name) !== -1);
kk('甜品饮品').click();
ok('筛选「甜品饮品」命中 1 家', $$('.shop-card').length === 1, '实际 ' + $$('.shop-card').length);
ok('筛选后该项高亮', kk('甜品饮品').classList.contains('on'));
kk('全部分类').click();
ok('切回「全部分类」恢复 8 家', $$('.shop-card').length === 8, '实际 ' + $$('.shop-card').length);

$$('.sort-item').find(b => b.dataset.sort === 'distance').click();
ok('按距离排序：最近为 24h 便利超市(0.6km)',
    $('.shop-name').textContent === '24h 便利超市', $('.shop-name').textContent);
$$('.sort-item').find(b => b.dataset.sort === 'sales').click();
ok('按销量排序：最高为 24h 便利超市(5320)',
    $('.shop-name').textContent === '24h 便利超市', $('.shop-name').textContent);
$$('.sort-item').find(b => b.dataset.sort === 'rating').click();
ok('按评分排序：首位为 4.9 分商家', $('.stars .num').textContent === '4.9', $('.stars .num').textContent);

// ============================================================
// 4. 搜索页
// ============================================================
$('.search-bar').click();
await tick();
ok('点击搜索框跳转搜索页', hash() === '#/search', hash());
ok('展示热门搜索词', $$('.chip.hot').length > 0);
ok('展示猜你想吃', document.body.textContent.indexOf('猜你想吃') !== -1);

// 注意：每次 renderApp 都会替换 DOM，必须重新查询输入框
const setKw = v => { const node = $('#kw'); node.value = v; return node; };

setKw('寿司');
$('.search-go').click();
ok('搜索「寿司」命中 1 家', $$('.shop-card').length === 1, '实际 ' + $$('.shop-card').length);
ok('命中卡片展示匹配菜品', ($('.match-box .v') || {}).textContent.indexOf('握寿司套餐') !== -1,
    ($('.match-box .v') || {}).textContent);
ok('搜索历史已持久化',
    (window.localStorage.getItem('kd.searchHistory') || '').indexOf('寿司') !== -1,
    window.localStorage.getItem('kd.searchHistory'));

setKw('刺身');
$('.search-go').click();
ok('搜索「刺身」命中 1 家', $$('.shop-card').length === 1, '实际 ' + $$('.shop-card').length);

setKw('zzz不存在');
$('.search-go').click();
ok('无结果时展示空状态', $('.empty') !== null, document.body.innerHTML.slice(0, 120));

setKw('');
$('.search-go').click();
ok('清空关键词后回到热词/历史页', $$('.chip.hot').length > 0);
ok('搜索历史出现在页面上', document.body.textContent.indexOf('搜索历史') !== -1);
$('[data-action="clear-history"]').click();
ok('可清空搜索历史', A.state.searchHistory.length === 0);

$('.search-head .icon-btn').click();
await tick();
ok('返回首页', hash() === '#/home', hash());

// ============================================================
// 5. 商家页两栏布局
// ============================================================
$$('.shop-card').find(c => c.dataset.go === 'shop/1').click();
await tick();
ok('进入商家页', hash() === '#/shop/1', hash());
ok('两栏结构：分类栏 + 菜品区', $('.dish-cats') !== null && $('#dishList') !== null);
ok('左侧分类与菜品分类一致（4 类）', $$('.dish-cat').length === 4,
    $$('.dish-cat').map(b => b.dataset.catNav).join(','));
ok('菜品行已渲染（8 道）', $$('.dish').length === 8, '实际 ' + $$('.dish').length);
ok('底部购物车栏为空态', $('#cartBar').classList.contains('empty-state'));

// ============================================================
// 6. 加购 & 起送门槛
// ============================================================
const addBtn = id => document.querySelector('[data-dish-row="' + id + '"] [data-action="add-dish"]');
const qtyOf = id => (document.querySelector('[data-dish-row="' + id + '"] [data-qty]') || {}).textContent;

addBtn(101).click();   // 经典麻辣烫套餐 ¥28，该店起送 ¥20
ok('加购后数量为 1', qtyOf(101) === '1', qtyOf(101));
ok('出现「−」按钮', document.querySelector('[data-dish-row="101"] [data-action="minus-dish"]') !== null);
ok('底部栏金额 ¥28', ($('#cartBar .amt') || {}).textContent === '¥28', ($('#cartBar .amt') || {}).textContent);
ok('达标后结算按钮可用', $('#cartBar .checkout-btn').disabled === false);
ok('提示「已满起送」', ($('#cartBar .hint') || {}).textContent.indexOf('已满') !== -1,
    ($('#cartBar .hint') || {}).textContent);
ok('购物车角标为 1', ($('[data-cart-badge]') || {}).textContent === '1');

addBtn(106).click();   // 冰镇酸梅汤 ¥6
ok('第二件加入后金额 ¥34', ($('#cartBar .amt') || {}).textContent === '¥34',
    ($('#cartBar .amt') || {}).textContent);
ok('分类角标显示已选件数', ($('[data-cat-dot="热销"]') || {}).textContent === '1',
    ($('[data-cat-dot="热销"]') || {}).textContent);

document.querySelector('[data-dish-row="101"] [data-action="minus-dish"]').click();
ok('减号生效，金额回到 ¥6', ($('#cartBar .amt') || {}).textContent === '¥6',
    ($('#cartBar .amt') || {}).textContent);
ok('低于起送价后按钮禁用', $('#cartBar .checkout-btn').disabled === true);
ok('提示「差 X 起送」', ($('#cartBar .hint') || {}).textContent.indexOf('差') !== -1,
    ($('#cartBar .hint') || {}).textContent);

// 购物车抽屉
document.querySelector('.cart-ico-wrap').click();
ok('抽屉展开', $('#cartDrawer').classList.contains('open'));
ok('抽屉列出已选商品', $$('#cartDrawer .cart-row').length === 1, '实际 ' + $$('#cartDrawer .cart-row').length);
document.querySelector('.cart-ico-wrap').click();
ok('再次点击收起抽屉', !$('#cartDrawer').classList.contains('open'));

addBtn(101).click(); addBtn(101).click();
ok('继续加购后金额 ¥62', ($('#cartBar .amt') || {}).textContent === '¥62',
    ($('#cartBar .amt') || {}).textContent);

// ============================================================
// 7. 账单计算（满减 / 打包费 / 配送费 / 红包）
// ============================================================
const shop1 = A.shopById(1);
const dish101 = shop1.menu.find(d => d.id === 101);
const dish103 = shop1.menu.find(d => d.id === 103);
let b = A.bill(shop1, [{ dish: dish101, qty: 2 }], null);   // 28×2 = 56
ok('账单｜商品小计 56', b.subtotal === 56, JSON.stringify(b));
ok('账单｜打包费 1 元/件 × 2 = 2', b.packing === 2, 'packing=' + b.packing);
ok('账单｜配送费 3', b.delivery === 3, 'delivery=' + b.delivery);
ok('账单｜满减命中「满 30 减 5」', b.discount === 5, 'discount=' + b.discount);
ok('账单｜实付 56+2+3−5 = 56', b.total === 56, 'total=' + b.total);

b = A.bill(shop1, [{ dish: dish101, qty: 2 }], 'c1');       // 无门槛红包 5
ok('账单｜无门槛红包抵扣 5 → 51', b.couponCut === 5 && b.total === 51, JSON.stringify(b));
b = A.bill(shop1, [{ dish: dish101, qty: 2 }], 'c3');       // 满 50 减 12（56 满足）
ok('账单｜「满 50 减 12」命中 → 44', b.couponCut === 12 && b.total === 44, JSON.stringify(b));
b = A.bill(shop1, [{ dish: dish101, qty: 2 }], 'c5');       // 满 40 减 8
ok('账单｜「满 40 减 8」命中 → 48', b.couponCut === 8 && b.total === 48, JSON.stringify(b));
b = A.bill(shop1, [{ dish: dish101, qty: 2 }], 'c4');       // 满 100 减 30，56 不满足
ok('账单｜门槛不足的红包不抵扣', b.couponCut === 0, 'couponCut=' + b.couponCut);

b = A.bill(shop1, [{ dish: dish103, qty: 2 }], null);       // 68×2 = 136
ok('账单｜136 命中最高档「满 100 减 25」', b.discount === 25, 'discount=' + b.discount);

// ============================================================
// 8. 结算流程
// ============================================================
$('#cartBar .checkout-btn').click();
await tick();
ok('跳转结算页', A.parseHash().path === 'checkout', hash());
ok('结算页含费用明细三项', document.body.textContent.indexOf('打包费') !== -1 &&
    document.body.textContent.indexOf('配送费') !== -1 &&
    document.body.textContent.indexOf('满减优惠') !== -1);
ok('结算页展示收货地址', document.body.textContent.indexOf('天府大道') !== -1);

$$('[data-action="choose-coupon"]')[0].click();
ok('红包面板弹出', $('.sheet-mask') !== null);
ok('列出 5 张红包', $$('.coupon').length === 5, '实际 ' + $$('.coupon').length);
ok('门槛不满足的 1 张被禁用', $$('.coupon').filter(c => c.disabled).length === 1,
    '禁用 ' + $$('.coupon').filter(c => c.disabled).length + ' 张');
$('[data-pick-coupon="c3"]').click();
await tick();
ok('选完红包面板关闭', $('.sheet-mask') === null);
ok('结算页显示已选红包', document.body.textContent.indexOf('满 50 减 12') !== -1);

$$('[data-action="choose-time"]')[0].click();
ok('时间面板弹出', $('.sheet-mask') !== null);
$('[data-pick-time="11:30 - 12:00"]').click();
await tick();
ok('送达时间已更新', document.body.textContent.indexOf('11:30 - 12:00') !== -1);

const remark = $('[data-remark]');
remark.value = '不要香菜';
remark.dispatchEvent(new window.Event('input', { bubbles: true }));
ok('备注写入 state', A.state.remark === '不要香菜', A.state.remark);

ok('实付 = 62 + 3 + 3 − 12 − 12 = 44',
    ($('.submit-bar .amt') || {}).textContent === '¥44',
    ($('.submit-bar .amt') || {}).textContent);

$('[data-action="submit-order"]').click();
await tick();
ok('提交后跳转成功页', A.parseHash().path === 'success', hash());
ok('生成订单号', /^FD\d{10}$/.test(A.state.orders[0].id), A.state.orders[0].id);
ok('订单已持久化',
    (window.localStorage.getItem('kd.orders') || '').indexOf(A.state.orders[0].id) !== -1);
ok('下单后清空购物车', A.cartCount() === 0, 'count=' + A.cartCount());
ok('订单保留备注', A.state.orders[0].remark === '不要香菜', A.state.orders[0].remark);
ok('订单实付 44', A.state.orders[0].total === 44, 'total=' + A.state.orders[0].total);
ok('订单保留收货地址', (A.state.orders[0].address || '').indexOf('天府大道') !== -1);
ok('订单状态为「商家已接单」', A.state.orders[0].status === 1, 'status=' + A.state.orders[0].status);

// ============================================================
// 9. 订单中心
// ============================================================
$('[data-go="home"]').click();
await tick();
$$('.tab')[1].click();
await tick();
ok('切换到订单页', A.parseHash().path === 'orders', hash());
ok('共 3 单（2 条种子 + 1 条新单）', $$('.order-card').length === 3, '实际 ' + $$('.order-card').length);

$$('.status-tab').find(t => t.dataset.filter === 'active').click();
ok('「进行中」命中 1 单', $$('.order-card').length === 1, '实际 ' + $$('.order-card').length);
$$('.status-tab').find(t => t.dataset.filter === 'done').click();
ok('「已完成」命中 2 单', $$('.order-card').length === 2, '实际 ' + $$('.order-card').length);
$$('.status-tab').find(t => t.dataset.filter === 'all').click();
ok('「全部」恢复 3 单', $$('.order-card').length === 3, '实际 ' + $$('.order-card').length);

// 再来一单
$$('[data-action="reorder"]')[0].click();
await tick();
ok('「再来一单」回到商家页并加购', A.parseHash().path === 'shop' && A.cartCount() > 0,
    hash() + ' count=' + A.cartCount());

// 订单详情
A.state.cart = { shopId: null, items: {} };
window.location.hash = '#/order/' + A.state.orders[0].id;
await tick();
ok('详情页时间轴 4 个节点', $$('.tl-item').length === 4, '实际 ' + $$('.tl-item').length);
ok('时间轴标记当前节点', $$('.tl-item.now').length === 1, '实际 ' + $$('.tl-item.now').length);
ok('进行中订单展示骑手卡片', $('.rider') !== null);
ok('详情页展示备注', document.body.textContent.indexOf('不要香菜') !== -1);

// ============================================================
// 10. 单店下单约束
// ============================================================
window.location.hash = '#/shop/2';
await tick();
document.querySelector('[data-dish-row="201"] [data-action="add-dish"]').click();
ok('空车时可直接加购第二家店', A.state.cart.shopId === 2, 'shopId=' + A.state.cart.shopId);

window.location.hash = '#/shop/1';
await tick();
document.querySelector('[data-dish-row="101"] [data-action="add-dish"]').click();
await tick();
ok('跨店加购先弹确认框', $('.mask') !== null);
ok('确认框文案提到原商家', document.body.textContent.indexOf('寿司工坊') !== -1);
document.querySelector('[data-dlg="ok"]').click();
await tick();
ok('确认后切到新商家并清空旧购物车', A.state.cart.shopId === 1, 'shopId=' + A.state.cart.shopId);
ok('旧店商品已被清掉', Object.keys(A.state.cart.items).length === 1,
    JSON.stringify(A.state.cart.items));

// ============================================================
// 11. 地址管理
// ============================================================
A.state.cart = { shopId: null, items: {} };
window.location.hash = '#/address';
await tick();
ok('地址页列出 2 条', $$('.addr-card').length === 2, '实际 ' + $$('.addr-card').length);
ok('默认地址已标记', $$('.addr-card')[0].textContent.indexOf('默认') !== -1);

$$('[data-action="set-default"]')[1].click();
await tick();
ok('切换默认地址生效', A.state.addresses[1].isDefault === true && A.state.addresses[0].isDefault === false);
ok('地址已持久化', (window.localStorage.getItem('kd.addresses') || '').indexOf('春熙路') !== -1);

$('#a-name').value = '李四';
$('#a-phone').value = '123';
$('#a-detail').value = '某某路 1 号';
$('[data-action="add-address"]').click();
await tick();
ok('手机号非法时拒绝保存', A.state.addresses.length === 2, '实际 ' + A.state.addresses.length);
ok('弹出格式错误提示', ($$('.toast').pop() || {}).textContent === '手机号格式不正确',
    ($$('.toast').pop() || {}).textContent);

$('#a-phone').value = '13900001111';
$('[data-action="add-address"]').click();
await tick();
ok('合法信息可保存', A.state.addresses.length === 3, '实际 ' + A.state.addresses.length);
ok('手机号已脱敏存储', A.state.addresses[2].phone === '139****1111', A.state.addresses[2].phone);

$$('[data-action="del-address"]')[2].click();
await tick();
ok('删除地址会先弹确认框', $$('.mask').length === 1, '实际 ' + $$('.mask').length + ' 个');
$$('.mask').pop().querySelector('[data-dlg="ok"]').click();
await tick();
ok('删除地址生效', A.state.addresses.length === 2, '实际 ' + A.state.addresses.length);
ok('删除后已从 localStorage 移除',
    (window.localStorage.getItem('kd.addresses') || '').indexOf('139') === -1);

// ============================================================
// 12. 我的 / 主题
// ============================================================
window.location.hash = '#/profile';
await tick();
ok('个人中心展示红包入口', document.body.textContent.indexOf('红包') !== -1);
ok('个人中心有深色模式开关', $('.switch') !== null);
ok('初始为浅色模式', !document.body.classList.contains('dark'));

$('[data-action="toggle-theme"]').click();
await tick();
ok('切换深色模式生效', document.body.classList.contains('dark'));
ok('深色模式已持久化', window.localStorage.getItem('kd.dark') === '1');
ok('theme-color meta 已同步', $('meta[name="theme-color"]').getAttribute('content') === '#1C1C1E',
    $('meta[name="theme-color"]').getAttribute('content'));
$('[data-action="toggle-theme"]').click();
await tick();
ok('可切回浅色模式', !document.body.classList.contains('dark'));

// 重置演示数据
$('[data-action="reset-demo"]').click();
await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click();
await tick();
ok('重置后回到 2 条种子订单', A.state.orders.length === 2, '实际 ' + A.state.orders.length);
ok('重置后回到 2 条地址', A.state.addresses.length === 2, '实际 ' + A.state.addresses.length);
ok('重置后购物车为空', A.cartCount() === 0);

// ============================================================
// 13. 代码质量 / 安全
// ============================================================
const markupOnly = html.replace(/<script>[\s\S]*?<\/script>/g, '');
const inlineHandlers = markupOnly.match(/\son[a-z]+\s*=/gi);
ok('无内联事件处理器', inlineHandlers === null, inlineHandlers ? inlineHandlers.join(',') : '');
ok('定义并统一使用 esc() 转义', html.indexOf('const esc =') !== -1 && html.indexOf('ESC_MAP') !== -1);
ok('使用 data-action 事件委托', html.indexOf("closest('[data-action]')") !== -1);
ok('使用 hash 路由（支持浏览器后退）', html.indexOf("addEventListener('hashchange'") !== -1);
ok('实现单店下单约束', html.indexOf('更换商家') !== -1);
ok('使用美团黄作为主色令牌', html.indexOf('--mt-yellow: #FFD100') !== -1);
ok('未残留旧版购物车 key', html.indexOf("'foodapp.cart'") === -1);

console.log(results.join('\n'));
console.log('\n' + (failed === 0 ? '✅ 全部 ' + results.length + ' 项通过' : '❌ ' + failed + ' / ' + results.length + ' 项失败'));
process.exit(failed === 0 ? 0 : 1);

})();

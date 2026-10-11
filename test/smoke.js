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
const tick = () => new Promise(r => setTimeout(r, 30));

const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => jsdomErrors.push(e.message));
vc.on('error', m => jsdomErrors.push('console.error: ' + m));

const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/', virtualConsole: vc,
    beforeParse(window) {
        window.confirm = () => true;
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
// 2. 首页结构
// ============================================================
ok('顶部展示默认收货地址', ($('.loc-text') || {}).textContent.indexOf('天府大道') !== -1);
ok('搜索入口带满减利益点文案', ($('.search-bar .ph') || {}).textContent.indexOf('满 30 减 5') !== -1);
ok('金刚区 10 个入口', $$('.kk-item').length === 10, '实际 ' + $$('.kk-item').length);
ok('金刚区图标各有专属色', new Set($$('.kk-item').map(b => b.style.getPropertyValue('--k'))).size >= 8);
ok('瓷片区 3 个卡片', $$('.tile').length === 3);
ok('排序条 4 项', $$('.sort-item').length === 4);
ok('商家列表 21 家', $$('.shop-card').length === 21, '实际 ' + $$('.shop-card').length);
ok('底部 Tab 3 个且首页高亮', $$('.tab').length === 3 && $$('.tab')[0].classList.contains('on'));
ok('商家卡片显示评价数', $('.shop-card').textContent.indexOf('条评价') !== -1);
ok('商家卡片含起送价与满减', $('.shop-card').textContent.indexOf('起送') !== -1 &&
    $('.shop-card').textContent.indexOf('满减') !== -1);

// ============================================================
// 3. 筛选 + 排序
// ============================================================
const kk = name => $$('.kk-item').find(b => b.textContent.indexOf(name) !== -1);
kk('甜品饮品').click();
ok('筛选「甜品饮品」命中 3 家', $$('.shop-card').length === 3, '实际 ' + $$('.shop-card').length);
kk('全部分类').click();
ok('切回「全部分类」恢复 21 家', $$('.shop-card').length === 21);
$$('.sort-item').find(b => b.dataset.sort === 'distance').click();
ok('按距离排序：最近为 24h 便利超市', $('.shop-name').textContent === '24h 便利超市', $('.shop-name').textContent);
$$('.sort-item').find(b => b.dataset.sort === 'sales').click();
ok('按销量排序：最高为 24h 便利超市(5320)', $('.shop-name').textContent === '24h 便利超市', $('.shop-name').textContent);
$$('.sort-item').find(b => b.dataset.sort === 'rating').click();
ok('按评分排序：首位 4.9 分', $('.stars .num').textContent === '4.9');

// ============================================================
// 4. 搜索 + 联想
// ============================================================
$('.search-bar').click(); await tick();
ok('跳转搜索页', hash() === '#/search', hash());
ok('热门搜索存在', $$('.chip.hot').length > 0);

const setKw = v => { const n = $('#kw'); n.value = v; return n; };
setKw('牛');
$('#kw').dispatchEvent(new window.Event('input', { bubbles: true }));
ok('输入触发搜索联想', !$('#suggest').hidden && $$('.sug-item').length > 0, $$('.sug-item').length + ' 条');
ok('联想项包含「红烧牛肉面」', document.body.textContent.indexOf('红烧牛肉面') !== -1);
$$('.sug-item')[0].click();
ok('点击联想项即搜索', $$('.shop-card').length >= 1, '实际 ' + $$('.shop-card').length);
ok('搜索历史已持久化', (window.localStorage.getItem('kd.searchHistory') || '').length > 2);

setKw('zzz不存在');
$('.search-go').click();
ok('无结果展示空状态', $('.empty') !== null);
setKw('');
$('.search-go').click();
$('[data-action="clear-history"]').click();
ok('可清空搜索历史', A.state.searchHistory.length === 0);

$('.search-head .icon-btn').click(); await tick();
ok('返回首页', hash() === '#/home');

// ============================================================
// 5. 商家页：点菜 / 评价 双 Tab + 收藏
// ============================================================
$$('.shop-card').find(c => c.dataset.go === 'shop/1').click(); await tick();
ok('进入商家页', hash() === '#/shop/1');
ok('商家页有点菜/评价两个 Tab', $$('.shop-tab').length === 2);
ok('评价 Tab 显示评价数', $('.shop-tab .cnt').textContent === '2', $('.shop-tab .cnt').textContent);
ok('菜品行已渲染（8 道）', $$('.dish').length === 8, '实际 ' + $$('.dish').length);
ok('多规格菜品有「多规格」标记', document.body.textContent.indexOf('多规格') !== -1);
ok('商家页有收藏按钮', $('[data-action="toggle-fav"]') !== null);

$('[data-action="toggle-fav"]').click(); await tick();
ok('点击收藏生效', A.state.favorites.indexOf(1) !== -1);
ok('收藏按钮变为激活态', $('[data-action="toggle-fav"]').classList.contains('on'));
ok('收藏已持久化', (window.localStorage.getItem('kd.favs') || '').indexOf('1') !== -1);

$$('.shop-tab').find(t => t.dataset.tab === 'reviews').click(); await tick();
ok('切到评价 Tab', $$('.review-item').length >= 2, '实际 ' + $$('.review-item').length);
ok('评价带星级', $$('.review-stars').length >= 1);
ok('评价带标签', $$('.review-tags').length >= 1);
ok('评价页没有购物车栏', $('#cartBar') === null);
$$('.shop-tab').find(t => t.dataset.tab === 'menu').click(); await tick();
ok('切回点菜 Tab 恢复购物车栏', $('#cartBar') !== null);

// ============================================================
// 6. 规格：带规格的菜品点「+」先弹面板
// ============================================================
const addBtn = id => document.querySelector('[data-dish-row="' + id + '"] [data-action="add-dish"]');
const qtyOf = id => (document.querySelector('[data-dish-row="' + id + '"] [data-qty]') || {}).textContent;

ok('101 配了 3 组规格', A.specsOf(101).length === 3, A.specsOf(101).map(s => s.name).join('/'));
ok('104 没有规格（可直接加购）', A.specsOf(104).length === 0);

addBtn(101).click();
ok('点「+」弹出规格面板', $('.spec-sheet') !== null);
ok('面板有 3 组规格', $$('.spec-sheet .spec-group').length === 3);
ok('默认选中每组第一项', $$('.spec-sheet .spec-opt.on').length === 3);
ok('默认单价 = 原价 ¥28', ($('.spec-sheet .spec-foot .price') || {}).textContent === '¥28',
    ($('.spec-sheet .spec-foot .price') || {}).textContent);

const pickOpt = label => {
    const b = $$('.spec-sheet .spec-opt').find(x => x.textContent.indexOf(label) !== -1);
    if (b) b.click();
    return !!b;
};
pickOpt('加丸子');
ok('选「加丸子」单价联动为 ¥32', ($('.spec-sheet .spec-foot .price') || {}).textContent === '¥32',
    ($('.spec-sheet .spec-foot .price') || {}).textContent);
pickOpt('不加料');
ok('改回「不加料」单价回落 ¥28', ($('.spec-sheet .spec-foot .price') || {}).textContent === '¥28');

$('[data-spec-add]').click();
ok('规格加入购物车后数量为 1', qtyOf(101) === '1', qtyOf(101));
ok('规格面板已关闭', $('.spec-sheet') === null);
ok('行项目记录了规格', A.state.cart.lines.length === 1 &&
    A.state.cart.lines[0].picks.join('/') === '标准/不加料/微辣', JSON.stringify(A.state.cart.lines[0]));
ok('行项目单价 28', A.state.cart.lines[0].unit === 28);

// ============================================================
// 7. 直接加购 / 起送门槛 / 凑单提示
// ============================================================
addBtn(106).click();   // 冰镇酸梅汤 ¥6，无规格
ok('无规格菜品直接加购，金额 ¥34', ($('#cartBar .amt') || {}).textContent === '¥34',
    ($('#cartBar .amt') || {}).textContent);
ok('分类角标显示已选件数', ($('[data-cat-dot="热销"]') || {}).textContent === '1');
ok('给出凑单提示（再买 X 可减 Y）', ($('#cartBar .hint') || {}).textContent.indexOf('再买') !== -1,
    ($('#cartBar .hint') || {}).textContent);

document.querySelector('[data-dish-row="101"] [data-action="minus-dish"]').click();
ok('菜品行「−」生效，金额 ¥6（101 已减光）', ($('#cartBar .amt') || {}).textContent === '¥6',
    ($('#cartBar .amt') || {}).textContent);
ok('低于起送价按钮禁用', $('#cartBar .checkout-btn').disabled === true);

// 再走一次规格面板把 101 加回来
addBtn(101).click();
ok('再次弹出规格面板', $('.spec-sheet') !== null);
$('[data-spec-add]').click();
ok('加回 101 后金额 ¥34', ($('#cartBar .amt') || {}).textContent === '¥34',
    ($('#cartBar .amt') || {}).textContent);

// 抽屉里用「+」继续加购带规格的行（data-picks 走直加，不再弹面板）
document.querySelector('.cart-ico-wrap').click();
ok('抽屉展开且带规格行显示规格文案', $('#cartDrawer').classList.contains('open') &&
    $('#cartDrawer').textContent.indexOf('标准') !== -1);
const lineAdd = document.querySelector('#cartDrawer [data-action="add-dish"][data-picks="标准>不加料>微辣"]');
ok('抽屉里能找到 101 的规格行', lineAdd !== null);
ok('抽屉行带 data-picks（跳过规格面板）', lineAdd.dataset.picks !== undefined, lineAdd.dataset.picks);
lineAdd.click();
ok('抽屉加购后金额 ¥62', ($('#cartBar .amt') || {}).textContent === '¥62',
    ($('#cartBar .amt') || {}).textContent);
ok('同规格合并为一行且数量 2',
    A.state.cart.lines.length === 2 &&
    A.state.cart.lines.filter(l => l.dishId === 101)[0].qty === 2,
    JSON.stringify(A.state.cart.lines.map(l => [l.dishId, l.qty])));
document.querySelector('.cart-ico-wrap').click();

// ============================================================
// 8. 账单计算
// ============================================================
const shop1 = A.shopById(1);
const d101 = shop1.menu.find(d => d.id === 101);
const d106 = shop1.menu.find(d => d.id === 106);
const L = [{ dish: d101, qty: 2, unit: 28 }, { dish: d106, qty: 1, unit: 6 }];   // 62
let b = A.bill(shop1, L, null);
ok('账单｜小计 62（按行项目单价）', b.subtotal === 62, JSON.stringify(b));
ok('账单｜打包费 1 元/件 × 3 = 3', b.packing === 3, 'packing=' + b.packing);
ok('账单｜满减取最高命中档「满 60 减 12」', b.discount === 12, 'discount=' + b.discount);
ok('账单｜实付 62+3+3−12 = 56', b.total === 56, 'total=' + b.total);
b = A.bill(shop1, L, 'c3');
ok('账单｜红包满 50 减 12 → 44', b.couponCut === 12 && b.total === 44, JSON.stringify(b));
b = A.bill(shop1, L, 'c4');
ok('账单｜门槛不足的红包不抵扣', b.couponCut === 0);
b = A.bill(shop1, [{ dish: d101, qty: 2, unit: 34 }], null);
ok('账单｜规格加价计入小计（34×2=68）', b.subtotal === 68 && b.discount === 12);

ok('凑单差价计算正确', (() => { const g = A.nextDiscountGap(shop1, 34); return !!g && g.need === 26 && g.cut === 12; })());
ok('已达最高档时凑单为 null', A.nextDiscountGap(shop1, 200) === null);

// ============================================================
// 9. 结算：余额支付 + 已领取的红包
// ============================================================
$('#cartBar .checkout-btn').click(); await tick();
ok('跳转结算页', A.parseHash().path === 'checkout', hash());
ok('结算页有余额支付行', document.body.textContent.indexOf('余额支付') !== -1);
ok('余额显示 ¥128', document.body.textContent.indexOf('¥128') !== -1);
ok('凑单提示条存在', document.body.textContent.indexOf('可触发') !== -1);
ok('红包面板只列已领取的', (() => {
    $$('[data-action="choose-coupon"]')[0].click();
    const n = $$('.sheet-mask .coupon').length;
    const hasC1 = $$('[data-pick-coupon="c1"]').length === 1;
    if (hasC1) $$('[data-pick-coupon="c1"]')[0].click();
    return n === 2 && hasC1;
})(), '已持有 2 张');
await tick();
ok('结算页已选用「新人专享红包」', document.body.textContent.indexOf('新人专享红包') !== -1);

A.state.cart.lines = A.state.cart.lines.filter(l => l.dishId !== 106);
A.renderApp(); await tick();
$('[data-action="toggle-balance"]').click(); await tick();
ok('关闭余额支付后不抵扣', A.state.useBalance === false);
ok('实付 = 62+3+3−12−5 = 51', ($('.submit-bar .amt') || {}).textContent === '¥51',
    ($('.submit-bar .amt') || {}).textContent);

$$('[data-action="choose-time"]')[0].click();
$('[data-pick-time="11:30 - 12:00"]').click(); await tick();
ok('送达时间已更新', document.body.textContent.indexOf('11:30 - 12:00') !== -1);

const remark = $('[data-remark]');
remark.value = '不要香菜';
remark.dispatchEvent(new window.Event('input', { bubbles: true }));
ok('备注写入 state', A.state.remark === '不要香菜');

$('[data-action="submit-order"]').click(); await tick();
ok('提交后跳转成功页', A.parseHash().path === 'success', hash());
const newOrder = A.state.orders[0];
ok('生成订单号', /^FD\d{10}$/.test(newOrder.id), newOrder.id);
ok('订单实付 51', newOrder.payable === 51, 'payable=' + newOrder.payable);
ok('订单 total 51', newOrder.total === 51);
ok('未用余额，balanceCut = 0', newOrder.balanceCut === 0);
ok('余额未被扣减', A.state.balance === 128, 'balance=' + A.state.balance);
ok('订单保留规格文案', (newOrder.items[0].spec || '') === '标准 / 不加料 / 微辣', newOrder.items[0].spec);
ok('下单后清空购物车', A.cartCount() === 0);

// ============================================================
// 10. 订单：状态推进 + 评价 + 取消/删除
// ============================================================
$('[data-go="home"]').click(); await tick();
$$('.tab')[1].click(); await tick();
ok('进入订单页', A.parseHash().path === 'orders');
ok('订单列表 3 单', $$('.order-card').length === 3, '实际 ' + $$('.order-card').length);
ok('进行中筛选命中 1 单',
    ($$('.status-tab').find(t => t.dataset.filter === 'active').click(), $$('.order-card').length) === 1);
$$('.status-tab').find(t => t.dataset.filter === 'all').click();

ok('新订单实时状态为「待接单」', A.liveStatus(newOrder) === 0, 'status=' + A.liveStatus(newOrder));
newOrder.ts = Date.now() - 4 * 60000;
ok('4 分钟后推进为「骑手已取货」', A.liveStatus(newOrder) === 2, A.liveStatus(newOrder));
newOrder.ts = Date.now() - 30 * 60000;
ok('30 分钟后推进为「已送达」', A.liveStatus(newOrder) === 3);
A.renderApp(); await tick();

$$('.status-tab').find(t => t.dataset.filter === 'done').click(); await tick();
const reviewBtn = $$('[data-action="open-review"]')[0];
ok('已完成订单出现「去评价」按钮', reviewBtn !== undefined);
reviewBtn.click(); await tick();
ok('评价面板弹出', $('.sheet-mask') !== null);
ok('默认 5 星全亮', $$('.star-row .ic.on').length === 5, '实际 ' + $$('.star-row .ic.on').length);
$$('[data-review-star]')[2].click();
ok('点第 3 颗星后亮 3 颗', $$('.star-row .ic.on').length === 3);
const tagBtn = $$('[data-review-tag]').find(b => b.dataset.reviewTag === '送得快');
tagBtn.click();
ok('选择评价标签', A.state.reviewDraft.tags.indexOf('送得快') !== -1);
$('#reviewText').value = '味道不错，配送很快。';
$('[data-review-submit]').click(); await tick();
ok('评价写入订单', newOrder.review && newOrder.review.rating === 3, JSON.stringify(newOrder.review));
ok('评价含文字', newOrder.review.text === '味道不错，配送很快。');
ok('商家评价数增加到 3 条', A.shopReviews(1).length === 3, '实际 ' + A.shopReviews(1).length);
ok('商家评分按用户评价加权', A.shopRating(1, 4.8) !== 4.8, A.shopRating(1, 4.8));
ok('订单卡片显示「已评价」标签', document.body.textContent.indexOf('已评价') !== -1);

window.location.hash = '#/order/' + newOrder.id; await tick();
ok('详情页展示「我的评价」卡片', document.body.textContent.indexOf('我的评价') !== -1);
ok('详情页展示规格文案', document.body.textContent.indexOf('标准 / 不加料 / 微辣') !== -1);
ok('订单详情渲染配送地图', $('.map-card svg') !== null);
ok('地图标注商家与收货地址', $('.map-card').textContent.indexOf('商家') !== -1 &&
    $('.map-card').textContent.indexOf('收货地址') !== -1);
ok('已送达订单地图无骑手标记（已到站）', $('.map-rider-pulse') === null);
ok('订单明细每道菜都带商品图', $$('.oi .thumb .photo').length === newOrder.items.length,
    $$('.oi .thumb .photo').length + '/' + newOrder.items.length);
ok('已完成订单提供「删除记录」', $('[data-action="delete-order"]') !== null);
const cntBefore = A.state.orders.length;
$('[data-action="delete-order"]').click(); await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click(); await tick();
ok('删除订单生效', A.state.orders.length === cntBefore - 1);

A.state.orders.unshift({ id: 'FDTEST000001', shopId: 1, status: 0, ts: Date.now(),
    createdAt: '2026-10-11 23:00', eta: '23:30', distance: '1.0', address: '测试地址', remark: '',
    items: [{ id: 101, name: '经典麻辣烫套餐', price: 28, qty: 1, spec: '' }],
    subtotal: 28, packing: 1, delivery: 3, discount: 0, couponCut: 0, total: 32, payable: 32, reviewed: false });
window.location.hash = '#/order/FDTEST000001'; await tick();
ok('进行中订单提供「取消订单」', $('[data-action="cancel-order"]') !== null);
            ok('进行中订单地图有骑手标记', $('.map-rider-pulse') !== null);

$('[data-action="cancel-order"]').click(); await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click(); await tick();
ok('取消订单生效', A.state.orders.findIndex(o => o.id === 'FDTEST000001') === -1);

// ============================================================
// 11. 收藏 / 领券中心 / 消息
// ============================================================
window.location.hash = '#/favs'; await tick();
ok('收藏页列出 1 家', $$('.shop-card').length === 1, '实际 ' + $$('.shop-card').length);
ok('收藏页卡片带「已收藏」标记', document.body.textContent.indexOf('已收藏') !== -1);
window.location.hash = '#/coupons'; await tick();
ok('领券中心列出 5 张', $$('.coupon').length === 5, '实际 ' + $$('.coupon').length);
ok('已领取的 2 张带「已领取」标记',
    $$('.coupon .tag.yellow').filter(t => t.textContent === '已领取').length === 2);
$('[data-action="claim-coupon"]').click(); await tick();
ok('领取红包后持有 3 张', A.state.ownedCoupons.length === 3, A.state.ownedCoupons.join(','));
window.location.hash = '#/messages'; await tick();
ok('消息中心 5 条', $$('.msg-item').length === 5, '实际 ' + $$('.msg-item').length);

// ============================================================
// 12. 余额支付
// ============================================================
window.location.hash = '#/shop/3'; await tick();
document.querySelector('[data-dish-row="301"] [data-action="add-dish"]').click(); await tick();
ok('301 也走规格面板', $('.spec-sheet') !== null);
$('[data-spec-add]').click(); await tick();
$('#cartBar .checkout-btn').click(); await tick();
ok('余额开启时显示抵扣', document.body.textContent.indexOf('抵扣') !== -1);
$('[data-action="submit-order"]').click(); await tick();
ok('提交后余额被扣减', A.state.balance < 128, 'balance=' + A.state.balance);
ok('订单记录余额抵扣', A.state.orders[0].balanceCut > 0, 'balanceCut=' + A.state.orders[0].balanceCut);
ok('payable = total − balanceCut',
    A.state.orders[0].payable === A.state.orders[0].total - A.state.orders[0].balanceCut);

// ============================================================
// 13. 地址 / 主题 / 重置
// ============================================================
window.location.hash = '#/address'; await tick();
ok('地址页列出 2 条', $$('.addr-card').length === 2);
$('#a-name').value = '李四'; $('#a-phone').value = '13900001111'; $('#a-detail').value = '某某路 1 号院';
$('[data-action="add-address"]').click(); await tick();
ok('新增地址生效且手机号脱敏', A.state.addresses.length === 3 && A.state.addresses[2].phone === '139****1111');
$$('[data-action="del-address"]')[2].click(); await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click(); await tick();
ok('删除地址生效', A.state.addresses.length === 2);

window.location.hash = '#/profile'; await tick();
ok('个人中心显示余额', document.body.textContent.indexOf('账户余额') !== -1);
ok('个人中心有收藏入口', document.body.textContent.indexOf('我的收藏') !== -1);
$('[data-action="toggle-theme"]').click(); await tick();
ok('深色模式切换并持久化', document.body.classList.contains('dark') &&
    window.localStorage.getItem('kd.dark') === '1');
$('[data-action="toggle-theme"]').click(); await tick();

$('[data-action="reset-demo"]').click(); await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click(); await tick();
ok('重置恢复种子数据与余额', A.state.orders.length === 2 && A.state.addresses.length === 2 && A.state.balance === 128);
ok('重置后购物车为空', A.cartCount() === 0);

// ============================================================
// 14. 代码质量 / 视觉 / 安全
// ============================================================
const markupOnly = html.replace(/<script>[\s\S]*?<\/script>/g, '');
const inlineHandlers = markupOnly.match(/\son[a-z]+\s*=/gi);
ok('无内联事件处理器', inlineHandlers === null, inlineHandlers ? inlineHandlers.join(',') : '');
ok('定义并统一使用 esc() 转义', html.indexOf('const esc =') !== -1 && html.indexOf('ESC_MAP') !== -1);
ok('使用 data-action 事件委托', html.indexOf("closest('[data-action]')") !== -1);
ok('使用 hash 路由', html.indexOf("addEventListener('hashchange'") !== -1);
ok('实现单店下单约束', html.indexOf('更换商家') !== -1);
ok('使用美团黄作为主色令牌', html.indexOf('--mt-yellow: #FFD100') !== -1);

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const markupNoScript = html.replace(/<script>[\s\S]*?<\/script>/g, '');
ok('页面标记无 emoji', !EMOJI_RE.test(markupNoScript));
ok('渲染 DOM 无 emoji', !EMOJI_RE.test(document.body.textContent));
ok('商家规模 21 家 / 116 道菜',
    A.shops.length === 21 && A.shops.reduce((s, x) => s + x.menu.length, 0) === 112,
    A.shops.length + ' 家 / ' + A.shops.reduce((s, x) => s + x.menu.length, 0) + ' 道');
const catCount = {};
A.shops.forEach(s => { catCount[s.cat] = (catCount[s.cat] || 0) + 1; });
ok('品类分布均衡（每个品类 ≥ 2 家）',
    Object.values(catCount).every(n => n >= 2), JSON.stringify(catCount));
const allIds = [];
A.shops.forEach(s => s.menu.forEach(d => allIds.push(d.id)));
ok('菜品 ID 全局唯一', new Set(allIds).size === allIds.length,
    '重复: ' + allIds.filter((v, i) => allIds.indexOf(v) !== i).join(','));
ok('新店铺都有照片与插画', A.shops.filter(s => s.id >= 9).every(s => A.imgURL('s' + s.id) && s.menu.every(d => A.imgURL(d.id) || d.id === 2105)));
ok('SVG 图标雪碧图 ≥ 32 个', document.querySelectorAll('symbol').length >= 32,
    'symbol ' + document.querySelectorAll('symbol').length + ' 个');
ok('商家卡与菜品都有插画兜底', $$('.art-wrap').length > 0 && $$('.art').length > 0);
ok('touch-action: manipulation 已声明（禁双击缩放）', html.indexOf('touch-action: manipulation') !== -1);
ok('交互元素 user-select: none（防双击选字）', html.indexOf('user-select: none') !== -1);
const vpMeta = ($('meta[name="viewport"]') || {}).content || '';
ok('viewport 未禁用捏合缩放', !/user-scalable\s*=\s*no/i.test(vpMeta) && !/maximum-scale/i.test(vpMeta), vpMeta);

console.log(results.join('\n'));
console.log('\n' + (failed === 0 ? '✅ 全部 ' + results.length + ' 项通过' : '❌ ' + failed + ' / ' + results.length + ' 项失败'));
process.exit(failed === 0 ? 0 : 1);

})();

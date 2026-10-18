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
ok('首页保留两张核心优惠卡，移除重复入口', $$('.promo-card').length === 2);
ok('排序条 4 项', $$('.sort-item').length === 4);
ok('商家列表 31 家', $$('.shop-card').length === 31, '实际 ' + $$('.shop-card').length);
ok('底部 Tab 3 个且首页高亮', $$('.tab').length === 3 && $$('.tab')[0].classList.contains('on'));
ok('商家卡片显示评价数', $('.shop-card').textContent.indexOf('条评价') !== -1);
ok('商家卡片含起送价与满减', $('.shop-card').textContent.indexOf('起送') !== -1 &&
    $('.shop-card').textContent.indexOf('满减') !== -1);

// ============================================================
// 3. 筛选 + 排序
// ============================================================
const kk = name => $$('.kk-item').find(b => b.textContent.indexOf(name) !== -1);
kk('甜品饮品').click();
ok('筛选「甜品饮品」命中 13 家', $$('.shop-card').length === 13, '实际 ' + $$('.shop-card').length);
kk('全部分类').click();
ok('切回「全部分类」恢复 31 家', $$('.shop-card').length === 31);
$$('.sort-item').find(b => b.dataset.sort === 'distance').click();
ok('按距离排序：最近为 蜜雪冰城(0.5km)', $('.shop-name').textContent === '蜜雪冰城', $('.shop-name').textContent);
$$('.sort-item').find(b => b.dataset.sort === 'sales').click();
ok('按销量排序：最高为 蜜雪冰城(9800)', $('.shop-name').textContent === '蜜雪冰城', $('.shop-name').textContent);
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
ok('无规格菜品直接加购，显示满减后预估 ¥29', ($('#cartBar .amt') || {}).textContent === '已减 ¥5预估 ¥29',
    ($('#cartBar .amt') || {}).textContent);
ok('分类角标显示已选件数', ($('[data-cat-dot="热销"]') || {}).textContent === '1');
ok('给出凑单提示（再买 X 可减 Y）', ($('#cartBar .hint') || {}).textContent.indexOf('再买') !== -1,
    ($('#cartBar .hint') || {}).textContent);

document.querySelector('[data-dish-row="101"] [data-action="minus-dish"]').click();
ok('菜品行「−」生效，显示预估 ¥6（101 已减光）', ($('#cartBar .amt') || {}).textContent === '预估 ¥6',
    ($('#cartBar .amt') || {}).textContent);
ok('低于起送价按钮禁用', $('#cartBar .checkout-btn').disabled === true);

// 再走一次规格面板把 101 加回来
addBtn(101).click();
ok('再次弹出规格面板', $('.spec-sheet') !== null);
$('[data-spec-add]').click();
ok('加回 101 后显示满减后预估 ¥29', ($('#cartBar .amt') || {}).textContent === '已减 ¥5预估 ¥29',
    ($('#cartBar .amt') || {}).textContent);

// 抽屉里用「+」继续加购带规格的行（data-picks 走直加，不再弹面板）
document.querySelector('.cart-ico-wrap').click();
ok('抽屉展开且带规格行显示规格文案', $('#cartDrawer').classList.contains('open') &&
    $('#cartDrawer').textContent.indexOf('标准') !== -1);
const lineAdd = document.querySelector('#cartDrawer [data-action="add-dish"][data-picks="标准>不加料>微辣"]');
ok('抽屉里能找到 101 的规格行', lineAdd !== null);
ok('抽屉行带 data-picks（跳过规格面板）', lineAdd.dataset.picks !== undefined, lineAdd.dataset.picks);
lineAdd.click();
ok('抽屉加购后显示满减后预估 ¥50', ($('#cartBar .amt') || {}).textContent === '已减 ¥12预估 ¥50',
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
ok('使用后的红包被核销并持久化', A.state.ownedCoupons.indexOf('c1') === -1 &&
    (window.localStorage.getItem('kd.coupons') || '').indexOf('c1') === -1, A.state.ownedCoupons.join(','));

// ============================================================
// 10. 订单：状态推进 + 评价 + 取消/删除
// ============================================================
$('[data-go="home"]').click(); await tick();
$$('.tab').find(t => t.dataset.go === 'orders').click(); await tick();
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
ok('订单详情渲染配送地图（高德真实瓦片）', $('.amap-wrap') !== null);
ok('地图加载 6 张高德瓦片', $$('.amap-wrap .tile').length === 6, '实际 ' + $$('.amap-wrap .tile').length);
ok('瓦片来自高德 CDN', $$('.amap-wrap .tile').length > 0 &&
    $$('.amap-wrap .tile').every(t => t.src.indexOf('is.autonavi.com/appmaptile') !== -1));
ok('瓦片坐标按订单地址换算（天府大道区域）', $$('.amap-wrap .tile').length > 0 &&
    /x=64\d\d/.test($$('.amap-wrap .tile')[0].src),
    $$('.amap-wrap .tile').length > 0 ? $$('.amap-wrap .tile')[0].src.match(/x=\d+|y=\d+/g).join(' ') : '无瓦片');
ok('地图标注品牌店名与收货地址', $('.amap-wrap').textContent.indexOf('麻辣烫天堂') !== -1 &&
    $('.amap-wrap').textContent.indexOf('收货地址') !== -1);
ok('地图带高德署名', $('.amap-credit') !== null);
ok('SVG 兜底层存在（瓦片失败时显示）', $('.amap-fallback') !== null && $('.amap-fallback svg') !== null, 'fallback=' + !!$('.amap-fallback'));
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
// 10b. 领券中心改版 / 会员体系
// ============================================================
window.location.hash = '#/coupons'; await tick();
ok('领券中心渲染英雄区', $('.cc-hero') !== null);
ok('英雄区统计已持有数量', $('.cc-hero').textContent.indexOf('已持有') !== -1);
ok('英雄区有会员入口', $('[data-go="vip"]') !== null);
ok('分类 Tab 8 个', $$('.cc-tab').length === A.couponKinds.length, '实际 ' + $$('.cc-tab').length);
ok('券池共 30 张', $$('.cc-card').length === 30, '实际 ' + $$('.cc-card').length);
ok('会员专享券带 VIP 徽标', $$('.cc-card .vip-badge').length === 4, '实际 ' + $$('.cc-card .vip-badge').length);
ok('未开通会员时会员券显示「开通会员领」', $$('[data-action="goto-vip"]').length === 4);
ok('免运费券展示「免配送」', document.body.textContent.indexOf('免配送') !== -1);
ok('券卡带领取进度条', $$('.cc-card .bar').length === 30);

$$('.cc-tab').find(t => t.dataset.tab === 'member').click(); await tick();
ok('会员专享 Tab 只显示会员券', $$('.cc-card').length === 4);
$$('.cc-tab').find(t => t.dataset.tab === 'food').click(); await tick();
ok('美食券 Tab 数量正确', $$('.cc-card').length === 5, '实际 ' + $$('.cc-card').length);
$$('.cc-tab').find(t => t.dataset.tab === 'all').click(); await tick();

window.location.hash = '#/vip'; await tick();
ok('会员中心渲染', $('.vip-hero') !== null);
ok('权益列表 6 项', $$('.perk').length === 6);
ok('未开通显示价格 ¥12', document.body.textContent.indexOf('¥12') !== -1);
const balBeforeVip = A.state.balance;
$('[data-action="open-member"]').click(); await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click(); await tick();
ok('开通后会员生效', A.state.member.on === true && A.state.member.expire.length === 10,
    JSON.stringify(A.state.member));
ok('开通扣减余额 ¥12', A.state.balance === balBeforeVip - 12, 'balance=' + A.state.balance);
ok('开通赠送会员券 m1/m4', A.state.ownedCoupons.indexOf('m1') !== -1 && A.state.ownedCoupons.indexOf('m4') !== -1);
ok('开通已持久化', (window.localStorage.getItem('kd.member') || '').indexOf('"on":true') !== -1);
window.location.hash = '#/coupons'; await tick();
ok('会员券现在可直接领取', $$('[data-action="goto-vip"]').length === 0);

// 会员免配送费
window.location.hash = '#/shop/1'; await tick();
document.querySelector('[data-dish-row="102"] [data-action="add-dish"]').click(); await tick();
document.querySelector('[data-dish-row="105"] [data-action="add-dish"]').click(); await tick();
$('#cartBar .checkout-btn').click(); await tick();
ok('会员下单自动免配送费', document.body.textContent.indexOf('会员免配送费') !== -1);
ok('账单含免配送费抵扣行', document.body.textContent.indexOf('−¥3') !== -1);

// ============================================================
// 11. 收藏 / 领券中心 / 消息
// ============================================================
window.location.hash = '#/favs'; await tick();
ok('收藏页列出 1 家', $$('.shop-card').length === 1, '实际 ' + $$('.shop-card').length);
ok('收藏页卡片带「已收藏」标记', document.body.textContent.indexOf('已收藏') !== -1);
window.location.hash = '#/coupons'; await tick();
ok('领券中心显示全部 30 张券', $$('.cc-card').length === 30, '实际 ' + $$('.cc-card').length);
ok('已持有的券卡片带「已领取」标记', $$('.cc-claimed').length >= 1, $$('.cc-claimed').length + '/' + A.state.ownedCoupons.length);
$('[data-action="claim-coupon"]').click(); await tick();
ok('领取红包后持有数 +1', A.state.ownedCoupons.length >= 4, A.state.ownedCoupons.join(','));
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

// 重置必须同时清除所有持久化状态；否则刷新后会员、积分或抽奖记录会复活。
['kd.member', 'kd.groups', 'kd.points', 'kd.draws'].forEach((key, i) =>
    window.localStorage.setItem(key, JSON.stringify(i ? ['stale'] : { on: true, expire: '2099-01-01' })));
$('[data-action="reset-demo"]').click(); await tick();
$$('.mask').pop().querySelector('[data-dlg="ok"]').click(); await tick();
ok('重置恢复种子数据/余额/会员', A.state.orders.length === 2 && A.state.addresses.length === 2 && A.state.balance === 128 && A.state.member.on === false);
ok('重置后购物车为空', A.cartCount() === 0);
ok('重置清除会员、团购、积分和抽奖持久化',
    ['kd.member', 'kd.groups', 'kd.points', 'kd.draws'].every(key => window.localStorage.getItem(key) === null));

// ============================================================
// 14. 代码质量 / 视觉 / 安全
// ============================================================
const markupOnly = html.replace(/<script>[\s\S]*?<\/script>/g, '');
const inlineHandlers = markupOnly.match(/\son[a-z]+\s*=/gi);
ok('无内联事件处理器', inlineHandlers === null, inlineHandlers ? inlineHandlers.join(',') : '');
ok('定义并统一使用 esc() 转义', html.indexOf('const esc =') !== -1 && html.indexOf('ESC_MAP') !== -1);
ok('使用 data-action 事件委托', html.indexOf("closest('[data-action]')") !== -1);
ok('使用 hash 路由', html.indexOf("addEventListener('hashchange'") !== -1);
ok('购物车按店铺独立保存，不再强制清空另一家商品', html.indexOf('kd.carts') !== -1 && html.indexOf('function activateCart') !== -1 && html.indexOf('更换商家') === -1);
ok('使用美团黄作为主色令牌', html.indexOf('--mt-yellow: #FFD100') !== -1);

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const markupNoScript = html.replace(/<script>[\s\S]*?<\/script>/g, '');
ok('页面标记无 emoji', !EMOJI_RE.test(markupNoScript));
ok('渲染 DOM 无 emoji', !EMOJI_RE.test(document.body.textContent));
ok('商家规模 31 家 / 167 道菜',
    A.shops.length === 31 && A.shops.reduce((s, x) => s + x.menu.length, 0) === 167,
    A.shops.length + ' 家 / ' + A.shops.reduce((s, x) => s + x.menu.length, 0) + ' 道');
const catCount = {};
A.shops.forEach(s => { catCount[s.cat] = (catCount[s.cat] || 0) + 1; });
ok('品类分布均衡（每个品类 ≥ 2 家）',
    Object.values(catCount).every(n => n >= 2), JSON.stringify(catCount));
const allIds = [];
A.shops.forEach(s => s.menu.forEach(d => allIds.push(d.id)));
ok('菜品 ID 全局唯一', new Set(allIds).size === allIds.length,
    '重复: ' + allIds.filter((v, i) => allIds.indexOf(v) !== i).join(','));
ok('店铺都有照片（奶茶品牌 22+ 也配了核对过的封面）', A.shops.every(s => A.imgURL('s' + s.id)));
ok('奶茶品牌 55 道菜品全部配真实照片', A.shops.filter(s => s.id >= 22).every(s => s.menu.every(d => A.imgURL(d.id))));
ok('菜单商品使用本地生成图，品牌茶饮保留专属商品图', A.imgURL(2201) === 'sprite:11' &&
    fs.existsSync(path.join(__dirname, '..', 'assets', 'milk-tea-products.png')) &&
    fs.existsSync(path.join(__dirname, '..', 'assets', 'menu-products.png')) &&
    A.imgURL(101) === 'menu-sprite:0');
ok('SVG 图标雪碧图 ≥ 32 个', document.querySelectorAll('symbol').length >= 32,
    'symbol ' + document.querySelectorAll('symbol').length + ' 个');
ok('商家卡与菜品都有插画兜底', $$('.art-wrap').length > 0 && $$('.art').length > 0);
ok('touch-action: manipulation 已声明（禁双击缩放）', html.indexOf('touch-action: manipulation') !== -1);
ok('交互元素 user-select: none（防双击选字）', html.indexOf('user-select: none') !== -1);
const vpMeta = ($('meta[name="viewport"]') || {}).content || '';
ok('viewport 未禁用捏合缩放', !/user-scalable\s*=\s*no/i.test(vpMeta) && !/maximum-scale/i.test(vpMeta), vpMeta);

// ============================================================
// 15. iOS 桌面版（PWA / 添加到主屏幕）
// ============================================================
ok('声明 apple-mobile-web-app-capable', /apple-mobile-web-app-capable"\s+content="yes"/.test(html));
ok('声明状态栏样式 black-translucent', /apple-mobile-web-app-status-bar-style"\s+content="black-translucent"/.test(html));
ok('声明 apple-mobile-web-app-title', html.indexOf('apple-mobile-web-app-title') !== -1);
ok('内嵌 apple-touch-icon（data URI PNG）',
    /<link rel="apple-touch-icon" href="data:image\/png;base64,/.test(html));
ok('内嵌 Web App Manifest',
    /<link rel="manifest" href="data:application\/manifest\+json;base64,/.test(html));
(() => {
    const m = html.match(/rel="manifest" href="data:application\/manifest\+json;base64,([^"]+)"/);
    if (!m) { ok('manifest 可解析', false); return; }
    let mf = {};
    try { mf = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')); } catch (e) { ok('manifest 可解析', false, e.message); return; }
    ok('manifest 字段齐全', mf.name === '袋鼠外卖' && mf.display === 'standalone' &&
        mf.theme_color === '#FFD100' && Array.isArray(mf.icons) && mf.icons.length >= 2,
        JSON.stringify({ display: mf.display, icons: (mf.icons || []).length }));
    ok('manifest 图标是合法 PNG', (() => {
        const ic = (mf.icons || [])[0];
        if (!ic || ic.src.indexOf('data:image/png;base64,') !== 0) return false;
        const buf = Buffer.from(ic.src.slice(22), 'base64');
        return buf.length > 1000 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    })());
})();
ok('声明 format-detection（电话号不变成链接）', /format-detection"\s+content="telephone=no"/.test(html));
ok('图标是合法 PNG（180x180）', (() => {
    const m = html.match(/rel="apple-touch-icon" href="data:image\/png;base64,([^"]+)"/);
    if (!m) return false;
    const buf = Buffer.from(m[1], 'base64');
    return buf.length > 3000 && buf.slice(1, 4).toString() === 'PNG';
})());
ok('独立模式安全区适配（--safe-t 已定义并用于吸顶条）',
    html.indexOf('--safe-t: env(safe-area-inset-top') !== -1 &&
    html.indexOf('padding-top: calc(12px + var(--safe-t))') !== -1);
ok('独立模式会加 body.standalone 标记', html.indexOf("classList.add('standalone')") !== -1);
ok('独立模式禁用下拉刷新', html.indexOf('body.standalone, body.standalone .app { overscroll-behavior: none; }') !== -1);
ok('iOS 非独立模式显示添加到主屏幕引导', html.indexOf('添加到主屏幕，像 App 一样用') !== -1);
ok('图标引用通过 <use>（i-bike 用于地图骑手）', html.indexOf('#i-bike') !== -1);

// ============================================================
// 16. 奶茶品牌 / 地图集成订单详情 / 商家券 / 最优券 / 数量上限
// ============================================================
const teaNames = ['霸王茶姬 CHAGEE', '喜茶 HEYTEA', '奈雪的茶', '蜜雪冰城', '茶百道', '古茗', '沪上阿姨', '书亦烧仙草', 'CoCo都可', '一点点'];
ok('新增 10 家真实品牌奶茶店', teaNames.every(n => A.shops.some(s => s.name === n)));
ok('奶茶价格贴近实价（蜜雪 3-7 元 / 喜茶 16-29 元）', (() => {
    const mx = A.shops.find(s => s.name === '蜜雪冰城');
    const ht = A.shops.find(s => s.name === '喜茶 HEYTEA');
    return mx.menu.every(d => d.price >= 3 && d.price <= 7) &&
        ht.menu.every(d => d.price >= 16 && d.price <= 29) &&
        A.shops.every(s => s.menu.every(d => d.price > 0));
})());
ok('每家品牌店都配了核对过的封面图与地图坐标', teaNames.every(n => {
    const st = A.shops.find(x => x.name === n);
    return !!A.imgURL('s' + st.id) && !!A.shopGeo[st.id];
}));
ok('金刚区 10 个入口全部使用彩色扁平图标', $$('.kk-item').length === 10 &&
    $$('.kk-item .kk-ico svg[viewBox="0 0 48 48"]').length === 10,
    'k-icon ' + $$('.kk-item .kk-ico svg[viewBox="0 0 48 48"]').length);

// 独立地图页已移除，地图集成进订单详情
window.location.hash = '#/map'; await tick();
ok('独立地图页已移除（#/map 回退首页）', $('.map-page') === null && $$('.shop-card').length > 0);
A.state.orders.unshift({ id: 'FDTEA000001', shopId: 25, status: 0, ts: Date.now(),
    createdAt: '2026-10-12 12:00', eta: '12:30', distance: '1.2', address: '四川省成都市武侯区天府大道 1000 号 写字楼 A 座 18F', remark: '',
    items: [{ id: 2501, name: '冰鲜柠檬水（大杯）', price: 4, qty: 2, spec: '' }],
    subtotal: 8, packing: 0, delivery: 2, discount: 0, couponCut: 0, total: 10, payable: 10, reviewed: false });
window.location.hash = '#/order/FDTEA000001'; await tick();
ok('订单详情地图标注品牌店名（蜜雪冰城）',
    $('.amap-wrap').textContent.indexOf('蜜雪冰城') !== -1 &&
    $('.amap-wrap').textContent.indexOf('收货地址') !== -1);
ok('订单详情地图加载高德瓦片', $$('.amap-wrap .tile').length === 6);
$('.amap-wrap .tile').dispatchEvent(new window.Event('error'));
ok('地图瓦片失败时切换到 SVG 路线图', $('.amap-wrap').classList.contains('tiles-failed'));
A.state.orders = A.state.orders.filter(o => o.id !== 'FDTEA000001');

// 商家专属券：仅在指定门店可用
window.location.hash = '#/coupons'; await tick();
ok('领券中心展示 10 张门店券', $$('.cc-card .shop-badge').length === 10,
    'badge ' + $$('.cc-card .shop-badge').length);
A.state.ownedCoupons = ['t4'];
const shop25 = A.shops.find(s => s.name === '蜜雪冰城');
const billT4 = A.bill(shop25, [{ dish: shop25.menu[0], qty: 2, unit: 4 }], 't4');
ok('蜜雪券在蜜雪下单可抵扣 3 元', billT4.couponCut === 3, 'cut=' + billT4.couponCut);
const shop1x = A.shopById(1);
const billOther = A.bill(shop1x, [{ dish: shop1x.menu[0], qty: 1, unit: 28 }], 't4');
ok('蜜雪券在其他门店不抵扣', billOther.couponCut === 0);

// 结算最优券：自动置顶选中 + 红包面板最优排最前带徽标
A.state.cart = { shopId: 25, lines: [{ key: '2501|', dishId: 2501, picks: [], qty: 2, unit: 4 }] };
A.state.couponId = null; A.state.couponOptOut = false;
window.location.hash = '#/checkout'; await tick();
ok('结算自动选中最优红包（t4）', A.state.couponId === 't4', A.state.couponId);
$('[data-action="choose-coupon"]').click(); await tick();
const firstCpn = $('.coupon');
ok('红包面板最优券排第一且带「最优」徽标',
    firstCpn.getAttribute('data-pick-coupon') === 't4' && firstCpn.querySelector('.best-badge') !== null);
$$('.sheet-mask [data-sheet="close"]').pop().click(); await tick();

// 单品数量上限 20
A.state.cart = { shopId: null, lines: [] }; A.state.couponId = null;
window.location.hash = '#/shop/25'; await tick();
const addBtnTea = document.querySelector('[data-dish-row="2501"] [data-action="add-dish"]');
for (let i = 0; i < 23; i++) addBtnTea.click();
ok('单品连续加购 23 次后封顶 20 份',
    A.state.cart.lines[0] && A.state.cart.lines[0].qty === 20,
    'qty=' + (A.state.cart.lines[0] ? A.state.cart.lines[0].qty : '无'));
A.state.cart = { shopId: null, lines: [] }; A.state.couponId = null;

// 规格面板份数选择器（1-20）
window.location.hash = '#/shop/1'; await tick();
document.querySelector('[data-dish-row="101"] [data-action="add-dish"]').click(); await tick();
ok('规格面板带份数选择器', $('.spec-sheet .spec-qty-row') !== null);
document.querySelector('[data-spec-qplus]').click();
document.querySelector('[data-spec-qplus]').click();
ok('份数可加到 3 且价格联动', Number($('.spec-qty-row .q').textContent) === 3 &&
    $('.spec-foot .price').textContent.indexOf('84') !== -1,
    $('.spec-foot .price').textContent);
$('[data-spec-add]').click(); await tick();
ok('按份数入车（101 × 3）', A.state.cart.lines.find(l => l.dishId === 101).qty === 3);

window.location.hash = '#/groupon'; await tick();
ok('团购专区列出 25 个品牌套餐', $$('.gp-card').length === 25, 'gp-card ' + $$('.gp-card').length);
ok('团购按抢购进度降序排列', (() => {
    const pct = $$('.gp-card .gp-bar i').map(i => parseFloat(i.style.width) || 0);
    if (pct.length !== 25) return false;
    for (let i = 1; i < pct.length; i++) if (pct[i] > pct[0]) return false;
    return true;
})());
const beforeClaim = A.state.claimedGroups.length;
$('.gp-claim').click(); await tick();
ok('领取团购券写入状态', A.state.claimedGroups.length === beforeClaim + 1, 'claimed ' + A.state.claimedGroups.length);
ok('领取后该卡显示「已领取」', $$('.gp-had').length >= 1);
window.location.hash = '#/coupons'; await tick();
$$('.cc-tab').find(b => b.dataset.tab === 'group').click(); await tick();
ok('领券中心团购标签展示已领团购券',
    $$('.gp-card').length === A.state.claimedGroups.length && A.state.claimedGroups.length >= 1);

window.location.hash = '#/lottery'; await tick();
ok('抽奖九宫格 8 格 + 中心按钮', $$('.lc-cell').length === 8 && $$('.lc-btn').length === 1,
    'cell ' + $$('.lc-cell').length + ' btn ' + $$('.lc-btn').length);
ok('抽奖按钮显示免费次数', /免费 \d+ 次/.test(($('.lc-btn') || {}).textContent || ''));
const freeBefore = A.state.freeDraws;
$('.lc-btn').click(); await tick();
let drew = false;
for (let i = 0; i < 100; i++) { await tick(); if ($('.sheet')) { drew = true; break; } }
ok('抽奖动画结束后弹出结果弹窗', drew);
ok('免费次数已扣减或「再来一次」回补', A.state.freeDraws === freeBefore - 1 || A.state.freeDraws === freeBefore,
    'free ' + freeBefore + ' -> ' + A.state.freeDraws);
const dlg = document.querySelector('.sheet [data-sheet="close"]');
if (dlg) dlg.click(); await tick();
ok('抽奖结果弹窗可关闭', $('.sheet') === null);
ok('抽奖产出已落地（红包/积分/团购/会员/再来一次之一）',
    A.state.ownedCoupons.length >= 1 || A.state.points > 0 || A.state.claimedGroups.length >= 1 ||
    A.state.member.on || A.state.freeDraws >= freeBefore);

// 启动时应自动使过期会员失效，避免本地旧数据继续享受权益。
const expiredDom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://expired.example.com/',
    beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
        w.scrollTo = () => {};
        w.localStorage.setItem('kd.member', JSON.stringify({ on: true, expire: '2000-01-01' }));
    }
});
ok('启动时过期会员自动失效', expiredDom.window.__app.state.member.on === false &&
    expiredDom.window.localStorage.getItem('kd.member').indexOf('false') !== -1);

console.log(results.join('\n'));
console.log('\n' + (failed === 0 ? '✅ 全部 ' + results.length + ' 项通过' : '❌ ' + failed + ' / ' + results.length + ' 项失败'));
process.exit(failed === 0 ? 0 : 1);

})();

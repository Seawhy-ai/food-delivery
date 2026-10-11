import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCartStore } from '../store/useCartStore';
import { useAddressStore } from '../store/useAddressStore';
import { useOrderStore } from '../store/useOrderStore';
import { mockRestaurants, mockCoupons } from '../mockData';
import type { Order } from '../types';

export const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const addresses = useAddressStore((state) => state.addresses);
  const defaultAddress = useAddressStore((state) => state.getDefaultAddress());
  const addOrder = useOrderStore((state) => state.addOrder);

  const [selectedAddressId, setSelectedAddressId] = useState(
    defaultAddress?.id || addresses[0]?.id
  );
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('alipay');

  const restaurant = cart
    ? mockRestaurants.find((r) => r.id === cart.restaurantId)
    : null;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const goodsTotal = getTotal();
  const deliveryFee = restaurant?.deliveryFee || 0;
  const selectedCoupon = mockCoupons.find((c) => c.id === selectedCouponId);

  let discount = 0;
  if (selectedCoupon) {
    if (selectedCoupon.type === 'discount') {
      discount = (goodsTotal * selectedCoupon.value) / 100;
    } else if (selectedCoupon.type === 'fullMinus') {
      if (goodsTotal >= (selectedCoupon.minAmount || 0)) {
        discount = selectedCoupon.value;
      }
    }
  }

  const totalPrice = goodsTotal + deliveryFee - discount;

  const handleSubmitOrder = () => {
    if (!cart || !selectedAddress || !restaurant) return;

    const order: Order = {
      id: uuidv4(),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: cart.items.map((item) => ({
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specs: item.specs,
        image: item.image,
      })),
      totalPrice: goodsTotal,
      deliveryFee,
      discount,
      couponId: selectedCouponId || undefined,
      address: selectedAddress,
      status: 'pending',
      createdAt: new Date(),
      estimatedDelivery: restaurant.deliveryTime.max,
    };

    addOrder(order);
    clearCart();
    navigate(`/orders/${order.id}`, { state: { newOrder: true } });
  };

  if (!cart || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('cart.empty')}
          </p>
          <Link to="/" className="btn-primary">
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-8"
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('checkout.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 收货地址 */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('checkout.address')}
                </h2>
                <button className="text-blue-500 hover:text-blue-600 text-sm">
                  <Plus size={18} /> {t('checkout.add_address')}
                </button>
              </div>

              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {addr.name} {addr.phone}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {addr.address}
                      </p>
                      {addr.isDefault && (
                        <span className="badge badge-success text-xs mt-1">
                          默认地址
                        </span>
                      )}
                    </div>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Edit2 size={16} />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* 配送方式 */}
            <div className="card p-4">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                {t('checkout.payment')}
              </h2>
              <div className="space-y-2">
                {[
                  { id: 'alipay', label: '支付宝' },
                  { id: 'wechat', label: '微信支付' },
                  { id: 'card', label: '银行卡' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                    />
                    <span className="text-gray-900 dark:text-white">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 优惠券 */}
            <div className="card p-4">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                {t('checkout.coupon')}
              </h2>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="coupon"
                    checked={selectedCouponId === null}
                    onChange={() => setSelectedCouponId(null)}
                  />
                  <span className="text-gray-900 dark:text-white">
                    {t('checkout.no_coupon')}
                  </span>
                </label>
                {mockCoupons.map((coupon) => (
                  <label
                    key={coupon.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="coupon"
                      checked={selectedCouponId === coupon.id}
                      onChange={() => setSelectedCouponId(coupon.id)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {coupon.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {coupon.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 备注 */}
            <div className="card p-4">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                {t('checkout.remark')}
              </h2>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={t('checkout.remark_placeholder')}
                className="input w-full h-24 resize-none"
              />
            </div>
          </div>

          {/* 订单总结 */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                订单总结
              </h3>

              <div className="space-y-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('checkout.goods_total')}</span>
                  <span>¥{goodsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.delivery_fee')}</span>
                  <span>¥{deliveryFee.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>{t('checkout.discount')}</span>
                    <span>-¥{discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900 dark:text-white">
                  {t('checkout.total')}
                </span>
                <span className="text-2xl font-bold text-blue-500">
                  ¥{totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleSubmitOrder}
                className="btn-primary w-full"
              >
                {t('checkout.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

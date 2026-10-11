import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { mockRestaurants } from '../mockData';

export const Cart = () => {
  const { t } = useTranslation();
  const cart = useCartStore((state) => state.cart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const restaurant = cart
    ? mockRestaurants.find((r) => r.id === cart.restaurantId)
    : null;

  const total = getTotal();
  const deliveryFee = restaurant?.deliveryFee || 0;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-8"
          >
            <ArrowLeft size={20} />
            {t('common.back')}
          </Link>

          <div className="card p-12 text-center">
            <p className="text-4xl mb-4">🛒</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cart.empty')}
            </h2>
            <Link to="/" className="btn-primary inline-block">
              {t('cart.continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-8"
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </Link>

        {/* 购物车标题 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('cart.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 购物车项 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 餐厅信息 */}
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{restaurant?.logo}</div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                    {restaurant?.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {restaurant?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* 菜品列表 */}
            {cart.items.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex gap-4">
                  <div className="text-3xl">{item.image}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      {item.name}
                    </h3>
                    {item.specs && Object.keys(item.specs).length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {Object.values(item.specs).join(', ')}
                      </p>
                    )}
                    <p className="text-lg font-bold text-blue-500 mb-3">
                      ¥{item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="w-6 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        小计: ¥
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900 text-red-500 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}

            {/* 清空购物车 */}
            <button
              onClick={clearCart}
              className="btn-secondary w-full"
            >
              {t('cart.clear')}
            </button>
          </div>

          {/* 结算信息 */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                {t('cart.total')}
              </h3>

              <div className="space-y-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('checkout.goods_total')}</span>
                  <span>¥{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.delivery_fee')}</span>
                  <span>¥{deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 text-lg">
                <span className="font-bold text-gray-900 dark:text-white">
                  {t('cart.subtotal')}
                </span>
                <span className="text-2xl font-bold text-blue-500">
                  ¥{(total + deliveryFee).toFixed(2)}
                </span>
              </div>

              <Link
                to="/checkout"
                className="btn-primary w-full text-center block"
              >
                {t('cart.checkout')}
              </Link>

              <Link
                to="/"
                className="btn-secondary w-full text-center block mt-3"
              >
                {t('cart.continue_shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

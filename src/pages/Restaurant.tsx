import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Minus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { mockRestaurants } from '../mockData';
import { useCartStore } from '../store/useCartStore';
import type { Dish } from '../types';

export const Restaurant = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishQuantity, setDishQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState('');

  const restaurant = useMemo(
    () => mockRestaurants.find((r) => r.id === id),
    [id]
  );

  const addItem = useCartStore((state) => state.addItem);

  const filteredDishes = useMemo(() => {
    if (!restaurant) return [];
    let dishes = [...restaurant.dishes];

    if (searchText) {
      const text = searchText.toLowerCase();
      dishes = dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(text) ||
          d.description.toLowerCase().includes(text)
      );
    }

    return dishes;
  }, [restaurant, searchText]);

  const groupedDishes = useMemo(() => {
    const groups: Record<string, Dish[]> = {};
    filteredDishes.forEach((dish) => {
      if (!groups[dish.category]) {
        groups[dish.category] = [];
      }
      groups[dish.category].push(dish);
    });
    return groups;
  }, [filteredDishes]);

  const handleAddToCart = () => {
    if (!selectedDish || !restaurant) return;

    const cartItem = {
      id: uuidv4(),
      dishId: selectedDish.id,
      restaurantId: restaurant.id,
      name: selectedDish.name,
      price: selectedDish.price,
      quantity: dishQuantity,
      specs: selectedSpecs,
      image: selectedDish.image,
    };

    addItem(restaurant.id, cartItem);
    setSelectedDish(null);
    setDishQuantity(1);
    setSelectedSpecs({});
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('home.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 餐厅信息 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex gap-4">
            <div className="text-6xl">{restaurant.logo}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {restaurant.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {restaurant.description}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>⭐ {restaurant.rating} ({restaurant.reviewCount})</span>
                <span>配送费: ¥{restaurant.deliveryFee}</span>
                <span>配送: {restaurant.deliveryTime.min}-{restaurant.deliveryTime.max}分</span>
                <span>距离: {restaurant.distance}km</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 菜品列表 */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <input
                type="text"
                placeholder={t('home.search')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input w-full"
              />
            </div>

            <div className="space-y-6">
              {Object.entries(groupedDishes).map(([category, dishes]) => (
                <div key={category}>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedDish(dish);
                          setSelectedSpecs({});
                          setDishQuantity(1);
                        }}
                      >
                        <div className="text-4xl mb-2">{dish.image}</div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                          {dish.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {dish.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-500">
                            ¥{dish.price.toFixed(2)}
                          </span>
                          {dish.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ¥{dish.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">👥 {dish.popularity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧信息面板 */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-20">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                {t('restaurant.info')}
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">营业状态</p>
                  <p className="badge badge-success mt-1">营业中</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('restaurant.address')}</p>
                  <p className="mt-1">{restaurant.address}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('restaurant.phone')}</p>
                  <p className="mt-1">{restaurant.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 菜品详情弹窗 */}
      {selectedDish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {t('restaurant.menu')}
              </h2>
              <button
                onClick={() => setSelectedDish(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="text-6xl text-center mb-4">{selectedDish.image}</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {selectedDish.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {selectedDish.description}
              </p>

              {/* 规格选择 */}
              {selectedDish.specs && selectedDish.specs.length > 0 && (
                <div className="mb-4 space-y-3">
                  {selectedDish.specs.map((spec) => (
                    <div key={spec.id}>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                        {spec.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {spec.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() =>
                              setSelectedSpecs({
                                ...selectedSpecs,
                                [spec.id]: option.name,
                              })
                            }
                            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                              selectedSpecs[spec.id] === option.name
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500'
                            }`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 价格和数量 */}
              <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-blue-500">
                    ¥{selectedDish.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDishQuantity(Math.max(1, dishQuantity - 1))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {dishQuantity}
                    </span>
                    <button
                      onClick={() => setDishQuantity(dishQuantity + 1)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full"
                >
                  {t('dish.add_to_cart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

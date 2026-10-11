import { useTranslation } from 'react-i18next';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { t } = useTranslation();
  const cart = useCartStore((state) => state.cart);
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = cart?.items.length || 0;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-500">
          🍱 {t('app.title')}
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/orders" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">
            {t('nav.orders')}
          </Link>

          <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">
            {t('nav.profile')}
          </Link>

          <Link to="/cart" className="relative text-gray-600 dark:text-gray-300 hover:text-blue-500">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              onMenuClick?.();
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

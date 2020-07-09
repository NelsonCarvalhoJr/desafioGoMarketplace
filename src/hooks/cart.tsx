import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const productsData = await AsyncStorage.getItem(
        '@goMarketplace:products',
      );

      if (productsData) {
        setProducts(JSON.parse(productsData));
      } else {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      const filteredProducts = newProducts.filter(
        product => product.quantity > 0,
      );

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(filteredProducts),
      );

      setProducts(filteredProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const filteredProduct = products.filter(
        productState => productState.id === product.id,
      );

      if (filteredProduct.length === 1) {
        await increment(product.id);
        return;
      }

      const productToAdd: Product = { ...product, quantity: 1 };

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify([...products, productToAdd]),
      );

      setProducts([...products, productToAdd]);
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

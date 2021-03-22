import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get(`stock/${productId}`);
      const stock = responseStock.data;
      const responseProduct = await api.get(`products/${productId}`);
      const product = responseProduct.data;

      //{
      //   "id": 2,
      //   "amount": 5
      // }

      const productOnCart = cart.find(product => product.id === productId);

      console.log(productOnCart)

      if (productOnCart === undefined) {
        const newCart = [...cart, { ...product, amount: 1 }];
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else if (productOnCart.amount + 1 <= stock.amount) {
        const newCart = [...cart];
        const productIndex = newCart.indexOf(productOnCart);
        newCart[productIndex] = { ...productOnCart, amount: productOnCart.amount + 1 };
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }


    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const productOnCart = cart.find(product => product.id === productId);
      const responseStock = await api.get(`stock/${productId}`);
      const stock = responseStock.data;

      if (productOnCart !== undefined && productOnCart?.amount <= stock?.amount) {
        const newCart = [...cart];
        const productIndex = newCart.indexOf(productOnCart);
        newCart[productIndex] = { ...productOnCart, amount };
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

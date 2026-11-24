import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'abc.cart.v1';
const MAX_QUANTITY = 20;

export type CartLine = {
  menuItemId: number;
  name: string;
  pricePaise: number;
  imageUrl: string | null;
  isVeg: boolean;
  quantity: number;
};

export type MenuSyncItem = {
  id: number;
  name: string;
  pricePaise: number;
  imageUrl: string | null;
  isVeg: boolean;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  subtotalPaise: number;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  increment: (menuItemId: number) => void;
  decrement: (menuItemId: number) => void;
  remove: (menuItemId: number) => void;
  clear: () => void;
  sync: (items: MenuSyncItem[]) => void;
  quantityFor: (menuItemId: number) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.menuItemId === 'number' &&
    typeof line.name === 'string' &&
    typeof line.pricePaise === 'number' &&
    typeof line.quantity === 'number' &&
    line.quantity >= 1 &&
    line.quantity <= MAX_QUANTITY &&
    (line.imageUrl === null || typeof line.imageUrl === 'string') &&
    typeof line.isVeg === 'boolean'
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setLines(parsed.filter(isCartLine));
        }
      })
      .catch(() => {
        // A corrupt cart should never block the app; start empty.
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)).catch(() => {
      // Persisting the cart is best-effort.
    });
  }, [lines, hydrated]);

  const add = useCallback(
    (line: Omit<CartLine, 'quantity'>, quantity = 1) => {
      setLines((current) => {
        const existing = current.find((item) => item.menuItemId === line.menuItemId);
        if (existing) {
          return current.map((item) =>
            item.menuItemId === line.menuItemId
              ? {
                  ...item,
                  quantity: Math.min(MAX_QUANTITY, item.quantity + quantity),
                }
              : item,
          );
        }
        return [
          ...current,
          { ...line, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) },
        ];
      });
    },
    [],
  );

  const increment = useCallback((menuItemId: number) => {
    setLines((current) =>
      current.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) }
          : item,
      ),
    );
  }, []);

  const decrement = useCallback((menuItemId: number) => {
    setLines((current) =>
      current
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const remove = useCallback((menuItemId: number) => {
    setLines((current) =>
      current.filter((item) => item.menuItemId !== menuItemId),
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const sync = useCallback((items: MenuSyncItem[]) => {
    const byId = new Map(items.map((item) => [item.id, item]));
    setLines((current) => {
      let changed = false;
      const next = current.map((line) => {
        const item = byId.get(line.menuItemId);
        if (!item) return line;
        if (
          line.name === item.name &&
          line.pricePaise === item.pricePaise &&
          line.imageUrl === item.imageUrl &&
          line.isVeg === item.isVeg
        ) {
          return line;
        }
        changed = true;
        return {
          ...line,
          name: item.name,
          pricePaise: item.pricePaise,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
        };
      });
      return changed ? next : current;
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalPaise = lines.reduce(
      (sum, line) => sum + line.pricePaise * line.quantity,
      0,
    );
    return {
      lines,
      hydrated,
      itemCount,
      subtotalPaise,
      add,
      increment,
      decrement,
      remove,
      clear,
      sync,
      quantityFor: (menuItemId: number) =>
        lines.find((line) => line.menuItemId === menuItemId)?.quantity ?? 0,
    };
  }, [lines, hydrated, add, increment, decrement, remove, clear, sync]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}

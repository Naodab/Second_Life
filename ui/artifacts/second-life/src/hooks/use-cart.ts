import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  clearCart,
  listCartItems,
  removeCartItem,
  updateCartItem,
  type CartItemAddPayload,
} from "@/api/cart";
import { useAuth } from "@/context/AuthContext";
import { mapCartApiToView } from "@/cart/cart-mapper";
import type { CartItemView } from "@/pages/Cart/cart-types";

export const CART_QUERY_KEY = ["cart"] as const;

export function useCart() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const rows = await listCartItems();
      return rows.map(mapCartApiToView);
    },
    enabled: isLoggedIn,
    staleTime: 10_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });

  const addMutation = useMutation({
    mutationFn: (payload: CartItemAddPayload) => addCartItem(payload).then(mapCartApiToView),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateCartItem(id, { quantity }).then(mapCartApiToView),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartItemView[]>(CART_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(
          CART_QUERY_KEY,
          previous.filter((item) => item.cartItemId !== id),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartItemView[]>(CART_QUERY_KEY);
      queryClient.setQueryData(CART_QUERY_KEY, []);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: invalidate,
  });

  return {
    cartItems: (cartQuery.data ?? []) as CartItemView[],
    isLoading: cartQuery.isLoading,
    isFetching: cartQuery.isFetching,
    error: cartQuery.error,
    refetch: cartQuery.refetch,
    addToCart: (payload: CartItemAddPayload) => addMutation.mutateAsync(payload),
    updateCartQuantity: (id: string, quantity: number) =>
      updateMutation.mutateAsync({ id, quantity }),
    removeFromCart: (id: string) => removeMutation.mutateAsync(id),
    clearCart: () => clearMutation.mutateAsync(),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

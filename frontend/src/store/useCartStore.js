import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set) => ({
            // Inital state
            draftCarts: [],

            // Replace or update a specific table's cart
            updateCart: (tableId, cartItems) => set((state) => ({
                draftCarts: {
                    ...state.draftCarts,
                    [tableId]: cartItems
                }
            })),

            // wipe a table's draft after sending to the kitchen
            clearCart: (tableId) => set((state) => {
                const newCarts = { ...state.draftCarts };
                delete newCarts[tableId];
                return { draftCarts: newCarts };
            }),
        }),
        {
            name: 'pos-draft-storage', // This is the key it uses to save to localStorage
        }
    )
)
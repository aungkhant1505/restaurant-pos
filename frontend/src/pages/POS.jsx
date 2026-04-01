import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import Echo from "laravel-echo";
import { useReactToPrint } from 'react-to-print';
import Receipt from '../components/Receipt';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "../store/useCartStore";

window.Pusher = Pusher;
const echo = new Echo({
  broadcaster: 'pusher',
  key: '9fea525a282271c221b1',
  cluster: 'ap1', 
  forceTLS: true
});

function POS() {
  const [waiterName, setWaiterName] = useState('Admin');
  const [selectedTable, setSelectedTable] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });
  const queryClient = useQueryClient();

  const { draftCarts, updateCart, clearCart } = useCartStore();
  const currentCart = selectedTable && draftCarts[selectedTable] ? draftCarts[selectedTable] : [];
  const cartTotal = currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/menu');
      if (!res.ok) throw new Error('Failed to fetch menu items');
      return res.json();
    }
  });

  const { data: activeOrders = {} } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/orders');
      if (!res.ok) throw new Error('Failed to fetch active orders');
      const data = await res.json();

      const formattedOrders = {};
      data.forEach(order => {
        if (order.status !== 'completed') {
          // format it exactly how receipt component expects it
          formattedOrders[order.table_number] = {
            id: order.id,
            waiter: order.waiter_name || 'Staff',
            table: order.table_number,
            items: order.items || [],
            total: order.total_price,
            date: new Date(order.created_at).toLocaleString()
          };
        }
      });
      return formattedOrders;
    },
    // refetchInterval: 5000,
  });

  const submitOrderMutation = useMutation({
    mutationFn: async ({ total_price, items, table_number}) => {
      const res = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ total_price, items, table_number })
      });

      if (!res.ok) throw new Error('Failed to submit order');
      return res.json();
    },
    onSuccess: (data, variables) => {
      clearCart(variables.table_number);
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] }); // Fetch fresh green tables
      setSelectedTable(null);
    },
    onError: (err) => alert("Failed to send order: " + err.message)
  });

  const cashOutMutation = useMutation({
    mutationFn: async (table_number) => {
      const res = await fetch(`http://localhost:8000/api/orders/${table_number}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to cash out');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] }); // // Refetch so table turns White
      setViewingReceipt(null);
    }
  });

  useEffect(() => {
    const channel = echo.channel('pos');
    channel.listen('.order-ready', (data) => {
      alert(`🔔 ORDER UP! Ticket #${data.orderId} is ready to serve!`);
    });

    return () => channel.stopListening('.order-ready');
  }, []);

  // const handlePinSubmit = () => {
  //   fetch('http://localhost:8000/api/pos/pin-login', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  //     body: JSON.stringify({ pin })
  //   })
  //   .then(async res => {
  //     if (!res.ok) throw new Error("Invalid PIN Code");
  //     return res.json();
  //   })
  //   .then(data => {
  //     setWaiterName(data.waiter_name || data.user);
  //     setIsUnlocked(true);
  //     setPin(''); 
  //   })
  //   .catch(err => {
  //     alert(err.message);
  //     setPin(''); 
  //   });
  // };

  const addToCart = (item) => {
    const existing = currentCart.find(c => c.id === item.id);
    let newCart;
    if (existing) {
      newCart = currentCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
    } else {
      newCart = [...currentCart, { ...item, quantity: 1 }];
    }
    updateCart(selectedTable, newCart); // Save to Zustand, which also persists to localStorage!
  };

  const removeFromCart = (itemId) => {
    const existing = currentCart.find(c => c.id === itemId);
    let newCart;
    if (existing.quantity > 1) {
      newCart = currentCart.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    } else {
      newCart = currentCart.filter(c => c.id !== itemId);
    }
    updateCart(selectedTable, newCart);
  };

  // const submitOrder = () => {
  //   setIsSubmitting(true);
  //   fetch('http://localhost:8000/api/orders', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  //     body: JSON.stringify({ total_price: cartTotal, items: currentCart, table_number: selectedTable }) 
  //   })
  //   .then(res => res.json())
  //   .then(data => {
      
  //     // 🚀 SMART MERGE: If they already ordered before, add these new items to their existing receipt!
  //     const previousReceipt = sentOrders[selectedTable];
  //     const mergedItems = previousReceipt ? [...previousReceipt.items, ...currentCart] : [...currentCart];
  //     const mergedTotal = previousReceipt ? previousReceipt.total + cartTotal : cartTotal;
  //     const mergedIds = previousReceipt ? `${previousReceipt.id} & ${data.order_id}` : data.order_id;

  //     setSentOrders({
  //       ...sentOrders,
  //       [selectedTable]: {
  //         id: mergedIds,
  //         waiter: waiterName,
  //         table: selectedTable,
  //         items: mergedItems,
  //         total: mergedTotal,
  //         date: new Date().toLocaleString()
  //       }
  //     });
      
  //     const updatedCarts = { ...tableCarts };
  //     delete updatedCarts[selectedTable];
  //     setTableCarts(updatedCarts);
      
  //     setSelectedTable(null);
  //     setIsSubmitting(false);
  //   })
  //   .catch(err =>{
  //     console.error("Checkout error:", err);
  //     setIsSubmitting(false);
  //   });
  // };

  // ---------------- UI: FLOOR PLAN ----------------
  if (!selectedTable) {
    const allTables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Table 11', 'Table 12', 'Takeout'];

    return (
      <div className="flex-1 p-10 bg-slate-100 h-screen overflow-y-auto flex flex-col items-center w-full relative">
        <div className="w-full max-w-5xl flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-3xl font-black text-slate-800">Select a Table</h2>
            {/* <p className="text-slate-500 font-medium">Logged in as {waiterName}</p> */}
          </div>
          {/* <button onClick={() => setIsUnlocked(false)} className="px-6 py-3 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-all">
            Lock Terminal
          </button> */}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl">
          {allTables.map(tableName => {
            const hasActiveDraft = draftCarts[tableName] && draftCarts[tableName].length > 0;
            const hasSentOrder = activeOrders[tableName];
            const isTakeout = tableName === 'Takeout';

            // Default White styling
            let bgColor = isTakeout ? 'bg-amber-50 border-amber-200 hover:border-amber-500' : 'bg-white border-slate-200 hover:border-blue-500';
            let iconColor = isTakeout ? 'bg-amber-100 group-hover:bg-amber-200' : 'bg-slate-100 group-hover:bg-blue-100';
            let textColor = isTakeout ? 'text-amber-800' : 'text-slate-700';

            // Overrides based on Table State
            if (hasSentOrder) {
              bgColor = 'bg-emerald-50 border-emerald-400 hover:bg-emerald-100'; // 🟩 Green!
              iconColor = 'bg-emerald-200';
              textColor = 'text-emerald-800';
            } else if (hasActiveDraft) {
              bgColor = 'bg-blue-50 border-blue-400'; // 🟦 Blue!
              iconColor = 'bg-blue-200';
              textColor = 'text-blue-800';
            }

            return (
              <button 
                key={tableName} 
                onClick={() => {
                  // If table is green and has no active draft, pop open the receipt!
                  if (hasSentOrder && !hasActiveDraft) {
                    setViewingReceipt(activeOrders[tableName]);
                  } else {
                    // Otherwise, open the menu so they can add food
                    setSelectedTable(tableName);
                  }
                }}
                className={`border-2 p-8 rounded-3xl shadow-md transition-all flex flex-col items-center justify-center group ${isTakeout ? 'col-span-2 md:col-span-1' : ''} ${bgColor}`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${iconColor}`}>
                  <span className="text-2xl">{isTakeout ? '🛍️' : '🍽️'}</span>
                </div>
                <span className={`text-xl font-black ${textColor}`}>{tableName}</span>
                
                {/* Visual Indicators */}
                {hasSentOrder && <span className="text-sm font-bold text-emerald-600 mt-2">🧾 Receipt Ready</span>}
                {hasActiveDraft && <span className="text-sm font-bold text-blue-600 mt-1">{draftCarts[tableName].length} unsent items</span>}
              </button>
            )
          })}
        </div>

        {/* 🚀 FIXED: WE ADDED THE MODAL TO THE FLOOR PLAN SCREEN TOO! */}
        {viewingReceipt && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-100 p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full border border-slate-300">
              
              <div className="flex justify-between items-start w-full mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">Table Options</h2>
                  <p className="text-slate-500 font-bold">{viewingReceipt.table}</p>
                </div>
                
                <div onClick={() => setViewingReceipt(null)} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-full cursor-pointer transition-colors" title="Close Modal">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-200 shadow-inner max-h-[50vh] overflow-y-auto mb-8 w-full flex justify-center py-4 rounded-xl">
                 <Receipt ref={contentRef} order={viewingReceipt} />
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button onClick={handlePrint} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                  🖨️ Print Receipt
                </button>

                <div className="flex gap-3 w-full">
                  <button onClick={() => {
                     setSelectedTable(viewingReceipt.table);
                     setViewingReceipt(null);
                  }} className="flex-1 py-3 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold rounded-xl transition-colors">
                    🍔 Add Food
                  </button>

                  <button onClick={() => {
                     if(window.confirm("Are you sure you want to cash out and clear this table?")) {
                         // Call the mutation instead of modifying state directly
                         cashOutMutation.mutate(viewingReceipt.table);
                     }
                  }}
                  disabled={cashOutMutation.isPending}
                  className="flex-1 py-3 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white font-bold rounded-xl transition-colors">
                    {cashOutMutation.isPending ? 'CASHING OUT...' : '💰 Cash Out' }
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // ---------------- UI: THE MENU / CART TERMINAL ----------------
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden w-full relative">
      
      <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => setSelectedTable(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            Close Table
          </button>
          <div className="font-bold text-lg text-emerald-400">{selectedTable}</div>
          
          {activeOrders[selectedTable] && (
            <button onClick={() => setViewingReceipt(activeOrders[selectedTable])} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-md">
               View Receipt
            </button>
          )}
        </div>
        <div className="font-medium text-slate-300">Server: <span className="text-white font-bold">{waiterName}</span></div>
      </div>

      <div className="flex flex-1 overflow-hidden w-full">
        <div className="flex-[2] p-8 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map(item => (
              <div key={item.id} onClick={() => addToCart(item)} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider">{item.category}</p>
                </div>
                <span className="font-extrabold text-xl text-emerald-600">${item.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-[1] bg-white border-l border-gray-200 p-8 flex flex-col shadow-xl z-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">🧾 Current Order</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {currentCart.length === 0 ? (
               <p className="text-gray-400 text-center mt-10 italic">Ticket is empty.</p>
            ) : (
              currentCart.map((cartItem, index) => (
                <div key={index} className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{cartItem.name}</div>
                    <div className="text-sm text-gray-500 font-medium">Qty: {cartItem.quantity}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 w-16 text-right">${(cartItem.price * cartItem.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(cartItem.id)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full transition-colors font-bold text-xl pb-1" title="Remove one">−</button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pt-6 border-t-2 border-gray-100 mt-4">
            <div className="flex justify-between items-center text-2xl font-black mb-6">
              <span>Total:</span><span className="text-blue-600">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => submitOrderMutation.mutate({ total_price: cartTotal, items: currentCart, table_number: selectedTable })}
              disabled={submitOrderMutation.isPending || currentCart.length === 0}
              className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-colors ${currentCart.length === 0 || submitOrderMutation.isPending ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>
              {submitOrderMutation.isPending ? 'Sending...' : 'Send to Kitchen'}
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 UPGRADED RECEIPT MODAL */}
      {viewingReceipt && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-100 p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full border border-slate-300">
              
              <div className="flex justify-between items-start w-full mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">Table Options</h2>
                  <p className="text-slate-500 font-bold">{viewingReceipt.table}</p>
                </div>
                
                <div onClick={() => setViewingReceipt(null)} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-full cursor-pointer transition-colors" title="Close Modal">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-200 shadow-inner max-h-[50vh] overflow-y-auto mb-8 w-full flex justify-center py-4 rounded-xl">
                 <Receipt ref={contentRef} order={viewingReceipt} />
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button onClick={handlePrint} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                  🖨️ Print Receipt
                </button>

                <div className="flex gap-3 w-full">
                  <button onClick={() => {
                     setSelectedTable(viewingReceipt.table);
                     setViewingReceipt(null);
                  }} className="flex-1 py-3 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold rounded-xl transition-colors">
                    🍔 Add Food
                  </button>

                  <button onClick={() => {
                     if(window.confirm("Are you sure you want to cash out and clear this table?")) {
                         // Call the mutation instead of modifying state directly
                         cashOutMutation.mutate(viewingReceipt.table);
                     }
                  }}
                  disabled={cashOutMutation.isPending}
                  className="flex-1 py-3 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white font-bold rounded-xl transition-colors">
                    {cashOutMutation.isPending ? 'CASHING OUT...' : '💰 Cash Out' }
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

    </div>
  );
}

export default POS;
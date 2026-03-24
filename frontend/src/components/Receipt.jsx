import { forwardRef } from 'react';

// forwardRef allows the print library to target this exact component
const Receipt = forwardRef(({ order }, ref) => {
  if (!order) return null;

  return (
    <div ref={ref} className="p-8 bg-white text-black font-mono w-[300px] mx-auto text-sm">
      
      {/* HEADER */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-black tracking-tighter">LARAVEL BISTRO</h1>
        <p>123 Docker Avenue</p>
        <p>Full-Stack City, Web 10101</p>
      </div>

      <div className="border-b-2 border-dashed border-gray-400 my-4"></div>

      {/* METADATA */}
      <div className="mb-4">
        <p>Ticket: <span className="font-bold">#{order.id}</span></p>
        <p>Server: {order.waiter}</p>
        <p>Date: {order.date}</p>
      </div>

      <div className="border-b-2 border-dashed border-gray-400 my-4"></div>

      {/* ITEMS */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span className="pr-4">{item.quantity}x {item.name}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-b-2 border-dashed border-gray-400 my-4"></div>

      {/* TOTAL */}
      <div className="flex justify-between text-lg font-black mb-6">
        <span>TOTAL</span>
        <span>${order.total.toFixed(2)}</span>
      </div>

      {/* FOOTER */}
      <div className="text-center text-xs opacity-80">
        <p>Thank you for dining with us!</p>
        <p>Powered by React & Laravel</p>
      </div>

    </div>
  );
});

export default Receipt;
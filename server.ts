import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'WEFT', timestamp: new Date().toISOString() });
  });

  // Secure Order Creation API
  app.post('/api/order/create', async (req, res) => {
    try {
      const { customer, items, shippingMethodId } = req.body;

      if (!customer || !customer.name || !customer.phone || !customer.address) {
        return res.status(400).json({
          success: false,
          error: 'অনুগ্রহ করে গ্রাহকের নাম, ফোন নাম্বার এবং ঠিকানা প্রদান করুন।',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'কোনো পণ্য সিলেক্ট করা হয়নি।',
        });
      }

      // Authoritative default product prices dictionary (matching catalog)
      const basePrices: Record<string, number> = {
        'prod-lavender': 990,
        'prod-navy-blue': 990,
        'prod-sky-blue': 990,
        'prod-beige': 990,
        'prod-black': 990,
        'prod-olive': 990,
      };

      const productNames: Record<string, string> = {
        'prod-lavender': 'Lavender Color',
        'prod-navy-blue': 'Navy Blue Color',
        'prod-sky-blue': 'Sky Blue Color',
        'prod-beige': 'Beige / Khaki Color',
        'prod-black': 'Charcoal Black Color',
        'prod-olive': 'Olive Green Color',
      };

      let subtotal = 0;
      let totalQuantity = 0;
      const orderItems = [];

      for (const item of items) {
        const unitPrice = basePrices[item.productId] || 990;
        const lineTotal = unitPrice * (item.quantity || 1);
        subtotal += lineTotal;
        totalQuantity += (item.quantity || 1);

        orderItems.push({
          productId: item.productId,
          productName: productNames[item.productId] || item.productName || 'Premium Oxford Shirt',
          image: item.image || '',
          size: item.size || 'L',
          quantity: item.quantity || 1,
          unitPrice,
          subtotal: lineTotal,
        });
      }

      // Shipping calculation
      let shippingCharge = shippingMethodId === 'outside-dhaka' ? 130 : 70;
      // Free shipping threshold
      if (totalQuantity >= 2) {
        shippingCharge = 0;
      }

      const discount = 0;
      const total = subtotal + shippingCharge - discount;

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `WEFT-${new Date().getFullYear()}-${randomSuffix}`;
      const orderId = 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const timestamp = new Date().toISOString();

      const createdOrder = {
        id: orderId,
        orderNumber,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address: customer.address.trim(),
          city: customer.city || (shippingMethodId === 'outside-dhaka' ? 'Outside Dhaka' : 'Inside Dhaka'),
          note: customer.note ? customer.note.trim() : '',
        },
        items: orderItems,
        subtotal,
        shipping: shippingCharge,
        discount,
        total,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        statusHistory: [
          {
            status: 'PENDING',
            timestamp,
            note: 'Order placed successfully (Cash on Delivery)',
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
        shippingMethodId,
      };

      return res.status(200).json({
        success: true,
        order: createdOrder,
        message: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে।',
      });
    } catch (err: any) {
      console.error('Server order creation error:', err);
      return res.status(500).json({
        success: false,
        error: 'অর্ডার তৈরি করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    }
  });

  // ImgBB Upload Proxy with fast timeout, unique filename & safe fallback
  app.post('/api/upload/imgbb', async (req, res) => {
    try {
      const apiKey = process.env.IMGBB_API_KEY || 'a50e33356154606bbc7c4c82300cc768';
      const { imageBase64, imageName } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'No image provided' });
      }

      // Clean base64 payload
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const formData = new URLSearchParams();
      formData.append('key', apiKey);
      formData.append('image', cleanBase64);
      if (imageName) {
        formData.append('name', imageName);
      }

      // 5-second abort controller to prevent hanging backend requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.url) {
            return res.json({
              success: true,
              url: data.data.url,
              thumbnailUrl: data.data.thumb?.url || data.data.url,
              deleteUrl: data.data.delete_url,
            });
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn('Server ImgBB external fetch timeout/error, returning fallback dataUrl:', fetchErr);
      }

      // Graceful fallback to client image
      return res.status(200).json({
        success: true,
        url: imageBase64,
        thumbnailUrl: imageBase64,
        fallback: true,
      });
    } catch (err: any) {
      console.error('ImgBB upload error:', err);
      return res.status(200).json({
        success: true,
        url: req.body?.imageBase64 || '',
        fallback: true,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WEFT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

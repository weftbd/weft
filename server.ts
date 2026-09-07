import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { sendMetaCapiEvent } from './server/metaCapi';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Helper to extract client IP from request
  const getClientIp = (req: express.Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '';
  };

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'WEFT', timestamp: new Date().toISOString() });
  });

  // Secure Order Creation API with Meta CAPI integration
  app.post('/api/order/create', async (req, res) => {
    try {
      const { customer, items, shippingMethodId, attribution } = req.body;

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
      const eventId = `purchase_${orderNumber}`;

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

      // Asynchronous Meta CAPI dispatch for Purchase event (deduplicated via eventId)
      const nameParts = createdOrder.customer.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const clientIp = getClientIp(req);
      const clientUserAgent = (req.headers['user-agent'] as string) || '';

      sendMetaCapiEvent({
        eventName: 'Purchase',
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: req.headers.referer || 'https://weftbd.com',
        actionSource: 'website',
        userData: {
          phone: createdOrder.customer.phone,
          firstName,
          lastName,
          city: createdOrder.customer.city,
          country: 'bd',
          clientIpAddress: clientIp,
          clientUserAgent,
          fbp: attribution?.fbp,
          fbc: attribution?.fbc,
          externalId: createdOrder.customer.phone,
        },
        customData: {
          content_type: 'product',
          content_ids: orderItems.map((it) => it.productId),
          contents: orderItems.map((it) => ({
            id: it.productId,
            quantity: it.quantity,
            item_price: it.unitPrice,
            size: it.size,
          })),
          value: total,
          currency: 'BDT',
          num_items: totalQuantity,
          order_id: orderNumber,
        },
      }).catch((capiErr) => {
        console.warn('[Meta CAPI] Purchase background error:', capiErr);
      });

      return res.status(200).json({
        success: true,
        order: createdOrder,
        eventId,
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

  // Meta Conversions API (CAPI) direct relay endpoint
  app.post('/api/meta/capi', async (req, res) => {
    try {
      const { eventName, eventId, userData = {}, customData = {}, eventSourceUrl } = req.body;

      if (!eventName || !eventId) {
        return res.status(400).json({ success: false, error: 'eventName and eventId are required' });
      }

      const clientIp = getClientIp(req);
      const clientUserAgent = (req.headers['user-agent'] as string) || '';

      const mergedUserData = {
        ...userData,
        clientIpAddress: userData.clientIpAddress || clientIp,
        clientUserAgent: userData.clientUserAgent || clientUserAgent,
      };

      const result = await sendMetaCapiEvent({
        eventName,
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: eventSourceUrl || req.headers.referer || 'https://weftbd.com',
        actionSource: 'website',
        userData: mergedUserData,
        customData,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('[Meta CAPI] Relay error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Order Lifecycle Event (Executed from server without polluting Admin browser)
  app.post('/api/admin/order-lifecycle', async (req, res) => {
    try {
      const { order, previousStatus, newStatus, adminNote } = req.body;

      if (!order || !newStatus) {
        return res.status(400).json({ success: false, error: 'Order and newStatus are required' });
      }

      // Map status transition to Meta Event
      let eventName = '';
      if (newStatus === 'CONFIRMED') eventName = 'OrderConfirmed';
      else if (newStatus === 'SHIPPED') eventName = 'OrderShipped';
      else if (newStatus === 'DELIVERED') eventName = 'OrderDelivered';
      else if (newStatus === 'CANCELLED') eventName = 'OrderCancelled';
      else if (newStatus === 'RETURNED') eventName = 'OrderRefunded';

      if (!eventName) {
        return res.json({ success: true, message: 'No conversion mapping for this status' });
      }

      const eventId = `${eventName.toLowerCase()}_${order.id}_${Date.now()}`;
      const nameParts = (order.customer?.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const result = await sendMetaCapiEvent({
        eventName,
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: 'https://weftbd.com',
        actionSource: 'system_generated',
        userData: {
          phone: order.customer?.phone,
          firstName,
          lastName,
          city: order.customer?.city,
          country: 'bd',
          externalId: order.customer?.phone,
        },
        customData: {
          order_id: order.orderNumber || order.id,
          value: order.total,
          currency: 'BDT',
          content_ids: (order.items || []).map((it: any) => it.productId),
          previous_status: previousStatus,
          new_status: newStatus,
          admin_note: adminNote || '',
        },
      });

      return res.json({ success: true, eventName, eventId, result });
    } catch (err: any) {
      console.error('[Meta CAPI Admin Lifecycle] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
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

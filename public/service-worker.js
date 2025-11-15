// Service Worker for Payment Handler API support
// This enables custom payment methods using the Payment Handler API

let paymentRequestEvent = null;
let resolver = null;

// Listen for the canmakepayment event
// This is fired when a merchant website calls PaymentRequest() constructor
self.addEventListener('canmakepayment', (event) => {
  console.log('canmakepayment event received');
  
  // Respond with a promise that resolves to true if payment can be made
  event.respondWith(
    new Promise((resolve) => {
      // You can add custom logic here to check if payment is available
      // For example, check if user is logged in, has payment method configured, etc.
      resolve(true);
    })
  );
});

// Listen for the paymentrequest event
// This is fired when PaymentRequest.show() is called on the merchant website
self.addEventListener('paymentrequest', async (event) => {
  console.log('paymentrequest event received', event);
  
  // If there's an ongoing payment, reject it
  if (paymentRequestEvent && resolver) {
    resolver.reject();
  }
  
  // Store the event for later use
  paymentRequestEvent = event;
  
  // Open a payment handler window
  // This window will show the payment UI to the user
  try {
    const windowClient = await event.openWindow('/payment-handler.html');
    
    if (!windowClient) {
      // User closed the window or it failed to open
      event.respondWith(Promise.reject(new Error('Payment window closed')));
      return;
    }
    
    // Send payment details to the window
    windowClient.postMessage({
      type: 'PAYMENT_REQUEST',
      total: event.total,
      displayItems: event.displayItems,
      methodData: event.methodData,
      modifiers: event.modifiers
    });
    
    // Listen for payment response from the window
    const messageHandler = (messageEvent) => {
      if (messageEvent.data.type === 'PAYMENT_RESPONSE') {
        // Remove the message listener
        self.removeEventListener('message', messageHandler);
        
        // Resolve the payment with the response
        event.respondWith(
          Promise.resolve({
            methodName: event.methodData[0].supportedMethods,
            details: messageEvent.data.details
          })
        );
        
        // Clean up
        paymentRequestEvent = null;
        resolver = null;
      } else if (messageEvent.data.type === 'PAYMENT_CANCEL') {
        // Remove the message listener
        self.removeEventListener('message', messageHandler);
        
        // Reject the payment
        event.respondWith(Promise.reject(new Error('Payment cancelled')));
        
        // Clean up
        paymentRequestEvent = null;
        resolver = null;
      }
    };
    
    self.addEventListener('message', messageHandler);
    
  } catch (error) {
    console.error('Error opening payment window:', error);
    event.respondWith(Promise.reject(error));
  }
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting(); // Activate immediately
});


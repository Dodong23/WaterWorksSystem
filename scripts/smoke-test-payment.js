(async () => {
  try {
    const base = process.env.BASE_URL || 'http://localhost:7000';

    const fetchJson = async (url, opts) => {
      const res = await fetch(url, opts);
      const text = await res.text();
      try { return JSON.parse(text); } catch(e) { return { raw: text, status: res.status }; }
    };

    console.log('Fetching one billing...');
    const billingsRes = await fetchJson(`${base}/api/billings?limit=1`);
    if (!billingsRes || !billingsRes.data || !billingsRes.data.length) {
      console.error('No billings returned:', billingsRes);
      return process.exit(1);
    }

    const billing = billingsRes.data[0];
    console.log('Selected billing:', { id: billing._id || billing.id, billingID: billing.billingID, currentBilling: billing.currentBilling, paidAmount: billing.paidAmount, remainingBalance: billing.remainingBalance });

    console.log('Fetching next available OR...');
    const orRes = await fetchJson(`${base}/api/or-registry/batches/next-or`);
    if (!orRes || !orRes.data || !orRes.data.orNumber) {
      console.warn('No OR available, continuing without OR. Response:', orRes);
    }
    const orNumber = orRes && orRes.data && orRes.data.orNumber ? orRes.data.orNumber : null;
    console.log('Using OR number:', orNumber);

    // Determine allocation amount: use remainingBalance if >0 else use currentBilling
    const remaining = Number(billing.remainingBalance || 0);
    const amountToPay = remaining > 0 ? remaining : Number(billing.currentBilling || 0);
    if (!amountToPay || amountToPay <= 0) {
      console.error('Selected billing has no amount to pay. exiting.');
      return process.exit(1);
    }

    const payload = {
      payor: billing.name || 'Test Payor',
      batch: 'SMOKE',
      orNumber: orNumber || `SMOKE-${Date.now()}`,
      paymentDate: new Date().toISOString(),
      totalAmount: amountToPay,
      allocation: [
        {
          code: billing._id || billing.id || billing.billingID,
          description: `Payment for ${billing.billingID || billing._id}`,
          amount: amountToPay,
          discount: 0
        }
      ],
      notes: 'Smoke test payment'
    };

    console.log('Creating payment with payload:', payload);

    const created = await fetchJson(`${base}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Payment create response:', created);

    if (!created || !created.success) {
      console.error('Payment creation failed.');
      return process.exit(1);
    }

    const paymentId = created.data && (created.data._id || created.data.id);

    // Re-fetch billing
    console.log('Re-fetching billing to verify update...');
    const billingAfter = await fetchJson(`${base}/api/billings/${billing._id}`);
    console.log('Billing after payment:', billingAfter);

    // Check OR registry
    if (orNumber) {
      console.log('Searching OR registry for OR number:', orNumber);
      const searchRes = await fetchJson(`${base}/api/or-registry/batches/search?orNumber=${encodeURIComponent(orNumber)}`);
      console.log('OR search result:', searchRes);
    }

    console.log('Smoke test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Smoke test error:', error);
    process.exit(1);
  }
})();

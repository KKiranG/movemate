const targets = Array.from({ length: 10 }, (_, i) => ({ id: i, businessName: `Carrier ${i}` }));

async function mockFetch(url, options) {
  // Simulate 100ms network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: async () => ({})
      });
    }, 100);
  });
}

async function runSequential() {
  const start = performance.now();
  for (const carrier of targets) {
    const response = await mockFetch(`/api/admin/carriers/${carrier.id}/verify`);
    await response.json();
  }
  const end = performance.now();
  return end - start;
}

async function runConcurrent() {
  const start = performance.now();
  await Promise.all(
    targets.map(async (carrier) => {
      const response = await mockFetch(`/api/admin/carriers/${carrier.id}/verify`);
      await response.json();
    })
  );
  const end = performance.now();
  return end - start;
}

async function main() {
  const seqTime = await runSequential();
  console.log(`Sequential: ${seqTime.toFixed(2)}ms`);

  const concTime = await runConcurrent();
  console.log(`Concurrent: ${concTime.toFixed(2)}ms`);

  console.log(`Improvement: ${((seqTime - concTime) / seqTime * 100).toFixed(2)}% faster`);
}

main();

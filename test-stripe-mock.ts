import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import http from "node:http";

test("mock stripe", async (t) => {
    let called = false;
    const stripe = new Stripe("sk_test_123");

    t.mock.method(stripe.paymentIntents, "capture", async () => {
       called = true;
       throw new Stripe.errors.StripeCardError({
         message: "Declined",
         code: "card_declined",
         type: "card_error"
       } as any);
    });

    try {
        await stripe.paymentIntents.capture("pi_123");
    } catch(err: any) {
        assert.equal(err.code, "card_declined");
    }
    assert.equal(called, true);
});

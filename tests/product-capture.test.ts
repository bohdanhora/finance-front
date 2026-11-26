import assert from "node:assert/strict";
import test from "node:test";

import { buildBookmarklet, parseCapture, parseCapturedAmount } from "../lib/product-capture";

test("reads a captured product from the shop button", () => {
    assert.deepEqual(
        parseCapture(
            JSON.stringify({
                url: "https://rozetka.com.ua/ua/438521330/p438521330/",
                title: "  Касета   MicroSHIFT H100 ",
                image: "http://content1.rozetka.com.ua/goods/images/big/1.jpg",
                price: "1722",
                currency: "uah",
            }),
        ),
        {
            url: "https://rozetka.com.ua/ua/438521330/p438521330/",
            title: "Касета MicroSHIFT H100",
            image: "https://content1.rozetka.com.ua/goods/images/big/1.jpg",
            price: 1722,
            currency: "UAH",
        },
    );
});

test("drops a capture without a usable link and fields that are not safe", () => {
    assert.equal(parseCapture(null), null);
    assert.equal(parseCapture("not json"), null);
    assert.equal(parseCapture(JSON.stringify({ url: "javascript:alert(1)" })), null);
    assert.deepEqual(
        parseCapture(
            JSON.stringify({ url: "makeup.com.ua/ua/product/1/", image: "data:x", price: "", currency: "UAH" }),
        ),
        {
            url: "https://makeup.com.ua/ua/product/1/",
            title: undefined,
            image: undefined,
            price: undefined,
            currency: undefined,
        },
    );
});

test("reads amounts the way shops print them", () => {
    assert.equal(parseCapturedAmount("1 299,50 ₴"), 1299.5);
    assert.equal(parseCapturedAmount("1,299.00"), 1299);
    assert.equal(parseCapturedAmount(6486), 6486);
    assert.equal(parseCapturedAmount("0"), undefined);
});

test("points the bookmark at the app it was made in", () => {
    const code = buildBookmarklet("https://finance.example");
    assert.ok(code.startsWith("javascript:(function(){"));
    assert.ok(code.includes("\"https://finance.example\"+'/savings?capture='"));
});

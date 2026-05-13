# Cart API — Frontend Handoff

Base URL: `http://localhost:3000` (dev). Swagger: `/api`.

---

## Auth model

Two parallel auth schemes. Cart endpoints accept either (or neither — empty cart is returned).

| Scheme         | Header                        | Who it identifies |
| -------------- | ----------------------------- | ----------------- |
| `access-token` | `Authorization: Bearer <jwt>` | Logged-in user    |
| `cart-session` | `X-Cart-Session: <uuid>`      | Anonymous guest   |

If both headers are present, the JWT wins; `X-Cart-Session` is ignored on cart endpoints.

---

## Storage rules (frontend)

- **Guest session id**: store the value returned in the `sessionId` field of any cart response (or the `X-Cart-Session` response header) in `localStorage`. Send it on every cart call as `X-Cart-Session`.
- **JWT**: store as today. Once you have it, **stop sending `X-Cart-Session`** (except on the very next login/signup call — see merge flow).
- On logout: clear the JWT. Decide whether to also clear `X-Cart-Session` (typically yes — it represents an old anonymous session you no longer want).

---

## Cart endpoints

All return `CartDto` (same shape every time). All accept `X-Cart-Session` and/or `Authorization: Bearer`.

| Method   | Path                  | Body                      | Notes                                                                                                             |
| -------- | --------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/cart`               | —                         | Returns active cart. If none yet, returns an empty transient cart (`id: null`). Does **not** create one.          |
| `POST`   | `/cart/items`         | `{ productId, quantity }` | Adds to cart. If product already there, quantities **sum**. Creates the cart if needed. May mint a guest session. |
| `PATCH`  | `/cart/items/:itemId` | `{ quantity }`            | **Absolute** quantity (not delta). Min 1.                                                                         |
| `DELETE` | `/cart/items/:itemId` | —                         | Removes a single line.                                                                                            |
| `DELETE` | `/cart`               | —                         | Empties the cart (cart entity stays — same id/session keeps working).                                             |

`itemId` is a UUID — the `id` of an entry in `cart.items`, **not** `productId`.

---

## `CartDto` response shape

```ts
{
  id: string | null,            // null only on empty transient GET /cart
  userId: string | null,        // set for logged-in users
  sessionId: string | null,     // set for guests — store this in localStorage
  items: CartItem[],
  totalItems: number,           // sum of quantities
  subtotal: number,             // sum of lineTotals, rounded to 2dp
  currency: string | null,      // inferred from products, null when empty
  createdAt: string | null,
  updatedAt: string | null,
}

CartItem = {
  id: string,                   // line id — use for PATCH/DELETE
  productId: string,
  quantity: number,
  lineTotal: number,            // quantity * product.price
  product: ProductDto,          // full embedded product (live pricing)
}
```

---

## Call order — the only flow you need

### Guest first interaction

1. User clicks "Add to cart".
2. Send `POST /cart/items` with no `X-Cart-Session`, no `Authorization`. Body: `{ productId, quantity }`.
3. Read `sessionId` from the response body (also returned as `X-Cart-Session` response header). Store in localStorage.
4. From now on, every cart request must include `X-Cart-Session: <stored sessionId>`.

### Guest subsequent interactions

- Always send `X-Cart-Session`. The server treats it as the cart identity.

### Login or signup with a guest cart

1. Send `POST /auth/log-in` (or `/auth/sign-up`) **with the `X-Cart-Session` header still attached**.
2. Server-side: guest cart is merged into the user's cart inside a transaction. Duplicate products have quantities summed (capped at `product.stock`). The guest cart is deleted.
3. Save the returned `accessToken`. From this point on:
   - Send `Authorization: Bearer <jwt>` on cart calls.
   - **Stop sending `X-Cart-Session`.** Clear it from localStorage.
4. `GET /cart` to fetch the merged result.

### Logged-in user

- Send `Authorization: Bearer <jwt>` on every cart call. Nothing else needed.

---

## Errors

| Status | When                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `quantity` invalid (non-integer, < 1), OR resulting quantity exceeds `product.stock`. Message text is human-readable — surface it. |
| `404`  | `productId` doesn't exist (on add); `itemId` doesn't exist or doesn't belong to the active cart (on patch/delete).                 |
| `401`  | Only on `/auth/me`. Cart endpoints never return 401 — a bad/missing JWT just falls back to guest mode.                             |

The body for errors is the default Nest shape: `{ statusCode, message, error }`. `message` may be a string or array of strings (validation).

---

## Things to note

- **Stock check is at write time, not read time.** A product's stock may drop after it's in your cart; you'll only get a 400 when you next `PATCH` or re-`POST` it.
- **Prices are live.** `lineTotal` is recomputed from `product.price` on every read. Don't cache it.
- **One active cart per user / session.** Re-adding the same product merges into the existing line — there is never a duplicate `productId` in `items`.
- **`DELETE /cart` does not destroy the cart.** Same id/session keeps working — just no items. Use for "empty cart" buttons; you do not need a "start a new cart" flow.
- **The `X-Cart-Session` response header echoes the current sessionId on every cart response.** Safe to overwrite localStorage with it each time (it won't change for an existing session).
- **CORS:** server allows all origins with credentials. You do not need credentials for this flow — the session id is a header, not a cookie — but `Authorization` and `X-Cart-Session` must be allowed by your fetch client (they are by default).
- **Quantity 0 is rejected.** Use `DELETE /cart/items/:itemId` to remove. Don't model "decrement to zero" as a PATCH.
- **Empty transient cart:** `GET /cart` with no auth and no session header returns `{ id: null, items: [], ... }`. Treat it as "nothing here yet" — do not try to mutate it; the first `POST /cart/items` will create the real cart.
- **Currency mixing:** the API does not currently prevent adding products with different currencies. `cart.currency` reflects the first item's currency. If you only sell in one currency, ignore. If you sell in multiple, surface this at the product picker.

---

## Quick curl reference

```bash
# Guest add (no auth, no session yet)
curl -i -X POST http://localhost:3000/cart/items \
  -H 'Content-Type: application/json' \
  -d '{"productId":"<uuid>","quantity":1}'
# → response header: X-Cart-Session: <new-uuid>
# → body includes "sessionId": "<new-uuid>"

# Guest read
curl http://localhost:3000/cart \
  -H 'X-Cart-Session: <uuid>'

# Login with guest cart attached (merges)
curl -X POST http://localhost:3000/auth/log-in \
  -H 'Content-Type: application/json' \
  -H 'X-Cart-Session: <uuid>' \
  -d '{"email":"...","password":"..."}'

# Authenticated read
curl http://localhost:3000/cart \
  -H 'Authorization: Bearer <jwt>'
```

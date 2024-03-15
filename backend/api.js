const express = require("express");
const { json } = require("body-parser");
const { createPool } = require("mysql2/promise");
const { check, validationResult } = require("express-validator");
const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const jsonPatch = require("fast-json-patch");

const app = express();
const port = 3000;

const dbConfig = {
  host: "localhost",
  user: "API",
  password: "api123",
  database: "aji",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = createPool(dbConfig);

app.use(json());

const validateProduct = [
  check("nazwa").notEmpty().withMessage("Nazwa produktu nie może być pusta"),
  check("opis").notEmpty().withMessage("Opis produktu nie może być pusty"),
  check("cena_jednostkowa")
    .isFloat({ gt: 0 })
    .withMessage("Cena produktu musi być liczbą większą lub równą 0"),
  check("waga_jednostkowa")
    .isFloat({ gt: 0 })
    .withMessage("Waga produktu musi być liczbą większą lub równą 0"),
];

const validateOrderPost = [
  check("nazwa_uzytkownika")
    .notEmpty()
    .withMessage("Nazwa użytkownika nie może być pusta"),
  check("email").notEmpty().withMessage("Email użytkownika nie może być pusty"),
  check("numer_telefonu")
    .notEmpty()
    .withMessage("Numer telefonu użytkownika nie może być pusty"),
  check("email")
    .isEmail()
    .withMessage("Podany email użytkownika jest nieprawidłowy"),
  check("numer_telefonu")
    .isNumeric()
    .withMessage("Numer telefonu użytkownika musi zawierać tylko cyfry"),
];

const validateOrderPatch = [
  check("value.nazwa_uzytkownika")
    .optional()
    .notEmpty()
    .withMessage("Nazwa użytkownika nie może być pusta"),
  check("email")
    .optional()
    .notEmpty()
    .withMessage("Email użytkownika nie może być pusty"),
  check("numer_telefonu")
    .optional()
    .notEmpty()
    .withMessage("Numer telefonu użytkownika nie może być pusty"),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Podany email użytkownika jest nieprawidłowy"),
  check("numer_telefonu")
    .optional()
    .isNumeric()
    .withMessage("Numer telefonu użytkownika musi zawierać tylko cyfry"),
];
// API Produktu
app.get("/products", async (req, res) => {
  try {
    const [rows, fields] = await pool.execute(
      "SELECT P.*, K.nazwa as 'nazwa_kategorii' FROM produkt P JOIN kategoria K ON K.kategoria_id = P.kategoria_id"
    );
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania produktów",
      detail: error,
      instance: req.url,
    };
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.get("/products/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const [rows, fields] = await pool.execute(
      "SELECT P.*, K.nazwa as 'nazwa_kategorii' FROM produkt P JOIN kategoria K ON K.kategoria_id = P.kategoria_id WHERE produkt_id = ?",
      [productId]
    );
    if (rows.length > 0) {
      return res.json(rows);
    } else {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Nie znaleziono produktu",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania produktu",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.post("/products", validateProduct, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/bad-request",
      title: "Dane produktu są niepoprawne",
      detail: errors,
      instance: req.url,
    };

    return res.status(StatusCodes.BAD_REQUEST).json(rfc7807Error);
  }
  const newProduct = req.body;
  try {
    const [result] = await pool.query("INSERT INTO produkt SET ?", [
      newProduct,
    ]);
    return res.json({ productId: result.insertId });
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas dodawania produktu",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.put("/products/:id", validateProduct, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/bad-request",
      title: "Dane produktu są niepoprawne",
      detail: errors,
      instance: req.url,
    };

    return res.status(StatusCodes.BAD_REQUEST).json(rfc7807Error);
  }

  const productId = req.params.id;
  const updatedProduct = req.body;
  try {
    const [existingProducts] = await pool.query(
      "SELECT * FROM produkt WHERE produkt_id = ?",
      [productId]
    );
    if (existingProducts.length === 0) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Produkt o podanym identyfikatorze nie istnieje",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    await pool.query(`UPDATE produkt SET ? WHERE produkt_id = ?`, [
      updatedProduct,
      productId,
    ]);
    return res.json({ success: true });
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas edytowania produktu",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

// API Kategorii
app.get("/categories", async (req, res) => {
  try {
    const [rows, fields] = await pool.execute("SELECT * FROM kategoria");
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania kategorii",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

// API Zamówień
app.get("/orders", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM zamowienie");
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania zamówień",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.post("/orders", validateOrderPost, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/bad-request",
      title: "Dane zamówienia są niepoprawne",
      detail: errors,
      instance: req.url,
    };

    return res.status(StatusCodes.BAD_REQUEST).json(rfc7807Error);
  }
  const newOrder = req.body;

  try {
    const [result] = await pool.query("INSERT INTO zamowienie SET ?", [
      newOrder,
    ]);
    return res.json({ orderId: result.insertId });
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas dodawania zamówienia.",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.patch("/orders/:id",validateOrderPatch, async (req, res) => {
  const orderId = req.params.id;
  const jsonPatchOperations = req.body;

  try {
    const [existingOrder] = await pool.query(
      "SELECT * FROM Zamowienie WHERE zamowienie_id = ?",
      [orderId]
    );

    if (existingOrder.length === 0) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Zamowienie o podanym identyfikatorze nie istnieje",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    // SPRAWDZENIE CZY MOZNA ZMIENIC STAN ZAMOWIENIA
    if (
      jsonPatchOperations.some(
        (op) =>
          op.path === "/stan_zamowienia_id" &&
          op.value < existingOrder[0].stan_zamowienia_id
      )
    ) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/bad-request",
        title: "Nie można zmieniać stanu zamówienia 'wstecz'",
        instance: req.url,
      };

      return res.status(StatusCodes.BAD_REQUEST).json(rfc7807Error);
    }

    const [cancelledStatusId] = await pool.query(
      "SELECT * FROM stan_zamowienia WHERE nazwa = ?",
      ["ANULOWANE"]
    );

    // SPRAWDZENIE CZY ZAMOWIENIE JEST ANULOWANE
    if (
      existingOrder[0].stan_zamowienia_id ===
      cancelledStatusId[0].stan_zamowienia_id
    ) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Nie można zmieniać statusu anulowanego zamówienia",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    const [approvedStatus] = await pool.query(
      "SELECT * FROM stan_zamowienia WHERE nazwa = ?",
      ["ZATWIERDZONE"]
    );

    const patchedOrder = jsonPatch.applyPatch(
      existingOrder[0],
      jsonPatchOperations
    ).newDocument;

    // Sprawdź, czy zmieniany jest stan na "ZATWIERDZONE"
    if (
      jsonPatchOperations.some(
        (op) =>
          op.path === "/stan_zamowienia_id" &&
          op.value === approvedStatus[0].stan_zamowienia_id
      )
    ) {
      patchedOrder.data_zatwierdzenia = new Date();
    }

    await pool.query("UPDATE Zamowienie SET ? WHERE zamowienie_id = ?", [
      patchedOrder,
      orderId,
    ]);

    return res.json({ success: true });
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania produktów.",
      detail: error.message,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.get("/orders/status/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows, fields] = await pool.query(
      "SELECT * FROM zamowienie WHERE stan_zamowienia_id = ?",
      [id]
    );
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania zamówień po stanach zamówień",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});
app.get("/orders/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows, fields] = await pool.query(
      "SELECT * FROM zamowienie WHERE zamowienie_id = ?",
      [id]
    );
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania zamówienia",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});
app.get("/orders/:name", async (req, res) => {
  const name = req.params.name;
  try {
    const [rows, fields] = await pool.query(
      "SELECT * FROM zamowienie WHERE nazwa_uzytkownika = ?",
      [name]
    );
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania zamówień po nazwie",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

// API Stanów zamówienia
app.get("/status", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM stan_zamowienia");
    return res.json(rows);
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title: "Wystąpił błąd podczas pobierania stanów zamówień",
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

//API produktów w zamówieniu
app.get("/orders/:id/products", async (req, res) => {
  const orderId = req.params.id;

  try {
    const [rows, fields] = await pool.query(
      "SELECT P.*, K.nazwa as 'nazwa_kategorii', Z.ilosc FROM produkt_zamowienie Z JOIN produkt P ON Z.produkt_id = P.produkt_id JOIN kategoria K ON K.kategoria_id = P.kategoria_id WHERE Z.zamowienie_id = ?",
      [orderId]
    );

    if (rows.length > 0) {
      return res.json(rows);
    } else {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title:
          "Brak produktów dla danego zamówienia lub zamówienie nie istnieje",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title:
        "Wystąpił błąd podczas pobierania produktów dla zamówienia o ID " +
        orderId,
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

// Dodawanie produktów do zamówienia
app.post("/orders/:id/products", async (req, res) => {
  const orderId = req.params.id;
  const newProductOrder = req.body;

  try {
    const [existingOrder] = await pool.query(
      "SELECT * FROM zamowienie WHERE zamowienie_id = ?",
      [orderId]
    );

    if (existingOrder.length === 0) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Zamówienie o podanym ID nie istnieje",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    const [existingProduct] = await pool.query(
      "SELECT * FROM produkt WHERE produkt_id = ?",
      [newProductOrder.produkt_id]
    );

    if (existingProduct.length === 0) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Produkt o podanym ID nie istnieje",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    await pool.query("INSERT INTO produkt_zamowienie SET ?", [
      {
        zamowienie_id: orderId,
        produkt_id: newProductOrder.produkt_id,
        ilosc: newProductOrder.ilosc,
      },
    ]);

    return res.json({ success: true });
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title:
        "Wystąpił błąd podczas dodawania produktów dla zamówienia o ID " +
        orderId,
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

// Edycja ilości produktów w zamówieniu
app.put("/orders/:orderId/products/:productId", async (req, res) => {
  const orderId = req.params.orderId;
  const productId = req.params.productId;
  const quantity = req.body.ilosc;

  try {
    const [existingOrder] = await pool.query(
      "SELECT * FROM zamowienie WHERE zamowienie_id = ?",
      [orderId]
    );

    if (existingOrder.length === 0) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Zamówienie o podanym ID nie istnieje",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    const [existingProductInOrder] = await pool.query(
      "SELECT * FROM produkt_zamowienie WHERE zamowienie_id = ? AND produkt_id = ?",
      [orderId, productId]
    );

    if (existingProductInOrder.length === 0) {
      const rfc7807Error = {
        type: "https://example.com/docs/errors/not-found",
        title: "Produkt o podanym ID nie istnieje w zamówieniu",
        instance: req.url,
      };

      return res.status(StatusCodes.NOT_FOUND).json(rfc7807Error);
    }

    await pool.query(
      "UPDATE produkt_zamowienie SET ilosc = ? WHERE zamowienie_id = ? AND produkt_id = ?",
      [quantity, orderId, productId]
    );

    return res.json({ success: true });
  } catch (error) {
    const rfc7807Error = {
      type: "https://example.com/docs/errors/internal-server-error",
      title:
        "Wystąpił błąd podczas edytowania produktów w zamówieniu o ID " +
        orderId,
      detail: error,
      instance: req.url,
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(rfc7807Error);
  }
});

app.listen(port, () => {
  console.log(`Serwer API nasłuchuje na porcie ${port}`);
});

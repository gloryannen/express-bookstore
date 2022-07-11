process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let bookTest;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '1234',
        'https://test.net/',
        'Test',
        'English',
        100,
        'Test publisher',
        'The testing book', 1994)
      RETURNING isbn`);

  bookTest = result.rows[0].isbn;
});

describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "11223344",
      amazon_url: "https://1234.com",
      author: "Tester",
      language: "english",
      pages: 999,
      publisher: "Testers1234",
      title: "Another test hit",
      year: 2020,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Checks for invalid isbn", async function () {
    const response = await request(app).post(`/books`).send({ year: 2000 });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /books", function () {
  test("Gets 1 book", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});

describe("GET /books/:isbn", function () {
  test("Gets a specific book", async function () {
    const response = await request(app).get(`/books/${bookTest}`);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(bookTest);
  });

  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app).get(`/books/99999`);
    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /books/:isbn", function () {
  test("Updates a book", async function () {
    const response = await request(app).put(`/books/${bookTest}`).send({
      author: "Tester",
      language: "english",
      pages: 1000,
      title: "Another test hit V2",
      year: 2020,
    });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("Another test hit V2");
  });

  test("Checks for invalid update", async function () {
    const response = await request(app).put(`/books/${bookTest}`).send({
      badTestField: 1010,
      isbn: "11223344",
      author: "Tester",
      language: "english",
      pages: 999,
      title: "Another test hit V2",
      year: 2000,
    });
    expect(response.statusCode).toBe(400);
  });

  test("404 if can't find book", async function () {
    await request(app).delete(`/books/${bookTest}`);
    const response = await request(app).delete(`/books/${bookTest}`);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:id", function () {
  test("Deletes a book", async function () {
    const response = await request(app).delete(`/books/${bookTest}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});

import request from "supertest";

import {app} from "../../src/index";

describe("Basic server running and answering ping", () => {
  test("Testing the ping", async () => {
    const res = await request(app).get("/ping");
    expect(res.body).toEqual({ message: "hello from Una" });
  });
});


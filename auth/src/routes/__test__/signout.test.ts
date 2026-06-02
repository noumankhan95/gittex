import request from "supertest";
import { app } from "../../app";

describe("signout route", () => {
    it("clears cookie on signout", async () => {
        const cookie = await global.signin()
        const response = await request(app).post("/api/users/signout").set("Cookie", cookie).send({}).expect(200)
        expect(response.get("Set-Cookie")).toBeDefined()
        expect(response.get('Set-Cookie')![0]).toContain('session=;');
    })
})
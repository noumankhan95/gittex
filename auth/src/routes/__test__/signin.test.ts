import request from "supertest"
import { app } from "../../app"

describe("Sign in Route", () => {
    it("fails with 400 if user hasnt signed up", async () => {
        await request(app).post("/api/users/signin").send({ email: "test@test.com", password: "password" }).expect(400)
    })
    it("fails with 400 if passwords do not match", async () => {
        await request(app).post("/api/users/signup").send({ email: "test@test.com", password: "password" }).expect(201)
        await request(app).post("/api/users/signin").send({ email: "test@test.com", password: "passwordtwo" }).expect(400)
    })
    it("fails with 400 if no email ", async () => {

        await request(app).post("/api/users/signin").send({ password: "passwordtwo" }).expect(400)
    })
    it("fails with 400 if no password ", async () => {
        await request(app).post("/api/users/signin").send({ email: "test@test.com" }).expect(400)
    })
    it("sets session cookie", async () => {
        await request(app).post("/api/users/signup").send({ email: "test@test.com", password: "password" }).expect(201)
        const response = await request(app).post("/api/users/signin").send({ email: "test@test.com", password: "password" }).expect(200)
        expect(response.get("Set-Cookie")).toBeDefined()
    })
    it("succeeds if all good", async () => {
        await request(app).post("/api/users/signup").send({ email: "test@test.com", password: "password" }).expect(201)
        await request(app).post("/api/users/signin").send({ email: "test@test.com", password: "password" }).expect(200)
    })
})
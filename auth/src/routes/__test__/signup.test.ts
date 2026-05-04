import request from "supertest"
import { app } from "../../app"
it("returns a 201 on successfull signup", async () => {
    const response = await request(app)
        .post("/api/users/signup")
        .send({
            email: "test@test.com",
            password: "password"
        });

    console.log(response.status, response.body);

    expect(response.status).toBe(201);
})

it("returns a 400 on invalid email", async () => {
    return (request(app).post("/api/users/signup")).send({
        email: "asdad",
        password: "password"
    }).expect(400)
})

it("disallows duplicate emails", async () => {
    await request(app).post("/api/users/signup").send({ email: "email@email.com", password: "password" }).expect(201)
    await request(app).post("/api/users/signup").send({ email: "email@email.com", password: "password" }).expect(400)
})

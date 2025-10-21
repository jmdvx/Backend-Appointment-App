
import request from 'supertest';
import { app } from '../../src/index';






describe('GET /api/v1/users', () => {
    it('should return 200 OK and the body should be an array', async () => {
        const res = await request(app).get('/api/v1/users');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('email');
        }
    }
    );
});





describe('User API', () => {
    let userId: string;

    test('should create a user and return Location header', async () => {
        const newUser = {
            "name": "Una",
            "phonenumber": "0871234567",
            "email": "john.doe@mymail.ie",
            "dob": "2001/01/12",
            "silly": "this is not just silly but dangerous"
        };

        const res = await request(app)
            .post('/api/v1/users')
            .send(newUser)
            .expect(201);

        const location = res.header['location'];
        // expect(location).toMatch(/\/api\/v1\/users\/\w+/);

        // Extract user ID from the location header
        userId = location;
        expect(userId).toBeDefined();
    });

    test('should retrieve the created user by ID', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userId}`)
            .expect(200);

    });


    test('should delete the created user by ID', async () => {
        const res = await request(app)
            .delete(`/api/v1/users/${userId}`)
            .expect(202);
    });

    test('should fail to find the deleted user by ID', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userId}`)
            .expect(404);

    });


});




describe('GET /api/v1/users/fdsfd', () => {
    it('should return 404 not found', async () => {
        const res = await request(app).get('/api/v1/users/fdsf');
        expect(res.status).toBe(404);
    });
});


